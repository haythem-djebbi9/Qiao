import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { CURRENCIES, DISPUTE_REASONS, EXPECTED_RESOLUTIONS } from './payments.policy';

const AMOUNT = /^\s*\d[\d\s]{0,9}([.,]\d{1,3})?\s*$/;

export class CreateTransactionDto {
  @IsString()
  @Length(2, 60)
  providerHandle: string;

  @IsString()
  @Length(5, 160, { message: 'Le titre de la prestation doit contenir entre 5 et 160 caractères.' })
  title: string;

  @IsString()
  @Length(20, 5000, { message: 'Décrivez la prestation attendue (20 caractères minimum).' })
  description: string;

  @IsString()
  @Matches(AMOUNT, { message: 'Montant invalide.' })
  amount: string;

  @IsIn(Object.keys(CURRENCIES), { message: 'Devise non prise en charge.' })
  currency: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date de livraison invalide.' })
  expectedDeliveryDate?: string;
}

export class AcceptTransactionDto {
  @IsOptional()
  @IsString()
  @Matches(AMOUNT, { message: 'Montant invalide.' })
  amount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  terms?: string;
}

export class ReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AttachmentsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6, { message: 'Six pièces jointes au maximum.' })
  @IsUUID('4', { each: true })
  attachmentIds?: string[];
}

export class DeclareCompletionDto extends AttachmentsDto {
  @IsString()
  @Length(10, 5000, { message: 'Décrivez la prestation réalisée (10 caractères minimum).' })
  details: string;
}

export class OpenDisputeDto extends AttachmentsDto {
  @IsIn(Object.keys(DISPUTE_REASONS), { message: 'Motif de contestation invalide.' })
  reason: string;

  @IsString()
  @Length(20, 5000, { message: 'Décrivez le problème rencontré (20 caractères minimum).' })
  description: string;

  @IsIn(Object.keys(EXPECTED_RESOLUTIONS), { message: 'Résolution attendue invalide.' })
  expectedResolution: string;

  @IsOptional()
  @IsString()
  @Matches(AMOUNT, { message: 'Montant invalide.' })
  requestedRefundAmount?: string;
}

export class DisputeEntryDto extends AttachmentsDto {
  @IsString()
  @Length(2, 5000, { message: 'Votre message est vide.' })
  message: string;
}

export class SettlementDto {
  @IsString()
  @Matches(AMOUNT, { message: 'Montant invalide.' })
  refundAmount: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class ListTransactionsQuery {
  @IsOptional()
  @IsIn(['client', 'provider', 'all'])
  role?: 'client' | 'provider' | 'all';
}

// --- Administration --------------------------------------------------------------------------

export const ADMIN_QUEUES = [
  'all',
  'awaiting_payment',
  'awaiting_completion',
  'protection_period',
  'disputes_review',
  'disputes_evidence',
  'refunds_pending',
  'refunds_failed',
  'payouts_pending',
  'payouts_failed',
  'intervention',
  'closed',
] as const;

export class AdminQueueQuery {
  @IsOptional()
  @IsIn([...ADMIN_QUEUES])
  queue?: (typeof ADMIN_QUEUES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

export class RequestEvidenceDto {
  @IsIn(['client', 'provider', 'both'])
  from: 'client' | 'provider' | 'both';

  @IsString()
  @Length(10, 1000, { message: 'Précisez les éléments attendus (10 caractères minimum).' })
  message: string;
}

export class DisputeDecisionDto {
  @IsIn(['full_refund', 'partial_refund', 'rejected'])
  outcome: 'full_refund' | 'partial_refund' | 'rejected';

  @IsOptional()
  @IsString()
  @Matches(AMOUNT, { message: 'Montant invalide.' })
  refundAmount?: string;

  @IsString()
  @Length(20, 5000, { message: 'La décision doit être motivée (20 caractères minimum).' })
  rationale: string;
}

export class AdminNoteDto {
  @IsString()
  @Length(2, 2000)
  message: string;
}

export class HoldDto {
  @IsString()
  @Length(5, 500, { message: 'Indiquez le motif du blocage.' })
  reason: string;
}

export class ResolveInterventionDto {
  @IsString()
  @Length(5, 500, { message: "Décrivez l'action menée." })
  note: string;
}

export class AdjustmentDto {
  @IsIn(['ADJUSTMENT', 'REVERSAL'])
  type: 'ADJUSTMENT' | 'REVERSAL';

  @IsString()
  @Matches(AMOUNT, { message: 'Montant invalide.' })
  amount: string;

  @IsString()
  @Length(10, 300, { message: "Motivez l'écriture (10 caractères minimum)." })
  note: string;
}
