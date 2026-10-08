import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';

/** Droits de douane et TVA à l'import par pays de destination et catégorie de produit. */
@Entity('customs_tariffs')
@Unique(['country', 'category'])
export class CustomsTariff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 40 })
  country: string;

  @Column({ type: 'varchar', length: 30 })
  category: string;

  @Column({ type: 'varchar', length: 120 })
  categoryLabel: string;

  @Column({ type: 'real' })
  dutyRate: number;

  @Column({ type: 'real' })
  vatRate: number;

  /** Frais portuaires & magasinage estimés (USD). */
  @Column()
  portFees: number;

  @Column({ type: 'varchar', length: 120 })
  port: string;
}

/** Fret international estimé depuis la Chine (USD). */
@Entity('freight_rates')
@Unique(['country', 'mode'])
export class FreightRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 40 })
  country: string;

  /** sea-20ft, sea-40ft, sea-lcl, air */
  @Column({ type: 'varchar', length: 20 })
  mode: string;

  @Column()
  cost: number;

  @Column({ type: 'varchar', length: 30 })
  transitTime: string;
}

export interface SimulationResult {
  customsDutyRate: number;
  vatRate: number;
  freightCost: number;
  insuranceCost: number;
  cifValue: number;
  dutyAmount: number;
  vatAmount: number;
  portFees: number;
  totalLandedCost: number;
  transitTime: string;
  port: string;
}

@Entity('import_simulations')
export class ImportSimulation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40 })
  destCountry: string;

  @Column({ type: 'varchar', length: 30 })
  category: string;

  @Column({ type: 'real' })
  fobValue: number;

  @Column({ type: 'varchar', length: 10 })
  shippingMode: string;

  @Column({ type: 'varchar', length: 10 })
  containerType: string;

  @Column({ type: 'jsonb' })
  result: SimulationResult;

  @Column({ default: false })
  quoteRequested: boolean;

  @Column({ type: 'varchar', length: 120, nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  reference: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
