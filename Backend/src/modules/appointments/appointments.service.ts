import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
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

function isClosedDay(date: string): boolean {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
    private readonly notifications: NotificationsService,
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
        meetingLink: `https://meet.qiao.tn/${randomBytes(5).toString('hex')}`,
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
    return this.present(appointment);
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
    return { ...appointment, specialtyLabel: SPECIALTY_LABELS[appointment.specialty] ?? appointment.specialty };
  }
}
