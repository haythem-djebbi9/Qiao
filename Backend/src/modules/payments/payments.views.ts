import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExpertProfile } from '../community/community.entities';
import { User } from '../users/user.entity';
import { DISPUTE_OPEN_STATES } from './payments.core';
import {
  CompletionDeclaration,
  DisputeEntry,
  LedgerEntry,
  PayoutAccount,
  ServiceAttachment,
  ServiceDispute,
  ServicePayout,
  ServiceRefund,
  ServiceTransaction,
  TransactionEvent,
} from './payments.entities';
import { computeSettlement } from './payments.policy';

export type ViewerRole = 'client' | 'provider' | 'reviewer';

export function partyRole(tx: ServiceTransaction, user: User): 'client' | 'provider' | null {
  if (tx.clientId === user.id) return 'client';
  if (tx.providerId === user.id) return 'provider';
  return null;
}

const SETTLEMENT_STATES = ['IN_PROGRESS', 'PROTECTION_PERIOD'];

export function deadlinePassed(tx: ServiceTransaction, now = Date.now()) {
  return !!tx.protectionDeadlineAt && tx.protectionDeadlineAt.getTime() <= now;
}

/** États dans lesquels un accord amiable peut être proposé ou accepté. */
export function settlementOpen(tx: ServiceTransaction) {
  return SETTLEMENT_STATES.includes(tx.status) && !deadlinePassed(tx);
}

/** Actions proposées à chaque partie : calculées côté serveur, elles reflètent toujours l'état réel. */
export function availableActions(tx: ServiceTransaction, role: 'client' | 'provider'): string[] {
  const actions: string[] = [];
  const s = tx.status;
  const proposal = tx.settlementProposal;
  if (role === 'client') {
    if (s === 'REQUESTED') actions.push('cancel');
    if (s === 'PAYMENT_PENDING' || s === 'PAYMENT_FAILED') actions.push('pay', 'cancel');
    if (s === 'PAID_HELD') actions.push('cancel', 'dispute');
    if (s === 'IN_PROGRESS') actions.push('dispute');
    if (s === 'PROTECTION_PERIOD' && !deadlinePassed(tx)) {
      if (!tx.clientConfirmationAt) actions.push('confirm');
      actions.push('dispute');
    }
  } else {
    if (s === 'REQUESTED') actions.push('accept', 'decline');
    if (s === 'PAYMENT_PENDING' || s === 'PAYMENT_FAILED') actions.push('cancel');
    if (s === 'PAID_HELD') actions.push('start', 'declare_completion', 'cancel');
    if (s === 'IN_PROGRESS') actions.push('declare_completion', 'cancel');
  }
  if (DISPUTE_OPEN_STATES.includes(s)) actions.push('add_evidence');
  if (settlementOpen(tx)) {
    if (!proposal) actions.push('propose_settlement');
    else if (proposal.proposedBy === role) actions.push('withdraw_settlement');
    else actions.push('accept_settlement', 'decline_settlement');
  }
  return actions;
}

/** Construction des vues (parties et équipes QIAO) : chaque rôle ne voit que ce que la politique lui permet de voir. */
@Injectable()
export class PaymentsViews {
  constructor(
    @InjectRepository(ServiceTransaction) private readonly transactions: Repository<ServiceTransaction>,
    @InjectRepository(TransactionEvent) private readonly events: Repository<TransactionEvent>,
    @InjectRepository(CompletionDeclaration) private readonly declarations: Repository<CompletionDeclaration>,
    @InjectRepository(ServiceDispute) private readonly disputes: Repository<ServiceDispute>,
    @InjectRepository(DisputeEntry) private readonly entries: Repository<DisputeEntry>,
    @InjectRepository(ServiceRefund) private readonly refunds: Repository<ServiceRefund>,
    @InjectRepository(ServicePayout) private readonly payouts: Repository<ServicePayout>,
    @InjectRepository(LedgerEntry) private readonly ledger: Repository<LedgerEntry>,
    @InjectRepository(ServiceAttachment) private readonly attachments: Repository<ServiceAttachment>,
    @InjectRepository(PayoutAccount) private readonly accounts: Repository<PayoutAccount>,
    @InjectRepository(ExpertProfile) private readonly experts: Repository<ExpertProfile>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async people(ids: string[]) {
    const unique = [...new Set(ids)];
    if (!unique.length) return new Map<string, ReturnType<PaymentsViews['person']>>();
    const [users, experts] = await Promise.all([
      this.users.find({ where: { id: In(unique) } }),
      this.experts.find({ where: { userId: In(unique) }, select: { userId: true, verificationStatus: true, headline: true } }),
    ]);
    return new Map(users.map((u) => [u.id, this.person(u, experts.find((e) => e.userId === u.id) ?? null)]));
  }

  private person(user: User, expert: Pick<ExpertProfile, 'verificationStatus' | 'headline'> | null) {
    return {
      id: user.id,
      fullName: user.fullName,
      handle: user.handle,
      avatarUrl: user.avatarUrl,
      company: user.company,
      headline: expert?.headline ?? user.title,
      verifiedProvider: expert?.verificationStatus === 'verified',
    };
  }

  summary(tx: ServiceTransaction, viewerRole: ViewerRole, people: Map<string, unknown>) {
    return {
      id: tx.id,
      reference: tx.reference,
      title: tx.title,
      status: tx.status,
      serviceStatus: tx.serviceStatus,
      currency: tx.currency,
      amount: tx.amount,
      refundedAmount: tx.refundedAmount,
      viewerRole,
      client: people.get(tx.clientId) ?? null,
      provider: people.get(tx.providerId) ?? null,
      protectionDeadlineAt: tx.protectionDeadlineAt,
      disputeStatus: tx.disputeStatus,
      settlementPending: !!tx.settlementProposal,
      requiresIntervention: tx.requiresIntervention,
      payoutHold: tx.payoutHold,
      actions: viewerRole === 'reviewer' ? [] : availableActions(tx, viewerRole),
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    };
  }

  async listForUser(user: User, role: 'client' | 'provider' | 'all' = 'all') {
    const where =
      role === 'client' ? [{ clientId: user.id }] : role === 'provider' ? [{ providerId: user.id }] : [{ clientId: user.id }, { providerId: user.id }];
    const items = await this.transactions.find({ where, order: { updatedAt: 'DESC' }, take: 100 });
    const people = await this.people(items.flatMap((t) => [t.clientId, t.providerId]));
    const account = await this.accounts.findOne({ where: { userId: user.id } });
    return {
      items: items.map((tx) => this.summary(tx, partyRole(tx, user)!, people)),
      payoutAccount: account ? { status: account.status, provider: account.provider } : null,
    };
  }

  /** Détail d'une transaction pour une partie (client ou prestataire). */
  async forParty(id: string, user: User) {
    const tx = await this.transactions.findOne({ where: { id } });
    if (!tx) throw new NotFoundException('Transaction introuvable.');
    const role = partyRole(tx, user);
    if (!role) {
      if (user.role === 'admin') return this.forReviewer(id);
      throw new ForbiddenException("Vous n'êtes pas partie à cette transaction.");
    }
    return this.detail(tx, role);
  }

  /** Détail complet pour les équipes QIAO : grand livre, notes internes, références du prestataire de paiement. */
  async forReviewer(id: string) {
    const tx = await this.transactions.findOne({ where: { id } });
    if (!tx) throw new NotFoundException('Transaction introuvable.');
    return this.detail(tx, 'reviewer');
  }

  private async detail(tx: ServiceTransaction, role: ViewerRole) {
    const reviewer = role === 'reviewer';
    const [events, declaration, dispute, refunds, payout, ledger, account] = await Promise.all([
      this.events.find({ where: reviewer ? { transactionId: tx.id } : { transactionId: tx.id, internal: false }, order: { createdAt: 'ASC' } }),
      this.declarations.findOne({ where: { transactionId: tx.id } }),
      this.disputes.findOne({ where: { transactionId: tx.id } }),
      this.refunds.find({ where: { transactionId: tx.id }, order: { createdAt: 'ASC' } }),
      this.payouts.findOne({ where: { transactionId: tx.id } }),
      reviewer ? this.ledger.find({ where: { transactionId: tx.id }, order: { createdAt: 'ASC' } }) : Promise.resolve([]),
      reviewer ? this.accounts.findOne({ where: { userId: tx.providerId } }) : Promise.resolve(null),
    ]);
    const entries = dispute
      ? await this.entries.find({
          where: reviewer ? { disputeId: dispute.id } : { disputeId: dispute.id, kind: In(['complaint', 'response', 'evidence', 'evidence_request', 'decision']) },
          order: { createdAt: 'ASC' },
        })
      : [];
    const attachmentIds = [...(declaration?.attachmentIds ?? []), ...entries.flatMap((e) => e.attachmentIds)];
    const files = attachmentIds.length ? await this.attachments.find({ where: { id: In(attachmentIds) } }) : [];
    const people = await this.people([tx.clientId, tx.providerId]);

    const breakdown = computeSettlement({
      gross: tx.amount,
      processingFee: tx.processingFeeAmount,
      commissionRateBps: tx.commissionRateBps,
      refunded: tx.refundedAmount,
    });
    // Le client voit le montant payé et les remboursements ; la commission et les frais concernent le prestataire et QIAO.
    const financial =
      role === 'client'
        ? { gross: tx.amount, refunded: tx.refundedAmount, currency: tx.currency }
        : { ...breakdown, commissionRateBps: tx.commissionRateBps, processingFee: tx.processingFeeAmount, paidOut: tx.paidOutAmount, currency: tx.currency };

    return {
      ...this.summary(tx, role, people),
      description: tx.description,
      providerTerms: tx.providerTerms,
      expectedDeliveryDate: tx.expectedDeliveryDate,
      requestedAmount: tx.requestedAmount,
      financial,
      timestamps: {
        acceptedAt: tx.acceptedAt,
        paidAt: tx.paidAt,
        startedAt: tx.startedAt,
        completionDeclaredAt: tx.completionDeclaredAt,
        protectionPeriodStartedAt: tx.protectionPeriodStartedAt,
        protectionDeadlineAt: tx.protectionDeadlineAt,
        clientConfirmationAt: tx.clientConfirmationAt,
        disputeSubmittedAt: tx.disputeSubmittedAt,
        payoutAuthorizedAt: tx.payoutAuthorizedAt,
        payoutCompletedAt: tx.payoutCompletedAt,
        refundCompletedAt: tx.refundCompletedAt,
        cancelledAt: tx.cancelledAt,
      },
      deadlinePassed: deadlinePassed(tx),
      cancellationReason: tx.cancellationReason,
      paymentFailureReason: tx.paymentFailureReason,
      settlementProposal: tx.settlementProposal,
      // Les parties sont informées d'un blocage, sans le détail d'une éventuelle enquête.
      payoutHoldReason: reviewer ? tx.payoutHoldReason : null,
      interventionReason: reviewer ? tx.interventionReason : null,
      releaseBlockedReason: reviewer || role === 'provider' ? tx.releaseBlockedReason : null,
      declaration: declaration
        ? { details: declaration.details, declaredAt: declaration.declaredAt, attachmentIds: declaration.attachmentIds }
        : null,
      dispute: dispute
        ? {
            id: dispute.id,
            reason: dispute.reason,
            description: dispute.description,
            expectedResolution: dispute.expectedResolution,
            requestedRefundAmount: dispute.requestedRefundAmount,
            status: dispute.status,
            submittedAt: dispute.submittedAt,
            openedFromStatus: dispute.openedFromStatus,
            reviewerName: reviewer ? dispute.reviewerName : null,
            reviewStartedAt: dispute.reviewStartedAt,
            evidenceRequestedFrom: dispute.evidenceRequestedFrom,
            evidenceRequestMessage: dispute.evidenceRequestMessage,
            providerRespondedAt: dispute.providerRespondedAt,
            outcome: dispute.outcome,
            decisionRefundAmount: dispute.decisionRefundAmount,
            decisionRationale: dispute.decisionRationale,
            decidedAt: dispute.decidedAt,
            decidedByName: reviewer ? dispute.decidedByName : null,
            entries: entries.map((e) => ({
              id: e.id,
              authorRole: e.authorRole,
              authorName: e.authorRole === 'reviewer' && !reviewer ? 'Équipe QIAO' : e.authorName,
              kind: e.kind,
              message: e.message,
              attachmentIds: e.attachmentIds,
              createdAt: e.createdAt,
            })),
          }
        : null,
      refunds: refunds.map((r) => ({
        id: r.id,
        source: r.source,
        amount: r.amount,
        status: r.status,
        approvedAt: r.approvedAt,
        submittedAt: r.submittedAt,
        completedAt: r.completedAt,
        failureReason: reviewer ? r.failureReason : null,
        ...(reviewer ? { attempt: r.attempt, providerRef: r.providerRef, approvedByName: r.approvedByName, lastError: r.lastError } : {}),
      })),
      payout:
        payout && role !== 'client'
          ? {
              amount: payout.amount,
              commissionAmount: payout.commissionAmount,
              processingFeeAmount: payout.processingFeeAmount,
              status: payout.status,
              basis: payout.basis,
              authorizedAt: payout.authorizedAt,
              submittedAt: payout.submittedAt,
              completedAt: payout.completedAt,
              failureReason: payout.failureReason,
              ...(reviewer ? { attempt: payout.attempt, providerRef: payout.providerRef, lastError: payout.lastError } : {}),
            }
          : null,
      attachments: files.map((f) => ({ id: f.id, name: f.originalName, mime: f.mime, size: f.size })),
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        actorRole: e.actorRole,
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        message: e.message,
        internal: e.internal,
        createdAt: e.createdAt,
      })),
      ...(reviewer
        ? {
            paymentProvider: tx.paymentProvider,
            paymentRef: tx.paymentRef,
            checkoutRef: tx.checkoutRef,
            payoutAccount: account ? { status: account.status, provider: account.provider, accountRef: account.accountRef } : null,
            ledger,
          }
        : {}),
    };
  }
}
