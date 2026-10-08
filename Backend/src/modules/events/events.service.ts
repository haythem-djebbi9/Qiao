import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { isAllFilter, matchesQuery } from '../../common/text';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { EventRegistration, QiaoEvent } from './event.entity';
import { EventsQueryDto, RegisterEventDto } from './events.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(QiaoEvent) private readonly events: Repository<QiaoEvent>,
    @InjectRepository(EventRegistration) private readonly registrations: Repository<EventRegistration>,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: EventsQueryDto, user: User | null) {
    const events = await this.events.find({ order: { startDate: 'ASC' } });
    const counts = await this.registrationCounts();
    const mine = user ? await this.registeredEventIds(user) : new Set<string>();

    return events
      .filter((event) => !query.placement || event.placements.includes(query.placement))
      .filter((event) => isAllFilter(query.category) || event.categoryKey === query.category)
      .filter((event) =>
        matchesQuery(query.q, event.title, event.location, event.category, event.description, event.country),
      )
      .map((event) => ({
        ...event,
        registrationsCount: counts.get(event.id) ?? 0,
        isRegistered: mine.has(event.id),
      }));
  }

  async register(eventId: string, dto: RegisterEventDto, user: User | null) {
    const event = await this.events.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Événement introuvable.');
    if (event.startDate < new Date().toISOString().slice(0, 10)) {
      throw new ConflictException('Cet événement est terminé : les inscriptions sont closes.');
    }

    const email = dto.email.trim().toLowerCase();
    const already = await this.registrations.exist({ where: { event: { id: eventId }, email } });
    if (already) {
      throw new ConflictException('Cette adresse e-mail est déjà inscrite à cet événement.');
    }

    if (event.capacity > 0) {
      const count = await this.registrations.count({ where: { event: { id: eventId } } });
      if (count >= event.capacity) {
        throw new ConflictException('Cet événement est complet. Inscrivez-vous aux invitations pour la prochaine édition.');
      }
    }

    const registration = await this.registrations.save(
      this.registrations.create({
        event: { id: eventId } as QiaoEvent,
        fullName: dto.fullName.trim(),
        email,
        companyRole: dto.companyRole.trim(),
        badgeCode: `QIAO-${randomBytes(3).toString('hex').toUpperCase()}`,
        user: user ? ({ id: user.id } as User) : null,
      }),
    );

    await this.notifications.notify(
      user,
      `Inscription confirmée : ${event.title}`,
      `${event.dateRange} ${event.monthYear} — ${event.location}. Votre badge : ${registration.badgeCode}.`,
      'event',
      'dashboard',
    );

    return {
      id: registration.id,
      badgeCode: registration.badgeCode,
      event: { id: event.id, title: event.title, dateRange: event.dateRange, monthYear: event.monthYear, location: event.location },
    };
  }

  async listForUser(user: User) {
    const registrations = await this.registrations.find({
      where: [{ user: { id: user.id } }, { email: user.email }],
      relations: { event: true },
      order: { createdAt: 'DESC' },
    });
    return registrations.map((r) => ({
      id: r.id,
      badgeCode: r.badgeCode,
      createdAt: r.createdAt,
      event: r.event,
    }));
  }

  private async registrationCounts(): Promise<Map<string, number>> {
    const rows: { eventId: string; count: string }[] = await this.registrations
      .createQueryBuilder('r')
      .select('r.eventId', 'eventId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.eventId')
      .getRawMany();
    return new Map(rows.map((row) => [row.eventId, Number(row.count)]));
  }

  private async registeredEventIds(user: User): Promise<Set<string>> {
    const rows = await this.registrations.find({
      where: [{ user: { id: user.id } }, { email: user.email }],
      relations: { event: true },
    });
    return new Set(rows.map((r) => r.event.id));
  }
}
