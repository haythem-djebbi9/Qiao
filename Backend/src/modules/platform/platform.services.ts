import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { ActivityEvent, ActivityType, AuditLog } from './platform.entities';

const today = () => new Date().toISOString().slice(0, 10);

/** Événements internes diffusés entre modules (canaux externes comme WeChat, sans dépendance circulaire). */
export interface PlatformEventMap {
  /** Message privé enregistré dans une conversation QIAO Community. */
  'message.sent': {
    messageId: string;
    conversationId: string;
    authorId: string;
    authorName: string;
    recipientId: string;
    body: string;
    source: 'web' | 'wechat';
  };
  /** Notification enregistrée pour un membre (paiements, Community, rendez-vous...). */
  'notification.created': { userId: string; title: string; body: string; link: string | null; type: string; kind: string | null };
}

type PlatformEventHandler<K extends keyof PlatformEventMap> = (payload: PlatformEventMap[K]) => unknown;

@Injectable()
export class PlatformEvents {
  private readonly logger = new Logger('PlatformEvents');
  private readonly handlers = new Map<keyof PlatformEventMap, Set<PlatformEventHandler<never>>>();

  on<K extends keyof PlatformEventMap>(event: K, handler: PlatformEventHandler<K>) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler as PlatformEventHandler<never>);
  }

  /** Diffusion asynchrone, après l'action métier : un abonné en échec ne l'annule jamais. */
  emit<K extends keyof PlatformEventMap>(event: K, payload: PlatformEventMap[K]) {
    for (const handler of this.handlers.get(event) ?? []) {
      Promise.resolve()
        .then(() => (handler as PlatformEventHandler<K>)(payload))
        .catch((err) => this.logger.warn(`Abonné ${event} en échec : ${(err as Error).message}`));
    }
  }
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger('Activity');

  constructor(@InjectRepository(ActivityEvent) private readonly events: Repository<ActivityEvent>) {}

  /** Enregistre un événement d'usage ; une erreur d'analytique ne bloque jamais l'action métier. */
  async record(type: ActivityType, userId: string | null, target?: { type: string; id: string }) {
    try {
      await this.events.insert({
        type,
        userId,
        targetType: target?.type ?? null,
        targetId: target?.id ?? null,
        day: today(),
      });
    } catch (err) {
      this.logger.warn(`Événement ${type} non enregistré : ${(err as Error).message}`);
    }
  }

  /** Visite de Community : une seule par membre et par jour. */
  async recordVisit(userId: string) {
    const exists = await this.events.exist({ where: { type: 'community_visit', userId, day: today() } });
    if (!exists) await this.record('community_visit', userId);
  }
}

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>) {}

  async log(
    actor: Pick<User, 'id' | 'fullName'> | null,
    action: string,
    target: { type: string; id: string; label?: string | null },
    details: Record<string, unknown> = {},
  ) {
    await this.logs.insert({
      actorId: actor?.id ?? null,
      actorName: actor?.fullName ?? 'Système',
      action,
      targetType: target.type,
      targetId: target.id,
      targetLabel: target.label ?? null,
      details: details as never,
    });
  }

  list(options: { page: number; limit: number; action?: string; targetType?: string }) {
    const query = this.logs.createQueryBuilder('log').orderBy('log.createdAt', 'DESC');
    if (options.action) query.andWhere('log.action LIKE :action', { action: `${options.action}%` });
    if (options.targetType) query.andWhere('log.targetType = :targetType', { targetType: options.targetType });
    return query
      .skip((options.page - 1) * options.limit)
      .take(options.limit)
      .getManyAndCount()
      .then(([items, total]) => ({ items, total }));
  }
}

/**
 * Limiteur de débit en mémoire (fenêtre glissante simple) pour les actions sensibles :
 * connexion, inscription, publication, messages, signalements.
 */
@Injectable()
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  hit(key: string, limit: number, windowMs: number, message = 'Trop de tentatives. Réessayez dans quelques minutes.') {
    const now = Date.now();
    const recent = (this.hits.get(key) ?? []).filter((time) => now - time < windowMs);
    if (recent.length >= limit) {
      this.hits.set(key, recent);
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.prune(now, windowMs);
  }

  reset(key: string) {
    this.hits.delete(key);
  }

  private prune(now: number, windowMs: number) {
    for (const [key, times] of this.hits) {
      if (times.every((time) => now - time >= windowMs)) this.hits.delete(key);
    }
  }
}

/**
 * Envoi d'e-mails transactionnels (réinitialisation de mot de passe).
 * Sans configuration SMTP, le message est écrit dans les journaux du serveur (développement).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: Number(config.get<string>('SMTP_PORT', '587')),
          secure: config.get<string>('SMTP_SECURE') === 'true',
          auth: config.get<string>('SMTP_USER')
            ? { user: config.get<string>('SMTP_USER'), pass: config.get<string>('SMTP_PASS') }
            : undefined,
        })
      : null;
  }

  get enabled() {
    return this.transporter !== null;
  }

  async send(to: string, subject: string, text: string) {
    if (!this.transporter) {
      this.logger.log(`[SMTP non configuré] E-mail pour ${to} — ${subject}\n${text}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM', 'QIAO <no-reply@qiao.tn>'),
      to,
      subject,
      text,
    });
  }
}
