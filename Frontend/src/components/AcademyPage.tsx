import React, { useState, useEffect, useCallback } from 'react';
import { Logo } from './Logo';
import qiaoAcademyHero from '../assets/images/qiao_academy_hero_1791404215248.jpg';
import {
  Search,
  ArrowRight,
  GraduationCap,
  Users,
  Award,
  UserCheck,
  LayoutGrid,
  Briefcase,
  Handshake,
  TrendingUp,
  Scale,
  Ship,
  Lightbulb,
  Languages,
  Clock,
  Star,
  ShoppingCart,
  Heart,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  X,
  Play,
  FileCheck,
  Sparkles,
  BookOpen,
  Share2,
  Loader2,
  Trash2
} from 'lucide-react';
import { AppTab } from '../types';
import type { PageFocus } from '../App';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { AcademyItemType, Cart, Course, LearningPath } from '../lib/models';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppActions } from '../context/AppActionsContext';

interface AcademyPageProps {
  onNavigate: (tab: AppTab) => void;
  onOpenRegister?: () => void;
  focus?: PageFocus | null;
  onFocusHandled?: () => void;
}

interface AcademySummary {
  favorites: string[];
  cart: Cart;
  enrolled: string[];
}

const EMPTY_CART: Cart = { items: [], count: 0, total: 0, currency: 'TND' };

const formatPrice = (price: number) => `${price} TND`;

export const AcademyPage: React.FC<AcademyPageProps> = ({
  onNavigate,
  onOpenRegister,
  focus,
  onFocusHandled,
}) => {
  const { user, requireAuth } = useAuth();
  const { notify } = useToast();
  const { openLegal } = useAppActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('Tous les niveaux');
  const [selectedDuration, setSelectedDuration] = useState('Toutes les durées');
  const [selectedFormat, setSelectedFormat] = useState('Tous les formats');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [enrolled, setEnrolled] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeCourseModal, setActiveCourseModal] = useState<Course | null>(null);
  const [activeParcoursModal, setActiveParcoursModal] = useState<LearningPath | null>(null);
  const [showAllPaths, setShowAllPaths] = useState(false);
  const [showAllNew, setShowAllNew] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAppliedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Favoris, panier et inscriptions du membre connecté.
  const loadSummary = useCallback(() => {
    if (!user) {
      setFavorites([]);
      setCart(EMPTY_CART);
      setEnrolled([]);
      return;
    }
    api
      .get<AcademySummary>('/academy/me')
      .then((summary) => {
        setFavorites(summary.favorites);
        setCart(summary.cart);
        setEnrolled(summary.enrolled);
      })
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const isEnrolled = (itemType: AcademyItemType, itemId: string) => enrolled.includes(`${itemType}:${itemId}`);
  const inCart = (itemType: AcademyItemType, itemId: string) =>
    cart.items.some((line) => line.itemType === itemType && line.itemId === itemId);

  const toggleFavorite = (courseId: string) =>
    requireAuth(async () => {
      try {
        const result = await api.post<{ favorite: boolean; favorites: string[] }>(`/academy/favorites/${courseId}`);
        setFavorites(result.favorites);
        showToast(result.favorite ? 'Formation ajoutée à vos favoris ❤️' : 'Formation retirée de vos favoris');
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Action impossible.', 'error');
      }
    }, 'Connectez-vous pour enregistrer vos formations favorites.');

  const addToCart = (itemType: AcademyItemType, itemId: string, title: string) =>
    requireAuth(async () => {
      setBusy(`cart:${itemType}:${itemId}`);
      try {
        const result = await api.post<Cart & { alreadyInCart: boolean }>('/academy/cart', { itemType, itemId });
        setCart(result);
        showToast(result.alreadyInCart ? `"${title}" est déjà dans votre panier` : `"${title}" a été ajouté à votre panier`);
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Ajout impossible.', 'error');
      } finally {
        setBusy(null);
      }
    }, 'Connectez-vous pour constituer votre panier de formations.');

  const removeFromCart = async (lineId: string) => {
    try {
      setCart(await api.delete<Cart>(`/academy/cart/${lineId}`));
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Suppression impossible.', 'error');
    }
  };

  const checkout = async () => {
    setBusy('checkout');
    try {
      const result = await api.post<{ order: { reference: string; total: number }; cart: Cart }>('/academy/cart/checkout');
      setCart(result.cart);
      setCartOpen(false);
      loadSummary();
      notify(`Commande ${result.order.reference} validée (${result.order.total} TND) : vos formations sont accessibles dans votre espace.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Commande impossible.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const enroll = (itemType: AcademyItemType, itemId: string, title: string, onDone?: () => void) =>
    requireAuth(async () => {
      setBusy(`enroll:${itemType}:${itemId}`);
      try {
        const result = await api.post<{ order: { reference: string }; cart: Cart }>('/academy/enroll', { itemType, itemId });
        setCart(result.cart);
        setEnrolled((current) => [...current, `${itemType}:${itemId}`]);
        showToast(`Inscription validée à "${title}" !`);
        onDone?.();
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Inscription impossible.', 'error');
      } finally {
        setBusy(null);
      }
    }, 'Connectez-vous pour vous inscrire à cette formation.');

  const scrollToCatalog = () => document.getElementById('academy-catalog')?.scrollIntoView({ behavior: 'smooth' });

  // 9 Categories matching screenshot
  const domains = [
    { id: 'all', name: 'Tous les domaines (150+)', icon: LayoutGrid, count: 150 },
    { id: 'business', name: 'Business & Entrepreneuriat (24)', icon: Briefcase, count: 24 },
    { id: 'commerce', name: 'Commerce Chine - Afrique du Nord (28)', icon: Handshake, count: 28 },
    { id: 'investment', name: 'Investissement & Finance (18)', icon: TrendingUp, count: 18 },
    { id: 'law', name: 'Droit & Réglementation (12)', icon: Scale, count: 12 },
    { id: 'logistics', name: 'Logistique & Import-Export (16)', icon: Ship, count: 16 },
    { id: 'tech', name: 'Technologie & IA (20)', icon: Lightbulb, count: 20 },
    { id: 'languages', name: 'Langues & Communication (22)', icon: Languages, count: 22 },
    { id: 'culture', name: 'Culture & Relations (10)', icon: Users, count: 10 },
  ];

  // Catalogue (API /academy/courses) : formations populaires par défaut, catalogue complet dès qu'un filtre est actif.
  const filtersActive =
    showCatalog ||
    appliedQuery !== '' ||
    selectedDomain !== 'all' ||
    selectedLevel !== 'Tous les niveaux' ||
    selectedDuration !== 'Toutes les durées' ||
    selectedFormat !== 'Tous les formats';

  const { data: filteredPopular = [], loading: coursesLoading } = useApi<Course[]>(
    '/academy/courses',
    filtersActive
      ? {
          q: appliedQuery || undefined,
          domain: selectedDomain,
          level: selectedLevel,
          duration: selectedDuration,
          format: selectedFormat,
        }
      : { section: 'popular' },
    [],
  );
  const { data: newCoursesAll = [] } = useApi<Course[]>('/academy/courses', showAllNew ? {} : { section: 'new' }, []);
  const newCourses = showAllNew ? newCoursesAll.filter((c) => !(c.sections ?? []).includes('popular')) : newCoursesAll;
  const { data: allPaths = [] } = useApi<LearningPath[]>('/academy/paths', undefined, []);
  const parcours = showAllPaths ? allPaths : allPaths.slice(0, 4);

  // Résultat de recherche globale : ouvre la fiche de la formation.
  useEffect(() => {
    if (!focus || focus.type !== 'course') return;
    api
      .get<Course[]>('/academy/courses')
      .then((courses) => {
        const course = courses.find((c) => c.id === focus.id);
        if (course) setActiveCourseModal(course);
      })
      .finally(() => onFocusHandled?.());
  }, [focus, onFocusHandled]);

  const resetFilters = () => {
    setShowCatalog(false);
    setSearchQuery('');
    setAppliedQuery('');
    setSelectedDomain('all');
    setSelectedLevel('Tous les niveaux');
    setSelectedDuration('Toutes les durées');
    setSelectedFormat('Tous les formats');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      
      {/* Panier QIAO Academy */}
      {cart.count > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-6 z-40 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-2xl flex items-center gap-2 text-sm font-bold cursor-pointer"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Panier ({cart.count})</span>
          <span className="px-2 py-0.5 rounded-lg bg-white/20 text-xs">{formatPrice(cart.total)}</span>
        </button>
      )}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs" onClick={() => setCartOpen(false)}>
          <div
            className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-900">Mon panier ({cart.count})</h3>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer" aria-label="Fermer le panier">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.items.length === 0 && <p className="text-sm text-slate-500">Votre panier est vide.</p>}
              {cart.items.map((line) => (
                <div key={line.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                  <img src={line.image} alt={line.title} className="w-16 h-12 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 line-clamp-2">{line.title}</div>
                    <div className="text-[11px] text-slate-500">{line.subtitle}</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{formatPrice(line.price)}</div>
                  </div>
                  <button
                    onClick={() => removeFromCart(line.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    aria-label="Retirer du panier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-slate-100 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Total</span>
                <span className="text-xl font-black text-slate-900">{formatPrice(cart.total)}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Accès immédiat après validation · facture payable sous 30 jours ·{' '}
                <button onClick={() => openLegal('training-terms')} className="underline cursor-pointer">
                  conditions générales de formation
                </button>
              </p>
              <button
                onClick={checkout}
                disabled={busy === 'checkout' || cart.count === 0}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {busy === 'checkout' && <Loader2 className="w-4 h-4 animate-spin" />}
                Valider ma commande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-sky-400/40 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTION: APPRENEZ AUJOURD'HUI. CONSTRUISEZ DEMAIN.                 */}
      {/* ========================================================================= */}
      <div className="relative bg-[#07152b] text-white overflow-hidden pt-28 pb-16 lg:pb-20 border-b border-slate-800">
        
        {/* Background glow and subtle space radial gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(37,99,235,0.20)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-[radial-gradient(circle_at_80%_40%,rgba(220,38,38,0.18)_0%,transparent_50%)] pointer-events-none" />

        {/* Skyline, Oriental Pearl Tower, Pagoda, Bridge & Executive on Right Side (Matching QIAO Academy.png exactly) */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[62%] xl:w-[58%] pointer-events-none select-none overflow-hidden flex items-end justify-end">
          <img
            src={qiaoAcademyHero}
            alt="QIAO Academy - Executive Professional, Pagode illuminée et Skyline Sino-Nord-Africaine"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-right filter contrast-105"
          />
          {/* Smooth dark gradient fading seamlessly into left content background #07152b */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07152b] via-[#07152b]/80 via-15% md:via-[#07152b]/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#07152b] to-transparent" />

          {/* Top Right Editorial Typography Overlay (Matching QIAO Academy.png Exactly) */}
          <div className="absolute top-8 right-8 lg:top-10 lg:right-10 hidden xl:flex flex-col items-end text-right z-20 drop-shadow-md">
            <div className="space-y-1 text-xs tracking-[0.25em] font-light text-slate-300">
              <div className="font-semibold text-white">CHINA</div>
              <div>KNOWLEDGE</div>
              <div>SKILLS</div>
              <div>OPPORTUNITIES</div>
            </div>

            <div className="mt-7 space-y-1 text-xs tracking-[0.25em] font-light text-slate-300">
              <div className="font-semibold text-white">NORTH AFRICA</div>
              <div>PEOPLE</div>
              <div>MARKETS</div>
              <div>GROWTH</div>
            </div>
          </div>
        </div>

        {/* Hero Left Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            
            {/* Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 mb-3.5">
              <span className="w-5 h-[2px] bg-red-500" />
              <span>QIAO ACADEMY</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.12] mb-4">
              Apprenez aujourd’hui.<br />
              <span className="text-red-600">Construisez demain.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-200 font-light leading-relaxed mb-8 max-w-xl">
              Des formations pratiques pour comprendre la Chine, l'Afrique du Nord et saisir les opportunités de demain.
            </p>

            {/* Search Input Container with Red Button (Matching Screenshot) */}
            <div className="relative max-w-xl mb-10">
              <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-2xl p-1.5 focus-within:ring-2 focus-within:ring-red-500 transition-all">
                <div className="pl-3.5 pr-2 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une formation, un sujet, un expert..."
                  className="flex-1 bg-transparent py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-normal"
                />
                <button
                  onClick={() => {
                    setAppliedQuery(searchQuery.trim());
                    scrollToCatalog();
                  }}
                  className="px-6 sm:px-7 py-3 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Rechercher
                </button>
              </div>
            </div>

            {/* Bottom Hero Stats Row (4 Columns with Red Icons matching screenshot) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-2">
              
              {/* Stat 1: 150+ Formations */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-white leading-tight">150+</div>
                  <div className="text-[11px] sm:text-xs text-slate-300 font-light">Formations</div>
                </div>
              </div>

              {/* Stat 2: 5,000+ Apprenants */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-white leading-tight">5,000+</div>
                  <div className="text-[11px] sm:text-xs text-slate-300 font-light">Apprenants</div>
                </div>
              </div>

              {/* Stat 3: 30+ Experts */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-white leading-tight">30+</div>
                  <div className="text-[11px] sm:text-xs text-slate-300 font-light">Experts</div>
                </div>
              </div>

              {/* Stat 4: 10+ Certifications */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-white leading-tight">10+</div>
                  <div className="text-[11px] sm:text-xs text-slate-300 font-light">Certifications</div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. EXPLOREZ NOS FORMATIONS (FILTER BAR + 9 DOMAIN CARDS)                   */}
      {/* ========================================================================= */}
      <div id="academy-catalog" className="py-12 bg-[#FFFFFF] border-b border-slate-200 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Explorez nos formations
            </h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-light mt-1">
              <span className="w-3.5 h-[1.5px] bg-red-500" />
              <span>Trouvez la formation qui correspond à vos objectifs</span>
            </div>
          </div>

          {/* Search & 3 Filters Bar */}
          <div className="flex flex-col lg:flex-row items-center gap-3 mb-6">
            
            {/* Search Input with Red Square Magnifier Button */}
            <div className="flex-1 w-full flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs focus-within:border-slate-400">
              <div className="pl-3.5 pr-2 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Que souhaitez-vous apprendre ?"
                className="flex-1 bg-transparent py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-light"
              />
              <button
                onClick={() => setAppliedQuery(searchQuery.trim())}
                className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Rechercher"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Dropdown Selectors */}
            <div className="w-full lg:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              
              {/* Level Filter */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-xs font-normal text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option>Tous les niveaux</option>
                  <option>Débutant</option>
                  <option>Intermédiaire</option>
                  <option>Avancé / Dirigeant</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Duration Filter */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-xs font-normal text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option>Toutes les durées</option>
                  <option>Moins de 5 heures</option>
                  <option>5h à 15 heures</option>
                  <option>Plus de 15 heures</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Format Filter */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-xs font-normal text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option>Tous les formats</option>
                  <option>En ligne à son rythme</option>
                  <option>Masterclass live</option>
                  <option>Parcours certifiant</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

            </div>

          </div>

          {/* 9 Category Cards Row (Matching Screenshot Exactly) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
            {domains.map((dom) => {
              const Icon = dom.icon;
              const isSelected = selectedDomain === dom.id;

              return (
                <button
                  key={dom.id}
                  onClick={() => setSelectedDomain(dom.id)}
                  className={`flex flex-col items-center justify-center text-center p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-102 font-semibold'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-2xs hover:bg-slate-50'
                  }`}
                >
                  <div className={`mb-2 p-1 rounded-lg ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    <Icon className="w-6 h-6 stroke-[1.6]" />
                  </div>
                  <span className="text-[11px] leading-snug line-clamp-2">
                    {dom.name}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FORMATIONS POPULAIRES (4 DETAILED COURSE CARDS WITH PRICE & BUTTONS)   */}
      {/* ========================================================================= */}
      <div className="py-12 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header with "Voir toutes les formations ->" */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {filtersActive ? `Catalogue des formations (${filteredPopular.length})` : 'Formations populaires'}
            </h2>
            <button
              onClick={() => (filtersActive ? resetFilters() : setShowCatalog(true))}
              className="text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{filtersActive ? 'Réinitialiser les filtres' : 'Voir toutes les formations'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {coursesLoading && filteredPopular.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
              <Loader2 className="w-5 h-5 animate-spin text-red-600" /> Chargement des formations...
            </div>
          )}
          {!coursesLoading && filteredPopular.length === 0 && (
            <div className="p-8 text-center border border-dashed border-slate-300 rounded-2xl text-sm text-slate-500 space-y-3 mb-6">
              <p>Aucune formation ne correspond à ces critères.</p>
              <button onClick={resetFilters} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer">
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPopular.map((course) => {
              const isFav = favorites.includes(course.id);

              return (
                <div
                  key={course.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Card Image with Badges and Heart */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={course.image}
                      alt={course.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Tag badge (Best-seller, Nouveau, Populaire) */}
                    {course.badge && (
                      <div
                        className={`absolute top-3 left-3 ${course.badgeColor} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-xs`}
                      >
                        {course.badge}
                      </div>
                    )}

                    {isEnrolled('course', course.id) && (
                      <div className="absolute bottom-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Inscrit
                      </div>
                    )}

                    {/* Favorite Heart Button */}
                    <button
                      onClick={() => toggleFavorite(course.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Favoris"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? 'fill-red-600 text-red-600' : 'text-white'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Title */}
                      <h3
                        onClick={() => setActiveCourseModal(course)}
                        className="font-bold text-slate-900 text-sm sm:text-[15px] leading-snug group-hover:text-red-600 transition-colors line-clamp-2 mb-3 cursor-pointer"
                      >
                        {course.title}
                      </h3>

                      {/* Instructor with Avatar */}
                      <div className="flex items-center gap-2 mb-3">
                        <img
                          src={course.instructorImg}
                          alt={course.instructor}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-xs text-slate-600 font-normal">
                          {course.instructor}
                        </span>
                      </div>

                      {/* Rating & Duration */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-light mb-4">
                        <div className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{course.rating}</span>
                          <span className="text-slate-400 font-normal">({course.reviewsCount})</span>
                        </div>
                        <span>·</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{course.duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Price & Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {/* Price in TND */}
                      <div className="text-base sm:text-lg font-bold text-slate-900">
                        {formatPrice(course.price)}
                      </div>

                      {/* Cart icon button + Solid Red "Voir la formation" Button */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addToCart('course', course.id, course.title)}
                          disabled={isEnrolled('course', course.id) || busy === `cart:course:${course.id}`}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default ${
                            inCart('course', course.id)
                              ? 'border-red-300 bg-red-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                          }`}
                          aria-label="Ajouter au panier"
                          title={inCart('course', course.id) ? 'Déjà dans le panier' : 'Ajouter au panier'}
                        >
                          {busy === `cart:course:${course.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : inCart('course', course.id) || isEnrolled('course', course.id) ? (
                            <CheckCircle2 className="w-4 h-4 text-red-600" />
                          ) : (
                            <ShoppingCart className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                        <button
                          onClick={() => setActiveCourseModal(course)}
                          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Voir la formation
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. NOS PARCOURS DE FORMATION (4 CARDS WITH ROUND ARROW BUTTON)            */}
      {/* ========================================================================= */}
      <div className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Nos parcours de formation
              </h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-light mt-1">
                <span className="w-3.5 h-[1.5px] bg-red-500" />
                <span>Des parcours complets pour atteindre vos objectifs professionnels</span>
              </div>
            </div>

            <button
              onClick={() => setShowAllPaths(!showAllPaths)}
              className="text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{showAllPaths ? 'Voir moins de parcours' : `Voir tous les parcours (${allPaths.length})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Parcours Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {parcours.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveParcoursModal(item)}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Photo */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-[15px] leading-snug group-hover:text-red-600 transition-colors mb-2">
                      {item.title}
                    </h3>

                    {/* Metadata: count of courses and hours */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-light mb-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.coursesCount} formations</span>
                      </div>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.duration}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Red Round Outline Arrow Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-base sm:text-lg font-bold text-red-600">
                      {formatPrice(item.price)}
                    </div>
                    {isEnrolled('path', item.id) && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Inscrit
                      </span>
                    )}

                    <div className="w-7 h-7 rounded-full border border-slate-300 group-hover:border-red-600 group-hover:bg-red-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. NOUVELLES FORMATIONS (4 COMPACT CARDS WITH BLUE "NOUVEAU" BADGE)       */}
      {/* ========================================================================= */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Nouvelles formations
            </h2>
            <button
              onClick={() => setShowAllNew(!showAllNew)}
              className="text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{showAllNew ? 'Voir uniquement les nouveautés' : 'Voir toutes les nouveautés'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {newCourses.map((course) => {
              const isFav = favorites.includes(course.id);

              return (
                <div
                  key={course.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Photo with Blue "Nouveau" Badge & Heart */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                    <img
                      src={course.image}
                      alt={course.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Blue Nouveau Badge */}
                    {course.badge && (
                      <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-xs">
                        {course.badge}
                      </div>
                    )}

                    {/* Heart Button */}
                    <button
                      onClick={() => toggleFavorite(course.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Favoris"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? 'fill-red-600 text-red-600' : 'text-white'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Title */}
                      <h3
                        onClick={() => setActiveCourseModal(course)}
                        className="font-bold text-slate-900 text-xs sm:text-[13.5px] leading-snug group-hover:text-red-600 transition-colors line-clamp-2 mb-2.5 cursor-pointer"
                      >
                        {course.title}
                      </h3>

                      {/* Instructor */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <img
                          src={course.instructorImg}
                          alt={course.instructor}
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-xs text-slate-600 font-normal">
                          {course.instructor}
                        </span>
                      </div>

                      {/* Rating & Hours */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-light mb-3">
                        <div className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{course.rating}</span>
                          <span className="text-slate-400 font-normal">({course.reviewsCount})</span>
                        </div>
                        <span>·</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{course.duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Shopping Cart Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-sm sm:text-base font-bold text-slate-900">
                        {formatPrice(course.price)}
                      </div>

                      <button
                        onClick={() => addToCart('course', course.id, course.title)}
                        disabled={isEnrolled('course', course.id) || busy === `cart:course:${course.id}`}
                        className={`p-2 rounded-lg border transition-colors cursor-pointer disabled:cursor-default ${
                          inCart('course', course.id) ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        aria-label="Ajouter au panier"
                      >
                        {busy === `cart:course:${course.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : inCart('course', course.id) || isEnrolled('course', course.id) ? (
                          <CheckCircle2 className="w-4 h-4 text-red-600" />
                        ) : (
                          <ShoppingCart className="w-4 h-4 text-red-600" />
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. SOCIAL PROOF & CERTIFICATION STRIP (3-PART BAR MATCHING SCREENSHOT)    */}
      {/* ========================================================================= */}
      <div className="py-8 bg-[#FFFFFF] border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left Block: Nos formateurs experts (3.5 cols) */}
            <div className="lg:col-span-3 flex flex-col justify-center">
              <div
                onClick={() => onNavigate('community')}
                className="flex items-center gap-1 text-sm font-bold text-slate-900 mb-2 cursor-pointer hover:text-red-600 transition-colors"
              >
                <span>Nos formateurs experts</span>
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* 4 Overlapping Avatar Circles */}
              <div className="flex items-center -space-x-2 mb-2">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="Expert 1"
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-2xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  alt="Expert 2"
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-2xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                  alt="Expert 3"
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-2xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                  alt="Expert 4"
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-2xs"
                />
              </div>

              <p className="text-xs text-slate-500 font-light leading-relaxed">
                Des professionnels de terrain pour un apprentissage concret
              </p>
            </div>

            {/* Center Block: Dark Navy Rounded Card with 4 Metrics (6 cols) */}
            <div className="lg:col-span-6 bg-slate-900 rounded-2xl p-5 text-white shadow-lg">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                
                {/* 5,000+ Apprenants actifs */}
                <div className="flex flex-col items-center">
                  <Users className="w-5 h-5 text-slate-300 mb-1" />
                  <div className="text-lg sm:text-xl font-bold text-white">5,000+</div>
                  <div className="text-[11px] text-slate-300 font-light">Apprenants actifs</div>
                </div>

                {/* 150+ Formations */}
                <div className="flex flex-col items-center">
                  <GraduationCap className="w-5 h-5 text-slate-300 mb-1" />
                  <div className="text-lg sm:text-xl font-bold text-white">150+</div>
                  <div className="text-[11px] text-slate-300 font-light">Formations</div>
                </div>

                {/* 4.8/5 Satisfaction */}
                <div className="flex flex-col items-center">
                  <Star className="w-5 h-5 text-slate-300 mb-1" />
                  <div className="text-lg sm:text-xl font-bold text-white">4.8/5</div>
                  <div className="text-[11px] text-slate-300 font-light">Satisfaction</div>
                </div>

                {/* 30+ Experts */}
                <div className="flex flex-col items-center">
                  <UserCheck className="w-5 h-5 text-slate-300 mb-1" />
                  <div className="text-lg sm:text-xl font-bold text-white">30+</div>
                  <div className="text-[11px] text-slate-300 font-light">Experts</div>
                </div>

              </div>
            </div>

            {/* Right Block: Certification QIAO (3 cols) */}
            <div className="lg:col-span-3 flex items-center justify-between gap-3 pl-0 lg:pl-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
                  <FileCheck className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div
                    onClick={() => openLegal('training-terms')}
                    className="flex items-center gap-1 text-sm font-bold text-slate-900 cursor-pointer hover:text-red-600 transition-colors"
                  >
                    <span>Certification QIAO</span>
                  </div>
                  <p className="text-xs text-slate-500 font-light mt-0.5 leading-relaxed">
                    Obtenez des certificats reconnus et valorisez vos compétences
                  </p>
                </div>
              </div>

              <div
                onClick={() => openLegal('training-terms')}
                className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 shrink-0 cursor-pointer hover:border-red-600 hover:text-red-600 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. CTA BANNER: INVESTISSEZ DANS VOS COMPÉTENCES                           */}
      {/* ========================================================================= */}
      <div className="relative bg-[#07152b] text-white overflow-hidden py-14 sm:py-16">
        {/* Right side visual matching screenshot */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[45%] lg:w-[36%] pointer-events-none select-none overflow-hidden flex items-end justify-end opacity-90">
          <img
            src={qiaoAcademyHero}
            alt="QIAO Academy - Formation professionnelle"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-right filter contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07152b] via-[#07152b]/85 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-2.5">
              Investissez dans vos compétences,<br />
              ouvrez la voie aux opportunités.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-light max-w-xl">
              Rejoignez QIAO Academy et développez votre expertise.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (onOpenRegister) {
                  onOpenRegister();
                } else {
                  onNavigate('contact');
                }
              }}
              className="px-6 sm:px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-lg transition-all cursor-pointer transform active:scale-98"
            >
              Créer un compte
            </button>
            <button
              onClick={() => {
                setShowCatalog(true);
                scrollToCatalog();
              }}
              className="px-6 sm:px-8 py-3 bg-[#0a1f3d] hover:bg-white/10 text-white border border-white/20 font-medium text-xs sm:text-sm rounded-lg transition-all cursor-pointer"
            >
              Découvrir les formations
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. FOOTER DÉDIÉ QIAO (MATCHING OVERALL DESIGN)                           */}
      {/* ========================================================================= */}
      <footer className="bg-[#07152b] text-slate-300 text-xs font-light pt-14 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800/80">
            {/* Left Brand Column */}
            <div className="md:col-span-5 space-y-4">
              <div onClick={() => onNavigate('home')} className="cursor-pointer inline-block">
                <Logo size="sm" />
              </div>

              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                QIAO Academy forme les entrepreneurs, cadres et étudiants aux compétences clés du commerce, de l'investissement et des partenariats sino-nord-africains.
              </p>

              {/* Social links */}
              <div className="flex items-center gap-3 pt-1 text-slate-400">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white cursor-pointer transition-colors font-bold">in</a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white cursor-pointer transition-colors font-bold">f</a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white cursor-pointer transition-colors font-bold">▶</a>
                <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white cursor-pointer transition-colors font-bold">𝕏</a>
              </div>
            </div>

            {/* Nav Columns: Formations, Certifications, Support */}
            <div className="md:col-span-2">
              <h5 className="font-semibold text-white text-xs mb-3 uppercase tracking-wider">Formations</h5>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><button onClick={() => { setSelectedDomain('business'); scrollToCatalog(); }} className="hover:text-white transition-colors cursor-pointer">Business & Entrepreneuriat</button></li>
                <li><button onClick={() => { setSelectedDomain('commerce'); scrollToCatalog(); }} className="hover:text-white transition-colors cursor-pointer">Commerce Sino-Maghreb</button></li>
                <li><button onClick={() => { setSelectedDomain('investment'); scrollToCatalog(); }} className="hover:text-white transition-colors cursor-pointer">Investissement & Finance</button></li>
                <li><button onClick={() => { setSelectedDomain('law'); scrollToCatalog(); }} className="hover:text-white transition-colors cursor-pointer">Droit des affaires</button></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="font-semibold text-white text-xs mb-3 uppercase tracking-wider">Parcours</h5>
              <ul className="space-y-2 text-slate-400 text-xs">
                {[
                  ['parcours-1', 'Commerce International'],
                  ['parcours-2', 'Investissement en Chine'],
                  ['parcours-3', 'Digital & IA Business'],
                  ['parcours-4', 'Mandarin Pro & Culture'],
                ].map(([pathId, label]) => (
                  <li key={pathId}>
                    <button
                      onClick={() => {
                        const path = allPaths.find((p) => p.id === pathId);
                        if (path) setActiveParcoursModal(path);
                      }}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3">
              <h5 className="font-semibold text-white text-xs mb-3 uppercase tracking-wider">Contact & Support</h5>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><span>Email : academy@qiao.global</span></li>
                <li><span>Tél : +216 71 890 123 / +86 21 6888 1234</span></li>
                <li><span>Bureaux : Tunis · Casablanca · Shanghai</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div>© {new Date().getFullYear()} QIAO Academy. Tous droits réservés.</div>
            <div className="flex gap-4">
              <button onClick={() => openLegal('training-terms')} className="hover:text-slate-300 cursor-pointer">Conditions générales de formation</button>
              <button onClick={() => openLegal('privacy')} className="hover:text-slate-300 cursor-pointer">Politique de confidentialité</button>
              <button onClick={() => openLegal('legal')} className="hover:text-slate-300 cursor-pointer">Mentions légales</button>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* INTERACTIVE COURSE DETAIL MODAL                                           */}
      {/* ========================================================================= */}
      {activeCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="relative h-48 bg-slate-900 overflow-hidden">
              <img
                src={activeCourseModal.image}
                alt={activeCourseModal.title}
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              
              <button
                onClick={() => setActiveCourseModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                {activeCourseModal.badge && (
                  <span className="inline-block bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider mb-2">
                    {activeCourseModal.badge}
                  </span>
                )}
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {activeCourseModal.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700 font-light">
              
              {/* Instructor & Meta */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src={activeCourseModal.instructorImg}
                    alt={activeCourseModal.instructor}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{activeCourseModal.instructor}</div>
                    <div className="text-xs text-slate-500">{activeCourseModal.instructorRole || 'Expert QIAO Academy'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{activeCourseModal.rating}</span>
                    <span className="text-slate-400 font-normal">({activeCourseModal.reviewsCount} avis)</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{activeCourseModal.duration}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Présentation de la formation</h4>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {activeCourseModal.description}
                </p>
              </div>

              {/* Modules Syllabus */}
              {activeCourseModal.modules && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-3">Programme des modules</h4>
                  <div className="space-y-2">
                    {activeCourseModal.modules.map((mod, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800"
                      >
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{mod}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certification Included Guarantee */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3 text-xs text-amber-900">
                <Award className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Certification vérifiable QIAO Academy remise automatiquement à la validation des évaluations.</span>
              </div>

            </div>

            {/* Modal Footer with Price & Enroll Button */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-light">Tarif d'accès à vie</div>
                <div className="text-xl font-bold text-slate-900">{formatPrice(activeCourseModal.price)}</div>
                <div className="text-[11px] text-slate-500">
                  {activeCourseModal.level} · {activeCourseModal.format}
                </div>
              </div>

              {isEnrolled('course', activeCourseModal.id) ? (
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Vous êtes inscrit
                  </span>
                  <button
                    onClick={() => {
                      setActiveCourseModal(null);
                      onNavigate('dashboard');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Accéder à mon espace
                  </button>
                </div>
              ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    addToCart('course', activeCourseModal.id, activeCourseModal.title);
                    setActiveCourseModal(null);
                  }}
                  disabled={inCart('course', activeCourseModal.id)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
                >
                  {inCart('course', activeCourseModal.id) ? 'Déjà dans le panier' : 'Ajouter au panier'}
                </button>
                <button
                  onClick={() => enroll('course', activeCourseModal.id, activeCourseModal.title, () => setActiveCourseModal(null))}
                  disabled={busy === `enroll:course:${activeCourseModal.id}`}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {busy === `enroll:course:${activeCourseModal.id}` && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  S'inscrire maintenant
                </button>
              </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE PARCOURS MODAL                                                */}
      {/* ========================================================================= */}
      {activeParcoursModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                  Parcours certifiant complet
                </span>
                <h3 className="text-lg font-bold text-slate-900">{activeParcoursModal.title}</h3>
              </div>
              <button
                onClick={() => setActiveParcoursModal(null)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600 font-light">
              <p>{activeParcoursModal.description}</p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="font-semibold text-slate-900">Ce pack inclut :</div>
                <div className="flex items-center gap-2 text-slate-700">
                  <BookOpen className="w-4 h-4 text-red-600" />
                  <span>{activeParcoursModal.coursesCount} cours interactifs de haut niveau</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span>{activeParcoursModal.duration} de formation pratique et cas concrets</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Award className="w-4 h-4 text-red-600" />
                  <span>Diplôme certifié QIAO Academy partageable sur LinkedIn</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-light">Prix forfaitaire</span>
                <div className="text-xl font-bold text-red-600">{formatPrice(activeParcoursModal.price)}</div>
              </div>
              {isEnrolled('path', activeParcoursModal.id) ? (
                <span className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Parcours rejoint
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      addToCart('path', activeParcoursModal.id, activeParcoursModal.title);
                      setActiveParcoursModal(null);
                    }}
                    disabled={inCart('path', activeParcoursModal.id)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer disabled:opacity-60"
                  >
                    {inCart('path', activeParcoursModal.id) ? 'Dans le panier' : 'Ajouter au panier'}
                  </button>
                  <button
                    onClick={() => enroll('path', activeParcoursModal.id, activeParcoursModal.title, () => setActiveParcoursModal(null))}
                    disabled={busy === `enroll:path:${activeParcoursModal.id}`}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {busy === `enroll:path:${activeParcoursModal.id}` && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Rejoindre ce parcours
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
