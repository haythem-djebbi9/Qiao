import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

/**
 * États financiers d'une transaction de prestation (spécification « Secure Payment & Dispute Management » v1.0, §3).
 * Raffinements : REQUESTED (demande en attente d'acceptation, aucun argent engagé),
 * REFUND_FAILED et PAYOUT_FAILED (échec confirmé par le prestataire de paiement, intervention requise — BR-09).
 */
export const TRANSACTION_STATUSES = [
  'REQUESTED',
  'PAYMENT_PENDING',
  'PAYMENT_FAILED',
  'PAID_HELD',
  'IN_PROGRESS',
  'COMPLETION_DECLARED',
  'PROTECTION_PERIOD',
  'DISPUTED',
  'UNDER_REVIEW',
  'ADDITIONAL_EVIDENCE_REQUIRED',
  'REFUND_APPROVED',
  'REFUND_PROCESSING',
  'REFUND_FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'DISPUTE_REJECTED',
  'PAYOUT_PENDING',
  'PAYOUT_PROCESSING',
  'PAYOUT_FAILED',
  'PAID_OUT',
  'CANCELLED',
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

/** Cycle de vie de la prestation, distinct du cycle financier (une prestation peut être livrée pendant que le versement est en cours). */
export type ServiceStatus = 'requested' | 'declined' | 'accepted' | 'in_progress' | 'delivered' | 'confirmed' | 'cancelled';

export type DisputeStatus = 'open' | 'under_review' | 'evidence_requested' | 'resolved';
export type DisputeOutcome = 'full_refund' | 'partial_refund' | 'rejected';
export type RefundStatus = 'approved' | 'processing' | 'completed' | 'failed';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PartyRole = 'client' | 'provider' | 'reviewer' | 'system' | 'payment_provider';

/** Proposition d'accord amiable (annulation / remboursement partiel) en attente de réponse de l'autre partie. */
export interface SettlementProposal {
  proposedBy: 'client' | 'provider';
  proposedById: string;
  refundAmount: number;
  note: string | null;
  proposedAt: string;
}

/** Transaction de prestation payée via QIAO : la plateforme est l'intermédiaire de confiance entre le client et le prestataire. */
@Entity('service_transactions')
@Index(['status', 'protectionDeadlineAt'])
export class ServiceTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Référence lisible communiquée aux parties (ex. QP-261018-7F3A2C). */
  @Column({ type: 'varchar', length: 24, unique: true })
  reference: string;

  @Index()
  @Column('uuid')
  clientId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Index()
  @Column('uuid')
  providerId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'providerId' })
  provider: User;

  // --- Accord (description de la prestation acceptée par les deux parties) ---

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: string | null;

  /** Conditions ajoutées par le prestataire à l'acceptation (livrables, délais, exclusions). */
  @Column({ type: 'text', nullable: true })
  providerTerms: string | null;

  // --- Conditions financières convenues (montants en unités mineures : centimes, millimes...) ---

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  /** Montant proposé par le client à la demande. */
  @Column({ type: 'integer' })
  requestedAmount: number;

  /** Montant brut convenu et payé par le client. */
  @Column({ type: 'integer' })
  amount: number;

  /** Taux de commission QIAO figé à l'acceptation (points de base : 1000 = 10 %). */
  @Column({ type: 'integer', default: 0 })
  commissionRateBps: number;

  /** Frais du prestataire de paiement, connus à la confirmation du paiement. */
  @Column({ type: 'integer', default: 0 })
  processingFeeAmount: number;

  /** Montant remboursé et confirmé par le prestataire de paiement. */
  @Column({ type: 'integer', default: 0 })
  refundedAmount: number;

  /** Montant versé au prestataire et confirmé par le prestataire de paiement. */
  @Column({ type: 'integer', default: 0 })
  paidOutAmount: number;

  // --- États ---

  @Index()
  @Column({ type: 'varchar', length: 32, default: 'REQUESTED' })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 16, default: 'requested' })
  serviceStatus: ServiceStatus;

  // --- Paiement ---

  @Column({ type: 'varchar', length: 20, nullable: true })
  paymentProvider: string | null;

  /** Session de paiement en cours (une seule active à la fois). */
  @Index()
  @Column({ type: 'varchar', length: 80, nullable: true })
  checkoutRef: string | null;

  @Column({ type: 'integer', default: 0 })
  checkoutAttempts: number;

  /** Référence du paiement confirmé chez le prestataire de paiement. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  paymentRef: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  paymentFailureReason: string | null;

  // --- Horodatages (serveur, UTC) — §4 de la spécification ---

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completionDeclaredAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  protectionPeriodStartedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  protectionDeadlineAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deadlineReminderSentAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  clientConfirmationAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  disputeSubmittedAt: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  disputeStatus: DisputeStatus | null;

  @Column({ type: 'timestamptz', nullable: true })
  payoutAuthorizedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  payoutCompletedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  refundCompletedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cancellationReason: string | null;

  // --- Accord amiable en attente ---

  @Column({ type: 'jsonb', nullable: true })
  settlementProposal: SettlementProposal | null;

  // --- Restrictions et interventions ---

  /** Blocage administratif (fraude, juridique, prestataire de paiement) : aucun versement tant qu'il est actif. */
  @Column({ default: false })
  payoutHold: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  payoutHoldReason: string | null;

  /** Cas nécessitant une action manuelle de QIAO (échec confirmé, paiement en double, versement irrévocable...). */
  @Column({ default: false })
  requiresIntervention: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  interventionReason: string | null;

  /** Dernière raison pour laquelle la libération des fonds a été refusée par le contrôle automatique. */
  @Column({ type: 'varchar', length: 300, nullable: true })
  releaseBlockedReason: string | null;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Historique de la transaction (insertion uniquement) : changements d'état, actions des parties et de QIAO. */
@Entity('service_transaction_events')
export class TransactionEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  transactionId: string;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 20 })
  actorRole: PartyRole;

  @Column({ type: 'varchar', length: 40 })
  type: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  fromStatus: TransactionStatus | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  toStatus: TransactionStatus | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  message: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  details: Record<string, unknown>;

  /** Visible des seules équipes QIAO (notes internes, informations de contrôle). */
  @Column({ default: false })
  internal: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

/** Déclaration « prestation terminée » : une seule par transaction (le délai ne peut pas être relancé). */
@Entity('service_completion_declarations')
export class CompletionDeclaration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('uuid')
  transactionId: string;

  @Column('uuid')
  providerId: string;

  @Column({ type: 'text' })
  details: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  attachmentIds: string[];

  /** Horodatage serveur (jamais celui de l'appareil du prestataire). */
  @Column({ type: 'timestamptz' })
  declaredAt: Date;

  @Column({ type: 'varchar', length: 60, nullable: true })
  ip: string | null;
}

/** Litige ouvert par le client. Un litige ne déclenche jamais de remboursement ni de versement automatique. */
@Entity('service_disputes')
export class ServiceDispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('uuid')
  transactionId: string;

  @Column('uuid')
  clientId: string;

  @Column({ type: 'varchar', length: 30 })
  reason: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 30 })
  expectedResolution: string;

  /** Montant de remboursement souhaité par le client (remboursement partiel). */
  @Column({ type: 'integer', nullable: true })
  requestedRefundAmount: number | null;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: DisputeStatus;

  @Column({ type: 'timestamptz' })
  submittedAt: Date;

  /** Statut de la transaction au moment de l'ouverture (période de protection, prestation en cours...). */
  @Column({ type: 'varchar', length: 32 })
  openedFromStatus: TransactionStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewerId: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  reviewerName: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewStartedAt: Date | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  evidenceRequestedFrom: 'client' | 'provider' | 'both' | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  evidenceRequestMessage: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  evidenceRequestedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  providerRespondedAt: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  outcome: DisputeOutcome | null;

  @Column({ type: 'integer', nullable: true })
  decisionRefundAmount: number | null;

  @Column({ type: 'text', nullable: true })
  decisionRationale: string | null;

  @Column({ type: 'uuid', nullable: true })
  decidedById: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  decidedByName: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Pièces du dossier de litige : réclamation, réponse du prestataire, éléments complémentaires, notes internes. */
@Entity('service_dispute_entries')
export class DisputeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  disputeId: string;

  @Column({ type: 'uuid', nullable: true })
  authorId: string | null;

  @Column({ type: 'varchar', length: 120 })
  authorName: string;

  @Column({ type: 'varchar', length: 20 })
  authorRole: PartyRole;

  @Column({ type: 'varchar', length: 20 })
  kind: 'complaint' | 'response' | 'evidence' | 'evidence_request' | 'decision' | 'internal_note';

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  attachmentIds: string[];

  @CreateDateColumn()
  createdAt: Date;
}

/** Remboursement : approuvé ≠ en cours ≠ effectué ≠ échoué (BR-09). */
@Entity('service_refunds')
export class ServiceRefund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  transactionId: string;

  @Column({ type: 'uuid', nullable: true })
  disputeId: string | null;

  /** Origine de la décision : litige, accord amiable, annulation. */
  @Column({ type: 'varchar', length: 30 })
  source: 'dispute_decision' | 'mutual_agreement' | 'provider_cancellation' | 'client_cancellation';

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'varchar', length: 16, default: 'approved' })
  status: RefundStatus;

  /** Incrémenté à chaque nouvelle tentative après un échec confirmé (clé d'idempotence distincte). */
  @Column({ type: 'integer', default: 0 })
  attempt: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  providerRef: string | null;

  @Column({ type: 'uuid', nullable: true })
  approvedById: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  approvedByName: string | null;

  @Column({ type: 'timestamptz' })
  approvedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  failureReason: string | null;

  /** Dernière erreur technique de soumission (résultat inconnu : la soumission sera rejouée avec la même clé). */
  @Column({ type: 'varchar', length: 300, nullable: true })
  lastError: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Versement au prestataire : un seul par transaction (contrainte d'unicité), jamais en double lors d'une reprise. */
@Entity('service_payouts')
export class ServicePayout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('uuid')
  transactionId: string;

  @Column('uuid')
  providerId: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'integer', default: 0 })
  commissionAmount: number;

  @Column({ type: 'integer', default: 0 })
  processingFeeAmount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: PayoutStatus;

  @Column({ type: 'integer', default: 0 })
  attempt: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  providerRef: string | null;

  /** Fondement de la libération : délai expiré sans litige, décision de litige, accord amiable. */
  @Column({ type: 'varchar', length: 30 })
  basis: 'protection_period_expired' | 'dispute_rejected' | 'partial_refund_decision' | 'mutual_agreement';

  @Column({ type: 'timestamptz' })
  authorizedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  failureReason: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  lastError: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export const LEDGER_EVENT_TYPES = [
  'PAYMENT_CAPTURED',
  'PAYMENT_FAILED',
  'DUPLICATE_PAYMENT',
  'PAYOUT_BLOCKED',
  'REFUND_APPROVED',
  'REFUND_SUBMITTED',
  'REFUND_COMPLETED',
  'REFUND_FAILED',
  'PAYOUT_AUTHORIZED',
  'PAYOUT_SUBMITTED',
  'PAYOUT_COMPLETED',
  'PAYOUT_FAILED',
  'PAYOUT_CANCELLED',
  'COMMISSION_EARNED',
  'ADJUSTMENT',
  'REVERSAL',
] as const;
export type LedgerEventType = (typeof LEDGER_EVENT_TYPES)[number];

/**
 * Grand livre financier (§8) : insertion uniquement, jamais modifié. Chaque écriture porte l'état financier
 * complet de la transaction après l'événement ; une correction prend la forme d'une écriture ADJUSTMENT / REVERSAL.
 */
@Entity('service_ledger_entries')
@Index(['transactionId', 'createdAt'])
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  transactionId: string;

  @Column('uuid')
  clientId: string;

  @Column('uuid')
  providerId: string;

  @Column({ type: 'varchar', length: 24 })
  eventType: LedgerEventType;

  @Column({ type: 'varchar', length: 16 })
  eventStatus: 'recorded' | 'pending' | 'succeeded' | 'failed' | 'cancelled';

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  /** Montant de l'événement (positif) ; le sens découle du type d'événement. */
  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'integer' })
  grossAmount: number;

  @Column({ type: 'integer' })
  commissionAmount: number;

  @Column({ type: 'integer' })
  processingFeeAmount: number;

  /** Montant encore retenu pour la transaction après l'événement. */
  @Column({ type: 'integer' })
  heldAmount: number;

  /** Cumul des remboursements confirmés après l'événement. */
  @Column({ type: 'integer' })
  refundAmount: number;

  /** Versement prestataire (éligible ou effectué) après l'événement. */
  @Column({ type: 'integer' })
  providerPayoutAmount: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  paymentProviderRef: string | null;

  @Column({ type: 'uuid', nullable: true })
  disputeId: string | null;

  /** Décision associée (décision de litige, accord amiable, action administrative). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  decisionRef: string | null;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  note: string | null;

  /** Garantit qu'un même événement (webhook rejoué, requête répétée) n'est jamais comptabilisé deux fois. */
  @Column({ type: 'varchar', length: 160, unique: true })
  idempotencyKey: string;

  @CreateDateColumn()
  createdAt: Date;
}

/** Notifications reçues du prestataire de paiement (authentifiées, dédoublonnées, traitées une seule fois). */
@Entity('payment_webhook_events')
@Unique(['provider', 'eventId'])
export class PaymentWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'varchar', length: 120 })
  eventId: string;

  @Column({ type: 'varchar', length: 40 })
  type: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', length: 16, default: 'received' })
  status: 'received' | 'processed' | 'ignored' | 'failed';

  @Column({ type: 'varchar', length: 300, nullable: true })
  error: string | null;

  @CreateDateColumn()
  receivedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;
}

/** Compte de versement du prestataire, ouvert et vérifié (KYC) chez le prestataire de paiement — QIAO ne stocke aucune coordonnée bancaire. */
@Entity('payout_accounts')
export class PayoutAccount {
  @PrimaryColumn('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  accountRef: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: 'pending' | 'active' | 'restricted';

  @Column({ type: 'varchar', length: 120, nullable: true })
  label: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Pièces justificatives (déclaration, litige) : visibles uniquement des parties et des équipes QIAO. */
@Entity('service_attachments')
export class ServiceAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  ownerId: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  transactionId: string | null;

  @Column({ type: 'varchar', length: 200 })
  originalName: string;

  @Column({ type: 'varchar', length: 120 })
  storagePath: string;

  @Column({ type: 'varchar', length: 120 })
  mime: string;

  @Column({ type: 'integer' })
  size: number;

  @CreateDateColumn()
  createdAt: Date;
}
