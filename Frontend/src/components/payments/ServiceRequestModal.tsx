import React, { useEffect, useState } from 'react';
import { BadgeCheck, Clock, Lock, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { TxSummary } from '../../lib/payments';
import { useToast } from '../../context/ToastContext';
import { useAppActions } from '../../context/AppActionsContext';
import { Field, Modal, ModalActions, errorMessage, inputClass } from '../community/ui';
import { PolicyModal, usePaymentPolicy } from './ui';

interface Eligibility {
  eligible: boolean;
  verified: boolean;
  paymentsEnabled: boolean;
  reason: string | null;
}

/** « Demander une prestation » : demande adressée à un professionnel, réglée ensuite via le paiement sécurisé QIAO. */
export const ServiceRequestModal: React.FC<{ provider: { handle: string; fullName: string }; onClose: () => void }> = ({ provider, onClose }) => {
  const { notify } = useToast();
  const { navigate } = useAppActions();
  const policy = usePaymentPolicy();
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [form, setForm] = useState({ title: '', description: '', amount: '', currency: 'EUR', expectedDeliveryDate: '' });
  const [busy, setBusy] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    api.get<Eligibility>(`/payments/providers/${provider.handle}`).then(setEligibility).catch(() => undefined);
  }, [provider.handle]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const tx = await api.post<TxSummary>('/payments/transactions', {
        providerHandle: provider.handle,
        title: form.title,
        description: form.description,
        amount: form.amount,
        currency: form.currency,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
      });
      notify(`Demande envoyée à ${provider.fullName}. Vous serez notifié de sa réponse.`);
      onClose();
      navigate(`dashboard/prestations/${tx.id}`);
    } catch (err) {
      notify(errorMessage(err, 'Envoi de la demande impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const blocked = eligibility && !eligibility.eligible;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Modal title={`Demander une prestation à ${provider.fullName}`} icon={<ShieldCheck className="w-4 h-4" />} onClose={onClose} wide>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {[
            { icon: Lock, text: 'Paiement retenu par QIAO, jamais versé immédiatement' },
            { icon: Clock, text: `${policy?.deadline.periodDays ?? 5} jours pour vérifier après la livraison` },
            { icon: BadgeCheck, text: 'Litige examiné par QIAO avant tout remboursement' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] font-semibold text-blue-900">
              <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              {text}
            </div>
          ))}
        </div>
        {blocked && <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">{eligibility.reason}</div>}
        {eligibility && !eligibility.paymentsEnabled && (
          <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Le paiement sécurisé n'est pas encore activé sur QIAO : la demande peut être envoyée, le paiement sera possible dès son activation.
          </div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <Field label="Prestation demandée">
            <input
              required
              minLength={5}
              maxLength={160}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex. Audit qualité d'une usine à Ningbo"
              className={inputClass}
            />
          </Field>
          <Field label="Description et livrables attendus" hint="Cette description constitue l'accord de référence en cas de litige.">
            <textarea
              required
              minLength={20}
              maxLength={5000}
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Périmètre, livrables, délais, langue du rapport..."
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Budget proposé">
              <input
                required
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="1 500"
                className={inputClass}
              />
            </Field>
            <Field label="Devise">
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputClass}>
                {Object.entries(policy?.currencies ?? { EUR: { label: 'Euro' } }).map(([code, c]) => (
                  <option key={code} value={code}>
                    {code} — {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Livraison souhaitée">
              <input type="date" min={today} value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <p className="text-[11px] text-slate-500">
            Le prestataire accepte ou ajuste le prix avant tout paiement. Vous ne payez qu'après son acceptation.{' '}
            <button type="button" onClick={() => setShowPolicy(true)} className="font-bold text-red-600 hover:underline cursor-pointer">
              Politique de paiement et de litiges
            </button>
          </p>
          <ModalActions onCancel={onClose} submitLabel="Envoyer la demande" busy={busy} disabled={!!blocked} />
        </form>
      </Modal>
      {showPolicy && <PolicyModal onClose={() => setShowPolicy(false)} />}
    </>
  );
};
