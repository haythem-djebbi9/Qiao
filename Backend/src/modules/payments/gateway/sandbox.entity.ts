import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * État tenu par le simulateur de prestataire de paiement (développement uniquement).
 * Il joue le rôle des serveurs du prestataire : QIAO n'y accède que via l'interface PaymentGateway.
 */
@Entity('payment_sandbox_records')
@Index(['kind', 'idempotencyKey'], { unique: true })
export class SandboxRecord {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  id: string;

  @Column({ type: 'varchar', length: 12 })
  kind: 'checkout' | 'refund' | 'payout' | 'account';

  @Column({ type: 'varchar', length: 160 })
  idempotencyKey: string;

  @Column({ type: 'varchar', length: 12, default: 'pending' })
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';

  /** Comportement simulé choisi sur la page de test (ex. carte dont les remboursements échouent). */
  @Column({ type: 'varchar', length: 20, default: 'normal' })
  behavior: 'normal' | 'refund_fail' | 'payout_fail';

  @Column({ type: 'integer', default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currency: string | null;

  @Column({ type: 'integer', default: 0 })
  fee: number;

  /** Paiement remboursé, ou compte crédité par un versement. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  linkedRef: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  failureReason: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, string>;

  @Column({ type: 'timestamptz', nullable: true })
  settledAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
