import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';

export interface EventDetails {
  organizer: string;
  expectedAttendees: string;
  venue: string;
  focusSectors: string[];
  programHighlights: string[];
  website?: string;
}

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

  @Column({ type: 'varchar', length: 300 })
  image: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  details: EventDetails | null;

  /** Emplacements d'affichage : events-page, community, home. */
  @Column({ type: 'simple-array' })
  placements: string[];

  @Column({ default: 0 })
  capacity: number;

  @OneToMany(() => EventRegistration, (registration) => registration.event)
  registrations: EventRegistration[];
}

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

  @CreateDateColumn()
  createdAt: Date;
}
