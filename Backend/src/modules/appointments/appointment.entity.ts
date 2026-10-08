import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('appointments')
@Index(['specialty', 'date', 'time'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  specialty: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 5 })
  time: string;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /** Page d'origine de la demande (accueil, secteur, hub commerce...). */
  @Column({ type: 'varchar', length: 40, nullable: true })
  source: string | null;

  @Column({ type: 'varchar', length: 20, default: 'confirmed' })
  status: 'confirmed' | 'cancelled';

  @Column({ type: 'varchar', length: 200 })
  meetingLink: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
