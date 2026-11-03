import React, { useCallback, useEffect, useState } from 'react';
import { Archive, BadgeCheck, BarChart3, Lock, Pencil, Plus, RotateCcw, ScrollText, Search, ShieldCheck, Tags, Trash2, UserCog, Users, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Category, CommunitySummary, LANGUAGE_LABELS, POLICY_LABELS, Paged, VISIBILITY_LABELS, navigateCommunity } from '../../lib/community';
import { formatDate, timeAgo } from '../../lib/text';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ActionMenu } from './PostCard';
import {
  Avatar,
  COMMUNITY_ICON_NAMES,
  Card,
  CommunityIcon,
  EmptyState,
  Field,
  Loading,
  Modal,
  ModalActions,
  MultiSelect,
  Pills,
  SectionTitle,
  VisibilityBadge,
  errorMessage,
  inputClass,
  resetCategoriesCache,
} from './ui';

const SECTIONS = [
  { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
  { id: 'communautes', label: 'Communautés', icon: Users },
  { id: 'categories', label: 'Catégories', icon: Tags },
  { id: 'membres', label: 'Membres', icon: UserCog },
  { id: 'verifications', label: 'Vérifications', icon: BadgeCheck },
  { id: 'audit', label: "Journal d'audit", icon: ScrollText },
];

/** Administration de QIAO Community (toutes les actions sont autorisées et journalisées côté serveur). */
export const AdminPanel: React.FC<{ section?: string }> = ({ section = 'statistiques' }) => {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return (
      <Card>
        <EmptyState icon={<Lock className="w-10 h-10" />} text="Espace réservé aux administrateurs QIAO." />
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-red-600" /> Administration QIAO Community
        </h2>
        <p className="text-xs text-slate-600">Les actions sensibles (rôles, suspensions, vérifications, configuration) sont enregistrées dans le journal d'audit.</p>
      </div>
      <Pills options={SECTIONS.map(({ id, label }) => ({ id, label }))} value={section} onChange={(id) => navigateCommunity(`admin/${id}`, { replace: true })} />
      {section === 'statistiques' && <AnalyticsSection />}
      {section === 'communautes' && <CommunitiesSection />}
      {section === 'categories' && <CategoriesSection />}
      {section === 'membres' && <MembersSection />}
      {section === 'verifications' && <VerificationsSection />}
      {section === 'audit' && <AuditSection />}
    </div>
  );
};

// --- Statistiques --------------------------------------------------------------------------

type Analytics = Record<string, number | string | null>;

const METRICS: { key: string; label: string; suffix?: string; hint?: string }[] = [
  { key: 'communityVisitors', label: 'Membres ayant visité Community', hint: 'visitorRate' },
  { key: 'monthlyActiveMembers', label: 'Membres actifs (30 j)' },
  { key: 'retentionRate', label: 'Rétention (mois précédent)', suffix: ' %' },
  { key: 'newMemberships', label: 'Nouvelles adhésions' },
  { key: 'posts', label: 'Publications' },
  { key: 'questions', label: 'Questions' },
  { key: 'comments', label: 'Commentaires' },
  { key: 'questionsAnsweredRate', label: 'Questions avec au moins une réponse', suffix: ' %' },
  { key: 'medianFirstResponseMinutes', label: 'Délai médian de 1re réponse', suffix: ' min' },
  { key: 'activeCommunities', label: 'Communautés actives' },
  { key: 'expertProfileViews', label: 'Consultations de profils experts' },
  { key: 'contactInitiations', label: 'Prises de contact privées' },
  { key: 'reportsSubmitted', label: 'Signalements reçus' },
  { key: 'reportsResolved', label: 'Signalements traités' },
  { key: 'authFailures', label: "Échecs d'authentification" },
  { key: 'linkErrors', label: 'Erreurs de liaison de compte' },
];

const AnalyticsSection: React.FC = () => {
  const [data, setData] = useState<Analytics | null>(null);
  useEffect(() => {
    api.get<Analytics>('/community/admin/analytics').then(setData).catch(() => setData({}));
  }, []);
  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Comptes QIAO', data.totalUsers],
          ['Communautés actives', data.communities],
          ['Experts listés', data.experts],
          ['Experts vérifiés', data.verifiedExperts],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-[#071329] text-white rounded-2xl p-4">
            <div className="text-2xl font-black">{value ?? '—'}</div>
            <div className="text-[11px] text-slate-300 mt-1">{label}</div>
          </div>
        ))}
      </div>
      <Card>
        <SectionTitle title={`Indicateurs — ${data.period ?? '30 derniers jours'}`} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {METRICS.map((metric) => (
            <div key={metric.key} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-lg font-black text-slate-900">
                {data[metric.key] === null || data[metric.key] === undefined ? '—' : `${data[metric.key]}${metric.suffix ?? ''}`}
              </div>
              <div className="text-[11px] text-slate-500 leading-snug">{metric.label}</div>
              {metric.hint && data[metric.hint] !== undefined && <div className="text-[10px] text-slate-400">{data[metric.hint]} % des comptes</div>}
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-slate-400">
          Définitions stables : une question reste une seule question quel que soit son nombre de réponses ; aucune donnée de messagerie privée n'est utilisée ;
          les interactions Community ne sont jamais comptées comme des ventes.
        </p>
      </Card>
    </div>
  );
};

// --- Communautés ----------------------------------------------------------------------------

interface AdminCommunity extends CommunitySummary {
  rules: string | null;
  moderators: { membershipId: string; id: string; fullName: string; handle: string | null }[];
}

interface AdminMember {
  id: string;
  fullName: string;
  handle: string | null;
  email: string;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  suspendedUntil: string | null;
  suspensionReason: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  expert: { headline: string; verificationStatus: string; categories: string[] } | null;
  moderates: string[];
}

const CommunitiesSection: React.FC = () => {
  const { notify } = useToast();
  const [items, setItems] = useState<AdminCommunity[] | null>(null);
  const [editing, setEditing] = useState<AdminCommunity | 'new' | null>(null);
  const [moderatorFor, setModeratorFor] = useState<AdminCommunity | null>(null);

  const load = useCallback(() => {
    api.get<AdminCommunity[]>('/community/admin/communities').then(setItems).catch(() => setItems([]));
  }, []);
  useEffect(() => load(), [load]);

  const act = async (community: AdminCommunity, action: 'archive' | 'restore' | 'delete') => {
    if (action === 'delete' && !window.confirm(`Supprimer définitivement « ${community.name} » ? (possible uniquement sans publication)`)) return;
    try {
      if (action === 'delete') await api.delete(`/community/admin/communities/${community.id}`);
      else await api.post(`/community/admin/communities/${community.id}/${action}`);
      notify('Communauté mise à jour.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const removeModerator = async (community: AdminCommunity, userId: string) => {
    try {
      setItems(await api.delete<AdminCommunity[]>(`/community/admin/communities/${community.id}/moderators/${userId}`));
      notify('Modérateur retiré.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  if (!items) return <Loading />;
  return (
    <Card>
      <SectionTitle
        title={`Communautés (${items.length})`}
        action={
          <button onClick={() => setEditing('new')} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nouvelle communauté
          </button>
        }
      />
      <div className="divide-y divide-slate-100">
        {items.map((community) => (
          <div key={community.id} className={`py-4 flex flex-col md:flex-row md:items-center gap-3 ${community.status === 'archived' ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <CommunityIcon name={community.icon} className="w-5 h-5 text-slate-700" />
              </div>
              <div className="min-w-0">
                <button onClick={() => navigateCommunity(`c/${community.slug}`)} className="text-sm font-bold text-slate-900 hover:text-red-600 cursor-pointer text-left">
                  {community.name}
                </button>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <VisibilityBadge visibility={community.visibility} />
                  <span className="text-[10px] text-slate-500">{POLICY_LABELS[community.membershipPolicy]}</span>
                  <span className="text-[10px] text-slate-500">· {community.membersCount} membres · {community.postsCount} discussions</span>
                  {community.status === 'archived' && <span className="text-[10px] font-bold text-slate-600">· Archivée</span>}
                  {community.featured && <span className="text-[10px] font-bold text-red-600">· À la une</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-400">Modérateurs :</span>
                  {community.moderators.length === 0 && <span className="text-[10px] text-slate-400">aucun</span>}
                  {community.moderators.map((m) => (
                    <span key={m.id} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold inline-flex items-center gap-1">
                      {m.fullName}
                      <button onClick={() => removeModerator(community, m.id)} aria-label={`Retirer ${m.fullName}`} className="cursor-pointer hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button onClick={() => setModeratorFor(community)} className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer">
                    + Ajouter
                  </button>
                </div>
              </div>
            </div>
            <ActionMenu
              items={[
                { label: 'Modifier', icon: Pencil, onClick: () => setEditing(community) },
                community.status === 'active' ? { label: 'Archiver', icon: Archive, onClick: () => act(community, 'archive') } : { label: 'Restaurer', icon: RotateCcw, onClick: () => act(community, 'restore') },
                { label: 'Supprimer', icon: Trash2, onClick: () => act(community, 'delete'), danger: true },
              ]}
            />
          </div>
        ))}
      </div>
      {editing && <CommunityForm community={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={load} />}
      {moderatorFor && <ModeratorPicker community={moderatorFor} onClose={() => setModeratorFor(null)} onSaved={setItems} />}
    </Card>
  );
};

const CommunityForm: React.FC<{ community: AdminCommunity | null; onClose: () => void; onSaved: () => void }> = ({ community, onClose, onSaved }) => {
  const { notify } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: community?.name ?? '',
    slug: community?.slug ?? '',
    description: community?.description ?? '',
    rules: community?.rules ?? '',
    categoryId: community?.category?.id ?? '',
    coverImage: community?.coverImage ?? '',
    icon: community?.icon ?? 'Users',
    languages: community?.languages ?? ['fr'],
    scope: community?.scope ?? '',
    visibility: community?.visibility ?? 'public',
    membershipPolicy: community?.membershipPolicy ?? 'open',
    featured: community?.featured ?? false,
  });
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  useEffect(() => {
    api.get<{ communityCategories: Category[] }>('/community/admin/categories').then((c) => setCategories(c.communityCategories)).catch(() => undefined);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, slug: form.slug || undefined, categoryId: form.categoryId || undefined, coverImage: form.coverImage || undefined, rules: form.rules || undefined, scope: form.scope || undefined };
    try {
      if (community) await api.patch(`/community/admin/communities/${community.id}`, payload);
      else await api.post('/community/admin/communities', payload);
      notify(community ? 'Communauté modifiée.' : 'Communauté créée.');
      onSaved();
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={community ? `Modifier « ${community.name} »` : 'Nouvelle communauté'} icon={<Users className="w-4 h-4" />} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nom">
            <input required minLength={3} value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Adresse (slug)" hint="Générée depuis le nom si vide.">
            <input value={form.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} className={inputClass} />
          </Field>
        </div>
        <Field label="Description">
          <textarea required minLength={10} rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Règles">
          <textarea rows={3} value={form.rules} onChange={(e) => set({ rules: e.target.value })} className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Catégorie">
            <select value={form.categoryId} onChange={(e) => set({ categoryId: e.target.value })} className={inputClass}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.active === false ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Icône">
            <select value={form.icon} onChange={(e) => set({ icon: e.target.value })} className={inputClass}>
              {COMMUNITY_ICON_NAMES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          <Field label="Visibilité" hint={VISIBILITY_LABELS[form.visibility].hint}>
            <select
              value={form.visibility}
              onChange={(e) => {
                const visibility = e.target.value as typeof form.visibility;
                set({ visibility, membershipPolicy: visibility === 'private' ? 'invite' : form.membershipPolicy });
              }}
              className={inputClass}
            >
              <option value="public">Publique — découvrable, contenu visible par tous</option>
              <option value="restricted">Restreinte — découvrable, contenu réservé aux membres</option>
              <option value="private">Privée — invisible, sur invitation</option>
            </select>
          </Field>
          <Field label="Adhésion">
            <select
              value={form.membershipPolicy}
              onChange={(e) => set({ membershipPolicy: e.target.value as typeof form.membershipPolicy })}
              disabled={form.visibility === 'private'}
              className={inputClass}
            >
              <option value="open">Libre</option>
              <option value="approval">Sur validation d'un modérateur</option>
              <option value="invite">Sur invitation</option>
            </select>
          </Field>
        </div>
        <Field label="Langues">
          <MultiSelect
            options={Object.entries(LANGUAGE_LABELS)
              .filter(([code]) => code !== 'other')
              .map(([id, label]) => ({ id, label }))}
            value={form.languages}
            onChange={(languages) => set({ languages })}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Périmètre (pays, métier...)">
            <input value={form.scope} onChange={(e) => set({ scope: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Image de couverture (https://)">
            <input value={form.coverImage} onChange={(e) => set({ coverImage: e.target.value })} className={inputClass} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} className="accent-red-600" /> Mettre à la une (sélection éditoriale, non sponsorisée)
        </label>
        <ModalActions onCancel={onClose} submitLabel={community ? 'Enregistrer' : 'Créer la communauté'} busy={busy} />
      </form>
    </Modal>
  );
};

const ModeratorPicker: React.FC<{ community: AdminCommunity; onClose: () => void; onSaved: (items: AdminCommunity[]) => void }> = ({ community, onClose, onSaved }) => {
  const { notify } = useToast();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AdminMember[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (q.trim().length < 2) return setResults([]);
      api.get<Paged<AdminMember>>('/community/admin/members', { q, status: 'active', limit: 8 }).then((page) => setResults(page.items)).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);
  const assign = async (member: AdminMember) => {
    try {
      onSaved(await api.post<AdminCommunity[]>(`/community/admin/communities/${community.id}/moderators`, { userId: member.id }));
      notify(`${member.fullName} modère désormais « ${community.name} ».`);
      onClose();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };
  return (
    <Modal title={`Ajouter un modérateur — ${community.name}`} icon={<ShieldCheck className="w-4 h-4" />} onClose={onClose}>
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail ou @identifiant" className={inputClass} />
      <div className="mt-3 divide-y divide-slate-100">
        {results.map((member) => (
          <button key={member.id} onClick={() => assign(member)} className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 rounded-lg px-2 cursor-pointer">
            <Avatar src={member.avatarUrl} name={member.fullName} className="w-8 h-8" />
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-slate-900">{member.fullName}</span>
              <span className="block text-[10px] text-slate-500 truncate">
                @{member.handle} · {member.email}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
};

// --- Catégories ---------------------------------------------------------------------------------

const CategoriesSection: React.FC = () => {
  const { notify } = useToast();
  const [data, setData] = useState<{ communityCategories: Category[]; professionalCategories: Category[] } | null>(null);
  const load = useCallback(() => {
    api.get<{ communityCategories: Category[]; professionalCategories: Category[] }>('/community/admin/categories').then(setData).catch(() => undefined);
  }, []);
  useEffect(() => load(), [load]);

  const save = async (kind: 'community' | 'professional', category: Category) => {
    try {
      setData(await api.put(`/community/admin/categories/${kind}`, category));
      resetCategoriesCache();
      notify('Catégorie enregistrée.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };
  const remove = async (kind: 'community' | 'professional', category: Category) => {
    if (!window.confirm(`Supprimer « ${category.name} » ? (désactivée si elle est déjà utilisée)`)) return;
    try {
      setData(await api.delete(`/community/admin/categories/${kind}/${category.id}`));
      resetCategoriesCache();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  if (!data) return <Loading />;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <CategoryList title="Catégories de communautés" items={data.communityCategories} onSave={(c) => save('community', c)} onRemove={(c) => remove('community', c)} />
      <CategoryList title="Catégories professionnelles (questions, experts)" items={data.professionalCategories} onSave={(c) => save('professional', c)} onRemove={(c) => remove('professional', c)} />
    </div>
  );
};

const CategoryList: React.FC<{ title: string; items: Category[]; onSave: (c: Category) => void; onRemove: (c: Category) => void }> = ({ title, items, onSave, onRemove }) => {
  const [draft, setDraft] = useState({ id: '', name: '' });
  const [edit, setEdit] = useState<Category | null>(null);
  return (
    <Card>
      <SectionTitle title={title} />
      <div className="divide-y divide-slate-100 mb-4">
        {items.map((category) =>
          edit?.id === category.id ? (
            <form
              key={category.id}
              onSubmit={(e) => {
                e.preventDefault();
                onSave(edit);
                setEdit(null);
              }}
              className="py-2 flex items-center gap-2"
            >
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={inputClass} />
              <label className="text-[11px] text-slate-600 inline-flex items-center gap-1 whitespace-nowrap">
                <input type="checkbox" checked={edit.active !== false} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} className="accent-red-600" /> Active
              </label>
              <button className="px-3 py-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold cursor-pointer">OK</button>
            </form>
          ) : (
            <div key={category.id} className={`py-2 flex items-center gap-2 text-xs ${category.active === false ? 'opacity-50' : ''}`}>
              <span className="flex-1 font-semibold text-slate-800">{category.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">{category.id}</span>
              <button onClick={() => setEdit(category)} aria-label="Modifier" className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onRemove(category)} aria-label="Supprimer" className="p-1 text-slate-400 hover:text-red-600 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ),
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...draft, active: true });
          setDraft({ id: '', name: '' });
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input required value={draft.name} onChange={(e) => setDraft({ name: e.target.value, id: draft.id || '' })} placeholder="Nom" className={inputClass} />
        <input
          required
          pattern="[a-z0-9][a-z0-9-]{1,38}"
          value={draft.id}
          onChange={(e) => setDraft({ ...draft, id: e.target.value.toLowerCase() })}
          placeholder="identifiant (ex: tourisme)"
          className={inputClass}
        />
        <button className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </form>
    </Card>
  );
};

// --- Membres ---------------------------------------------------------------------------------------

const MembersSection: React.FC = () => {
  const { notify } = useToast();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [data, setData] = useState<Paged<AdminMember> | null>(null);
  const [suspending, setSuspending] = useState<AdminMember | null>(null);

  const load = useCallback(() => {
    api
      .get<Paged<AdminMember>>('/community/admin/members', { q: q || undefined, status: status || undefined, role: role || undefined, limit: 30 })
      .then(setData)
      .catch(() => setData({ items: [], total: 0 }));
  }, [q, status, role]);
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const setMemberRole = async (member: AdminMember, next: 'user' | 'admin') => {
    if (!window.confirm(next === 'admin' ? `Donner le rôle administrateur à ${member.fullName} ?` : `Retirer le rôle administrateur à ${member.fullName} ?`)) return;
    try {
      await api.patch(`/community/admin/members/${member.id}/role`, { role: next });
      notify('Rôle modifié.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const reactivate = async (member: AdminMember) => {
    try {
      await api.patch(`/community/admin/members/${member.id}/status`, { status: 'active' });
      notify('Compte réactivé.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <Card>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-4">
        <div className="relative sm:col-span-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail, @identifiant" className={`${inputClass} pl-9`} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} sm:col-span-3`}>
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputClass} sm:col-span-3`}>
          <option value="">Tous les rôles</option>
          <option value="user">Membres</option>
          <option value="admin">Administrateurs</option>
        </select>
      </div>
      {!data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <EmptyState text="Aucun membre trouvé." />
      ) : (
        <div className="divide-y divide-slate-100">
          {data.items.map((member) => (
            <div key={member.id} className="py-3 flex items-center gap-3">
              <Avatar src={member.avatarUrl} name={member.fullName} className="w-10 h-10 border border-slate-200" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button onClick={() => member.handle && navigateCommunity(`member/${member.handle}`)} className="text-sm font-bold text-slate-900 hover:text-red-600 cursor-pointer">
                    {member.fullName}
                  </button>
                  {member.role === 'admin' && <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">Admin</span>}
                  {member.status === 'suspended' && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">Suspendu</span>}
                  {member.expert && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">Expert · {member.expert.verificationStatus}</span>}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {member.email} · @{member.handle} · inscrit le {formatDate(member.createdAt)}
                  {member.lastLoginAt ? ` · dernière connexion ${timeAgo(member.lastLoginAt, 'long').toLowerCase()}` : ''}
                </p>
                {member.moderates.length > 0 && <p className="text-[10px] text-emerald-700">Modère : {member.moderates.join(', ')}</p>}
                {member.status === 'suspended' && (
                  <p className="text-[10px] text-red-600">
                    {member.suspendedUntil ? `Jusqu'au ${formatDate(member.suspendedUntil)}` : 'Durée indéterminée'}
                    {member.suspensionReason ? ` — ${member.suspensionReason}` : ''}
                  </p>
                )}
              </div>
              {member.id !== user?.id && (
                <ActionMenu
                  items={[
                    member.status === 'active'
                      ? { label: 'Suspendre le compte', icon: Lock, onClick: () => setSuspending(member), danger: true }
                      : { label: 'Réactiver le compte', icon: RotateCcw, onClick: () => reactivate(member) },
                    member.role === 'user'
                      ? { label: 'Nommer administrateur', icon: ShieldCheck, onClick: () => setMemberRole(member, 'admin') }
                      : { label: 'Retirer le rôle administrateur', icon: UserCog, onClick: () => setMemberRole(member, 'user') },
                  ]}
                />
              )}
            </div>
          ))}
        </div>
      )}
      {suspending && <SuspendModal member={suspending} onClose={() => setSuspending(null)} onDone={load} />}
    </Card>
  );
};

const SuspendModal: React.FC<{ member: AdminMember; onClose: () => void; onDone: () => void }> = ({ member, onClose, onDone }) => {
  const { notify } = useToast();
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={`Suspendre ${member.fullName}`} icon={<Lock className="w-4 h-4" />} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api.patch(`/community/admin/members/${member.id}/status`, { status: 'suspended', days, reason: reason || undefined });
            notify('Compte suspendu : toutes ses sessions ont été fermées.');
            onDone();
            onClose();
          } catch (err) {
            notify(errorMessage(err), 'error');
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-3"
      >
        <Field label="Durée (jours)">
          <input type="number" min={1} max={365} value={days} onChange={(e) => setDays(Number(e.target.value))} className={inputClass} />
        </Field>
        <Field label="Motif communiqué au membre">
          <textarea rows={3} required value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
        </Field>
        <ModalActions onCancel={onClose} submitLabel="Suspendre" busy={busy} danger />
      </form>
    </Modal>
  );
};

// --- Vérifications -----------------------------------------------------------------------------------

interface VerificationRow {
  userId: string;
  fullName: string;
  handle: string | null;
  email: string;
  avatarUrl: string | null;
  headline: string;
  categories: string[];
  evidence: string | null;
  status: string;
  note: string | null;
  requestedAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
}

const VerificationsSection: React.FC = () => {
  const { notify } = useToast();
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState<VerificationRow[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const load = useCallback(() => {
    api.get<VerificationRow[]>('/community/admin/verifications', { status }).then(setRows).catch(() => setRows([]));
  }, [status]);
  useEffect(() => load(), [load]);

  const decide = async (row: VerificationRow, decision: 'verified' | 'rejected' | 'none') => {
    try {
      await api.post(`/community/admin/verifications/${row.userId}`, { decision, note: notes[row.userId] || undefined });
      notify(decision === 'verified' ? `${row.fullName} est vérifié(e).` : 'Décision enregistrée.');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <Card>
      <Pills
        options={[
          { id: 'pending', label: 'En attente' },
          { id: 'verified', label: 'Vérifiés' },
          { id: 'rejected', label: 'Refusés' },
          { id: 'none', label: 'Déclaratifs' },
        ]}
        value={status}
        onChange={setStatus}
      />
      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={<BadgeCheck className="w-10 h-10" />} text="Aucun profil dans cette liste." />
      ) : (
        <div className="divide-y divide-slate-100 mt-3">
          {rows.map((row) => (
            <div key={row.userId} className="py-4 space-y-2">
              <div className="flex items-center gap-3">
                <Avatar src={row.avatarUrl} name={row.fullName} className="w-10 h-10 border border-slate-200" />
                <div className="flex-1 min-w-0">
                  <button onClick={() => row.handle && navigateCommunity(`member/${row.handle}`)} className="text-sm font-bold text-slate-900 hover:text-red-600 cursor-pointer">
                    {row.fullName}
                  </button>
                  <p className="text-[11px] text-slate-500">
                    {row.headline} · {row.categories.join(', ')}
                  </p>
                </div>
                {row.requestedAt && <span className="text-[10px] text-slate-400">Demande du {formatDate(row.requestedAt)}</span>}
              </div>
              {row.evidence && <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 whitespace-pre-line">{row.evidence}</p>}
              {row.decidedBy && (
                <p className="text-[11px] text-slate-500">
                  Décision de {row.decidedBy}
                  {row.decidedAt ? ` le ${formatDate(row.decidedAt)}` : ''}
                  {row.note ? ` — ${row.note}` : ''}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={notes[row.userId] ?? ''}
                  onChange={(e) => setNotes({ ...notes, [row.userId]: e.target.value })}
                  placeholder="Note de décision (communiquée au membre)"
                  className={inputClass}
                />
                <div className="flex gap-2 shrink-0">
                  {row.status !== 'verified' && (
                    <button onClick={() => decide(row, 'verified')} className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">
                      Vérifier
                    </button>
                  )}
                  {row.status !== 'rejected' && (
                    <button onClick={() => decide(row, row.status === 'verified' ? 'none' : 'rejected')} className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer">
                      {row.status === 'verified' ? 'Retirer la vérification' : 'Refuser'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// --- Journal d'audit -------------------------------------------------------------------------------------

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

const AuditSection: React.FC = () => {
  const [action, setAction] = useState('');
  const [data, setData] = useState<{ items: AuditRow[]; total: number } | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      api.get<{ items: AuditRow[]; total: number }>('/community/admin/audit', { action: action || undefined, limit: 50 }).then(setData).catch(() => setData({ items: [], total: 0 }));
    }, 250);
    return () => clearTimeout(timer);
  }, [action]);
  return (
    <Card>
      <SectionTitle title={`Journal d'audit${data ? ` (${data.total})` : ''}`} />
      <select value={action} onChange={(e) => setAction(e.target.value)} className={`${inputClass} mb-4 max-w-xs`}>
        <option value="">Toutes les actions</option>
        <option value="community">Communautés</option>
        <option value="membership">Adhésions</option>
        <option value="content">Contenus</option>
        <option value="report">Signalements</option>
        <option value="member">Comptes</option>
        <option value="role">Rôles</option>
        <option value="expert">Vérifications d'experts</option>
        <option value="category">Catégories</option>
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
                  <td className="py-2 pr-3 text-slate-700">
                    {row.targetLabel ?? row.targetId} <span className="text-slate-400">({row.targetType})</span>
                  </td>
                  <td className="py-2 font-mono text-[10px] text-slate-500 break-all">
                    {Object.keys(row.details ?? {}).length ? JSON.stringify(row.details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
