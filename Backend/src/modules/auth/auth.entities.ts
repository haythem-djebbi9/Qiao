import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';

export type AuthProvider = 'email' | 'wechat' | 'facebook';

/**
 * Méthode d'authentification rattachée à un compte QIAO.
 * Un même compte peut avoir plusieurs identités (e-mail, WeChat, Facebook) ;
 * l'identifiant interne du compte reste toujours User.id.
 */
@Entity('auth_identities')
@Unique(['provider', 'providerSubject'])
export class AuthIdentity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 12 })
  provider: AuthProvider;

  /** Identifiant stable chez le fournisseur (unionid/openid WeChat, id Facebook, e-mail pour QIAO). */
  @Column({ type: 'varchar', length: 160 })
  providerSubject: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  displayName: string | null;

  /** E-mail transmis par le fournisseur : informatif, jamais utilisé pour fusionner des comptes. */
  @Column({ type: 'varchar', length: 160, nullable: true })
  providerEmail: string | null;

  @Column({ type: 'varchar', length: 10, default: 'active' })
  status: 'active' | 'revoked';

  @CreateDateColumn()
  linkedAt: Date;
}

/** Session de connexion : chaque jeton porte l'id de sa session, révocable à tout moment. */
@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 12 })
  provider: AuthProvider;

  @Column({ type: 'varchar', length: 200, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  ip: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  lastUsedAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;
}

/**
 * Jetons à usage unique et courte durée :
 *  - state : protection CSRF d'une redirection OAuth ;
 *  - login : code échangé contre une session après un retour OAuth réussi ;
 *  - pending : identité externe inconnue, en attente de création ou de liaison sécurisée ;
 *  - link : autorisation de lier WeChat/Facebook au compte connecté ;
 *  - reset : réinitialisation de mot de passe (seul le hash est stocké).
 */
@Entity('auth_tickets')
export class AuthTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  kind: 'state' | 'login' | 'pending' | 'reset' | 'link';

  /** Hash SHA-256 du secret transmis au navigateur. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  secretHash: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  payload: Record<string, any>;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
