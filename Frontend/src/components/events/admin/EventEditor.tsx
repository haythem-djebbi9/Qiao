import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { api } from '../../../lib/api';
import { resolveImage } from '../../../lib/assets';
import { AdminEvent, EVENT_FORMAT_LABELS, EVENT_PLACEMENT_OPTIONS, EventStatus, eventDateLabel, seatsLabel } from '../../../lib/events';
import { navigateDashboard } from '../../../lib/payments';
import { useToast } from '../../../context/ToastContext';
import { useAppActions } from '../../../context/AppActionsContext';
import { Card, EmptyState, Loading, Pills, errorMessage } from '../../community/ui';
import { EventForm } from './EventForm';
import { EventRegistrationsPanel } from './EventRegistrationsPanel';
import { EventStatusActions, EventStatusBadge, FillBar } from './ui';

const TABS = [
  { id: 'inscrits', label: 'Inscrits & places' },
  { id: 'infos', label: 'Informations' },
];

/** Fiche d'un événement côté administration : publication, inscrits et places, informations. */
export const EventEditor: React.FC<{ eventId: string; tab?: string }> = ({ eventId, tab = 'inscrits' }) => {
  const { notify } = useToast();
  const { navigate } = useAppActions();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = TABS.some((t) => t.id === tab) ? tab : 'inscrits';
  const go = (next: string) => navigateDashboard(`admin-events/evenements/${eventId}/${next}`, { replace: true });

  const load = useCallback(() => {
    setError(null);
    api
      .get<AdminEvent>(`/events/admin/events/${eventId}`)
      .then(setEvent)
      .catch((err) => setError(errorMessage(err)));
  }, [eventId]);
  useEffect(() => load(), [load]);

  const setStatus = async (status: EventStatus) => {
    setBusy(true);
    try {
      setEvent(await api.post<AdminEvent>(`/events/admin/events/${eventId}/status`, { status }));
      notify(status === 'published' ? 'Événement publié : il apparaît sur le site.' : status === 'archived' ? 'Événement archivé.' : 'Événement repassé en brouillon.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async () => {
    try {
      const copy = await api.post<AdminEvent>(`/events/admin/events/${eventId}/duplicate`);
      notify('Copie créée en brouillon : adaptez ses dates avant de la publier.');
      navigateDashboard(`admin-events/evenements/${copy.id}/infos`);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const remove = async () => {
    if (!event || !window.confirm(`Supprimer définitivement « ${event.title} » ?`)) return;
    try {
      await api.delete(`/events/admin/events/${eventId}`);
      notify('Événement supprimé.');
      navigateDashboard('admin-events/evenements');
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  if (error) {
    return (
      <Card>
        <EmptyState icon={<CalendarDays className="w-10 h-10" />} text={error} action={{ label: 'Retour aux événements', onClick: () => navigateDashboard('admin-events/evenements') }} />
      </Card>
    );
  }
  if (!event) return <Loading />;

  const active = event.stats.confirmed + event.stats.waitlisted;
  const hasRegistrations = active + (event.stats.cancelled ?? 0) > 0;

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigateDashboard('admin-events/evenements')}
        className="text-xs font-semibold text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Tous les événements
      </button>
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <img src={resolveImage(event.image)} alt={event.title} className="w-full md:w-40 h-28 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <EventStatusBadge status={event.status} />
              {event.isPast && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-500 border-slate-200">Passé</span>}
              <span className="text-[11px] text-slate-500">
                {event.category} · {EVENT_FORMAT_LABELS[event.format]} · {eventDateLabel(event)} · {event.location}
                {event.priceLabel && ` · ${event.priceLabel}`}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{event.title}</h2>
            <div className="space-y-1 max-w-md">
              <div className="text-[11px] text-slate-500">
                {seatsLabel(event.capacity, event.stats.confirmed)}
                {event.stats.waitlisted > 0 && ` · ${event.stats.waitlisted} en liste d'attente`}
                {event.registrationClosed ? ' · inscriptions closes' : ' · inscriptions ouvertes'}
              </div>
              {event.stats.fillRate !== null && <FillBar value={event.stats.fillRate} />}
            </div>
            <div className="text-[10px] text-slate-400">
              Affiché sur : {event.placements.length ? event.placements.map((p) => EVENT_PLACEMENT_OPTIONS.find((o) => o.id === p)?.label ?? p).join(', ') : 'aucun emplacement'}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <EventStatusActions status={event.status} busy={busy} activeRegistrations={active} onChange={setStatus} />
              {event.status === 'published' && (
                <button
                  onClick={() => navigate('evenements')}
                  className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Voir sur le site
                </button>
              )}
              <button onClick={duplicate} className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Dupliquer
              </button>
              {!hasRegistrations && (
                <button onClick={remove} className="px-3 py-1.5 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer inline-flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              )}
            </div>
            {event.status === 'draft' && event.placements.length === 0 && (
              <p className="text-[11px] text-amber-700">Choisissez au moins un emplacement d'affichage pour pouvoir publier l'événement.</p>
            )}
            {event.format !== 'onsite' && !event.onlineUrl && (
              <p className="text-[11px] text-amber-700">Lien de connexion non renseigné : les participants confirmés ne l'ont pas encore dans leur espace.</p>
            )}
          </div>
        </div>
      </Card>

      <Pills options={TABS} value={current} onChange={go} />
      {current === 'inscrits' && <EventRegistrationsPanel event={event} onEventChange={setEvent} />}
      {current === 'infos' && (
        <Card>
          <EventForm key={event.updatedAt} event={event} onSaved={setEvent} />
        </Card>
      )}
    </div>
  );
};
