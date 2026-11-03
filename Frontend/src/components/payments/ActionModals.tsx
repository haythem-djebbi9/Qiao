import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Handshake, PackageCheck, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { FileRef, TxDetail, formatMoney, toInputAmount } from '../../lib/payments';
import { useToast } from '../../context/ToastContext';
import { Field, Modal, ModalActions, errorMessage, inputClass } from '../community/ui';
import { FileUploader, usePaymentPolicy } from './ui';

export type ModalKind = 'accept' | 'decline' | 'cancel' | 'declare' | 'dispute' | 'settlement' | null;

interface Props {
  kind: Exclude<ModalKind, null>;
  tx: TxDetail;
  onClose: () => void;
  onDone: (tx: TxDetail) => void;
}

/** Formulaires des actions sensibles du client et du prestataire. */
export const ActionModal: React.FC<Props> = ({ kind, tx, onClose, onDone }) => {
  const { notify } = useToast();
  const policy = usePaymentPolicy();
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(kind === 'accept' ? toInputAmount(tx.amount, tx.currency) : '');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileRef[]>([]);
  const [reason, setReason] = useState('');
  const [resolution, setResolution] = useState('full_refund');

  const run = async (path: string, body: unknown, success: string) => {
    setBusy(true);
    try {
      const updated = await api.post<TxDetail>(`/payments/transactions/${tx.id}/${path}`, body);
      notify(success);
      onDone(updated);
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remaining = tx.amount - tx.refundedAmount;

  if (kind === 'accept') {
    return (
      <Modal title="Accepter la demande" icon={<CheckCircle2 className="w-4 h-4" />} onClose={onClose}>
        <form onSubmit={(e) => { e.preventDefault(); run('accept', { amount, terms: text || undefined }, 'Demande acceptée : le client peut procéder au paiement.'); }} className="space-y-3">
          <Field label={`Prix de la prestation (${tx.currency})`} hint={`Budget proposé par le client : ${formatMoney(tx.requestedAmount, tx.currency)}. Le client paiera le montant que vous fixez ici.`}>
            <input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Conditions (livrables, délais, exclusions)" hint="Ajoutées à l'accord de référence.">
            <textarea rows={4} maxLength={3000} value={text} onChange={(e) => setText(e.target.value)} className={inputClass} />
          </Field>
          {policy && (
            <p className="text-[11px] text-slate-500">
              Commission QIAO : {policy.commissionPercent.toLocaleString('fr-FR')} % du montant versé ; les fonds vous sont versés après la période de protection de{' '}
              {policy.deadline.periodDays} jours suivant votre déclaration de fin de prestation.
            </p>
          )}
          <ModalActions onCancel={onClose} submitLabel="Accepter" busy={busy} />
        </form>
      </Modal>
    );
  }

  if (kind === 'decline' || kind === 'cancel') {
    const paid = !!tx.timestamps.paidAt;
    return (
      <Modal title={kind === 'decline' ? 'Refuser la demande' : 'Annuler la transaction'} icon={<XCircle className="w-4 h-4" />} onClose={onClose}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(kind, { reason: text || undefined }, kind === 'decline' ? 'Demande refusée.' : paid ? 'Transaction annulée : remboursement intégral en cours.' : 'Transaction annulée.');
          }}
          className="space-y-3"
        >
          {kind === 'cancel' && (
            <p className="text-xs text-slate-600">
              {paid
                ? `Le client sera intégralement remboursé (${formatMoney(remaining, tx.currency)}). Le remboursement sera affiché comme effectué dès sa confirmation par le prestataire de paiement.`
                : "Aucun paiement n'a été encaissé : l'annulation n'a pas d'effet financier."}
            </p>
          )}
          <Field label="Motif (communiqué à l'autre partie)">
            <textarea rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} className={inputClass} />
          </Field>
          <ModalActions onCancel={onClose} submitLabel={kind === 'decline' ? 'Refuser' : "Confirmer l'annulation"} busy={busy} danger />
        </form>
      </Modal>
    );
  }

  if (kind === 'declare') {
    return (
      <Modal title="Déclarer la prestation terminée" icon={<PackageCheck className="w-4 h-4" />} onClose={onClose} wide>
        <form onSubmit={(e) => { e.preventDefault(); run('declare-completion', { details: text, attachmentIds: files.map((f) => f.id) }, 'Déclaration enregistrée : la période de protection a commencé.'); }} className="space-y-3">
          <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-900">
            Votre déclaration ouvre une période de protection de {policy?.deadline.periodDays ?? 5} jours calendaires pour le client, à compter de l'heure
            d'enregistrement par le serveur QIAO. Elle ne peut être faite qu'une fois. Ce n'est pas une demande de versement : le versement n'interviendra qu'à
            l'échéance, sans contestation du client.
          </div>
          <Field label="Prestation réalisée" hint="Livrables remis, date de livraison, points notables.">
            <textarea required minLength={10} maxLength={5000} rows={5} value={text} onChange={(e) => setText(e.target.value)} className={inputClass} />
          </Field>
          <FileUploader files={files} onChange={setFiles} />
          <ModalActions onCancel={onClose} submitLabel="Déclarer la prestation terminée" busy={busy} />
        </form>
      </Modal>
    );
  }

  if (kind === 'dispute') {
    return (
      <Modal title="Contester la prestation" icon={<AlertTriangle className="w-4 h-4" />} onClose={onClose} wide>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(
              'dispute',
              { reason, description: text, expectedResolution: resolution, requestedRefundAmount: resolution === 'partial_refund' ? amount : undefined, attachmentIds: files.map((f) => f.id) },
              'Contestation enregistrée : le versement est bloqué pendant l’examen par QIAO.',
            );
          }}
          className="space-y-3"
        >
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-800">
            Votre contestation bloque immédiatement tout versement au prestataire. Elle n'entraîne pas de remboursement automatique : le prestataire pourra
            répondre, puis l'équipe QIAO examinera le dossier et rendra une décision motivée.
          </div>
          <Field label="Motif">
            <select required value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>
              <option value="">Choisir un motif</option>
              {Object.entries(policy?.disputeReasons ?? {}).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description du problème">
            <textarea required minLength={20} maxLength={5000} rows={5} value={text} onChange={(e) => setText(e.target.value)} className={inputClass} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Résolution attendue">
              <select value={resolution} onChange={(e) => setResolution(e.target.value)} className={inputClass}>
                {Object.entries(policy?.expectedResolutions ?? { full_refund: 'Remboursement intégral' }).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            {resolution === 'partial_refund' && (
              <Field label={`Montant souhaité (${tx.currency})`} hint={`Au plus ${formatMoney(remaining, tx.currency)}.`}>
                <input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
              </Field>
            )}
          </div>
          <FileUploader files={files} onChange={setFiles} />
          <ModalActions onCancel={onClose} submitLabel="Contester la prestation" busy={busy} disabled={!reason} danger />
        </form>
      </Modal>
    );
  }

  return (
    <Modal title="Proposer un accord amiable" icon={<Handshake className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); run('settlement', { refundAmount: amount, note: reason || undefined }, "Proposition envoyée à l'autre partie."); }} className="space-y-3">
        <p className="text-xs text-slate-600">
          Annulation ou prestation partielle : proposez le montant remboursé au client. Si l'autre partie accepte, le remboursement est exécuté et le solde est
          versé au prestataire selon les conditions de libération.
        </p>
        <Field label={`Montant remboursé au client (${tx.currency})`} hint={`Entre 0 et ${formatMoney(remaining, tx.currency)} (remboursement intégral).`}>
          <input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Explication">
          <textarea rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
        </Field>
        <ModalActions onCancel={onClose} submitLabel="Envoyer la proposition" busy={busy} />
      </form>
    </Modal>
  );
};
