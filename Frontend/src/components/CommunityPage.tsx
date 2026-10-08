import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  Globe,
  Building2,
  Handshake,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Plus,
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  FileText,
  Target,
  Trophy,
  Calendar,
  MapPin,
  Clock,
  Check,
  TrendingUp,
  GraduationCap,
  Lightbulb,
  Send,
  X,
  Sparkles,
  UserCheck,
  Compass,
  Briefcase,
  Loader2
} from 'lucide-react';
import { AppTab } from '../types';
import { Logo } from './Logo';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { CommunityPost, Expert, PostComment, QiaoEvent } from '../lib/models';
import { initials, timeAgo } from '../lib/text';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppActions } from '../context/AppActionsContext';

interface CommunityPageProps {
  onNavigate: (tab: AppTab) => void;
  onOpenRegister?: () => void;
  onOpenContact?: () => void;
}

type PostItem = CommunityPost;

const PROFILE_TYPES = [
  'Fournisseur / Fabricant chinois vérifié',
  'Distributeur / Importateur Afrique du Nord',
  "Investisseur / Fonds d'investissement",
  'Expert juridique ou fiscal international',
  'Transitaire & Partenaire Logistique',
];

const Avatar: React.FC<{ src: string | null; name: string; className: string }> = ({ src, name, className }) =>
  src ? (
    <img src={src} alt={name} className={`${className} rounded-full object-cover`} />
  ) : (
    <span className={`${className} rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[11px]`}>
      {initials(name)}
    </span>
  );

export const CommunityPage: React.FC<CommunityPageProps> = ({
  onNavigate,
  onOpenRegister,
  onOpenContact,
}) => {
  const { user, requireAuth } = useAuth();
  const { notify } = useToast();
  const { openLegal } = useAppActions();

  // Filters & State
  const [activeTab, setActiveTab] = useState<'Tout' | 'À la une' | 'Questions' | 'Offres' | 'Actualités'>('Tout');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [showMorePosts, setShowMorePosts] = useState(false);
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<{ title: string; subtitle: string; fullText: string; image: string } | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [showAllExperts, setShowAllExperts] = useState(false);

  // New post form state
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Business');
  const [newPostTag, setNewPostTag] = useState('Opportunité');
  const [newPostCommunity, setNewPostCommunity] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Comments
  const [openComments, setOpenComments] = useState<Record<string, PostComment[] | 'loading'>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  // QIAO Connect
  const [connectForm, setConnectForm] = useState({ profileType: PROFILE_TYPES[0], description: '', fullName: '', email: '' });
  const [connectSending, setConnectSending] = useState(false);
  const [connectSent, setConnectSent] = useState(false);

  // Recherche appliquée après une courte pause de frappe.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

// Community categories
  const categories = [
    {
      id: 'business',
      title: 'Business & Entrepreneurs',
      members: '1,245 membres',
      icon: Users,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'trade',
      title: 'China–North Africa Trade',
      members: '1,876 membres',
      icon: Handshake,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'investment',
      title: 'Investissement',
      members: '965 membres',
      icon: TrendingUp,
      color: 'bg-red-50 text-red-600',
    },
    {
      id: 'students',
      title: 'Étudiants & Formation',
      members: '1,102 membres',
      icon: GraduationCap,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'expats',
      title: 'Expatriés & Relocation',
      members: '789 membres',
      icon: MapPin,
      color: 'bg-teal-50 text-teal-700',
    },
    {
      id: 'culture',
      title: 'Culture & Langues',
      members: '1,050 membres',
      icon: MessageSquare,
      color: 'bg-purple-50 text-purple-700',
    },
    {
      id: 'tech',
      title: 'Technologie & Innovation',
      members: '723 membres',
      icon: Lightbulb,
      color: 'bg-sky-50 text-sky-700',
    },
  ];

  // Carousel ref
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Posts Feed (API : /community/posts, filtres appliqués côté serveur)
  const {
    data: feed,
    setData: setFeed,
    loading: postsLoading,
    reload: reloadPosts,
  } = useApi<{ items: PostItem[]; total: number }>('/community/posts', {
    filter: activeTab,
    viewer: user?.id,
    q: appliedQuery || undefined,
    community: selectedCommunity ?? undefined,
    limit: showMorePosts ? undefined : 3,
  });
  const posts = feed?.items ?? [];
  const totalPosts = feed?.total ?? 0;

  const updatePost = useCallback(
    (postId: string, patch: Partial<PostItem>) =>
      setFeed((current) =>
        current ? { ...current, items: current.items.map((p) => (p.id === postId ? { ...p, ...patch } : p)) } : current,
      ),
    [setFeed],
  );

  // Experts list
  const { data: experts = [], setData: setExperts } = useApi<Expert[]>(
    '/community/experts',
    { viewer: user?.id },
    [],
  );

  // Events list
  const { data: events = [] } = useApi<QiaoEvent[]>('/events', { placement: 'community' }, []);

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
        'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
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

  // Post Interaction Handlers
  const handleToggleLike = (postId: string) =>
    requireAuth(async () => {
      try {
        const result = await api.post<{ liked: boolean; likes: number }>(`/community/posts/${postId}/like`);
        updatePost(postId, { isLiked: result.liked, likes: result.likes });
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Action impossible.', 'error');
      }
    }, 'Connectez-vous pour réagir aux publications.');

  const handleToggleBookmark = (postId: string) =>
    requireAuth(async () => {
      try {
        const result = await api.post<{ bookmarked: boolean }>(`/community/posts/${postId}/bookmark`);
        updatePost(postId, { isBookmarked: result.bookmarked });
        notify(result.bookmarked ? 'Publication enregistrée dans votre espace.' : 'Publication retirée de vos favoris.');
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Action impossible.', 'error');
      }
    }, 'Connectez-vous pour enregistrer des publications.');

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?tab=community#post-${postId}`;
    navigator.clipboard?.writeText(url).catch(() => undefined);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  const toggleComments = async (postId: string) => {
    if (openComments[postId]) {
      setOpenComments(({ [postId]: _closed, ...rest }) => rest);
      return;
    }
    setOpenComments((current) => ({ ...current, [postId]: 'loading' }));
    try {
      const comments = await api.get<PostComment[]>(`/community/posts/${postId}/comments`);
      setOpenComments((current) => ({ ...current, [postId]: comments }));
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Chargement impossible.', 'error');
      setOpenComments(({ [postId]: _failed, ...rest }) => rest);
    }
  };

  const handleAddComment = (postId: string) =>
    requireAuth(async () => {
      const text = (commentDrafts[postId] ?? '').trim();
      if (!text) return;
      try {
        const result = await api.post<{ comment: PostComment; commentsCount: number }>(`/community/posts/${postId}/comments`, { text });
        setCommentDrafts((current) => ({ ...current, [postId]: '' }));
        setOpenComments((current) => {
          const list = current[postId];
          return { ...current, [postId]: [...(Array.isArray(list) ? list : []), result.comment] };
        });
        const post = posts.find((p) => p.id === postId);
        updatePost(postId, {
          commentsCount: result.commentsCount,
          comments: [...(post?.comments ?? []), result.comment].slice(-3),
        });
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Commentaire non publié.', 'error');
      }
    }, 'Connectez-vous pour commenter.');

  const handleToggleConnect = (expertId: string) =>
    requireAuth(async () => {
      try {
        const result = await api.post<{ connected: boolean }>(`/community/experts/${expertId}/connect`);
        setExperts((current) => (current ?? []).map((e) => (e.id === expertId ? { ...e, connected: result.connected } : e)));
        const expert = experts.find((e) => e.id === expertId);
        notify(result.connected ? `Demande de connexion envoyée à ${expert?.name}.` : `Connexion avec ${expert?.name} retirée.`);
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Action impossible.', 'error');
      }
    }, 'Connectez-vous pour vous connecter aux experts.');

  const openNewPost = () => requireAuth(() => setNewPostModalOpen(true), 'Connectez-vous pour publier dans la communauté.');

  // Submit new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setPublishing(true);
    try {
      await api.post('/community/posts', {
        content: newPostContent,
        category: newPostCategory,
        tag: newPostTag || undefined,
        community: newPostCommunity || undefined,
      });
      setNewPostContent('');
      setNewPostModalOpen(false);
      setActiveTab('Tout');
      setSelectedCommunity(null);
      setSearchQuery('');
      notify('Votre publication est en ligne !');
      reloadPosts();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Publication impossible.', 'error');
    } finally {
      setPublishing(false);
    }
  };

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

  const filteredPosts = posts;
  const visibleExperts = showAllExperts ? experts : experts.slice(0, 4);
  const selectedCommunityTitle = categories.find((c) => c.id === selectedCommunity)?.title;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased overflow-x-hidden pt-20 sm:pt-24 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Lien de la publication copié dans le presse-papiers !</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTION ("Bienvenue dans QIAO Community")                         */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#071329] text-white py-16 sm:py-24 border-b border-slate-800">
        
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
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Bienvenue dans <br className="sm:hidden" />
            <span className="text-red-500">QIAO</span> Community
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-200 font-medium max-w-2xl mx-auto leading-relaxed">
            Le réseau qui connecte la Chine et l'Afrique du Nord. <br className="hidden sm:inline" />
            Échangez, collaborez et créez des opportunités ensemble.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-full shadow-2xl p-1.5 sm:p-2 border border-white/20 focus-within:ring-4 focus-within:ring-red-500/20 transition-all">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setAppliedQuery(searchQuery.trim());
                    document.getElementById('community-feed')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                placeholder="Rechercher des membres, entreprises, discussions..."
                className="w-full pl-5 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setAppliedQuery(searchQuery.trim());
                  document.getElementById('community-feed')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 cursor-pointer"
                title="Lancer la recherche"
                aria-label="Rechercher"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
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
                  10,000+
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
                  120+
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
                  850+
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
                  300+
                </div>
                <div className="text-xs text-slate-300 mt-1 font-medium">
                  Experts
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

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
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCommunity === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCommunity(isSelected ? null : cat.id);
                      setShowMorePosts(true);
                      document.getElementById('community-feed')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`shrink-0 w-44 sm:w-48 bg-white border rounded-2xl p-4 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
                      isSelected
                        ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-slate-100 text-slate-800">
                      <IconComponent className="w-6 h-6 text-slate-800" />
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        {cat.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">
                        {cat.members}
                      </p>
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

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN SECTION: 2 COLUMNS (Feed + Sidebar)                               */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Discussions & publications (8 cols) */}
            <div id="community-feed" className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs scroll-mt-28">
              
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Discussions & publications
                </h2>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                    {(['Tout', 'À la une', 'Questions', 'Offres', 'Actualités'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          activeTab === tab
                            ? 'bg-red-50 text-red-600 font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* + Nouvelle publication Button */}
                  <button
                    onClick={openNewPost}
                    className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nouvelle publication</span>
                  </button>
                </div>
              </div>

              {/* Active Search / Category Indicator */}
              {(searchQuery || selectedCommunity) && (
                <div className="mt-4 flex items-center justify-between bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs">
                  <span className="text-slate-600">
                    Filtre actif : <strong className="text-slate-900">{[selectedCommunityTitle, searchQuery].filter(Boolean).join(' · ')}</strong>
                    <span className="text-slate-400"> — {totalPosts} publication{totalPosts > 1 ? 's' : ''}</span>
                  </span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setAppliedQuery('');
                      setSelectedCommunity(null);
                    }}
                    className="text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    Réinitialiser
                  </button>
                </div>
              )}

              {/* Feed List */}
              <div className="divide-y divide-slate-100 mt-2">
                {postsLoading && posts.length === 0 ? (
                  <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin text-red-600" /> Chargement des publications...
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">Aucune publication trouvée pour cette recherche.</p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <article key={post.id} id={`post-${post.id}`} className="py-5 sm:py-6 first:pt-4">
                      
                      {/* Post Header: Avatar, Name, Time */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar src={post.avatar} name={post.author} className="w-10 h-10 border border-slate-200 shadow-2xs" />
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">
                              {post.author}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {post.role} • {post.location}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs text-slate-400 font-medium">
                          {timeAgo(post.createdAt)}
                        </span>
                      </div>

                      {/* Post Content */}
                      <p className="mt-3 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                        {post.content}
                      </p>

                      {/* Tags */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {post.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Post Actions: Like, Comment, Share, Bookmark */}
                      <div className="mt-4 flex items-center justify-between pt-2 text-slate-500 text-xs">
                        <div className="flex items-center gap-4 sm:gap-6">
                          
                          {/* Like */}
                          <button
                            onClick={() => handleToggleLike(post.id)}
                            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                              post.isLiked ? 'text-red-600 font-bold' : 'hover:text-slate-900'
                            }`}
                          >
                            <ThumbsUp className={`w-4 h-4 ${post.isLiked ? 'fill-red-600' : ''}`} />
                            <span>{post.likes}</span>
                          </button>

                          {/* Comments */}
                          <button
                            onClick={() => toggleComments(post.id)}
                            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                              openComments[post.id] ? 'text-slate-900 font-bold' : 'hover:text-slate-900'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.commentsCount}</span>
                          </button>

                          {/* Partager */}
                          <button
                            onClick={() => handleShare(post.id)}
                            className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Partager</span>
                          </button>
                        </div>

                        {/* Bookmark */}
                        <button
                          onClick={() => handleToggleBookmark(post.id)}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${
                            post.isBookmarked ? 'text-red-600' : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title="Enregistrer"
                          aria-label="Enregistrer la publication"
                        >
                          <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-red-600' : ''}`} />
                        </button>
                      </div>

                      {/* Inline Comments thread (aperçu ou fil complet ouvert) */}
                      {(() => {
                        const thread = openComments[post.id];
                        const comments = Array.isArray(thread) ? thread : post.comments;
                        if (!thread && comments.length === 0) return null;
                        return (
                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                            {thread === 'loading' && (
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement des commentaires...
                              </div>
                            )}
                            {comments.map((c) => (
                              <div key={c.id} className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-2.5 text-xs">
                                <Avatar src={c.avatar} name={c.author} className="w-6 h-6 mt-0.5 !text-[9px]" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900">{c.author}</span>
                                    <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
                                  </div>
                                  <p className="text-slate-700 text-[11px] mt-0.5 leading-snug">{c.text}</p>
                                </div>
                              </div>
                            ))}
                            {!thread && post.commentsCount > comments.length && (
                              <button
                                onClick={() => toggleComments(post.id)}
                                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                              >
                                Voir les {post.commentsCount} commentaires
                              </button>
                            )}
                            {thread && thread !== 'loading' && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleAddComment(post.id);
                                }}
                                className="flex items-center gap-2"
                              >
                                <input
                                  value={commentDrafts[post.id] ?? ''}
                                  onChange={(e) => setCommentDrafts((current) => ({ ...current, [post.id]: e.target.value }))}
                                  placeholder={user ? 'Écrire un commentaire...' : 'Connectez-vous pour commenter'}
                                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-red-500"
                                />
                                <button
                                  type="submit"
                                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center cursor-pointer"
                                  aria-label="Publier le commentaire"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })()}

                    </article>
                  ))
                )}
              </div>

              {/* Bottom "Voir plus de publications ⌵" */}
              {(showMorePosts ? totalPosts > 3 : totalPosts > posts.length) && (
                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setShowMorePosts(!showMorePosts)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>
                      {showMorePosts ? 'Voir moins de publications' : `Voir plus de publications (${totalPosts - posts.length}) ⌵`}
                    </span>
                  </button>
                </div>
              )}

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
                    onClick={() => setShowAllExperts(!showAllExperts)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    {showAllExperts ? 'Réduire' : `Voir tout (${experts.length})`}
                  </button>
                </div>

                <div className="space-y-4">
                  {visibleExperts.map((expert) => (
                    <div key={expert.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={expert.avatar}
                          alt={expert.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {expert.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate">
                            {expert.role}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 mt-0.5">
                            <span>{expert.flag}</span>
                            <span>{expert.country}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleConnect(expert.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          expert.connected
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {expert.connected ? '✓ Connecté' : 'Se connecter'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 2: Événements à venir */}
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

      {/* ========================================================================= */}
      {/* 6. MODAL: Nouvelle Publication                                            */}
      {/* ========================================================================= */}
      {newPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setNewPostModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Créer une publication
              </h3>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Avatar src={user?.avatarUrl ?? null} name={user?.fullName ?? ''} className="w-8 h-8" />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">{user?.fullName}</div>
                  <div className="text-slate-500">{user?.title ?? 'Membre QIAO'} • {user?.location ?? 'Afrique du Nord'}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Votre message / opportunité
                </label>
                <textarea
                  rows={4}
                  required
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Partagez un besoin d'approvisionnement, une offre de partenariat, ou posez une question à la communauté..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Business">Business</option>
                    <option value="Questions">Questions</option>
                    <option value="Offres">Offres</option>
                    <option value="Actualités">Actualités</option>
                    <option value="À la une">À la une</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tag principal
                  </label>
                  <input
                    type="text"
                    value={newPostTag}
                    onChange={(e) => setNewPostTag(e.target.value)}
                    placeholder="ex: Import/Export"
                    maxLength={40}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Communauté (optionnel)
                </label>
                <select
                  value={newPostCommunity}
                  onChange={(e) => setNewPostCommunity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Toutes les communautés</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewPostModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Publier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
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
