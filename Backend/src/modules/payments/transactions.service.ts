import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { uploadsPath } from '../../common/uploads';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { ExpertProfile } from '../community/community.entities';
import { ALLOWED_FILES, MAX_ATTACHMENT_SIZE } from '../community/posts.service';
import { RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { FinancialService } from './financial.service';
import { PAYMENT_GATEWAY, PaymentGateway } from './gateway/payment-gateway';
import { Actor, PaymentsCore } from './payments.core';
import {
  AcceptTransactionDto,
  CreateTransactionDto,
  DeclareCompletionDto,
  SettlementDto,
} from './payments.dto';
import { CompletionDeclaration, PayoutAccount, ServiceAttachment, ServiceRefund, ServiceTransaction } from './payments.entities';
import { PaymentsNotifier, toParty } from './payments.notifier';
import { commissionRateBps, formatMoney, parsePartialAmount, protectionPeriodMs, toMinor } from './payments.policy';
import { PaymentsViews, partyRole, settlementOpen } from './payments.views';

export const PAYMENT_FILES_DIR = uploadsPath('payments');

/** Date d'échéance lisible dans les notifications (l'interface l'affiche dans le fuseau de chaque utilisateur). */
export function formatDeadline(date: Date) {
  return `${date.toLocaleString('fr-FR', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' })} (UTC)`;
}

function newReference() {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  return `QP-${ymd}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/** Actions du client et du prestataire sur une transaction de prestation. */
@Injectable()
export class TransactionsService {
  private readonly publicUrl: string;

  constructor(
    private readonly core: PaymentsCore,
    private readonly financial: FinancialService,
    private readonly views: PaymentsViews,
    private readonly notifier: PaymentsNotifier,
    private readonly usersService: UsersService,
    private readonly rateLimiter: RateLimiter,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    @InjectRepository(ServiceTransaction) private readonly transactions: Repository<ServiceTransaction>,
    @InjectRepository(ServiceAttachment) private readonly attachments: Repository<ServiceAttachment>,
    @InjectRepository(PayoutAccount) private readonly accounts: Repository<PayoutAccount>,
    @InjectRepository(ExpertProfile) private readonly experts: Repository<ExpertProfile>,
    @InjectRepository(User) private readonly users: Repository<User>,
    config: ConfigService,
  ) {
    this.publicUrl = config.get<string>('PUBLIC_URL', 'http://localhost:3000').replace(/\/$/, '');
  }

  private actor(user: User, role: 'client' | 'provider'): Actor {
    return { id: user.id, role, name: user.fullName };
  }

  private requireRole(tx: ServiceTransaction, user: User, expected: 'client' | 'provider') {
    const role = partyRole(tx, user);
    if (role !== expected) {
      throw new ForbiddenException(expected === 'client' ? 'Action réservée au client de la transaction.' : 'Action réservée au prestataire de la transaction.');
    }
  }

  private requireParty(tx: ServiceTransaction, user: User): 'client' | 'provider' {
    const role = partyRole(tx, user);
    if (!role) throw new ForbiddenException("Vous n'êtes pas partie à cette transaction.");
    return role;
  }

  private dashboardUrl(tx: ServiceTransaction, extra = '') {
    return `${this.publicUrl}/?tab=dashboard&dv=${encodeURIComponent(`prestations/${tx.id}`)}${extra}`;
  }

  // --- Éligibilité du prestataire -----------------------------------------------------------------

  async providerEligibility(handle: string) {
    const provider = await this.users.findOne({ where: { handle } });
    if (!provider) throw new NotFoundException('Membre introuvable.');
    const expert = await this.experts.findOne({ where: { userId: provider.id } });
    return {
      eligible: !!expert && provider.status === 'active',
      verified: expert?.verificationStatus === 'verified',
      paymentsEnabled: this.gateway.available,
      reason: !expert
        ? "Ce membre n'est pas référencé comme prestataire (profil professionnel absent)."
        : provider.status !== 'active'
          ? 'Ce compte est momentanément suspendu.'
          : null,
    };
  }

  // --- Demande, acceptation, paiement --------------------------------------------------------------

  async create(client: User, dto: CreateTransactionDto) {
    await this.usersService.assertActive(client);
    this.rateLimiter.hit(`payments:create:${client.id}`, 10, 60 * 60_000, 'Trop de demandes envoyées. Réessayez dans une heure.');
    const provider = await this.users.findOne({ where: { handle: dto.providerHandle.replace(/^@/, '') } });
    if (!provider) throw new NotFoundException('Prestataire introuvable.');
    if (provider.id === client.id) throw new BadRequestException('Vous ne pouvez pas vous commander une prestation à vous-même.');
    if (provider.status !== 'active') throw new BadRequestException('Ce prestataire ne peut pas recevoir de demande pour le moment.');
    if (!(await this.experts.exist({ where: { userId: provider.id } }))) {
      throw new BadRequestException("Ce membre n'est pas référencé comme prestataire sur QIAO.");
    }
    const amount = toMinor(dto.amount, dto.currency);
    if (dto.expectedDeliveryDate && dto.expectedDeliveryDate.slice(0, 10) < new Date().toISOString().slice(0, 10)) {
      throw new BadRequestException('La date de livraison souhaitée est déjà passée.');
    }

    const tx = await this.core.dataSource.transaction(async (m) => {
      const created = await m.save(
        m.create(ServiceTransaction, {
          reference: newReference(),
          clientId: client.id,
          providerId: provider.id,
          title: dto.title.trim(),
          description: dto.description.trim(),
          expectedDeliveryDate: dto.expectedDeliveryDate?.slice(0, 10) ?? null,
          currency: dto.currency,
          requestedAmount: amount,
          amount,
          status: 'REQUESTED',
          serviceStatus: 'requested',
        }),
      );
      await this.core.log(m, created, this.actor(client, 'client'), 'requested', {
        to: 'REQUESTED',
        message: `Demande de prestation envoyée (${formatMoney(amount, dto.currency)}).`,
      });
      return created;
    });

    await this.notifier.parties(tx, {
      provider: {
        title: 'Nouvelle demande de prestation',
        body: `${client.fullName} vous demande « ${tx.title} » pour ${formatMoney(amount, tx.currency)}. Acceptez ou refusez la demande depuis votre espace.`,
        email: true,
      },
    });
    return this.views.forParty(tx.id, client);
  }

  async accept(provider: User, id: string, dto: AcceptTransactionDto) {
    await this.usersService.assertActive(provider);
    const tx = await this.core.withLock(id, async (tx, m) => {
      this.requireRole(tx, provider, 'provider');
      if (tx.status !== 'REQUESTED') throw new ConflictException('Cette demande a déjà été traitée.');
      if (dto.amount) tx.amount = toMinor(dto.amount, tx.currency);
      tx.providerTerms = dto.terms?.trim() || null;
      tx.commissionRateBps = commissionRateBps();
      tx.acceptedAt = new Date();
      tx.serviceStatus = 'accepted';
      await this.core.transition(m, tx, 'PAYMENT_PENDING', this.actor(provider, 'provider'), 'accepted', `Demande acceptée pour ${formatMoney(tx.amount, tx.currency)}.`, {
        amount: tx.amount,
        commissionRateBps: tx.commissionRateBps,
      });
      return tx;
    });
    const changed = tx.amount !== tx.requestedAmount;
    await this.notifier.parties(tx, {
      client: {
        title: 'Demande acceptée — paiement sécurisé',
        body: `${provider.fullName} a accepté « ${tx.title} »${changed ? ` au prix de ${formatMoney(tx.amount, tx.currency)} (au lieu de ${formatMoney(tx.requestedAmount, tx.currency)})` : ''}. Réglez la prestation via QIAO : les fonds resteront retenus jusqu'à la fin de la période de protection.`,
        email: true,
      },
    });
    return this.views.forParty(id, provider);
  }

  async decline(provider: User, id: string, reason?: string) {
    const tx = await this.core.withLock(id, async (tx, m) => {
      this.requireRole(tx, provider, 'provider');
      if (tx.status !== 'REQUESTED') throw new ConflictException('Cette demande a déjà été traitée.');
      tx.serviceStatus = 'declined';
      tx.cancelledAt = new Date();
      tx.cancellationReason = reason?.trim() || 'Demande refusée par le prestataire.';
      await this.core.transition(m, tx, 'CANCELLED', this.actor(provider, 'provider'), 'declined', tx.cancellationReason);
      return tx;
    });
    await this.notifier.parties(tx, {
      client: { title: 'Demande de prestation refusée', body: `${provider.fullName} a décliné « ${tx.title} ». ${reason ? `Motif : ${reason}` : ''}`.trim() },
    });
    return this.views.forParty(id, provider);
  }

  /** Crée (ou réutilise) la session de paiement : un seul paiement possible par tentative, jamais deux débits. */
  async checkout(client: User, id: string) {
    await this.usersService.assertActive(client);
    this.rateLimiter.hit(`payments:checkout:${client.id}`, 20, 60 * 60_000);
    const url = await this.core.withLock(id, async (tx, m) => {
      this.requireRole(tx, client, 'client');
      if (tx.status !== 'PAYMENT_PENDING' && tx.status !== 'PAYMENT_FAILED') {
        throw new ConflictException(tx.paidAt ? 'Cette prestation est déjà payée.' : "Cette transaction n'est pas en attente de paiement.");
      }
      const retry = tx.status === 'PAYMENT_FAILED' || !tx.checkoutRef;
      if (retry && tx.checkoutRef) await this.gateway.expireCheckout(tx.checkoutRef);
      if (retry) tx.checkoutAttempts += 1;
      const session = await this.gateway.createCheckout({
        transactionId: tx.id,
        reference: tx.reference,
        description: `${tx.title} — prestataire : ${(await this.users.findOne({ where: { id: tx.providerId } }))?.fullName ?? ''}`,
        amount: tx.amount,
        currency: tx.currency,
        returnUrl: this.dashboardUrl(tx, '&payment=return'),
        idempotencyKey: `checkout:${tx.id}:${tx.checkoutAttempts}`,
      });
      const changed = tx.checkoutRef !== session.ref;
      tx.checkoutRef = session.ref;
      tx.paymentProvider = this.gateway.name;
      if (tx.status === 'PAYMENT_FAILED') {
        await this.core.transition(m, tx, 'PAYMENT_PENDING', this.actor(client, 'client'), 'checkout_retry', 'Nouvelle tentative de paiement.', { attempt: tx.checkoutAttempts });
      } else {
        await m.save(ServiceTransaction, tx);
        if (changed) await this.core.log(m, tx, this.actor(client, 'client'), 'checkout_created', { message: 'Session de paiement ouverte.', details: { attempt: tx.checkoutAttempts } });
      }
      return session.url;
    });
    return { url };
  }

  // --- Exécution de la prestation ------------------------------------------------------------------

  async start(provider: User, id: string) {
    const tx = await this.core.withLock(id, async (tx, m) => {
      this.requireRole(tx, provider, 'provider');
      if (tx.status !== 'PAID_HELD') throw new ConflictException('La prestation ne peut pas être démarrée à ce stade.');
      tx.startedAt = new Date();
      tx.serviceStatus = 'in_progress';
      await this.core.transition(m, tx, 'IN_PROGRESS', this.actor(provider, 'provider'), 'started', 'Prestation démarrée par le prestataire.');
      return tx;
    });
    await this.notifier.parties(tx, { client: { title: 'Prestation démarrée', body: `${provider.fullName} a démarré « ${tx.title} ».` } });
    return this.views.forParty(id, provider);
  }

  /**
   * BR-03 / BR-04 : déclaration « prestation terminée ». L'horodatage est celui du serveur ; la déclaration est unique
   * (contrainte en base), ce qui empêche toute manipulation de l'échéance par des envois répétés.
   */
  async declareCompletion(provider: User, id: string, dto: DeclareCompletionDto, ip: string | null) {
    await this.usersService.assertActive(provider);
    const tx = await this.core.withLock(id, async (tx, m) => {
      this.requireRole(tx, provider, 'provider');
      if (tx.completionDeclaredAt || (await m.exists(CompletionDeclaration, { where: { transactionId: tx.id } }))) {
        throw new ConflictException("La fin de prestation a déjà été déclarée : l'échéance de protection ne peut pas être modifiée.");
      }
      if (tx.status !== 'PAID_HELD' && tx.status !== 'IN_PROGRESS') {
        throw new ConflictException("La fin de prestation ne peut être déclarée qu'après le paiement et avant tout litige.");
      }
      const attachmentIds = await this.claimAttachments(m, provider, dto.attachmentIds ?? [], tx.id);
      const now = new Date();
      const deadline = new Date(now.getTime() + protectionPeriodMs());
      await m.insert(CompletionDeclaration, {
        transactionId: tx.id,
        providerId: provider.id,
        details: dto.details.trim(),
        attachmentIds,
        declaredAt: now,
        ip: ip?.slice(0, 60) ?? null,
      });
      tx.completionDeclaredAt = now;
      tx.protectionPeriodStartedAt = now;
      tx.protectionDeadlineAt = deadline;
      tx.serviceStatus = 'delivered';
      if (!tx.startedAt) tx.startedAt = now;
      const actor = this.actor(provider, 'provider');
      await this.core.transition(m, tx, 'COMPLETION_DECLARED', actor, 'completion_declared', 'Prestation déclarée terminée par le prestataire.', {
        attachments: attachmentIds.length,
      });
      await this.core.transition(m, tx, 'PROTECTION_PERIOD', { id: null, role: 'system' }, 'protection_period_started', `Période de protection ouverte jusqu'au ${formatDeadline(deadline)}.`, {
        protectionDeadlineAt: deadline.toISOString(),
      });
      return tx;
    });
    const deadline = formatDeadline(tx.protectionDeadlineAt!);
    await this.notifier.parties(tx, {
      client: {
        title: 'Prestation déclarée terminée — période de protection ouverte',
        body: `${provider.fullName} a déclaré « ${tx.title} » terminée. Vous disposez de 5 jours, jusqu'au ${deadline}, pour vérifier la prestation : confirmez-la ou contestez-la. Sans contestation à l'échéance, le paiement sera versé au prestataire.`,
        email: true,
      },
      provider: {
        title: 'Déclaration enregistrée',
        body: `Votre déclaration pour « ${tx.title} » est enregistrée. Sans contestation du client avant le ${deadline}, le versement sera initié.`,
      },
    });
    return this.views.forParty(id, provider);
  }

  /** BR-05 : la confirmation du client est enregistrée mais ne raccourcit pas la période de protection. */
  async confirm(client: User, id: string) {
    const tx = await this.core.withLock(id, async (tx, m) => {
      this.requireRole(tx, client, 'client');
      if (tx.status !== 'PROTECTION_PERIOD' || !tx.protectionDeadlineAt || tx.protectionDeadlineAt.getTime() <= Date.now()) {
        throw new ConflictException('La prestation ne peut pas être confirmée à ce stade.');
      }
      if (tx.clientConfirmationAt) return null;
      tx.clientConfirmationAt = new Date();
      tx.serviceStatus = 'confirmed';
      await m.save(ServiceTransaction, tx);
      await this.core.log(m, tx, this.actor(client, 'client'), 'client_confirmed', {
        message: "Prestation confirmée par le client (la période de protection continue jusqu'à son échéance).",
      });
      return tx;
    });
    if (tx) {
      await this.notifier.parties(tx, {
        provider: {
          title: 'Prestation confirmée par le client',
          body: `${client.fullName} a confirmé « ${tx.title} ». Le versement interviendra à l'échéance de la période de protection (${formatDeadline(tx.protectionDeadlineAt!)}).`,
        },
      });
    }
    return this.views.forParty(id, client);
  }

  // --- Annulation (§7) ---------------------------------------------------------------------------

  async cancel(user: User, id: string, reason?: string) {
    let refundId: string | null = null;
    const tx = await this.core.withLock(id, async (tx, m) => {
      const role = this.requireParty(tx, user);
      const actor = this.actor(user, role);
      const text = reason?.trim() || (role === 'client' ? 'Annulée par le client.' : 'Annulée par le prestataire.');

      if (tx.status === 'REQUESTED' || tx.status === 'PAYMENT_PENDING' || tx.status === 'PAYMENT_FAILED') {
        if (tx.checkoutRef) await this.gateway.expireCheckout(tx.checkoutRef);
        tx.serviceStatus = 'cancelled';
        tx.cancelledAt = new Date();
        tx.cancellationReason = text;
        await this.core.transition(m, tx, 'CANCELLED', actor, 'cancelled', `${text} Aucun paiement n'a été encaissé.`);
        return tx;
      }

      // Après paiement : remboursement intégral si la prestation n'a pas démarré (ou si le prestataire se retire).
      const allowed = tx.status === 'PAID_HELD' || (tx.status === 'IN_PROGRESS' && role === 'provider');
      if (!allowed) {
        throw new ConflictException(
          tx.status === 'IN_PROGRESS'
            ? "La prestation a démarré : proposez un accord amiable au prestataire ou contestez la prestation."
            : 'La transaction ne peut plus être annulée à ce stade.',
        );
      }
      const refund = await m.save(
        m.create(ServiceRefund, {
          transactionId: tx.id,
          source: role === 'client' ? 'client_cancellation' : 'provider_cancellation',
          amount: tx.amount - tx.refundedAmount,
          currency: tx.currency,
          status: 'approved',
          approvedById: user.id,
          approvedByName: user.fullName,
          approvedAt: new Date(),
        }),
      );
      refundId = refund.id;
      tx.cancelledAt = new Date();
      tx.cancellationReason = text;
      tx.settlementProposal = null;
      await this.core.transition(m, tx, 'REFUND_APPROVED', actor, 'cancelled_with_refund', `${text} Remboursement intégral approuvé selon la politique d'annulation.`, {
        refundId: refund.id,
      });
      await this.core.ledger(m, tx, 'REFUND_APPROVED', {
        amount: refund.amount,
        status: 'recorded',
        idempotencyKey: `refund_approved:${refund.id}`,
        decisionRef: refund.source,
        actorId: user.id,
      });
      return tx;
    });

    const other = partyRole(tx, user) === 'client' ? 'provider' : 'client';
    await this.notifier.parties(
      tx,
      toParty(other, {
        title: refundId ? 'Transaction annulée — remboursement en cours' : 'Transaction annulée',
        body: `${user.fullName} a annulé « ${tx.title} ».${refundId ? ` Le client sera intégralement remboursé (${formatMoney(tx.amount, tx.currency)}).` : ''}`,
        email: !!refundId,
      }),
    );
    if (refundId) await this.financial.submitRefund(refundId);
    return this.views.forParty(id, user);
  }

  // --- Accord amiable : annulation ou remboursement partiel convenu entre les parties -------------------

  async proposeSettlement(user: User, id: string, dto: SettlementDto) {
    const tx = await this.core.withLock(id, async (tx, m) => {
      const role = this.requireParty(tx, user);
      if (!settlementOpen(tx)) throw new ConflictException("Un accord amiable n'est plus possible à ce stade.");
      if (tx.settlementProposal) throw new ConflictException('Une proposition est déjà en attente de réponse.');
      const amount = parsePartialAmount(dto.refundAmount, tx.currency, tx.amount - tx.refundedAmount);
      tx.settlementProposal = { proposedBy: role, proposedById: user.id, refundAmount: amount, note: dto.note?.trim() || null, proposedAt: new Date().toISOString() };
      await m.save(ServiceTransaction, tx);
      await this.core.log(m, tx, this.actor(user, role), 'settlement_proposed', {
        message: `Accord amiable proposé : remboursement de ${formatMoney(amount, tx.currency)} au client.`,
        details: { refundAmount: amount },
      });
      return tx;
    });
    const proposal = tx.settlementProposal!;
    await this.notifier.parties(
      tx,
      toParty(proposal.proposedBy === 'client' ? 'provider' : 'client', {
        title: "Proposition d'accord amiable",
        body: `${user.fullName} propose de clore « ${tx.title} » avec un remboursement de ${formatMoney(proposal.refundAmount, tx.currency)} au client${proposal.note ? ` : « ${proposal.note} »` : ''}. Acceptez ou refusez depuis votre espace.`,
        email: true,
      }),
    );
    return this.views.forParty(id, user);
  }

  async respondSettlement(user: User, id: string, accept: boolean) {
    let refundId: string | null = null;
    const result = await this.core.withLock(id, async (tx, m) => {
      const role = this.requireParty(tx, user);
      const proposal = tx.settlementProposal;
      if (!proposal) throw new ConflictException("Aucune proposition d'accord en attente.");
      if (proposal.proposedBy === role) throw new ForbiddenException("Seule l'autre partie peut répondre à cette proposition.");
      tx.settlementProposal = null;
      if (!accept || !settlementOpen(tx)) {
        await m.save(ServiceTransaction, tx);
        await this.core.log(m, tx, this.actor(user, role), 'settlement_declined', { message: 'Proposition d’accord amiable refusée.' });
        return { tx, proposal, accepted: false };
      }
      const refund = await m.save(
        m.create(ServiceRefund, {
          transactionId: tx.id,
          source: 'mutual_agreement',
          amount: proposal.refundAmount,
          currency: tx.currency,
          status: 'approved',
          approvedById: user.id,
          approvedByName: user.fullName,
          approvedAt: new Date(),
        }),
      );
      refundId = refund.id;
      await this.core.transition(
        m,
        tx,
        'REFUND_APPROVED',
        this.actor(user, role),
        'settlement_accepted',
        `Accord amiable accepté par les deux parties : remboursement de ${formatMoney(refund.amount, tx.currency)} au client.`,
        { refundId: refund.id, proposedById: proposal.proposedById, acceptedById: user.id },
      );
      await this.core.ledger(m, tx, 'REFUND_APPROVED', {
        amount: refund.amount,
        status: 'recorded',
        idempotencyKey: `refund_approved:${refund.id}`,
        decisionRef: 'mutual_agreement',
        actorId: user.id,
      });
      return { tx, proposal, accepted: true };
    });

    const { tx, proposal, accepted } = result;
    await this.notifier.parties(
      tx,
      toParty(proposal.proposedBy, {
        title: accepted ? 'Accord amiable accepté' : 'Accord amiable refusé',
        body: accepted
          ? `${user.fullName} a accepté votre proposition pour « ${tx.title} » : remboursement de ${formatMoney(proposal.refundAmount, tx.currency)} au client, solde versé au prestataire selon les conditions de libération.`
          : `${user.fullName} a refusé votre proposition d'accord pour « ${tx.title} ».`,
      }),
    );
    if (refundId) await this.financial.submitRefund(refundId);
    return this.views.forParty(id, user);
  }

  async withdrawSettlement(user: User, id: string) {
    await this.core.withLock(id, async (tx, m) => {
      const role = this.requireParty(tx, user);
      if (!tx.settlementProposal || tx.settlementProposal.proposedBy !== role) throw new ConflictException('Aucune proposition à retirer.');
      tx.settlementProposal = null;
      await m.save(ServiceTransaction, tx);
      await this.core.log(m, tx, this.actor(user, role), 'settlement_withdrawn', { message: "Proposition d'accord amiable retirée." });
    });
    return this.views.forParty(id, user);
  }

  // --- Compte de versement du prestataire --------------------------------------------------------

  async payoutAccount(user: User) {
    const account = await this.accounts.findOne({ where: { userId: user.id } });
    return { account: account ? { status: account.status, provider: account.provider } : null, paymentsEnabled: this.gateway.available, provider: this.gateway.name };
  }

  /** Lien d'ouverture / de vérification du compte chez le prestataire de paiement (QIAO ne collecte aucune donnée bancaire). */
  async payoutAccountLink(user: User) {
    await this.usersService.assertActive(user);
    if (!(await this.experts.exist({ where: { userId: user.id } }))) {
      throw new BadRequestException('Créez votre profil professionnel Community pour recevoir des paiements.');
    }
    const existing = await this.accounts.findOne({ where: { userId: user.id } });
    // Compte ouvert chez un autre prestataire de paiement (changement de prestataire) : un nouveau compte est ouvert.
    const current = existing?.provider === this.gateway.name ? existing : null;
    const link = await this.gateway.createAccountLink({
      userId: user.id,
      accountRef: current?.accountRef ?? null,
      returnUrl: `${this.publicUrl}/?tab=dashboard&dv=${encodeURIComponent('prestations')}&payout=return`,
      email: user.email,
      displayName: user.company || user.fullName,
    });
    if (!current) {
      await this.accounts.save(
        this.accounts.create({ ...existing, userId: user.id, provider: this.gateway.name, accountRef: link.accountRef, status: 'pending', label: null }),
      );
    }
    return { url: link.url };
  }

  // --- Pièces justificatives ---------------------------------------------------------------------

  async upload(user: User, file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    this.rateLimiter.hit(`payments:upload:${user.id}`, 40, 60 * 60_000);
    const rule = ALLOWED_FILES[file.mimetype];
    const ext = extname(file.originalname).toLowerCase();
    if (!rule || !rule.ext.includes(ext)) {
      throw new BadRequestException('Format non accepté : images JPG, PNG, WEBP, GIF ou documents PDF, DOCX, XLSX.');
    }
    if (file.size > MAX_ATTACHMENT_SIZE) throw new BadRequestException('Fichier trop volumineux (5 Mo maximum).');
    if (rule.magic && !rule.magic.some((sig) => sig.every((byte, i) => file.buffer[i] === byte))) {
      throw new BadRequestException('Le contenu du fichier ne correspond pas à son format.');
    }
    await fs.mkdir(PAYMENT_FILES_DIR, { recursive: true });
    const storageName = `${randomUUID()}${ext}`;
    await fs.writeFile(join(PAYMENT_FILES_DIR, storageName), file.buffer);
    const saved = await this.attachments.save(
      this.attachments.create({ ownerId: user.id, originalName: file.originalname.slice(0, 200), storagePath: storageName, mime: file.mimetype, size: file.size }),
    );
    return { id: saved.id, name: saved.originalName, mime: saved.mime, size: saved.size };
  }

  /** Rattache à la transaction des fichiers envoyés par l'auteur (et non encore utilisés ailleurs). */
  async claimAttachments(m: EntityManager, user: User, ids: string[], transactionId: string): Promise<string[]> {
    const unique = [...new Set(ids)];
    if (!unique.length) return [];
    const rows = await m.find(ServiceAttachment, {
      where: [
        { id: In(unique), ownerId: user.id, transactionId: IsNull() },
        { id: In(unique), ownerId: user.id, transactionId },
      ],
    });
    if (rows.length !== unique.length) throw new BadRequestException('Pièce jointe invalide ou déjà utilisée.');
    await m.update(ServiceAttachment, { id: In(unique) }, { transactionId });
    return unique;
  }

  async attachmentFile(user: User, id: string) {
    const attachment = await this.attachments.findOne({ where: { id } });
    if (!attachment) throw new NotFoundException('Fichier introuvable.');
    if (attachment.transactionId) {
      const tx = await this.transactions.findOne({ where: { id: attachment.transactionId }, select: { id: true, clientId: true, providerId: true } });
      if (!tx || (!partyRole(tx, user) && user.role !== 'admin')) throw new ForbiddenException('Accès refusé.');
    } else if (attachment.ownerId !== user.id) {
      throw new ForbiddenException('Accès refusé.');
    }
    return { path: join(PAYMENT_FILES_DIR, attachment.storagePath), mime: attachment.mime, name: attachment.originalName };
  }
}
