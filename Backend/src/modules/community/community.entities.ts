import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('community_posts')
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  author: User | null;

  @Column({ type: 'varchar', length: 120 })
  authorName: string;

  @Column({ type: 'varchar', length: 120 })
  authorRole: string;

  @Column({ type: 'varchar', length: 120 })
  authorLocation: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  authorAvatar: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array' })
  tags: string[];

  /** Business, Questions, Offres, Actualités, À la une */
  @Column({ type: 'varchar', length: 30 })
  category: string;

  /** Communauté : business, trade, investment, students, expats, culture, tech. */
  @Column({ type: 'varchar', length: 30, nullable: true })
  community: string | null;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}

@Entity('community_post_likes')
@Unique(['post', 'user'])
export class PostLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CommunityPost, { onDelete: 'CASCADE' })
  post: CommunityPost;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
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

@Entity('community_comments')
export class PostComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => CommunityPost, { onDelete: 'CASCADE' })
  post: CommunityPost;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  author: User | null;

  @Column({ type: 'varchar', length: 120 })
  authorName: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  authorAvatar: string | null;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('community_experts')
export class Expert {
  @PrimaryColumn({ length: 40 })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 160 })
  role: string;

  @Column({ type: 'varchar', length: 60 })
  country: string;

  @Column({ type: 'varchar', length: 10 })
  flag: string;

  @Column({ type: 'varchar', length: 300 })
  avatar: string;

  @Column({ default: 0 })
  sortOrder: number;
}

@Entity('community_connections')
@Unique(['user', 'expert'])
export class ExpertConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Expert, { onDelete: 'CASCADE', eager: true })
  expert: Expert;

  @CreateDateColumn()
  createdAt: Date;
}

/** Demandes « QIAO Connect » de mise en relation qualifiée. */
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
