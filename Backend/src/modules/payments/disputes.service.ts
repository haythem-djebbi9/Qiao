import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { AuditService, RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { FinancialService } from './financial.service';
import { Actor, DISPUTE_OPEN_STATES, PaymentsCore } from './payments.core';
import { DisputeDecisionDto, DisputeEntryDto, OpenDisputeDto, RequestEvidenceDto } from './payments.dto';
import { DisputeEntry, ServiceDispute, ServicePayout, ServiceRefund, ServiceTransaction } from './payments.entities';
import { PaymentsNotifier, toParty } from './payments.notifier';
import { DISPUTE_REASONS, EXPECTED_RESOLUTIONS, formatMoney, parsePartialAmount } from './payments.policy';
import { PaymentsViews, deadlinePassed, partyRole } from './payments.views';
import { TransactionsService, formatDeadline } from './transactions.service';

const DISPUTABLE_STATES = ['PAID_HELD', 'IN_PROGRESS', 'PROTECTION_PERIOD'];

const OUTCOME_LABELS = {
  full_refund: 'remboursement intégral du client',
  partial_refund: 'remboursement partiel du client et versement du solde au prestataire',
  rejected: 'contestation rejetée : versement autorisé au prestataire',
};

/**
 * Gestion des litiges (BR-06, BR-08, §5) : un litige bloque immédiatement tout versement et déclenche un examen par
 * un membre habilité de QIAO — jamais un remboursement ni un versement automatique.
 */
@Injectable()
export class DisputesService {
  constructor(
    private readonly core: PaymentsCore,
    private readonly financial: FinancialService,
    private readonly transactionsService: TransactionsService,
    private readonly views: PaymentsViews,
    private readonly notifier: PaymentsNotifier,
    private readonly audit: AuditService,
    private readonly rateLimiter: RateLimiter,
    private readonly usersService: UsersService,
    @InjectRepository(ServiceDispute) private readonly disputes: Repository<ServiceDispute>,
  ) {}

  // --- Côté parties ------------------------------------------------------------------------------

  /** « Contester la prestation » : vérifie que la transaction appartient au client et qu'elle est contestable. */
  async open(client: User, id: string, dto: OpenDisputeDto) {
    await this.usersService.assertActive(client);
    this.rateLimiter.hit(`payments:dispute:${client.id}`, 10, 24 * 60 * 60_000);
    let payoutEscalation: string | null = null;
    const tx = await this.core.withLock(id, async (tx, m) => {
      if (partyRole(tx, client) !== 'client') throw new ForbiddenException('Seul le client de la transaction peut la contester.');
      if (await m.exists(ServiceDispute, { where: { transactionId: tx.id } })) throw new ConflictException('Un litige a déjà été ouvert pour cette transaction.');
      if (tx.status === 'PROTECTION_PERIOD' && deadlinePassed(tx)) {
        throw new ConflictException(`La période de protection a expiré le ${formatDeadline(tx.protectionDeadlineAt!)} : la prestation ne peut plus être contestée.`);
      }
      if (!DISPUTABLE_STATES.includes(tx.status)) throw new ConflictException('Cette transaction ne peut pas être contestée à ce stade.');

      let requestedRefundAmount: number | null = null;
      if (dto.expectedResolution === 'full_refund') requestedRefundAmount = tx.amount - tx.refundedAmount;
      if (dto.expectedResolution === 'partial_refund') {
        if (!dto.requestedRefundAmount) throw new BadRequestException('Indiquez le montant de remboursement souhaité.');
        requestedRefundAmount = parsePartialAmount(dto.requestedRefundAmount, tx.currency, tx.amount - tx.refundedAmount);
      }
      const attachmentIds = await this.transactionsService.claimAttachments(m, client, dto.attachmentIds ?? [], tx.id);
      const now = new Date();
      const dispute = await m.save(
        m.create(ServiceDispute, {
          transactionId: tx.id,
          clientId: client.id,
          reason: dto.reason,
          description: dto.description.trim(),
          expectedResolution: dto.expectedResolution,
          requestedRefundAmount,
          status: 'open',
          submittedAt: now,
          openedFromStatus: tx.status,
        }),
      );
      await m.insert(DisputeEntry, {
        disputeId: dispute.id,
        authorId: client.id,
        authorName: client.fullName,
        authorRole: 'client',
        kind: 'complaint',
        message: `${DISPUTE_REASONS[dto.reason]} — ${dto.description.trim()}\n\nRésolution attendue : ${EXPECTED_RESOLUTIONS[dto.expectedResolution]}${
          requestedRefundAmount && dto.expectedResolution === 'partial_refund' ? ` (${formatMoney(requestedRefundAmount, tx.currency)})` : ''
        }`,
        attachmentIds,
      });

      tx.disputeSubmittedAt = now;
      tx.disputeStatus = 'open';
      tx.settlementProposal = null;
      await this.core.transition(m, tx, 'DISPUTED', { id: client.id, role: 'client', name: client.fullName }, 'dispute_opened', `Prestation contestée : ${DISPUTE_REASONS[dto.reason]}.`, {
        disputeId: dispute.id,
      });
      // Protection financière immédiate : tout versement est bloqué jusqu'à la décision de QIAO.
      await this.core.ledger(m, tx, 'PAYOUT_BLOCKED', {
        amount: tx.amount - tx.refundedAmount,
        status: 'recorded',
        idempotencyKey: `payout_blocked:${dispute.id}`,
        disputeId: dispute.id,
        note: 'Litige ouvert : versement bloqué.',
      });
      payoutEscalation = await this.blockExistingPayout(m, tx, dispute);
      return tx;
    });

    await this.notifier.parties(tx, {
      provider: {
        title: 'Prestation contestée — votre réponse est attendue',
        body: `${client.fullName} conteste « ${tx.title} » (${DISPUTE_REASONS[dto.reason]}). Le versement est bloqué pendant l'examen par QIAO. Répondez et joignez vos justificatifs depuis votre espace.`,
        email: true,
      },
      client: {
        title: 'Contestation enregistrée',
        body: `Votre contestation de « ${tx.title} » est enregistrée. Aucun versement ne sera effectué au prestataire avant la décision de QIAO.`,
      },
    });
    await this.notifier.admins(tx, {
      title: payoutEscalation ? 'Litige urgent : versement irrévocable' : 'Nouveau litige à examiner',
      body: `${tx.reference} — « ${tx.title} » : ${DISPUTE_REASONS[dto.reason]}.${payoutEscalation ? ` ${payoutEscalation}` : ''}`,
      email: true,
    });
    return this.views.forParty(id, client);
  }

  /**
   * §5 étape 2 : un versement déjà autorisé est annulé si le prestataire de paiement le permet ;
   * s'il est devenu irrévocable, le cas est escaladé au lieu de prétendre que les fonds sont gelés.
   */
  private async blockExistingPayout(m: EntityManager, tx: ServiceTransaction, dispute: ServiceDispute): Promise<string | null> {
    const payout = await m.findOne(ServicePayout, { where: { transactionId: tx.id, status: Not<ServicePayout['status']>('cancelled') } });
    if (!payout) return null;
    if (payout.status === 'pending' || (payout.status === 'processing' && payout.providerRef && (await this.financial.gateway.cancelPayout(payout.providerRef)))) {
      payout.status = 'cancelled';
      await m.save(ServicePayout, payout);
      await this.core.ledger(m, tx, 'PAYOUT_CANCELLED', { amount: payout.amount, status: 'cancelled', idempotencyKey: `payout_cancelled:${payout.id}:${payout.attempt}`, disputeId: dispute.id });
      return null;
    }
    tx.requiresIntervention = true;
    tx.interventionReason = 'Litige ouvert alors que le versement était déjà irrévocable : procédure de recouvrement / résolution à engager.';
    await m.save(ServiceTransaction, tx);
    return tx.interventionReason;
  }

  /** Réponse du prestataire ou éléments complémentaires d'une partie. */
  async addEntry(user: User, id: string, dto: DisputeEntryDto) {
    this.rateLimiter.hit(`payments:evidence:${user.id}`, 30, 60 * 60_000);
    const result = await this.core.withLock(id, async (tx, m) => {
      const role = partyRole(tx, user);
      if (!role) throw new ForbiddenException("Vous n'êtes pas partie à cette transaction.");
      const dispute = await m.findOne(ServiceDispute, { where: { transactionId: tx.id } });
      if (!dispute || dispute.status === 'resolved' || !DISPUTE_OPEN_STATES.includes(tx.status)) {
        throw new ConflictException("Aucun litige en cours d'examen pour cette transaction.");
      }
      const attachmentIds = await this.transactionsService.claimAttachments(m, user, dto.attachmentIds ?? [], tx.id);
      const kind = role === 'provider' && !dispute.providerRespondedAt ? 'response' : 'evidence';
      await m.insert(DisputeEntry, { disputeId: dispute.id, authorId: user.id, authorName: user.fullName, authorRole: role, kind, message: dto.message.trim(), attachmentIds });
      if (kind === 'response') dispute.providerRespondedAt = new Date();

      // Éléments demandés par QIAO reçus : retour à l'examen.
      let resumed = false;
      if (dispute.status === 'evidence_requested' && dispute.evidenceRequestedAt) {
        const from = dispute.evidenceRequestedFrom;
        const since = dispute.evidenceRequestedAt;
        const answered = async (r: 'client' | 'provider') =>
          r === role || (await m.exists(DisputeEntry, { where: { disputeId: dispute.id, authorRole: r, createdAt: MoreThanOrEqual(since) } }));
        if ((from === 'both' && (await answered('client')) && (await answered('provider'))) || from === role) {
          dispute.status = 'under_review';
          tx.disputeStatus = 'under_review';
          await this.core.transition(m, tx, 'UNDER_REVIEW', { id: user.id, role, name: user.fullName }, 'evidence_received', 'Éléments complémentaires reçus : examen repris.');
          resumed = true;
        }
      }
      await m.save(ServiceDispute, dispute);
      await this.core.log(m, tx, { id: user.id, role, name: user.fullName }, kind === 'response' ? 'provider_response' : 'evidence_added', {
        message: kind === 'response' ? 'Réponse du prestataire au litige.' : 'Éléments complémentaires ajoutés au dossier.',
        details: { attachments: attachmentIds.length },
      });
      return { tx, dispute, role, kind, resumed };
    });

    const { tx, dispute, role, kind } = result;
    await this.notifier.parties(
      tx,
      toParty(role === 'client' ? 'provider' : 'client', {
        title: kind === 'response' ? 'Le prestataire a répondu à la contestation' : 'Nouvel élément au dossier de litige',
        body: `${user.fullName} a ajouté ${kind === 'response' ? 'sa réponse' : 'un élément'} au dossier « ${tx.title} ».`,
      }),
    );
    await this.notifyReviewer(tx, dispute, {
      title: result.resumed ? 'Éléments reçus — litige à reprendre' : 'Dossier de litige complété',
      body: `${tx.reference} : ${user.fullName} (${role === 'client' ? 'client' : 'prestataire'}) a ajouté un élément.`,
    });
    return this.views.forParty(id, user);
  }

  /** Le membre QIAO en charge du dossier est notifié directement ; à défaut, toute l'équipe. */
  private async notifyReviewer(tx: ServiceTransaction, dispute: ServiceDispute, message: { title: string; body: string }) {
    if (dispute.reviewerId) return this.notifier.reviewer(dispute.reviewerId, tx, message);
    return this.notifier.admins(tx, message);
  }

  // --- Côté QIAO (membres habilités) -----------------------------------------------------------

  private reviewerActor(reviewer: User): Actor {
    return { id: reviewer.id, role: 'reviewer', name: reviewer.fullName };
  }

  private async lockDispute<T>(disputeId: string, reviewer: User, fn: (tx: ServiceTransaction, dispute: ServiceDispute, m: EntityManager) => Promise<T>) {
    const found = await this.disputes.findOne({ where: { id: disputeId } });
    if (!found) throw new NotFoundException('Litige introuvable.');
    return this.core.withLock(found.transactionId, async (tx, m) => {
      if (tx.clientId === reviewer.id || tx.providerId === reviewer.id) {
        throw new ForbiddenException("Conflit d'intérêts : vous êtes partie à cette transaction, un autre membre de QIAO doit l'examiner.");
      }
      const dispute = await m.findOneOrFail(ServiceDispute, { where: { id: disputeId } });
      if (dispute.status === 'resolved') throw new ConflictException('Ce litige a déjà été tranché.');
      return fn(tx, dispute, m);
    });
  }

  async take(reviewer: User, disputeId: string) {
    const tx = await this.lockDispute(disputeId, reviewer, async (tx, dispute, m) => {
      dispute.reviewerId = reviewer.id;
      dispute.reviewerName = reviewer.fullName;
      if (dispute.status === 'open') {
        dispute.status = 'under_review';
        dispute.reviewStartedAt = new Date();
        tx.disputeStatus = 'under_review';
        await this.core.transition(m, tx, 'UNDER_REVIEW', this.reviewerActor(reviewer), 'review_started', "Dossier pris en charge par l'équipe QIAO.");
      } else {
        await m.save(ServiceTransaction, tx);
        await this.core.log(m, tx, this.reviewerActor(reviewer), 'reviewer_assigned', { message: `Dossier attribué à ${reviewer.fullName}.`, internal: true });
      }
      await m.save(ServiceDispute, dispute);
      return tx;
    });
    await this.audit.log(reviewer, 'payments.dispute.take', { type: 'transaction', id: tx.id, label: tx.reference });
    await this.notifier.parties(tx, {
      client: { title: 'Litige en cours d’examen', body: `L'équipe QIAO examine votre contestation de « ${tx.title} ».` },
      provider: { title: 'Litige en cours d’examen', body: `L'équipe QIAO examine la contestation de « ${tx.title} ».` },
    });
    return this.views.forReviewer(tx.id);
  }

  async requestEvidence(reviewer: User, disputeId: string, dto: RequestEvidenceDto) {
    const tx = await this.lockDispute(disputeId, reviewer, async (tx, dispute, m) => {
      dispute.status = 'evidence_requested';
      dispute.evidenceRequestedFrom = dto.from;
      dispute.evidenceRequestMessage = dto.message.trim();
      dispute.evidenceRequestedAt = new Date();
      dispute.reviewerId ??= reviewer.id;
      dispute.reviewerName ??= reviewer.fullName;
      dispute.reviewStartedAt ??= new Date();
      await m.save(ServiceDispute, dispute);
      await m.insert(DisputeEntry, {
        disputeId: dispute.id,
        authorId: reviewer.id,
        authorName: reviewer.fullName,
        authorRole: 'reviewer',
        kind: 'evidence_request',
        message: dto.message.trim(),
        attachmentIds: [],
      });
      tx.disputeStatus = 'evidence_requested';
      if (tx.status === 'ADDITIONAL_EVIDENCE_REQUIRED') {
        await m.save(ServiceTransaction, tx);
        await this.core.log(m, tx, this.reviewerActor(reviewer), 'evidence_requested', { message: 'Nouveaux éléments demandés par QIAO.' });
      } else {
        await this.core.transition(m, tx, 'ADDITIONAL_EVIDENCE_REQUIRED', this.reviewerActor(reviewer), 'evidence_requested', 'Éléments complémentaires demandés par QIAO.', {
          from: dto.from,
        });
      }
      return tx;
    });
    await this.audit.log(reviewer, 'payments.dispute.request_evidence', { type: 'transaction', id: tx.id, label: tx.reference }, { from: dto.from });
    const message = {
      title: 'Éléments complémentaires demandés',
      body: `L'équipe QIAO a besoin d'informations complémentaires pour « ${tx.title} » : ${dto.message.trim()}`,
      email: true,
    };
    await this.notifier.parties(tx, {
      client: dto.from !== 'provider' ? message : undefined,
      provider: dto.from !== 'client' ? message : undefined,
    });
    return this.views.forReviewer(tx.id);
  }

  async addNote(reviewer: User, disputeId: string, message: string) {
    const tx = await this.lockDispute(disputeId, reviewer, async (tx, dispute, m) => {
      await m.insert(DisputeEntry, {
        disputeId: dispute.id,
        authorId: reviewer.id,
        authorName: reviewer.fullName,
        authorRole: 'reviewer',
        kind: 'internal_note',
        message: message.trim(),
        attachmentIds: [],
      });
      return tx;
    });
    return this.views.forReviewer(tx.id);
  }

  /** BR-08 : décision motivée, enregistrée avec son auteur, son horodatage et son résultat financier. */
  async decide(reviewer: User, disputeId: string, dto: DisputeDecisionDto) {
    let refundId: string | null = null;
    const result = await this.lockDispute(disputeId, reviewer, async (tx, dispute, m) => {
      const remaining = tx.amount - tx.refundedAmount;
      let refundAmount = dto.outcome === 'full_refund' ? remaining : 0;
      if (dto.outcome === 'partial_refund') {
        if (!dto.refundAmount) throw new BadRequestException('Indiquez le montant du remboursement partiel.');
        // Strictement inférieur au montant restant : sinon il s'agit d'un remboursement intégral.
        refundAmount = parsePartialAmount(dto.refundAmount, tx.currency, remaining - 1);
      }
      const now = new Date();
      Object.assign(dispute, {
        status: 'resolved',
        outcome: dto.outcome,
        decisionRefundAmount: refundAmount,
        decisionRationale: dto.rationale.trim(),
        decidedById: reviewer.id,
        decidedByName: reviewer.fullName,
        decidedAt: now,
        reviewerId: dispute.reviewerId ?? reviewer.id,
        reviewerName: dispute.reviewerName ?? reviewer.fullName,
      });
      await m.save(ServiceDispute, dispute);
      await m.insert(DisputeEntry, {
        disputeId: dispute.id,
        authorId: reviewer.id,
        authorName: reviewer.fullName,
        authorRole: 'reviewer',
        kind: 'decision',
        message: `Décision : ${OUTCOME_LABELS[dto.outcome]}${refundAmount ? ` (${formatMoney(refundAmount, tx.currency)})` : ''}.\n\n${dto.rationale.trim()}`,
        attachmentIds: [],
      });
      tx.disputeStatus = 'resolved';
      const decisionRef = `dispute-decision:${dispute.id}`;
      if (refundAmount > 0) {
        const refund = await m.save(
          m.create(ServiceRefund, {
            transactionId: tx.id,
            disputeId: dispute.id,
            source: 'dispute_decision',
            amount: refundAmount,
            currency: tx.currency,
            status: 'approved',
            approvedById: reviewer.id,
            approvedByName: reviewer.fullName,
            approvedAt: now,
          }),
        );
        refundId = refund.id;
        await this.core.transition(m, tx, 'REFUND_APPROVED', this.reviewerActor(reviewer), 'dispute_decided', `Décision QIAO : ${OUTCOME_LABELS[dto.outcome]}.`, {
          disputeId: dispute.id,
          outcome: dto.outcome,
          refundAmount,
        });
        await this.core.ledger(m, tx, 'REFUND_APPROVED', {
          amount: refundAmount,
          status: 'recorded',
          idempotencyKey: `refund_approved:${refund.id}`,
          disputeId: dispute.id,
          decisionRef,
          actorId: reviewer.id,
          note: dto.rationale.slice(0, 300),
        });
      } else {
        await this.core.transition(m, tx, 'DISPUTE_REJECTED', this.reviewerActor(reviewer), 'dispute_decided', `Décision QIAO : ${OUTCOME_LABELS.rejected}.`, {
          disputeId: dispute.id,
          outcome: dto.outcome,
        });
      }
      return { tx, dispute, refundAmount };
    });

    const { tx, refundAmount } = result;
    await this.audit.log(
      reviewer,
      'payments.dispute.decide',
      { type: 'transaction', id: tx.id, label: tx.reference },
      { outcome: dto.outcome, refundAmount, currency: tx.currency, rationale: dto.rationale.slice(0, 500) },
    );
    const summary = `${OUTCOME_LABELS[dto.outcome]}${refundAmount ? ` (${formatMoney(refundAmount, tx.currency)})` : ''}`;
    await this.notifier.parties(tx, {
      client: {
        title: 'Décision sur votre contestation',
        body: `QIAO a statué sur « ${tx.title} » : ${summary}. Motif : ${dto.rationale.trim()}${refundAmount ? ' Le remboursement sera confirmé dès son exécution par le prestataire de paiement.' : ''}`,
        email: true,
      },
      provider: {
        title: 'Décision sur la contestation',
        body: `QIAO a statué sur « ${tx.title} » : ${summary}. Motif : ${dto.rationale.trim()}`,
        email: true,
      },
    });
    if (refundId) await this.financial.submitRefund(refundId);
    else await this.financial.evaluateRelease(tx.id);
    return this.views.forReviewer(tx.id);
  }
}
