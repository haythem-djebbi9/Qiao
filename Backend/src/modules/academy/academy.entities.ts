import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';

/** Domaines de formation présentés sur la page d'accueil (section QIAO Academy). */
@Entity('training_domains')
export class TrainingDomain {
  @PrimaryColumn({ length: 60 })
  id: string;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 40 })
  iconName: string;

  @Column()
  coursesCount: number;

  @Column({ type: 'varchar', length: 200 })
  featuredCourse: string;

  @Column({ type: 'varchar', length: 40 })
  duration: string;

  @Column({ type: 'varchar', length: 10, default: 'blue' })
  accentColor: 'red' | 'blue';

  @Column({ default: 0 })
  sortOrder: number;
}

@Entity('courses')
export class Course {
  @PrimaryColumn({ length: 80 })
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 120 })
  instructor: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  instructorRole: string | null;

  @Column({ type: 'varchar', length: 300 })
  instructorImg: string;

  @Column({ type: 'real' })
  rating: number;

  @Column()
  reviewsCount: number;

  @Column({ type: 'varchar', length: 30 })
  duration: string;

  @Column()
  durationMinutes: number;

  /** Prix en dinars tunisiens (TND). */
  @Column()
  price: number;

  @Column({ type: 'varchar', length: 300 })
  image: string;

  /** Domaine de la page Academy : business, commerce, investment, law, logistics, tech, languages, culture. */
  @Column({ type: 'varchar', length: 30 })
  domain: string;

  @Column({ type: 'varchar', length: 30 })
  level: string;

  @Column({ type: 'varchar', length: 40 })
  format: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  badge: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  badgeColor: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  modules: string[];

  /** popular, new */
  @Column({ type: 'simple-array', nullable: true })
  sections: string[] | null;

  /** Domaine de formation de l'accueil auquel la formation est rattachée. */
  @Column({ type: 'varchar', length: 60, nullable: true })
  trainingDomainId: string | null;

  @Column({ default: 0 })
  sortOrder: number;
}

@Entity('learning_paths')
export class LearningPath {
  @PrimaryColumn({ length: 80 })
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column()
  coursesCount: number;

  @Column({ type: 'varchar', length: 20 })
  duration: string;

  @Column()
  price: number;

  @Column({ type: 'varchar', length: 300 })
  image: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 0 })
  sortOrder: number;
}

@Entity('course_favorites')
@Unique(['user', 'course'])
export class CourseFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Course, { onDelete: 'CASCADE', eager: true })
  course: Course;

  @CreateDateColumn()
  createdAt: Date;
}

export type AcademyItemType = 'course' | 'path';

@Entity('cart_items')
@Unique(['user', 'itemType', 'itemId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 10 })
  itemType: AcademyItemType;

  @Column({ type: 'varchar', length: 80 })
  itemId: string;

  @CreateDateColumn()
  createdAt: Date;
}

export interface OrderLine {
  itemType: AcademyItemType;
  itemId: string;
  title: string;
  price: number;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  reference: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'jsonb' })
  items: OrderLine[];

  @Column()
  total: number;

  @Column({ type: 'varchar', length: 10, default: 'TND' })
  currency: string;

  /** Les inscriptions sont activées immédiatement, la facture est réglée à réception. */
  @Column({ type: 'varchar', length: 20, default: 'confirmed' })
  status: 'confirmed' | 'cancelled';

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('enrollments')
@Unique(['user', 'itemType', 'itemId'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 10 })
  itemType: AcademyItemType;

  @Column({ type: 'varchar', length: 80 })
  itemId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 300 })
  image: string;

  @Column({ default: 0 })
  progress: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'completed';

  @CreateDateColumn()
  createdAt: Date;
}
