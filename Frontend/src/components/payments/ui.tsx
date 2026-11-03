import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, Loader2, Paperclip, ScrollText, X } from 'lucide-react';
import { api, fetchObjectUrl } from '../../lib/api';
import { formatSize } from '../../lib/community';
import { FileRef, PaymentPolicy, STATUS_META, TONE_CLASSES, TxStatus } from '../../lib/payments';
import { useToast } from '../../context/ToastContext';
import { Loading, Modal, errorMessage } from '../community/ui';

export const StatusBadge: React.FC<{ status: TxStatus; className?: string }> = ({ status, className = '' }) => {
  const meta = STATUS_META[status] ?? { label: status, tone: 'slate' as const };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${TONE_CLASSES[meta.tone]} ${className}`}>
      {meta.label}
    </span>
  );
};

/** Envoi de pièces justificatives (6 au maximum, 5 Mo chacune) avant soumission du formulaire. */
export const FileUploader: React.FC<{ files: FileRef[]; onChange: (files: FileRef[]) => void; max?: number }> = ({ files, onChange, max = 6 }) => {
  const { notify } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    const added: FileRef[] = [];
    try {
      for (const file of Array.from(list).slice(0, max - files.length)) {
        const form = new FormData();
        form.append('file', file);
        added.push(await api.post<FileRef>('/payments/uploads', form));
      }
    } catch (err) {
      notify(errorMessage(err, 'Envoi du fichier impossible.'), 'error');
    } finally {
      onChange([...files, ...added]);
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div key={file.id} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs">
          <FileText className="w-4 h-4 text-red-600 shrink-0" />
          <span className="flex-1 min-w-0 truncate font-semibold text-slate-800">{file.name}</span>
          <span className="text-[10px] text-slate-400">{formatSize(file.size)}</span>
          <button type="button" onClick={() => onChange(files.filter((f) => f.id !== file.id))} aria-label="Retirer" className="p-1 rounded-full hover:bg-slate-200 cursor-pointer">
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      ))}
      {files.length < max && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:border-red-400 hover:text-red-600 cursor-pointer disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
          Joindre des justificatifs (PDF, images, DOCX, XLSX — 5 Mo max.)
        </button>
      )}
      <input
        ref={input}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.docx,.xlsx"
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
    </div>
  );
};

/** Pièces jointes d'une transaction (téléchargement protégé par la session). */
export const FileLinks: React.FC<{ ids: string[]; files: FileRef[] }> = ({ ids, files }) => {
  const { notify } = useToast();
  const list = ids.map((id) => files.find((f) => f.id === id)).filter((f): f is FileRef => !!f);
  if (!list.length) return null;
  const download = async (file: FileRef) => {
    try {
      const url = await fetchObjectUrl(`/payments/attachments/${file.id}`);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      notify(errorMessage(err, 'Téléchargement impossible.'), 'error');
    }
  };
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {list.map((file) => (
        <button
          key={file.id}
          type="button"
          onClick={() => download(file)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 cursor-pointer"
        >
          <Download className="w-3 h-3 text-red-600" />
          <span className="max-w-[180px] truncate">{file.name}</span>
        </button>
      ))}
    </div>
  );
};

let policyCache: Promise<PaymentPolicy> | null = null;

export function usePaymentPolicy() {
  const [policy, setPolicy] = useState<PaymentPolicy | null>(null);
  useEffect(() => {
    policyCache ??= api.get<PaymentPolicy>('/payments/policy');
    policyCache.then(setPolicy).catch(() => {
      policyCache = null;
    });
  }, []);
  return policy;
}

/** Politique publiée : période de protection, annulations, litiges. */
export const PolicyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const policy = usePaymentPolicy();
  return (
    <Modal title="Paiement sécurisé & gestion des litiges" icon={<ScrollText className="w-4 h-4" />} onClose={onClose} wide>
      {!policy ? (
        <Loading />
      ) : (
        <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Fonds retenus par QIAO</h4>
            <p>
              Le client règle la prestation via le prestataire de paiement agréé de QIAO. Les fonds sont retenus : le prestataire ne les reçoit pas au moment du
              paiement, mais seulement lorsque les conditions de libération sont réunies.
            </p>
          </section>
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Période de protection de {policy.deadline.periodDays} jours</h4>
            <ul className="space-y-1.5 list-disc pl-4">
              {policy.deadline.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Annulation et prestation partielle</h4>
            <ul className="space-y-1.5 list-disc pl-4">
              {policy.cancellation.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Litiges</h4>
            <p>
              Une contestation déposée avant l'échéance bloque immédiatement tout versement. Elle n'entraîne ni remboursement ni versement automatique : le
              prestataire peut répondre et produire ses justificatifs, puis un membre habilité de QIAO rend une décision motivée (remboursement intégral,
              remboursement partiel avec versement du solde, rejet de la contestation, ou demande d'éléments complémentaires). Un remboursement n'est
              affiché comme effectué qu'après confirmation du prestataire de paiement.
            </p>
            <p className="mt-2 text-slate-500">Motifs : {Object.values(policy.disputeReasons).join(' · ')}.</p>
          </section>
          <section className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            Commission QIAO : {policy.commissionPercent.toLocaleString('fr-FR')} % du montant libéré au prestataire. Frais du prestataire de paiement répartis au
            prorata entre le prestataire (montant versé) et QIAO (montant remboursé). Devises : {Object.keys(policy.currencies).join(', ')}.
            {policy.provider === 'sandbox' && <strong className="block mt-1 text-amber-700">Environnement de test : paiements simulés, aucun débit réel.</strong>}
          </section>
        </div>
      )}
    </Modal>
  );
};
