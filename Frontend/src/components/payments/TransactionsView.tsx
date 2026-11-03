import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, CalendarClock, Landmark, Loader2, Lock, ScrollText, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { PRIORITY_ACTIONS, TxSummary, consumeQueryParam, formatMoney, navigateDashboard, timeLeft } from '../../lib/payments';
import { useToast } from '../../context/ToastContext';
import { Avatar, EmptyState, Loading, Pills, errorMessage } from '../community/ui';
import { TransactionDetail } from './TransactionDetail';
import { PolicyModal, StatusBadge } from './ui';

interface ListResponse {
  items: TxSummary[];
  payoutAccount: { status: 'pending' | 'active' | 'restricted'; provider: string } | null;
}

/** Espace membre — « Prestations & paiements » : achats (client) et ventes (prestataire). */
export const TransactionsView: React.FC<{ selectedId?: string; onNavigate: (tab: string) => void }> = ({ selectedId, onNavigate }) => {
  const { notify } = useToast();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'client' | 'provider'>('all');
  const [showPolicy, setShowPolicy] = useState(false);
  const [linking, setLinking] = useState(false);

  const load = useCallback(() => {
    api
      .get<ListResponse>('/payments/transactions')
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err, 'Chargement impossible.')));
  }, []);

  useEffect(() => {
    if (selectedId) return;
    load();
    if (consumeQueryParam('payout') === 'return') notify('Compte de versement transmis : il sera actif dès sa validation par le prestataire de paiement.');
  }, [load, selectedId, notify]);

  if (selectedId) return <TransactionDetail id={selectedId} mode="party" onBack={() => navigateDashboard('prestations')} />;

  const openPayoutAccount = async () => {
    setLinking(true);
    try {
      const { url } = await api.post<{ url: string }>('/payments/payout-account/link');
      window.location.href = url;
    } catch (err) {
      notify(errorMessage(err), 'error');
      setLinking(false);
    }
  };

  const items = (data?.items ?? []).filter((t) => filter === 'all' || t.viewerRole === filter);
  const count = (role: 'client' | 'provider') => (data?.items ?? []).filter((t) => t.viewerRole === role && t.actions.some((a) => PRIORITY_ACTIONS.includes(a))).length;
  const isProvider = (data?.items ?? []).some((t) => t.viewerRole === 'provider');

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-600" /> Prestations & paiements sécurisés
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Les paiements sont retenus par QIAO et versés au prestataire uniquement après une période de protection de 5 jours suivant la déclaration de fin
            de prestation, sauf contestation examinée par QIAO.
          </p>
        </div>
        <button onClick={() => setShowPolicy(true)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer shrink-0">
          <ScrollText className="w-3.5 h-3.5" /> Politique de paiement et de litiges
        </button>
      </div>

      {(isProvider || data?.payoutAccount) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Landmark className="w-5 h-5 text-blue-700" />
            <div className="text-xs">
              <div className="font-bold text-slate-900 text-sm">Compte de versement</div>
              <div className="text-slate-500">
                {data?.payoutAccount?.status === 'active'
                  ? 'Actif : vos versements sont envoyés sur ce compte, ouvert chez le prestataire de paiement de QIAO.'
                  : data?.payoutAccount?.status === 'restricted'
                    ? 'Restreint : complétez les vérifications demandées par le prestataire de paiement.'
                    : data?.payoutAccount
                      ? 'En cours de vérification par le prestataire de paiement.'
                      : 'Nécessaire pour recevoir vos versements. Vos coordonnées bancaires sont saisies chez le prestataire de paiement, jamais chez QIAO.'}
              </div>
            </div>
          </div>
          {data?.payoutAccount?.status === 'active' ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
              <BadgeCheck className="w-4 h-4" /> Vérifié
            </span>
          ) : (
            <button
              onClick={openPayoutAccount}
              disabled={linking}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
            >
              {linking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {data?.payoutAccount ? 'Reprendre la vérification' : 'Activer mon compte de versement'}
            </button>
          )}
        </div>
      )}

      <Pills
        options={[
          { id: 'all', label: 'Toutes' },
          { id: 'client', label: 'Mes achats', count: count('client') },
          { id: 'provider', label: 'Mes prestations vendues', count: count('provider') },
        ]}
        value={filter}
        onChange={(id) => setFilter(id as typeof filter)}
      />

      {error && <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>}
      {!data && !error && <Loading />}
      {data && items.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl">
          <EmptyState
            icon={<Lock className="w-10 h-10" />}
            text="Aucune prestation pour le moment. Trouvez un professionnel dans l'annuaire des experts et demandez-lui une prestation sécurisée."
            action={{ label: "Parcourir l'annuaire des experts", onClick: () => onNavigate('community/experts') }}
          />
        </div>
      )}
      <div className="space-y-3">
        {items.map((tx) => {
          const counterpart = tx.viewerRole === 'client' ? tx.provider : tx.client;
          const actionNeeded = tx.actions.some((a) => PRIORITY_ACTIONS.includes(a));
          const remaining = tx.status === 'PROTECTION_PERIOD' ? timeLeft(tx.protectionDeadlineAt) : null;
          return (
            <button
              key={tx.id}
              onClick={() => navigateDashboard(`prestations/${tx.id}`)}
              className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-red-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer"
            >
              {counterpart && <Avatar src={counterpart.avatarUrl} name={counterpart.fullName} className="w-10 h-10 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{tx.viewerRole === 'client' ? 'Achat' : 'Vente'}</span>
                  <span className="font-mono text-[10px] text-slate-400">{tx.reference}</span>
                  {actionNeeded && <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">Action requise</span>}
                </div>
                <div className="font-bold text-sm text-slate-900 truncate">{tx.title}</div>
                <div className="text-xs text-slate-500 truncate">
                  {tx.viewerRole === 'client' ? 'Prestataire' : 'Client'} : {counterpart?.fullName ?? '—'}
                  {remaining && (
                    <span className="ml-2 inline-flex items-center gap-1 text-violet-700 font-semibold">
                      <CalendarClock className="w-3 h-3" /> protection : {remaining}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <span className="font-black text-sm text-slate-900">{formatMoney(tx.amount, tx.currency)}</span>
                <StatusBadge status={tx.status} />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 hidden sm:block" />
            </button>
          );
        })}
      </div>
      {showPolicy && <PolicyModal onClose={() => setShowPolicy(false)} />}
    </div>
  );
};
