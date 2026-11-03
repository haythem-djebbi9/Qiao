import React, { useRef, useState } from 'react';
import { AlignLeft, Archive, Award, CheckCircle2, Eye, EyeOff, FileText, HelpCircle, ImagePlus, Loader2, PlayCircle, RotateCcw, ShieldAlert, Upload } from 'lucide-react';
import { api, downloadFile } from '../../lib/api';
import { resolveImage } from '../../lib/assets';
import { CertificateSummary, FileRef, LessonType, PublicationStatus, STATUS_LABELS } from '../../lib/academy';
import { useToast } from '../../context/ToastContext';
import { errorMessage, inputClass } from '../community/ui';

export const StatusBadge: React.FC<{ status: PublicationStatus; masculine?: boolean; className?: string }> = ({ status, masculine, className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_LABELS[status].tone} ${className}`}>
    {masculine ? STATUS_LABELS[status].masculine : STATUS_LABELS[status].label}
  </span>
);

export const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className = 'h-2' }) => (
  <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${className}`}>
    <div className={`h-full ${value >= 100 ? 'bg-emerald-500' : 'bg-red-600'} transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

const LESSON_ICONS: Record<LessonType, React.ComponentType<{ className?: string }>> = {
  text: AlignLeft,
  video: PlayCircle,
  pdf: FileText,
  quiz: HelpCircle,
};

export const LessonTypeIcon: React.FC<{ type: LessonType; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  const Icon = LESSON_ICONS[type];
  return <Icon className={className} />;
};

/** Boutons de cycle de publication : publier, dépublier (brouillon), archiver, restaurer. */
export const StatusActions: React.FC<{
  status: PublicationStatus;
  busy?: boolean;
  onChange: (status: PublicationStatus) => void;
  noun?: string;
}> = ({ status, busy, onChange, noun = 'la formation' }) => {
  const button = 'px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60';
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== 'published' && status !== 'archived' && (
        <button type="button" disabled={busy} onClick={() => onChange('published')} className={`${button} bg-red-600 hover:bg-red-700 text-white shadow-sm`}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} Publier
        </button>
      )}
      {status === 'published' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => window.confirm(`Dépublier ${noun} ? Ce contenu ne sera plus visible dans Academy ; les inscrits gardent leur accès.`) && onChange('draft')}
          className={`${button} border border-slate-200 text-slate-700 hover:bg-slate-50`}
        >
          <EyeOff className="w-3.5 h-3.5" /> Dépublier
        </button>
      )}
      {status !== 'archived' ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => window.confirm(`Archiver ${noun} ? Ce contenu ne sera plus proposé ; les inscrits gardent leur accès.`) && onChange('archived')}
          className={`${button} border border-slate-200 text-slate-500 hover:bg-slate-50`}
        >
          <Archive className="w-3.5 h-3.5" /> Archiver
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={() => onChange('draft')} className={`${button} border border-slate-200 text-slate-700 hover:bg-slate-50`}>
          <RotateCcw className="w-3.5 h-3.5" /> Restaurer en brouillon
        </button>
      )}
    </div>
  );
};

export interface UploadResult extends FileRef {
  kind: 'image' | 'pdf' | 'video' | 'file';
  ref: string | null;
}

export function uploadAcademyFile(file: File, purpose: 'cover' | 'lesson' | 'resource') {
  const body = new FormData();
  body.append('file', file);
  return api.post<UploadResult>(`/academy/admin/uploads?purpose=${purpose}`, body);
}

/** Bouton de téléversement (fichier contrôlé côté serveur : format, taille et signature binaire). */
export const UploadButton: React.FC<{
  purpose: 'cover' | 'lesson' | 'resource';
  accept: string;
  label: string;
  onUploaded: (result: UploadResult) => void;
}> = ({ purpose, accept, label, onUploaded }) => {
  const { notify } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onUploaded(await uploadAcademyFile(file, purpose));
      notify('Fichier téléversé.');
    } catch (err) {
      notify(errorMessage(err, 'Téléversement impossible.'), 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };
  return (
    <>
      <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> : <Upload className="w-3.5 h-3.5 text-red-600" />}
        {label}
      </button>
    </>
  );
};

/** Image : lien https ou fichier téléversé (aperçu immédiat). */
export const ImageField: React.FC<{ value: string; onChange: (value: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
  <div className="flex items-start gap-3">
    <div className="w-24 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
      {value ? <img src={resolveImage(value)} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-5 h-5 text-slate-300" />}
    </div>
    <div className="flex-1 min-w-0 space-y-2">
      <input
        value={value.startsWith('academy-file:') ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={value.startsWith('academy-file:') ? 'Image téléversée' : (placeholder ?? 'https://…')}
        className={inputClass}
      />
      <UploadButton purpose="cover" accept="image/jpeg,image/png,image/webp" label="Téléverser une image" onUploaded={(r) => r.ref && onChange(r.ref)} />
    </div>
  </div>
);

/**
 * Certificat de réussite du membre : téléchargement du PDF (délivré au besoin par le serveur si la formation est terminée),
 * ou mention « Certificat révoqué ».
 */
export const CertificateButton: React.FC<{
  courseId: string;
  certificate: CertificateSummary | null | undefined;
  compact?: boolean;
  className?: string;
}> = ({ courseId, certificate, compact, className = '' }) => {
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  if (certificate?.status === 'revoked') {
    return (
      <span className={`px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-bold inline-flex items-center gap-1.5 ${className}`}>
        <ShieldAlert className="w-3.5 h-3.5" /> Certificat révoqué
      </span>
    );
  }
  const download = async () => {
    setBusy(true);
    try {
      await downloadFile(`/academy/learn/${courseId}/certificate`, `certificat-qiao-academy${certificate ? `-${certificate.number}` : ''}.pdf`);
      notify('Certificat téléchargé.');
    } catch (err) {
      notify(errorMessage(err, 'Téléchargement impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className={`${
        compact ? 'px-3 py-1.5 rounded-lg text-[11px]' : 'px-4 py-2 rounded-xl text-xs'
      } bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60 ${className}`}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
      {compact ? 'Certificat' : 'Télécharger mon certificat'}
    </button>
  );
};

export const CompletedMark: React.FC<{ done: boolean; className?: string }> = ({ done, className = 'w-4 h-4' }) =>
  done ? <CheckCircle2 className={`${className} text-emerald-500 shrink-0`} /> : <span className={`${className} rounded-full border-2 border-slate-300 shrink-0`} />;

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
