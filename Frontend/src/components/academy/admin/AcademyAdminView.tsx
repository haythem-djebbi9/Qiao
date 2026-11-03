import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GraduationCap, Lock, Save, ScrollText, Search, UserMinus, UserPlus, Users } from 'lucide-react';
import { api } from '../../../lib/api';
import { AdminCourse, AdminPath, LearnerRow, Overview, SOURCE_LABELS, STATUS_LABELS } from '../../../lib/academy';
import { navigateDashboard } from '../../../lib/payments';
import { formatDate, timeAgo } from '../../../lib/text';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Avatar, Card, EmptyState, Loading, Pills, SectionTitle, errorMessage, inputClass } from '../../community/ui';
import { CoursePlayer } from '../CoursePlayer';
import { ProgressBar, StatusBadge } from '../ui';
import { CoursesAdmin, DomainsAdmin, PathsAdmin } from './CatalogAdmin';
import { CourseEditor } from './CourseEditor';
import { GrantAccessModal } from './CourseLearnersPanel';
import { OrdersAdmin } from './OrdersAdmin';

const SECTIONS = [
  { id: 'tableau', label: "Vue d'ensemble" },
  { id: 'formations', label: 'Formations' },
  { id: 'parcours', label: 'Parcours' },
  { id: 'domaines', label: 'Domaines' },
  { id: 'tarifs', label: 'Tarifs' },
  { id: 'apprenants', label: 'Apprenants' },
  { id: 'commandes', label: 'Commandes & paiements' },
  { id: 'journal', label: "Journal d'audit" },
];

/** Mon espace › Admin : QIAO Academy (route ?dv=admin-academy/<section>/<id>/<onglet>). */
export const AcademyAdminView: React.FC<{ route: string[] }> = ({ route }) => {
  const { user } = useAuth();
  const [section = 'tableau', id, sub] = route;
  if (user?.role !== 'admin') {
    return (
      <Card>
        <EmptyState icon={<Lock className="w-10 h-10" />} text="Espace réservé aux administrateurs QIAO." />
      </Card>
    );
  }
  if (section === 'apercu' && id) {
    return <CoursePlayer courseId={id} lessonId={sub} basePath="admin-academy/apercu" backTo={`admin-academy/formations/${id}/programme`} />;
  }
  const current = SECTIONS.some((s) => s.id === section) ? section : 'tableau';
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-red-600" /> Administration QIAO Academy
        </h2>
        <p className="text-xs text-slate-600">Formations, contenu pédagogique, parcours, tarifs et suivi des apprenants. Chaque modification est enregistrée dans le journal d'audit.</p>
      </div>
      <Pills options={SECTIONS} value={current} onChange={(next) => navigateDashboard(`admin-academy/${next}`)} />
      {current === 'tableau' && <OverviewSection />}
      {current === 'formations' && (id ? <CourseEditor courseId={id} tab={sub} /> : <CoursesAdmin />)}
      {current === 'parcours' && <PathsAdmin />}
      {current === 'domaines' && <DomainsAdmin />}
      {current === 'tarifs' && <PricesSection />}
      {current === 'apprenants' && <LearnersSection />}
      {current === 'commandes' && <OrdersAdmin />}
      {current === 'journal' && <AuditSection />}
    </div>
  );
};

// --- Vue d'ensemble -------------------------------------------------------------------------

const OverviewSection: React.FC = () => {
  const [data, setData] = useState<Overview | null>(null);
  useEffect(() => {
    api.get<Overview>('/academy/admin/overview').then(setData).catch(() => undefined);
  }, []);
  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Apprenants', data.learners],
          ['Inscriptions aux formations', data.enrollments],
          ['Formations terminées', data.completions],
          ['Progression moyenne', `${data.averageProgress} %`],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#071329] text-white rounded-2xl p-4">
            <div className="text-2xl font-black">{value}</div>
            <div className="text-[11px] text-slate-300 mt-1">{label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(
          [
            ['Formations', data.courses, 'formations', false],
            ['Parcours', data.paths, 'parcours', true],
            ['Domaines', data.domains, 'domaines', true],
          ] as const
        ).map(([label, counts, target, masculine]) => (
          <button
            key={label}
            onClick={() => navigateDashboard(`admin-academy/${target}`)}
            className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="text-2xl font-black text-slate-900">{counts.total}</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">{label}</div>
            <div className="flex flex-wrap gap-1.5">
              {(['published', 'draft', 'archived'] as const).map((status) => (
                <span key={status} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_LABELS[status].tone}`}>
                  {counts[status]} {(masculine ? STATUS_LABELS[status].masculine : STATUS_LABELS[status].label).toLowerCase()}
                  {counts[status] > 1 ? 's' : ''}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
      <Card>
        <p className="text-xs text-slate-600">
          {data.lessons} leçon(s) au total. La progression est calculée par le serveur : leçons visibles terminées ÷ leçons visibles de la formation ; un quiz n'est validé
          qu'avec le score minimal fixé.
        </p>
      </Card>
    </div>
  );
};

// --- Tarifs ---------------------------------------------------------------------------------

const PricesSection: React.FC = () => {
  const { notify } = useToast();
  const [courses, setCourses] = useState<AdminCourse[] | null>(null);
  const [paths, setPaths] = useState<AdminPath[]>([]);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.get<AdminCourse[]>('/academy/admin/courses', { status: 'all' }), api.get<AdminPath[]>('/academy/admin/paths')])
      .then(([c, p]) => {
        setCourses(c);
        setPaths(p);
        setDraft({});
      })
      .catch(() => setCourses([]));
  }, []);
  useEffect(() => load(), [load]);

  const rows = useMemo(
    () =>
      [
        ...paths.map((p) => ({ key: `path:${p.id}`, itemType: 'path' as const, id: p.id, title: p.title, status: p.status, price: p.price, kind: 'Parcours' })),
        ...(courses ?? []).map((c) => ({ key: `course:${c.id}`, itemType: 'course' as const, id: c.id, title: c.title, status: c.status, price: c.price, kind: 'Formation' })),
      ].filter((row) => !q.trim() || row.title.toLowerCase().includes(q.trim().toLowerCase())),
    [courses, paths, q],
  );
  const original = (itemType: string, itemId: string) =>
    itemType === 'course' ? courses?.find((c) => c.id === itemId)?.price : paths.find((p) => p.id === itemId)?.price;
  // Prix réellement modifiés (une saisie revenue à sa valeur d'origine n'est pas envoyée).
  const changes = Object.entries(draft)
    .map(([key, price]) => {
      const [itemType, ...rest] = key.split(':');
      return { itemType: itemType as 'course' | 'path', itemId: rest.join(':'), price };
    })
    .filter((change) => original(change.itemType, change.itemId) !== change.price);

  const save = async () => {
    if (changes.length === 0) return;
    setBusy(true);
    try {
      const { updated } = await api.patch<{ updated: number }>('/academy/admin/prices', { changes });
      notify(`${updated} prix mis à jour.`);
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!courses) return <Loading />;
  const pending = changes.length;
  return (
    <Card>
      <SectionTitle
        title="Tarifs des formations et parcours (TND)"
        action={
          <button
            onClick={save}
            disabled={busy || pending === 0}
            className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> Enregistrer {pending > 0 ? `(${pending})` : ''}
          </button>
        }
      />
      <div className="relative mb-3 sm:w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer" className={`${inputClass} pl-9`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Titre</th>
              <th className="py-2 pr-3">Statut</th>
              <th className="py-2 text-right">Prix (TND)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const value = draft[row.key] ?? row.price;
              const changed = value !== row.price;
              return (
                <tr key={row.key}>
                  <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{row.kind}</td>
                  <td className="py-2 pr-3 font-semibold text-slate-800">{row.title}</td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={row.status} masculine={row.itemType === 'path'} />
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={value}
                      onChange={(e) => setDraft({ ...draft, [row.key]: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                      aria-label={`Prix de ${row.title}`}
                      className={`w-24 rounded-lg border p-1.5 text-right text-xs font-bold ${changed ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-200 text-slate-900'}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">Chaque changement de prix est journalisé (ancien et nouveau prix). Les commandes passées conservent leur prix d'origine.</p>
    </Card>
  );
};

// --- Apprenants -------------------------------------------------------------------------------

const LearnersSection: React.FC = () => {
  const { notify } = useToast();
  const [q, setQ] = useState('');
  const [item, setItem] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState<{ items: LearnerRow[]; total: number } | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [paths, setPaths] = useState<AdminPath[]>([]);
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    api.get<AdminCourse[]>('/academy/admin/courses', { status: 'all' }).then(setCourses).catch(() => undefined);
    api.get<AdminPath[]>('/academy/admin/paths').then(setPaths).catch(() => undefined);
  }, []);

  const load = useCallback(() => {
    const [itemType, ...rest] = item.split(':');
    api
      .get<{ items: LearnerRow[]; total: number }>('/academy/admin/learners', {
        q: q.trim() || undefined,
        itemType: item ? itemType : undefined,
        itemId: item ? rest.join(':') : undefined,
        status: status || undefined,
        limit: 100,
      })
      .then(setData)
      .catch(() => setData({ items: [], total: 0 }));
  }, [q, item, status]);
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const revoke = async (row: LearnerRow) => {
    if (!window.confirm(`Retirer l'accès de ${row.user.fullName} à « ${row.title} » ?`)) return;
    try {
      await api.delete(`/academy/admin/enrollments/${row.id}`);
      notify('Accès retiré.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const [itemType, ...rest] = item.split(':');
  const selectedTitle = item ? (itemType === 'course' ? courses.find((c) => c.id === rest.join(':'))?.title : paths.find((p) => p.id === rest.join(':'))?.title) : undefined;

  return (
    <Card>
      <SectionTitle
        title={`Apprenants${data ? ` (${data.total} inscription${data.total > 1 ? 's' : ''})` : ''}`}
        action={
          item ? (
            <button onClick={() => setGranting(true)} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" /> Inscrire un membre
            </button>
          ) : undefined
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail ou formation" className={`${inputClass} pl-9`} />
        </div>
        <select value={item} onChange={(e) => setItem(e.target.value)} className={inputClass}>
          <option value="">Toutes les formations et parcours</option>
          <optgroup label="Parcours">
            {paths.map((p) => (
              <option key={p.id} value={`path:${p.id}`}>
                {p.title}
              </option>
            ))}
          </optgroup>
          <optgroup label="Formations">
            {courses.map((c) => (
              <option key={c.id} value={`course:${c.id}`}>
                {c.title}
              </option>
            ))}
          </optgroup>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          <option value="">Tous les statuts</option>
          <option value="active">En cours</option>
          <option value="completed">Terminées</option>
        </select>
      </div>
      {!data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<Users className="w-10 h-10" />} text="Aucune inscription." />
      ) : (
        <div className="divide-y divide-slate-100">
          {data.items.map((row) => (
            <div key={row.id} className="py-3 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-3 md:w-60 min-w-0">
                <Avatar src={row.user.avatarUrl} name={row.user.fullName} className="w-9 h-9" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{row.user.fullName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{row.user.email}</div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => row.itemType === 'course' && navigateDashboard(`admin-academy/formations/${row.itemId}/inscrits`)}
                  className={`text-xs font-semibold text-slate-800 text-left ${row.itemType === 'course' ? 'hover:text-red-600 cursor-pointer' : 'cursor-default'}`}
                >
                  <span className="text-[10px] font-bold uppercase text-red-600 mr-1">{row.itemType === 'path' ? 'Parcours' : 'Formation'}</span>
                  {row.title}
                </button>
                <div className="flex items-center gap-2 mt-1">
                  <ProgressBar value={row.progress} className="h-1.5" />
                  <span className="text-[11px] font-bold text-slate-900 w-9 text-right">{row.progress} %</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {SOURCE_LABELS[row.source]}
                  {row.viaPath && ` « ${row.viaPath} »`} · inscrit le {formatDate(row.createdAt)}
                  {row.lastActivityAt && ` · actif ${timeAgo(row.lastActivityAt, 'long')}`}
                  {row.status === 'completed' && <span className="text-emerald-700 font-semibold"> · terminé</span>}
                </div>
              </div>
              {row.source !== 'path' && (
                <button onClick={() => revoke(row)} title="Retirer l'accès" aria-label="Retirer l'accès" className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer self-end md:self-auto">
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {!item && <p className="mt-3 text-[11px] text-slate-400">Choisissez une formation ou un parcours pour inscrire un membre.</p>}
      {granting && item && (
        <GrantAccessModal
          itemType={itemType as 'course' | 'path'}
          itemId={rest.join(':')}
          title={selectedTitle ?? ''}
          onClose={() => setGranting(false)}
          onDone={load}
        />
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
  ['academy.', 'Toutes les actions'],
  ['academy.course', 'Formations'],
  ['academy.module', 'Modules'],
  ['academy.lesson', 'Leçons'],
  ['academy.path', 'Parcours'],
  ['academy.domain', 'Domaines'],
  ['academy.price', 'Prix'],
  ['academy.enrollment', 'Inscriptions'],
  ['academy.certificate', 'Certificats'],
  ['academy.order', 'Commandes'],
  ['academy.payment', 'Réglages de paiement'],
  ['academy.file', 'Fichiers'],
];

const AuditSection: React.FC = () => {
  const [action, setAction] = useState('academy.');
  const [data, setData] = useState<{ items: AuditRow[]; total: number } | null>(null);
  useEffect(() => {
    setData(null);
    api
      .get<{ items: AuditRow[]; total: number }>('/academy/admin/audit', { action, limit: 100 })
      .then(setData)
      .catch(() => setData({ items: [], total: 0 }));
  }, [action]);
  return (
    <Card>
      <SectionTitle title={`Journal d'audit QIAO Academy${data ? ` (${data.total})` : ''}`} />
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
