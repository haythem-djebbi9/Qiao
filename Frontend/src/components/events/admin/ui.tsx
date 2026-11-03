import React from 'react';
import { Archive, Eye, EyeOff, Loader2, RotateCcw } from 'lucide-react';
import { EVENT_STATUS_LABELS, EventStatus, REGISTRATION_STATUS_LABELS } from '../../../lib/events';
import { RegistrationStatus } from '../../../lib/models';

export const EventStatusBadge: React.FC<{ status: EventStatus; className?: string }> = ({ status, className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${EVENT_STATUS_LABELS[status].tone} ${className}`}>
    {EVENT_STATUS_LABELS[status].label}
  </span>
);

export const RegistrationBadge: React.FC<{ status: RegistrationStatus; position?: number | null }> = ({ status, position }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${REGISTRATION_STATUS_LABELS[status].tone}`}>
    {REGISTRATION_STATUS_LABELS[status].label}
    {position ? ` · n° ${position}` : ''}
  </span>
);

/** Remplissage de la jauge (rouge, vert une fois complet). */
export const FillBar: React.FC<{ value: number; className?: string }> = ({ value, className = 'h-1.5' }) => (
  <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${className}`}>
    <div className={`h-full ${value >= 100 ? 'bg-emerald-500' : 'bg-red-600'} transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

/** Cycle de publication d'un événement : publier, dépublier (brouillon), archiver, restaurer. */
export const EventStatusActions: React.FC<{ status: EventStatus; busy?: boolean; activeRegistrations: number; onChange: (status: EventStatus) => void }> = ({
  status,
  busy,
  activeRegistrations,
  onChange,
}) => {
  const button = 'px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60';
  const kept = activeRegistrations > 0 ? ` Les ${activeRegistrations} inscription(s) en cours sont conservées et restent visibles dans l'espace des participants.` : '';
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
          onClick={() => window.confirm(`Dépublier l'événement ? Il ne sera plus visible sur le site et n'acceptera plus d'inscriptions.${kept}`) && onChange('draft')}
          className={`${button} border border-slate-200 text-slate-700 hover:bg-slate-50`}
        >
          <EyeOff className="w-3.5 h-3.5" /> Dépublier
        </button>
      )}
      {status !== 'archived' ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => window.confirm(`Archiver l'événement ? Il disparaît du site ; l'historique des inscrits est conservé.${kept}`) && onChange('archived')}
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

export const StatTiles: React.FC<{ items: [string, React.ReactNode][] }> = ({ items }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {items.map(([label, value]) => (
      <div key={label} className="bg-[#071329] text-white rounded-2xl p-4">
        <div className="text-2xl font-black">{value}</div>
        <div className="text-[11px] text-slate-300 mt-1">{label}</div>
      </div>
    ))}
  </div>
);
