import React, { useEffect, useRef, useState } from 'react';
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
  Gavel,
  Lock,
  BookOpen,
  CalendarCog,
  Monitor,
} from 'lucide-react';
import { api } from '../lib/api';
import { Dashboard } from '../lib/models';
import { formatDate, initials, timeAgo } from '../lib/text';
import { resolveImage } from '../lib/assets';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDownloads } from '../hooks/useDownloads';
import { navigateDashboard, useDashboardRoute } from '../lib/payments';
import { TransactionsView } from './payments/TransactionsView';
import { PaymentsAdminView } from './payments/PaymentsAdminView';
import { MyCourses } from './academy/MyCourses';
import { CoursePlayer } from './academy/CoursePlayer';
import { AcademyAdminView } from './academy/admin/AcademyAdminView';
import { EventsAdminView } from './events/admin/EventsAdminView';
import { EVENT_FORMAT_LABELS } from '../lib/events';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

type Section =
  | 'overview'
  | 'prestations'
  | 'appointments'
  | 'events'
  | 'academy'
  | 'opportunities'
  | 'downloads'
  | 'network'
  | 'requests'
  | 'profile'
  | 'admin-paiements'
  | 'admin-academy'
  | 'admin-events';

const SECTIONS: { id: Section; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: Bell },
  { id: 'prestations', label: 'Prestations & paiements', icon: ShieldCheck },
  { id: 'appointments', label: 'Rendez-vous', icon: CalendarCheck },
  { id: 'events', label: 'Événements', icon: Calendar },
  { id: 'academy', label: 'Formations', icon: GraduationCap },
  { id: 'opportunities', label: 'Opportunités', icon: Target },
  { id: 'downloads', label: 'Téléchargements', icon: Download },
  { id: 'network', label: 'Réseau', icon: Users },
  { id: 'requests', label: 'Demandes & cotations', icon: FileText },
  { id: 'profile', label: 'Mon profil', icon: Pencil },
  { id: 'admin-paiements', label: 'Admin : paiements & litiges', icon: Gavel, adminOnly: true },
  { id: 'admin-academy', label: 'Admin : QIAO Academy', icon: BookOpen, adminOnly: true },
  { id: 'admin-events', label: 'Admin : Événements', icon: CalendarCog, adminOnly: true },
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
  // Section et élément sélectionné portés par l'URL (?dv=prestations/<id>) : liens de notification et bouton retour.
  const route = useDashboardRoute();
  const [routeSection, routeId] = route;
  const section: Section = SECTIONS.some((s) => s.id === routeSection) ? (routeSection as Section) : 'overview';
  const setSection = (next: Section) => navigateDashboard(next === 'overview' ? '' : next);
  // Retour du lecteur de formation vers « Mes formations » : progression rechargée depuis le serveur.
  // « academy/commande/<id> » : retour de la page de paiement (commande), pas une formation.
  const orderRoute = section === 'academy' && routeId === 'commande';
  const playerOpen = section === 'academy' && Boolean(routeId) && !orderRoute;
  const wasPlayerOpen = useRef(playerOpen);
  useEffect(() => {
    if (wasPlayerOpen.current && !playerOpen) reload();
    wasPlayerOpen.current = playerOpen;
  }, [playerOpen, reload]);
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

  // Vues qui chargent leurs propres données (sans attendre le tableau de bord).
  const standalone = ['prestations', 'admin-paiements', 'admin-academy', 'admin-events'].includes(section) || playerOpen;
  const stats = data?.stats ?? {};
  const statCards = [
    { label: 'Rendez-vous à venir', value: stats.appointments ?? 0, icon: CalendarCheck, section: 'appointments' as Section },
    { label: 'Événements', value: stats.events ?? 0, icon: Calendar, section: 'events' as Section },
    { label: 'Formations suivies', value: stats.enrollments ?? 0, icon: GraduationCap, section: 'academy' as Section },
    { label: 'Candidatures', value: stats.applications ?? 0, icon: Target, section: 'opportunities' as Section },
    { label: 'Téléchargements', value: stats.downloads ?? 0, icon: Download, section: 'downloads' as Section },
    { label: 'Membres suivis', value: stats.connections ?? 0, icon: Users, section: 'network' as Section },
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
              {SECTIONS.filter((s) => !s.adminOnly || user.role === 'admin').map(({ id, label, icon: Icon }) => (
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
            {loading && !data && !standalone && (
              <div className="flex items-center gap-2 text-sm text-slate-500 p-6">
                <Loader2 className="w-5 h-5 animate-spin text-red-600" /> Chargement de votre espace...
              </div>
            )}
            {error && !standalone && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
            )}

            {section === 'prestations' && <TransactionsView selectedId={routeId} onNavigate={onNavigate} />}
            {section === 'admin-paiements' && <PaymentsAdminView selectedId={routeId} />}
            {section === 'admin-academy' && <AcademyAdminView route={route.slice(1)} />}
            {section === 'admin-events' && <EventsAdminView route={route.slice(1)} />}

            {data && section === 'overview' && (
              <>
                <button
                  onClick={() => setSection('prestations')}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-left hover:border-red-300 hover:shadow-sm cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-slate-900">Prestations & paiements sécurisés</span>
                      <span className="block text-xs text-slate-500">Vos achats et ventes de prestations, fonds retenus par QIAO, litiges et versements.</span>
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
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
                  data.eventRegistrations.map((r) => {
                    const upcoming = r.event.startDate >= new Date().toISOString().slice(0, 10);
                    return (
                      <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        <img src={resolveImage(r.event.image)} alt={r.event.title} className="w-20 h-16 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate">{r.event.title}</div>
                          <div className="text-xs text-slate-500">
                            {r.event.dateRange} {r.event.monthYear} · {r.event.time} · {r.event.location} · {EVENT_FORMAT_LABELS[r.event.format]}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {r.status === 'waitlisted' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                                Liste d'attente : vous serez prévenu si une place se libère
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                                {r.checkedInAt ? 'Présence enregistrée' : 'Inscription confirmée'}
                              </span>
                            )}
                            {r.event.onlineUrl && upcoming && (
                              <a
                                href={r.event.onlineUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-full bg-[#071329] hover:bg-slate-800 text-white text-[10px] font-bold inline-flex items-center gap-1"
                              >
                                <Monitor className="w-3 h-3" /> Rejoindre en ligne
                              </a>
                            )}
                            {r.status === 'confirmed' && r.event.format !== 'onsite' && !r.event.onlineUrl && upcoming && (
                              <span className="text-[10px] text-slate-400">Le lien de connexion sera ajouté ici avant l'événement.</span>
                            )}
                            {upcoming && (
                              <button
                                disabled={busyId === r.id}
                                onClick={() =>
                                  window.confirm(`Annuler votre inscription à « ${r.event.title} » ?`) &&
                                  run(r.id, () => api.post(`/events/registrations/${r.id}/cancel`), 'Inscription annulée.')
                                }
                                className="text-[10px] font-semibold text-slate-400 hover:text-red-600 cursor-pointer disabled:opacity-50"
                              >
                                Annuler mon inscription
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Badge</div>
                          <div className="font-mono text-sm font-bold text-red-600">{r.badgeCode}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {playerOpen && routeId && <CoursePlayer courseId={routeId} lessonId={route[2]} />}
            {data && section === 'academy' && !playerOpen && (
              <MyCourses
                enrollments={data.enrollments}
                cart={data.cart}
                orders={data.orders}
                onNavigate={onNavigate}
                focusOrderId={orderRoute ? route[2] : undefined}
                onOrdersChanged={reload}
              />
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
                  <h2 className="text-lg font-bold text-slate-900">Membres que je suis</h2>
                  {data.connections.length === 0 ? (
                    <Empty text="Vous ne suivez aucun membre pour le moment." action={{ label: 'Découvrir les experts', onClick: () => onNavigate('community/experts') }} />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.connections.map((c) => (
                        <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                          {c.avatarUrl ? (
                            <img src={c.avatarUrl} alt={c.fullName} className="w-11 h-11 rounded-full object-cover" />
                          ) : (
                            <span className="w-11 h-11 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">{c.fullName.slice(0, 2).toUpperCase()}</span>
                          )}
                          <button onClick={() => onNavigate(`community/member/${c.handle}`)} className="flex-1 min-w-0 text-left cursor-pointer">
                            <div className="font-bold text-sm text-slate-900 hover:text-red-600">{c.fullName}</div>
                            <div className="text-xs text-slate-500 truncate">
                              {[c.headline, c.location].filter(Boolean).join(' · ')}
                            </div>
                          </button>
                          <button
                            onClick={() => run(c.id, () => api.post(`/community/members/${c.handle}/follow`), `Vous ne suivez plus ${c.fullName}.`)}
                            disabled={busyId === c.id}
                            className="text-xs font-semibold text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            Ne plus suivre
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
                      <button
                        key={p.id}
                        onClick={() => onNavigate(`community/post/${p.id}`)}
                        className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 text-sm hover:border-red-300 cursor-pointer"
                      >
                        <div className="text-xs text-slate-500 mb-1">
                          {p.author?.fullName} · {p.community?.name ?? 'Fil général'}
                        </div>
                        {p.title && <p className="font-bold text-slate-900">{p.title}</p>}
                        <p className="text-slate-800 line-clamp-2">{p.content}</p>
                      </button>
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
