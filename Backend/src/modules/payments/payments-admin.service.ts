import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Brackets, Repository } from 'typeorm';
import { AuditLog } from '../platform/platform.entities';
import { AuditService } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { FinancialService } from './financial.service';
import { Actor, PaymentsCore } from './payments.core';
import { AdjustmentDto, AdminQueueQuery } from './payments.dto';
import { ServiceRefund, ServiceTransaction, TransactionStatus } from './payments.entities';
import { formatMoney, parsePartialAmount } from './payments.policy';
import { PaymentsViews } from './payments.views';

/** Files de traitement du tableau de bord QIAO (§9). */
const QUEUE_STATES: Record<string, TransactionStatus[]> = {
  awaiting_payment: ['REQUESTED', 'PAYMENT_PENDING', 'PAYMENT_FAILED'],
  awaiting_completion: ['PAID_HELD', 'IN_PROGRESS'],
  protection_period: ['PROTECTION_PERIOD'],
  disputes_review: ['DISPUTED', 'UNDER_REVIEW'],
  disputes_evidence: ['ADDITIONAL_EVIDENCE_REQUIRED'],
  refunds_pending: ['REFUND_APPROVED', 'REFUND_PROCESSING'],
  refunds_failed: ['REFUND_FAILED'],
  payouts_pending: ['PAYOUT_PENDING', 'PAYOUT_PROCESSING', 'DISPUTE_REJECTED', 'PARTIALLY_REFUNDED'],
  payouts_failed: ['PAYOUT_FAILED'],
  closed: ['PAID_OUT', 'REFUNDED', 'CANCELLED'],
};

const PAGE_SIZE = 25;

@Injectable()
export class PaymentsAdminService {
  constructor(
    private readonly core: PaymentsCore,
    private readonly financial: FinancialService,
    private readonly views: PaymentsViews,
    private readonly audit: AuditService,
    @InjectRepository(ServiceTransaction) private readonly transactions: Repository<ServiceTransaction>,
    @InjectRepository(ServiceRefund) private readonly refunds: Repository<ServiceRefund>,
    @InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>,
  ) {}

  private actor(admin: User): Actor {
    return { id: admin.id, role: 'reviewer', name: admin.fullName };
  }

  private assertNotParty(tx: ServiceTransaction, admin: User) {
    if (tx.clientId === admin.id || tx.providerId === admin.id) {
      throw new ForbiddenException("Conflit d'intérêts : vous êtes partie à cette transaction.");
    }
  }

  async overview() {
    const counts = await this.transactions
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('t.status')
      .getRawMany<{ status: TransactionStatus; count: number }>();
    const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.count])) as Record<string, number>;
    const queues: Record<string, number> = {};
    for (const [queue, states] of Object.entries(QUEUE_STATES)) queues[queue] = states.reduce((sum, s) => sum + (byStatus[s] ?? 0), 0);
    queues.intervention = await this.transactions
      .createQueryBuilder('t')
      .where('t.requiresIntervention = true OR t.payoutHold = true OR t.releaseBlockedReason IS NOT NULL')
      .getCount();
    queues.all = counts.reduce((sum, c) => sum + c.count, 0);

    // Fonds actuellement retenus (payés, ni remboursés ni versés), par devise.
    const held = await this.transactions
      .createQueryBuilder('t')
      .select('t.currency', 'currency')
      .addSelect('SUM(t.amount - t.refundedAmount)::int', 'amount')
      .where('t.paidAt IS NOT NULL')
      .andWhere('t.status NOT IN (:...closed)', { closed: ['PAID_OUT', 'REFUNDED'] })
      .groupBy('t.currency')
      .getRawMany<{ currency: string; amount: number }>();
    const overdue = await this.transactions
      .createQueryBuilder('t')
      .where('t.status = :status', { status: 'PROTECTION_PERIOD' })
      .andWhere('t.protectionDeadlineAt <= now()')
      .getCount();
    return { queues, byStatus, held, overdueReleases: overdue };
  }

  async list(query: AdminQueueQuery) {
    const page = query.page ?? 1;
    const qb = this.transactions.createQueryBuilder('t').orderBy('t.updatedAt', 'DESC');
    const queue = query.queue ?? 'all';
    if (queue === 'intervention') {
      qb.where('(t.requiresIntervention = true OR t.payoutHold = true OR t.releaseBlockedReason IS NOT NULL)');
    } else if (queue !== 'all') {
      qb.where('t.status IN (:...states)', { states: QUEUE_STATES[queue] });
    }
    if (query.q?.trim()) {
      const q = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(new Brackets((w) => w.where('lower(t.reference) LIKE :q', { q }).orWhere('lower(t.title) LIKE :q', { q })));
    }
    const [items, total] = await qb.skip((page - 1) * PAGE_SIZE).take(PAGE_SIZE).getManyAndCount();
    const people = await this.views.people(items.flatMap((t) => [t.clientId, t.providerId]));
    return {
      items: items.map((tx) => ({ ...this.views.summary(tx, 'reviewer', people), releaseBlockedReason: tx.releaseBlockedReason, interventionReason: tx.interventionReason })),
      total,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  async detail(id: string) {
    const [view, audit] = await Promise.all([
      this.views.forReviewer(id),
      this.auditLogs.find({ where: { targetType: 'transaction', targetId: id }, order: { createdAt: 'DESC' }, take: 50 }),
    ]);
    return { ...view, audit };
  }

  /** Blocage administratif (fraude, juridique, restriction du prestataire de paiement). */
  async hold(admin: User, id: string, reason: string) {
    const tx = await this.core.withLock(id, async (tx, m) => {
      this.assertNotParty(tx, admin);
      if (['PAID_OUT', 'REFUNDED', 'CANCELLED'].includes(tx.status)) throw new ConflictException('Transaction clôturée.');
      tx.payoutHold = true;
      tx.payoutHoldReason = reason.trim();
      await m.save(ServiceTransaction, tx);
      await this.core.log(m, tx, this.actor(admin), 'payout_hold', { message: `Versement bloqué par QIAO : ${reason.trim()}`, internal: true });
      if (tx.status === 'PAYOUT_PROCESSING') {
        await this.core.log(m, tx, this.actor(admin), 'payout_hold_late', {
          message: "Le versement était déjà transmis au prestataire de paiement : le blocage s'appliquera en cas de nouvelle tentative.",
          internal: true,
        });
      }
      return tx;
    });
    await this.audit.log(admin, 'payments.hold', { type: 'transaction', id, label: tx.reference }, { reason });
    return this.detail(id);
  }

  async releaseHold(admin: User, id: string) {
    const tx = await this.core.withLock(id, async (tx, m) => {
      this.assertNotParty(tx, admin);
      if (!tx.payoutHold) throw new ConflictException('Aucun blocage actif.');
      tx.payoutHold = false;
      tx.payoutHoldReason = null;
      tx.releaseBlockedReason = null;
      await m.save(ServiceTransaction, tx);
      await this.core.log(m, tx, this.actor(admin), 'payout_hold_released', { message: 'Blocage administratif levé.', internal: true });
      return tx;
    });
    await this.audit.log(admin, 'payments.hold_release', { type: 'transaction', id, label: tx.reference });
    await this.resume(id);
    return this.detail(id);
  }

  /** Nouvelle tentative après un échec confirmé (nouvelle clé d'idempotence, jamais de double exécution). */
  async retry(admin: User, id: string, note: string) {
    const tx = await this.core.withLock(id, async (tx, m) => {
      this.assertNotParty(tx, admin);
      if (tx.status !== 'REFUND_FAILED' && tx.status !== 'PAYOUT_FAILED') throw new ConflictException('Aucune opération en échec à relancer.');
      tx.requiresIntervention = false;
      tx.interventionReason = null;
      await m.save(ServiceTransaction, tx);
      await this.core.log(m, tx, this.actor(admin), 'retry_requested', { message: `Nouvelle tentative demandée : ${note.trim()}`, internal: true });
      return tx;
    });
    await this.audit.log(admin, 'payments.retry', { type: 'transaction', id, label: tx.reference }, { status: tx.status, note });
    if (tx.status === 'REFUND_FAILED') {
      const refund = await this.refunds.findOne({ where: { transactionId: id, status: 'failed' }, order: { updatedAt: 'DESC' } });
      if (refund) await this.financial.submitRefund(refund.id);
    } else {
      await this.financial.submitPayout(id);
    }
    return this.detail(id);
  }

  /** Clôture d'une intervention manuelle (action menée hors plateforme, consignée). */
  async resolveIntervention(admin: User, id: string, note: string) {
    const tx = await this.core.withLock(id, async (tx, m) => {
      this.assertNotParty(tx, admin);
      if (!tx.requiresIntervention && !tx.releaseBlockedReason) throw new ConflictException('Aucune intervention en attente.');
      await this.core.log(m, tx, this.actor(admin), 'intervention_resolved', {
        message: `Intervention close : ${note.trim()}`,
        details: { previous: tx.interventionReason ?? tx.releaseBlockedReason },
        internal: true,
      });
      tx.requiresIntervention = false;
      tx.interventionReason = null;
      tx.releaseBlockedReason = null;
      await m.save(ServiceTransaction, tx);
      return tx;
    });
    await this.audit.log(admin, 'payments.intervention_resolve', { type: 'transaction', id, label: tx.reference }, { note });
    if (tx.status !== 'REFUND_FAILED' && tx.status !== 'PAYOUT_FAILED') await this.resume(id);
    return this.detail(id);
  }

  /** Correction comptable : écriture d'ajustement ou d'extourne, jamais modification d'une écriture existante. */
  async adjustment(admin: User, id: string, dto: AdjustmentDto) {
    const tx = await this.core.withLock(id, async (tx, m) => {
      this.assertNotParty(tx, admin);
      const amount = parsePartialAmount(dto.amount, tx.currency, tx.amount);
      await this.core.ledger(m, tx, dto.type, {
        amount,
        status: 'recorded',
        idempotencyKey: `${dto.type.toLowerCase()}:${randomUUID()}`,
        actorId: admin.id,
        decisionRef: `admin:${admin.id}`,
        note: dto.note.trim(),
      });
      await this.core.log(m, tx, this.actor(admin), 'ledger_adjustment', {
        message: `Écriture ${dto.type === 'REVERSAL' ? "d'extourne" : "d'ajustement"} de ${formatMoney(amount, tx.currency)} : ${dto.note.trim()}`,
        internal: true,
      });
      return tx;
    });
    await this.audit.log(admin, 'payments.ledger_adjustment', { type: 'transaction', id, label: tx.reference }, { type: dto.type, amount: dto.amount, note: dto.note });
    return this.detail(id);
  }

  /** Reprend le cours normal après la levée d'une restriction. */
  private async resume(id: string) {
    const tx = await this.transactions.findOne({ where: { id }, select: { id: true, status: true } });
    if (!tx) return;
    if (tx.status === 'PAYOUT_PENDING') await this.financial.submitPayout(id);
    else await this.financial.evaluateRelease(id);
  }
}
