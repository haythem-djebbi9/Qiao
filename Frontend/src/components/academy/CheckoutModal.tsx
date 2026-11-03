import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, CreditCard, Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { api } from '../../lib/api';
import { AcademyItemType, Cart, Order } from '../../lib/models';
import { useToast } from '../../context/ToastContext';
import { Modal, errorMessage } from '../community/ui';

export interface PaymentOptions {
  currency: 'TND';
  card: { available: boolean; currency: 'EUR'; rate: number | null; provider: string };
  transfer: { available: boolean };
}

export interface CheckoutResult {
  order: Order;
  cart: Cart;
  checkoutUrl?: string;
}

const eur = (amount: number) => amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

/** Coordonnées bancaires et référence à rappeler dans le libellé du virement. */
export const TransferInstructions: React.FC<{ transfer: NonNullable<Order['transfer']> }> = ({ transfer }) => (
  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-2 text-xs text-slate-700">
    <div className="font-bold text-slate-900 flex items-center gap-1.5">
      <Building2 className="w-4 h-4 text-blue-600" /> Virement à effectuer
    </div>
    <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1">
      <dt className="text-slate-500">Montant</dt>
      <dd className="font-bold text-slate-900">
        {transfer.amount} {transfer.currency}
      </dd>
      <dt className="text-slate-500">Bénéficiaire</dt>
      <dd className="font-semibold">{transfer.beneficiary}</dd>
      {transfer.bankName && (
        <>
          <dt className="text-slate-500">Banque</dt>
          <dd>{transfer.bankName}</dd>
        </>
      )}
      {transfer.rib && (
        <>
          <dt className="text-slate-500">RIB</dt>
          <dd className="font-mono break-all">{transfer.rib}</dd>
        </>
      )}
      {transfer.iban && (
        <>
          <dt className="text-slate-500">IBAN</dt>
          <dd className="font-mono break-all">{transfer.iban}</dd>
        </>
      )}
      {transfer.bic && (
        <>
          <dt className="text-slate-500">BIC</dt>
          <dd className="font-mono">{transfer.bic}</dd>
        </>
      )}
      <dt className="text-slate-500">Libellé</dt>
      <dd className="font-mono font-bold text-red-600">{transfer.reference}</dd>
    </dl>
    {transfer.instructions && <p className="text-[11px] text-slate-600 whitespace-pre-line">{transfer.instructions}</p>}
    <p className="text-[11px] text-slate-500">Votre accès s'ouvre dès que l'équipe QIAO a constaté la réception du virement ; vous recevez une notification.</p>
  </div>
);

/**
 * Paiement d'une commande QIAO Academy : carte bancaire (page sécurisée du prestataire, montant converti en euros)
 * ou virement (accès ouvert à réception). Une formation gratuite est ouverte sans paiement.
 */
export const CheckoutModal: React.FC<{
  lines: { title: string; price: number }[];
  target: { kind: 'cart' } | { kind: 'item'; itemType: AcademyItemType; itemId: string };
  onClose: () => void;
  onDone: (result: CheckoutResult) => void;
}> = ({ lines, target, onClose, onDone }) => {
  const { notify } = useToast();
  const [options, setOptions] = useState<PaymentOptions | null>(null);
  const [method, setMethod] = useState<'card' | 'transfer'>('card');
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const total = lines.reduce((sum, line) => sum + line.price, 0);
  const free = total === 0;

  useEffect(() => {
    api
      .get<PaymentOptions>('/academy/payment-options')
      .then((o) => {
        setOptions(o);
        if (!o.card.available && o.transfer.available) setMethod('transfer');
      })
      .catch(() => setOptions({ currency: 'TND', card: { available: false, currency: 'EUR', rate: null, provider: '' }, transfer: { available: false } }));
  }, []);

  const cardAmount = options?.card.rate ? Math.round(total * options.card.rate * 100) / 100 : null;
  const nothingAvailable = options && !free && !options.card.available && !options.transfer.available;

  const submit = async () => {
    setBusy(true);
    try {
      const result =
        target.kind === 'cart'
          ? await api.post<CheckoutResult>('/academy/cart/checkout', { method })
          : await api.post<CheckoutResult>('/academy/enroll', { itemType: target.itemType, itemId: target.itemId, method });
      if (result.checkoutUrl) {
        // Page de paiement sécurisée du prestataire ; retour automatique dans Mon espace › Formations.
        window.location.assign(result.checkoutUrl);
        return;
      }
      onDone(result);
      if (result.order.status === 'paid') {
        notify(`Inscription validée (${result.order.reference}) : votre accès est ouvert.`);
        onClose();
      } else {
        setPlaced(result.order);
      }
    } catch (err) {
      notify(errorMessage(err, 'Commande impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const choice = (value: 'card' | 'transfer', available: boolean, icon: React.ReactNode, title: string, detail: string) => (
    <label
      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
        !available ? 'opacity-50 cursor-not-allowed border-slate-200' : method === value ? 'border-red-400 bg-red-50/60' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <input type="radio" name="payment-method" checked={method === value} disabled={!available} onChange={() => setMethod(value)} className="mt-1 accent-red-600" />
      <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-900">{title}</span>
        <span className="block text-[11px] text-slate-500">{available ? detail : 'Indisponible pour le moment.'}</span>
      </span>
    </label>
  );

  return (
    <Modal title={placed ? `Commande ${placed.reference}` : 'Paiement de votre formation'} icon={<Wallet className="w-4 h-4" />} onClose={onClose}>
      {placed ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 flex items-start gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Commande enregistrée. Retrouvez-la à tout moment dans Mon espace › Formations.
          </p>
          {placed.transfer && <TransferInstructions transfer={placed.transfer} />}
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-full bg-[#071329] text-white text-xs font-bold cursor-pointer">
              Fermer
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {lines.map((line) => (
              <div key={line.title} className="px-3 py-2 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-700 truncate">{line.title}</span>
                <span className="font-semibold text-slate-900 whitespace-nowrap">{line.price} TND</span>
              </div>
            ))}
            <div className="px-3 py-2 flex items-center justify-between text-sm font-black text-slate-900">
              <span>Total</span>
              <span>{free ? 'Gratuit' : `${total} TND`}</span>
            </div>
          </div>

          {!options ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-red-600" /> Chargement des moyens de paiement…
            </div>
          ) : free ? (
            <p className="text-xs text-slate-600">Cette formation est gratuite : votre accès est ouvert immédiatement.</p>
          ) : (
            <div className="space-y-2">
              {choice(
                'card',
                options.card.available,
                <CreditCard className="w-4 h-4 text-red-600" />,
                'Carte bancaire',
                cardAmount !== null
                  ? `${eur(cardAmount)} débités sur la page sécurisée du prestataire (1 TND = ${options.card.rate?.toLocaleString('fr-FR', { maximumFractionDigits: 6 })} €). Accès ouvert dès le paiement confirmé.`
                  : 'Paiement sécurisé en ligne.',
              )}
              {choice('transfer', options.transfer.available, <Building2 className="w-4 h-4 text-blue-600" />, 'Virement bancaire', `${total} TND. Coordonnées bancaires affichées après la commande ; accès ouvert à réception du virement.`)}
              {nothingAvailable && <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-2.5">Aucun moyen de paiement n'est encore configuré. Contactez l'équipe QIAO.</p>}
            </div>
          )}

          <p className="text-[10px] text-slate-400 flex items-start gap-1">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> QIAO ne voit ni ne conserve vos données de carte : elles sont saisies sur la page du prestataire de paiement.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={busy || !options || Boolean(nothingAvailable)}
              className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {free ? "S'inscrire gratuitement" : method === 'card' ? `Payer ${cardAmount !== null ? eur(cardAmount) : ''} par carte` : 'Commander et payer par virement'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
