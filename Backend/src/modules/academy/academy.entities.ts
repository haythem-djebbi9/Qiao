import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

/** Cycle de publication du catalogue : seul « published » est visible dans Academy et ouvert aux inscriptions. */
export type PublicationStatus = 'draft' | 'published' | 'archived';
export const PUBLICATION_STATUSES: PublicationStatus[] = ['draft', 'published', 'archived'];

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

  @Column({ type: 'varchar', length: 20, default: 'published' })
  status: PublicationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
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

  /** Programme affiché dans la fiche : titres des modules (synchronisés avec course_modules dès qu'ils existent). */
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

  @Column({ type: 'varchar', length: 20, default: 'published' })
  status: PublicationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
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

  /** Formations du parcours, dans l'ordre : l'inscription au parcours donne accès à chacune. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  courseIds: string[];

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'varchar', length: 20, default: 'published' })
  status: PublicationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// --- Contenu pédagogique ----------------------------------------------------

@Entity('course_modules')
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 80 })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course?: Course;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}

export type LessonType = 'text' | 'video' | 'pdf' | 'quiz';
export const LESSON_TYPES: LessonType[] = ['text', 'video', 'pdf', 'quiz'];

/** Question à choix unique ; « answer » (index de la bonne option) n'est jamais envoyé à l'apprenant avant correction. */
export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string | null;
}

export interface LessonQuiz {
  /** Score minimal (en %) pour valider la leçon. */
  passingScore: number;
  questions: QuizQuestion[];
}

@Entity('course_lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => CourseModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module?: CourseModule;

  /** Formation de la leçon (copie de module.courseId, pour les calculs de progression). */
  @Index()
  @Column({ type: 'varchar', length: 80 })
  courseId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 10 })
  type: LessonType;

  /** Corps de la leçon texte, ou notes accompagnant une vidéo, un PDF ou un quiz. */
  @Column({ type: 'text', nullable: true })
  content: string | null;

  /** Vidéo hébergée (YouTube, Vimeo ou lien direct MP4/WebM). */
  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl: string | null;

  /** Fichier téléversé (PDF ou vidéo) : academy_files.id. */
  @Column({ type: 'uuid', nullable: true })
  fileId: string | null;

  @Column({ default: 0 })
  durationMinutes: number;

  @Column({ default: 0 })
  sortOrder: number;

  /** Leçon masquée aux apprenants tant qu'elle n'est pas publiée (et exclue du calcul de progression). */
  @Column({ default: true })
  published: boolean;

  @Column({ type: 'jsonb', nullable: true })
  quiz: LessonQuiz | null;

  /** Supports complémentaires : fichiers téléversés (PDF, Word, Excel, PowerPoint, images) ou liens externes. */
  @Column({ type: 'jsonb', nullable: true })
  resources: LessonResource[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface LessonResource {
  id: string;
  kind: 'file' | 'link';
  title: string;
  /** academy_files.id (support téléversé, réservé aux inscrits). */
  fileId?: string;
  /** Lien https (vidéo complémentaire, article, dossier partagé…). */
  url?: string;
}

/** Note personnelle d'un apprenant sur une leçon, ancrée à un instant de la vidéo (seconds) ou libre (null). */
@Entity('lesson_notes')
@Index(['userId', 'courseId'])
export class LessonNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 80 })
  courseId: string;

  @Index()
  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson?: Lesson;

  @Column({ type: 'int', nullable: true })
  seconds: number | null;

  @Column({ type: 'varchar', length: 2000 })
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Fichiers des formations : couvertures (publiques) et supports de leçons (réservés aux inscrits). */
@Entity('academy_files')
export class AcademyFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  purpose: 'cover' | 'lesson';

  @Column({ type: 'varchar', length: 200 })
  originalName: string;

  @Column({ type: 'varchar', length: 120 })
  mime: string;

  @Column()
  size: number;

  @Column({ type: 'varchar', length: 200 })
  storagePath: string;

  @Column({ type: 'uuid', nullable: true })
  uploadedById: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

/** Progression réelle : une ligne par membre et par leçon terminée ou tentée (quiz). */
@Entity('lesson_progress')
@Unique(['userId', 'lessonId'])
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson?: Lesson;

  @Index()
  @Column({ type: 'varchar', length: 80 })
  courseId: string;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  /** Meilleur score obtenu au quiz (en %). */
  @Column({ type: 'int', nullable: true })
  bestScore: number | null;

  @Column({ default: 0 })
  attempts: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
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

  /**
   * pending : en attente de paiement (carte non réglée ou virement à recevoir) ; paid : payée, accès ouvert ;
   * confirmed : commande antérieure au paiement en ligne (accès ouvert, réglée à réception) ; cancelled : annulée.
   */
  @Index()
  @Column({ type: 'varchar', length: 20, default: 'confirmed' })
  status: OrderStatus;

  /** card : carte via le prestataire de paiement ; transfer : virement validé par l'administration ; free : formation gratuite. */
  @Column({ type: 'varchar', length: 10, nullable: true })
  paymentMethod: PaymentMethod | null;

  /** Montant débité par carte, en unités mineures de chargedCurrency (centimes d'euro). */
  @Column({ type: 'int', nullable: true })
  chargedAmount: number | null;

  @Column({ type: 'varchar', length: 3, nullable: true })
  chargedCurrency: string | null;

  /** Taux appliqué (euros pour 1 TND) au moment du paiement par carte. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  exchangeRate: string | null;

  /** Session de paiement en cours chez le prestataire. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  checkoutRef: string | null;

  @Column({ default: 0 })
  checkoutAttempts: number;

  /** Référence du paiement confirmé (prestataire) ou du virement reçu. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  paymentRef: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  /** Administrateur ayant validé le virement ou annulé la commande, et sa note. */
  @Column({ type: 'uuid', nullable: true })
  handledById: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  adminNote: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

export type OrderStatus = 'pending' | 'paid' | 'confirmed' | 'cancelled';
export type PaymentMethod = 'card' | 'transfer' | 'free';

export interface BankDetails {
  beneficiary: string;
  bankName: string;
  rib: string;
  iban: string;
  bic: string;
  instructions: string;
}

/** Réglages de paiement de QIAO Academy, modifiables par l'administration (ligne unique « default »). */
@Entity('academy_settings')
export class AcademySettings {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id: string;

  /** Euros pour 1 TND, appliqué au paiement par carte (prestataire sans dinar tunisien) ; null = carte désactivée. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  eurPerTnd: string | null;

  @Column({ type: 'jsonb', nullable: true })
  bank: BankDetails | null;

  @UpdateDateColumn()
  updatedAt: Date;
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

  /** Pourcentage de leçons publiées terminées (formation) ou moyenne des formations (parcours), calculé par le serveur. */
  @Column({ default: 0 })
  progress: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'completed';

  /** Origine de l'accès : commande, accès offert par un administrateur, ou formation d'un parcours suivi. */
  @Column({ type: 'varchar', length: 10, default: 'order' })
  source: 'order' | 'admin' | 'path';

  /** Parcours qui donne accès à cette formation (source « path »). */
  @Column({ type: 'varchar', length: 80, nullable: true })
  viaPathId: string | null;

  /** Dernière leçon ouverte : reprise de la formation là où l'apprenant s'est arrêté. */
  @Column({ type: 'uuid', nullable: true })
  lastLessonId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastActivityAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}

export type CertificateStatus = 'valid' | 'revoked';

/**
 * Certificat de réussite : délivré automatiquement quand toutes les leçons publiées d'une formation sont terminées,
 * vérifiable publiquement par son numéro. Nom, formation et résultats sont figés à la délivrance.
 */
@Entity('academy_certificates')
@Unique(['userId', 'courseId'])
export class AcademyCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Numéro public vérifiable, par ex. QA-2026-7K3M-9XQ2. */
  @Column({ type: 'varchar', length: 24, unique: true })
  number: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  /** Formation certifiée (sans clé étrangère : le certificat survit à la formation). */
  @Index()
  @Column({ type: 'varchar', length: 80 })
  courseId: string;

  @Column({ type: 'varchar', length: 120 })
  holderName: string;

  @Column({ type: 'varchar', length: 200 })
  courseTitle: string;

  @Column({ type: 'varchar', length: 120 })
  instructor: string;

  @Column({ default: 0 })
  lessonsCount: number;

  @Column({ default: 0 })
  quizzesCount: number;

  /** Moyenne des meilleurs scores aux quiz publiés (en %), null si la formation n'a pas de quiz. */
  @Column({ type: 'int', nullable: true })
  averageScore: number | null;

  @Column({ type: 'timestamptz' })
  issuedAt: Date;

  @Column({ type: 'varchar', length: 10, default: 'valid' })
  status: CertificateStatus;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  revokedReason: string | null;

  @Column({ type: 'uuid', nullable: true })
  revokedById: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
