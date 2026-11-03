import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Clock, CreditCard, Loader2, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Order } from '../../lib/models';
import { formatDate } from '../../lib/text';
import { navigateDashboard } from '../../lib/payments';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../community/ui';
import { TransferInstructions } from './CheckoutModal';

const STATUS: Record<Order['status'], { label: string; tone: string }> = {
  pending: { label: 'En attente de paiement', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid: { label: 'Payée', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Annulée', tone: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const METHOD: Record<NonNullable<Order['paymentMethod']>, string> = { card: 'Carte bancaire', transfer: 'Virement', free: 'Gratuit' };

const eur = (amount: number) => amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

/**
 * Commandes du membre : suivi du paiement, reprise d'un paiement par carte, instructions de virement, annulation.
 * focusId : commande ouverte au retour de la page de paiement (?dv=academy/commande/<id>), vérifiée auprès du prestataire.
 */
export const MyOrders: React.FC<{ orders: Order[]; focusId?: string; onChanged: () => void }> = ({ orders, focusId, onChanged }) => {
  const { notify } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [focus, setFocus] = useState<Order | null>(null);
  const [checking, setChecking] = useState(Boolean(focusId));

  // Retour du paiement : la commande est relue (rapprochement avec le prestataire si la notification n'est pas encore arrivée).
  useEffect(() => {
    if (!focusId) return;
    let cancelled = false;
    let tries = 0;
    const check = () =>
      api
        .get<Order>(`/academy/orders/${focusId}`)
        .then((order) => {
          if (cancelled) return;
          setFocus(order);
          if (order.status === 'pending' && order.paymentMethod === 'card' && tries++ < 4) {
            setTimeout(check, 2500);
            return;
          }
          setChecking(false);
          if (order.status === 'paid') onChanged();
        })
        .catch(() => !cancelled && setChecking(false));
    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const act = async (order: Order, action: 'pay' | 'cancel') => {
    if (action === 'cancel' && !window.confirm(`Annuler la commande ${order.reference} ?`)) return;
    setBusy(`${action}:${order.id}`);
    try {
      if (action === 'pay') {
        const { checkoutUrl } = await api.post<{ checkoutUrl: string }>(`/academy/orders/${order.id}/pay`);
        window.location.assign(checkoutUrl);
        return;
      }
      await api.post(`/academy/orders/${order.id}/cancel`);
      notify('Commande annulée.');
      if (focus?.id === order.id) navigateDashboard('academy', { replace: true });
      onChanged();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const list = focus ? [focus, ...orders.filter((o) => o.id !== focus.id)] : orders;
  if (list.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-bold text-slate-900">Mes commandes</h3>
      {focusId && (
        <div
          className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
            checking ? 'bg-slate-50 text-slate-600' : focus?.status === 'paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
          }`}
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-red-600" /> Vérification du paiement auprès du prestataire…
            </>
          ) : focus?.status === 'paid' ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Paiement confirmé : votre accès est ouvert, bonne formation !
            </>
          ) : focus?.status === 'pending' && focus.paymentMethod === 'card' ? (
            <>
              <Clock className="w-4 h-4" /> Paiement non finalisé. Vous pouvez le reprendre ci-dessous, ou choisir le virement.
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" /> Commande {focus?.reference} enregistrée.
            </>
          )}
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {list.map((order) => (
          <div key={order.id} className={`py-3 space-y-2 ${order.id === focus?.id ? 'bg-red-50/30 -mx-2 px-2 rounded-xl' : ''}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-slate-500">{order.reference}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS[order.status].tone}`}>{STATUS[order.status].label}</span>
              {order.paymentMethod && <span className="text-[10px] text-slate-400">{METHOD[order.paymentMethod]}</span>}
              <span className="ml-auto text-sm font-black text-slate-900 whitespace-nowrap">
                {order.total} TND
                {order.charged && order.paymentMethod === 'card' && <span className="block text-[10px] font-semibold text-slate-400 text-right">{eur(order.charged.amount)} par carte</span>}
              </span>
            </div>
            <div className="text-xs text-slate-700">{order.items.map((i) => i.title).join(', ')}</div>
            <div className="text-[10px] text-slate-400">
              Commandée le {formatDate(order.createdAt)}
              {order.paidAt && ` · payée le ${formatDate(order.paidAt)}`}
              {order.cancelledAt && ` · annulée le ${formatDate(order.cancelledAt)}`}
              {order.adminNote && ` · ${order.adminNote}`}
            </div>
            {order.status === 'pending' && order.transfer && <TransferInstructions transfer={order.transfer} />}
            {order.status === 'pending' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => act(order, 'pay')}
                  disabled={busy !== null}
                  className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 disabled:opacity-60"
                >
                  {busy === `pay:${order.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                  {order.paymentMethod === 'transfer' ? 'Payer plutôt par carte' : 'Reprendre le paiement par carte'}
                </button>
                <button
                  onClick={() => act(order, 'cancel')}
                  disabled={busy !== null}
                  className="px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1 disabled:opacity-60"
                >
                  <XCircle className="w-3.5 h-3.5" /> Annuler la commande
                </button>
                {order.paymentMethod === 'transfer' && (
                  <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> En attente de réception du virement
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
