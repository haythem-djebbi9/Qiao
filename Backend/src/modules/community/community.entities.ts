import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

// =============================================================================
// Catégories configurables
// =============================================================================

/** Catégorie du répertoire des communautés (Agriculture, Juridique...). Configurable par les administrateurs. */
@Entity('community_categories')
export class CommunityCategory {
  @PrimaryColumn({ length: 40 })
  id: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  active: boolean;
}

/**
 * Catégorie professionnelle (Juridique, Douane, Traduction...) partagée par les questions,
 * les profils d'experts, la recherche et les recommandations.
 */
@Entity('professional_categories')
export class ProfessionalCategory {
  @PrimaryColumn({ length: 40 })
  id: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  active: boolean;
}

// =============================================================================
// Communautés & adhésions
// =============================================================================

/**
 * Visibilité (découverte + contenu) :
 *  - public : découvrable, contenu lisible par tous ;
 *  - restricted : découvrable, contenu réservé aux membres actifs ;
 *  - private : non découvrable, accès sur invitation uniquement.
 */
export type CommunityVisibility = 'public' | 'restricted' | 'private';
/** Politique d'adhésion : libre, sur validation d'un modérateur, ou sur invitation. */
export type MembershipPolicy = 'open' | 'approval' | 'invite';

@Entity('communities')
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  slug: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  rules: string | null;

  @ManyToOne(() => CommunityCategory, { nullable: true, onDelete: 'SET NULL', eager: true })
  category: CommunityCategory | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  coverImage: string | null;

  /** Nom d'icône lucide (Users, Handshake, Sprout...). */
  @Column({ type: 'varchar', length: 40, default: 'Users' })
  icon: string;

  /** Langues utilisées dans la communauté (fr, ar, en, zh). */
  @Column({ type: 'simple-array' })
  languages: string[];

  /** Périmètre géographique ou professionnel (ex. « Tunisie · Chine »). */
  @Column({ type: 'varchar', length: 160, nullable: true })
  scope: string | null;

  @Column({ type: 'varchar', length: 12, default: 'public' })
  visibility: CommunityVisibility;

  @Column({ type: 'varchar', length: 12, default: 'open' })
  membershipPolicy: MembershipPolicy;

  @Column({ type: 'varchar', length: 10, default: 'active' })
  status: 'active' | 'archived';

  /** Mise en avant éditoriale (recommandation, jamais une promotion payante). */
  @Column({ default: false })
  featured: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: 0 })
  membersCount: number;

  @Column({ default: 0 })
  postsCount: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  createdBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export type MembershipStatus = 'pending' | 'active' | 'invited' | 'rejected' | 'removed' | 'banned' | 'left';

/** Relation membre ↔ communauté (une seule ligne par couple, dont le statut évolue). */
@Entity('community_memberships')
@Unique(['user', 'community'])
@Index(['community', 'status'])
export class CommunityMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Community, { onDelete: 'CASCADE' })
  community: Community;

  @Column({ type: 'varchar', length: 10 })
  status: MembershipStatus;

  /** Rôle dans la communauté : la modération est attribuée par communauté. */
  @Column({ type: 'varchar', length: 10, default: 'member' })
  role: 'member' | 'moderator';

  @Column({ type: 'varchar', length: 500, nullable: true })
  requestMessage: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  joinedAt: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  decidedBy: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  invitedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// =============================================================================
// Publications, questions, commentaires, réactions
// =============================================================================

export type PostType = 'post' | 'question';
/** published : visible ; draft : brouillon de l'auteur ; hidden/removed : modération ; deleted : retiré par l'auteur. */
export type ContentStatus = 'published' | 'draft' | 'hidden' | 'removed' | 'deleted';
export type QuestionStatus = 'open' | 'answered' | 'closed';

export interface AttachmentRef {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: 'image' | 'file';
}

@Entity('community_posts')
@Index(['status', 'createdAt'])
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  author: User;

  /** Communauté de destination (null = fil général QIAO Community, public). */
  @Index()
  @ManyToOne(() => Community, { nullable: true, onDelete: 'CASCADE', eager: true })
  community: Community | null;

  /** Type explicite : une publication contenant « ? » n'est pas pour autant une question. */
  @Column({ type: 'varchar', length: 10, default: 'post' })
  type: PostType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array' })
  tags: string[];

  @ManyToOne(() => ProfessionalCategory, { nullable: true, onDelete: 'SET NULL', eager: true })
  professionalCategory: ProfessionalCategory | null;

  /** Langue du contenu (indépendante de la langue de l'interface). */
  @Column({ type: 'varchar', length: 5, default: 'fr' })
  language: string;

  @Column({ type: 'varchar', length: 10, default: 'published' })
  status: ContentStatus;

  @Column({ type: 'varchar', length: 10, nullable: true })
  questionStatus: QuestionStatus | null;

  /** Réponse acceptée par l'auteur (n'implique aucune validation professionnelle par QIAO). */
  @Column({ type: 'uuid', nullable: true })
  acceptedCommentId: string | null;

  /** Discussion verrouillée par la modération : plus de nouveaux commentaires. */
  @Column({ default: false })
  locked: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  attachments: AttachmentRef[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  links: string[];

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  editedAt: Date | null;

  /** Date de première réponse d'un autre membre (indicateur « délai de première réponse »). */
  @Column({ type: 'timestamptz', nullable: true })
  firstResponseAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('community_comments')
@Index(['post', 'createdAt'])
export class PostComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CommunityPost, { onDelete: 'CASCADE' })
  post: CommunityPost;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  author: User;

  /** Réponse à un commentaire (un seul niveau d'imbrication). */
  @Index()
  @ManyToOne(() => PostComment, { nullable: true, onDelete: 'CASCADE' })
  parent: PostComment | null;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', length: 10, default: 'published' })
  status: ContentStatus;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  editedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Réaction (« J'aime ») : une seule par membre, par contenu et par type. */
@Entity('community_reactions')
@Unique(['user', 'targetType', 'targetId', 'reactionType'])
@Index(['targetType', 'targetId'])
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 10 })
  targetType: 'post' | 'comment';

  @Column({ type: 'uuid' })
  targetId: string;

  @Column({ type: 'varchar', length: 10, default: 'like' })
  reactionType: 'like';

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('community_post_bookmarks')
@Unique(['post', 'user'])
export class PostBookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CommunityPost, { onDelete: 'CASCADE', eager: true })
  post: CommunityPost;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}

/**
 * Suivi d'un membre (user) ou d'une discussion (post). Relations distinctes de l'adhésion :
 * suivre une discussion ne donne jamais accès à une communauté restreinte.
 */
@Entity('community_follows')
@Unique(['follower', 'targetType', 'targetId'])
@Index(['targetType', 'targetId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  follower: User;

  @Column({ type: 'varchar', length: 10 })
  targetType: 'user' | 'post';

  @Column({ type: 'uuid' })
  targetId: string;

  @CreateDateColumn()
  createdAt: Date;
}

/** Fichier joint à une publication (stocké sur disque, servi après contrôle d'accès). */
@Entity('community_attachments')
export class CommunityAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  postId: string | null;

  @Column({ type: 'varchar', length: 200 })
  originalName: string;

  @Column({ type: 'varchar', length: 100 })
  mime: string;

  @Column()
  size: number;

  @Column({ type: 'varchar', length: 200 })
  storagePath: string;

  @CreateDateColumn()
  createdAt: Date;
}

// =============================================================================
// Profils membres & experts
// =============================================================================

export type FieldVisibility = 'public' | 'members' | 'private';
export type MessagePolicy = 'everyone' | 'connections' | 'nobody';

export interface PrivacySettings {
  /** Qui peut ouvrir le profil : tout le monde ou seulement les membres connectés. */
  profile: 'public' | 'members';
  company: FieldVisibility;
  location: FieldVisibility;
  bio: FieldVisibility;
  languages: FieldVisibility;
  communities: FieldVisibility;
  activity: FieldVisibility;
  email: FieldVisibility;
  /** Qui peut démarrer une conversation privée. */
  messages: MessagePolicy;
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  profile: 'public',
  company: 'public',
  location: 'public',
  bio: 'public',
  languages: 'public',
  communities: 'members',
  activity: 'public',
  email: 'private',
  messages: 'connections',
};

/** Profil Community rattaché au compte QIAO principal (aucun compte séparé). */
@Entity('member_profiles')
export class MemberProfile {
  @PrimaryColumn('uuid')
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 160, nullable: true })
  headline: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  city: string | null;

  @Column({ type: 'simple-array', nullable: true })
  languages: string[] | null;

  /** Secteurs professionnels (ids de catégories professionnelles). */
  @Column({ type: 'simple-array', nullable: true })
  sectors: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  interests: string[] | null;

  @Column({ type: 'jsonb', default: () => `'${JSON.stringify(DEFAULT_PRIVACY)}'` })
  privacy: PrivacySettings;

  /** Préférences de notifications in-app par type d'événement (true par défaut). */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  notificationPrefs: Record<string, boolean>;

  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  followingCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * none : simple déclaration du membre ; pending : vérification demandée ;
 * verified / rejected : décision enregistrée d'un administrateur QIAO.
 */
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

/** Informations professionnelles d'un membre (classification d'expert, distincte des rôles d'autorisation). */
@Entity('expert_profiles')
export class ExpertProfile {
  @PrimaryColumn('uuid')
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: true })
  listed: boolean;

  @Column({ type: 'varchar', length: 160 })
  headline: string;

  @Column({ type: 'text', nullable: true })
  biography: string | null;

  @Column({ type: 'simple-array' })
  categories: string[];

  @Column({ type: 'simple-array', nullable: true })
  countriesServed: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  languages: string[] | null;

  @Column({ type: 'smallint', nullable: true })
  yearsExperience: number | null;

  @Column({ type: 'varchar', length: 12, default: 'none' })
  verificationStatus: VerificationStatus;

  /** Justificatifs ou références fournis par le membre lors de la demande de vérification. */
  @Column({ type: 'text', nullable: true })
  verificationEvidence: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  verificationNote: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verificationRequestedAt: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  verifiedBy: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ default: 0 })
  profileViews: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('member_blocks')
@Unique(['blocker', 'blocked'])
export class MemberBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  blocker: User;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  blocked: User;

  @CreateDateColumn()
  createdAt: Date;
}

// =============================================================================
// Messagerie privée
// =============================================================================

/** Conversation privée entre deux membres. Le contexte garde la trace d'une question ou d'un profil d'origine. */
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Clé unique du couple de participants (ids triés). */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  pairKey: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  contextType: 'post' | 'profile' | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  contextId: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  contextLabel: string | null;

  @Column({ type: 'timestamptz' })
  lastMessageAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('conversation_participants')
@Unique(['conversation', 'user'])
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  user: User;

  @Column({ type: 'timestamptz', nullable: true })
  lastReadAt: Date | null;
}

@Entity('messages')
@Index(['conversation', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  author: User;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 10, default: 'sent' })
  status: 'sent' | 'removed';

  /** Canal d'envoi : site QIAO ou réponse relayée depuis WeChat (compte officiel QIAO). */
  @Column({ type: 'varchar', length: 10, default: 'web' })
  source: 'web' | 'wechat';

  @CreateDateColumn()
  createdAt: Date;
}

// =============================================================================
// Modération
// =============================================================================

export type ReportTarget = 'post' | 'comment' | 'user' | 'message' | 'community';
export type ReportStatus = 'new' | 'under_review' | 'action_taken' | 'rejected' | 'closed';
export const REPORT_REASONS = [
  'spam',
  'harassment',
  'fraud',
  'impersonation',
  'advertising',
  'illegal',
  'credentials',
  'privacy',
  'abuse',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

@Entity('moderation_reports')
@Index(['status', 'createdAt'])
export class ModerationReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: true })
  reporter: User | null;

  @Column({ type: 'varchar', length: 10 })
  targetType: ReportTarget;

  @Column({ type: 'uuid' })
  targetId: string;

  /** Communauté concernée : détermine les modérateurs compétents (null = administrateurs uniquement). */
  @Index()
  @ManyToOne(() => Community, { nullable: true, onDelete: 'SET NULL', eager: true })
  community: Community | null;

  /** Auteur du contenu signalé. */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: true })
  targetUser: User | null;

  /** Extrait du contenu au moment du signalement (seul le message signalé est copié, jamais la conversation). */
  @Column({ type: 'text', nullable: true })
  snapshot: string | null;

  @Column({ type: 'varchar', length: 20 })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 14, default: 'new' })
  status: ReportStatus;

  @Column({ default: false })
  escalated: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: true })
  assignedTo: User | null;

  /** Action retenue : dismiss, hide, remove, restore, warn, ban, suspend, lock, escalate. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  action: string | null;

  @Column({ type: 'text', nullable: true })
  resolution: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: true })
  resolvedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}

/** Demandes « QIAO Connect » de mise en relation qualifiée (service QIAO, initié explicitement par le membre). */
@Entity('match_requests')
export class MatchRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  profileType: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 20, default: 'new' })
  status: 'new' | 'matched' | 'closed';

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;
}

export const COMMUNITY_ENTITIES = [
  CommunityCategory,
  ProfessionalCategory,
  Community,
  CommunityMembership,
  CommunityPost,
  PostComment,
  Reaction,
  PostBookmark,
  Follow,
  CommunityAttachment,
  MemberProfile,
  ExpertProfile,
  MemberBlock,
  Conversation,
  ConversationParticipant,
  Message,
  ModerationReport,
  MatchRequest,
];
