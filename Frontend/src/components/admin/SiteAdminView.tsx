import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, ExternalLink, FileText, Globe2, Inbox, Layers, Loader2, Newspaper, Plus, Save, Search, Target, Trash2, Undo2, Wrench } from 'lucide-react';
import { api } from '../../lib/api';
import { slugify } from '../../lib/text';
import { SECTOR_SERVICE_DETAILS } from '../../data/sectorServiceDetails';
import { SectorContent, allSectorIds, currentSector, isOriginalSector, isSectorModified, resetSector, saveSector, useSiteContentVersion } from '../../lib/siteContent';
import { useToast } from '../../context/ToastContext';
import { SchemaForm, inputClass } from './SchemaForm';
import { COLLECTIONS, SECTOR_FIELDS } from './siteAdminSchemas';

type Tab = 'secteurs' | (typeof COLLECTIONS)[number]['id'] | 'demandes' | 'traductions';
const TAB_ICONS: Record<string, React.ElementType> = {
  secteurs: Layers,
  services: Wrench,
  opportunities: Target,
  articles: Newspaper,
  documents: FileText,
  companies: Building2,
  demandes: Inbox,
  traductions: Globe2,
};
const errorText = (err: unknown) => (err instanceof Error ? err.message : 'Une erreur est survenue.');
const card = 'bg-white border border-slate-200 rounded-2xl p-5';
const primaryButton =
  'inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-60';
const secondaryButton =
  'inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60';

// --- Secteurs ------------------------------------------------------------------------------------

type Editor = Record<string, unknown>;
const EMPTY_SUB_DETAIL = { intro: '', figures: [], trends: [], markets: [], opportunities: [], services: [] };

/** Fiche secteur → valeurs du formulaire (groupes, fiches des sous-secteurs et des services intégrées). */
function toEditor(content: SectorContent): Editor {
  return {
    card: content.card ?? { title: content.title, description: content.heroDescription, image: content.heroBg },
    hidden: Boolean(content.hidden),
    order: content.order ?? 0,
    hero: { tag: content.tag, title: content.title, subTitle: content.subTitle, heroDescription: content.heroDescription, heroSlogan: content.heroSlogan, heroBg: content.heroBg },
    heroPills: content.heroPills ?? [],
    overview: { overviewTitle: content.overviewTitle, overviewDescription: content.overviewDescription, overviewButtonText: content.overviewButtonText, quote: content.quote },
    fourPillars: content.fourPillars ?? [],
    stats: content.stats ?? [],
    subSectorsTitle: content.subSectorsTitle,
    subSectors: (content.subSectors ?? []).map((sub) => ({ ...sub, detail: content.subSectorDetails?.[sub.id] ?? EMPTY_SUB_DETAIL })),
    opportunities: content.opportunities ?? [],
    services: (content.services ?? []).map((srv) => ({ ...srv, detail: srv.detail ?? SECTOR_SERVICE_DETAILS[srv.title] ?? { intro: '', includes: [], steps: [] } })),
    successStory: content.successStory ?? { corridor: '', title: '', description: '', image: '' },
    form: { formTitle: content.formTitle, formSubtitle: content.formSubtitle, formBg: content.formBg, projectTypes: content.projectTypes ?? [], footerSignature: content.footerSignature },
  };
}

/** Valeurs du formulaire → fiche secteur enregistrée. */
function fromEditor(id: string, value: Editor, base: SectorContent): SectorContent {
  const subSectors = ((value.subSectors as Record<string, unknown>[]) ?? []).map((sub) => {
    const { detail: _detail, ...rest } = sub;
    return { ...rest, id: String(rest.id || slugify(String(rest.title ?? '')) || `sub-${Date.now()}`) } as SectorContent['subSectors'][number];
  });
  const subSectorDetails = Object.fromEntries(
    ((value.subSectors as Record<string, unknown>[]) ?? []).map((sub, index) => [subSectors[index].id, sub.detail ?? EMPTY_SUB_DETAIL]),
  ) as SectorContent['subSectorDetails'];
  return {
    ...base,
    ...(value.hero as object),
    ...(value.overview as object),
    ...(value.form as object),
    id,
    card: value.card as SectorContent['card'],
    hidden: Boolean(value.hidden),
    order: Number(value.order ?? 0),
    heroPills: value.heroPills as SectorContent['heroPills'],
    fourPillars: value.fourPillars as SectorContent['fourPillars'],
    stats: value.stats as SectorContent['stats'],
    subSectorsTitle: String(value.subSectorsTitle ?? ''),
    subSectors,
    subSectorDetails,
    opportunities: value.opportunities as SectorContent['opportunities'],
    services: value.services as SectorContent['services'],
    successStory: value.successStory as SectorContent['successStory'],
  };
}

const SectorsAdmin: React.FC = () => {
  useSiteContentVersion();
  const { notify } = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState<Editor>({});
  const [busy, setBusy] = useState(false);
  const ids = allSectorIds();

  const open = (id: string) => {
    const content = currentSector(id);
    if (!content) return;
    setValue(toEditor(content));
    setEditing(id);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const save = async () => {
    if (!editing) return;
    const base = currentSector(editing);
    if (!base) return;
    const hero = value.hero as Record<string, unknown>;
    if (!String(hero?.title ?? '').trim()) return notify('Le titre du secteur est obligatoire.', 'error');
    setBusy(true);
    try {
      await saveSector(editing, fromEditor(editing, value, base));
      notify('Secteur enregistré : le site est à jour.', 'success');
    } catch (err) {
      notify(errorText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const reset = async (id: string, created: boolean) => {
    const question = created ? 'Supprimer définitivement ce secteur ?' : 'Rétablir le contenu d’origine de ce secteur ? Vos modifications seront perdues.';
    if (!window.confirm(question)) return;
    setBusy(true);
    try {
      await resetSector(id);
      notify(created ? 'Secteur supprimé.' : 'Contenu d’origine rétabli.', 'success');
      if (created) setEditing(null);
      else open(id);
    } catch (err) {
      notify(errorText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    const name = window.prompt('Nom du nouveau secteur :');
    if (!name?.trim()) return;
    let id = slugify(name) || `secteur-${Date.now()}`;
    while (ids.includes(id)) id = `${id}-2`;
    const model = currentSector(ids[0]);
    if (!model) return;
    const content: SectorContent = {
      ...model,
      id,
      tag: 'SECTEUR',
      title: name.trim(),
      card: { title: name.trim(), description: '', image: model.card?.image ?? model.heroBg, iconName: 'Briefcase' },
      hidden: true,
      order: ids.length,
      subSectors: [],
      subSectorDetails: {},
      opportunities: [],
    };
    setBusy(true);
    try {
      await saveSector(id, content);
      notify('Secteur créé, masqué pour l’instant : complétez-le puis décochez « Masquer ».', 'success');
      open(id);
    } catch (err) {
      notify(errorText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    const created = !isOriginalSector(editing);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setEditing(null)} className={secondaryButton}>
            <ArrowLeft className="w-3.5 h-3.5" /> Tous les secteurs
          </button>
          <a href={`/?tab=sector-detail&sector=${editing}`} target="_blank" rel="noreferrer" className={secondaryButton}>
            <ExternalLink className="w-3.5 h-3.5" /> Voir la page
          </a>
          <div className="flex-1" />
          {(created || isSectorModified(editing)) && (
            <button onClick={() => reset(editing, created)} disabled={busy} className={secondaryButton}>
              {created ? <Trash2 className="w-3.5 h-3.5" /> : <Undo2 className="w-3.5 h-3.5" />} {created ? 'Supprimer le secteur' : 'Rétablir l’original'}
            </button>
          )}
          <button onClick={save} disabled={busy} className={primaryButton}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Enregistrer
          </button>
        </div>
        <div className={card}>
          <SchemaForm fields={SECTOR_FIELDS} value={value} onChange={setValue} />
        </div>
        <div className="flex justify-end">
          <button onClick={save} disabled={busy} className={primaryButton}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Enregistrer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-xs text-slate-500">
          Chaque secteur a sa page, ses sous-secteurs clés (avec leur propre page), ses opportunités et ses services. Les modifications sont visibles aussitôt.
        </p>
        <button onClick={create} disabled={busy} className={primaryButton}>
          <Plus className="w-3.5 h-3.5" /> Nouveau secteur
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {ids.map((id) => {
          const sector = currentSector(id);
          if (!sector) return null;
          const created = !isOriginalSector(id);
          return (
            <button key={id} onClick={() => open(id)} className="w-full text-left py-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg px-2 cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate" translate="no">
                  {sector.card?.title || sector.title}
                </div>
                <div className="text-[11px] text-slate-500">
                  {sector.subSectors?.length ?? 0} sous-secteurs · {sector.services?.length ?? 0} services · {sector.opportunities?.length ?? 0} opportunités
                </div>
              </div>
              {sector.hidden && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Masqué</span>}
              {created ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Créé</span>
              ) : isSectorModified(id) ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Modifié</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Original</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Collections ---------------------------------------------------------------------------------

const CollectionAdmin: React.FC<{ collection: (typeof COLLECTIONS)[number] }> = ({ collection }) => {
  const { notify } = useToast();
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get<Record<string, unknown>[]>(`/site-admin/collections/${collection.id}`)
      .then(setRows)
      .catch((err) => notify(errorText(err), 'error'));
  useEffect(() => {
    setRows(null);
    setEditing(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.id]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((row) => !q || JSON.stringify(row).toLowerCase().includes(q));
  }, [rows, query]);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const payload = Object.fromEntries(collection.fields.map((field) => [field.key, editing[field.key]]));
      if (editing.id) await api.patch(`/site-admin/collections/${collection.id}/${editing.id}`, payload);
      else await api.post(`/site-admin/collections/${collection.id}`, payload);
      notify('Enregistré : le site est à jour.', 'success');
      setEditing(null);
      await load();
    } catch (err) {
      notify(errorText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: Record<string, unknown>) => {
    if (!window.confirm(`Supprimer « ${row[collection.titleField]} » ? Cette action est définitive.`)) return;
    setBusy(true);
    try {
      await api.delete(`/site-admin/collections/${collection.id}/${row.id}`);
      notify('Supprimé.', 'success');
      await load();
    } catch (err) {
      notify(errorText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(null)} className={secondaryButton}>
            <ArrowLeft className="w-3.5 h-3.5" /> {collection.label}
          </button>
          <div className="flex-1" />
          <button onClick={save} disabled={busy} className={primaryButton}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Enregistrer
          </button>
        </div>
        <div className={card}>
          <SchemaForm fields={collection.fields} value={editing} onChange={setEditing} />
        </div>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className={`${inputClass} pl-8`} />
        </div>
        <button onClick={() => setEditing({})} className={primaryButton}>
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>
      {!rows ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {shown.length === 0 && <p className="text-xs text-slate-500 py-4">Aucun élément.</p>}
          {shown.map((row) => (
            <div key={String(row.id)} className="py-2.5 flex items-center gap-3">
              <button onClick={() => setEditing(row)} className="flex-1 min-w-0 text-left cursor-pointer" translate="no">
                <div className="text-sm font-bold text-slate-900 truncate hover:text-red-600">{String(row[collection.titleField] ?? '')}</div>
                <div className="text-[11px] text-slate-500 truncate">{collection.subtitle(row)}</div>
              </button>
              <button onClick={() => remove(row)} disabled={busy} aria-label="Supprimer" className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Demandes reçues -----------------------------------------------------------------------------

const INBOXES: { id: string; label: string; columns: [string, (row: Record<string, unknown>) => string][] }[] = [
  {
    id: 'contact',
    label: 'Messages de contact',
    columns: [
      ['Date', (r) => new Date(String(r.createdAt)).toLocaleDateString()],
      ['Nom', (r) => `${r.fullName ?? ''}${r.company ? ` (${r.company})` : ''}`],
      ['E-mail', (r) => String(r.email ?? '')],
      ['Sujet', (r) => String(r.subject ?? r.source ?? '')],
      ['Message', (r) => String(r.message ?? '')],
    ],
  },
  {
    id: 'appointments',
    label: 'Rendez-vous',
    columns: [
      ['Créneau', (r) => `${r.date ?? ''} ${r.time ?? ''}`],
      ['Nom', (r) => String(r.fullName ?? '')],
      ['E-mail', (r) => String(r.email ?? '')],
      ['Domaine', (r) => String(r.specialty ?? '')],
      ['Statut', (r) => (r.status === 'cancelled' ? 'Annulé' : 'Confirmé')],
    ],
  },
  {
    id: 'applications',
    label: 'Candidatures aux opportunités',
    columns: [
      ['Date', (r) => new Date(String(r.createdAt)).toLocaleDateString()],
      ['Opportunité', (r) => String((r.opportunity as Record<string, unknown> | null)?.title ?? '')],
      ['Nom', (r) => `${r.fullName ?? ''}${r.company ? ` (${r.company})` : ''}`],
      ['E-mail', (r) => String(r.email ?? '')],
      ['Message', (r) => String(r.message ?? '')],
    ],
  },
  {
    id: 'company-requests',
    label: 'Demandes de mise en relation',
    columns: [
      ['Date', (r) => new Date(String(r.createdAt)).toLocaleDateString()],
      ['Entreprise', (r) => String((r.company as Record<string, unknown> | null)?.name ?? '')],
      ['Nom', (r) => String(r.fullName ?? '')],
      ['E-mail', (r) => String(r.email ?? '')],
      ['Message', (r) => String(r.message ?? '')],
    ],
  },
  {
    id: 'resource-requests',
    label: 'Demandes de documents',
    columns: [
      ['Date', (r) => new Date(String(r.createdAt)).toLocaleDateString()],
      ['Document', (r) => String(r.title ?? '')],
      ['E-mail', (r) => String(r.email ?? '')],
      ['Détails', (r) => String(r.details ?? '')],
    ],
  },
  {
    id: 'newsletter',
    label: 'Abonnés à la newsletter',
    columns: [
      ['Date', (r) => new Date(String(r.createdAt)).toLocaleDateString()],
      ['E-mail', (r) => String(r.email ?? '')],
      ['Sujets', (r) => (Array.isArray(r.topics) ? (r.topics as string[]).join(', ') : '')],
      ['Actif', (r) => (r.active ? 'Oui' : 'Non')],
    ],
  },
];
const CONTACT_STATUS: Record<string, string> = { new: 'Nouveau', 'in-progress': 'En cours', closed: 'Traité' };

const InboxAdmin: React.FC = () => {
  const { notify } = useToast();
  const [inbox, setInbox] = useState(INBOXES[0].id);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const def = INBOXES.find((item) => item.id === inbox)!;

  useEffect(() => {
    setRows(null);
    api
      .get<Record<string, unknown>[]>(`/site-admin/inbox/${inbox}`)
      .then(setRows)
      .catch((err) => notify(errorText(err), 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inbox]);

  const setStatus = async (row: Record<string, unknown>, status: string) => {
    try {
      await api.patch(`/site-admin/inbox/contact/${row.id}`, { status });
      setRows((current) => (current ?? []).map((item) => (item.id === row.id ? { ...item, status } : item)));
    } catch (err) {
      notify(errorText(err), 'error');
    }
  };

  return (
    <div className={card}>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {INBOXES.map((item) => (
          <button
            key={item.id}
            onClick={() => setInbox(item.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer ${inbox === item.id ? 'bg-[#0a1c3d] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {!rows ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
        </div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500 py-4">Aucune demande pour l’instant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] text-slate-500 border-b border-slate-200">
                {def.columns.map(([label]) => (
                  <th key={label} className="py-2 pr-3 font-semibold">
                    {label}
                  </th>
                ))}
                {inbox === 'contact' && <th className="py-2 font-semibold">Suivi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={String(row.id)} className="align-top">
                  {def.columns.map(([label, get]) => (
                    <td key={label} className="py-2 pr-3 text-slate-700 max-w-[280px] whitespace-pre-line break-words" translate="no">
                      {get(row)}
                    </td>
                  ))}
                  {inbox === 'contact' && (
                    <td className="py-2">
                      <select value={String(row.status ?? 'new')} onChange={(e) => setStatus(row, e.target.value)} className={`${inputClass} w-28 py-1`}>
                        {Object.entries(CONTACT_STATUS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- Traductions ---------------------------------------------------------------------------------

const LANGUAGES = [
  { value: 'en', label: 'Anglais' },
  { value: 'zh', label: 'Chinois' },
  { value: 'ar', label: 'Arabe' },
];

const TranslationsAdmin: React.FC = () => {
  const { notify } = useToast();
  const [language, setLanguage] = useState('en');
  const [rows, setRows] = useState<{ source: string; target: string | null }[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [onlyMissing, setOnlyMissing] = useState(true);

  useEffect(() => {
    setRows(null);
    setDrafts({});
    api
      .get<{ source: string; target: string | null }[]>(`/site-admin/translations?language=${language}`)
      .then(setRows)
      .catch((err) => notify(errorText(err), 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const save = async (source: string) => {
    const target = drafts[source] ?? '';
    try {
      await api.put('/site-admin/translations', { language, source, target });
      setRows((current) => (current ?? []).map((row) => (row.source === source ? { ...row, target: target.trim() || null } : row)));
      notify('Traduction enregistrée.', 'success');
    } catch (err) {
      notify(errorText(err), 'error');
    }
  };

  const shown = (rows ?? []).filter((row) => !onlyMissing || !row.target);
  return (
    <div className={card}>
      <p className="text-xs text-slate-500 mb-3">
        Textes ajoutés ou modifiés depuis l’administration (secteurs, services, formations, événements...). Le site les affiche dans la langue choisie dès
        que leur traduction est enregistrée ici.
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className={`${inputClass} w-40`}>
          {LANGUAGES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="accent-red-600" />
          Seulement les textes sans traduction
        </label>
        {rows && <span className="text-[11px] text-slate-500">{rows.filter((row) => !row.target).length} sans traduction</span>}
      </div>
      {!rows ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
        </div>
      ) : shown.length === 0 ? (
        <p className="text-xs text-emerald-700 font-semibold py-4">Tous les textes sont traduits.</p>
      ) : (
        <div className="space-y-3">
          {shown.slice(0, 200).map((row) => (
            <div key={row.source} className="border border-slate-200 rounded-xl p-3" translate="no">
              <p className="text-xs text-slate-800 mb-2 whitespace-pre-line">{row.source}</p>
              <div className="flex gap-2 items-start">
                <textarea
                  rows={2}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  value={drafts[row.source] ?? row.target ?? ''}
                  onChange={(e) => setDrafts((current) => ({ ...current, [row.source]: e.target.value }))}
                  className={inputClass}
                />
                <button onClick={() => save(row.source)} className={primaryButton}>
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Vue principale -----------------------------------------------------------------------------

/** Administration des contenus du site. */
export const SiteAdminView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('secteurs');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'secteurs', label: 'Secteurs et sous-secteurs' },
    ...COLLECTIONS.map((item) => ({ id: item.id as Tab, label: item.label })),
    { id: 'demandes', label: 'Demandes reçues' },
    { id: 'traductions', label: 'Traductions' },
  ];
  const collection = COLLECTIONS.find((item) => item.id === tab);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#0a1c3d]">Contenus du site</h1>
        <p className="text-xs text-slate-500 mt-1">Tout ce qui est publié sur QIAO : secteurs, services, opportunités, analyses, documents, entreprises.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((item) => {
          const Icon = TAB_ICONS[item.id] ?? Layers;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                tab === item.id ? 'bg-red-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {item.label}
            </button>
          );
        })}
      </div>
      {tab === 'secteurs' && <SectorsAdmin />}
      {collection && <CollectionAdmin collection={collection} />}
      {tab === 'demandes' && <InboxAdmin />}
      {tab === 'traductions' && <TranslationsAdmin />}
    </div>
  );
};
