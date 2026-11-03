import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type AccountType = 'enterprise' | 'expert' | 'individual';
export type Origin = 'china' | 'north-africa';
export type AccountStatus = 'active' | 'suspended';

/** Compte QIAO principal : identité unique partagée par tous les modules (Community, Academy, Services...). */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  email: string;

  /** Absent pour un compte créé via WeChat ou Facebook tant qu'aucun mot de passe n'est défini. */
  @Column({ type: 'varchar', select: false, nullable: true })
  passwordHash: string | null;

  /** Identifiant public unique (@handle) utilisé pour les profils et les mentions. */
  @Column({ type: 'varchar', length: 60, unique: true, nullable: true })
  handle: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  company: string | null;

  @Column({ type: 'varchar', length: 20, default: 'enterprise' })
  accountType: AccountType;

  @Column({ type: 'varchar', length: 20, default: 'north-africa' })
  origin: Origin;

  @Column({ type: 'varchar', length: 120, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  avatarUrl: string | null;

  /** Langue de l'interface (distincte de la langue des contenus publiés). */
  @Column({ type: 'varchar', length: 2, default: 'FR' })
  language: string;

  @Column({ default: false })
  verified: boolean;

  /** Rôle d'autorisation plateforme. Le statut d'expert est géré à part (profil expert). */
  @Column({ type: 'varchar', length: 10, default: 'user' })
  role: 'user' | 'admin';

  @Column({ type: 'varchar', length: 12, default: 'active' })
  status: AccountStatus;

  @Column({ type: 'timestamptz', nullable: true })
  suspendedUntil: Date | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  suspensionReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  termsAcceptedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export type PublicUser = Omit<User, 'passwordHash'> & { hasPassword?: boolean };

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _hidden, ...rest } = user;
  return rest;
}
