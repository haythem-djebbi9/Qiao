import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

export type WechatMode = 'live' | 'mock';

/**
 * Liaison entre un compte QIAO et l'abonné WeChat du compte officiel QIAO (openid propre à ce compte officiel).
 * Créée uniquement par le scan d'un QR code de liaison émis pour ce membre : jamais de fusion automatique.
 */
@Entity('wechat_links')
export class WechatLink {
  @PrimaryColumn('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  openid: string;

  /** Liaison faite avec le vrai compte officiel ou avec le simulateur (une liaison simulée n'est jamais utilisée en réel). */
  @Column({ type: 'varchar', length: 8 })
  mode: WechatMode;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status: 'active' | 'unsubscribed';

  /** Recevoir les messages privés QIAO dans WeChat et y répondre. */
  @Column({ default: true })
  relayMessages: boolean;

  /** Recevoir aussi les autres alertes QIAO (paiements, litiges, Community...). */
  @Column({ default: true })
  relayAlerts: boolean;

  /** Dernière action du membre envers le compte officiel : ouvre la fenêtre de 48 h des messages de service. */
  @Column({ type: 'timestamptz', nullable: true })
  lastInteractionAt: Date | null;

  /** Conversation à laquelle une réponse tapée dans WeChat est rattachée par défaut. */
  @Column({ type: 'uuid', nullable: true })
  replyConversationId: string | null;

  @Column({ type: 'timestamptz' })
  linkedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Code de liaison à usage unique porté par le QR code (seul son hash est conservé). */
@Entity('wechat_bind_codes')
export class WechatBindCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  codeHash: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}

/** Notifications reçues de WeChat, dédoublonnées (WeChat renvoie un message sans réponse sous 5 s). Aucun contenu conservé. */
@Entity('wechat_inbound')
export class WechatInbound {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160 })
  dedupeKey: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  openid: string;

  @Column({ type: 'varchar', length: 20 })
  msgType: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  event: string | null;

  @CreateDateColumn()
  receivedAt: Date;
}

/**
 * Messages à transmettre dans WeChat. Hors de la fenêtre de 48 h, ils attendent la prochaine action du membre
 * (une notification modèle l'avertit) ; le contenu est effacé une fois transmis.
 */
@Entity('wechat_outbox')
@Index(['userId', 'status'])
export class WechatOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  openid: string;

  @Column({ type: 'varchar', length: 10 })
  kind: 'message' | 'alert';

  @Column({ type: 'uuid', nullable: true })
  conversationId: string | null;

  @Column({ type: 'text' })
  content: string;

  /** Titre et résumé courts pour la notification modèle (hors fenêtre de 48 h). */
  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 120 })
  summary: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  url: string | null;

  @Column({ type: 'varchar', length: 10, default: 'pending' })
  status: 'pending' | 'waiting' | 'sent' | 'failed';

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  templateSentAt: Date | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  error: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}

/** Simulateur (développement uniquement) : conversation entre un « téléphone WeChat » simulé et le compte officiel QIAO. */
@Entity('wechat_sim_messages')
export class WechatSimMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  openid: string;

  @Column({ type: 'varchar', length: 4 })
  direction: 'in' | 'out';

  /** in : text | event ; out : reply (réponse immédiate), custom (message de service), template (notification modèle). */
  @Column({ type: 'varchar', length: 10 })
  kind: 'text' | 'event' | 'reply' | 'custom' | 'template';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  url: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

export const WECHAT_ENTITIES = [WechatLink, WechatBindCode, WechatInbound, WechatOutbox, WechatSimMessage];
