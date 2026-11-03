import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { ServiceTransaction } from './payments.entities';

export interface Message {
  title: string;
  body: string;
  /** Envoyer aussi un e-mail (événements financiers importants). */
  email?: boolean;
}

export function toParty(role: 'client' | 'provider', message: Message): { client?: Message; provider?: Message } {
  return role === 'client' ? { client: message } : { provider: message };
}

/**
 * Notifications des parties et des équipes QIAO (§10). Toujours appelé après l'enregistrement en base :
 * le message reflète l'état réel (jamais « Remboursé » ou « Versé » sur la seule base d'une instruction envoyée).
 */
@Injectable()
export class PaymentsNotifier {
  private readonly logger = new Logger('PaymentsNotifier');
  private readonly publicUrl: string;

  constructor(
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    @InjectRepository(User) private readonly users: Repository<User>,
    config: ConfigService,
  ) {
    this.publicUrl = config.get<string>('PUBLIC_URL', 'http://localhost:3000').replace(/\/$/, '');
  }

  link(tx: Pick<ServiceTransaction, 'id'>) {
    return `dashboard/prestations/${tx.id}`;
  }

  async parties(tx: ServiceTransaction, messages: { client?: Message; provider?: Message }) {
    const targets: [string, Message | undefined][] = [
      [tx.clientId, messages.client],
      [tx.providerId, messages.provider],
    ];
    for (const [userId, message] of targets) {
      if (message) await this.send(userId, tx, message, this.link(tx));
    }
  }

  async admins(tx: ServiceTransaction, message: Message) {
    const admins = await this.users.find({ where: { role: 'admin', status: In(['active', 'suspended']) }, select: { id: true } });
    for (const admin of admins) {
      if (admin.id === tx.clientId || admin.id === tx.providerId) continue;
      await this.send(admin.id, tx, message, `dashboard/admin-paiements/${tx.id}`);
    }
  }

  async reviewer(userId: string, tx: ServiceTransaction, message: Message) {
    await this.send(userId, tx, message, `dashboard/admin-paiements/${tx.id}`);
  }

  private async send(userId: string, tx: ServiceTransaction, message: Message, link: string) {
    try {
      await this.notifications.notify({ id: userId } as User, message.title, message.body, 'payment', link, {
        kind: 'payment',
        targetType: 'transaction',
        targetId: tx.id,
      });
      if (message.email) {
        const user = await this.users.findOne({ where: { id: userId }, select: { id: true, email: true, fullName: true } });
        if (user) {
          await this.mail.send(
            user.email,
            `${message.title} — ${tx.reference}`,
            `Bonjour ${user.fullName},\n\n${message.body}\n\nTransaction ${tx.reference} : ${this.publicUrl}/?tab=dashboard&dv=${encodeURIComponent(link.replace(/^dashboard\//, ''))}\n\nL'équipe QIAO`,
          );
        }
      }
    } catch (err) {
      // Une notification manquée ne doit jamais annuler une opération financière déjà enregistrée.
      this.logger.warn(`Notification ${tx.reference} non envoyée : ${(err as Error).message}`);
    }
  }
}
