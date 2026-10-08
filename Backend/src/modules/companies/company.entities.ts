import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('companies')
export class Company {
  @PrimaryColumn({ length: 60 })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  nativeName: string | null;

  /** Chinoise ou Nord-Africaine */
  @Column({ type: 'varchar', length: 20 })
  origin: string;

  /** Fabricant, Distributeur, Retailer, Marketplace, Importateur, Exportateur, Prestataire */
  @Column({ type: 'varchar', length: 30 })
  businessType: string;

  @Column({ type: 'varchar', length: 60 })
  country: string;

  @Column({ type: 'varchar', length: 2 })
  countryCode: string;

  @Column({ type: 'varchar', length: 120 })
  city: string;

  @Column({ type: 'varchar', length: 80 })
  sector: string;

  /** Groupe utilisé par le filtre « Secteur d'activité ». */
  @Column({ type: 'varchar', length: 80 })
  sectorGroup: string;

  @Column({ type: 'simple-array' })
  badges: string[];

  @Column({ default: true })
  verified: boolean;

  @Column({ type: 'real' })
  rating: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  turnover: string | null;

  /** Chiffre d'affaires annuel en millions USD (filtre). */
  @Column({ type: 'real', nullable: true })
  turnoverMusd: number | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  employees: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  founded: string | null;

  @Column({ type: 'simple-array', nullable: true })
  certifications: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  mainProducts: string[] | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 10, default: '#0c4a9e' })
  logoColor: string;

  @Column({ default: false })
  isStartup: boolean;

  @Column({ default: false })
  featured: boolean;

  @Column({ type: 'date' })
  addedAt: string;

  @Column({ type: 'varchar', length: 30 })
  addedLabel: string;
}

@Entity('company_contact_requests')
export class CompanyContactRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Company, { onDelete: 'CASCADE', eager: true })
  company: Company;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  organization: string | null;

  @Column({ type: 'text' })
  message: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
