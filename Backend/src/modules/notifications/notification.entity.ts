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
  | 'payment'
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

  /** Page de l'application à ouvrir au clic (ex. « evenements », « dashboard », « community/post/<id> »). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  link: string | null;

  /** Événement Community à l'origine de la notification (préférences par type). */
  @Column({ type: 'varchar', length: 40, nullable: true })
  kind: string | null;

  /** Objet concerné : post, community, conversation, member, report. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  targetType: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  targetId: string | null;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
