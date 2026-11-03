import React, { useEffect, useState } from 'react';
import { CalendarDays, Copy, Lock, Pencil, Plus, ScrollText, Search, Users } from 'lucide-react';
import { api } from '../../../lib/api';
import { resolveImage } from '../../../lib/assets';
import { AdminEvent, EVENT_FORMAT_LABELS, EVENT_STATUS_LABELS, EventsOverview, eventDateLabel, seatsLabel } from '../../../lib/events';
import { navigateDashboard } from '../../../lib/payments';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ActionMenu } from '../../community/PostCard';
import { Card, EmptyState, Loading, Modal, Pills, SectionTitle, errorMessage, inputClass } from '../../community/ui';
import { EventEditor } from './EventEditor';
import { EventForm } from './EventForm';
import { EventStatusBadge, FillBar, StatTiles } from './ui';

const SECTIONS = [
  { id: 'tableau', label: "Vue d'ensemble" },
  { id: 'evenements', label: 'Événements' },
  { id: 'journal', label: "Journal d'audit" },
];

/** Mon espace › Admin : Événements (route ?dv=admin-events/<section>/<id>/<onglet>). */
export const EventsAdminView: React.FC<{ route: string[] }> = ({ route }) => {
  const { user } = useAuth();
  const [section = 'tableau', id, sub] = route;
  if (user?.role !== 'admin') {
    return (
      <Card>
        <EmptyState icon={<Lock className="w-10 h-10" />} text="Espace réservé aux administrateurs QIAO." />
      </Card>
    );
  }
  const current = SECTIONS.some((s) => s.id === section) ? section : 'tableau';
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-red-600" /> Administration des événements
        </h2>
        <p className="text-xs text-slate-600">Salons, forums, webinaires et missions : fiches, publication, inscrits et places. Chaque modification est enregistrée dans le journal d'audit.</p>
      </div>
      <Pills options={SECTIONS} value={current} onChange={(next) => navigateDashboard(`admin-events/${next}`)} />
      {current === 'tableau' && <OverviewSection />}
      {current === 'evenements' && (id ? <EventEditor eventId={id} tab={sub} /> : <EventsList />)}
      {current === 'journal' && <AuditSection />}
    </div>
  );
};

const openEvent = (event: { id: string }, tab = 'inscrits') => navigateDashboard(`admin-events/evenements/${event.id}/${tab}`);

/** Ligne d'événement (liste et prochains événements). */
const EventRow: React.FC<{ event: AdminEvent; menu?: React.ReactNode }> = ({ event, menu }) => (
  <div className={`py-3 flex flex-col md:flex-row md:items-center gap-3 ${event.status === 'archived' ? 'opacity-60' : ''}`}>
    <button onClick={() => openEvent(event)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer group">
      <img src={resolveImage(event.image)} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-bold text-slate-900 group-hover:text-red-600 line-clamp-1">{event.title}</div>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <EventStatusBadge status={event.status} />
          {event.isPast && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-500 border-slate-200">Passé</span>}
          <span className="text-[10px] text-slate-500">
            {eventDateLabel(event)} · {event.category} · {EVENT_FORMAT_LABELS[event.format]}
            {event.location.toLowerCase() !== EVENT_FORMAT_LABELS[event.format].toLowerCase() && ` · ${event.location}`}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {seatsLabel(event.capacity, event.stats.confirmed)}
          {event.stats.waitlisted > 0 && <span className="text-amber-700 font-semibold"> · {event.stats.waitlisted} en liste d'attente</span>}
          {!event.isPast && event.registrationClosed && ' · inscriptions fermées'}
        </div>
      </div>
    </button>
    <div className="flex items-center gap-3 md:justify-end">
      {event.stats.fillRate !== null && (
        <div className="w-24 flex items-center gap-2">
          <FillBar value={event.stats.fillRate} />
          <span className="text-[10px] font-bold text-slate-700 w-8 text-right">{event.stats.fillRate} %</span>
        </div>
      )}
      {menu}
    </div>
  </div>
);

// --- Vue d'ensemble -------------------------------------------------------------------------

const OverviewSection: React.FC = () => {
  const [data, setData] = useState<EventsOverview | null>(null);
  useEffect(() => {
    api.get<EventsOverview>('/events/admin/overview').then(setData).catch(() => undefined);
  }, []);
  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <StatTiles
        items={[
          ['Participants confirmés', data.registrations.confirmed],
          ["En liste d'attente", data.registrations.waitlisted],
          ['Présences pointées', data.registrations.present],
          ['Annulations', data.registrations.cancelled],
        ]}
      />
      <button
        onClick={() => navigateDashboard('admin-events/evenements')}
        className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
      >
        <div className="text-2xl font-black text-slate-900">{data.events.total}</div>
        <div className="text-xs font-semibold text-slate-500 mb-2">Événements</div>
        <div className="flex flex-wrap gap-1.5">
          {(['published', 'draft', 'archived'] as const).map((status) => (
            <span key={status} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${EVENT_STATUS_LABELS[status].tone}`}>
              {data.events[status]} {EVENT_STATUS_LABELS[status].label.toLowerCase()}
              {data.events[status] > 1 ? 's' : ''}
            </span>
          ))}
        </div>
      </button>
      <Card>
        <SectionTitle title="Prochains événements publiés" />
        {data.upcoming.length === 0 ? (
          <EmptyState icon={<CalendarDays className="w-10 h-10" />} text="Aucun événement publié à venir." />
        ) : (
          <div className="divide-y divide-slate-100">
            {data.upcoming.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// --- Liste des événements ----------------------------------------------------------------------

const STATUS_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'published', label: 'Publiés' },
  { id: 'draft', label: 'Brouillons' },
  { id: 'archived', label: 'Archivés' },
];

const PERIOD_FILTERS = [
  { id: 'all', label: 'Toutes les dates' },
  { id: 'upcoming', label: 'À venir' },
  { id: 'past', label: 'Passés' },
];

const EventsList: React.FC = () => {
  const { notify } = useToast();
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('all');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<AdminEvent[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      api
        .get<AdminEvent[]>('/events/admin/events', { status, period, q: q.trim() || undefined })
        .then(setItems)
        .catch(() => setItems([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [status, period, q]);

  const duplicate = async (event: AdminEvent) => {
    try {
      const copy = await api.post<AdminEvent>(`/events/admin/events/${event.id}/duplicate`);
      notify('Copie créée en brouillon : adaptez ses dates avant de la publier.');
      openEvent(copy, 'infos');
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <Card>
      <SectionTitle
        title={`Événements${items ? ` (${items.length})` : ''}`}
        action={
          <button onClick={() => setCreating(true)} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nouvel événement
          </button>
        }
      />
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-4">
        <Pills options={STATUS_FILTERS} value={status} onChange={setStatus} />
        <div className="flex items-center gap-2 lg:ml-auto">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Période" className={`${inputClass} sm:w-40`}>
            {PERIOD_FILTERS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un événement" className={`${inputClass} pl-9`} />
          </div>
        </div>
      </div>
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-10 h-10" />} text="Aucun événement." />
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              menu={
                <ActionMenu
                  items={[
                    { label: 'Inscrits & places', icon: Users, onClick: () => openEvent(event, 'inscrits') },
                    { label: 'Modifier les informations', icon: Pencil, onClick: () => openEvent(event, 'infos') },
                    { label: 'Dupliquer en brouillon', icon: Copy, onClick: () => duplicate(event) },
                  ]}
                />
              }
            />
          ))}
        </div>
      )}
      {creating && (
        <Modal title="Nouvel événement" icon={<CalendarDays className="w-4 h-4" />} onClose={() => setCreating(false)} wide>
          <EventForm event={null} onCancel={() => setCreating(false)} onSaved={(event) => openEvent(event, 'infos')} />
        </Modal>
      )}
    </Card>
  );
};

// --- Journal ------------------------------------------------------------------------------------

interface AuditRow {
  id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

const ACTION_FILTERS = [
  ['events.', 'Toutes les actions'],
  ['events.event', 'Événements'],
  ['events.registration', 'Inscrits'],
];

const AuditSection: React.FC = () => {
  const [action, setAction] = useState('events.');
  const [data, setData] = useState<{ items: AuditRow[]; total: number } | null>(null);
  useEffect(() => {
    setData(null);
    api
      .get<{ items: AuditRow[]; total: number }>('/events/admin/audit', { action, limit: 100 })
      .then(setData)
      .catch(() => setData({ items: [], total: 0 }));
  }, [action]);
  return (
    <Card>
      <SectionTitle title={`Journal d'audit des événements${data ? ` (${data.total})` : ''}`} />
      <select value={action} onChange={(e) => setAction(e.target.value)} className={`${inputClass} mb-4 max-w-xs`}>
        {ACTION_FILTERS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {!data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<ScrollText className="w-10 h-10" />} text="Aucune entrée." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Acteur</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Cible</th>
                <th className="py-2">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-slate-500">{new Date(row.createdAt).toLocaleString('fr-FR')}</td>
                  <td className="py-2 pr-3 font-semibold text-slate-800">{row.actorName}</td>
                  <td className="py-2 pr-3 font-mono text-[11px] text-red-700">{row.action}</td>
                  <td className="py-2 pr-3 text-slate-700">{row.targetLabel ?? row.targetId}</td>
                  <td className="py-2 font-mono text-[10px] text-slate-500 break-all">{Object.keys(row.details ?? {}).length ? JSON.stringify(row.details) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
