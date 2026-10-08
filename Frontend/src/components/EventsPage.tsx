import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Users,
  Globe,
  Handshake,
  Compass,
  Rocket,
  CheckCircle2,
  X,
  Mail,
  Send,
  Linkedin,
  Youtube,
  Share2,
  Calendar,
  Building2,
  Briefcase,
  Clock,
  ExternalLink,
  ChevronDown,
  Loader2,
  AlertCircle,
  Ticket
} from 'lucide-react';
import { AppTab } from '../types';
import { Logo } from './Logo';
import type { PageFocus } from '../App';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { resolveImage } from '../lib/assets';
import { QiaoEvent } from '../lib/models';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppActions } from '../context/AppActionsContext';

// Local High-Definition Images
import evenementPageBg from '../assets/images/evenement_page_bg.jpg';
import evenementsHeroPlaza from '../assets/images/evenements_hero_plaza_1791399698341.jpg';
import catSalonsCanton from '../assets/images/cat_salons_canton_1791399715213.jpg';
import catOrganisateursStage from '../assets/images/cat_organisateurs_stage_1791399731228.jpg';
import eventCantonFairExterior from '../assets/images/event_canton_fair_exterior_1791399745116.jpg';
import shanghaiSkylineDusk from '../assets/images/secteurs_hero_skyline_1791220840877.jpg';
import missionPartnersUncut from '../assets/images/about_mission_partners_uncut_1791236115168.jpg';
import chinaNightSkyline from '../assets/images/china_corridor_night_skyline_1790804583067.jpg';
import chinaAfricaHandshake from '../assets/images/china_africa_handshake_1787501713904.jpg';
import techHeroDigital from '../assets/images/tech_hero_digital_ai_1791120272815.jpg';
import missionPartnersClear from '../assets/images/mission_partners_clear_1791224240641.jpg';
import secteursBannerPartners from '../assets/images/secteurs_banner_partners_1791220299654.jpg';
import evenementsHeroPanorama from '../assets/images/evenements_hero_panorama_1791400498744.jpg';

interface EventsPageProps {
  onNavigate: (tab: AppTab | string) => void;
  onOpenRegister?: () => void;
  onSelectSector?: (sectorId: string) => void;
  focus?: PageFocus | null;
  onFocusHandled?: () => void;
}

type EventItemData = QiaoEvent;

export const EventsPage: React.FC<EventsPageProps> = ({
  onNavigate,
  onOpenRegister,
  onSelectSector,
  focus,
  onFocusHandled,
}) => {
  const { user } = useAuth();
  const { notify } = useToast();
  const { openLegal } = useAppActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'calendar' | 'organizers'>('cards');
  const [selectedEvent, setSelectedEvent] = useState<EventItemData | null>(null);
  const [invitationsModalOpen, setInvitationsModalOpen] = useState(false);
  const [registrationModalEvent, setRegistrationModalEvent] = useState<EventItemData | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [registeredBadge, setRegisteredBadge] = useState<string | null>(null);
  const [registrationForm, setRegistrationForm] = useState({ fullName: '', email: '', companyRole: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const featuredRowRef = useRef<HTMLDivElement>(null);

  // 8 Event Categories matching screenshot exactly
  const categories = [
    {
      id: 'salons',
      title: 'Salons & Foires',
      subtitle: 'Les plus grands rendez-vous commerciaux internationaux',
      image: catSalonsCanton,
      action: 'Voir les événements',
    },
    {
      id: 'conferences',
      title: 'Conférences',
      subtitle: 'Des experts pour éclairer les tendances et opportunités',
      image: catOrganisateursStage,
      action: 'Voir les événements',
    },
    {
      id: 'webinaires',
      title: 'Webinaires',
      subtitle: 'Des insights en ligne, accessibles partout',
      image: techHeroDigital,
      action: 'Voir les événements',
    },
    {
      id: 'missions',
      title: 'Missions d\'affaires',
      subtitle: 'Des délégations pour créer des partenariats concrets',
      image: missionPartnersUncut,
      action: 'Voir les événements',
    },
    {
      id: 'networking',
      title: 'Forums & Networking',
      subtitle: 'Échanger. Collaborer. Grandir.',
      image: chinaAfricaHandshake,
      action: 'Voir les événements',
    },
    {
      id: 'calendrier',
      title: 'Calendrier',
      subtitle: 'Tous les événements par date',
      image: evenementsHeroPanorama,
      action: 'Voir le calendrier',
    },
    {
      id: 'organisateurs',
      title: 'Organisateurs',
      subtitle: 'Découvrez les institutions et partenaires',
      image: secteursBannerPartners,
      action: 'Voir les organisateurs',
    },
    {
      id: 'opportunites',
      title: 'Un pont vers de nouvelles opportunités',
      subtitle: '',
      image: shanghaiSkylineDusk,
      action: '',
      isHighlight: true,
    },
  ];

  // Événements chargés depuis l'API (table events) ; catégorie et recherche filtrées côté serveur.
  const activeCategory = categories.find((c) => c.title === selectedCategoryFilter);
  const categoryKey =
    activeCategory && !['calendrier', 'organisateurs', 'opportunites'].includes(activeCategory.id)
      ? activeCategory.id
      : undefined;
  const { data: allEvents = [], loading: eventsLoading, reload: reloadEvents } = useApi<EventItemData[]>(
    '/events',
    { placement: 'events-page', category: categoryKey, q: searchQuery.trim() || undefined },
    [],
  );
  const [organizerFilter, setOrganizerFilter] = useState<string | null>(null);

  const filteredEvents = organizerFilter
    ? allEvents.filter((ev) => ev.details?.organizer === organizerFilter)
    : allEvents;

  const organizers = Array.from(
    allEvents.reduce((map, ev) => {
      const name = ev.details?.organizer;
      if (name) map.set(name, (map.get(name) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  );

  const eventsByMonth = filteredEvents.reduce<Record<string, EventItemData[]>>((groups, ev) => {
    (groups[ev.monthYear] ??= []).push(ev);
    return groups;
  }, {});

  // Résultat de recherche globale : ouvre directement la fiche de l'événement.
  useEffect(() => {
    if (!focus || focus.type !== 'event') return;
    api
      .get<EventItemData[]>('/events')
      .then((events) => {
        const target = events.find((ev) => ev.id === focus.id);
        if (target) setSelectedEvent(target);
      })
      .finally(() => onFocusHandled?.());
  }, [focus, onFocusHandled]);

  useEffect(() => {
    if (registrationModalEvent) {
      setRegisteredBadge(null);
      setFormError(null);
      setRegistrationForm({
        fullName: user?.fullName ?? '',
        email: user?.email ?? '',
        companyRole: [user?.company, user?.title].filter(Boolean).join(', '),
      });
    }
  }, [registrationModalEvent, user]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter(null);
    setOrganizerFilter(null);
    setViewMode('cards');
  };

  const isPast = (ev: EventItemData) => ev.startDate < new Date().toISOString().slice(0, 10);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (featuredRowRef.current) {
      const scrollAmount = 320;
      featuredRowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setSubmitting(true);
    try {
      const result = await api.post<{ alreadySubscribed: boolean }>('/newsletter/subscribe', {
        email: inviteEmail,
        topic: 'events',
        source: 'evenements',
      });
      setInviteSuccess(true);
      if (result.alreadySubscribed) notify('Cette adresse reçoit déjà nos invitations.', 'info');
      setTimeout(() => {
        setInviteSuccess(false);
        setInvitationsModalOpen(false);
        setInviteEmail('');
      }, 2200);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Inscription impossible.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationModalEvent) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const registration = await api.post<{ badgeCode: string }>(
        `/events/${registrationModalEvent.id}/register`,
        registrationForm,
      );
      setRegisteredBadge(registration.badgeCode);
      reloadEvents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Inscription impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white text-slate-900 font-sans min-h-screen pt-16 sm:pt-20">
      
      {/* ========================================================================= */}
      {/* 1. BREADCRUMB (Matching Événements.png exactly)                          */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-2 text-xs sm:text-sm">
          <button
            onClick={() => onNavigate('home')}
            className="text-[#e01a22] font-semibold hover:underline cursor-pointer"
          >
            QIAO
          </button>
          <span className="text-slate-400 font-semibold">&gt;</span>
          <button
            onClick={() => onNavigate('secteurs')}
            className="text-[#0a1c3d] font-semibold hover:text-[#e01a22] transition-colors cursor-pointer"
          >
            Secteurs
          </button>
          <span className="text-slate-400 font-semibold">&gt;</span>
          <button
            onClick={() => onNavigate('commerce-hub')}
            className="text-[#0a1c3d] font-semibold hover:text-[#e01a22] transition-colors cursor-pointer"
          >
            Commerce &amp; E-commerce
          </button>
          <span className="text-slate-400 font-semibold">&gt;</span>
          <span className="text-[#0a1c3d] font-semibold">Événements</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (Matching Événements.png with user background image)        */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-slate-50 min-h-[460px] lg:min-h-[500px] flex items-center pt-6 pb-12 sm:pt-8 sm:pb-14 border-b border-slate-100">
        {/* Full-width Panoramic Background Image (evenement page.jpg) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={evenementPageBg}
            alt="Événements QIAO - Foires, Salons et Conférences"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter contrast-105"
          />
          {/* Soft White Gradient strictly on the left to keep text crystal clear and legible */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-4/5 lg:w-3/5 bg-gradient-to-r from-white/95 via-white/85 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-white/10 pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl sm:max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0a1c3d] tracking-tight leading-none">
              Événements
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a1c3d] leading-snug">
              Rencontrer. Échanger. Créer des opportunités.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
              Découvrez les principaux salons, conférences, foires commerciales et missions
              d'affaires entre la Chine et l'Afrique du Nord. Participez aux événements qui façonnent
              le commerce de demain.
            </p>

            {/* Search Bar matching screenshot */}
            <div className="pt-2">
              <div className="bg-white/95 backdrop-blur-xs border border-blue-200/90 rounded-xl p-1.5 shadow-2xs flex items-center gap-2 max-w-xl transition-all focus-within:ring-2 focus-within:ring-[#0a1c3d] focus-within:border-[#0a1c3d]">
                <Search className="w-5 h-5 text-slate-400 ml-2.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un événement, un salon, une ville..."
                  className="w-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none py-2"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-xs"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    const el = document.getElementById('featured-events');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#0a1c3d] hover:bg-[#071324] text-white px-5 sm:px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-colors shadow-sm cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Rechercher</span>
                </button>
              </div>

              {selectedCategoryFilter && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Filtre actif :</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                    {selectedCategoryFilter}
                    <button
                      onClick={resetFilters}
                      className="hover:text-red-900 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION: "Explorez les catégories d'événements"                        */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a1c3d]">
              Explorez les catégories d'événements
            </h2>
          </div>

          {/* 8 Cards Grid (4 columns × 2 rows on large screens) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  if (cat.id === 'opportunites') {
                    onNavigate('commerce-hub');
                  } else {
                    const isActive = selectedCategoryFilter === cat.title;
                    setSelectedCategoryFilter(isActive ? null : cat.title);
                    setOrganizerFilter(null);
                    setViewMode(
                      isActive ? 'cards' : cat.id === 'calendrier' ? 'calendar' : cat.id === 'organisateurs' ? 'organizers' : 'cards',
                    );
                    const el = document.getElementById('featured-events');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col justify-end p-5 min-h-[220px] shadow-2xs hover:shadow-xl ${
                  cat.isHighlight
                    ? 'border-slate-200/80 bg-slate-900'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Background Photo */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 contrast-105"
                  />
                  {/* Subtle dark gradient for perfect typography contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 space-y-1 text-white">
                  <h3 className="text-lg font-extrabold leading-snug text-white group-hover:text-red-400 transition-colors">
                    {cat.title}
                  </h3>

                  {cat.subtitle && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {cat.subtitle}
                    </p>
                  )}

                  {cat.isHighlight && (
                    <div className="w-12 h-1 bg-[#e01a22] rounded-full mt-2.5" />
                  )}

                  {cat.action && (
                    <div className="pt-1.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-white group-hover:translate-x-1 transition-all">
                        <span>{cat.action}</span>
                        <span>➔</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION: "Événements à la une" (Matching Événements.png exactly)       */}
      {/* ========================================================================= */}
      <section id="featured-events" className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Row: Title on Left, View all link & carousel controls on Right */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a1c3d]">
                Événements à la une
              </h2>
              {(selectedCategoryFilter || organizerFilter || searchQuery) && (
                <p className="text-xs text-slate-500 mt-1">
                  {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} · Filtré par :{' '}
                  <span className="font-semibold text-slate-800">
                    {[selectedCategoryFilter, organizerFilter, searchQuery && `« ${searchQuery} »`].filter(Boolean).join(' · ')}
                  </span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 self-end sm:self-center">
              <button
                onClick={resetFilters}
                className="text-[#e01a22] hover:underline font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Voir tous les événements</span>
                <span>➔</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:border-slate-400 hover:text-black transition-all cursor-pointer shadow-2xs"
                  aria-label="Événement précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:border-slate-400 hover:text-black transition-all cursor-pointer shadow-2xs"
                  aria-label="Événement suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {eventsLoading && allEvents.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
              <Loader2 className="w-5 h-5 animate-spin text-red-600" /> Chargement des événements...
            </div>
          )}

          {viewMode === 'organizers' && (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {organizers.map(([name, count]) => (
                <button
                  key={name}
                  onClick={() => {
                    setOrganizerFilter(organizerFilter === name ? null : name);
                    setViewMode('cards');
                  }}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    organizerFilter === name ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0a1c3d]">
                    <Building2 className="w-4 h-4 text-red-600 shrink-0" />
                    <span className="line-clamp-2">{name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {count} événement{count > 1 ? 's' : ''} à venir
                  </div>
                </button>
              ))}
            </div>
          )}

          {viewMode === 'calendar' && (
            <div className="space-y-6">
              {Object.entries(eventsByMonth).map(([month, events]) => (
                <div key={month}>
                  <h3 className="text-sm font-black text-[#e01a22] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {month}
                  </h3>
                  <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    {events.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="w-full text-left p-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="w-14 text-center shrink-0">
                          <div className="text-lg font-black text-[#0a1c3d] leading-none">{ev.dateRange}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-[#0a1c3d] truncate">{ev.title}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#e01a22]" /> {ev.location} · {ev.time}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1] text-[10px] font-bold">{ev.category}</span>
                        {ev.isRegistered && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            Inscrit
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5 Cards Row (Exact 5-column layout on desktop matching screenshot) */}
          {viewMode !== 'calendar' && (
          <div
            ref={featuredRowRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-2"
          >
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                {/* Event Photo & Red Date Badge */}
                <div>
                  <div className="relative h-38 sm:h-40 w-full overflow-hidden bg-slate-100">
                    <img
                      src={resolveImage(ev.image)}
                      alt={ev.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {ev.isRegistered && (
                      <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white rounded-lg px-2 py-1 text-[10px] font-bold shadow-md z-10 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Inscrit
                      </div>
                    )}
                    
                    {/* Red Date Box Top-Left (Exact match to screenshot) */}
                    <div className="absolute top-2.5 left-2.5 bg-[#e01a22] text-white rounded-xl px-2.5 py-1.5 text-center shadow-md leading-none z-10">
                      <div className="text-xs font-black tracking-tight">{ev.dateRange}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5">{ev.monthYear}</div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5 space-y-1.5">
                    {/* Category Tag (Light blue pill) */}
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1] text-[10px] font-bold">
                      {ev.category}
                    </span>

                    {/* Event Title */}
                    <h3 className="text-sm font-extrabold text-[#0a1c3d] group-hover:text-[#e01a22] transition-colors leading-snug">
                      {ev.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <MapPin className="w-3 h-3 text-[#e01a22] shrink-0" />
                      <span>{ev.location}</span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed pt-0.5">
                      {ev.description}
                    </p>
                  </div>
                </div>

                {/* Subtle card bottom padding */}
                <div className="px-3.5 pb-3.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-red-600 group-hover:underline flex items-center gap-1">
                    En savoir plus <span>➔</span>
                  </span>
                  {ev.capacity > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {Math.max(0, ev.capacity - ev.registrationsCount)} places
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}

          {!eventsLoading && filteredEvents.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-slate-800 font-bold">Aucun événement ne correspond à votre recherche.</div>
              <button
                onClick={resetFilters}
                className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BANNER: "Participez aux événements qui créent des opportunités."       */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#030f24] text-white py-12 lg:py-16">
        {/* Night Skyline Backdrop */}
        <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
          <img
            src={chinaNightSkyline}
            alt="Shanghai Night Skyline"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 8 cols: CTA Text & Action Buttons */}
            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                Participez aux événements qui créent des opportunités.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Rejoignez la communauté QIAO et accédez à des invitations exclusives, des rencontres
                B2B et un accompagnement sur mesure.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onOpenRegister}
                  className="px-6 py-3 rounded-lg bg-[#e01a22] hover:bg-[#c8102e] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Créer un compte</span>
                </button>
                <button
                  onClick={() => setInvitationsModalOpen(true)}
                  className="px-6 py-3 rounded-lg bg-transparent hover:bg-white/10 border border-white/40 text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  Recevoir les invitations
                </button>
              </div>
            </div>

            {/* Right 4 cols: 4 Pillars with Circular Outline Icons matching screenshot */}
            <div className="lg:col-span-4 space-y-4 border-t lg:border-t-0 lg:border-l border-white/20 pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wider text-slate-200">
                <div className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center shrink-0">
                  <Compass className="w-3.5 h-3.5 text-slate-200" />
                </div>
                <span>DES RENCONTRES QUALIFIÉES</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wider text-slate-200">
                <div className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center shrink-0">
                  <Handshake className="w-3.5 h-3.5 text-slate-200" />
                </div>
                <span>DES PARTENARIATS RÉELS</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wider text-slate-200">
                <div className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center shrink-0">
                  <Globe className="w-3.5 h-3.5 text-slate-200" />
                </div>
                <span>UN RÉSEAU INTERNATIONAL</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wider text-slate-200">
                <div className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center shrink-0">
                  <Rocket className="w-3.5 h-3.5 text-slate-200" />
                </div>
                <span>UN IMPACT DURABLE</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. INSTITUTIONAL FOOTER (Matching Événements.png exactly)                 */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top row: Logo, Nav, Socials & Language dropdown */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            {/* QIAO Logo on left */}
            <div className="cursor-pointer" onClick={() => onNavigate('home')}>
              <Logo size="md" />
            </div>

            {/* Navigation links separated by pipe */}
            <nav className="flex flex-wrap items-center justify-center gap-x-3.5 sm:gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-600 font-medium">
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
              <button onClick={() => onNavigate('evenements')} className="text-red-600 font-bold cursor-pointer">
                Événements
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('resources')} className="hover:text-red-600 transition-colors cursor-pointer">
                Ressources
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('contact')} className="hover:text-red-600 transition-colors cursor-pointer">
                Contact
              </button>
            </nav>

            {/* Socials & Language dropdown button */}
            <div className="flex items-center gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-md bg-[#0a66c2] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4 fill-current" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-md bg-[#ff0000] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4 fill-current" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-md bg-black text-white flex items-center justify-center hover:opacity-90 transition-opacity font-bold text-xs"
                aria-label="X (Twitter)"
              >
                ✕
              </a>

              {/* Language Dropdown FR */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 text-xs font-bold text-slate-700 bg-white">
                <span>FR</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Bottom row: Legal links & Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <button onClick={() => openLegal('privacy')} className="hover:text-slate-800 transition-colors cursor-pointer">
                Confidentialité
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => openLegal('terms')} className="hover:text-slate-800 transition-colors cursor-pointer">
                Conditions d'utilisation
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => openLegal('legal')} className="hover:text-slate-800 transition-colors cursor-pointer">
                Mentions légales
              </button>
            </div>
            <div>
              © {new Date().getFullYear()} QIAO. Tous droits réservés.
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL: DETAILED EVENT VIEW                                                */}
      {/* ========================================================================= */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header with Event Image */}
            <div className="relative h-48 sm:h-56 w-full shrink-0">
              <img
                src={resolveImage(selectedEvent.image)}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
              
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-4 left-4 bg-[#e01a22] text-white rounded-xl px-3 py-1.5 text-center shadow-lg leading-none">
                <div className="text-sm font-black">{selectedEvent.dateRange}</div>
                <div className="text-[10px] font-bold uppercase mt-0.5">{selectedEvent.monthYear}</div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1] text-[11px] font-bold mb-1.5">
                  {selectedEvent.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {selectedEvent.title}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-200 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#e01a22]" />
                  <span>{selectedEvent.location}</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              <p className="text-slate-700 leading-relaxed font-medium">
                {selectedEvent.description}
              </p>

              {selectedEvent.details && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase">Organisateur</div>
                      <div className="text-xs font-semibold text-slate-900 mt-0.5">
                        {selectedEvent.details.organizer}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase">Participants attendus</div>
                      <div className="text-xs font-semibold text-slate-900 mt-0.5">
                        {selectedEvent.details.expectedAttendees}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-[11px] font-bold text-slate-500 uppercase">Lieu de l'événement</div>
                      <div className="text-xs font-semibold text-slate-900 mt-0.5">
                        {selectedEvent.details.venue}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-[#0a1c3d] text-xs uppercase tracking-wider mb-2">
                      Secteurs d'activité ciblés
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEvent.details.focusSectors.map((sec, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 text-xs font-medium border border-sky-100"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-[#0a1c3d] text-xs uppercase tracking-wider mb-2">
                      Points forts du programme
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedEvent.details.programHighlights.map((hl, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {selectedEvent.time}
                    </span>
                    {selectedEvent.capacity > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {selectedEvent.registrationsCount} inscrit(s) ·{' '}
                        {Math.max(0, selectedEvent.capacity - selectedEvent.registrationsCount)} places restantes
                      </span>
                    )}
                    {selectedEvent.details.website && (
                      <a
                        href={selectedEvent.details.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-700 font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Site officiel
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Fermer
              </button>

              {selectedEvent.isRegistered ? (
                <span className="px-5 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Vous êtes inscrit
                </span>
              ) : isPast(selectedEvent) ? (
                <span className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs">Événement terminé</span>
              ) : (
                <button
                  onClick={() => {
                    const ev = selectedEvent;
                    setSelectedEvent(null);
                    setRegistrationModalEvent(ev);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-[#e01a22] hover:bg-[#c8102e] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  S'inscrire à cet événement
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRATION TO EVENT                                              */}
      {/* ========================================================================= */}
      {registrationModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-[#0a1c3d] text-lg">Inscription à l'événement</h3>
                <p className="text-xs text-slate-500">{registrationModalEvent.title}</p>
              </div>
              <button
                onClick={() => setRegistrationModalEvent(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registeredBadge ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-[#0a1c3d]">Demande d'accréditation confirmée</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Notre équipe va vous transmettre votre badge et les modalités de matchmaking B2B par email.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                  <Ticket className="w-4 h-4 text-[#e01a22]" />
                  <span className="text-xs text-slate-500">N° de badge</span>
                  <span className="font-mono font-bold text-[#0a1c3d]">{registeredBadge}</span>
                </div>
                <div>
                  <button
                    onClick={() => setRegistrationModalEvent(null)}
                    className="mt-2 px-5 py-2 rounded-lg bg-[#0a1c3d] text-white text-xs font-bold cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterEventSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet</label>
                  <input
                    type="text"
                    required
                    value={registrationForm.fullName}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, fullName: e.target.value })}
                    placeholder="ex. Mohamed Ben Salem"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0a1c3d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email professionnel</label>
                  <input
                    type="email"
                    required
                    value={registrationForm.email}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                    placeholder="nom@entreprise.com"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0a1c3d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom de l'entreprise &amp; Rôle</label>
                  <input
                    type="text"
                    required
                    value={registrationForm.companyRole}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, companyRole: e.target.value })}
                    placeholder="Entreprise, Fonction"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0a1c3d]"
                  />
                </div>
                {formError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-lg bg-[#e01a22] hover:bg-[#c8102e] text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Valider mon inscription
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECEVOIR LES INVITATIONS                                           */}
      {/* ========================================================================= */}
      {invitationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-[#0a1c3d] text-lg">Recevoir les invitations</h3>
                <p className="text-xs text-slate-500">
                  Accédez en avant-première aux délégations B2B et salons bilatéraux.
                </p>
              </div>
              <button
                onClick={() => setInvitationsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-[#0a1c3d]">Vous êtes inscrit !</h4>
                <p className="text-xs text-slate-600">
                  Vous recevrez prochainement les invitations exclusives aux événements QIAO.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Votre email professionnel</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="contact@societe.com"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0a1c3d]"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-lg bg-[#e01a22] hover:bg-[#c8102e] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>M'abonner aux alertes événements</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
