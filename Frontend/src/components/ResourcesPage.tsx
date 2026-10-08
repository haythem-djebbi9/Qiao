import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  FileText,
  FileCode,
  FileSpreadsheet,
  Play,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Scale,
  BarChart3,
  Video,
  Wrench,
  Users,
  Compass,
  Building2,
  Globe,
  Briefcase,
  Layers,
  Crown,
  Lock,
  Mail,
  Send,
  CheckCircle2,
  X,
  Linkedin,
  Youtube,
  Clock,
  Sparkles,
  Bookmark,
  Share2,
  FileCheck,
  TrendingUp,
  Target,
  Loader2
} from 'lucide-react';
import { AppTab } from '../types';
import { Logo } from './Logo';
import ressourcesPageBg from '../assets/images/ressources_page_bg.jpg';
import { useApi } from '../hooks/useApi';
import { useDownloads } from '../hooks/useDownloads';
import { api } from '../lib/api';
import { QiaoDocument } from '../lib/models';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppActions } from '../context/AppActionsContext';

interface ResourcesPageProps {
  onNavigate: (tab: AppTab | string) => void;
  onOpenRegister?: () => void;
  onSelectSector?: (sectorId: string) => void;
  onOpenCalculator?: () => void;
}

type ResourceItem = QiaoDocument;
type BrowseMode = 'all' | 'recent' | 'popular' | 'premium' | null;

export const ResourcesPage: React.FC<ResourcesPageProps> = ({
  onNavigate,
  onOpenRegister,
  onSelectSector,
  onOpenCalculator,
}) => {
  const { user } = useAuth();
  const { notify } = useToast();
  const { openDocument, openLegal } = useAppActions();
  const { downloadDocument, pending } = useDownloads();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [activeNeedFilter, setActiveNeedFilter] = useState<string | null>(null);
  const [activeCountryFilter, setActiveCountryFilter] = useState<string | null>(null);
  const [browseMode, setBrowseMode] = useState<BrowseMode>(null);

  // Modals state
  const [selectedVideo, setSelectedVideo] = useState<ResourceItem | null>(null);
  const [replaySent, setReplaySent] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ title: '', email: '', details: '' });
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAppliedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Popular search tags
  const popularSearches = [
    'Guide importation',
    'Modèle de contrat',
    'Réglementation Tunisie',
    'Étude marché Maroc',
    'Fournisseurs Chine',
  ];

  // 8 Categories matching screenshot exactly
  const categories = [
    {
      id: 'guides',
      title: 'Guides pratiques',
      subtitle: 'Des conseils étape par étape pour vos projets',
      image:
        'https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'etudes',
      title: 'Études & Rapports',
      subtitle: 'Des analyses fiables pour mieux décider',
      image:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'modeles',
      title: 'Modèles & Templates',
      subtitle: 'Des outils prêts à l\'emploi',
      image:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'reglementations',
      title: 'Réglementations & Normes',
      subtitle: 'Les textes et exigences clés',
      image:
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'statistiques',
      title: 'Données & Statistiques',
      subtitle: 'Des chiffres pour comprendre les marchés',
      image:
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'videos',
      title: 'Vidéos & Webinaires',
      subtitle: 'Apprendre avec des experts',
      image:
        'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'outils',
      title: 'Outils & Services',
      subtitle: 'Des solutions utiles pour votre activité',
      image:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'temoignages',
      title: 'Cas d\'usage & Témoignages',
      subtitle: 'Des expériences réelles qui inspirent',
      image:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    },
  ];

  // 5 Needs matching screenshot
  const needs = [
    {
      id: 'importer',
      verb: 'Importer',
      target: 'depuis la Chine',
      image:
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'exporter',
      verb: 'Exporter',
      target: 'vers l\'Afrique du Nord',
      image:
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'investir',
      verb: 'Investir',
      target: 'en Afrique du Nord',
      image:
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'partenaire',
      verb: 'Trouver',
      target: 'un partenaire',
      image:
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'implanter',
      verb: 'S\'implanter',
      target: 'dans la région',
      image:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    },
  ];

  // 6 Markets matching screenshot
  const markets = [
    { id: 'chine', name: 'Chine', flag: '🇨🇳', bg: 'bg-red-500/10' },
    { id: 'tunisie', name: 'Tunisie', flag: '🇹🇳', bg: 'bg-red-500/10' },
    { id: 'algerie', name: 'Algérie', flag: '🇩🇿', bg: 'bg-emerald-500/10' },
    { id: 'maroc', name: 'Maroc', flag: '🇲🇦', bg: 'bg-red-500/10' },
    { id: 'egypte', name: 'Égypte', flag: '🇪🇬', bg: 'bg-amber-500/10' },
    { id: 'libye', name: 'Libye', flag: '🇱🇾', bg: 'bg-emerald-500/10' },
  ];

  // Bibliothèque : données de l'API (table documents).
  const { data: heroItems = [] } = useApi<ResourceItem[]>('/documents', { section: 'resources-hero' }, []);
  const { data: recommendedItems = [] } = useApi<ResourceItem[]>('/documents', { section: 'resources-recommended' }, []);
  const { data: recentItems = [] } = useApi<ResourceItem[]>('/documents', { sort: 'recent', limit: 4 }, []);
  const { data: topViewedItems = [] } = useApi<ResourceItem[]>('/documents', { sort: 'popular', limit: 5 }, []);
  const { data: videoResources = [] } = useApi<ResourceItem[]>('/documents', { section: 'resources-videos' }, []);
  const recommendedHero = heroItems[0];

  const filtersActive =
    !!appliedQuery || !!activeCategoryFilter || !!activeNeedFilter || !!activeCountryFilter || browseMode !== null;
  const { data: results = [], loading: resultsLoading } = useApi<ResourceItem[]>(
    filtersActive ? '/documents' : null,
    {
      q: appliedQuery || undefined,
      category: activeCategoryFilter ?? undefined,
      need: activeNeedFilter ?? undefined,
      country: activeCountryFilter ?? undefined,
      sort: browseMode === 'popular' ? 'popular' : 'recent',
      premium: browseMode === 'premium' ? true : undefined,
    },
    [],
  );

  const resetFilters = () => {
    setSearchQuery('');
    setAppliedQuery('');
    setActiveCategoryFilter(null);
    setActiveNeedFilter(null);
    setActiveCountryFilter(null);
    setBrowseMode(null);
  };

  const showResults = (mode?: BrowseMode) => {
    if (mode !== undefined) setBrowseMode(mode);
    setTimeout(() => document.getElementById('resources-results')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleDownload = (item: ResourceItem) => {
    if (item.format === 'Vidéo') {
      openVideo(item);
      return;
    }
    downloadDocument(item.id, item.title);
  };

  const openVideo = (video: ResourceItem) => {
    setReplaySent(false);
    setSelectedVideo(video);
    api.post(`/documents/${video.id}/view`).catch(() => undefined);
  };

  const requestReplay = async () => {
    if (!selectedVideo) return;
    const email = user?.email ?? newsletterEmail;
    if (!email) {
      notify('Connectez-vous ou renseignez votre e-mail dans la newsletter pour recevoir le replay.', 'error');
      return;
    }
    setSending(true);
    try {
      await api.post('/documents/requests', { kind: 'replay', title: selectedVideo.title, email });
      setReplaySent(true);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Demande impossible.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.title || !requestForm.email) return;
    setSending(true);
    try {
      await api.post('/documents/requests', { kind: 'request', ...requestForm });
      setRequestSuccess(true);
      setTimeout(() => {
        setRequestSuccess(false);
        setRequestModalOpen(false);
        setRequestForm({ title: '', email: user?.email ?? '', details: '' });
      }, 2500);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Envoi impossible.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSending(true);
    try {
      const result = await api.post<{ alreadySubscribed: boolean }>('/newsletter/subscribe', {
        email: newsletterEmail,
        topic: 'resources',
        source: 'ressources',
      });
      setNewsletterSubscribed(true);
      if (result.alreadySubscribed) notify('Cette adresse est déjà abonnée aux nouvelles ressources.', 'info');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Inscription impossible.', 'error');
    } finally {
      setSending(false);
    }
  };

  const formatIcon = (item: ResourceItem) =>
    item.format === 'Vidéo' ? (
      <Video className="w-4 h-4 text-sky-600" />
    ) : item.format === 'DOCX' ? (
      <FileCode className="w-4 h-4 text-blue-600" />
    ) : item.format === 'XLSX' ? (
      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
    ) : (
      <FileText className="w-4 h-4 text-red-600" />
    );

  const activeFilterLabels = [
    appliedQuery && `« ${appliedQuery} »`,
    activeCategoryFilter,
    activeNeedFilter,
    activeCountryFilter,
    browseMode === 'premium' && 'Ressources Premium',
    browseMode === 'popular' && 'Les plus téléchargées',
    browseMode === 'recent' && 'Les plus récentes',
  ].filter(Boolean);

  return (
    <div className="w-full bg-white text-slate-900 font-sans min-h-screen">
      
      {/* ========================================================================= */}
      {/* 1. BREADCRUMB                                                             */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
          <button
            onClick={() => onNavigate('home')}
            className="text-red-600 font-bold hover:underline cursor-pointer"
          >
            QIAO
          </button>
          <span className="text-slate-400">›</span>
          <button
            onClick={() => onNavigate('secteurs')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Secteurs
          </button>
          <span className="text-slate-400">›</span>
          <button
            onClick={() => onNavigate('commerce-hub')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Commerce & E-commerce
          </button>
          <span className="text-slate-400">›</span>
          <span className="text-slate-900 font-bold">Ressources</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (Matching Ressources.png with panoramic background)       */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-slate-50 min-h-[460px] lg:min-h-[500px] flex items-center pt-6 pb-12 sm:pt-8 sm:pb-14 border-b border-slate-100">
        {/* Full-width Panoramic Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={ressourcesPageBg}
            alt="Ressources QIAO - Bibliothèque d'affaires et de commerce Chine - Afrique du Nord"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter contrast-105"
          />
          {/* Soft White Gradient strictly on the left to keep text crystal clear and legible */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-4/5 lg:w-3/5 bg-gradient-to-r from-white/95 via-white/85 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-white/10 pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl sm:max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0B1D3A] tracking-tight leading-none">
              Ressources
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0B1D3A] leading-snug">
              Des connaissances pour agir. Des opportunités pour grandir.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
              Accédez à une bibliothèque complète de ressources pratiques, d'analyses et d'outils
              pour réussir vos projets d'import-export, de commerce et d'investissement entre la Chine
              et l'Afrique du Nord.
            </p>

            {/* Search Bar Container */}
            <div className="pt-2">
              <div className="bg-white/95 backdrop-blur-xs border border-blue-200/90 rounded-xl p-1.5 shadow-2xs flex items-center gap-2 max-w-xl transition-all focus-within:ring-2 focus-within:ring-[#0B1D3A] focus-within:border-[#0B1D3A]">
                <Search className="w-5 h-5 text-slate-400 ml-2.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une ressource, un guide, un modèle, une étude..."
                  className="w-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none py-2"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-xs cursor-pointer"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setAppliedQuery(searchQuery.trim());
                    if (searchQuery.trim()) showResults();
                    else document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#0B1D3A] hover:bg-[#071324] text-white px-5 sm:px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-colors shadow-sm cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Rechercher</span>
                </button>
              </div>

              {/* Popular searches pills */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Recherches populaires :</span>
                {popularSearches.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(item);
                      setAppliedQuery(item);
                      showResults();
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-slate-200/90 shadow-2xs transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION: "Explorez nos ressources par catégorie"                        */}
      {/* ========================================================================= */}
      <section id="categories-section" className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Explorez nos ressources par catégorie
            </h2>
            <button
              onClick={() => {
                resetFilters();
                showResults('all');
              }}
              className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir toutes les catégories</span>
              <span>➔</span>
            </button>
          </div>

          {/* 8 Cards Grid (4 columns × 2 rows) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  const isActive = activeCategoryFilter === cat.title;
                  setActiveCategoryFilter(isActive ? null : cat.title);
                  if (!isActive) showResults();
                }}
                className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col justify-end p-5 min-h-[190px] shadow-sm hover:shadow-xl ${
                  activeCategoryFilter === cat.title
                    ? 'ring-2 ring-red-600 border-red-600'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Background Photo */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-70 contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex items-end justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-extrabold leading-snug text-white group-hover:text-red-400 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {cat.subtitle}
                    </p>
                  </div>

                  {/* Circular arrow button in bottom-right */}
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* RÉSULTATS DE RECHERCHE / FILTRES (bibliothèque complète)                  */}
      {/* ========================================================================= */}
      {filtersActive && (
        <section id="resources-results" className="py-10 bg-white border-t border-slate-200 scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {resultsLoading ? 'Recherche...' : `${results.length} ressource${results.length > 1 ? 's' : ''} trouvée${results.length > 1 ? 's' : ''}`}
                </h2>
                {activeFilterLabels.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">Filtres : {activeFilterLabels.join(' · ')}</p>
                )}
              </div>
              <button onClick={resetFilters} className="text-xs font-bold text-red-600 hover:underline cursor-pointer self-start sm:self-auto">
                Effacer les filtres ✕
              </button>
            </div>
            {resultsLoading && results.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-red-600" /> Chargement...
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-2xl text-sm text-slate-500 space-y-3">
                <p>Aucune ressource ne correspond. Notre équipe peut la rechercher pour vous.</p>
                <button
                  onClick={() => {
                    setRequestForm({ title: appliedQuery, email: user?.email ?? '', details: '' });
                    setRequestModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                >
                  Demander cette ressource
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm flex items-center justify-between gap-3 group transition-all"
                  >
                    <button onClick={() => (item.format === 'Vidéo' ? openVideo(item) : openDocument(item.id))} className="flex items-center gap-3 min-w-0 text-left cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">{formatIcon(item)}</div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-red-600 transition-colors">{item.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span>
                            {item.format} · {item.sizeLabel}
                          </span>
                          {item.premium && <Crown className="w-3 h-3 text-amber-500" />}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDownload(item)}
                      disabled={pending === item.id}
                      className="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer disabled:opacity-60"
                      title={item.format === 'Vidéo' ? 'Regarder' : 'Télécharger'}
                    >
                      {pending === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : item.format === 'Vidéo' ? <Play className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. TRIPLE COLUMN SECTION                                                  */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50 border-t border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMN 1: "Ressources recommandées" */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Ressources recommandées
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                    Sélection QIAO
                  </span>
                </div>
                <button
                  onClick={() => showResults('all')}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Voir plus</span>
                  <span>➔</span>
                </button>
              </div>

              {/* Big Hero Card */}
              {recommendedHero && (
              <div
                onClick={() => openDocument(recommendedHero.id)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={recommendedHero.image ?? undefined}
                    alt={recommendedHero.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-sky-50 text-sky-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-sky-200 shadow-sm">
                    {recommendedHero.category}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="text-base font-extrabold text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
                    {recommendedHero.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {recommendedHero.description}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-semibold border-t border-slate-100">
                    <span className="flex items-center gap-1 text-slate-600">
                      <FileText className="w-3.5 h-3.5 text-red-600" />
                      <span>{recommendedHero.format} · {recommendedHero.sizeLabel}</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(recommendedHero);
                      }}
                      disabled={pending === recommendedHero.id}
                      className="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
                      title="Télécharger"
                    >
                      {pending === recommendedHero.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* 4 Sub-list items */}
              <div className="space-y-2.5">
                {recommendedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm hover:border-slate-300 flex items-center justify-between gap-3 group transition-all"
                  >
                    <button
                      onClick={() => (item.format === 'Vidéo' ? openVideo(item) : openDocument(item.id))}
                      className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        {formatIcon(item)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate group-hover:text-red-600 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{item.format} · {item.sizeLabel}</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDownload(item)}
                      disabled={pending === item.id}
                      className="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer disabled:opacity-60"
                      title={item.format === 'Vidéo' ? 'Regarder' : 'Télécharger'}
                    >
                      {pending === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : item.format === 'Vidéo' ? <Play className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: "Ressources les plus récentes" */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Ressources les plus récentes
                </h3>
                <button
                  onClick={() => showResults('recent')}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Voir plus</span>
                  <span>➔</span>
                </button>
              </div>

              <div className="space-y-3">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm hover:border-slate-300 flex items-center justify-between gap-3 group transition-all"
                  >
                    <button onClick={() => openDocument(item.id)} className="flex items-center gap-3 min-w-0 text-left cursor-pointer">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          {formatIcon(item)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{item.format} · {item.sizeLabel}</span>
                          <span>•</span>
                          <span>{item.dateLabel}</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDownload(item)}
                      disabled={pending === item.id}
                      className="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer disabled:opacity-60"
                      title="Télécharger"
                    >
                      {pending === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 3: "Ressources les plus consultées" */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Ressources les plus consultées
                </h3>
              </div>

              <div className="space-y-3">
                {topViewedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm hover:border-slate-300 flex items-center justify-between gap-3 group transition-all"
                  >
                    <button onClick={() => openDocument(item.id)} className="flex items-center gap-3 min-w-0 text-left cursor-pointer">
                      {/* Rank Number */}
                      <span className="text-base font-black text-slate-900 w-4 text-center shrink-0">
                        {index + 1}
                      </span>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-100"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          {formatIcon(item)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate group-hover:text-red-600 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.downloadsLabel}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDownload(item)}
                      disabled={pending === item.id}
                      className="text-slate-400 group-hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      {pending === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TWO-COLUMN FILTER SECTION (Besoins & Marchés)                           */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left 6 cols: Ressources par besoin */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Ressources par besoin
                </h3>
                <button
                  onClick={() => setActiveNeedFilter(null)}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Voir tous les besoins</span>
                  <span>➔</span>
                </button>
              </div>

              {/* 5 Need cards horizontal row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {needs.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      const isActive = activeNeedFilter === item.verb;
                      setActiveNeedFilter(isActive ? null : item.verb);
                      if (!isActive) showResults();
                    }}
                    className={`rounded-xl overflow-hidden border p-2 flex flex-col justify-between min-h-[140px] cursor-pointer group transition-all ${
                      activeNeedFilter === item.verb
                        ? 'ring-2 ring-red-600 border-red-600'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="h-16 w-full rounded-lg overflow-hidden relative mb-2">
                      <img
                        src={item.image}
                        alt={item.verb}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="text-left space-y-0.5">
                      <div className="text-xs font-black text-slate-900 group-hover:text-red-600">
                        {item.verb}
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {item.target}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 cols: Ressources par marché */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Ressources par marché
                </h3>
                <button
                  onClick={() => setActiveCountryFilter(null)}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Voir tous les pays</span>
                  <span>➔</span>
                </button>
              </div>

              {/* 6 Circular flag cards */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {markets.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      const isActive = activeCountryFilter === m.name;
                      setActiveCountryFilter(isActive ? null : m.name);
                      if (!isActive) showResults();
                    }}
                    className={`rounded-2xl border p-3 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      activeCountryFilter === m.name
                        ? 'ring-2 ring-red-600 border-red-600 bg-red-50/50'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-2xl shadow-sm bg-white">
                      {m.flag}
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {m.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION: "QIAO Intelligence / Ressources Premium"                      */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#021330] via-[#061b40] to-[#041535] text-white py-14 lg:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 8 cols: Premium Badge & Content */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm tracking-wider uppercase">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>QIAO Intelligence</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Ressources Premium
              </h2>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Accédez à des contenus exclusifs, des analyses approfondies et des outils avancés
                pour prendre une longueur d'avance.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => (user ? showResults('premium') : onOpenRegister?.())}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm shadow-lg hover:shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Découvrir les ressources Premium</span>
                  <span>➔</span>
                </button>
              </div>

              {/* 5 Feature icons row */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-5 gap-3 border-t border-white/15">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Rapports exclusifs</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <BarChart3 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Données avancées</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <FileCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Templates premium</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Video className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Webinaires privés</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Accès anticipé</span>
                </div>
              </div>
            </div>

            {/* Right 4 cols: Business Executive looking at city skyline */}
            <div className="lg:col-span-4 relative flex justify-end">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 w-full max-w-sm aspect-[4/3] bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"
                  alt="Executive skyline"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover filter contrast-105 brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Vertical Badge on Right */}
                <div className="absolute top-4 right-4 bg-[#0B1D3A]/90 backdrop-blur-md p-2.5 rounded-lg border border-white/20 text-white text-[9px] sm:text-[10px] font-bold tracking-wider space-y-0.5 shadow-lg text-right">
                  <div>DES CONNAISSANCES</div>
                  <div>AU SERVICE</div>
                  <div className="text-amber-400">D'UN COMMERCE</div>
                  <div className="text-amber-400">PLUS FORT</div>
                  <div className="w-6 h-0.5 bg-red-600 rounded-full ml-auto mt-1" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BOTTOM ROW: 3 MODULES (Vidéos, Demande, Newsletter)                    */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Module 1: Ressources en vidéo (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Ressources en vidéo
                </h3>
                <button
                  onClick={() => {
                    setActiveCategoryFilter('Vidéos & Webinaires');
                    showResults();
                  }}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Voir toutes les vidéos</span>
                  <span>➔</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {videoResources.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => openVideo(vid)}
                    className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="relative h-20 w-full overflow-hidden">
                      <img
                        src={vid.image ?? undefined}
                        alt={vid.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-red-600">
                        {vid.title}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{vid.sizeLabel}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Module 2: Demander une ressource (3 cols) */}
            <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                  Demander une ressource
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Vous ne trouvez pas la ressource dont vous avez besoin ? Notre équipe peut la
                  rechercher ou la créer pour vous.
                </p>
              </div>

              <button
                onClick={() => {
                  setRequestForm((current) => ({ ...current, email: current.email || user?.email || '' }));
                  setRequestModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Faire une demande</span>
                <span>➔</span>
              </button>
            </div>

            {/* Module 3: Abonnez-vous à notre newsletter (4 cols) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                  Abonnez-vous à notre newsletter
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Recevez les nouvelles ressources, guides et études directement par email.
                </p>
              </div>

              {newsletterSubscribed ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                  ✓ Merci pour votre inscription !
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Votre adresse email"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    S'abonner
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. BANNER: "La connaissance crée des opportunités."                       */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#021330] via-[#061b40] to-[#041535] text-white py-12 lg:py-16">
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1920&q=80"
            alt="Skyline night"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 8 cols: CTA */}
            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                La connaissance crée des opportunités.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Rejoignez la communauté QIAO et accédez à des ressources qui font la différence entre
                la Chine et l'Afrique du Nord.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onOpenRegister}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg hover:shadow-red-600/30 transition-all cursor-pointer"
                >
                  Créer un compte
                </button>
                <button
                  onClick={() => onNavigate('secteurs')}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/25 text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  Explorer tous les secteurs
                </button>
              </div>
            </div>

            {/* Right 4 cols: 4 Pillars */}
            <div className="lg:col-span-4 space-y-3.5 border-t lg:border-t-0 lg:border-l border-white/15 pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold tracking-wide text-slate-200">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <Target className="w-4 h-4 text-sky-400" />
                </div>
                <span>DES RESSOURCES FIABLES</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold tracking-wide text-slate-200">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <Users className="w-4 h-4 text-sky-400" />
                </div>
                <span>DES EXPERTS À VOS CÔTÉS</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold tracking-wide text-slate-200">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <Globe className="w-4 h-4 text-sky-400" />
                </div>
                <span>UN RÉSEAU INTERNATIONAL</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold tracking-wide text-slate-200">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                </div>
                <span>UN IMPACT DURABLE</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. INSTITUTIONAL FOOTER (Matching Ressources.png)                          */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            {/* Logo */}
            <div className="cursor-pointer" onClick={() => onNavigate('home')}>
              <Logo size="md" />
            </div>

            {/* Main Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-600 font-medium">
              <button onClick={() => onNavigate('home')} className="hover:text-red-600 transition-colors cursor-pointer">
                Accueil
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('about')} className="hover:text-red-600 transition-colors cursor-pointer">
                À propos
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('secteurs')} className="hover:text-red-600 transition-colors cursor-pointer">
                Secteurs
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('partners')} className="hover:text-red-600 transition-colors cursor-pointer">
                Pays
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('commerce-hub')} className="hover:text-red-600 transition-colors cursor-pointer">
                Opportunités
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('intelligence')} className="hover:text-red-600 transition-colors cursor-pointer">
                Analyses
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('evenements')} className="hover:text-red-600 transition-colors cursor-pointer">
                Événements
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('resources')} className="text-red-600 font-bold cursor-pointer">
                Ressources
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('contact')} className="hover:text-red-600 transition-colors cursor-pointer">
                Contact
              </button>
            </nav>

            {/* Socials & Lang */}
            <div className="flex items-center gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 flex items-center justify-center transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors font-bold text-xs"
              >
                𝕏
              </a>

              <div className="pl-2 border-l border-slate-200">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  FR ⌵
                </span>
              </div>
            </div>
          </div>

          {/* Sublinks & Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <button onClick={() => openLegal('privacy')} className="hover:text-slate-600 transition-colors cursor-pointer">Confidentialité</button>
              <span>|</span>
              <button onClick={() => openLegal('terms')} className="hover:text-slate-600 transition-colors cursor-pointer">Conditions d'utilisation</button>
              <span>|</span>
              <button onClick={() => openLegal('legal')} className="hover:text-slate-600 transition-colors cursor-pointer">Mentions légales</button>
            </div>
            <div>© {new Date().getFullYear()} QIAO. Tous droits réservés.</div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 10. DEMANDER UNE RESSOURCE MODAL                                          */}
      {/* ========================================================================= */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setRequestModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900">
              Demander une ressource spécifique
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
              Indiquez-nous l'étude, le modèle de contrat, la réglementation ou les données que vous
              recherchez. Notre équipe de veille économique vous répondra rapidement.
            </p>

            {requestSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold">
                ✓ Votre demande a été transmise avec succès ! Notre équipe reviendra vers vous sous 48h.
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Titre ou type de ressource souhaité *
                  </label>
                  <input
                    type="text"
                    required
                    value={requestForm.title}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, title: e.target.value })
                    }
                    placeholder="Ex : Guide de dédouanement des produits électroniques en Tunisie"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Votre adresse email *
                  </label>
                  <input
                    type="email"
                    required
                    value={requestForm.email}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, email: e.target.value })
                    }
                    placeholder="Ex : ahmed@entreprise.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Précisions ou besoins particuliers
                  </label>
                  <textarea
                    rows={3}
                    value={requestForm.details}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, details: e.target.value })
                    }
                    placeholder="Précisez votre secteur, le pays cible, ou les questions précises..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Envoyer ma demande
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. LECTEUR VIDÉO / REPLAY                                                */}
      {/* ========================================================================= */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-700 text-white">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <Video className="w-4 h-4 text-red-500 shrink-0" />
                <h3 className="text-sm font-bold truncate">{selectedVideo.title}</h3>
              </div>
              <button onClick={() => setSelectedVideo(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              {selectedVideo.image && <img src={selectedVideo.image} alt={selectedVideo.title} className="w-full h-full object-cover opacity-50" />}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center mb-4 shadow-xl">
                  <Play className="w-7 h-7 fill-white ml-1" />
                </div>
                <p className="text-sm text-slate-200 max-w-md">{selectedVideo.description}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Durée : {selectedVideo.sizeLabel} · Replay réservé aux membres QIAO
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {replaySent ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Le lien du replay vous a été envoyé par e-mail.
                </span>
              ) : (
                <span className="text-slate-400">Recevez le lien privé du replay dans votre boîte mail.</span>
              )}
              {!replaySent && (
                <button
                  onClick={() => (user ? requestReplay() : onOpenRegister?.())}
                  disabled={sending}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {user ? 'Recevoir le replay' : 'Créer un compte pour regarder'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
