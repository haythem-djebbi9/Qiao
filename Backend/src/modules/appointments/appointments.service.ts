import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto, TIME_SLOTS } from './appointments.dto';

export const SPECIALTY_LABELS: Record<string, string> = {
  sourcing: "Sourcing d'usines & Fret maritime",
  creation: 'Implantation & Création de filiale',
  juridique: 'Sécurisation juridique & Contrats bilingues',
  academy: "Formations d'équipes QIAO Academy",
  partenariat: 'Partenariats institutionnels & B2B',
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Salle de visioconférence réelle (Jitsi Meet, gratuite, sans installation), propre à chaque rendez-vous. */
export function newMeetingLink(): string {
  return `https://meet.jit.si/QIAO-${randomBytes(6).toString('hex')}`;
}

/** Les premiers rendez-vous pointaient vers un domaine inexistant (meet.qiao.tn) : même salle, sur Jitsi Meet. */
export function workingLink(link: string): string {
  const old = /^https:\/\/meet\.qiao\.tn\/([a-z0-9]+)$/i.exec(link);
  return old ? `https://meet.jit.si/QIAO-${old[1]}` : link;
}

function isClosedDay(date: string): boolean {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  async availability(date: string, specialty: string) {
    const booked = await this.appointments.find({
      where: { date, specialty, status: 'confirmed' },
      select: { time: true },
    });
    const taken = booked.map((a) => a.time);
    const closed = isClosedDay(date) || date <= today();
    return {
      date,
      specialty,
      closed,
      slots: TIME_SLOTS.map((time) => ({ time, available: !closed && !taken.includes(time) })),
    };
  }

  async create(dto: CreateAppointmentDto, user: User | null) {
    const date = dto.date.slice(0, 10);
    if (date <= today()) {
      throw new BadRequestException('Choisissez une date à partir de demain.');
    }
    if (isClosedDay(date)) {
      throw new BadRequestException('Nos experts ne consultent pas le week-end : choisissez un jour du lundi au vendredi.');
    }
    const alreadyBooked = await this.appointments.exist({
      where: { date, time: dto.time, specialty: dto.specialty, status: 'confirmed' },
    });
    if (alreadyBooked) {
      throw new ConflictException('Ce créneau est déjà réservé. Merci de choisir un autre horaire.');
    }

    const appointment = await this.appointments.save(
      this.appointments.create({
        specialty: dto.specialty,
        date,
        time: dto.time,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        notes: dto.notes?.trim() || null,
        source: dto.source ?? null,
        meetingLink: newMeetingLink(),
        user: user ? ({ id: user.id } as User) : null,
      }),
    );

    await this.notifications.notify(
      user,
      'Rendez-vous confirmé',
      `${SPECIALTY_LABELS[dto.specialty]} — le ${formatDate(date)} à ${dto.time} (GMT+1).`,
      'appointment',
      'dashboard',
    );

    // Confirmation par e-mail quand le SMTP est configuré (sinon le message est écrit dans les journaux).
    let emailSent = false;
    try {
      await this.mail.send(
        appointment.email,
        `QIAO — Rendez-vous confirmé le ${formatDate(date)} à ${dto.time}`,
        [
          `Bonjour ${appointment.fullName},`,
          ``,
          `Votre consultation « ${SPECIALTY_LABELS[dto.specialty]} » est confirmée le ${formatDate(date)} à ${dto.time} (heure de Tunis, GMT+1).`,
          ``,
          `Lien de la visioconférence (sans installation, depuis un navigateur) : ${appointment.meetingLink}`,
          ``,
          `À bientôt,`,
          `L'équipe QIAO`,
        ].join('\n'),
      );
      emailSent = this.mail.enabled;
    } catch {
      emailSent = false;
    }
    return { ...this.present(appointment), emailSent };
  }

  async listForUser(user: User) {
    const items = await this.appointments.find({
      where: [{ user: { id: user.id } }, { email: user.email }],
      order: { date: 'ASC', time: 'ASC' },
    });
    return items.map((a) => this.present(a));
  }

  async cancel(user: User, id: string) {
    const appointment = await this.appointments.findOne({
      where: [
        { id, user: { id: user.id } },
        { id, email: user.email },
      ],
    });
    if (!appointment) throw new NotFoundException('Rendez-vous introuvable.');
    if (appointment.status === 'cancelled') return this.present(appointment);

    appointment.status = 'cancelled';
    await this.appointments.save(appointment);
    await this.notifications.notify(
      user,
      'Rendez-vous annulé',
      `Votre consultation du ${formatDate(appointment.date)} à ${appointment.time} a été annulée.`,
      'appointment',
      'dashboard',
    );
    return this.present(appointment);
  }

  private present(appointment: Appointment) {
    return {
      ...appointment,
      meetingLink: workingLink(appointment.meetingLink),
      specialtyLabel: SPECIALTY_LABELS[appointment.specialty] ?? appointment.specialty,
    };
  }
}
