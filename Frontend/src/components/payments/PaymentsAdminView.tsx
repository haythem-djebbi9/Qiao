import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Gavel, Hand, Lock, RotateCcw, Search, ShieldAlert, ShieldCheck, StickyNote, Unlock, UserCheck, Wrench } from 'lucide-react';
import { api } from '../../lib/api';
import { LedgerRow, TxDetail, TxSummary, formatDateTime, formatMoney, navigateDashboard, timeLeft } from '../../lib/payments';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, EmptyState, Field, Loading, Modal, ModalActions, errorMessage, inputClass } from '../community/ui';
import { TransactionDetail } from './TransactionDetail';
import { StatusBadge } from './ui';

interface Overview {
  queues: Record<string, number>;
  held: { currency: string; amount: number }[];
  overdueReleases: number;
}

const QUEUES: { id: string; label: string; urgent?: boolean }[] = [
  { id: 'disputes_review', label: 'Litiges à examiner', urgent: true },
  { id: 'disputes_evidence', label: 'Litiges : éléments attendus' },
  { id: 'intervention', label: 'Intervention manuelle', urgent: true },
  { id: 'refunds_failed', label: 'Remboursements en échec', urgent: true },
  { id: 'payouts_failed', label: 'Versements en échec', urgent: true },
  { id: 'refunds_pending', label: 'Remboursements à traiter' },
  { id: 'payouts_pending', label: 'Versements à traiter' },
  { id: 'protection_period', label: 'Périodes de protection actives' },
  { id: 'awaiting_completion', label: 'En attente de déclaration' },
  { id: 'awaiting_payment', label: 'En attente de paiement' },
  { id: 'closed', label: 'Clôturées' },
  { id: 'all', label: 'Toutes les transactions' },
];

const LEDGER_LABELS: Record<string, string> = {
  PAYMENT_CAPTURED: 'Paiement encaissé',
  PAYMENT_FAILED: 'Paiement refusé',
  DUPLICATE_PAYMENT: 'Paiement inattendu',
  PAYOUT_BLOCKED: 'Versement bloqué (litige)',
  REFUND_APPROVED: 'Remboursement approuvé',
  REFUND_SUBMITTED: 'Remboursement transmis',
  REFUND_COMPLETED: 'Remboursement confirmé',
  REFUND_FAILED: 'Remboursement en échec',
  PAYOUT_AUTHORIZED: 'Versement autorisé',
  PAYOUT_SUBMITTED: 'Versement transmis',
  PAYOUT_COMPLETED: 'Versement confirmé',
  PAYOUT_FAILED: 'Versement en échec',
  PAYOUT_CANCELLED: 'Versement annulé',
  COMMISSION_EARNED: 'Commission QIAO',
  ADJUSTMENT: 'Ajustement',
  REVERSAL: 'Extourne',
};

/** Tableau de bord QIAO des paiements et litiges (réservé aux administrateurs, actions journalisées). */
export const PaymentsAdminView: React.FC<{ selectedId?: string }> = ({ selectedId }) => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [queue, setQueue] = useState('disputes_review');
  const [q, setQ] = useState('');
  const [list, setList] = useState<{ items: TxSummary[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<Overview>('/payments/admin/overview').then(setOverview).catch((err) => setError(errorMessage(err)));
    api
      .get<{ items: TxSummary[]; total: number }>('/payments/admin/transactions', { queue, q })
      .then(setList)
      .catch((err) => setError(errorMessage(err)));
  }, [queue, q]);

  useEffect(() => {
    if (!selectedId && user?.role === 'admin') load();
  }, [load, selectedId, user?.role]);

  if (user?.role !== 'admin') {
    return (
      <Card>
        <EmptyState icon={<Lock className="w-10 h-10" />} text="Espace réservé aux équipes QIAO habilitées." />
      </Card>
    );
  }

  if (selectedId) {
    return (
      <TransactionDetail
        id={selectedId}
        mode="admin"
        onBack={() => navigateDashboard('admin-paiements')}
        renderAdmin={(tx, update) => <ReviewerTools tx={tx} onUpdate={update} />}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-red-600" /> Paiements sécurisés & litiges
        </h2>
        <p className="text-xs text-slate-600">Toutes les décisions et actions financières sont enregistrées dans le journal d'audit et le grand livre.</p>
      </div>
      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">{error}</div>}

      {overview && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUEUES.slice(0, 8).map((item) => {
              const value = overview.queues[item.id] ?? 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setQueue(item.id)}
                  className={`text-left bg-white border rounded-2xl p-4 cursor-pointer transition-all hover:shadow-sm ${
                    queue === item.id ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'
                  }`}
                >
                  <div className={`text-2xl font-black ${item.urgent && value > 0 ? 'text-red-600' : 'text-slate-900'}`}>{value}</div>
                  <div className="text-[11px] font-semibold text-slate-500">{item.label}</div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="px-3 py-2 rounded-xl bg-slate-900 text-white">
              Fonds retenus : {overview.held.length ? overview.held.map((h) => formatMoney(h.amount, h.currency)).join(' · ') : '0'}
            </div>
            {overview.overdueReleases > 0 && (
              <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                {overview.overdueReleases} échéance(s) passée(s) en attente du contrôle de libération
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <select value={queue} onChange={(e) => setQueue(e.target.value)} className={`${inputClass} sm:max-w-xs`}>
          {QUEUES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label} ({overview?.queues[item.id] ?? 0})
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Référence ou intitulé" className={`${inputClass} pl-9`} />
        </div>
      </div>

      {!list ? (
        <Loading />
      ) : list.items.length === 0 ? (
        <Card>
          <EmptyState icon={<ShieldCheck className="w-10 h-10" />} text="Aucune transaction dans cette file." />
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left p-3">Référence</th>
                <th className="text-left p-3">Prestation</th>
                <th className="text-left p-3">Parties</th>
                <th className="text-right p-3">Montant</th>
                <th className="text-left p-3">État</th>
                <th className="text-left p-3">Mise à jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.items.map((tx) => (
                <tr key={tx.id} onClick={() => navigateDashboard(`admin-paiements/${tx.id}`)} className="hover:bg-red-50/40 cursor-pointer">
                  <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">{tx.reference}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 max-w-[220px] truncate">{tx.title}</div>
                    {(tx.interventionReason || tx.releaseBlockedReason || tx.payoutHold) && (
                      <div className="text-[10px] text-red-600 max-w-[260px] truncate flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 shrink-0" /> {tx.interventionReason ?? tx.releaseBlockedReason ?? 'Blocage administratif'}
                      </div>
                    )}
                    {tx.status === 'PROTECTION_PERIOD' && <div className="text-[10px] text-violet-700">Échéance : {timeLeft(tx.protectionDeadlineAt) ?? 'atteinte'}</div>}
                  </td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    {tx.client?.fullName} → {tx.provider?.fullName}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">{formatMoney(tx.amount, tx.currency)}</td>
                  <td className="p-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="p-3 text-slate-500 whitespace-nowrap">{formatDateTime(tx.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

type ToolModal = 'evidence' | 'decide' | 'note' | 'hold' | 'retry' | 'resolve' | 'adjust' | null;

/** Outils de l'examinateur : prise en charge, demande d'éléments, décision motivée, blocages, relances, régularisations. */
const ReviewerTools: React.FC<{ tx: TxDetail; onUpdate: (tx: TxDetail) => void }> = ({ tx, onUpdate }) => {
  const { user } = useAuth();
  const { notify } = useToast();
  const [modal, setModal] = useState<ToolModal>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ text: '', amount: '', from: 'provider', outcome: 'rejected', type: 'ADJUSTMENT' });
  const dispute = tx.dispute;
  const disputeOpen = !!dispute && dispute.status !== 'resolved';
  const isParty = tx.client?.id === user?.id || tx.provider?.id === user?.id;

  const run = async (path: string, body: unknown, success: string) => {
    setBusy(true);
    try {
      onUpdate(await api.post<TxDetail>(`/payments/admin/${path}`, body));
      notify(success);
      setModal(null);
      setForm({ text: '', amount: '', from: 'provider', outcome: 'rejected', type: 'ADJUSTMENT' });
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remaining = tx.amount - tx.refundedAmount;
  const button = (label: string, icon: React.ElementType, onClick: () => void, tone: 'primary' | 'secondary' = 'secondary') => {
    const Icon = icon;
    return (
      <button
        onClick={onClick}
        disabled={busy}
        className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
          tone === 'primary' ? 'bg-slate-900 hover:bg-black text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Icon className="w-3.5 h-3.5" /> {label}
      </button>
    );
  };

  return (
    <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Gavel className="w-4 h-4 text-red-600" /> Espace examinateur QIAO
        </h3>
        <span className="text-[11px] text-slate-500">
          Prestataire de paiement : {tx.paymentProvider ?? '—'} · paiement {tx.paymentRef ?? 'non confirmé'} · compte de versement :{' '}
          {tx.payoutAccount ? tx.payoutAccount.status : 'absent'}
        </span>
      </div>

      {isParty && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          Vous êtes partie à cette transaction : un autre membre de l'équipe QIAO doit l'examiner.
        </div>
      )}
      {(tx.interventionReason || tx.payoutHoldReason || tx.releaseBlockedReason) && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-800 space-y-1">
          {tx.interventionReason && <div><strong>Intervention requise :</strong> {tx.interventionReason}</div>}
          {tx.payoutHoldReason && <div><strong>Blocage administratif :</strong> {tx.payoutHoldReason}</div>}
          {tx.releaseBlockedReason && <div><strong>Contrôle de libération :</strong> {tx.releaseBlockedReason}</div>}
        </div>
      )}

      {!isParty && (
        <div className="flex flex-wrap gap-2">
          {disputeOpen && dispute!.status === 'open' && button('Prendre en charge le litige', UserCheck, () => run(`disputes/${dispute!.id}/take`, {}, 'Litige pris en charge.'), 'primary')}
          {disputeOpen && button('Demander des éléments', BookOpen, () => setModal('evidence'))}
          {disputeOpen && button('Rendre la décision', Gavel, () => setModal('decide'), 'primary')}
          {disputeOpen && button('Note interne', StickyNote, () => setModal('note'))}
          {!['PAID_OUT', 'REFUNDED', 'CANCELLED'].includes(tx.status) &&
            (tx.payoutHold
              ? button('Lever le blocage', Unlock, () => run(`transactions/${tx.id}/release-hold`, {}, 'Blocage levé.'))
              : button('Bloquer le versement', Hand, () => setModal('hold')))}
          {(tx.status === 'REFUND_FAILED' || tx.status === 'PAYOUT_FAILED') && button('Relancer l’opération', RotateCcw, () => setModal('retry'))}
          {(tx.interventionReason || tx.releaseBlockedReason) && button('Clore l’intervention', Wrench, () => setModal('resolve'))}
          {tx.timestamps.paidAt && button('Écriture de régularisation', BookOpen, () => setModal('adjust'))}
        </div>
      )}

      {/* Grand livre */}
      {tx.ledger && tx.ledger.length > 0 && (
        <div className="overflow-x-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Grand livre (insertion seule)</div>
          <table className="w-full text-[11px]">
            <thead className="text-slate-500 bg-slate-50">
              <tr>
                {['Date', 'Événement', 'Statut', 'Montant', 'Retenu', 'Remboursé', 'Versement', 'Commission', 'Réf.'].map((h) => (
                  <th key={h} className="text-left p-2 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tx.ledger.map((row: LedgerRow) => (
                <tr key={row.id} title={row.note ?? undefined}>
                  <td className="p-2 whitespace-nowrap text-slate-500">{formatDateTime(row.createdAt)}</td>
                  <td className="p-2 font-semibold text-slate-800 whitespace-nowrap">{LEDGER_LABELS[row.eventType] ?? row.eventType}</td>
                  <td className="p-2 text-slate-500">{row.eventStatus}</td>
                  <td className="p-2 font-bold whitespace-nowrap">{formatMoney(row.amount, row.currency)}</td>
                  <td className="p-2 whitespace-nowrap">{formatMoney(row.heldAmount, row.currency)}</td>
                  <td className="p-2 whitespace-nowrap">{formatMoney(row.refundAmount, row.currency)}</td>
                  <td className="p-2 whitespace-nowrap">{formatMoney(row.providerPayoutAmount, row.currency)}</td>
                  <td className="p-2 whitespace-nowrap">{formatMoney(row.commissionAmount, row.currency)}</td>
                  <td className="p-2 font-mono text-[10px] text-slate-400 max-w-[140px] truncate">{row.decisionRef ?? row.paymentProviderRef ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tx.audit && tx.audit.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer font-bold text-slate-600">Journal d'audit ({tx.audit.length})</summary>
          <ul className="mt-2 space-y-1">
            {tx.audit.map((log) => (
              <li key={log.id} className="text-slate-600">
                <span className="text-slate-400">{formatDateTime(log.createdAt)}</span> — {log.actorName} · <span className="font-mono">{log.action}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {modal === 'evidence' && dispute && (
        <Modal title="Demander des éléments complémentaires" icon={<BookOpen className="w-4 h-4" />} onClose={() => setModal(null)}>
          <form onSubmit={(e) => { e.preventDefault(); run(`disputes/${dispute.id}/request-evidence`, { from: form.from, message: form.text }, 'Demande envoyée.'); }} className="space-y-3">
            <Field label="Destinataire">
              <select value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className={inputClass}>
                <option value="provider">Prestataire</option>
                <option value="client">Client</option>
                <option value="both">Les deux parties</option>
              </select>
            </Field>
            <Field label="Éléments attendus">
              <textarea required minLength={10} maxLength={1000} rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className={inputClass} />
            </Field>
            <ModalActions onCancel={() => setModal(null)} submitLabel="Envoyer la demande" busy={busy} />
          </form>
        </Modal>
      )}

      {modal === 'decide' && dispute && (
        <Modal title="Décision sur le litige" icon={<Gavel className="w-4 h-4" />} onClose={() => setModal(null)} wide>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(
                `disputes/${dispute.id}/decide`,
                { outcome: form.outcome, refundAmount: form.outcome === 'partial_refund' ? form.amount : undefined, rationale: form.text },
                'Décision enregistrée et notifiée aux parties.',
              );
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'full_refund', label: 'Remboursement intégral', hint: formatMoney(remaining, tx.currency) },
                { id: 'partial_refund', label: 'Remboursement partiel', hint: 'Solde versé au prestataire' },
                { id: 'rejected', label: 'Rejeter la contestation', hint: 'Versement au prestataire' },
              ].map((option) => (
                <label
                  key={option.id}
                  className={`p-3 rounded-xl border cursor-pointer text-xs ${form.outcome === option.id ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <input type="radio" name="outcome" value={option.id} checked={form.outcome === option.id} onChange={() => setForm({ ...form, outcome: option.id })} className="sr-only" />
                  <div className="font-bold text-slate-900">{option.label}</div>
                  <div className="text-slate-500">{option.hint}</div>
                </label>
              ))}
            </div>
            {form.outcome === 'partial_refund' && (
              <Field label={`Montant remboursé au client (${tx.currency})`} hint={`Strictement inférieur à ${formatMoney(remaining, tx.currency)}.${dispute.requestedRefundAmount ? ` Demande du client : ${formatMoney(dispute.requestedRefundAmount, tx.currency)}.` : ''}`}>
                <input required inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
              </Field>
            )}
            <Field label="Motivation (communiquée aux deux parties)" hint="Appuyez la décision sur l'accord, la déclaration et les pièces du dossier.">
              <textarea required minLength={20} maxLength={5000} rows={5} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className={inputClass} />
            </Field>
            {!tx.declaration && form.outcome === 'rejected' && (
              <p className="text-[11px] text-amber-700">Aucune déclaration de fin de prestation : rejeter la contestation autorise le versement au prestataire.</p>
            )}
            <ModalActions onCancel={() => setModal(null)} submitLabel="Enregistrer la décision" busy={busy} />
          </form>
        </Modal>
      )}

      {(modal === 'note' || modal === 'hold' || modal === 'retry' || modal === 'resolve') && (
        <Modal
          title={{ note: 'Note interne', hold: 'Bloquer le versement', retry: 'Relancer l’opération en échec', resolve: 'Clore l’intervention' }[modal]}
          icon={<StickyNote className="w-4 h-4" />}
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (modal === 'note') run(`disputes/${dispute!.id}/notes`, { message: form.text }, 'Note ajoutée.');
              if (modal === 'hold') run(`transactions/${tx.id}/hold`, { reason: form.text }, 'Versement bloqué.');
              if (modal === 'retry') run(`transactions/${tx.id}/retry`, { note: form.text }, 'Nouvelle tentative transmise.');
              if (modal === 'resolve') run(`transactions/${tx.id}/resolve-intervention`, { note: form.text }, 'Intervention close.');
            }}
            className="space-y-3"
          >
            <Field
              label={{ note: 'Note (visible des seules équipes QIAO)', hold: 'Motif (fraude, juridique, restriction du prestataire de paiement...)', retry: 'Action menée avant la relance', resolve: 'Action menée' }[modal]}
            >
              <textarea required minLength={5} maxLength={2000} rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className={inputClass} />
            </Field>
            <ModalActions onCancel={() => setModal(null)} submitLabel="Valider" busy={busy} danger={modal === 'hold'} />
          </form>
        </Modal>
      )}

      {modal === 'adjust' && (
        <Modal title="Écriture de régularisation" icon={<BookOpen className="w-4 h-4" />} onClose={() => setModal(null)}>
          <form onSubmit={(e) => { e.preventDefault(); run(`transactions/${tx.id}/adjustments`, { type: form.type, amount: form.amount, note: form.text }, 'Écriture enregistrée.'); }} className="space-y-3">
            <p className="text-xs text-slate-600">Les écritures existantes ne sont jamais modifiées : une correction prend la forme d'une écriture d'ajustement ou d'extourne, sans mouvement de fonds.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
                  <option value="ADJUSTMENT">Ajustement</option>
                  <option value="REVERSAL">Extourne</option>
                </select>
              </Field>
              <Field label={`Montant (${tx.currency})`}>
                <input required inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label="Motif">
              <textarea required minLength={10} maxLength={300} rows={3} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className={inputClass} />
            </Field>
            <ModalActions onCancel={() => setModal(null)} submitLabel="Enregistrer" busy={busy} />
          </form>
        </Modal>
      )}
    </div>
  );
};
