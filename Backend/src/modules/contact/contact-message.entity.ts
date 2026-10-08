import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

/** Toutes les demandes entrantes : formulaires de contact, devis, demandes sectorielles... */
export type ContactSource =
  | 'home'
  | 'contact-page'
  | 'quote'
  | 'simulator'
  | 'sector'
  | 'company'
  | 'consultation';

@Entity('contact_messages')
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  source: ContactSource;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  company: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  role: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  sector: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  attachmentName: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true, select: false })
  attachmentPath: string | null;

  /** Données complémentaires propres à la source (simulation, secteur, opportunité...). */
  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 20, default: 'new' })
  status: 'new' | 'in-progress' | 'closed';

  /** Référence lisible communiquée au client (ex. QIAO-24-0042). */
  @Column({ type: 'varchar', length: 20, unique: true })
  reference: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
