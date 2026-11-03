import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { normalize, slugify } from '../../common/text';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { EventRegistration, EventStatus, QiaoEvent, RegistrationStatus, eventFormat } from './event.entity';
import {
  AdminEventsQueryDto,
  AdminRegistrationDto,
  EventDto,
  EventsAuditQueryDto,
  RegistrationsQueryDto,
  UpdateEventDto,
  UpdateRegistrationDto,
} from './events.dto';
import { EventsService, confirmedCount, dateLabels, lockEvent, newBadgeCode, registrationClosed, seatStatus, today } from './events.service';

type Admin = Pick<User, 'id' | 'fullName'>;

const DEFAULT_EVENT_IMAGE = 'asset:evenements_hero_panorama_1791400498744.jpg';
const STATUS_ACTIONS: Record<EventStatus, string> = { published: 'publish', draft: 'unpublish', archived: 'archive' };
const REGISTRATION_ACTIONS: Record<RegistrationStatus, string> = { confirmed: 'confirm', waitlisted: 'waitlist', cancelled: 'cancel' };

const clean = (value: string | null | undefined) => (value ?? '').trim() || null;

/** Administration des événements QIAO : fiches, publication, inscrits et places. Chaque action est journalisée (events.*). */
@Injectable()
export class EventsAdminService {
  constructor(
    @InjectRepository(QiaoEvent) private readonly events: Repository<QiaoEvent>,
    @InjectRepository(EventRegistration) private readonly registrations: Repository<EventRegistration>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly publicEvents: EventsService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // ==========================================================================
  // Vue d'ensemble
  // ==========================================================================

  async overview() {
    const [statusRows, registrationRows, upcoming] = await Promise.all([
      this.events
        .createQueryBuilder('e')
        .select('e.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('e.status')
        .getRawMany<{ status: EventStatus; count: string }>(),
      this.registrations
        .createQueryBuilder('r')
        .select('r.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(CASE WHEN r.checkedInAt IS NOT NULL THEN 1 ELSE 0 END)', 'present')
        .groupBy('r.status')
        .getRawMany<{ status: RegistrationStatus; count: string; present: string }>(),
      this.events
        .createQueryBuilder('e')
        .where('e.status = :status', { status: 'published' })
        .andWhere('COALESCE(e.endDate, e.startDate) >= :today', { today: today() })
        .orderBy('e.startDate', 'ASC')
        .take(5)
        .getMany(),
    ]);
    const events = { draft: 0, published: 0, archived: 0, total: 0 };
    for (const row of statusRows) {
      events[row.status] = Number(row.count);
      events.total += Number(row.count);
    }
    const registrations = { confirmed: 0, waitlisted: 0, cancelled: 0, present: 0 };
    for (const row of registrationRows) {
      registrations[row.status] = Number(row.count);
      registrations.present += Number(row.present ?? 0);
    }
    const seats = await this.publicEvents.seatCounts(upcoming.map((e) => e.id));
    return {
      events,
      registrations,
      upcoming: upcoming.map((event) => this.withStats(event, seats.get(event.id))),
    };
  }

  // ==========================================================================
  // Événements
  // ==========================================================================

  async listEvents(query: AdminEventsQueryDto) {
    const all = await this.events.find({ order: { startDate: 'DESC' } });
    const now = today();
    const items = all.filter(
      (e) =>
        (!query.status || query.status === 'all' || e.status === query.status) &&
        (!query.period || query.period === 'all' || (query.period === 'upcoming') === ((e.endDate ?? e.startDate) >= now)) &&
        (!query.q || normalize(`${e.title} ${e.location} ${e.category} ${e.id}`).includes(normalize(query.q))),
    );
    const seats = await this.publicEvents.seatCounts(items.map((e) => e.id));
    return items.map((event) => this.withStats(event, seats.get(event.id)));
  }

  async getEvent(id: string) {
    const event = await this.findEvent(id);
    const seats = await this.publicEvents.seatCounts([id]);
    const cancelled = await this.registrations.count({ where: { event: { id }, status: 'cancelled' } });
    const present = await this.registrations
      .createQueryBuilder('r')
      .where('r.eventId = :id', { id })
      .andWhere('r.checkedInAt IS NOT NULL')
      .getCount();
    const view = this.withStats(event, seats.get(id));
    return { ...view, stats: { ...view.stats, cancelled, present } };
  }

  async createEvent(admin: Admin, dto: EventDto) {
    this.assertDates(dto.startDate, dto.endDate ?? null);
    // Identifiant lisible daté (« forum-chine-tunisie-2027 ») ; l'année n'est ajoutée que si le titre ne la contient pas.
    const slug = slugify(dto.title).slice(0, 70) || 'evenement';
    const year = dto.startDate.slice(0, 4);
    const id = await this.uniqueId(slug.includes(year) ? slug : `${slug}-${year}`);
    const event = await this.events.save(
      this.events.create({
        id,
        title: dto.title.trim(),
        category: dto.category.trim(),
        categoryKey: dto.categoryKey,
        startDate: dto.startDate,
        endDate: clean(dto.endDate),
        ...dateLabels(dto.startDate, clean(dto.endDate)),
        time: dto.time.trim(),
        format: dto.format,
        isOnline: dto.format === 'online',
        location: dto.location.trim(),
        country: dto.country.trim(),
        onlineUrl: dto.format === 'onsite' ? null : clean(dto.onlineUrl),
        priceLabel: clean(dto.priceLabel),
        image: clean(dto.image) ?? DEFAULT_EVENT_IMAGE,
        description: dto.description.trim(),
        details: dto.details ? this.cleanDetails(dto.details) : null,
        placements: dto.placements,
        capacity: dto.capacity,
        registrationOpen: dto.registrationOpen ?? true,
        status: 'draft',
        publishedAt: null,
      }),
    );
    await this.audit.log(admin, 'events.event.create', { type: 'event', id: event.id, label: event.title }, { startDate: event.startDate, capacity: event.capacity });
    return this.getEvent(event.id);
  }

  async updateEvent(admin: Admin, id: string, dto: UpdateEventDto) {
    return this.dataSource.transaction(async (manager) => {
      const event = await lockEvent(manager, id);
      if (!event) throw new NotFoundException('Événement introuvable.');
      const before = { ...event };
      const patch: Partial<QiaoEvent> = {};
      if (dto.title !== undefined) patch.title = dto.title.trim();
      if (dto.category !== undefined) patch.category = dto.category.trim();
      if (dto.categoryKey !== undefined) patch.categoryKey = dto.categoryKey;
      if (dto.startDate !== undefined) patch.startDate = dto.startDate;
      if (dto.endDate !== undefined) patch.endDate = clean(dto.endDate);
      if (patch.startDate !== undefined || patch.endDate !== undefined) {
        const start = patch.startDate ?? event.startDate;
        const end = patch.endDate !== undefined ? patch.endDate : event.endDate;
        this.assertDates(start, end);
        Object.assign(patch, dateLabels(start, end));
      }
      if (dto.time !== undefined) patch.time = dto.time.trim();
      if (dto.format !== undefined) {
        patch.format = dto.format;
        patch.isOnline = dto.format === 'online';
      }
      if (dto.location !== undefined) patch.location = dto.location.trim();
      if (dto.country !== undefined) patch.country = dto.country.trim();
      if (dto.onlineUrl !== undefined) patch.onlineUrl = clean(dto.onlineUrl);
      if ((patch.format ?? eventFormat(event)) === 'onsite') patch.onlineUrl = null;
      if (dto.priceLabel !== undefined) patch.priceLabel = clean(dto.priceLabel);
      if (dto.image !== undefined) patch.image = clean(dto.image) ?? DEFAULT_EVENT_IMAGE;
      if (dto.description !== undefined) patch.description = dto.description.trim();
      if (dto.details !== undefined) patch.details = dto.details ? this.cleanDetails(dto.details) : null;
      if (dto.placements !== undefined) {
        if (event.status === 'published' && dto.placements.length === 0) {
          throw new BadRequestException("Un événement publié doit apparaître à au moins un emplacement (dépubliez-le pour le masquer).");
        }
        patch.placements = dto.placements;
      }
      if (dto.capacity !== undefined) {
        const confirmed = await confirmedCount(manager, id);
        if (dto.capacity > 0 && dto.capacity < confirmed) {
          throw new BadRequestException(
            `${confirmed} participants sont déjà confirmés : la jauge ne peut pas descendre en dessous. Passez des inscrits en liste d'attente ou annulez-les d'abord.`,
          );
        }
        patch.capacity = dto.capacity;
      }
      if (dto.registrationOpen !== undefined) patch.registrationOpen = dto.registrationOpen;

      const fields = Object.keys(patch).filter(
        (key) => !['dateRange', 'monthYear', 'isOnline'].includes(key) && JSON.stringify(patch[key as keyof QiaoEvent]) !== JSON.stringify(before[key as keyof QiaoEvent]),
      );
      if (fields.length > 0) {
        await manager.getRepository(QiaoEvent).update(id, patch);
        const details: Record<string, unknown> = { fields };
        if (fields.includes('capacity')) details.capacity = { from: before.capacity, to: patch.capacity };
        if (fields.includes('registrationOpen')) details.registrationOpen = patch.registrationOpen;
        if (fields.includes('startDate') || fields.includes('endDate')) details.dates = { from: [before.startDate, before.endDate], to: [patch.startDate ?? before.startDate, patch.endDate !== undefined ? patch.endDate : before.endDate] };
        const action = fields.length === 1 && fields[0] === 'registrationOpen' ? (patch.registrationOpen ? 'events.event.open-registrations' : 'events.event.close-registrations') : 'events.event.update';
        await this.audit.log(admin, action, { type: 'event', id, label: patch.title ?? event.title }, details);
      }
      return id;
    }).then((eventId) => this.getEvent(eventId));
  }

  async setStatus(admin: Admin, id: string, status: EventStatus) {
    const event = await this.findEvent(id);
    if (event.status === status) return this.getEvent(id);
    if (status === 'published') {
      if (event.placements.length === 0) {
        throw new BadRequestException("Choisissez au moins un emplacement d'affichage (page Événements, Communauté ou Accueil) avant de publier.");
      }
      if ((event.endDate ?? event.startDate) < today()) {
        throw new BadRequestException("Cet événement est passé : modifiez ses dates avant de le publier, ou laissez-le archivé.");
      }
    }
    await this.events.update(id, { status, ...(status === 'published' && !event.publishedAt ? { publishedAt: new Date() } : {}) });
    const active = await this.registrations.count({ where: [{ event: { id }, status: 'confirmed' }, { event: { id }, status: 'waitlisted' }] });
    await this.audit.log(admin, `events.event.${STATUS_ACTIONS[status]}`, { type: 'event', id, label: event.title }, { from: event.status, to: status, activeRegistrations: active });
    return this.getEvent(id);
  }

  async deleteEvent(admin: Admin, id: string) {
    const event = await this.findEvent(id);
    if (await this.registrations.exist({ where: { event: { id } } })) {
      throw new ConflictException("Cet événement a des inscriptions : archivez-le plutôt que de le supprimer (l'historique des inscrits est conservé).");
    }
    await this.events.delete(id);
    await this.audit.log(admin, 'events.event.delete', { type: 'event', id, label: event.title });
    return { deleted: true };
  }

  /** Copie en brouillon (édition suivante d'un salon, par exemple), sans les inscrits. */
  async duplicateEvent(admin: Admin, id: string) {
    const source = await this.findEvent(id);
    const copyId = await this.uniqueId(`${source.id.slice(0, 70)}-copie`);
    const { createdAt, updatedAt, publishedAt, registrations, ...fields } = source;
    await this.events.save(this.events.create({ ...fields, id: copyId, title: `${source.title} (copie)`.slice(0, 200), status: 'draft', publishedAt: null }));
    await this.audit.log(admin, 'events.event.duplicate', { type: 'event', id: copyId, label: source.title }, { sourceId: id });
    return this.getEvent(copyId);
  }

  // ==========================================================================
  // Inscrits et places
  // ==========================================================================

  async listRegistrations(eventId: string, query: RegistrationsQueryDto) {
    const event = await this.findEvent(eventId);
    const qb = this.registrations
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .where('r.eventId = :eventId', { eventId })
      // Ordre d'arrivée : c'est aussi l'ordre de la liste d'attente.
      .orderBy('r.createdAt', 'ASC');
    if (query.status && query.status !== 'all') qb.andWhere('r.status = :status', { status: query.status });
    if (query.q?.trim()) {
      const like = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((w) =>
          w.where('LOWER(r.fullName) LIKE :like', { like }).orWhere('LOWER(r.email) LIKE :like', { like }).orWhere('LOWER(r.companyRole) LIKE :like', { like }).orWhere('LOWER(r.badgeCode) LIKE :like', { like }),
        ),
      );
    }
    const rows = await qb.getMany();
    const all = await this.registrations.find({ where: { event: { id: eventId } }, select: { id: true, status: true, checkedInAt: true, createdAt: true }, order: { createdAt: 'ASC' } });
    const waitlist = all.filter((r) => r.status === 'waitlisted').map((r) => r.id);
    const confirmed = all.filter((r) => r.status === 'confirmed').length;
    return {
      event: { id: event.id, title: event.title, capacity: event.capacity, status: event.status, startDate: event.startDate, registrationOpen: event.registrationOpen },
      summary: {
        confirmed,
        waitlisted: waitlist.length,
        cancelled: all.filter((r) => r.status === 'cancelled').length,
        present: all.filter((r) => r.checkedInAt).length,
        capacity: event.capacity,
        remaining: event.capacity > 0 ? Math.max(0, event.capacity - confirmed) : null,
      },
      items: rows.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        email: r.email,
        companyRole: r.companyRole,
        badgeCode: r.badgeCode,
        status: r.status,
        source: r.source,
        adminNote: r.adminNote,
        createdAt: r.createdAt,
        confirmedAt: r.confirmedAt,
        cancelledAt: r.cancelledAt,
        checkedInAt: r.checkedInAt,
        waitlistPosition: r.status === 'waitlisted' ? waitlist.indexOf(r.id) + 1 : null,
        member: r.user ? { id: r.user.id, fullName: r.user.fullName, avatarUrl: r.user.avatarUrl, company: r.user.company } : null,
      })),
    };
  }

  /** Inscription ajoutée par l'administration (rattachée au compte QIAO de même e-mail) ; liste d'attente si complet. */
  async addRegistration(admin: Admin, eventId: string, dto: AdminRegistrationDto) {
    const email = dto.email.trim().toLowerCase();
    const member = await this.users.findOne({ where: { email } });
    const { event, registration } = await this.dataSource.transaction(async (manager) => {
      const event = await lockEvent(manager, eventId);
      if (!event) throw new NotFoundException('Événement introuvable.');
      const repo = manager.getRepository(EventRegistration);
      const existing = await repo.findOne({ where: { event: { id: eventId }, email } });
      if (existing && existing.status !== 'cancelled') {
        throw new ConflictException(`${existing.fullName} est déjà ${existing.status === 'confirmed' ? 'inscrit(e)' : "sur liste d'attente"} (badge ${existing.badgeCode}).`);
      }
      const status = await seatStatus(manager, event);
      const fields = {
        fullName: dto.fullName.trim(),
        companyRole: dto.companyRole.trim(),
        adminNote: clean(dto.adminNote),
        user: member ? ({ id: member.id } as User) : null,
        status,
        source: 'admin' as const,
        confirmedAt: status === 'confirmed' ? new Date() : null,
        cancelledAt: null,
        checkedInAt: null,
      };
      const registration = existing
        ? await repo.save(Object.assign(existing, fields))
        : await repo.save(repo.create({ ...fields, event: { id: eventId } as QiaoEvent, email, badgeCode: newBadgeCode() }));
      return { event, registration };
    });
    await this.notifyParticipant(registration, event, registration.status === 'confirmed' ? 'added' : 'waitlisted');
    await this.audit.log(
      admin,
      'events.registration.add',
      { type: 'event_registration', id: registration.id, label: `${registration.fullName} → ${event.title}` },
      { eventId, email, status: registration.status, member: Boolean(member) },
    );
    return { id: registration.id, status: registration.status, badgeCode: registration.badgeCode };
  }

  /** Confirmer (place requise), passer en liste d'attente, annuler ; ou modifier la note interne. */
  async updateRegistration(admin: Admin, id: string, dto: UpdateRegistrationDto) {
    const result = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(EventRegistration);
      const current = await repo.findOne({ where: { id }, relations: { event: true, user: true } });
      if (!current) throw new NotFoundException('Inscription introuvable.');
      const event = await lockEvent(manager, current.event.id);
      if (!event) throw new NotFoundException('Événement introuvable.');
      const from = current.status;
      const patch: Partial<EventRegistration> = {};
      if (dto.adminNote !== undefined) patch.adminNote = clean(dto.adminNote);
      if (dto.status !== undefined && dto.status !== from) {
        if (dto.status === 'confirmed' && event.capacity > 0 && (await confirmedCount(manager, event.id)) >= event.capacity) {
          throw new ConflictException(`Plus aucune place (${event.capacity} sur ${event.capacity}) : augmentez la jauge ou annulez un participant confirmé.`);
        }
        patch.status = dto.status;
        if (dto.status === 'confirmed') patch.confirmedAt = new Date();
        if (dto.status === 'cancelled') patch.cancelledAt = new Date();
        else patch.cancelledAt = null;
        if (dto.status !== 'confirmed') patch.checkedInAt = null;
      }
      if (Object.keys(patch).length > 0) await repo.update(id, patch);
      return { registration: Object.assign(current, patch), event, from };
    });
    const { registration, event, from } = result;
    if (dto.status !== undefined && dto.status !== from) {
      await this.notifyParticipant(registration, event, dto.status === 'confirmed' ? (from === 'waitlisted' ? 'promoted' : 'added') : dto.status);
      await this.audit.log(
        admin,
        `events.registration.${REGISTRATION_ACTIONS[dto.status]}`,
        { type: 'event_registration', id, label: `${registration.fullName} → ${event.title}` },
        { eventId: event.id, from, to: dto.status },
      );
    } else if (dto.adminNote !== undefined) {
      await this.audit.log(admin, 'events.registration.note', { type: 'event_registration', id, label: `${registration.fullName} → ${event.title}` }, { eventId: event.id });
    }
    return { id, status: registration.status, adminNote: registration.adminNote };
  }

  /** Pointage de présence (participants confirmés uniquement). */
  async checkIn(admin: Admin, id: string, present: boolean) {
    const registration = await this.registrations.findOne({ where: { id }, relations: { event: true } });
    if (!registration) throw new NotFoundException('Inscription introuvable.');
    if (registration.status !== 'confirmed') throw new BadRequestException('Seuls les participants confirmés peuvent être pointés présents.');
    const checkedInAt = present ? new Date() : null;
    await this.registrations.update(id, { checkedInAt });
    await this.audit.log(
      admin,
      present ? 'events.registration.checkin' : 'events.registration.checkout',
      { type: 'event_registration', id, label: `${registration.fullName} → ${registration.event.title}` },
      { eventId: registration.event.id },
    );
    return { id, checkedInAt };
  }

  /** Liste des inscrits au format CSV (séparateur « ; », ouvrable dans Excel) ; l'export est journalisé. */
  async exportCsv(admin: Admin, eventId: string) {
    const event = await this.findEvent(eventId);
    const rows = await this.registrations.find({ where: { event: { id: eventId } }, order: { createdAt: 'ASC' } });
    const labels: Record<RegistrationStatus, string> = { confirmed: 'Confirmé', waitlisted: "Liste d'attente", cancelled: 'Annulé' };
    const cell = (value: string | null | undefined) => {
      let text = (value ?? '').replace(/\r?\n/g, ' ');
      // Pas de formule interprétée par le tableur (injection CSV).
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const date = (value: Date | null) => (value ? new Date(value).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' }) : '');
    const lines = [
      ['Nom', 'E-mail', 'Entreprise / rôle', 'Badge', 'Statut', 'Origine', 'Inscrit le', 'Présent', 'Note interne'].map(cell).join(';'),
      ...rows.map((r) =>
        [r.fullName, r.email, r.companyRole, r.badgeCode, labels[r.status], r.source === 'admin' ? 'Administration' : 'Formulaire', date(r.createdAt), r.checkedInAt ? date(r.checkedInAt) : '', r.adminNote]
          .map(cell)
          .join(';'),
      ),
    ];
    await this.audit.log(admin, 'events.registration.export', { type: 'event', id: eventId, label: event.title }, { rows: rows.length });
    return { filename: `inscrits-${event.id}.csv`, content: `﻿${lines.join('\r\n')}\r\n` };
  }

  auditLog(query: EventsAuditQueryDto) {
    const action = query.action?.startsWith('events.') ? query.action : 'events.';
    return this.audit.list({ page: query.page ?? 1, limit: query.limit ?? 50, action });
  }

  // ==========================================================================
  // Utilitaires
  // ==========================================================================

  private withStats(event: QiaoEvent, seats?: { confirmed: number; waitlisted: number }) {
    const confirmed = seats?.confirmed ?? 0;
    return {
      ...event,
      format: eventFormat(event),
      registrationClosed: registrationClosed(event),
      isPast: (event.endDate ?? event.startDate) < today(),
      stats: {
        confirmed,
        waitlisted: seats?.waitlisted ?? 0,
        remaining: event.capacity > 0 ? Math.max(0, event.capacity - confirmed) : null,
        fillRate: event.capacity > 0 ? Math.min(100, Math.round((confirmed / event.capacity) * 100)) : null,
      },
    };
  }

  private async notifyParticipant(registration: EventRegistration, event: QiaoEvent, change: 'added' | 'promoted' | 'waitlisted' | 'cancelled') {
    const user = registration.user ?? (await this.users.findOne({ where: { email: registration.email } }));
    const when = `${event.dateRange} ${event.monthYear} — ${event.location}`;
    const messages = {
      added: [`Inscription confirmée : ${event.title}`, `L'équipe QIAO vous a inscrit. ${when}. Votre badge : ${registration.badgeCode}.`],
      promoted: [`Place confirmée : ${event.title}`, `Une place s'est libérée : votre inscription est confirmée. ${when}. Votre badge : ${registration.badgeCode}.`],
      waitlisted: [`Liste d'attente : ${event.title}`, "L'événement est complet : vous êtes sur liste d'attente. Vous serez prévenu si une place se libère."],
      cancelled: [`Inscription annulée : ${event.title}`, "Votre inscription à cet événement a été annulée par l'équipe QIAO. Contactez-nous pour toute question."],
    } as const;
    const [title, body] = messages[change];
    await this.notifications.notify(user, title, body, 'event', 'dashboard/events');
  }

  private cleanDetails(details: NonNullable<EventDto['details']>) {
    const list = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
    return {
      organizer: details.organizer.trim(),
      expectedAttendees: details.expectedAttendees.trim(),
      venue: details.venue.trim(),
      focusSectors: list(details.focusSectors),
      programHighlights: list(details.programHighlights),
      ...(clean(details.website) ? { website: clean(details.website) as string } : {}),
    };
  }

  private assertDates(startDate: string, endDate: string | null) {
    if (Number.isNaN(Date.parse(startDate)) || (endDate && Number.isNaN(Date.parse(endDate)))) throw new BadRequestException('Date invalide.');
    if (endDate && endDate < startDate) throw new BadRequestException('La date de fin doit suivre la date de début.');
  }

  private async findEvent(id: string) {
    const event = await this.events.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Événement introuvable.');
    return event;
  }

  private async uniqueId(base: string) {
    let id = base.slice(0, 80);
    for (let i = 2; await this.events.exist({ where: { id } }); i++) id = `${base.slice(0, 75)}-${i}`;
    return id;
  }
}
