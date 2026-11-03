import React, { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, Clock, Download, Lock, NotebookPen, Save, Search, Unlock, UserCheck, UserPlus, Users, UserX } from 'lucide-react';
import { api, downloadFile } from '../../../lib/api';
import { AdminEvent, AdminRegistration, EventRegistrations } from '../../../lib/events';
import { RegistrationStatus } from '../../../lib/models';
import { formatDate } from '../../../lib/text';
import { useToast } from '../../../context/ToastContext';
import { ActionMenu } from '../../community/PostCard';
import { Avatar, Card, EmptyState, Field, Loading, Modal, ModalActions, Pills, SectionTitle, errorMessage, inputClass } from '../../community/ui';
import { FillBar, RegistrationBadge, StatTiles } from './ui';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'confirmed', label: 'Confirmés' },
  { id: 'waitlisted', label: "Liste d'attente" },
  { id: 'cancelled', label: 'Annulés' },
];

/** Participant ajouté par l'administration (rattaché au compte QIAO de même e-mail, s'il existe). */
const AddRegistrationModal: React.FC<{ eventId: string; full: boolean; onClose: () => void; onDone: () => void }> = ({ eventId, full, onClose, onDone }) => {
  const { notify } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', companyRole: '', adminNote: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await api.post<{ status: RegistrationStatus; badgeCode: string }>(`/events/admin/events/${eventId}/registrations`, {
        ...form,
        adminNote: form.adminNote.trim() || null,
      });
      notify(result.status === 'confirmed' ? `Participant inscrit (badge ${result.badgeCode}).` : "Événement complet : participant ajouté à la liste d'attente.", result.status === 'confirmed' ? 'success' : 'info');
      onDone();
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Ajouter un participant" icon={<UserPlus className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-600">
          {full
            ? "L'événement est complet : le participant sera placé en liste d'attente. Augmentez la jauge pour le confirmer directement."
            : "Le participant reçoit un badge. S'il a un compte QIAO avec cette adresse, l'inscription apparaît dans son espace et il est notifié."}
        </p>
        <Field label="Nom complet">
          <input required minLength={2} maxLength={120} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Adresse e-mail">
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="nom@entreprise.com" />
        </Field>
        <Field label="Entreprise et rôle">
          <input required minLength={2} maxLength={200} value={form.companyRole} onChange={(e) => setForm({ ...form, companyRole: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Note interne (facultatif)" hint="Visible uniquement par l'administration.">
          <input maxLength={500} value={form.adminNote} onChange={(e) => setForm({ ...form, adminNote: e.target.value })} className={inputClass} placeholder="Invité VIP, délégation CCIT…" />
        </Field>
        <ModalActions onCancel={onClose} submitLabel="Ajouter" busy={busy} />
      </form>
    </Modal>
  );
};

const NoteModal: React.FC<{ registration: AdminRegistration; onClose: () => void; onDone: () => void }> = ({ registration, onClose, onDone }) => {
  const { notify } = useToast();
  const [note, setNote] = useState(registration.adminNote ?? '');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/events/admin/registrations/${registration.id}`, { adminNote: note.trim() || null });
      notify('Note enregistrée.');
      onDone();
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={`Note interne — ${registration.fullName}`} icon={<NotebookPen className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Note (jamais montrée au participant)">
          <textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </Field>
        <ModalActions onCancel={onClose} submitLabel="Enregistrer" busy={busy} />
      </form>
    </Modal>
  );
};

/** Jauge et ouverture des inscriptions, modifiables sans quitter la liste des inscrits. */
const SeatsCard: React.FC<{ event: AdminEvent; data: EventRegistrations; onEventChange: (event: AdminEvent) => void }> = ({ event, data, onEventChange }) => {
  const { notify } = useToast();
  const [capacity, setCapacity] = useState(event.capacity);
  const [busy, setBusy] = useState(false);
  useEffect(() => setCapacity(event.capacity), [event.capacity]);
  const patch = async (body: Record<string, unknown>, success: string) => {
    setBusy(true);
    try {
      onEventChange(await api.patch<AdminEvent>(`/events/admin/events/${event.id}`, body));
      notify(success);
    } catch (err) {
      notify(errorMessage(err), 'error');
      setCapacity(event.capacity);
    } finally {
      setBusy(false);
    }
  };
  const { summary } = data;
  const fill = summary.capacity > 0 ? Math.round((summary.confirmed / summary.capacity) * 100) : null;
  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="text-xs font-bold text-slate-900">
            {summary.capacity > 0 ? `${summary.confirmed} / ${summary.capacity} places attribuées` : `${summary.confirmed} participant(s) confirmé(s) · places illimitées`}
          </div>
          {fill !== null && <FillBar value={fill} className="h-2" />}
          <div className="text-[11px] text-slate-500">
            {summary.remaining !== null && `${summary.remaining} place(s) restante(s) · `}
            {summary.waitlisted} en liste d'attente
            {summary.waitlisted > 0 && summary.remaining !== null && summary.remaining > 0 && (
              <span className="text-amber-700 font-semibold"> · des places sont libres : confirmez les premiers de la liste d'attente</span>
            )}
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            patch({ capacity: Math.max(0, Math.round(Number(capacity) || 0)) }, 'Jauge mise à jour.');
          }}
          className="flex items-end gap-2"
        >
          <Field label="Places (0 = illimité)">
            <input type="number" min={0} max={100000} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={`${inputClass} w-28`} />
          </Field>
          <button
            type="submit"
            disabled={busy || capacity === event.capacity}
            className="px-3 py-2.5 rounded-xl bg-[#071329] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" /> Enregistrer
          </button>
        </form>
        <button
          type="button"
          disabled={busy || event.isPast}
          onClick={() =>
            patch(
              { registrationOpen: !event.registrationOpen },
              event.registrationOpen ? 'Inscriptions fermées.' : 'Inscriptions rouvertes.',
            )
          }
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-40"
        >
          {event.registrationOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          {event.registrationOpen ? 'Fermer les inscriptions' : 'Rouvrir les inscriptions'}
        </button>
      </div>
      {event.registrationClosed && (
        <p className="mt-3 text-[11px] text-amber-700">
          {event.registrationOpen ? "L'événement a commencé : les inscriptions en ligne sont closes." : 'Inscriptions fermées : le formulaire public est désactivé.'} Vous pouvez toujours
          ajouter des participants manuellement.
        </p>
      )}
    </Card>
  );
};

/** Inscrits d'un événement : places, liste d'attente (ordre d'arrivée), présence, notes internes, export. */
export const EventRegistrationsPanel: React.FC<{ event: AdminEvent; onEventChange: (event: AdminEvent) => void }> = ({ event, onEventChange }) => {
  const { notify } = useToast();
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [data, setData] = useState<EventRegistrations | null>(null);
  const [adding, setAdding] = useState(false);
  const [noting, setNoting] = useState<AdminRegistration | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<EventRegistrations>(`/events/admin/events/${event.id}/registrations`, { status, q: q.trim() || undefined })
      .then(setData)
      .catch((err) => notify(errorMessage(err), 'error'));
  }, [event.id, status, q, notify]);
  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load, event.capacity, event.registrationOpen]);

  const act = async (row: AdminRegistration, action: () => Promise<unknown>, success: string) => {
    setBusyId(row.id);
    try {
      await action();
      notify(success);
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };
  const setRegistrationStatus = (row: AdminRegistration, next: RegistrationStatus, success: string) =>
    act(row, () => api.patch(`/events/admin/registrations/${row.id}`, { status: next }), success);
  const checkIn = (row: AdminRegistration, present: boolean) =>
    act(row, () => api.post(`/events/admin/registrations/${row.id}/check-in`, { present }), present ? `${row.fullName} pointé(e) présent(e).` : 'Présence retirée.');

  const exportCsv = () =>
    downloadFile(`/events/admin/events/${event.id}/registrations.csv`, `inscrits-${event.id}.csv`)
      .then(() => notify('Liste des inscrits exportée.'))
      .catch((err) => notify(errorMessage(err, 'Export impossible.'), 'error'));

  if (!data) return <Loading />;
  const { summary } = data;
  const full = summary.capacity > 0 && summary.confirmed >= summary.capacity;

  return (
    <div className="space-y-4">
      <StatTiles
        items={[
          ['Confirmés', summary.capacity > 0 ? `${summary.confirmed}/${summary.capacity}` : summary.confirmed],
          ["Liste d'attente", summary.waitlisted],
          ['Places restantes', summary.remaining ?? '∞'],
          ['Présents', summary.present],
        ]}
      />
      <SeatsCard event={event} data={data} onEventChange={onEventChange} />
      <Card>
        <SectionTitle
          title={`Inscrits${data.items.length ? ` (${data.items.length})` : ''}`}
          action={
            <div className="flex items-center gap-2">
              <button onClick={exportCsv} className="px-3 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
          }
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
          <Pills options={STATUS_FILTERS} value={status} onChange={setStatus} />
          <div className="relative sm:ml-auto sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail, entreprise, badge" className={`${inputClass} pl-9`} />
          </div>
        </div>
        {data.items.length === 0 ? (
          <EmptyState icon={<Users className="w-10 h-10" />} text={status === 'all' && !q ? 'Aucun inscrit pour le moment.' : 'Aucun inscrit ne correspond.'} />
        ) : (
          <div className="divide-y divide-slate-100">
            {data.items.map((row) => (
              <div key={row.id} className={`py-3 flex flex-col md:flex-row md:items-center gap-3 ${row.status === 'cancelled' ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar src={row.member?.avatarUrl} name={row.fullName} className="w-9 h-9" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900 truncate">{row.fullName}</span>
                      <RegistrationBadge status={row.status} position={row.waitlistPosition} />
                      {row.checkedInAt && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <UserCheck className="w-3 h-3" /> Présent
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {row.email} · {row.companyRole}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Badge <span className="font-mono font-semibold text-slate-600">{row.badgeCode}</span> · inscrit le {formatDate(row.createdAt)}
                      {row.source === 'admin' && ' · ajouté par l’administration'}
                      {row.member ? ' · compte QIAO' : ' · sans compte'}
                      {row.cancelledAt && row.status === 'cancelled' && ` · annulé le ${formatDate(row.cancelledAt)}`}
                    </div>
                    {row.adminNote && <div className="text-[11px] text-amber-800 bg-amber-50 rounded-lg px-2 py-1 mt-1 inline-block">Note : {row.adminNote}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  {row.status === 'waitlisted' && (
                    <button
                      disabled={busyId === row.id}
                      onClick={() => setRegistrationStatus(row, 'confirmed', `Place confirmée pour ${row.fullName}.`)}
                      className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmer
                    </button>
                  )}
                  {row.status === 'confirmed' && (
                    <button
                      disabled={busyId === row.id}
                      onClick={() => checkIn(row, !row.checkedInAt)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 disabled:opacity-60 ${
                        row.checkedInAt ? 'border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-[#071329] hover:bg-slate-800 text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" /> {row.checkedInAt ? 'Retirer la présence' : 'Pointer présent'}
                    </button>
                  )}
                  <ActionMenu
                    items={[
                      row.status === 'cancelled' && {
                        label: 'Réinscrire',
                        icon: CheckCircle2,
                        onClick: () => setRegistrationStatus(row, full ? 'waitlisted' : 'confirmed', full ? "Réinscrit en liste d'attente (événement complet)." : 'Participant réinscrit.'),
                      },
                      row.status === 'confirmed' && {
                        label: "Passer en liste d'attente",
                        icon: Clock,
                        onClick: () => setRegistrationStatus(row, 'waitlisted', "Participant passé en liste d'attente : sa place est libérée."),
                      },
                      { label: row.adminNote ? 'Modifier la note interne' : 'Ajouter une note interne', icon: NotebookPen, onClick: () => setNoting(row) },
                      row.status !== 'cancelled' && {
                        label: "Annuler l'inscription",
                        icon: row.status === 'confirmed' ? UserX : Ban,
                        danger: true,
                        onClick: () =>
                          window.confirm(`Annuler l'inscription de ${row.fullName} ?${row.status === 'confirmed' ? ' Sa place sera libérée.' : ''} S'il a un compte QIAO, il sera notifié.`) &&
                          setRegistrationStatus(row, 'cancelled', 'Inscription annulée.'),
                      },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] text-slate-400">
          La liste d'attente suit l'ordre d'arrivée. Confirmer une place notifie le participant (s'il a un compte QIAO). Chaque action est enregistrée dans le journal d'audit.
        </p>
      </Card>
      {adding && <AddRegistrationModal eventId={event.id} full={full} onClose={() => setAdding(false)} onDone={load} />}
      {noting && <NoteModal registration={noting} onClose={() => setNoting(null)} onDone={load} />}
    </div>
  );
};
