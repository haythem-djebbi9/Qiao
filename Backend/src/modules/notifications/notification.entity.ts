import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

export type NotificationType =
  | 'welcome'
  | 'opportunity'
  | 'event'
  | 'appointment'
  | 'academy'
  | 'community'
  | 'resource'
  | 'info';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 20, default: 'info' })
  type: NotificationType;

  /** Page de l'application à ouvrir au clic (ex. « evenements », « dashboard »). */
  @Column({ type: 'varchar', length: 60, nullable: true })
  link: string | null;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
