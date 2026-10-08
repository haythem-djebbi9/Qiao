import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  GraduationCap,
  Heart,
  ShoppingCart,
  Download,
  Target,
  Users,
  Bell,
  FileText,
  Calculator,
  Video,
  X,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Pencil,
  Bookmark,
  Building2,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { Dashboard } from '../lib/models';
import { formatDate, initials, timeAgo } from '../lib/text';
import { resolveImage } from '../lib/assets';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDownloads } from '../hooks/useDownloads';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

type Section = 'overview' | 'appointments' | 'events' | 'academy' | 'opportunities' | 'downloads' | 'network' | 'requests' | 'profile';

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: Bell },
  { id: 'appointments', label: 'Rendez-vous', icon: CalendarCheck },
  { id: 'events', label: 'Événements', icon: Calendar },
  { id: 'academy', label: 'Formations', icon: GraduationCap },
  { id: 'opportunities', label: 'Opportunités', icon: Target },
  { id: 'downloads', label: 'Téléchargements', icon: Download },
  { id: 'network', label: 'Réseau', icon: Users },
  { id: 'requests', label: 'Demandes & cotations', icon: FileText },
  { id: 'profile', label: 'Mon profil', icon: Pencil },
];

const Empty: React.FC<{ text: string; action?: { label: string; onClick: () => void } }> = ({ text, action }) => (
  <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-2xl text-sm text-slate-500 space-y-3">
    <p>{text}</p>
    {action && (
      <button onClick={action.onClick} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer">
        {action.label}
      </button>
    )}
  </div>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, updateProfile } = useAuth();
  const { notify } = useToast();
  const { downloadDocument, pending } = useDownloads();
  const { data, loading, error, reload } = useApi<Dashboard>('/me/dashboard');
  const [section, setSection] = useState<Section>('overview');
  const [profile, setProfile] = useState({ fullName: '', company: '', title: '', location: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName,
        company: user.company ?? '',
        title: user.title ?? '',
        location: user.location ?? '',
      });
    }
  }, [user]);

  if (!user) return null;

  const run = async (id: string, action: () => Promise<unknown>, success: string) => {
    setBusyId(id);
    try {
      await action();
      notify(success);
      await reload();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action impossible.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profile);
      notify('Profil mis à jour.');
      reload();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Mise à jour impossible.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.patch('/auth/me/password', passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      notify('Mot de passe modifié.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Modification impossible.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const stats = data?.stats ?? {};
  const statCards = [
    { label: 'Rendez-vous à venir', value: stats.appointments ?? 0, icon: CalendarCheck, section: 'appointments' as Section },
    { label: 'Événements', value: stats.events ?? 0, icon: Calendar, section: 'events' as Section },
    { label: 'Formations suivies', value: stats.enrollments ?? 0, icon: GraduationCap, section: 'academy' as Section },
    { label: 'Candidatures', value: stats.applications ?? 0, icon: Target, section: 'opportunities' as Section },
    { label: 'Téléchargements', value: stats.downloads ?? 0, icon: Download, section: 'downloads' as Section },
    { label: 'Connexions', value: stats.connections ?? 0, icon: Users, section: 'network' as Section },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 sm:pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête du membre */}
        <div className="bg-[#07152b] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center text-xl font-black">{initials(user.fullName)}</div>
            )}
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Mon espace QIAO</div>
              <h1 className="text-2xl sm:text-3xl font-black">Bonjour, {user.fullName.split(' ')[0]}</h1>
              <div className="text-sm text-slate-300 mt-1 flex flex-wrap items-center gap-2">
                <span>{user.title ?? 'Membre QIAO'}</span>
                {user.company && <span>· {user.company}</span>}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    user.verified ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {user.verified ? 'Membre vérifié' : 'Vérification KYC en cours'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onNavigate('commerce-hub')} className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold cursor-pointer">
              Explorer les opportunités
            </button>
            <button onClick={() => onNavigate('academy')} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold cursor-pointer">
              QIAO Academy
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Navigation */}
          <aside className="lg:col-span-3">
            <nav className="bg-white border border-slate-200 rounded-2xl p-2 flex lg:flex-col gap-1 overflow-x-auto">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    section === id ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === 'overview' && (stats.unreadNotifications ?? 0) > 0 && (
                    <span className="ml-auto px-1.5 rounded-full bg-red-600 text-white text-[10px]">{stats.unreadNotifications}</span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          <main className="lg:col-span-9 space-y-6">
            {loading && !data && (
              <div className="flex items-center gap-2 text-sm text-slate-500 p-6">
                <Loader2 className="w-5 h-5 animate-spin text-red-600" /> Chargement de votre espace...
              </div>
            )}
            {error && <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>}

            {data && section === 'overview' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {statCards.map(({ label, value, icon: Icon, section: target }) => (
                    <button
                      key={label}
                      onClick={() => setSection(target)}
                      className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                    >
                      <Icon className="w-5 h-5 text-red-600 mb-2" />
                      <div className="text-2xl font-black text-slate-900">{value}</div>
                      <div className="text-xs font-semibold text-slate-500">{label}</div>
                    </button>
                  ))}
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h2 className="text-base font-bold text-slate-900 mb-3">Mes alertes & notifications</h2>
                  {data.notifications.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucune notification.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={async () => {
                            if (!n.read) await api.patch(`/notifications/${n.id}/read`).catch(() => undefined);
                            if (n.link && n.link !== 'dashboard') onNavigate(n.link);
                            else reload();
                          }}
                          className="w-full text-left py-3 flex items-start gap-3 cursor-pointer group"
                        >
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-slate-300' : 'bg-red-600'}`} />
                          <span className="flex-1">
                            <span className="block text-sm font-semibold text-slate-900 group-hover:text-red-600">{n.title}</span>
                            <span className="block text-xs text-slate-500">{n.body}</span>
                          </span>
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(n.createdAt, 'long')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {data && section === 'appointments' && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900">Mes rendez-vous d'experts</h2>
                {data.appointments.length === 0 ? (
                  <Empty text="Aucun rendez-vous pour le moment." />
                ) : (
                  data.appointments.map((a) => (
                    <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{a.specialtyLabel}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatDate(`${a.date}T12:00:00`)} à {a.time} (GMT+1)
                        </div>
                        {a.status === 'confirmed' ? (
                          <a href={a.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-blue-700 font-semibold inline-flex items-center gap-1 mt-1">
                            <Video className="w-3.5 h-3.5" /> {a.meetingLink.replace('https://', '')}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">Annulé</span>
                        )}
                      </div>
                      {a.status === 'confirmed' && (
                        <button
                          onClick={() => run(a.id, () => api.patch(`/appointments/${a.id}/cancel`), 'Rendez-vous annulé.')}
                          disabled={busyId === a.id}
                          className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                        >
                          {busyId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          Annuler
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {data && section === 'events' && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900">Mes inscriptions aux événements</h2>
                {data.eventRegistrations.length === 0 ? (
                  <Empty text="Vous n'êtes inscrit à aucun événement." action={{ label: 'Voir les événements', onClick: () => onNavigate('evenements') }} />
                ) : (
                  data.eventRegistrations.map((r) => (
                    <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
                      <img src={resolveImage(r.event.image)} alt={r.event.title} className="w-20 h-16 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">{r.event.title}</div>
                        <div className="text-xs text-slate-500">
                          {r.event.dateRange} {r.event.monthYear} · {r.event.location}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Badge</div>
                        <div className="font-mono text-sm font-bold text-red-600">{r.badgeCode}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {data && section === 'academy' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900">Mes formations</h2>
                  {data.enrollments.length === 0 ? (
                    <Empty text="Aucune formation pour le moment." action={{ label: 'Découvrir QIAO Academy', onClick: () => onNavigate('academy') }} />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.enrollments.map((e) => (
                        <div key={e.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                          <img src={resolveImage(e.image)} alt={e.title} className="w-full h-28 object-cover" />
                          <div className="p-4">
                            <div className="text-[10px] font-bold uppercase text-red-600">{e.itemType === 'path' ? 'Parcours' : 'Formation'}</div>
                            <div className="font-bold text-sm text-slate-900 leading-snug">{e.title}</div>
                            <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-red-600 h-full" style={{ width: `${e.progress}%` }} />
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">Progression : {e.progress}% · inscrit le {formatDate(e.createdAt)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {data.cart.count > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <ShoppingCart className="w-4 h-4 text-red-600" />
                      {data.cart.count} formation(s) dans votre panier — {data.cart.total} TND
                    </div>
                    <button onClick={() => onNavigate('academy')} className="text-xs font-bold text-red-600 hover:underline cursor-pointer">
                      Finaliser ma commande →
                    </button>
                  </div>
                )}
                {data.orders.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Historique des commandes</h3>
                    <div className="divide-y divide-slate-100 text-sm">
                      {data.orders.map((o) => (
                        <div key={o.id} className="py-2 flex items-center justify-between gap-3">
                          <span className="font-mono text-xs text-slate-500">{o.reference}</span>
                          <span className="flex-1 text-slate-700 truncate">{o.items.map((i) => i.title).join(', ')}</span>
                          <span className="font-bold text-slate-900">{o.total} TND</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {data && section === 'opportunities' && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900">Mes candidatures & mises en relation</h2>
                {data.applications.length === 0 && data.companyRequests.length === 0 ? (
                  <Empty text="Aucune candidature envoyée." action={{ label: 'Voir les opportunités', onClick: () => onNavigate('opportunites') }} />
                ) : (
                  <>
                    {data.applications.map((a) => (
                      <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase text-blue-700">{a.opportunity.type}</div>
                          <div className="font-bold text-sm text-slate-900 truncate">{a.opportunity.title}</div>
                          <div className="text-xs text-slate-500">
                            {a.opportunity.fromCountry} → {a.opportunity.toCountry} · envoyée {timeAgo(a.createdAt, 'long').toLowerCase()}
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold whitespace-nowrap">
                          {a.status === 'submitted' ? 'En cours de vérification' : a.status === 'shortlisted' ? 'Présélectionnée' : 'Non retenue'}
                        </span>
                      </div>
                    ))}
                    {data.companyRequests.map((r) => (
                      <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <div className="flex-1 text-sm">
                          Mise en relation avec <strong>{r.company.name}</strong> ({r.company.country})
                        </div>
                        <span className="text-xs text-slate-400">{timeAgo(r.createdAt, 'long')}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {data && section === 'downloads' && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900">Mes rapports téléchargés</h2>
                {data.downloads.length === 0 ? (
                  <Empty text="Aucun téléchargement pour le moment." action={{ label: 'Parcourir les ressources', onClick: () => onNavigate('resources') }} />
                ) : (
                  data.downloads.map((d) => (
                    <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-red-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">{d.document.title}</div>
                          <div className="text-xs text-slate-500">
                            {d.document.format} · téléchargé {timeAgo(d.createdAt, 'long').toLowerCase()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadDocument(d.document.id, d.document.title)}
                        disabled={pending === d.document.id}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-60"
                        aria-label="Télécharger à nouveau"
                      >
                        {pending === d.document.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {data && section === 'network' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900">Mes connexions</h2>
                  {data.connections.length === 0 ? (
                    <Empty text="Aucune connexion pour le moment." action={{ label: 'Découvrir la communauté', onClick: () => onNavigate('community') }} />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.connections.map((c) => (
                        <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                          <img src={c.avatar} alt={c.name} className="w-11 h-11 rounded-full object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-slate-900">{c.name}</div>
                            <div className="text-xs text-slate-500 truncate">
                              {c.role} · {c.flag} {c.country}
                            </div>
                          </div>
                          <button
                            onClick={() => run(c.id, () => api.post(`/community/experts/${c.id}/connect`), `Connexion avec ${c.name} retirée.`)}
                            disabled={busyId === c.id}
                            className="text-xs font-semibold text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            Retirer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-red-600" /> Publications enregistrées
                  </h2>
                  {data.bookmarks.length === 0 ? (
                    <Empty text="Aucune publication enregistrée." />
                  ) : (
                    data.bookmarks.map((p) => (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 text-sm">
                        <div className="text-xs text-slate-500 mb-1">
                          {p.author} · {p.location}
                        </div>
                        <p className="text-slate-800">{p.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {data && section === 'requests' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900">Mes demandes</h2>
                  {data.requests.length === 0 ? (
                    <Empty text="Aucune demande envoyée." action={{ label: 'Nous contacter', onClick: () => onNavigate('contact') }} />
                  ) : (
                    data.requests.map((r) => (
                      <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-500">{r.reference}</span>
                            <span className="font-bold text-sm text-slate-900 truncate">{r.subject ?? 'Demande'}</span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{r.message}</p>
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(r.createdAt, 'long')}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-red-600" /> Mes cotations d'import
                  </h2>
                  {data.simulations.length === 0 ? (
                    <Empty text="Aucune cotation demandée. Utilisez le simulateur de droits & taxes pour en obtenir une." />
                  ) : (
                    data.simulations.map((s) => (
                      <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-sm">
                        <span className="font-mono text-xs text-slate-500">{s.reference}</span>
                        <span className="flex-1">
                          Import vers <strong>{s.destCountry}</strong> — FOB {s.fobValue.toLocaleString('fr-FR')} USD
                        </span>
                        <span className="font-bold text-emerald-700">{s.result.totalLandedCost.toLocaleString('fr-FR')} USD</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {section === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form onSubmit={saveProfile} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h2 className="text-base font-bold text-slate-900">Mes informations</h2>
                  {(
                    [
                      ['fullName', 'Nom & Prénom'],
                      ['company', 'Entreprise / Organisation'],
                      ['title', 'Fonction'],
                      ['location', 'Ville, Pays'],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
                      <input
                        required={field === 'fullName'}
                        value={profile[field]}
                        onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ))}
                  <div className="text-xs text-slate-500">E-mail : {user.email}</div>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Enregistrer
                  </button>
                </form>
                <form onSubmit={savePassword} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Sécurité
                  </h2>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mot de passe actuel</label>
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nouveau mot de passe (8 caractères min.)</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                    Modifier le mot de passe
                  </button>
                </form>
              </div>
            )}

            {data && section === 'overview' && (
              <button
                onClick={() => onNavigate('services')}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-sm font-semibold text-slate-700 hover:border-red-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-600" /> Besoin d'un accompagnement ? Découvrez nos services.
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
