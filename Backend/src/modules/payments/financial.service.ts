import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { GatewayEvent, GatewayOperation, PAYMENT_GATEWAY, PaymentGateway, PayoutAccountState } from './gateway/payment-gateway';
import { ExternalCheckouts } from './external-checkouts';
import { PSP, PaymentsCore, SYSTEM } from './payments.core';
import {
  PaymentWebhookEvent,
  PayoutAccount,
  ServiceDispute,
  ServicePayout,
  ServiceRefund,
  ServiceTransaction,
} from './payments.entities';
import { PaymentsNotifier } from './payments.notifier';
import { computeSettlement, formatMoney } from './payments.policy';

type ReleaseCheck =
  | { state: 'eligible'; basis: ServicePayout['basis'] }
  | { state: 'waiting' }
  | { state: 'blocked'; reason: string }
  | { state: 'not_applicable' };

const BASIS_LABELS: Record<ServicePayout['basis'], string> = {
  protection_period_expired: 'période de protection expirée sans litige',
  dispute_rejected: 'litige rejeté après examen par QIAO',
  partial_refund_decision: 'solde après remboursement partiel décidé par QIAO',
  mutual_agreement: 'solde après accord amiable entre les parties',
};

/**
 * Exécution financière via le prestataire de paiement : confirmation des paiements, remboursements, versements,
 * contrôle des conditions de libération (BR-07) et rapprochement. Toutes les opérations sont idempotentes.
 */
@Injectable()
export class FinancialService {
  private readonly logger = new Logger('Payments');

  constructor(
    private readonly core: PaymentsCore,
    @Inject(PAYMENT_GATEWAY) readonly gateway: PaymentGateway,
    private readonly notifier: PaymentsNotifier,
    @InjectRepository(ServiceTransaction) private readonly transactions: Repository<ServiceTransaction>,
    @InjectRepository(ServiceRefund) private readonly refunds: Repository<ServiceRefund>,
    @InjectRepository(ServicePayout) private readonly payouts: Repository<ServicePayout>,
    @InjectRepository(PayoutAccount) private readonly accounts: Repository<PayoutAccount>,
    @InjectRepository(PaymentWebhookEvent) private readonly webhookEvents: Repository<PaymentWebhookEvent>,
    private readonly external: ExternalCheckouts,
  ) {}

  // --- Notifications du prestataire de paiement (webhooks) --------------------------------------

  /** Notification authentifiée (signature + horodatage), enregistrée une fois, traitée une fois. */
  async handleWebhook(provider: string, rawBody: Buffer | undefined, headers: Record<string, string | string[] | undefined>) {
    if (provider !== this.gateway.name) throw new NotFoundException('Prestataire de paiement inconnu.');
    if (!rawBody?.length) throw new BadRequestException('Notification vide.');
    const event = await this.gateway.verifyWebhook(rawBody, headers);
    if (!event) return { received: true, ignored: true };

    const inserted = await this.webhookEvents
      .createQueryBuilder()
      .insert()
      .values({ provider, eventId: event.id, type: event.type, payload: event as never })
      .orIgnore()
      .returning(['id'])
      .execute();
    if (!inserted.raw.length) {
      const existing = await this.webhookEvents.findOne({ where: { provider, eventId: event.id } });
      if (existing?.status === 'processed' || existing?.status === 'ignored') return { received: true, duplicate: true };
    }

    try {
      const handled = await this.applyEvent(event);
      await this.webhookEvents.update({ provider, eventId: event.id }, { status: handled ? 'processed' : 'ignored', processedAt: new Date(), error: null });
      return { received: true };
    } catch (err) {
      await this.webhookEvents.update({ provider, eventId: event.id }, { status: 'failed', error: (err as Error).message.slice(0, 300) });
      throw err; // Le prestataire renverra la notification.
    }
  }

  private async applyEvent(event: GatewayEvent): Promise<boolean> {
    const op: GatewayOperation = {
      ref: event.objectRef,
      status: ['checkout.succeeded', 'refund.succeeded', 'payout.paid', 'account.updated'].includes(event.type) ? 'succeeded' : 'failed',
      amount: event.amount,
      currency: event.currency,
      fee: event.fee,
      paymentRef: event.paymentRef ?? null,
      failureReason: event.failureReason ?? null,
    };
    switch (event.type) {
      case 'checkout.succeeded':
      case 'checkout.failed': {
        // Paiement d'un autre module (commande QIAO Academy…) : remis au module concerné.
        const routed = await this.external.dispatch(event.metadata.transactionId, op);
        return routed ?? this.applyCheckout(event.metadata.transactionId, op);
      }
      case 'refund.succeeded':
      case 'refund.failed':
        return this.applyRefundResult(event.metadata.refundId, op, Number(event.metadata.attempt));
      case 'payout.paid':
      case 'payout.failed':
        return this.applyPayoutResult(event.metadata.payoutId, op, Number(event.metadata.attempt));
      case 'account.updated':
        return this.applyAccountUpdate(event.objectRef, event.accountStatus ?? 'restricted');
      default:
        return false;
    }
  }

  // --- Paiement -------------------------------------------------------------------------------

  async applyCheckout(transactionId: string | undefined, op: GatewayOperation): Promise<boolean> {
    if (!transactionId) return false;
    const result = await this.core.withLock(transactionId, async (tx, m) => {
      if (op.status === 'succeeded') {
        const paymentRef = op.paymentRef ?? op.ref;
        if (tx.paymentRef === paymentRef) return null; // Déjà pris en compte.
        const expected = tx.checkoutRef === op.ref && (tx.status === 'PAYMENT_PENDING' || tx.status === 'PAYMENT_FAILED');
        if (!expected) {
          // Session expirée réglée, transaction annulée ou déjà payée : jamais de double encaissement silencieux.
          tx.requiresIntervention = true;
          tx.interventionReason = `Paiement inattendu ${paymentRef} (${formatMoney(op.amount ?? 0, op.currency ?? tx.currency)}) reçu à l'état ${tx.status} : remboursement du client à effectuer.`;
          await m.save(ServiceTransaction, tx);
          await this.core.ledger(m, tx, 'DUPLICATE_PAYMENT', {
            amount: op.amount ?? 0,
            status: 'recorded',
            idempotencyKey: `duplicate_payment:${paymentRef}`,
            providerRef: paymentRef,
            note: tx.interventionReason,
          });
          await this.core.log(m, tx, PSP, 'unexpected_payment', { message: tx.interventionReason, internal: true });
          return { kind: 'unexpected' as const, tx };
        }
        tx.paidAt = new Date();
        tx.paymentRef = paymentRef;
        tx.processingFeeAmount = op.fee ?? 0;
        tx.paymentFailureReason = null;
        if (op.amount !== tx.amount || op.currency !== tx.currency) {
          tx.requiresIntervention = true;
          tx.interventionReason = `Montant confirmé (${formatMoney(op.amount ?? 0, op.currency ?? tx.currency)}) différent du montant convenu.`;
        }
        await this.core.transition(m, tx, 'PAID_HELD', PSP, 'payment_succeeded', 'Paiement confirmé par le prestataire de paiement : fonds retenus.', {
          paymentRef,
          fee: tx.processingFeeAmount,
        });
        await this.core.ledger(m, tx, 'PAYMENT_CAPTURED', {
          amount: tx.amount,
          status: 'succeeded',
          idempotencyKey: `payment_captured:${paymentRef}`,
          providerRef: paymentRef,
        });
        return { kind: 'paid' as const, tx };
      }
      if (tx.checkoutRef !== op.ref || tx.status !== 'PAYMENT_PENDING') return null;
      tx.paymentFailureReason = op.failureReason?.slice(0, 300) ?? 'Paiement refusé.';
      await this.core.transition(m, tx, 'PAYMENT_FAILED', PSP, 'payment_failed', tx.paymentFailureReason);
      await this.core.ledger(m, tx, 'PAYMENT_FAILED', {
        amount: tx.amount,
        status: 'failed',
        idempotencyKey: `payment_failed:${op.ref}`,
        providerRef: op.ref,
        note: tx.paymentFailureReason,
      });
      return { kind: 'failed' as const, tx };
    });
    if (!result) return false;

    const { tx } = result;
    const amount = formatMoney(tx.amount, tx.currency);
    if (result.kind === 'paid') {
      await this.notifier.parties(tx, {
        client: {
          title: 'Paiement confirmé — fonds sécurisés',
          body: `Votre paiement de ${amount} pour « ${tx.title} » est confirmé. Les fonds sont retenus par QIAO et ne seront versés au prestataire qu'après la période de protection de 5 jours suivant la déclaration de fin de prestation.`,
          email: true,
        },
        provider: {
          title: 'Paiement reçu par QIAO',
          body: `Le client a réglé ${amount} pour « ${tx.title} ». Les fonds sont retenus jusqu'à la fin de la période de protection : vous pouvez démarrer la prestation.`,
          email: true,
        },
      });
    } else if (result.kind === 'failed') {
      await this.notifier.parties(tx, {
        client: { title: 'Paiement refusé', body: `Votre paiement de ${amount} pour « ${tx.title} » n'a pas abouti : ${tx.paymentFailureReason} Vous pouvez réessayer.` },
      });
    } else {
      await this.notifier.admins(tx, { title: 'Paiement inattendu à traiter', body: tx.interventionReason ?? '', email: true });
    }
    return true;
  }

  // --- Remboursements -------------------------------------------------------------------------

  /** Transmet un remboursement approuvé (ou le rejoue avec la même clé si le résultat d'un envoi est inconnu). */
  async submitRefund(refundId: string): Promise<void> {
    const found = await this.refunds.findOne({ where: { id: refundId } });
    if (!found) return;
    const plan = await this.core.withLock(found.transactionId, async (tx, m) => {
      const refund = await m.findOneOrFail(ServiceRefund, { where: { id: refundId } });
      if (refund.status === 'processing' && !refund.providerRef) return { refund, tx };
      if (refund.status !== 'approved' && refund.status !== 'failed') return null;
      if (!tx.paymentRef) throw new BadRequestException('Aucun paiement confirmé à rembourser.');
      if (refund.status === 'failed') refund.attempt += 1;
      refund.status = 'processing';
      refund.submittedAt = new Date();
      refund.failureReason = null;
      refund.lastError = null;
      refund.providerRef = null;
      await m.save(ServiceRefund, refund);
      await this.core.transition(m, tx, 'REFUND_PROCESSING', SYSTEM, 'refund_submitted', `Instruction de remboursement transmise (${formatMoney(refund.amount, refund.currency)}).`, {
        refundId: refund.id,
        attempt: refund.attempt,
      });
      await this.core.ledger(m, tx, 'REFUND_SUBMITTED', {
        amount: refund.amount,
        status: 'pending',
        idempotencyKey: `refund_submitted:${refund.id}:${refund.attempt}`,
        disputeId: refund.disputeId,
      });
      return { refund, tx };
    });
    if (!plan) return;

    const { refund, tx } = plan;
    try {
      const op = await this.gateway.refund({
        paymentRef: tx.paymentRef!,
        amount: refund.amount,
        currency: refund.currency,
        idempotencyKey: `refund:${refund.id}:${refund.attempt}`,
        metadata: { transactionId: tx.id, refundId: refund.id, attempt: String(refund.attempt) },
      });
      await this.refunds.update({ id: refund.id, attempt: refund.attempt }, { providerRef: op.ref, lastError: null });
      if (op.status !== 'pending') await this.applyRefundResult(refund.id, op, refund.attempt);
    } catch (err) {
      // Résultat inconnu : le rapprochement rejouera l'envoi avec la même clé d'idempotence.
      await this.refunds.update({ id: refund.id }, { lastError: (err as Error).message.slice(0, 300) });
      this.logger.warn(`Remboursement ${refund.id} : ${(err as Error).message}`);
    }
  }

  async applyRefundResult(refundId: string | undefined, op: GatewayOperation, attempt?: number): Promise<boolean> {
    if (!refundId) return false;
    const found = await this.refunds.findOne({ where: { id: refundId } });
    if (!found) return false;
    const result = await this.core.withLock(found.transactionId, async (tx, m) => {
      const refund = await m.findOneOrFail(ServiceRefund, { where: { id: refundId } });
      if (refund.status !== 'processing') return null;
      if (Number.isFinite(attempt) && attempt !== refund.attempt) return null;
      if (refund.providerRef && op.ref !== refund.providerRef) return null;
      refund.providerRef = op.ref;

      if (op.status === 'succeeded') {
        refund.status = 'completed';
        refund.completedAt = new Date();
        await m.save(ServiceRefund, refund);
        tx.refundedAmount += refund.amount;
        tx.refundCompletedAt = refund.completedAt;
        const full = tx.refundedAmount >= tx.amount;
        if (refund.source !== 'dispute_decision' && (full || !tx.completionDeclaredAt)) tx.serviceStatus = 'cancelled';
        await this.core.transition(
          m,
          tx,
          full ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          PSP,
          'refund_completed',
          `Remboursement de ${formatMoney(refund.amount, refund.currency)} confirmé par le prestataire de paiement.`,
          { refundId: refund.id, providerRef: op.ref },
        );
        await this.core.ledger(m, tx, 'REFUND_COMPLETED', {
          amount: refund.amount,
          status: 'succeeded',
          idempotencyKey: `refund_completed:${refund.id}:${refund.attempt}`,
          providerRef: op.ref,
          disputeId: refund.disputeId,
        });
        return { kind: 'completed' as const, tx, refund, full };
      }

      refund.status = 'failed';
      refund.failureReason = op.failureReason?.slice(0, 300) ?? 'Remboursement refusé par le prestataire de paiement.';
      await m.save(ServiceRefund, refund);
      tx.requiresIntervention = true;
      tx.interventionReason = `Remboursement refusé : ${refund.failureReason}`;
      await this.core.transition(m, tx, 'REFUND_FAILED', PSP, 'refund_failed', refund.failureReason, { refundId: refund.id });
      await this.core.ledger(m, tx, 'REFUND_FAILED', {
        amount: refund.amount,
        status: 'failed',
        idempotencyKey: `refund_failed:${refund.id}:${refund.attempt}`,
        providerRef: op.ref,
        disputeId: refund.disputeId,
        note: refund.failureReason,
      });
      return { kind: 'failed' as const, tx, refund, full: false };
    });
    if (!result) return false;

    const { tx, refund } = result;
    const amount = formatMoney(refund.amount, refund.currency);
    if (result.kind === 'completed') {
      await this.notifier.parties(tx, {
        client: { title: 'Remboursement effectué', body: `Le remboursement de ${amount} pour « ${tx.title} » a été confirmé par le prestataire de paiement. Le délai d'apparition sur votre relevé dépend de votre banque.`, email: true },
        provider: {
          title: result.full ? 'Transaction remboursée' : 'Remboursement partiel effectué',
          body: result.full
            ? `Le client a été intégralement remboursé (${amount}) pour « ${tx.title} ».`
            : `Le client a été remboursé de ${amount} pour « ${tx.title} ». Le solde éligible vous sera versé selon les conditions de libération.`,
        },
      });
      if (!result.full) await this.evaluateRelease(tx.id);
    } else {
      await this.notifier.parties(tx, {
        client: { title: 'Remboursement retardé', body: `Le remboursement de ${amount} pour « ${tx.title} » n'a pas pu être exécuté par le prestataire de paiement. Une intervention de QIAO est en cours.`, email: true },
      });
      await this.notifier.admins(tx, { title: 'Remboursement en échec', body: `${tx.reference} — ${refund.failureReason}`, email: true });
    }
    return true;
  }

  // --- Libération des fonds et versements ------------------------------------------------------

  /** BR-07 : autorise le versement si — et seulement si — toutes les conditions de libération sont réunies. */
  async evaluateRelease(transactionId: string): Promise<ReleaseCheck['state'] | 'authorized'> {
    const result = await this.core.withLock(transactionId, async (tx, m) => {
      const check = await this.releaseCheck(m, tx);
      if (check.state !== 'eligible') {
        if (check.state === 'blocked' && tx.releaseBlockedReason !== check.reason) {
          tx.releaseBlockedReason = check.reason;
          await m.save(ServiceTransaction, tx);
          await this.core.log(m, tx, SYSTEM, 'release_blocked', { message: check.reason, internal: true });
        }
        return { state: check.state };
      }
      const breakdown = computeSettlement({
        gross: tx.amount,
        processingFee: tx.processingFeeAmount,
        commissionRateBps: tx.commissionRateBps,
        refunded: tx.refundedAmount,
      });
      const now = new Date();
      const existing = await m.findOne(ServicePayout, { where: { transactionId: tx.id } });
      const payout = existing ?? m.create(ServicePayout, { transactionId: tx.id, providerId: tx.providerId, currency: tx.currency });
      Object.assign(payout, {
        amount: breakdown.payout,
        commissionAmount: breakdown.commission,
        processingFeeAmount: breakdown.providerFee,
        status: 'pending',
        basis: check.basis,
        authorizedAt: now,
        attempt: existing ? existing.attempt + 1 : 0,
        providerRef: null,
        failureReason: null,
        lastError: null,
      });
      await m.save(ServicePayout, payout);
      tx.payoutAuthorizedAt = now;
      tx.releaseBlockedReason = null;
      await this.core.transition(m, tx, 'PAYOUT_PENDING', SYSTEM, 'payout_authorized', `Versement autorisé (${BASIS_LABELS[check.basis]}).`, {
        payoutId: payout.id,
        amount: payout.amount,
        commission: payout.commissionAmount,
        fee: payout.processingFeeAmount,
      });
      await this.core.ledger(m, tx, 'PAYOUT_AUTHORIZED', {
        amount: payout.amount,
        status: 'pending',
        idempotencyKey: `payout_authorized:${payout.id}:${payout.attempt}`,
        decisionRef: check.basis,
      });
      return { state: 'authorized' as const, tx, payout };
    });

    if (result.state === 'authorized') {
      await this.notifier.parties(result.tx, {
        provider: {
          title: 'Versement autorisé',
          body: `Le versement de ${formatMoney(result.payout.amount, result.tx.currency)} pour « ${result.tx.title} » est autorisé (${BASIS_LABELS[result.payout.basis]}). Il sera initié auprès du prestataire de paiement.`,
        },
      });
      await this.submitPayout(transactionId);
    }
    return result.state;
  }

  private async releaseCheck(m: EntityManager, tx: ServiceTransaction): Promise<ReleaseCheck> {
    let basis: ServicePayout['basis'];
    if (tx.status === 'PROTECTION_PERIOD') {
      if (!tx.completionDeclaredAt || !tx.protectionDeadlineAt) return { state: 'blocked', reason: 'Libération bloquée : déclaration de fin de prestation absente.' };
      basis = 'protection_period_expired';
    } else if (tx.status === 'DISPUTE_REJECTED') {
      basis = 'dispute_rejected';
    } else if (tx.status === 'PARTIALLY_REFUNDED') {
      const refund = await m.findOne(ServiceRefund, { where: { transactionId: tx.id, status: 'completed' }, order: { completedAt: 'DESC' } });
      basis = refund?.source === 'dispute_decision' ? 'partial_refund_decision' : 'mutual_agreement';
    } else {
      return { state: 'not_applicable' };
    }
    // Aucun versement avant l'échéance de protection, quel que soit le fondement (AC-03).
    if (tx.protectionDeadlineAt && tx.protectionDeadlineAt.getTime() > Date.now()) return { state: 'waiting' };

    const reasons: string[] = [];
    if (!tx.paidAt || !tx.paymentRef) reasons.push('paiement non confirmé');
    const dispute = await m.findOne(ServiceDispute, { where: { transactionId: tx.id } });
    if (dispute && dispute.status !== 'resolved') reasons.push('litige non résolu');
    if (tx.payoutHold) reasons.push(`blocage administratif${tx.payoutHoldReason ? ` (${tx.payoutHoldReason})` : ''}`);
    if (tx.requiresIntervention) reasons.push('intervention manuelle en attente');
    if (await m.count(ServiceRefund, { where: { transactionId: tx.id, status: In(['approved', 'processing', 'failed']) } })) {
      reasons.push('remboursement non finalisé');
    }
    const existing = await m.findOne(ServicePayout, { where: { transactionId: tx.id } });
    if (existing && existing.status !== 'cancelled') reasons.push('versement déjà autorisé');
    if (tx.paidOutAmount > 0) reasons.push('versement déjà effectué');
    if (tx.refundedAmount >= tx.amount) reasons.push('transaction intégralement remboursée');
    const breakdown = computeSettlement({ gross: tx.amount, processingFee: tx.processingFeeAmount, commissionRateBps: tx.commissionRateBps, refunded: tx.refundedAmount });
    if (breakdown.payout <= 0) reasons.push('aucun montant à verser');
    if (reasons.length) return { state: 'blocked', reason: `Libération bloquée : ${reasons.join(', ')}.` };
    return { state: 'eligible', basis };
  }

  /** Transmet un versement autorisé au prestataire de paiement (restrictions vérifiées à nouveau au moment de l'envoi). */
  async submitPayout(transactionId: string): Promise<void> {
    const plan = await this.core.withLock(transactionId, async (tx, m) => {
      const payout = await m.findOne(ServicePayout, { where: { transactionId } });
      if (!payout) return null;
      const resubmit = payout.status === 'processing' && !payout.providerRef;
      const fresh = tx.status === 'PAYOUT_PENDING' && payout.status === 'pending';
      const retry = tx.status === 'PAYOUT_FAILED' && payout.status === 'failed' && !tx.requiresIntervention;
      if (!resubmit && !fresh && !retry) return null;
      if (!resubmit && (tx.payoutHold || tx.requiresIntervention)) return null;
      const dispute = await m.findOne(ServiceDispute, { where: { transactionId } });
      if (dispute && dispute.status !== 'resolved') return null;

      const account = await m.findOne(PayoutAccount, { where: { userId: tx.providerId } });
      if (!account || account.status !== 'active' || account.provider !== this.gateway.name) {
        const reason = 'En attente du compte de versement du prestataire.';
        if (tx.releaseBlockedReason === reason) return null;
        tx.releaseBlockedReason = reason;
        await m.save(ServiceTransaction, tx);
        return { waitingAccount: true as const, tx };
      }
      if (!resubmit) {
        if (payout.status === 'failed') payout.attempt += 1;
        payout.status = 'processing';
        payout.submittedAt = new Date();
        payout.failureReason = null;
        payout.lastError = null;
        payout.providerRef = null;
        await m.save(ServicePayout, payout);
        tx.releaseBlockedReason = null;
        await this.core.transition(m, tx, 'PAYOUT_PROCESSING', SYSTEM, 'payout_submitted', `Instruction de versement transmise (${formatMoney(payout.amount, payout.currency)}).`, {
          payoutId: payout.id,
          attempt: payout.attempt,
        });
        await this.core.ledger(m, tx, 'PAYOUT_SUBMITTED', {
          amount: payout.amount,
          status: 'pending',
          idempotencyKey: `payout_submitted:${payout.id}:${payout.attempt}`,
        });
      }
      return { payout, accountRef: account.accountRef, tx };
    });
    if (!plan) return;
    if ('waitingAccount' in plan) {
      await this.notifier.parties(plan.tx, {
        provider: {
          title: 'Configurez votre compte de versement',
          body: `Un versement est prêt pour « ${plan.tx.title} ». Activez votre compte de versement dans « Prestations & paiements » pour le recevoir.`,
          email: true,
        },
      });
      return;
    }

    const { payout, tx, accountRef } = plan;
    try {
      const op = await this.gateway.payout({
        accountRef,
        amount: payout.amount,
        currency: payout.currency,
        idempotencyKey: `payout:${payout.id}:${payout.attempt}`,
        metadata: { transactionId: tx.id, payoutId: payout.id, attempt: String(payout.attempt) },
        paymentRef: tx.paymentRef,
      });
      await this.payouts.update({ id: payout.id, attempt: payout.attempt }, { providerRef: op.ref, lastError: null });
      if (op.status !== 'pending') await this.applyPayoutResult(payout.id, op, payout.attempt);
      else {
        await this.notifier.parties(tx, {
          provider: { title: 'Versement initié', body: `Le versement de ${formatMoney(payout.amount, payout.currency)} pour « ${tx.title} » a été transmis au prestataire de paiement. Il sera confirmé dès réception.` },
        });
      }
    } catch (err) {
      await this.payouts.update({ id: payout.id }, { lastError: (err as Error).message.slice(0, 300) });
      this.logger.warn(`Versement ${payout.id} : ${(err as Error).message}`);
    }
  }

  async applyPayoutResult(payoutId: string | undefined, op: GatewayOperation, attempt?: number): Promise<boolean> {
    if (!payoutId) return false;
    const found = await this.payouts.findOne({ where: { id: payoutId } });
    if (!found) return false;
    const result = await this.core.withLock(found.transactionId, async (tx, m) => {
      const payout = await m.findOneOrFail(ServicePayout, { where: { id: payoutId } });
      if (payout.status !== 'processing') return null;
      if (Number.isFinite(attempt) && attempt !== payout.attempt) return null;
      if (payout.providerRef && op.ref !== payout.providerRef) return null;
      payout.providerRef = op.ref;

      if (op.status === 'succeeded') {
        payout.status = 'completed';
        payout.completedAt = new Date();
        await m.save(ServicePayout, payout);
        tx.paidOutAmount = payout.amount;
        tx.payoutCompletedAt = payout.completedAt;
        await this.core.transition(m, tx, 'PAID_OUT', PSP, 'payout_completed', `Versement de ${formatMoney(payout.amount, payout.currency)} confirmé par le prestataire de paiement.`, {
          payoutId: payout.id,
          providerRef: op.ref,
        });
        await this.core.ledger(m, tx, 'PAYOUT_COMPLETED', {
          amount: payout.amount,
          status: 'succeeded',
          idempotencyKey: `payout_completed:${payout.id}:${payout.attempt}`,
          providerRef: op.ref,
        });
        await this.core.ledger(m, tx, 'COMMISSION_EARNED', {
          amount: payout.commissionAmount,
          status: 'recorded',
          idempotencyKey: `commission_earned:${payout.id}`,
        });
        return { kind: 'completed' as const, tx, payout };
      }

      payout.status = 'failed';
      payout.failureReason =
        op.status === 'cancelled' ? 'Versement annulé chez le prestataire de paiement.' : (op.failureReason?.slice(0, 300) ?? 'Versement refusé par le prestataire de paiement.');
      await m.save(ServicePayout, payout);
      tx.requiresIntervention = true;
      tx.interventionReason = `Versement en échec : ${payout.failureReason}`;
      await this.core.transition(m, tx, 'PAYOUT_FAILED', PSP, 'payout_failed', payout.failureReason, { payoutId: payout.id });
      await this.core.ledger(m, tx, 'PAYOUT_FAILED', {
        amount: payout.amount,
        status: 'failed',
        idempotencyKey: `payout_failed:${payout.id}:${payout.attempt}`,
        providerRef: op.ref,
        note: payout.failureReason,
      });
      return { kind: 'failed' as const, tx, payout };
    });
    if (!result) return false;

    const { tx, payout } = result;
    const amount = formatMoney(payout.amount, payout.currency);
    if (result.kind === 'completed') {
      await this.notifier.parties(tx, {
        provider: { title: 'Versement effectué', body: `Le versement de ${amount} pour « ${tx.title} » a été confirmé par le prestataire de paiement.`, email: true },
        client: { title: 'Transaction clôturée', body: `La transaction « ${tx.title} » (${tx.reference}) est clôturée : les fonds ont été versés au prestataire.` },
      });
    } else {
      await this.notifier.parties(tx, {
        provider: { title: 'Versement en échec', body: `Le versement de ${amount} pour « ${tx.title} » a été refusé : ${payout.failureReason} QIAO va vous contacter.`, email: true },
      });
      await this.notifier.admins(tx, { title: 'Versement en échec', body: `${tx.reference} — ${payout.failureReason}`, email: true });
    }
    return true;
  }

  private async applyAccountUpdate(accountRef: string, status: PayoutAccountState): Promise<boolean> {
    const account = await this.accounts.findOne({ where: { accountRef } });
    if (!account) return false;
    account.status = status;
    await this.accounts.save(account);
    if (status === 'active') {
      const waiting = await this.transactions.find({ where: { providerId: account.userId, status: 'PAYOUT_PENDING' }, select: { id: true } });
      for (const tx of waiting) {
        await this.transactions.update({ id: tx.id }, { releaseBlockedReason: null });
        await this.submitPayout(tx.id);
      }
    }
    return true;
  }

  // --- Rapprochement (notifications perdues, envois au résultat inconnu) ------------------------

  async reconcile() {
    const staleBefore = new Date(Date.now() - 60_000);

    const checkouts = await this.transactions.find({
      where: { status: 'PAYMENT_PENDING', updatedAt: LessThan(staleBefore) },
      select: { id: true, checkoutRef: true },
      take: 50,
    });
    for (const tx of checkouts) {
      if (!tx.checkoutRef) continue;
      const op = await this.gateway.retrieve('checkout', tx.checkoutRef).catch(() => null);
      if (op && (op.status === 'succeeded' || op.status === 'failed')) await this.applyCheckout(tx.id, op);
    }

    const refunds = await this.refunds.find({ where: { status: In(['approved', 'processing']), updatedAt: LessThan(staleBefore) }, take: 50 });
    for (const refund of refunds) {
      if (refund.status === 'approved' || !refund.providerRef) {
        await this.submitRefund(refund.id);
        continue;
      }
      const op = await this.gateway.retrieve('refund', refund.providerRef).catch(() => null);
      if (op && op.status !== 'pending') await this.applyRefundResult(refund.id, op, refund.attempt);
    }

    const payouts = await this.payouts.find({ where: { status: 'processing', updatedAt: LessThan(staleBefore) }, take: 50 });
    for (const payout of payouts) {
      if (!payout.providerRef) {
        await this.submitPayout(payout.transactionId);
        continue;
      }
      const op = await this.gateway.retrieve('payout', payout.providerRef).catch(() => null);
      if (op && op.status !== 'pending') await this.applyPayoutResult(payout.id, op, payout.attempt);
    }

    await this.reconcileAccounts();

    const pendingPayouts = await this.transactions.find({ where: { status: 'PAYOUT_PENDING' }, select: { id: true }, take: 50 });
    for (const tx of pendingPayouts) await this.submitPayout(tx.id);
  }

  /** Comptes de versement en cours de vérification : récents toutes les minutes, les autres toutes les 30 minutes. */
  private async reconcileAccounts() {
    if (!this.gateway.retrieveAccount) return;
    const now = Date.now();
    const pending = { provider: this.gateway.name, status: Not<PayoutAccount['status']>('active') };
    const accounts = await this.accounts.find({
      where: [
        { ...pending, createdAt: MoreThan(new Date(now - 24 * 3_600_000)), updatedAt: LessThan(new Date(now - 60_000)) },
        { ...pending, updatedAt: LessThan(new Date(now - 30 * 60_000)) },
      ],
      order: { updatedAt: 'ASC' },
      take: 20,
    });
    for (const account of accounts) {
      const status = await this.gateway.retrieveAccount(account.accountRef).catch(() => null);
      if (status && status !== account.status) await this.applyAccountUpdate(account.accountRef, status);
      else await this.accounts.update({ userId: account.userId }, { updatedAt: new Date() });
    }
  }
}
