import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Users,
  Globe,
  Building2,
  Handshake,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  FileText,
  Target,
  Trophy,
  MapPin,
  Clock,
  Check,
  X,
  Loader2,
  Home,
  Compass,
  BadgeCheck,
  Mail,
  UserCircle,
  FilePen,
  ShieldAlert,
  Settings2,
  Bell,
  Activity,
} from 'lucide-react';
import { AppTab } from '../types';
import { Logo } from './Logo';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { QiaoEvent } from '../lib/models';
import { timeAgo } from '../lib/text';
import {
  ActivityItem,
  CommunitySummary,
  ModerationSummary,
  Paged,
  RecommendedMember,
  navigateCommunity,
  routeFromLink,
  useCommunityRoute,
} from '../lib/community';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppActions } from '../context/AppActionsContext';
import { FeedSection } from './community/FeedSection';
import { CommunityDirectory } from './community/CommunityDirectory';
import { CommunityDetailView } from './community/CommunityDetailView';
import { PostDetailView } from './community/PostDetailView';
import { MemberProfileView } from './community/MemberProfileView';
import { ExpertDirectory } from './community/ExpertDirectory';
import { MessagesView } from './community/MessagesView';
import { CommunitySettings } from './community/CommunitySettings';
import { ModerationPanel } from './community/ModerationPanel';
import { AdminPanel } from './community/AdminPanel';
import { SearchResultsView } from './community/SearchResultsView';
import { DraftsView } from './community/DraftsView';
import { Avatar, CommunityIcon, MemberName, VisibilityBadge, errorMessage } from './community/ui';

interface CommunityPageProps {
  onNavigate: (tab: AppTab) => void;
  onOpenRegister?: () => void;
  onOpenContact?: () => void;
}

const PROFILE_TYPES = [
  'Fournisseur / Fabricant chinois vérifié',
  'Distributeur / Importateur Afrique du Nord',
  "Investisseur / Fonds d'investissement",
  'Expert juridique ou fiscal international',
  'Transitaire & Partenaire Logistique',
];

interface CommunityStats {
  members: number;
  countries: number;
  companies: number;
  experts: number;
  communities: number;
}

const formatCount = (value: number | undefined) => (value === undefined ? '—' : value.toLocaleString('fr-FR'));

export const CommunityPage: React.FC<CommunityPageProps> = ({
  onNavigate,
  onOpenRegister,
  onOpenContact,
}) => {
  const { user, requireAuth } = useAuth();
  const { notify } = useToast();
  const { openLegal } = useAppActions();
  const [route] = useCommunityRoute();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState(route.name === 'search' ? route.query.get('q') ?? '' : '');
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<{ title: string; subtitle: string; fullText: string; image: string } | null>(null);
  const [showAllExperts, setShowAllExperts] = useState(false);

  // QIAO Connect
  const [connectForm, setConnectForm] = useState({ profileType: PROFILE_TYPES[0], description: '', fullName: '', email: '' });
  const [connectSending, setConnectSending] = useState(false);
  const [connectSent, setConnectSent] = useState(false);

  // Statistiques réelles de la communauté
  const { data: stats } = useApi<CommunityStats>('/community/stats');

  // Carrousel « Choisissez votre communauté » : communautés découvrables par le visiteur
  const { data: communityPage, setData: setCommunityPage } = useApi<Paged<CommunitySummary>>('/community/communities', {
    limit: 24,
    viewer: user?.id,
  });
  const carouselCommunities = communityPage?.items ?? [];

  // Experts & membres recommandés
  const { data: recommendations, setData: setRecommendations } = useApi<{ communities: CommunitySummary[]; members: RecommendedMember[] }>(
    '/community/recommendations',
    { viewer: user?.id },
  );
  const experts = recommendations?.members ?? [];

  // Activité récente (membre connecté)
  const { data: activity = [] } = useApi<ActivityItem[]>(user ? '/community/activity' : null, { viewer: user?.id }, []);

  // Rôles de modération (affichage des espaces dédiés)
  const { data: moderation } = useApi<ModerationSummary>(user ? '/community/moderation/summary' : null, { viewer: user?.id });

  // Messages non lus
  const { data: unread, reload: reloadUnread } = useApi<{ unread: number }>(user ? '/community/conversations/unread' : null, { viewer: user?.id, route: route.name });
  useEffect(() => {
    window.addEventListener('qiao:refresh-counters', reloadUnread);
    return () => window.removeEventListener('qiao:refresh-counters', reloadUnread);
  }, [reloadUnread]);

  // Events list
  const { data: events = [] } = useApi<QiaoEvent[]>('/events', { placement: 'community' }, []);

  // Visite de Community (indicateur d'adoption, une fois par jour et par membre)
  useEffect(() => {
    if (user) api.post('/community/visit').catch(() => undefined);
  }, [user?.id]);

  useEffect(() => {
    if (route.name === 'search') setSearchQuery(route.query.get('q') ?? '');
  }, [route.name, route.query]);

  // Carousel ref
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const runSearch = () => {
    const q = searchQuery.trim();
    navigateCommunity(q ? `search?q=${encodeURIComponent(q)}` : 'search');
  };

  // Success Stories
  const successStories = [
    {
      id: 's1',
      title: 'De la rencontre à la signature',
      subtitle: 'Une entreprise tunisienne trouve son fournisseur idéal en Chine grâce à QIAO Community.',
      fullText:
        'Grâce au réseau vérifié de QIAO Community, la société MedTech Sousse a pu entrer directement en contact avec un fabricant certifié de composants à Suzhou. Après deux semaines d’échanges sécurisés et un audit d’usine validé par nos experts locaux, un contrat pluriannuel de 1.8M€ a été signé sans intermédiaire coûteux.',
      image:
        'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 's2',
      title: 'Un partenariat gagnant-gagnant',
      subtitle: 'Collaboration réussie entre une société marocaine et un investisseur chinois dans les énergies renouvelables.',
      fullText:
        'Une joint-venture sino-marocaine a vu le jour à Casablanca pour l’assemblage d’onduleurs photovoltaïques. QIAO a facilité la mise en relation avec le fonds d’investissement de Shenzhen et accompagné la constitution du dossier juridique bilingue.',
      image:
        'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 's3',
      title: 'Une expansion rapide',
      subtitle: 'Start-up algérienne accompagnée par des mentors QIAO vers le marché asiatique.',
      fullText:
        'La jeune pousse GreenDattes a réussi à exporter 40 tonnes de dattes biologiques et dérivés vers les chaînes premium de Shanghai et Guangzhou en bénéficiant du mentorat direct d’experts QIAO en packaging et réglementation phytosanitaire.',
      image:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    },
  ];

  // Suivre un membre recommandé (relation distincte de l'adhésion à une communauté)
  const handleToggleFollow = (member: RecommendedMember) =>
    requireAuth(async () => {
      if (!member.handle) return;
      try {
        const result = await api.post<{ following: boolean }>(`/community/members/${member.handle}/follow`);
        setRecommendations((current) =>
          current ? { ...current, members: current.members.map((m) => (m.id === member.id ? { ...m, isFollowing: result.following } : m)) } : current,
        );
        notify(result.following ? `Vous suivez ${member.fullName}.` : `Vous ne suivez plus ${member.fullName}.`);
      } catch (err) {
        notify(errorMessage(err), 'error');
      }
    }, 'Connectez-vous pour suivre des membres.');

  const handleConnectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectSending(true);
    try {
      await api.post('/community/match-requests', {
        profileType: connectForm.profileType,
        description: connectForm.description,
        fullName: user ? undefined : connectForm.fullName,
        email: user ? undefined : connectForm.email,
      });
      setConnectSent(true);
      setConnectForm((current) => ({ ...current, description: '' }));
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Envoi impossible.', 'error');
    } finally {
      setConnectSending(false);
    }
  };

  const visibleExperts = showAllExperts ? experts : experts.slice(0, 4);
  const isHome = route.name === 'home';

  // Navigation interne de Community
  const navItems = [
    { id: 'home', label: "Fil d'actualité", icon: Home, route: 'home', active: isHome },
    { id: 'communities', label: 'Communautés', icon: Compass, route: 'communities', active: ['communities', 'c'].includes(route.name) },
    { id: 'experts', label: 'Experts', icon: BadgeCheck, route: 'experts', active: route.name === 'experts' },
    ...(user
      ? [
          { id: 'messages', label: 'Messages', icon: Mail, route: 'messages', active: route.name === 'messages', count: unread?.unread },
          { id: 'profile', label: 'Mon profil', icon: UserCircle, route: user.handle ? `member/${user.handle}` : 'settings', active: route.name === 'member' && route.params[0] === user.handle },
          { id: 'drafts', label: 'Brouillons', icon: FilePen, route: 'drafts', active: route.name === 'drafts' },
          { id: 'settings', label: 'Paramètres', icon: Settings2, route: 'settings', active: route.name === 'settings' },
        ]
      : []),
    ...(moderation?.isModerator
      ? [{ id: 'moderation', label: 'Modération', icon: ShieldAlert, route: 'moderation', active: route.name === 'moderation', count: moderation.pendingRequests }]
      : []),
    ...(moderation?.isAdmin ? [{ id: 'admin', label: 'Administration', icon: Activity, route: 'admin', active: route.name === 'admin' }] : []),
  ];

  const renderView = () => {
    switch (route.name) {
      case 'communities':
        return <CommunityDirectory />;
      case 'c':
        return <CommunityDetailView slug={route.params[0]} section={route.params[1]} />;
      case 'post':
        return <PostDetailView postId={route.params[0]} />;
      case 'member':
        return <MemberProfileView handle={route.params[0]} />;
      case 'experts':
        return <ExpertDirectory />;
      case 'messages':
        return <MessagesView conversationId={route.params[0]} query={route.query} />;
      case 'settings':
        return <CommunitySettings section={route.params[0]} />;
      case 'moderation':
        return <ModerationPanel />;
      case 'admin':
        return <AdminPanel section={route.params[0]} />;
      case 'search':
        return <SearchResultsView query={route.query} />;
      case 'drafts':
        return <DraftsView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased overflow-x-hidden pt-20 sm:pt-24 animate-in fade-in duration-300">

      {/* ========================================================================= */}
      {/* 1. HERO SECTION ("Bienvenue dans QIAO Community")                         */}
      {/* ========================================================================= */}
      <section className={`relative overflow-hidden bg-[#071329] text-white border-b border-slate-800 ${isHome ? 'py-16 sm:py-24' : 'py-8 sm:py-10'}`}>
        
        {/* Layered Panoramic Composite: Pagoda on Left + Red Suspension Bridge on Right */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#051126]/95 via-[#071738]/85 to-[#040f24]/90 z-10" />
          <div className="grid grid-cols-2 w-full h-full opacity-35 mix-blend-luminosity pointer-events-none">
            {/* Left: Chinese traditional temple / pagoda */}
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=1200&q=80')`,
              }}
            />
            {/* Right: Modern illuminated suspension bridge with red cables */}
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80')`,
              }}
            />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          
          {/* Main Title */}
          <h1 className={`font-black text-white tracking-tight leading-[1.15] ${isHome ? 'text-3xl sm:text-5xl lg:text-6xl' : 'text-2xl sm:text-3xl'}`}>
            Bienvenue dans <br className="sm:hidden" />
            <span className="text-red-500">QIAO</span> <span translate="no">Community</span>
          </h1>

          {isHome && (
          <>
          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-200 font-medium max-w-2xl mx-auto leading-relaxed">
            Le réseau qui connecte la Chine et l'Afrique du Nord. <br className="hidden sm:inline" />
            Échangez, collaborez et créez des opportunités ensemble.
          </p>

          </>
          )}

          {/* Search bar */}
          <div className={`${isHome ? 'mt-8' : 'mt-5'} max-w-2xl mx-auto`}>
            <div className="relative flex items-center bg-white rounded-full shadow-2xl p-1.5 sm:p-2 border border-white/20 focus-within:ring-4 focus-within:ring-red-500/20 transition-all">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runSearch();
                }}
                placeholder="Rechercher des membres, experts, communautés, discussions..."
                className="w-full pl-5 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={runSearch}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 cursor-pointer"
                title="Lancer la recherche"
                aria-label="Rechercher"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>

          {isHome && (
          <>
          {/* Actions principales */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => {
                navigateCommunity('home');
                setTimeout(() => window.dispatchEvent(new CustomEvent('qiao:compose', { detail: 'post' })), 50);
              }}
              className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-red-600/40 transition-all cursor-pointer"
            >
              Créer une publication
            </button>
            <button
              onClick={() => navigateCommunity('communities')}
              className="px-5 py-2.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Découvrir les communautés
            </button>
          </div>

          {/* 4 Stats in a row */}
          <div className="mt-10 sm:mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-12 lg:gap-16 text-left">
            
            {/* 10,000+ Membres actifs */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-white leading-none">
                  {formatCount(stats?.members)}
                </div>
                <div className="text-xs text-slate-300 mt-1 font-medium">
                  Membres actifs
                </div>
              </div>
            </div>

            {/* 120+ Pays connectés */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-white leading-none">
                  {formatCount(stats?.countries)}
                </div>
                <div className="text-xs text-slate-300 mt-1 font-medium">
                  Pays connectés
                </div>
              </div>
            </div>

            {/* 850+ Entreprises */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-white leading-none">
                  {formatCount(stats?.companies)}
                </div>
                <div className="text-xs text-slate-300 mt-1 font-medium">
                  Entreprises
                </div>
              </div>
            </div>

            {/* 300+ Experts */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Handshake className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-white leading-none">
                  {formatCount(stats?.experts)}
                </div>
                <div className="text-xs text-slate-300 mt-1 font-medium">
                  Experts
                </div>
              </div>
            </div>

          </div>

          </>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* NAVIGATION INTERNE COMMUNITY                                              */}
      {/* ========================================================================= */}
      <nav className="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateCommunity(item.route)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    item.active ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                  {'count' in item && item.count ? (
                    <span className="px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold">{item.count}</span>
                  ) : null}
                </button>
              );
            })}
            {!user && (
              <button
                onClick={() => requireAuth(() => undefined, 'Connectez-vous ou créez votre compte QIAO pour participer à la communauté.')}
                className="ml-auto px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                Rejoindre QIAO Community
              </button>
            )}
          </div>
        </div>
      </nav>

      {!isHome && (
        <section className="py-8 sm:py-10 bg-slate-50/70 border-b border-slate-200 min-h-[60vh]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{renderView()}</div>
        </section>
      )}

      {isHome && (
      <>
      {/* ========================================================================= */}
      {/* 2. SECTION: "Choisissez votre communauté"                                 */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Choisissez votre communauté
            </h2>
            <div className="w-12 h-1 bg-red-600 rounded-full mx-auto mt-2" />
          </div>

          {/* Carousel container with right scroll button */}
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
            >
              {carouselCommunities.length === 0 && (
                <div className="w-full py-6 flex items-center justify-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-red-600" /> Chargement des communautés...
                </div>
              )}
              {carouselCommunities.map((community) => {
                const isMember = community.membership.state === 'active';

                return (
                  <button
                    key={community.id}
                    onClick={() => navigateCommunity(`c/${community.slug}`)}
                    className={`shrink-0 w-44 sm:w-48 bg-white border rounded-2xl p-4 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
                      isMember
                        ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-slate-100 text-slate-800">
                      <CommunityIcon name={community.icon} className="w-6 h-6 text-slate-800" />
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        {community.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">
                        {formatCount(community.membersCount)} membre{community.membersCount > 1 ? 's' : ''}
                      </p>
                      <div className="mt-1.5 flex justify-center">
                        {isMember ? (
                          <span className="text-[10px] font-bold text-emerald-700">✓ Membre</span>
                        ) : community.membership.state === 'pending' ? (
                          <span className="text-[10px] font-bold text-amber-700">Demande en attente</span>
                        ) : community.membership.state === 'invited' ? (
                          <span className="text-[10px] font-bold text-red-600">Invitation reçue</span>
                        ) : community.visibility !== 'public' ? (
                          <VisibilityBadge visibility={community.visibility} />
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right chevron circle button */}
            <button
              onClick={() => scrollCarousel('right')}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-slate-300 shadow-md text-slate-700 hover:text-red-600 hover:border-red-500 flex items-center justify-center transition-all z-10 cursor-pointer"
              title="Faire défiler"
              aria-label="Faire défiler les communautés"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigateCommunity('communities')}
              className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              Découvrir toutes les communautés <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN SECTION: 2 COLUMNS (Feed + Sidebar)                               */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: Discussions & publications (8 cols) */}
            <div className="lg:col-span-8">
              <FeedSection showDiscover />
            </div>

            {/* RIGHT COLUMN: Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">

              {/* Widget 1: Experts & membres à découvrir */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Experts & membres à découvrir
                  </h3>
                  <button
                    onClick={() => (experts.length > 4 ? setShowAllExperts(!showAllExperts) : navigateCommunity('experts'))}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    {showAllExperts ? 'Réduire' : `Voir tout (${experts.length})`}
                  </button>
                </div>

                <div className="space-y-4">
                  {visibleExperts.length === 0 && <p className="text-xs text-slate-400">Aucune recommandation pour le moment.</p>}
                  {visibleExperts.map((expert) => (
                    <div key={expert.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={expert.avatarUrl} name={expert.fullName} className="w-10 h-10 border border-slate-200" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            <MemberName member={expert} />
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate">
                            {expert.headline}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 mt-0.5 truncate">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{expert.reason}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleFollow(expert)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          expert.isFollowing
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {expert.isFollowing ? '✓ Suivi' : 'Suivre'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 text-center">
                  <button
                    onClick={() => navigateCommunity('experts')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Rechercher un expert (avocat, transitaire, traducteur...)
                  </button>
                </div>
              </div>

              {/* Widget 2: Activité récente */}
              {user && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-red-600" /> Activité récente
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {activity.length === 0 && (
                      <p className="text-xs text-slate-400">Rejoignez des communautés et participez : les réponses et nouveautés apparaîtront ici.</p>
                    )}
                    {activity.slice(0, 6).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          const target = item.link ? routeFromLink(item.link) : null;
                          if (target) navigateCommunity(target);
                        }}
                        className="w-full text-left flex items-start gap-2.5 group cursor-pointer"
                      >
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.read ? 'bg-slate-300' : 'bg-red-600'}`} />
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-slate-900 leading-tight group-hover:text-red-600 transition-colors">{item.title}</span>
                          <span className="block text-[11px] text-slate-500 truncate">{item.body}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">{timeAgo(item.createdAt, 'long')}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Widget 3: Événements à venir */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Événements à venir
                  </h3>
                  <button
                    onClick={() => onNavigate('stories')}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    Voir tout
                  </button>
                </div>

                <div className="space-y-4">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => onNavigate('evenements')}
                      className="flex items-start gap-3 cursor-pointer group"
                    >
                      {/* Date Badge: JUIN / 05 */}
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0 text-center shadow-2xs">
                        <span className="text-[9px] font-black text-red-600 tracking-wider">
                          {ev.monthYear.split(' ')[0]}
                        </span>
                        <span className="text-sm font-black text-slate-900 leading-none">
                          {ev.dateRange.split(' ')[0]}
                        </span>
                      </div>

                      {/* Event Details */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight group-hover:text-red-600 transition-colors">
                          {ev.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{ev.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{ev.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 text-center">
                  <button
                    onClick={() => onNavigate('stories')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Voir tous les événements
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BANNER: "QIAO Connect"                                                 */}
      {/* ========================================================================= */}
      <section className="py-10 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#030d21] via-[#051536] to-[#040f29] text-white p-6 sm:p-10 shadow-xl border border-slate-800">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Heading + CTA */}
              <div className="lg:col-span-5 flex items-start gap-4">
                {/* Red Circular Icon with concentric rings */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center shrink-0 shadow-lg text-red-500">
                  <Users className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black tracking-widest text-slate-300 uppercase">
                      QIAO Connect
                    </span>
                    <div className="h-0.5 w-10 bg-red-600 rounded-full" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    Trouvez les bonnes personnes pour votre projet
                  </h2>

                  <p className="mt-2 text-xs text-slate-300 leading-relaxed font-light">
                    Notre réseau et notre algorithme vous mettent en relation avec les partenaires et experts qu'il vous faut.
                  </p>

                  <div className="mt-5">
                    <button
                      onClick={() => {
                        setConnectSent(false);
                        setConnectForm((current) => ({ ...current, fullName: user?.fullName ?? current.fullName, email: user?.email ?? current.email }));
                        setConnectModalOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-red-600/40 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Rechercher un contact</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: 4 Steps */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-8">
                
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 text-sky-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-white leading-snug">
                    Décrivez <br /> votre besoin
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 text-red-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-white leading-snug">
                    Nous trouvons les bons profils
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 text-amber-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-white leading-snug">
                    Échangez & <br /> collaborez
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 text-emerald-400">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-white leading-snug">
                    Créez des opportunités réelles
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION: "Histoires de succès"                                         */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Histoires de succès
                </h2>
                <div className="h-0.5 w-10 bg-red-600 rounded-full" />
              </div>
            </div>

            <button
              onClick={() => onNavigate('about')}
              className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
            >
              Voir toutes les histoires
            </button>
          </div>

          {/* 3 Story Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story) => (
              <div
                key={story.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="h-44 sm:h-48 overflow-hidden bg-slate-100">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-5">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-red-600 transition-colors">
                      {story.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed font-normal">
                      {story.subtitle}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    onClick={() => setSelectedStory(story)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Lire l'histoire</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
      </>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: QIAO Connect Matching                                           */}
      {/* ========================================================================= */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setConnectModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                QIAO Connect • Mise en relation
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Précisez le type de profil ou de partenaire recherché (secteur, pays, volume ou compétences requises). Notre algorithme et nos conseillers vous orienteront vers les contacts les plus pertinents.
            </p>

            {connectSent ? (
              <div className="py-6 text-center space-y-2">
                <Check className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900">Demande enregistrée</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Un conseiller QIAO vous proposera des contacts qualifiés sous 24h
                  {user ? ' — suivi disponible dans votre espace membre.' : '.'}
                </p>
                <button
                  onClick={() => setConnectModalOpen(false)}
                  className="mt-2 px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : (
            <form onSubmit={handleConnectRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type de profil recherché
                </label>
                <select
                  value={connectForm.profileType}
                  onChange={(e) => setConnectForm({ ...connectForm, profileType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-white"
                >
                  {PROFILE_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>

              {!user && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    required
                    value={connectForm.fullName}
                    onChange={(e) => setConnectForm({ ...connectForm, fullName: e.target.value })}
                    placeholder="Nom complet *"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                  <input
                    required
                    type="email"
                    value={connectForm.email}
                    onChange={(e) => setConnectForm({ ...connectForm, email: e.target.value })}
                    placeholder="E-mail *"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description succincte de votre projet
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  value={connectForm.description}
                  onChange={(e) => setConnectForm({ ...connectForm, description: e.target.value })}
                  placeholder="Ex : Recherche d'une usine de panneaux solaires à Ningbo avec certification TUV pour projet de 5MW en Tunisie..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={connectSending}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  {connectSending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Envoyer ma demande
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: Success Story Reader                                            */}
      {/* ========================================================================= */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <div className="h-52 relative">
              <img src={selectedStory.image} alt={selectedStory.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <h3 className="text-lg font-bold leading-tight">{selectedStory.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{selectedStory.subtitle}</p>
              </div>
            </div>

            <div className="p-6">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {selectedStory.fullText}
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedStory(null)}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. FOOTER SECTION                                                         */}
      {/* ========================================================================= */}
      <footer className="bg-[#051126] text-white pt-16 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
            
            {/* Column 1: Logo & Manifesto (4 cols) */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center p-1.5 border border-white/20">
                  <Logo />
                </div>
                <div>
                  <span className="text-xl font-black tracking-wider text-white block">QIAO</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 block -mt-1 font-semibold">
                    THE BRIDGE BETWEEN CHINA & NORTH AFRICA
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400 leading-relaxed font-light max-w-sm">
                QIAO connecte les entreprises, les institutions et les talents entre la Chine et l'Afrique du Nord pour construire ensemble un avenir prospère.
              </p>

              {/* Social icons */}
              <div className="mt-6 flex items-center gap-3 text-slate-400">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors">
                  <span className="text-xs font-bold">in</span>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors">
                  <span className="text-xs font-bold">fb</span>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors">
                  <span className="text-xs font-bold">yt</span>
                </a>
                <a href="https://x.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors">
                  <span className="text-xs font-bold">𝕏</span>
                </a>
              </div>
            </div>

            {/* Column 2: À propos (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                À propos
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">
                    Qui sommes-nous
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">
                    Notre mission
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">
                    Notre équipe
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">
                    Carrières
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Services (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Services
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer">
                    Conseil stratégique
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer">
                    Développement business
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer">
                    Investissement
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer">
                    Accompagnement
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Ressources (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Ressources
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <button onClick={() => onNavigate('intelligence')} className="hover:text-white transition-colors cursor-pointer">
                    Blog
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('resources')} className="hover:text-white transition-colors cursor-pointer">
                    Guides & Rapports
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('intelligence')} className="hover:text-white transition-colors cursor-pointer">
                    Études de marché
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('resources')} className="hover:text-white transition-colors cursor-pointer">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 5: Support (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Support
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer">
                    Centre d'aide
                  </button>
                </li>
                <li>
                  <button onClick={() => openLegal('terms')} className="hover:text-white transition-colors cursor-pointer">
                    Conditions d'utilisation
                  </button>
                </li>
                <li>
                  <button onClick={() => openLegal('privacy')} className="hover:text-white transition-colors cursor-pointer">
                    Politique de confidentialité
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer">
                    Nous contacter
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div>© {new Date().getFullYear()} QIAO. Tous droits réservés.</div>
            <div className="flex items-center gap-1">
              <span>Conçu avec</span>
              <span className="text-red-500">❤️</span>
              <span>pour connecter les mondes.</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
