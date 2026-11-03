import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { isAllFilter, matchesQuery } from '../../common/text';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { EventRegistration, QiaoEvent, RegistrationStatus, eventFormat } from './event.entity';
import { EventsQueryDto, RegisterEventDto } from './events.dto';

const MONTHS = ['JANV', 'FÉVR', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];

/** Libellés affichés sur les cartes (« 15 - 19 » / « OCT 2026 ») calculés depuis les dates. */
export function dateLabels(startDate: string, endDate: string | null) {
  const [year, month, day] = startDate.split('-');
  const monthYear = `${MONTHS[Number(month) - 1]} ${year}`;
  if (!endDate || endDate === startDate) return { dateRange: day, monthYear };
  const [endYear, endMonth, endDay] = endDate.split('-');
  if (endYear === year && endMonth === month) return { dateRange: `${day} - ${endDay}`, monthYear };
  return { dateRange: `${day}/${month} - ${endDay}/${endMonth}`, monthYear };
}

export const today = () => new Date().toISOString().slice(0, 10);

/** Inscriptions closes : fermées par l'administration ou événement commencé. */
export const registrationClosed = (event: Pick<QiaoEvent, 'registrationOpen' | 'startDate'>) => !event.registrationOpen || event.startDate < today();

export const newBadgeCode = () => `QIAO-${randomBytes(3).toString('hex').toUpperCase()}`;

export interface SeatCounts {
  confirmed: number;
  waitlisted: number;
}

/** Fiche publique : jamais le lien de connexion (réservé aux inscrits confirmés, dans Mon espace). */
export function publicEvent(event: QiaoEvent) {
  const { onlineUrl, registrations, ...rest } = event;
  return { ...rest, format: eventFormat(event) };
}

/** Verrouille la ligne de l'événement le temps de compter les places (pas de surréservation en cas d'inscriptions simultanées). */
export function lockEvent(manager: EntityManager, id: string) {
  return manager.getRepository(QiaoEvent).findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
}

export function confirmedCount(manager: EntityManager, eventId: string) {
  return manager.getRepository(EventRegistration).count({ where: { event: { id: eventId }, status: 'confirmed' } });
}

/** Place disponible → confirmée ; événement complet → liste d'attente. */
export async function seatStatus(manager: EntityManager, event: QiaoEvent): Promise<RegistrationStatus> {
  if (event.capacity === 0) return 'confirmed';
  return (await confirmedCount(manager, event.id)) < event.capacity ? 'confirmed' : 'waitlisted';
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(QiaoEvent) private readonly events: Repository<QiaoEvent>,
    @InjectRepository(EventRegistration) private readonly registrations: Repository<EventRegistration>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async list(query: EventsQueryDto, user: User | null) {
    const events = await this.events.find({ where: { status: 'published' }, order: { startDate: 'ASC' } });
    const counts = await this.seatCounts();
    const mine = user ? await this.myStatuses(user) : new Map<string, RegistrationStatus>();

    return events
      .filter((event) => !query.placement || event.placements.includes(query.placement))
      .filter((event) => isAllFilter(query.category) || event.categoryKey === query.category)
      .filter((event) =>
        matchesQuery(query.q, event.title, event.location, event.category, event.description, event.country),
      )
      .map((event) => {
        const seats = counts.get(event.id) ?? { confirmed: 0, waitlisted: 0 };
        const status = mine.get(event.id) ?? null;
        return {
          ...publicEvent(event),
          registrationsCount: seats.confirmed,
          waitlistCount: seats.waitlisted,
          isFull: event.capacity > 0 && seats.confirmed >= event.capacity,
          registrationClosed: registrationClosed(event),
          isRegistered: status !== null,
          myRegistrationStatus: status,
        };
      });
  }

  async register(eventId: string, dto: RegisterEventDto, user: User | null) {
    const email = dto.email.trim().toLowerCase();
    const { event, registration, status } = await this.dataSource.transaction(async (manager) => {
      const event = await lockEvent(manager, eventId);
      if (!event || event.status !== 'published') throw new NotFoundException('Événement introuvable.');
      if (event.startDate < today()) {
        throw new ConflictException('Cet événement est terminé : les inscriptions sont closes.');
      }
      if (!event.registrationOpen) {
        throw new ConflictException('Les inscriptions à cet événement sont fermées.');
      }

      const repo = manager.getRepository(EventRegistration);
      const existing = await repo.findOne({ where: { event: { id: eventId }, email } });
      if (existing && existing.status !== 'cancelled') {
        throw new ConflictException(
          existing.status === 'waitlisted'
            ? "Cette adresse e-mail est déjà sur la liste d'attente de cet événement."
            : 'Cette adresse e-mail est déjà inscrite à cet événement.',
        );
      }

      const status = await seatStatus(manager, event);
      const fields = {
        fullName: dto.fullName.trim(),
        companyRole: dto.companyRole.trim(),
        user: user ? ({ id: user.id } as User) : null,
        status,
        confirmedAt: status === 'confirmed' ? new Date() : null,
        cancelledAt: null,
        checkedInAt: null,
      };
      // Réinscription après annulation : même ligne (adresse unique par événement), même badge.
      const registration = existing
        ? await repo.save(Object.assign(existing, fields))
        : await repo.save(repo.create({ ...fields, event: { id: eventId } as QiaoEvent, email, badgeCode: newBadgeCode(), source: 'public' }));
      return { event, registration, status };
    });

    await this.notifications.notify(
      user,
      status === 'confirmed' ? `Inscription confirmée : ${event.title}` : `Liste d'attente : ${event.title}`,
      status === 'confirmed'
        ? `${event.dateRange} ${event.monthYear} — ${event.location}. Votre badge : ${registration.badgeCode}.`
        : "L'événement est complet : vous êtes sur liste d'attente. Vous serez prévenu si une place se libère.",
      'event',
      'dashboard/events',
    );

    return {
      id: registration.id,
      badgeCode: registration.badgeCode,
      status,
      event: { id: event.id, title: event.title, dateRange: event.dateRange, monthYear: event.monthYear, location: event.location },
    };
  }

  /** Inscriptions du membre (hors annulées) ; lien de connexion communiqué aux seuls inscrits confirmés. */
  async listForUser(user: User) {
    const registrations = await this.registrations.find({
      where: [
        { user: { id: user.id }, status: Not('cancelled') },
        { email: user.email, status: Not('cancelled') },
      ],
      relations: { event: true },
      order: { createdAt: 'DESC' },
    });
    return registrations.map((r) => {
      const format = eventFormat(r.event);
      return {
        id: r.id,
        badgeCode: r.badgeCode,
        status: r.status,
        createdAt: r.createdAt,
        checkedInAt: r.checkedInAt,
        event: {
          ...publicEvent(r.event),
          onlineUrl: r.status === 'confirmed' && format !== 'onsite' ? r.event.onlineUrl : null,
        },
      };
    });
  }

  /** Annulation par le membre depuis Mon espace : la place est libérée (l'administration confirme la liste d'attente). */
  async cancelMine(user: User, registrationId: string) {
    const registration = await this.registrations.findOne({ where: { id: registrationId }, relations: { event: true, user: true } });
    if (!registration || registration.status === 'cancelled') throw new NotFoundException('Inscription introuvable.');
    if (registration.user?.id !== user.id && registration.email !== user.email.toLowerCase()) {
      throw new ForbiddenException('Cette inscription ne vous appartient pas.');
    }
    if (registration.event.startDate < today()) {
      throw new ConflictException("L'événement a commencé : l'inscription ne peut plus être annulée.");
    }
    await this.registrations.update(registrationId, { status: 'cancelled', cancelledAt: new Date() });
    await this.audit.log(
      user,
      'events.registration.cancel',
      { type: 'event_registration', id: registrationId, label: `${registration.fullName} → ${registration.event.title}` },
      { eventId: registration.event.id, from: registration.status, by: 'member' },
    );
    return { cancelled: true };
  }

  async seatCounts(eventIds?: string[]): Promise<Map<string, SeatCounts>> {
    if (eventIds && eventIds.length === 0) return new Map();
    const query = this.registrations
      .createQueryBuilder('r')
      .select('r.eventId', 'eventId')
      .addSelect(`SUM(CASE WHEN r.status = 'confirmed' THEN 1 ELSE 0 END)`, 'confirmed')
      .addSelect(`SUM(CASE WHEN r.status = 'waitlisted' THEN 1 ELSE 0 END)`, 'waitlisted')
      .groupBy('r.eventId');
    if (eventIds) query.where('r.eventId IN (:...eventIds)', { eventIds });
    const rows: { eventId: string; confirmed: string; waitlisted: string }[] = await query.getRawMany();
    return new Map(rows.map((row) => [row.eventId, { confirmed: Number(row.confirmed), waitlisted: Number(row.waitlisted) }]));
  }

  private async myStatuses(user: User): Promise<Map<string, RegistrationStatus>> {
    const rows = await this.registrations.find({
      where: [
        { user: { id: user.id }, status: Not('cancelled') },
        { email: user.email, status: Not('cancelled') },
      ],
      relations: { event: true },
    });
    return new Map(rows.map((r) => [r.event.id, r.status]));
  }
}
