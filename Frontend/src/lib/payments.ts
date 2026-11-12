/** Services & paiements sécurisés : formes renvoyées par l'API (Backend/src/modules/payments) et libellés. */
import { useEffect, useState } from 'react';
import { appLocale } from '../i18n/runtime';

export type TxStatus =
  | 'REQUESTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_FAILED'
  | 'PAID_HELD'
  | 'IN_PROGRESS'
  | 'COMPLETION_DECLARED'
  | 'PROTECTION_PERIOD'
  | 'DISPUTED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_EVIDENCE_REQUIRED'
  | 'REFUND_APPROVED'
  | 'REFUND_PROCESSING'
  | 'REFUND_FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'DISPUTE_REJECTED'
  | 'PAYOUT_PENDING'
  | 'PAYOUT_PROCESSING'
  | 'PAYOUT_FAILED'
  | 'PAID_OUT'
  | 'CANCELLED';

export type ViewerRole = 'client' | 'provider' | 'reviewer';

export interface Party {
  id: string;
  fullName: string;
  handle: string | null;
  avatarUrl: string | null;
  company: string | null;
  headline: string | null;
  verifiedProvider: boolean;
}

export interface TxSummary {
  id: string;
  reference: string;
  title: string;
  status: TxStatus;
  serviceStatus: string;
  currency: string;
  amount: number;
  refundedAmount: number;
  viewerRole: ViewerRole;
  client: Party | null;
  provider: Party | null;
  protectionDeadlineAt: string | null;
  disputeStatus: string | null;
  settlementPending: boolean;
  requiresIntervention: boolean;
  payoutHold: boolean;
  actions: string[];
  createdAt: string;
  updatedAt: string;
  releaseBlockedReason?: string | null;
  interventionReason?: string | null;
}

export interface FileRef {
  id: string;
  name: string;
  mime: string;
  size: number;
}

export interface DisputeEntryView {
  id: string;
  authorRole: 'client' | 'provider' | 'reviewer';
  authorName: string;
  kind: 'complaint' | 'response' | 'evidence' | 'evidence_request' | 'decision' | 'internal_note';
  message: string;
  attachmentIds: string[];
  createdAt: string;
}

export interface LedgerRow {
  id: string;
  eventType: string;
  eventStatus: string;
  currency: string;
  amount: number;
  grossAmount: number;
  commissionAmount: number;
  processingFeeAmount: number;
  heldAmount: number;
  refundAmount: number;
  providerPayoutAmount: number;
  paymentProviderRef: string | null;
  decisionRef: string | null;
  note: string | null;
  createdAt: string;
}

export interface TxDetail extends TxSummary {
  description: string;
  providerTerms: string | null;
  expectedDeliveryDate: string | null;
  requestedAmount: number;
  financial: {
    currency: string;
    gross: number;
    refunded: number;
    releasable?: number;
    commission?: number;
    providerFee?: number;
    platformFee?: number;
    payout?: number;
    commissionRateBps?: number;
    processingFee?: number;
    paidOut?: number;
  };
  timestamps: Record<string, string | null>;
  deadlinePassed: boolean;
  cancellationReason: string | null;
  paymentFailureReason: string | null;
  settlementProposal: { proposedBy: 'client' | 'provider'; refundAmount: number; note: string | null; proposedAt: string } | null;
  payoutHoldReason: string | null;
  declaration: { details: string; declaredAt: string; attachmentIds: string[] } | null;
  dispute: {
    id: string;
    reason: string;
    description: string;
    expectedResolution: string;
    requestedRefundAmount: number | null;
    status: 'open' | 'under_review' | 'evidence_requested' | 'resolved';
    submittedAt: string;
    reviewerName: string | null;
    evidenceRequestedFrom: 'client' | 'provider' | 'both' | null;
    evidenceRequestMessage: string | null;
    providerRespondedAt: string | null;
    outcome: 'full_refund' | 'partial_refund' | 'rejected' | null;
    decisionRefundAmount: number | null;
    decisionRationale: string | null;
    decidedAt: string | null;
    decidedByName: string | null;
    entries: DisputeEntryView[];
  } | null;
  refunds: { id: string; source: string; amount: number; status: string; approvedAt: string; completedAt: string | null; failureReason: string | null; attempt?: number; providerRef?: string | null; approvedByName?: string | null; lastError?: string | null }[];
  payout: {
    amount: number;
    commissionAmount: number;
    processingFeeAmount: number;
    status: string;
    basis: string;
    authorizedAt: string;
    submittedAt: string | null;
    completedAt: string | null;
    failureReason: string | null;
    attempt?: number;
    providerRef?: string | null;
    lastError?: string | null;
  } | null;
  attachments: FileRef[];
  events: { id: string; type: string; actorRole: string; fromStatus: TxStatus | null; toStatus: TxStatus | null; message: string | null; internal: boolean; createdAt: string }[];
  // Vue QIAO uniquement
  paymentProvider?: string | null;
  paymentRef?: string | null;
  checkoutRef?: string | null;
  payoutAccount?: { status: string; provider: string; accountRef: string } | null;
  ledger?: LedgerRow[];
  audit?: { id: string; actorName: string; action: string; details: Record<string, unknown>; createdAt: string }[];
}

export interface PaymentPolicy {
  paymentsEnabled: boolean;
  provider: string;
  deadline: { periodDays: number; dayType: string; referenceTimeZone: string; rules: string[] };
  cancellation: string[];
  disputeReasons: Record<string, string>;
  expectedResolutions: Record<string, string>;
  currencies: Record<string, { decimals: number; label: string }>;
  commissionPercent: number;
}

type Tone = 'slate' | 'amber' | 'blue' | 'violet' | 'red' | 'emerald';

export const STATUS_META: Record<TxStatus, { label: string; tone: Tone }> = {
  REQUESTED: { label: 'Demande envoyée', tone: 'amber' },
  PAYMENT_PENDING: { label: 'En attente de paiement', tone: 'amber' },
  PAYMENT_FAILED: { label: 'Paiement refusé', tone: 'red' },
  PAID_HELD: { label: 'Payée — fonds retenus', tone: 'blue' },
  IN_PROGRESS: { label: 'Prestation en cours', tone: 'blue' },
  COMPLETION_DECLARED: { label: 'Fin déclarée', tone: 'violet' },
  PROTECTION_PERIOD: { label: 'Période de protection', tone: 'violet' },
  DISPUTED: { label: 'Litige ouvert', tone: 'red' },
  UNDER_REVIEW: { label: 'Litige en examen', tone: 'red' },
  ADDITIONAL_EVIDENCE_REQUIRED: { label: 'Éléments demandés', tone: 'red' },
  REFUND_APPROVED: { label: 'Remboursement approuvé', tone: 'amber' },
  REFUND_PROCESSING: { label: 'Remboursement en cours', tone: 'amber' },
  REFUND_FAILED: { label: 'Remboursement en échec', tone: 'red' },
  REFUNDED: { label: 'Remboursée', tone: 'slate' },
  PARTIALLY_REFUNDED: { label: 'Remboursée partiellement', tone: 'amber' },
  DISPUTE_REJECTED: { label: 'Contestation rejetée', tone: 'slate' },
  PAYOUT_PENDING: { label: 'Versement autorisé', tone: 'emerald' },
  PAYOUT_PROCESSING: { label: 'Versement en cours', tone: 'emerald' },
  PAYOUT_FAILED: { label: 'Versement en échec', tone: 'red' },
  PAID_OUT: { label: 'Versée au prestataire', tone: 'emerald' },
  CANCELLED: { label: 'Annulée', tone: 'slate' },
};

export const TONE_CLASSES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

/** Actions qui attendent une réponse de l'utilisateur (pastille « Action requise »). */
export const PRIORITY_ACTIONS = ['accept', 'pay', 'declare_completion', 'add_evidence', 'accept_settlement', 'confirm'];

export const OUTCOME_LABELS: Record<string, string> = {
  full_refund: 'Remboursement intégral',
  partial_refund: 'Remboursement partiel',
  rejected: 'Contestation rejetée',
};

export const REFUND_SOURCE_LABELS: Record<string, string> = {
  dispute_decision: 'Décision de QIAO',
  mutual_agreement: 'Accord amiable',
  provider_cancellation: 'Annulation par le prestataire',
  client_cancellation: 'Annulation par le client',
};

export const OPERATION_STATUS_LABELS: Record<string, string> = {
  approved: 'Approuvé',
  pending: 'Autorisé',
  processing: 'Transmis au prestataire de paiement',
  completed: 'Confirmé',
  failed: 'En échec',
  cancelled: 'Annulé',
};

export const PAYOUT_BASIS_LABELS: Record<string, string> = {
  protection_period_expired: 'Période de protection expirée sans litige',
  dispute_rejected: 'Contestation rejetée par QIAO',
  partial_refund_decision: 'Solde après remboursement partiel (décision QIAO)',
  mutual_agreement: 'Solde après accord amiable',
};

export const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  provider: 'Prestataire',
  reviewer: 'QIAO',
  system: 'Système',
  payment_provider: 'Prestataire de paiement',
};

export const CURRENCY_DECIMALS: Record<string, number> = { EUR: 2, USD: 2, CNY: 2, TND: 3 };

export function formatMoney(minor: number, currency: string): string {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return new Intl.NumberFormat(appLocale(), { style: 'currency', currency, minimumFractionDigits: decimals }).format(minor / 10 ** decimals);
}

/** Valeur à pré-remplir dans un champ de saisie (« 1600,50 »). */
export function toInputAmount(minor: number, currency: string): string {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return (minor / 10 ** decimals).toFixed(decimals).replace('.', ',').replace(/,0+$/, '');
}

/** Date et heure dans le fuseau local de l'utilisateur, fuseau indiqué (l'API stocke en UTC). */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function timeLeft(value: string | null | undefined, now = Date.now()): string | null {
  if (!value) return null;
  const diff = new Date(value).getTime() - now;
  if (diff <= 0) return null;
  const minutes = Math.floor(diff / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days} j ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes % 60} min`;
  return `${Math.max(1, minutes)} min`;
}

// --- Routeur de l'espace membre (?tab=dashboard&dv=prestations/<id>) ---------------------------

const listeners = new Set<(route: string) => void>();

function readDashboardRoute(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('dv') ?? '';
}

export function navigateDashboard(route: string, options: { replace?: boolean } = {}) {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', 'dashboard');
  if (route) url.searchParams.set('dv', route);
  else url.searchParams.delete('dv');
  url.hash = '';
  if (url.toString() !== window.location.href) {
    window.history[options.replace ? 'replaceState' : 'pushState'](null, '', url.toString());
  }
  listeners.forEach((listener) => listener(route));
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

export function useDashboardRoute(): string[] {
  const [route, setRoute] = useState(readDashboardRoute);
  useEffect(() => {
    const onChange = (next: string) => setRoute(next);
    const onPop = () => setRoute(readDashboardRoute());
    listeners.add(onChange);
    window.addEventListener('popstate', onPop);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener('popstate', onPop);
    };
  }, []);
  return route.split('/').filter(Boolean);
}

/** Retire un paramètre de retour (paiement, compte de versement) une fois pris en compte. */
export function consumeQueryParam(name: string): string | null {
  const url = new URL(window.location.href);
  const value = url.searchParams.get(name);
  if (value !== null) {
    url.searchParams.delete(name);
    window.history.replaceState(null, '', url.toString());
  }
  return value;
}
