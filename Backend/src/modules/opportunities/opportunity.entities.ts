import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('opportunities')
export class Opportunity {
  @PrimaryColumn({ length: 80 })
  id: string;

  @Column({ type: 'varchar', length: 220 })
  title: string;

  /** IMPORTATION, EXPORTATION, PARTENARIAT, INVESTISSEMENT, DISTRIBUTION, FOURNISSEUR... */
  @Column({ type: 'varchar', length: 30 })
  type: string;

  @Column({ type: 'varchar', length: 80 })
  sector: string;

  @Column({ type: 'varchar', length: 60 })
  fromCountry: string;

  @Column({ type: 'varchar', length: 60 })
  toCountry: string;

  /** Pays mis en avant sur les cartes (pays du projet). */
  @Column({ type: 'varchar', length: 60 })
  country: string;

  @Column({ type: 'varchar', length: 60 })
  amountLabel: string;

  @Column({ type: 'bigint', nullable: true, transformer: { to: (v) => v, from: (v) => (v === null ? null : Number(v)) } })
  amountMinUsd: number | null;

  @Column({ type: 'bigint', nullable: true, transformer: { to: (v) => v, from: (v) => (v === null ? null : Number(v)) } })
  amountMaxUsd: number | null;

  /** dollar, cart, tag, factory : icône du montant sur la page Intelligence. */
  @Column({ type: 'varchar', length: 10, default: 'dollar' })
  amountIcon: string;

  @Column({ type: 'varchar', length: 80 })
  partnerType: string;

  @Column({ type: 'varchar', length: 300 })
  image: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  deadline: string | null;

  @Column({ type: 'date' })
  publishedAt: string;

  @Column({ default: true })
  verified: boolean;

  @Column({ default: false })
  urgent: boolean;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'closed';

  /** intelligence, commerce-hub, entreprises */
  @Column({ type: 'simple-array' })
  placements: string[];
}

@Entity('opportunity_applications')
@Unique(['opportunity', 'email'])
export class OpportunityApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Opportunity, { onDelete: 'CASCADE', eager: true })
  opportunity: Opportunity;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  company: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'varchar', length: 20, default: 'submitted' })
  status: 'submitted' | 'shortlisted' | 'declined';

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
