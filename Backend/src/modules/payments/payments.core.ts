import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { LedgerEntry, LedgerEventType, PartyRole, ServiceTransaction, TransactionEvent, TransactionStatus } from './payments.entities';
import { computeSettlement } from './payments.policy';

export interface Actor {
  id: string | null;
  role: PartyRole;
  name?: string;
}

export const SYSTEM: Actor = { id: null, role: 'system', name: 'Système QIAO' };
export const PSP: Actor = { id: null, role: 'payment_provider', name: 'Prestataire de paiement' };

/** Transitions autorisées : toute autre transition est refusée, même si une règle métier l'oublie. */
const TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  REQUESTED: ['PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_PENDING: ['PAID_HELD', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PAYMENT_PENDING', 'PAID_HELD', 'CANCELLED'],
  PAID_HELD: ['IN_PROGRESS', 'COMPLETION_DECLARED', 'DISPUTED', 'REFUND_APPROVED'],
  IN_PROGRESS: ['COMPLETION_DECLARED', 'DISPUTED', 'REFUND_APPROVED'],
  COMPLETION_DECLARED: ['PROTECTION_PERIOD'],
  PROTECTION_PERIOD: ['DISPUTED', 'REFUND_APPROVED', 'PAYOUT_PENDING'],
  DISPUTED: ['UNDER_REVIEW', 'ADDITIONAL_EVIDENCE_REQUIRED', 'REFUND_APPROVED', 'DISPUTE_REJECTED'],
  UNDER_REVIEW: ['ADDITIONAL_EVIDENCE_REQUIRED', 'REFUND_APPROVED', 'DISPUTE_REJECTED'],
  ADDITIONAL_EVIDENCE_REQUIRED: ['UNDER_REVIEW', 'REFUND_APPROVED', 'DISPUTE_REJECTED'],
  REFUND_APPROVED: ['REFUND_PROCESSING'],
  REFUND_PROCESSING: ['REFUNDED', 'PARTIALLY_REFUNDED', 'REFUND_FAILED'],
  REFUND_FAILED: ['REFUND_PROCESSING'],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ['PAYOUT_PENDING'],
  DISPUTE_REJECTED: ['PAYOUT_PENDING'],
  PAYOUT_PENDING: ['PAYOUT_PROCESSING'],
  PAYOUT_PROCESSING: ['PAID_OUT', 'PAYOUT_FAILED'],
  PAYOUT_FAILED: ['PAYOUT_PROCESSING'],
  PAID_OUT: [],
  CANCELLED: [],
};

/** États dans lesquels un litige est ouvert et non tranché : tout versement est bloqué. */
export const DISPUTE_OPEN_STATES: TransactionStatus[] = ['DISPUTED', 'UNDER_REVIEW', 'ADDITIONAL_EVIDENCE_REQUIRED'];

/** Socle commun : verrouillage de la transaction, transitions contrôlées, historique et grand livre. */
@Injectable()
export class PaymentsCore {
  constructor(readonly dataSource: DataSource) {}

  /**
   * Exécute une opération sur une transaction verrouillée (SELECT ... FOR UPDATE) dans une transaction SQL :
   * deux requêtes concurrentes (double clic, webhook rejoué, planificateur sur plusieurs instances) sont sérialisées.
   */
  withLock<T>(id: string, fn: (tx: ServiceTransaction, m: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (m) => {
      const tx = await m.findOne(ServiceTransaction, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!tx) throw new NotFoundException('Transaction introuvable.');
      return fn(tx, m);
    });
  }

  async transition(
    m: EntityManager,
    tx: ServiceTransaction,
    to: TransactionStatus,
    actor: Actor,
    type: string,
    message?: string | null,
    details: Record<string, unknown> = {},
  ) {
    const from = tx.status;
    if (!TRANSITIONS[from].includes(to)) {
      throw new ConflictException(`Action impossible : la transaction est à l'état ${from}.`);
    }
    tx.status = to;
    await m.save(ServiceTransaction, tx);
    await this.log(m, tx, actor, type, { from, to, message, details });
  }

  log(
    m: EntityManager,
    tx: ServiceTransaction,
    actor: Actor,
    type: string,
    options: { from?: TransactionStatus | null; to?: TransactionStatus | null; message?: string | null; details?: Record<string, unknown>; internal?: boolean } = {},
  ) {
    return m.insert(TransactionEvent, {
      transactionId: tx.id,
      actorId: actor.id,
      actorRole: actor.role,
      type,
      fromStatus: options.from ?? null,
      toStatus: options.to ?? null,
      message: options.message?.slice(0, 500) ?? null,
      details: (options.details ?? {}) as never,
      internal: options.internal ?? false,
    });
  }

  /**
   * Écriture au grand livre (insertion seule). La clé d'idempotence est unique : un événement rejoué
   * (webhook renvoyé, requête répétée) n'est jamais comptabilisé deux fois.
   */
  async ledger(
    m: EntityManager,
    tx: ServiceTransaction,
    eventType: LedgerEventType,
    entry: {
      amount: number;
      status: LedgerEntry['eventStatus'];
      idempotencyKey: string;
      providerRef?: string | null;
      disputeId?: string | null;
      decisionRef?: string | null;
      actorId?: string | null;
      note?: string | null;
    },
  ) {
    const breakdown = computeSettlement({
      gross: tx.amount,
      processingFee: tx.processingFeeAmount,
      commissionRateBps: tx.commissionRateBps,
      refunded: tx.refundedAmount,
    });
    const released = tx.paidOutAmount > 0 ? breakdown.releasable : 0;
    await m
      .createQueryBuilder()
      .insert()
      .into(LedgerEntry)
      .values({
        transactionId: tx.id,
        clientId: tx.clientId,
        providerId: tx.providerId,
        eventType,
        eventStatus: entry.status,
        currency: tx.currency,
        amount: entry.amount,
        grossAmount: tx.amount,
        commissionAmount: breakdown.commission,
        processingFeeAmount: tx.processingFeeAmount,
        heldAmount: tx.paidAt ? Math.max(0, tx.amount - tx.refundedAmount - released) : 0,
        refundAmount: tx.refundedAmount,
        providerPayoutAmount: tx.paidOutAmount || (tx.paidAt ? breakdown.payout : 0),
        paymentProviderRef: entry.providerRef ?? tx.paymentRef,
        disputeId: entry.disputeId ?? null,
        decisionRef: entry.decisionRef ?? null,
        actorId: entry.actorId ?? null,
        note: entry.note?.slice(0, 300) ?? null,
        idempotencyKey: entry.idempotencyKey,
      })
      .orIgnore()
      .execute();
  }
}
