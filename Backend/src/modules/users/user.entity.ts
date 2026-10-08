import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type AccountType = 'enterprise' | 'expert' | 'individual';
export type Origin = 'china' | 'north-africa';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

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

  @Column({ type: 'varchar', length: 2, default: 'FR' })
  language: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'varchar', length: 10, default: 'user' })
  role: 'user' | 'admin';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _hidden, ...rest } = user;
  return rest;
}
