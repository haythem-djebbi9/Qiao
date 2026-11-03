import { BadRequestException } from '@nestjs/common';

/**
 * Règles financières et de délai du module « Services & paiements sécurisés ».
 * Interprétation approuvée par le responsable produit le 18/10/2026 (spécification §4) : 5 jours calendaires
 * (120 h, UTC, sans prolongation week-end / jours fériés), commission sur le montant libéré, frais au prorata,
 * remboursement intégral en cas d'annulation avant démarrage.
 * Toute modification de ces règles doit être de nouveau approuvée et reflétée dans la politique publiée.
 */

// --- Délai de protection (§4) ------------------------------------------------------------------

export const PROTECTION_PERIOD_DAYS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Durée de la période de protection : 5 jours calendaires consécutifs (5 × 24 h) à compter de l'horodatage
 * serveur de la déclaration. Le raccourcissement de test n'est possible qu'avec le prestataire « sandbox »
 * hors production, et ne s'applique qu'aux déclarations faites pendant qu'il est actif (l'échéance est figée).
 */
export function protectionPeriodMs(): number {
  const override = Number(process.env.PAYMENT_SANDBOX_PROTECTION_MINUTES);
  const sandbox = (process.env.PAYMENT_PROVIDER ?? 'sandbox') === 'sandbox';
  if (override > 0 && sandbox && process.env.NODE_ENV !== 'production') return override * 60 * 1000;
  return PROTECTION_PERIOD_DAYS * DAY_MS;
}

/** Rappel envoyé au client avant l'échéance. */
export const DEADLINE_REMINDER_MS = DAY_MS;

export const DEADLINE_POLICY = {
  periodDays: PROTECTION_PERIOD_DAYS,
  dayType: 'calendar' as const,
  referenceTimeZone: 'UTC',
  rules: [
    "La période de protection commence à l'horodatage serveur (UTC) de la déclaration « prestation terminée ». L'horloge de l'appareil du prestataire n'est jamais utilisée.",
    "Elle dure 5 jours calendaires consécutifs, soit exactement 120 heures : une déclaration enregistrée le lundi à 14 h 32 (UTC) expire le samedi à 14 h 32 (UTC).",
    "Les week-ends et jours fériés ne prolongent pas et ne raccourcissent pas la période (jours calendaires, et non jours ouvrés).",
    "L'échéance est affichée à chaque utilisateur dans son fuseau horaire local ; elle est stockée en UTC.",
    "Une seule déclaration est acceptée par transaction : la renvoyer ne relance pas le délai.",
    "Un litige recevable déposé avant l'échéance bloque tout versement jusqu'à la décision de QIAO.",
    "Après l'échéance sans litige, le versement est initié automatiquement si toutes les conditions de libération sont réunies ; le délai de réception dépend ensuite du prestataire de paiement et de la banque du prestataire (généralement 1 à 3 jours ouvrés).",
  ],
};

// --- Devises et montants ---------------------------------------------------------------------

export const CURRENCIES: Record<string, { decimals: number; label: string }> = {
  EUR: { decimals: 2, label: 'Euro' },
  USD: { decimals: 2, label: 'Dollar américain' },
  CNY: { decimals: 2, label: 'Yuan renminbi' },
  TND: { decimals: 3, label: 'Dinar tunisien' },
};

export const MIN_AMOUNT_MAJOR = 10;
export const MAX_AMOUNT_MAJOR = 500_000;

export function currencyDecimals(currency: string): number {
  const config = CURRENCIES[currency];
  if (!config) throw new BadRequestException('Devise non prise en charge.');
  return config.decimals;
}

/** « 1 250,50 » → 125050 (centimes) — conversion exacte, sans calcul en virgule flottante. */
export function toMinor(value: string | number, currency: string): number {
  const decimals = currencyDecimals(currency);
  const text = String(value).replace(/\s/g, '').replace(',', '.');
  const match = /^(\d{1,7})(?:\.(\d+))?$/.exec(text);
  if (!match) throw new BadRequestException('Montant invalide.');
  const fraction = match[2] ?? '';
  if (fraction.length > decimals) throw new BadRequestException(`Le montant accepte au plus ${decimals} décimales en ${currency}.`);
  const minor = Number(match[1]) * 10 ** decimals + Number(fraction.padEnd(decimals, '0') || '0');
  const factor = 10 ** decimals;
  if (minor < MIN_AMOUNT_MAJOR * factor || minor > MAX_AMOUNT_MAJOR * factor) {
    throw new BadRequestException(`Le montant doit être compris entre ${MIN_AMOUNT_MAJOR} et ${MAX_AMOUNT_MAJOR.toLocaleString('fr-FR')} ${currency}.`);
  }
  return minor;
}

/** Remboursement partiel : montant strictement positif et au plus égal au montant restant. */
export function parsePartialAmount(value: string | number, currency: string, max: number): number {
  const decimals = currencyDecimals(currency);
  const text = String(value).replace(/\s/g, '').replace(',', '.');
  const match = /^(\d{1,7})(?:\.(\d+))?$/.exec(text);
  if (!match || (match[2] ?? '').length > decimals) throw new BadRequestException('Montant de remboursement invalide.');
  const minor = Number(match[1]) * 10 ** decimals + Number((match[2] ?? '').padEnd(decimals, '0') || '0');
  if (minor <= 0 || minor > max) {
    throw new BadRequestException(`Le remboursement doit être compris entre 0 et ${formatMoney(max, currency)}.`);
  }
  return minor;
}

export function formatMoney(minor: number, currency: string): string {
  const decimals = CURRENCIES[currency]?.decimals ?? 2;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: decimals }).format(minor / 10 ** decimals);
}

// --- Commission et frais -----------------------------------------------------------------------

/** Taux de commission QIAO (en points de base), figé sur la transaction à l'acceptation du prestataire. */
export function commissionRateBps(): number {
  const percent = Number(process.env.PAYMENT_COMMISSION_PERCENT ?? '10');
  if (!Number.isFinite(percent) || percent < 0) return 0;
  return Math.min(5000, Math.round(percent * 100));
}

export interface SettlementBreakdown {
  gross: number;
  refunded: number;
  /** Montant brut non remboursé, à libérer au prestataire. */
  releasable: number;
  commission: number;
  /** Part des frais de paiement supportée par le prestataire (au prorata du montant libéré). */
  providerFee: number;
  /** Part des frais absorbée par QIAO (au prorata du montant remboursé). */
  platformFee: number;
  payout: number;
}

/**
 * Calcul du versement selon les conditions financières convenues (BR-10) :
 *  - les remboursements sont prélevés sur le montant brut retenu ;
 *  - la commission QIAO s'applique au seul montant libéré ;
 *  - les frais de paiement sont répartis au prorata (montant libéré → prestataire, montant remboursé → QIAO).
 */
export function computeSettlement(input: { gross: number; processingFee: number; commissionRateBps: number; refunded: number }): SettlementBreakdown {
  const gross = input.gross;
  const refunded = Math.min(gross, Math.max(0, input.refunded));
  const releasable = gross - refunded;
  const commission = Math.round((releasable * input.commissionRateBps) / 10_000);
  const providerFee = gross > 0 ? Math.round((input.processingFee * releasable) / gross) : 0;
  const payout = Math.max(0, releasable - commission - providerFee);
  return { gross, refunded, releasable, commission, providerFee, platformFee: input.processingFee - providerFee, payout };
}

// --- Litiges ---------------------------------------------------------------------------------

export const DISPUTE_REASONS: Record<string, string> = {
  not_delivered: 'Prestation non réalisée',
  incomplete: 'Prestation incomplète',
  not_as_described: "Non conforme à l'accord",
  quality: 'Qualité insuffisante',
  late: 'Retard important',
  other: 'Autre motif',
};

export const EXPECTED_RESOLUTIONS: Record<string, string> = {
  full_refund: 'Remboursement intégral',
  partial_refund: 'Remboursement partiel',
  rework: 'Reprise / correction de la prestation',
  other: 'Autre solution',
};

/** Règles d'annulation (§7) publiées dans la politique de service. */
export const CANCELLATION_RULES = [
  "Avant paiement : le client comme le prestataire peuvent annuler librement ; aucun mouvement financier.",
  "Après paiement, avant le démarrage de la prestation : une annulation par le prestataire, ou par le client, donne lieu au remboursement intégral du client.",
  "Après le démarrage de la prestation : l'annulation ou le remboursement partiel nécessitent un accord amiable accepté par les deux parties, ou une décision de QIAO à l'issue d'un litige.",
  "Accord amiable : le montant remboursé est convenu entre les parties ; le solde est versé au prestataire après confirmation du remboursement et, si la prestation a été déclarée terminée, après l'échéance de la période de protection.",
];
