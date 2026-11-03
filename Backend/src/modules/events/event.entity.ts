import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

export interface EventDetails {
  organizer: string;
  expectedAttendees: string;
  venue: string;
  focusSectors: string[];
  programHighlights: string[];
  website?: string;
}

export const EVENT_STATUSES = ['draft', 'published', 'archived'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Sur place, en ligne (lien de connexion réservé aux inscrits confirmés) ou hybride. */
export const EVENT_FORMATS = ['onsite', 'online', 'hybrid'] as const;
export type EventFormat = (typeof EVENT_FORMATS)[number];

export const EVENT_CATEGORY_KEYS = ['salons', 'conferences', 'webinaires', 'missions', 'networking'] as const;
export const EVENT_PLACEMENTS = ['events-page', 'community', 'home'] as const;

/** Inscription confirmée (place attribuée), en liste d'attente ou annulée (place libérée). */
export const REGISTRATION_STATUSES = ['confirmed', 'waitlisted', 'cancelled'] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

@Entity('events')
export class QiaoEvent {
  @PrimaryColumn({ length: 80 })
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  /** Libellé affiché (Salon, Forum, Conférence, Mission, Webinaire, Atelier...). */
  @Column({ type: 'varchar', length: 40 })
  category: string;

  /** Catégorie de la page Événements : salons, conferences, webinaires, missions, networking. */
  @Column({ type: 'varchar', length: 30 })
  categoryKey: string;

  @Column({ type: 'date' })
  startDate: string;

  /** Dernier jour (événements sur plusieurs jours) ; null = un seul jour. */
  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'varchar', length: 20 })
  dateRange: string;

  @Column({ type: 'varchar', length: 20 })
  monthYear: string;

  @Column({ type: 'varchar', length: 60 })
  time: string;

  @Column({ type: 'varchar', length: 120 })
  location: string;

  @Column({ type: 'varchar', length: 60 })
  country: string;

  @Column({ default: false })
  isOnline: boolean;

  /** null pour les événements antérieurs à l'administration : déduit de isOnline (voir eventFormat). */
  @Column({ type: 'varchar', length: 10, nullable: true })
  format: EventFormat | null;

  /** Lien de connexion (visio) des événements en ligne ou hybrides : communiqué aux seuls inscrits confirmés. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  onlineUrl: string | null;

  /** Tarif indicatif affiché sur la fiche (ex. « Gratuit », « 150 € par délégation ») ; aucun paiement en ligne. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  priceLabel: string | null;

  @Column({ type: 'varchar', length: 300 })
  image: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  details: EventDetails | null;

  /** Emplacements d'affichage : events-page, community, home. */
  @Column({ type: 'simple-array' })
  placements: string[];

  /** Nombre de places (0 = illimité). Au-delà, les inscriptions passent en liste d'attente. */
  @Column({ default: 0 })
  capacity: number;

  /** Inscriptions ouvertes (fermées manuellement par l'administration, ou automatiquement une fois l'événement commencé). */
  @Column({ default: true })
  registrationOpen: boolean;

  /** Les événements existants avant l'administration restent visibles. */
  @Index()
  @Column({ type: 'varchar', length: 12, default: 'published' })
  status: EventStatus;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => EventRegistration, (registration) => registration.event)
  registrations: EventRegistration[];
}

export const eventFormat = (event: Pick<QiaoEvent, 'format' | 'isOnline'>): EventFormat => event.format ?? (event.isOnline ? 'online' : 'onsite');

@Entity('event_registrations')
@Unique(['event', 'email'])
export class EventRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => QiaoEvent, (event) => event.registrations, { onDelete: 'CASCADE' })
  event: QiaoEvent;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 200 })
  companyRole: string;

  @Column({ type: 'varchar', length: 20 })
  badgeCode: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null;

  @Column({ type: 'varchar', length: 12, default: 'confirmed' })
  status: RegistrationStatus;

  /** public (formulaire de la page Événements) ou admin (ajouté par l'administration). */
  @Column({ type: 'varchar', length: 10, default: 'public' })
  source: 'public' | 'admin';

  /** Note interne de l'administration (jamais montrée au participant). */
  @Column({ type: 'varchar', length: 500, nullable: true })
  adminNote: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  /** Présence pointée le jour J. */
  @Column({ type: 'timestamptz', nullable: true })
  checkedInAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
