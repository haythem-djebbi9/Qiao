import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  Handshake,
  History,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  PackageCheck,
  Play,
  ShieldAlert,
  ShieldCheck,
  Undo2,
  Wallet,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  FileRef,
  OPERATION_STATUS_LABELS,
  OUTCOME_LABELS,
  PAYOUT_BASIS_LABELS,
  REFUND_SOURCE_LABELS,
  ROLE_LABELS,
  TxDetail,
  TxStatus,
  consumeQueryParam,
  formatDateTime,
  formatMoney,
  timeLeft,
} from '../../lib/payments';
import { useToast } from '../../context/ToastContext';
import { Avatar, Card, EmptyState, Loading, errorMessage, inputClass } from '../community/ui';
import { ActionModal, ModalKind } from './ActionModals';
import { FileLinks, FileUploader, StatusBadge, usePaymentPolicy } from './ui';

/** États transitoires : la page se met à jour d'elle-même jusqu'à la confirmation du prestataire de paiement. */
const LIVE_STATES: TxStatus[] = ['REFUND_APPROVED', 'REFUND_PROCESSING', 'PAYOUT_PENDING', 'PAYOUT_PROCESSING', 'PARTIALLY_REFUNDED', 'DISPUTE_REJECTED'];

const STEPS = ['Demande', 'Paiement sécurisé', 'Prestation', 'Protection', 'Clôture'];

function stage(status: TxStatus): number {
  if (status === 'REQUESTED') return 0;
  if (status === 'PAYMENT_PENDING' || status === 'PAYMENT_FAILED') return 1;
  if (status === 'PAID_HELD' || status === 'IN_PROGRESS') return 2;
  if (['COMPLETION_DECLARED', 'PROTECTION_PERIOD', 'DISPUTED', 'UNDER_REVIEW', 'ADDITIONAL_EVIDENCE_REQUIRED'].includes(status)) return 3;
  if (['PAID_OUT', 'REFUNDED', 'CANCELLED'].includes(status)) return 5;
  return 4;
}

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode }> = ({ title, icon: Icon, children, action }) => (
  <Card>
    <div className="flex items-center justify-between gap-2 mb-3">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <Icon className="w-4 h-4 text-red-600" /> {title}
      </h3>
      {action}
    </div>
    {children}
  </Card>
);

const Row: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
    <span className="text-slate-500">{label}</span>
    <span className={strong ? 'font-black text-slate-900 text-sm' : 'font-semibold text-slate-800'}>{value}</span>
  </div>
);

const ActionButton: React.FC<{ onClick: () => void; icon: React.ElementType; label: string; tone?: 'primary' | 'secondary' | 'danger'; busy?: boolean }> = ({
  onClick,
  icon: Icon,
  label,
  tone = 'secondary',
  busy,
}) => (
  <button
    onClick={onClick}
    disabled={busy}
    className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
      tone === 'primary'
        ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
        : tone === 'danger'
          ? 'border border-red-200 text-red-600 hover:bg-red-50'
          : 'border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
    }`}
  >
    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
    {label}
  </button>
);

interface Props {
  id: string;
  mode: 'party' | 'admin';
  onBack: () => void;
  /** Outils de l'examinateur QIAO (vue administrateur). */
  renderAdmin?: (tx: TxDetail, update: (tx: TxDetail) => void) => React.ReactNode;
}

/** Détail d'une transaction : accord, montants, déclaration, litige, opérations financières et historique. */
export const TransactionDetail: React.FC<Props> = ({ id, mode, onBack, renderAdmin }) => {
  const { notify } = useToast();
  const policy = usePaymentPolicy();
  const [tx, setTx] = useState<TxDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [evidence, setEvidence] = useState({ message: '', files: [] as FileRef[] });
  const [, setTick] = useState(0);
  const timer = useRef<number | null>(null);

  const path = mode === 'admin' ? `/payments/admin/transactions/${id}` : `/payments/transactions/${id}`;

  const load = useCallback(async () => {
    try {
      setTx(await api.get<TxDetail>(path));
      setError(null);
    } catch (err) {
      setError(errorMessage(err, 'Transaction introuvable.'));
    }
  }, [path]);

  useEffect(() => {
    load();
    if (consumeQueryParam('payment') === 'return') setAwaitingPayment(true);
  }, [load]);

  // Rafraîchissement tant qu'une opération attend la confirmation du prestataire de paiement.
  const waiting = !!tx && ((awaitingPayment && tx.status === 'PAYMENT_PENDING') || LIVE_STATES.includes(tx.status));
  useEffect(() => {
    if (!waiting) return;
    timer.current = window.setInterval(load, 3000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [waiting, load]);

  useEffect(() => {
    if (awaitingPayment && tx && tx.status !== 'PAYMENT_PENDING') {
      setAwaitingPayment(false);
      if (tx.status === 'PAID_HELD') notify('Paiement confirmé : les fonds sont retenus par QIAO.');
      if (tx.status === 'PAYMENT_FAILED') notify(tx.paymentFailureReason ?? 'Paiement refusé.', 'error');
    }
  }, [awaitingPayment, tx, notify]);

  // Compte à rebours de la période de protection.
  useEffect(() => {
    const interval = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if (error) {
    return (
      <Card>
        <EmptyState icon={<Lock className="w-10 h-10" />} text={error} action={{ label: 'Retour', onClick: onBack }} />
      </Card>
    );
  }
  if (!tx) return <Loading label="Chargement de la transaction..." />;

  const role = tx.viewerRole;
  const has = (action: string) => tx.actions.includes(action);
  const counterpart = role === 'client' ? tx.provider : tx.client;
  const remaining = timeLeft(tx.timestamps.protectionDeadlineAt);
  const current = stage(tx.status);

  const post = async (action: string, endpoint: string, success: string, body?: unknown) => {
    setBusy(action);
    try {
      const updated = await api.post<TxDetail>(`/payments/transactions/${tx.id}/${endpoint}`, body);
      setTx(updated);
      notify(success);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const pay = async () => {
    setBusy('pay');
    try {
      const { url } = await api.post<{ url: string }>(`/payments/transactions/${tx.id}/checkout`);
      window.location.href = url;
    } catch (err) {
      notify(errorMessage(err, 'Paiement indisponible.'), 'error');
      setBusy(null);
    }
  };

  const sendEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    await post('evidence', 'dispute/entries', 'Votre message a été ajouté au dossier.', {
      message: evidence.message,
      attachmentIds: evidence.files.map((f) => f.id),
    });
    setEvidence({ message: '', files: [] });
  };

  const financial = tx.financial;
  const dispute = tx.dispute;
  const evidenceExpected =
    dispute?.status === 'evidence_requested' && role !== 'reviewer' && (dispute.evidenceRequestedFrom === 'both' || dispute.evidenceRequestedFrom === role);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-xs font-semibold text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> {mode === 'admin' ? 'Retour au tableau de bord' : 'Toutes mes prestations'}
      </button>

      {/* En-tête */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-[11px] text-slate-500">{tx.reference}</span>
              <StatusBadge status={tx.status} />
              {role !== 'reviewer' && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{role === 'client' ? 'Vous êtes le client' : 'Vous êtes le prestataire'}</span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">{tx.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {(role === 'reviewer' ? [tx.client, tx.provider] : [counterpart]).map(
                (party, index) =>
                  party && (
                    <div key={party.id} className="flex items-center gap-2">
                      <Avatar src={party.avatarUrl} name={party.fullName} className="w-8 h-8" />
                      <div className="text-xs">
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          {role === 'reviewer' ? (index === 0 ? 'Client' : 'Prestataire') : role === 'client' ? 'Prestataire' : 'Client'}
                        </div>
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          {party.fullName}
                          {party.verifiedProvider && <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                      </div>
                    </div>
                  ),
              )}
            </div>
          </div>
          <div className="md:text-right shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-400">Montant convenu</div>
            <div className="text-2xl font-black text-slate-900">{formatMoney(tx.amount, tx.currency)}</div>
            {tx.refundedAmount > 0 && <div className="text-xs font-semibold text-amber-700">dont {formatMoney(tx.refundedAmount, tx.currency)} remboursés</div>}
          </div>
        </div>

        {/* Progression */}
        {tx.status !== 'CANCELLED' || tx.timestamps.paidAt ? (
          <ol className="mt-5 grid grid-cols-5 gap-1.5">
            {STEPS.map((label, index) => {
              const done = index < current || current === 5;
              const active = index === Math.min(current, 4) && current !== 5;
              return (
                <li key={label} className="min-w-0">
                  <div className={`h-1.5 rounded-full ${done ? 'bg-emerald-500' : active ? 'bg-red-500' : 'bg-slate-200'}`} />
                  <div className={`mt-1.5 text-[10px] sm:text-[11px] font-semibold truncate ${active ? 'text-red-600' : done ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {done && <Check className="w-3 h-3 inline -mt-0.5 mr-0.5" />}
                    {label}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}

        {/* Actions */}
        {role !== 'reviewer' && tx.actions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
            {has('accept') && <ActionButton tone="primary" icon={CheckCircle2} label="Accepter la demande" onClick={() => setModal('accept')} />}
            {has('decline') && <ActionButton tone="danger" icon={X} label="Refuser" onClick={() => setModal('decline')} />}
            {has('pay') && <ActionButton tone="primary" icon={CreditCard} label={`Payer ${formatMoney(tx.amount, tx.currency)}`} busy={busy === 'pay'} onClick={pay} />}
            {has('start') && <ActionButton icon={Play} label="Démarrer la prestation" busy={busy === 'start'} onClick={() => post('start', 'start', 'Prestation démarrée.')} />}
            {has('declare_completion') && <ActionButton tone="primary" icon={PackageCheck} label="Déclarer la prestation terminée" onClick={() => setModal('declare')} />}
            {has('confirm') && (
              <ActionButton
                tone="primary"
                icon={CheckCircle2}
                label="Confirmer la prestation"
                busy={busy === 'confirm'}
                onClick={() => post('confirm', 'confirm', 'Merci : votre confirmation est enregistrée.')}
              />
            )}
            {has('dispute') && <ActionButton tone="danger" icon={AlertTriangle} label="Contester la prestation" onClick={() => setModal('dispute')} />}
            {has('propose_settlement') && <ActionButton icon={Handshake} label="Proposer un accord amiable" onClick={() => setModal('settlement')} />}
            {has('cancel') && <ActionButton tone="danger" icon={Undo2} label="Annuler" onClick={() => setModal('cancel')} />}
          </div>
        )}
      </div>

      {/* Bandeaux d'état */}
      {awaitingPayment && tx.status === 'PAYMENT_PENDING' && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-blue-900 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Paiement en cours de confirmation par le prestataire de paiement…
        </div>
      )}
      {tx.status === 'PAYMENT_FAILED' && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800">
          Paiement refusé : {tx.paymentFailureReason ?? 'aucun montant n’a été débité.'} {role === 'client' && 'Vous pouvez réessayer.'}
        </div>
      )}
      {tx.status === 'REQUESTED' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          {role === 'client'
            ? `En attente de la réponse de ${tx.provider?.fullName ?? 'du prestataire'}. Vous ne payez qu'après son acceptation.`
            : 'Ce client attend votre réponse. Vous pouvez ajuster le prix et préciser vos conditions en acceptant.'}
        </div>
      )}
      {(tx.status === 'PAID_HELD' || tx.status === 'IN_PROGRESS') && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
          <Lock className="w-4 h-4 text-blue-600 shrink-0" />
          {role === 'provider'
            ? "Paiement reçu et retenu par QIAO. Une fois la prestation réalisée, déclarez-la terminée : le versement interviendra à l'issue de la période de protection."
            : `Votre paiement est retenu par QIAO. ${tx.provider?.fullName ?? 'Le prestataire'} sera payé seulement après la déclaration de fin de prestation et la période de protection de ${policy?.deadline.periodDays ?? 5} jours.`}
        </div>
      )}
      {tx.status === 'PROTECTION_PERIOD' && tx.timestamps.protectionDeadlineAt && (
        <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 text-xs text-violet-900 flex items-start gap-3">
          <CalendarClock className="w-5 h-5 text-violet-600 shrink-0" />
          <div>
            <div className="font-bold text-sm">
              Période de protection jusqu'au {formatDateTime(tx.timestamps.protectionDeadlineAt)}
              {remaining ? ` — il reste ${remaining}` : ' — échéance atteinte, contrôle de libération en cours'}
            </div>
            <p className="mt-1">
              {role === 'client'
                ? "Vérifiez la prestation. Sans contestation de votre part avant l'échéance, le paiement sera versé au prestataire. Votre confirmation est enregistrée mais ne raccourcit pas ce délai."
                : "Le client peut contester la prestation jusqu'à l'échéance. Sans contestation, le versement sera initié automatiquement."}
            </p>
            {tx.timestamps.clientConfirmationAt && (
              <p className="mt-1 font-semibold text-emerald-700">Prestation confirmée par le client le {formatDateTime(tx.timestamps.clientConfirmationAt)}.</p>
            )}
          </div>
        </div>
      )}
      {tx.settlementProposal && role !== 'reviewer' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <div className="font-bold text-sm flex items-center gap-2">
            <Handshake className="w-4 h-4" /> Accord amiable proposé par {tx.settlementProposal.proposedBy === role ? 'vous' : ROLE_LABELS[tx.settlementProposal.proposedBy].toLowerCase()}
          </div>
          <p className="mt-1">
            Remboursement de {formatMoney(tx.settlementProposal.refundAmount, tx.currency)} au client
            {tx.amount - tx.settlementProposal.refundAmount > 0 ? `, solde de ${formatMoney(tx.amount - tx.refundedAmount - tx.settlementProposal.refundAmount, tx.currency)} versé au prestataire` : ''}.
            {tx.settlementProposal.note && <span className="block mt-1 italic">« {tx.settlementProposal.note} »</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {has('accept_settlement') && (
              <ActionButton tone="primary" icon={Check} label="Accepter l'accord" busy={busy === 'settle'} onClick={() => post('settle', 'settlement/accept', 'Accord accepté : le remboursement est en cours.')} />
            )}
            {has('decline_settlement') && <ActionButton icon={X} label="Refuser" busy={busy === 'decline-settle'} onClick={() => post('decline-settle', 'settlement/decline', 'Proposition refusée.')} />}
            {has('withdraw_settlement') && <ActionButton icon={Undo2} label="Retirer ma proposition" busy={busy === 'withdraw'} onClick={() => post('withdraw', 'settlement/withdraw', 'Proposition retirée.')} />}
          </div>
        </div>
      )}
      {(tx.payoutHold || tx.requiresIntervention) && role !== 'reviewer' && (
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
          Ce dossier fait l'objet d'une vérification par l'équipe QIAO. Les opérations financières reprendront à l'issue de cette vérification.
        </div>
      )}
      {role === 'provider' && tx.releaseBlockedReason && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0" /> {tx.releaseBlockedReason}
        </div>
      )}
      {['REFUND_APPROVED', 'REFUND_PROCESSING'].includes(tx.status) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Remboursement {tx.status === 'REFUND_APPROVED' ? 'approuvé' : 'transmis au prestataire de paiement'} : il sera affiché comme effectué dès sa confirmation.
        </div>
      )}
      {tx.status === 'REFUND_FAILED' && role !== 'reviewer' && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
          Le remboursement n'a pas pu être exécuté par le prestataire de paiement. L'équipe QIAO intervient pour le finaliser.
        </div>
      )}

      {mode === 'admin' && renderAdmin?.(tx, setTx)}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          {/* Accord de référence */}
          <Section title="Accord de référence" icon={FileText}>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{tx.description}</p>
            {tx.providerTerms && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Conditions du prestataire</div>
                <p className="text-xs text-slate-700 whitespace-pre-line">{tx.providerTerms}</p>
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-x-6 border-t border-slate-100 pt-2">
              <Row label="Budget proposé" value={formatMoney(tx.requestedAmount, tx.currency)} />
              <Row label="Prix convenu" value={tx.timestamps.acceptedAt ? formatMoney(tx.amount, tx.currency) : 'En attente du prestataire'} />
              <Row label="Livraison souhaitée" value={tx.expectedDeliveryDate ? new Date(`${tx.expectedDeliveryDate}T12:00:00`).toLocaleDateString('fr-FR') : '—'} />
              <Row label="Accepté le" value={tx.timestamps.acceptedAt ? formatDateTime(tx.timestamps.acceptedAt) : '—'} />
            </div>
            {tx.cancellationReason && <p className="mt-3 text-xs text-slate-500">Annulation : {tx.cancellationReason}</p>}
          </Section>

          {/* Déclaration de fin de prestation */}
          {tx.declaration && (
            <Section title="Déclaration « prestation terminée »" icon={PackageCheck}>
              <p className="text-xs text-slate-500 mb-2">Enregistrée par le serveur QIAO le {formatDateTime(tx.declaration.declaredAt)}</p>
              <p className="text-sm text-slate-700 whitespace-pre-line">{tx.declaration.details}</p>
              <FileLinks ids={tx.declaration.attachmentIds} files={tx.attachments} />
            </Section>
          )}

          {/* Litige */}
          {dispute && (
            <Section
              title="Litige"
              icon={AlertTriangle}
              action={
                <span className="text-[11px] font-bold text-slate-500">
                  {dispute.status === 'resolved' ? 'Décision rendue' : dispute.status === 'evidence_requested' ? 'Éléments demandés' : dispute.status === 'under_review' ? 'En examen' : 'En attente d’examen'}
                </span>
              }
            >
              {dispute.outcome && (
                <div className="mb-4 p-3 rounded-xl bg-slate-900 text-white text-xs">
                  <div className="font-bold text-sm">
                    Décision QIAO : {OUTCOME_LABELS[dispute.outcome]}
                    {dispute.decisionRefundAmount ? ` — ${formatMoney(dispute.decisionRefundAmount, tx.currency)}` : ''}
                  </div>
                  <p className="mt-1 text-slate-200 whitespace-pre-line">{dispute.decisionRationale}</p>
                  <p className="mt-1 text-slate-400">
                    {formatDateTime(dispute.decidedAt)}
                    {dispute.decidedByName ? ` · ${dispute.decidedByName}` : ''}
                  </p>
                </div>
              )}
              {evidenceExpected && (
                <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <strong>QIAO vous demande des éléments complémentaires :</strong> {dispute.evidenceRequestMessage}
                </div>
              )}
              <ol className="space-y-3">
                {dispute.entries.map((entry) => (
                  <li
                    key={entry.id}
                    className={`p-3 rounded-xl border text-xs ${
                      entry.kind === 'internal_note'
                        ? 'bg-yellow-50 border-yellow-200'
                        : entry.authorRole === 'reviewer'
                          ? 'bg-blue-50/60 border-blue-100'
                          : entry.authorRole === 'client'
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-800">
                        {entry.authorName} <span className="font-semibold text-slate-400">· {entry.kind === 'internal_note' ? 'Note interne QIAO' : ROLE_LABELS[entry.authorRole]}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDateTime(entry.createdAt)}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-line">{entry.message}</p>
                    <FileLinks ids={entry.attachmentIds} files={tx.attachments} />
                  </li>
                ))}
              </ol>
              {has('add_evidence') && (
                <form onSubmit={sendEvidence} className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    {role === 'provider' && !dispute.providerRespondedAt ? 'Votre réponse à la contestation' : 'Ajouter un élément au dossier'}
                  </label>
                  <textarea
                    required
                    minLength={2}
                    maxLength={5000}
                    rows={3}
                    value={evidence.message}
                    onChange={(e) => setEvidence({ ...evidence, message: e.target.value })}
                    className={inputClass}
                    placeholder="Travail réalisé, échanges, preuves de livraison..."
                  />
                  <FileUploader files={evidence.files} onChange={(files) => setEvidence({ ...evidence, files })} />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={busy === 'evidence'}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {busy === 'evidence' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      Envoyer au dossier
                    </button>
                  </div>
                </form>
              )}
            </Section>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5">
          {/* Montants */}
          <Section title="Montants" icon={Wallet}>
            <Row label="Payé par le client" value={tx.timestamps.paidAt ? formatMoney(financial.gross, tx.currency) : 'Non payé'} />
            {financial.refunded > 0 && <Row label="Remboursé (confirmé)" value={`− ${formatMoney(financial.refunded, tx.currency)}`} />}
            {financial.commission !== undefined && tx.timestamps.paidAt && (
              <>
                <Row label={`Commission QIAO (${((financial.commissionRateBps ?? 0) / 100).toLocaleString('fr-FR')} %)`} value={`− ${formatMoney(financial.commission, tx.currency)}`} />
                <Row label="Frais de paiement (part prestataire)" value={`− ${formatMoney(financial.providerFee ?? 0, tx.currency)}`} />
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <Row
                    label={financial.paidOut ? 'Versé au prestataire' : 'Versement prévu'}
                    value={formatMoney(financial.paidOut || (financial.payout ?? 0), tx.currency)}
                    strong
                  />
                </div>
              </>
            )}
            {tx.timestamps.paidAt && (
              <p className="mt-2 text-[11px] text-slate-500 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {tx.status === 'PAID_OUT'
                  ? `Fonds versés au prestataire le ${formatDateTime(tx.timestamps.payoutCompletedAt)}.`
                  : tx.status === 'REFUNDED'
                    ? `Client intégralement remboursé le ${formatDateTime(tx.timestamps.refundCompletedAt)}.`
                    : 'Fonds retenus par le prestataire de paiement de QIAO.'}
              </p>
            )}
          </Section>

          {/* Opérations financières */}
          {(tx.refunds.length > 0 || tx.payout) && (
            <Section title="Opérations financières" icon={CreditCard}>
              <div className="space-y-2">
                {tx.refunds.map((refund) => (
                  <div key={refund.id} className="p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800">Remboursement · {formatMoney(refund.amount, tx.currency)}</span>
                      <span className={`font-bold ${refund.status === 'completed' ? 'text-emerald-700' : refund.status === 'failed' ? 'text-red-600' : 'text-amber-700'}`}>
                        {refund.status === 'completed' ? 'Effectué' : OPERATION_STATUS_LABELS[refund.status]}
                      </span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {REFUND_SOURCE_LABELS[refund.source]} · approuvé le {formatDateTime(refund.approvedAt)}
                      {refund.completedAt && ` · confirmé le ${formatDateTime(refund.completedAt)}`}
                    </div>
                    {refund.failureReason && <div className="text-red-600 mt-0.5">{refund.failureReason}</div>}
                    {refund.providerRef && <div className="font-mono text-[10px] text-slate-400 mt-0.5">{refund.providerRef} · tentative {refund.attempt}</div>}
                  </div>
                ))}
                {tx.payout && (
                  <div className="p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800">Versement · {formatMoney(tx.payout.amount, tx.currency)}</span>
                      <span className={`font-bold ${tx.payout.status === 'completed' ? 'text-emerald-700' : tx.payout.status === 'failed' ? 'text-red-600' : 'text-amber-700'}`}>
                        {tx.payout.status === 'completed' ? 'Effectué' : OPERATION_STATUS_LABELS[tx.payout.status]}
                      </span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {PAYOUT_BASIS_LABELS[tx.payout.basis]} · autorisé le {formatDateTime(tx.payout.authorizedAt)}
                      {tx.payout.completedAt && ` · confirmé le ${formatDateTime(tx.payout.completedAt)}`}
                    </div>
                    {tx.payout.failureReason && <div className="text-red-600 mt-0.5">{tx.payout.failureReason}</div>}
                    {tx.payout.providerRef && <div className="font-mono text-[10px] text-slate-400 mt-0.5">{tx.payout.providerRef} · tentative {tx.payout.attempt}</div>}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Historique */}
          <Section title="Historique" icon={History}>
            <ol className="relative border-l border-slate-200 ml-1.5 space-y-3">
              {[...tx.events].reverse().map((event) => (
                <li key={event.id} className="pl-4 relative">
                  <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${event.internal ? 'bg-yellow-400' : event.toStatus ? 'bg-red-500' : 'bg-slate-300'}`} />
                  <div className="text-xs text-slate-800">{event.message ?? event.type}</div>
                  <div className="text-[10px] text-slate-400">
                    {ROLE_LABELS[event.actorRole] ?? event.actorRole} · {formatDateTime(event.createdAt)}
                    {event.internal && ' · interne'}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>

      {modal && <ActionModal kind={modal} tx={tx} onClose={() => setModal(null)} onDone={setTx} />}
    </div>
  );
};
