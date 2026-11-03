import React, { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCircle2, CreditCard, Gift, Receipt, Save, Search, Settings2, XCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import { Order } from '../../../lib/models';
import { formatDate } from '../../../lib/text';
import { useToast } from '../../../context/ToastContext';
import { Avatar, Card, EmptyState, Field, Loading, Modal, ModalActions, Pills, SectionTitle, errorMessage, inputClass } from '../../community/ui';

interface AdminOrder extends Order {
  member: { id: string; fullName: string; email: string; avatarUrl: string | null };
}

interface PaymentSettings {
  eurPerTnd: number | null;
  bank: { beneficiary: string; bankName: string; rib: string; iban: string; bic: string; instructions: string };
}

const STATUS_FILTERS = [
  { id: 'pending', label: 'En attente' },
  { id: 'paid', label: 'Payées' },
  { id: 'cancelled', label: 'Annulées' },
  { id: 'all', label: 'Toutes' },
];

const STATUS_TONES: Record<Order['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};
const STATUS_LABELS: Record<Order['status'], string> = { pending: 'En attente', paid: 'Payée', cancelled: 'Annulée' };

const METHOD_ICONS: Record<NonNullable<Order['paymentMethod']>, React.ReactNode> = {
  card: <CreditCard className="w-3.5 h-3.5 text-red-600" />,
  transfer: <Building2 className="w-3.5 h-3.5 text-blue-600" />,
  free: <Gift className="w-3.5 h-3.5 text-emerald-600" />,
};
const METHOD_LABELS: Record<NonNullable<Order['paymentMethod']>, string> = { card: 'Carte', transfer: 'Virement', free: 'Gratuite' };

/** Taux de conversion pour la carte (le prestataire n'accepte pas le dinar) et coordonnées du virement. */
const PaymentSettingsCard: React.FC = () => {
  const { notify } = useToast();
  const [form, setForm] = useState<PaymentSettings | null>(null);
  const [rate, setRate] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api
      .get<PaymentSettings>('/academy/admin/payment-settings')
      .then((s) => {
        setForm(s);
        setRate(s.eurPerTnd ? String(s.eurPerTnd) : '');
      })
      .catch(() => undefined);
  }, []);
  if (!form) return <Loading />;
  const setBank = (patch: Partial<PaymentSettings['bank']>) => setForm({ ...form, bank: { ...form.bank, ...patch } });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = rate.trim() ? Number(rate.replace(',', '.')) : null;
    if (parsed !== null && (!Number.isFinite(parsed) || parsed <= 0)) {
      notify('Taux invalide : nombre d’euros pour 1 TND, par exemple 0,29.', 'error');
      return;
    }
    setBusy(true);
    try {
      const saved = await api.patch<PaymentSettings>('/academy/admin/payment-settings', { eurPerTnd: parsed, bank: form.bank });
      setForm(saved);
      setRate(saved.eurPerTnd ? String(saved.eurPerTnd) : '');
      notify('Réglages de paiement enregistrés.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const cardOn = Boolean(form.eurPerTnd);
  const transferOn = Boolean(form.bank.beneficiary && (form.bank.rib || form.bank.iban));
  return (
    <Card>
      <form onSubmit={save} className="space-y-4">
        <SectionTitle
          title="Réglages de paiement"
          action={
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60">
              <Save className="w-3.5 h-3.5" /> Enregistrer
            </button>
          }
        />
        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
          <span className={`px-2 py-0.5 rounded-full border ${cardOn ? STATUS_TONES.paid : STATUS_TONES.cancelled}`}>Carte : {cardOn ? 'active' : 'inactive (taux à définir)'}</span>
          <span className={`px-2 py-0.5 rounded-full border ${transferOn ? STATUS_TONES.paid : STATUS_TONES.cancelled}`}>
            Virement : {transferOn ? 'actif' : 'inactif (bénéficiaire et RIB / IBAN à saisir)'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Taux carte : euros pour 1 TND" hint="Les prix restent en TND ; la carte débite le montant converti (affiché à l'apprenant avant de payer). Vide = carte désactivée.">
            <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" placeholder="0,29" className={inputClass} />
          </Field>
          {rate && Number(rate.replace(',', '.')) > 0 && (
            <div className="sm:col-span-2 self-center text-xs text-slate-500">
              Exemple : une formation à 150 TND sera débitée{' '}
              <strong className="text-slate-900">{(150 * Number(rate.replace(',', '.'))).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong> par carte.
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Bénéficiaire du virement">
            <input maxLength={120} value={form.bank.beneficiary} onChange={(e) => setBank({ beneficiary: e.target.value })} className={inputClass} placeholder="QIAO SARL" />
          </Field>
          <Field label="Banque">
            <input maxLength={120} value={form.bank.bankName} onChange={(e) => setBank({ bankName: e.target.value })} className={inputClass} />
          </Field>
          <Field label="RIB (20 chiffres)">
            <input maxLength={40} value={form.bank.rib} onChange={(e) => setBank({ rib: e.target.value })} className={`${inputClass} font-mono`} />
          </Field>
          <Field label="IBAN">
            <input maxLength={40} value={form.bank.iban} onChange={(e) => setBank({ iban: e.target.value })} className={`${inputClass} font-mono`} placeholder="TN59 …" />
          </Field>
          <Field label="BIC / SWIFT">
            <input maxLength={20} value={form.bank.bic} onChange={(e) => setBank({ bic: e.target.value })} className={`${inputClass} font-mono`} />
          </Field>
          <Field label="Instructions complémentaires">
            <input maxLength={600} value={form.bank.instructions} onChange={(e) => setBank({ instructions: e.target.value })} className={inputClass} placeholder="Envoyez l'avis de virement à academy@qiao…" />
          </Field>
        </div>
      </form>
    </Card>
  );
};

const DecisionModal: React.FC<{ order: AdminOrder; kind: 'validate' | 'cancel'; onClose: () => void; onDone: () => void }> = ({ order, kind, onClose, onDone }) => {
  const { notify } = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/academy/admin/orders/${order.id}/${kind}`, { note: note || undefined });
      notify(kind === 'validate' ? 'Virement validé : l’accès est ouvert et le membre est notifié.' : 'Commande annulée : le membre est notifié.');
      onDone();
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={kind === 'validate' ? `Valider le virement — ${order.reference}` : `Annuler ${order.reference}`} icon={kind === 'validate' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-600">
          {kind === 'validate'
            ? `Confirmez la réception de ${order.total} TND de ${order.member.fullName} (libellé ${order.reference}). Les formations commandées seront ouvertes immédiatement.`
            : `La commande de ${order.member.fullName} (${order.total} TND) sera annulée ; aucun accès ne sera ouvert.`}
        </p>
        <Field label={kind === 'validate' ? 'Note (référence bancaire, date de réception…)' : 'Motif (communiqué au membre)'}>
          <input maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </Field>
        <ModalActions onCancel={onClose} submitLabel={kind === 'validate' ? 'Valider le virement' : 'Annuler la commande'} busy={busy} danger={kind === 'cancel'} />
      </form>
    </Modal>
  );
};

/** Admin QIAO Academy › Commandes : paiements par carte, virements à valider, annulations ; réglages de paiement. */
export const OrdersAdmin: React.FC = () => {
  const [status, setStatus] = useState('pending');
  const [method, setMethod] = useState('all');
  const [q, setQ] = useState('');
  const [data, setData] = useState<{ items: AdminOrder[]; total: number; counts: Record<string, number>; pendingTransfers: number } | null>(null);
  const [decision, setDecision] = useState<{ order: AdminOrder; kind: 'validate' | 'cancel' } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const load = useCallback(() => {
    api
      .get<NonNullable<typeof data>>('/academy/admin/orders', { status, method, q: q.trim() || undefined, limit: 100 })
      .then(setData)
      .catch(() => setData({ items: [], total: 0, counts: {}, pendingTransfers: 0 }));
  }, [status, method, q]);
  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  const paid = (data?.counts.paid ?? 0) + (data?.counts.confirmed ?? 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Virements à valider', data?.pendingTransfers ?? '…'],
          ['En attente (total)', data?.counts.pending ?? 0],
          ['Commandes payées', paid],
          ['Annulées', data?.counts.cancelled ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#071329] text-white rounded-2xl p-4">
            <div className="text-2xl font-black">{value}</div>
            <div className="text-[11px] text-slate-300 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <button onClick={() => setShowSettings(!showSettings)} className="text-xs font-bold text-slate-600 hover:text-red-600 cursor-pointer inline-flex items-center gap-1.5">
        <Settings2 className="w-4 h-4" /> {showSettings ? 'Masquer les réglages de paiement' : 'Réglages de paiement (taux carte, coordonnées du virement)'}
      </button>
      {showSettings && <PaymentSettingsCard />}

      <Card>
        <SectionTitle title={`Commandes${data ? ` (${data.total})` : ''}`} />
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-4">
          <Pills options={STATUS_FILTERS} value={status} onChange={setStatus} />
          <div className="flex items-center gap-2 lg:ml-auto">
            <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Mode de paiement" className={`${inputClass} sm:w-40`}>
              <option value="all">Tous les modes</option>
              <option value="card">Carte</option>
              <option value="transfer">Virement</option>
              <option value="free">Gratuites</option>
            </select>
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Référence, nom, e-mail" className={`${inputClass} pl-9`} />
            </div>
          </div>
        </div>
        {!data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <EmptyState icon={<Receipt className="w-10 h-10" />} text="Aucune commande." />
        ) : (
          <div className="divide-y divide-slate-100">
            {data.items.map((order) => (
              <div key={order.id} className="py-3 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-3 md:w-56 min-w-0">
                  <Avatar src={order.member.avatarUrl} name={order.member.fullName} className="w-9 h-9" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{order.member.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{order.member.email}</div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] text-slate-500">{order.reference}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_TONES[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                    {order.paymentMethod && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                        {METHOD_ICONS[order.paymentMethod]} {METHOD_LABELS[order.paymentMethod]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 truncate mt-0.5">{order.items.map((i) => i.title).join(', ')}</div>
                  <div className="text-[10px] text-slate-400">
                    {formatDate(order.createdAt)}
                    {order.paidAt && ` · payée le ${formatDate(order.paidAt)}`}
                    {order.charged && ` · ${order.charged.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} par carte (taux ${order.charged.rate})`}
                    {order.adminNote && ` · ${order.adminNote}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <span className="text-sm font-black text-slate-900 whitespace-nowrap">{order.total} TND</span>
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setDecision({ order, kind: 'validate' })}
                        className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                        title={order.paymentMethod === 'card' ? 'À utiliser seulement si le paiement a été reçu par virement' : undefined}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Virement reçu
                      </button>
                      <button onClick={() => setDecision({ order, kind: 'cancel' })} aria-label="Annuler la commande" className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] text-slate-400">
          Carte : l'accès s'ouvre automatiquement à la confirmation du prestataire de paiement. Virement : vérifiez la réception (libellé = référence de la commande) puis validez.
          Chaque action est journalisée.
        </p>
      </Card>
      {decision && <DecisionModal order={decision.order} kind={decision.kind} onClose={() => setDecision(null)} onDone={load} />}
    </div>
  );
};
