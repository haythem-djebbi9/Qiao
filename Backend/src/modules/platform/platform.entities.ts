import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Événements d'usage (analytique). Une ligne = un événement défini sans ambiguïté :
 * une question qui reçoit trois commentaires reste une seule question_created.
 * Aucun contenu de message privé n'est enregistré ici.
 */
export type ActivityType =
  | 'community_visit'
  | 'post_created'
  | 'question_created'
  | 'comment_created'
  | 'membership_joined'
  | 'profile_view'
  | 'contact_initiated'
  | 'report_submitted'
  | 'report_resolved'
  | 'auth_failure'
  | 'link_error';

@Entity('activity_events')
@Index(['type', 'createdAt'])
export class ActivityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  type: ActivityType;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  targetType: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  targetId: string | null;

  /** Jour (UTC) : permet de dédoublonner les visites quotidiennes. */
  @Column({ type: 'date' })
  day: string;

  @CreateDateColumn()
  createdAt: Date;
}

/** Journal d'audit des actions sensibles : insertion uniquement, jamais modifié ni supprimé par l'API. */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 120 })
  actorName: string;

  /** Ex. community.create, member.suspend, expert.verify, content.remove, role.change */
  @Column({ type: 'varchar', length: 60 })
  action: string;

  @Column({ type: 'varchar', length: 20 })
  targetType: string;

  @Column({ type: 'varchar', length: 80 })
  targetId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  targetLabel: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  details: Record<string, unknown>;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
