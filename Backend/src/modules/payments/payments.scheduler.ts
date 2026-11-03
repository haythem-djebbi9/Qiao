import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { And, In, IsNull, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { FinancialService } from './financial.service';
import { ServiceTransaction } from './payments.entities';
import { PaymentsNotifier } from './payments.notifier';
import { DEADLINE_REMINDER_MS } from './payments.policy';
import { formatDeadline } from './transactions.service';

/**
 * Tâches périodiques : rappels d'échéance, libération des fonds arrivés à échéance (BR-07) et rapprochement avec le
 * prestataire de paiement. Chaque traitement verrouille la transaction : plusieurs instances peuvent tourner sans double versement.
 */
@Injectable()
export class PaymentsScheduler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('PaymentsScheduler');
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly financial: FinancialService,
    private readonly notifier: PaymentsNotifier,
    private readonly config: ConfigService,
    @InjectRepository(ServiceTransaction) private readonly transactions: Repository<ServiceTransaction>,
  ) {}

  onApplicationBootstrap() {
    const interval = Math.max(5_000, Number(this.config.get<string>('PAYMENT_SCHEDULER_INTERVAL_MS', '30000')));
    this.timer = setInterval(() => void this.tick(), interval);
    setTimeout(() => void this.tick(), 5_000).unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.sendReminders();
      await this.releaseDue();
      await this.financial.reconcile();
    } catch (err) {
      this.logger.error(`Traitement périodique interrompu : ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  /** Rappel au client 24 h avant l'échéance (une seule fois, réservé atomiquement). */
  private async sendReminders() {
    const now = new Date();
    const due = await this.transactions.find({
      where: {
        status: 'PROTECTION_PERIOD',
        deadlineReminderSentAt: IsNull(),
        protectionDeadlineAt: And(MoreThan(now), LessThanOrEqual(new Date(now.getTime() + DEADLINE_REMINDER_MS))),
      },
      take: 100,
    });
    for (const tx of due) {
      const claimed = await this.transactions
        .createQueryBuilder()
        .update()
        .set({ deadlineReminderSentAt: now })
        .where('id = :id AND "deadlineReminderSentAt" IS NULL', { id: tx.id })
        .execute();
      if (!claimed.affected) continue;
      await this.notifier.parties(tx, {
        client: {
          title: 'Fin de la période de protection imminente',
          body: `La période de protection de « ${tx.title} » se termine le ${formatDeadline(tx.protectionDeadlineAt!)}. Si la prestation ne vous convient pas, contestez-la avant cette échéance ; sinon, le paiement sera versé au prestataire.`,
          email: true,
        },
      });
    }
  }

  /** Échéances passées et décisions de libération : contrôle complet des conditions avant tout versement. */
  private async releaseDue() {
    const now = new Date();
    const candidates = await this.transactions.find({
      where: [
        { status: 'PROTECTION_PERIOD', protectionDeadlineAt: LessThanOrEqual(now) },
        { status: In(['DISPUTE_REJECTED', 'PARTIALLY_REFUNDED']) },
      ],
      select: { id: true, status: true, protectionDeadlineAt: true, releaseBlockedReason: true },
      order: { protectionDeadlineAt: 'ASC' },
      take: 100,
    });
    for (const tx of candidates) {
      if (tx.protectionDeadlineAt && tx.protectionDeadlineAt > now) continue;
      try {
        await this.financial.evaluateRelease(tx.id);
      } catch (err) {
        this.logger.warn(`Libération ${tx.id} : ${(err as Error).message}`);
      }
    }
  }
}
