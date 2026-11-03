import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Compass, GraduationCap, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../../lib/api';
import { resolveImage } from '../../../lib/assets';
import { AdminCourse, AdminCourseDetail, AdminDomain, AdminPath, DOMAIN_ICONS, PublicationStatus } from '../../../lib/academy';
import { navigateDashboard } from '../../../lib/payments';
import { useToast } from '../../../context/ToastContext';
import { ActionMenu } from '../../community/PostCard';
import { Card, EmptyState, Field, Loading, Modal, ModalActions, Pills, SectionTitle, errorMessage, inputClass } from '../../community/ui';
import { ImageField, StatusActions, StatusBadge } from '../ui';
import { CourseForm } from './CourseForm';
import { SeoAssistant } from '../../seo/SeoAssistant';

const STATUS_FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'published', label: 'Publiées' },
  { id: 'draft', label: 'Brouillons' },
  { id: 'archived', label: 'Archivées' },
];

// --- Formations ------------------------------------------------------------------------------

export const CoursesAdmin: React.FC = () => {
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<AdminCourse[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      api
        .get<AdminCourse[]>('/academy/admin/courses', { status, q: q.trim() || undefined })
        .then(setItems)
        .catch(() => setItems([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [status, q]);

  const open = (course: { id: string }, tab = 'programme') => navigateDashboard(`admin-academy/formations/${course.id}/${tab}`);

  return (
    <Card>
      <SectionTitle
        title={`Formations${items ? ` (${items.length})` : ''}`}
        action={
          <button onClick={() => setCreating(true)} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nouvelle formation
          </button>
        }
      />
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <Pills options={STATUS_FILTERS} value={status} onChange={setStatus} />
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une formation" className={`${inputClass} pl-9`} />
        </div>
      </div>
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState icon={<GraduationCap className="w-10 h-10" />} text="Aucune formation." />
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((course) => (
            <div key={course.id} className={`py-3 flex flex-col md:flex-row md:items-center gap-3 ${course.status === 'archived' ? 'opacity-60' : ''}`}>
              <button onClick={() => open(course)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer group">
                <img src={resolveImage(course.image)} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-red-600 line-clamp-1">{course.title}</div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <StatusBadge status={course.status} />
                    <span className="text-[10px] text-slate-500">
                      {course.instructor} · {course.trainingDomainTitle ? `Domaine « ${course.trainingDomainTitle} »` : 'Catalogue Academy'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {course.stats.modules} module(s) · {course.stats.publishedLessons}/{course.stats.lessons} leçon(s) visibles · {course.stats.learners} inscrit(s)
                    {course.stats.learners > 0 && ` · progression moyenne ${course.stats.averageProgress} %`}
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-3 md:justify-end">
                <span className="text-sm font-black text-slate-900 whitespace-nowrap">{course.price} TND</span>
                <ActionMenu
                  items={[
                    { label: 'Programme (modules et leçons)', icon: BookOpen, onClick: () => open(course, 'programme') },
                    { label: 'Informations & prix', icon: Pencil, onClick: () => open(course, 'infos') },
                    { label: 'Inscrits & progression', icon: GraduationCap, onClick: () => open(course, 'inscrits') },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {creating && (
        <Modal title="Nouvelle formation" icon={<GraduationCap className="w-4 h-4" />} onClose={() => setCreating(false)} wide>
          <CourseForm course={null} onCancel={() => setCreating(false)} onSaved={(course: AdminCourseDetail) => open(course, 'programme')} />
        </Modal>
      )}
    </Card>
  );
};

// --- Parcours --------------------------------------------------------------------------------

const PathForm: React.FC<{ path: AdminPath | null; onClose: () => void; onSaved: () => void }> = ({ path, onClose, onSaved }) => {
  const { notify } = useToast();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: path?.title ?? '',
    description: path?.description ?? '',
    image: path?.image ?? '',
    price: path?.price ?? 0,
    duration: path?.duration ?? '',
    courseIds: path?.courseIds ?? [],
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  useEffect(() => {
    api.get<AdminCourse[]>('/academy/admin/courses', { status: 'all' }).then(setCourses).catch(() => undefined);
  }, []);

  const selected = form.courseIds.map((id) => courses.find((c) => c.id === id)).filter((c): c is AdminCourse => Boolean(c));
  const available = courses.filter((c) => !form.courseIds.includes(c.id) && c.status !== 'archived');
  const moveCourse = (index: number, delta: number) => {
    const ids = [...form.courseIds];
    const [id] = ids.splice(index, 1);
    ids.splice(index + delta, 0, id);
    set({ courseIds: ids });
  };
  const sumPrices = selected.reduce((sum, c) => sum + c.price, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, price: Number(form.price), image: form.image || null };
    try {
      if (path) await api.patch(`/academy/admin/paths/${path.id}`, payload);
      else await api.post('/academy/admin/paths', payload);
      notify(path ? 'Parcours enregistré.' : 'Parcours créé en brouillon.');
      onSaved();
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={path ? `Modifier « ${path.title} »` : 'Nouveau parcours'} icon={<Compass className="w-4 h-4" />} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Titre du parcours">
          <input required minLength={3} value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Description">
          <textarea required minLength={10} rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
        </Field>
        <SeoAssistant
          kind="path"
          fields={{
            Titre: form.title,
            Description: form.description,
            'Prix (TND)': String(form.price),
            Durée: form.duration,
            'Formations du parcours': selected.map((c) => c.title),
          }}
          onApply={{ title: (title) => set({ title: title.slice(0, 200) }), description: (description) => set({ description: description.slice(0, 5000) }) }}
        />
        <Field label="Image">
          <ImageField value={form.image} onChange={(image) => set({ image })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix forfaitaire (TND)" hint={sumPrices ? `Formations achetées séparément : ${sumPrices} TND` : undefined}>
            <input required type="number" min={0} value={form.price} onChange={(e) => set({ price: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Durée affichée">
            <input required maxLength={20} value={form.duration} onChange={(e) => set({ duration: e.target.value })} placeholder="24h" className={inputClass} />
          </Field>
        </div>
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-1">Formations du parcours, dans l'ordre</span>
          <p className="text-[11px] text-slate-400 mb-2">L'inscription au parcours donne accès à chacune de ces formations.</p>
          <div className="space-y-1.5">
            {selected.length === 0 && <p className="text-xs text-slate-400 italic">Aucune formation sélectionnée.</p>}
            {selected.map((course, index) => (
              <div key={course.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-[11px] font-bold flex items-center justify-center shrink-0">{index + 1}</span>
                <span className="flex-1 min-w-0 text-xs font-semibold text-slate-800 truncate">{course.title}</span>
                <StatusBadge status={course.status} />
                <button type="button" disabled={index === 0} onClick={() => moveCourse(index, -1)} aria-label="Monter" className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === selected.length - 1}
                  onClick={() => moveCourse(index, 1)}
                  aria-label="Descendre"
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => set({ courseIds: form.courseIds.filter((id) => id !== course.id) })} aria-label="Retirer" className="p-1 text-slate-400 hover:text-red-600 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <select
            value=""
            onChange={(e) => e.target.value && set({ courseIds: [...form.courseIds, e.target.value] })}
            className={`${inputClass} mt-2`}
          >
            <option value="">+ Ajouter une formation…</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} {c.status === 'draft' ? '(brouillon)' : ''}
              </option>
            ))}
          </select>
        </div>
        <ModalActions onCancel={onClose} submitLabel={path ? 'Enregistrer' : 'Créer le parcours'} busy={busy} />
      </form>
    </Modal>
  );
};

export const PathsAdmin: React.FC = () => {
  const { notify } = useToast();
  const [items, setItems] = useState<AdminPath[] | null>(null);
  const [editing, setEditing] = useState<AdminPath | 'new' | null>(null);
  const load = useCallback(() => {
    api.get<AdminPath[]>('/academy/admin/paths').then(setItems).catch(() => setItems([]));
  }, []);
  useEffect(() => load(), [load]);

  const setStatus = async (path: AdminPath, status: PublicationStatus) => {
    try {
      await api.post(`/academy/admin/paths/${path.id}/status`, { status });
      notify('Parcours mis à jour.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };
  const remove = async (path: AdminPath) => {
    if (!window.confirm(`Supprimer définitivement « ${path.title} » ?`)) return;
    try {
      await api.delete(`/academy/admin/paths/${path.id}`);
      notify('Parcours supprimé.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  if (!items) return <Loading />;
  return (
    <Card>
      <SectionTitle
        title={`Parcours (${items.length})`}
        action={
          <button onClick={() => setEditing('new')} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nouveau parcours
          </button>
        }
      />
      <div className="divide-y divide-slate-100">
        {items.map((path) => (
          <div key={path.id} className={`py-3 flex flex-col md:flex-row md:items-center gap-3 ${path.status === 'archived' ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img src={resolveImage(path.image)} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 line-clamp-1">{path.title}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <StatusBadge status={path.status} masculine />
                  <span className="text-[10px] text-slate-500">
                    {path.courses.length ? `${path.courses.length} formation(s) rattachée(s)` : `${path.coursesCount} formations annoncées, aucune rattachée`} · {path.duration} ·{' '}
                    {path.stats.learners} inscrit(s)
                  </span>
                </div>
                {path.courses.length > 0 && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{path.courses.map((c) => c.title).join(' → ')}</div>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <span className="text-sm font-black text-red-600 whitespace-nowrap">{path.price} TND</span>
              <StatusActions status={path.status} onChange={(s) => setStatus(path, s)} noun="le parcours" />
              <ActionMenu
                items={[
                  { label: 'Modifier', icon: Pencil, onClick: () => setEditing(path) },
                  path.stats.learners === 0 && { label: 'Supprimer', icon: Trash2, onClick: () => remove(path), danger: true },
                ]}
              />
            </div>
          </div>
        ))}
      </div>
      {editing && <PathForm path={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={load} />}
    </Card>
  );
};

// --- Domaines ----------------------------------------------------------------------------------

const DomainForm: React.FC<{ domain: AdminDomain | null; onClose: () => void; onSaved: () => void }> = ({ domain, onClose, onSaved }) => {
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: domain?.title ?? '',
    description: domain?.description ?? '',
    iconName: domain?.iconName ?? 'Briefcase',
    featuredCourse: domain?.featuredCourse ?? '',
    duration: domain?.duration ?? '',
    accentColor: domain?.accentColor ?? 'red',
    coursesCount: domain?.coursesCount ?? 0,
    sortOrder: domain?.sortOrder ?? 0,
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, coursesCount: Number(form.coursesCount), sortOrder: Number(form.sortOrder) };
      if (domain) await api.patch(`/academy/admin/domains/${domain.id}`, payload);
      else await api.post('/academy/admin/domains', { ...payload, sortOrder: undefined });
      notify(domain ? 'Domaine enregistré.' : 'Domaine créé en brouillon.');
      onSaved();
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={domain ? `Modifier « ${domain.title} »` : 'Nouveau domaine de formation'} icon={<Compass className="w-4 h-4" />} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Titre du domaine">
          <input required minLength={3} maxLength={160} value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Description">
          <textarea required minLength={10} rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Formation phare (texte affiché)">
            <input required minLength={3} value={form.featuredCourse} onChange={(e) => set({ featuredCourse: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Volume affiché">
            <input required maxLength={40} value={form.duration} onChange={(e) => set({ duration: e.target.value })} placeholder="18h de formation" className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Icône">
            <select value={form.iconName} onChange={(e) => set({ iconName: e.target.value })} className={inputClass}>
              {DOMAIN_ICONS.map((icon) => (
                <option key={icon}>{icon}</option>
              ))}
            </select>
          </Field>
          <Field label="Couleur">
            <select value={form.accentColor} onChange={(e) => set({ accentColor: e.target.value as 'red' | 'blue' })} className={inputClass}>
              <option value="red">Rouge</option>
              <option value="blue">Bleu</option>
            </select>
          </Field>
          <Field label="Formations annoncées" hint={domain ? `${domain.linkedCourses} rattachée(s)` : undefined}>
            <input type="number" min={0} value={form.coursesCount} onChange={(e) => set({ coursesCount: Number(e.target.value) })} className={inputClass} />
          </Field>
          {domain && (
            <Field label="Ordre">
              <input type="number" min={0} value={form.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} className={inputClass} />
            </Field>
          )}
        </div>
        <ModalActions onCancel={onClose} submitLabel={domain ? 'Enregistrer' : 'Créer le domaine'} busy={busy} />
      </form>
    </Modal>
  );
};

export const DomainsAdmin: React.FC = () => {
  const { notify } = useToast();
  const [items, setItems] = useState<AdminDomain[] | null>(null);
  const [editing, setEditing] = useState<AdminDomain | 'new' | null>(null);
  const load = useCallback(() => {
    api.get<AdminDomain[]>('/academy/admin/domains').then(setItems).catch(() => setItems([]));
  }, []);
  useEffect(() => load(), [load]);

  const setStatus = async (domain: AdminDomain, status: PublicationStatus) => {
    try {
      await api.post(`/academy/admin/domains/${domain.id}/status`, { status });
      notify('Domaine mis à jour.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };
  const remove = async (domain: AdminDomain) => {
    if (!window.confirm(`Supprimer définitivement « ${domain.title} » ?`)) return;
    try {
      await api.delete(`/academy/admin/domains/${domain.id}`);
      notify('Domaine supprimé.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  if (!items) return <Loading />;
  return (
    <Card>
      <SectionTitle
        title={`Domaines de formation de l'accueil (${items.length})`}
        action={
          <button onClick={() => setEditing('new')} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nouveau domaine
          </button>
        }
      />
      <p className="text-[11px] text-slate-500 -mt-2 mb-3">Cartes de la section « QIAO Academy » de l'accueil ; chaque domaine ouvre la liste de ses formations publiées.</p>
      <div className="divide-y divide-slate-100">
        {items.map((domain) => (
          <div key={domain.id} className={`py-3 flex flex-col md:flex-row md:items-center gap-3 ${domain.status === 'archived' ? 'opacity-60' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${domain.accentColor === 'red' ? 'bg-red-600' : 'bg-blue-600'}`} />
                <span className="text-sm font-bold text-slate-900">{domain.title}</span>
                <StatusBadge status={domain.status} masculine />
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {domain.publishedCourses}/{domain.linkedCourses} formation(s) rattachée(s) publiée(s) · {domain.coursesCount} annoncée(s) · {domain.duration}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <StatusActions status={domain.status} onChange={(s) => setStatus(domain, s)} noun="le domaine" />
              <ActionMenu
                items={[
                  { label: 'Modifier', icon: Pencil, onClick: () => setEditing(domain) },
                  domain.linkedCourses === 0 && { label: 'Supprimer', icon: Trash2, onClick: () => remove(domain), danger: true },
                ]}
              />
            </div>
          </div>
        ))}
      </div>
      {editing && <DomainForm domain={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={load} />}
    </Card>
  );
};
