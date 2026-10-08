import React, { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { TechHumanSection } from './components/TechHumanSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { AcademySection } from './components/AcademySection';
import { SuccessStoriesSection } from './components/SuccessStoriesSection';
import { PartnersNetworkSection } from './components/PartnersNetworkSection';
import { ResourcesSection } from './components/ResourcesSection';
import { ContactFooterSection } from './components/ContactFooterSection';
import { IntelligencePage } from './components/IntelligencePage';
import { AcademyPage } from './components/AcademyPage';
import { SecteursPage } from './components/SecteursPage';
import { SectorDetailPage } from './components/SectorDetailPage';
import { CommerceHubPage } from './components/commerce-hub/CommerceHubPage';
import { AboutPage } from './components/AboutPage';
import { CommunityPage } from './components/CommunityPage';
import { ContactPage } from './components/ContactPage';
import { EventsPage } from './components/EventsPage';
import { ResourcesPage } from './components/ResourcesPage';
import { DashboardPage } from './components/DashboardPage';

// Modals
import { ImportCalculatorModal } from './components/Modals/ImportCalculatorModal';
import { VideoModal } from './components/Modals/VideoModal';
import { AuthModal } from './components/Modals/AuthModal';
import { AppointmentModal } from './components/Modals/AppointmentModal';
import { ServiceDetailModal } from './components/Modals/ServiceDetailModal';
import { CaseStudyModal } from './components/Modals/CaseStudyModal';
import { CourseDetailModal } from './components/Modals/CourseDetailModal';
import { ArticleModal } from './components/Modals/ArticleModal';
import { DocumentModal } from './components/Modals/DocumentModal';
import { OpportunityApplyModal } from './components/Modals/OpportunityApplyModal';
import { LegalModal } from './components/Modals/LegalModal';
import { SearchHit, SearchModal } from './components/Modals/SearchModal';

import {
  AppTab,
  CommerceHubTab,
  ServiceItem,
  CaseStudy,
  TrainingDomain,
} from './types';
import heroClearBg from './data/herophoto.jpg';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import {
  AppActions,
  AppActionsContext,
  AppointmentContext,
  ContactPrefill,
  LegalKind,
} from './context/AppActionsContext';
import { useApi } from './hooks/useApi';
import { api } from './lib/api';
import { Opportunity } from './lib/models';

/** Élément à mettre en avant à l'arrivée sur une page (résultat de recherche). */
export interface PageFocus {
  type: 'event' | 'course' | 'company';
  id: string;
}

const ORIENTATION_KEY = 'qiao.orientation';
const LANGUAGE_KEY = 'qiao.language';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Préférence non persistée (stockage indisponible).
  }
}

export default function App() {
  const { user, openAuth, updateProfile } = useAuth();
  const { notify } = useToast();

  // Active Navigation Tracking - Default to evenements as requested
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) return tabParam as AppTab;
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== '') return hash as AppTab;
    }
    return 'evenements';
  });
  const [activeCommerceSubTab, setActiveCommerceSubTab] = useState<CommerceHubTab>('analyses');
  const [focus, setFocus] = useState<PageFocus | null>(null);

  // App filters & interactive states
  const [currentLang, setCurrentLang] = useState(() => readStorage(LANGUAGE_KEY) ?? 'FR');
  const [selectedOrientation, setSelectedOrientation] = useState<'china' | 'north-africa' | null>(
    () => readStorage(ORIENTATION_KEY) as 'china' | 'north-africa' | null,
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactPrefill, setContactPrefill] = useState<ContactPrefill | null>(null);

  // Modal states
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [appointment, setAppointment] = useState<{ isOpen: boolean; context?: AppointmentContext }>({ isOpen: false });
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<TrainingDomain | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [applyOpportunity, setApplyOpportunity] = useState<Opportunity | null>(null);
  const [legalKind, setLegalKind] = useState<LegalKind | null>(null);
  const [search, setSearch] = useState<{ isOpen: boolean; query: string }>({ isOpen: false, query: '' });
  const [selectedSectorId, setSelectedSectorId] = useState<string>('sante');

  const { data: servicesData = [] } = useApi<ServiceItem[]>('/services', undefined, []);

  // La langue du compte prime sur la préférence locale.
  useEffect(() => {
    if (user?.language) setCurrentLang(user.language);
  }, [user?.language]);

  useEffect(() => {
    document.documentElement.lang = currentLang.toLowerCase();
  }, [currentLang]);

  const handleSelectLang = (code: string) => {
    setCurrentLang(code);
    writeStorage(LANGUAGE_KEY, code);
    if (user) updateProfile({ language: code }).catch(() => undefined);
  };

  const handleSelectSector = (sectorId: string) => {
    if (
      sectorId === 'commerce' ||
      sectorId === 'commerce-hub' ||
      sectorId === 'e-commerce' ||
      sectorId === 'commerce-et-e-commerce'
    ) {
      setActiveTab('commerce-hub');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    let targetSector = sectorId;
    if (sectorId === 'technologie' || sectorId === 'technologies' || sectorId === 'technology') {
      targetSector = 'tech';
    } else if (
      sectorId === 'tourism' ||
      sectorId === 'tourisme-et-services' ||
      sectorId === 'tourisme-et-culture' ||
      sectorId === 'tourisme-culture'
    ) {
      targetSector = 'tourisme';
    } else if (
      sectorId === 'immobilier' ||
      sectorId === 'construction-immobilier' ||
      sectorId === 'construction-et-immobilier'
    ) {
      targetSector = 'construction';
    } else if (
      sectorId === 'energy' ||
      sectorId === 'energies' ||
      sectorId === 'energies-renouvelables' ||
      sectorId === 'energie-et-energies-renouvelables'
    ) {
      targetSector = 'energie';
    } else if (
      sectorId === 'pharma' ||
      sectorId === 'sante-pharma' ||
      sectorId === 'sante-et-pharma' ||
      sectorId === 'health' ||
      sectorId === 'sante-et-sciences-de-la-vie'
    ) {
      targetSector = 'sante';
    }
    setSelectedSectorId(targetSector);
    setActiveTab('sector-detail');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Handle navigation across tabs & dedicated pages
  const handleScrollToSection = (tab: AppTab | string) => {
    if (tab === 'logistique') {
      setSelectedSectorId('logistique');
      setActiveTab('sector-detail');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    if (tab === 'tech' || tab === 'technologie' || tab === 'technologies' || tab === 'technology') {
      setSelectedSectorId('tech');
      setActiveTab('sector-detail');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    if (tab === 'tourisme' || tab === 'tourism') {
      setSelectedSectorId('tourisme');
      setActiveTab('sector-detail');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    if (
      tab === 'construction' ||
      tab === 'immobilier' ||
      tab === 'construction-immobilier' ||
      tab === 'construction-et-immobilier'
    ) {
      setSelectedSectorId('construction');
      setActiveTab('sector-detail');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    if (
      tab === 'energie' ||
      tab === 'energy' ||
      tab === 'energies' ||
      tab === 'energies-renouvelables'
    ) {
      setSelectedSectorId('energie');
      setActiveTab('sector-detail');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    if (
      tab === 'sante' ||
      tab === 'pharma' ||
      tab === 'sante-pharma' ||
      tab === 'health' ||
      tab === 'sante-et-pharma'
    ) {
      setSelectedSectorId('sante');
      setActiveTab('sector-detail');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    // Onglets du hub Commerce accessibles directement (ex. « entreprises », « opportunites »)
    const commerceTabs: CommerceHubTab[] = [
      'vue-ensemble',
      'flux-commerciaux',
      'produits',
      'marches-ecommerce',
      'entreprises',
      'opportunites',
      'reglementation',
      'rapports',
      'analyses',
    ];
    if (commerceTabs.includes(tab as CommerceHubTab)) {
      setActiveCommerceSubTab(tab as CommerceHubTab);
      setActiveTab('commerce-hub');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    if (tab === 'dashboard' && !user) {
      openAuth('login', 'Connectez-vous pour accéder à votre espace membre.');
      return;
    }

    const targetTab = tab as AppTab;
    setActiveTab(targetTab);

    if (
      targetTab === 'intelligence' ||
      targetTab === 'academy' ||
      targetTab === 'secteurs' ||
      targetTab === 'sector-detail' ||
      targetTab === 'commerce-hub' ||
      targetTab === 'about' ||
      targetTab === 'community' ||
      targetTab === 'contact' ||
      targetTab === 'evenements' ||
      targetTab === 'stories' ||
      targetTab === 'resources' ||
      targetTab === 'dashboard' ||
      targetTab === 'home'
    ) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    // If returning from dedicated page or scrolling to a section
    setTimeout(() => {
      const targetId = tab === 'home' ? 'hero' : tab;
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, 50);
  };

  // Garde la barre d'adresse synchronisée pour pouvoir partager / recharger une page.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    url.hash = '';
    window.history.replaceState(null, '', url.toString());
  }, [activeTab]);

  // Une page protégée ne reste pas affichée après la déconnexion.
  useEffect(() => {
    if (activeTab === 'dashboard' && !user) {
      const timer = setTimeout(() => setActiveTab('home'), 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, user]);

  const handleOpenLogin = () => openAuth('login');
  const handleOpenRegister = () => openAuth('register');

  const contactUs = useCallback((prefill?: ContactPrefill) => {
    setContactPrefill(prefill ?? null);
    setActiveTab('contact');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleRequestQuote = (serviceTitle: string) => {
    contactUs({
      subject: 'Demande de devis / accompagnement',
      message: `Bonjour, je souhaite recevoir un devis pour le service « ${serviceTitle} ».\n\nMon projet : `,
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    handleScrollToSection('services');
  };

  const handleSelectCategory = (cat: string | null) => {
    setSelectedCategory(cat);
  };

  const handleSelectOrientation = (origin: 'china' | 'north-africa') => {
    setSelectedOrientation(origin);
    writeStorage(ORIENTATION_KEY, origin);
    notify(
      origin === 'china'
        ? 'Parcours « Chine → Afrique du Nord » activé : implantation, distribution et partenaires locaux.'
        : 'Parcours « Afrique du Nord → Chine » activé : sourcing, export et accès au marché chinois.',
      'info',
    );
    handleScrollToSection('services');
  };

  const handleSearchHit = async (hit: SearchHit) => {
    try {
      switch (hit.type) {
        case 'service': {
          const service = await api.get<ServiceItem>(`/services/${hit.id}`);
          handleScrollToSection('services');
          setSelectedService(service);
          break;
        }
        case 'opportunity':
          setApplyOpportunity(await api.get<Opportunity>(`/opportunities/${hit.id}`));
          break;
        case 'document':
          setSelectedDocument(hit.id);
          break;
        case 'article':
          setSelectedArticleId(hit.id);
          break;
        case 'event':
          setFocus({ type: 'event', id: hit.id });
          handleScrollToSection('evenements');
          break;
        case 'course':
          setFocus({ type: 'course', id: hit.id });
          handleScrollToSection('academy');
          break;
        case 'company':
          setFocus({ type: 'company', id: hit.id });
          handleScrollToSection('entreprises');
          break;
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Élément introuvable.', 'error');
    }
  };

  const actions: AppActions = {
    navigate: (tab: string) => handleScrollToSection(tab),
    openAppointment: (context?: AppointmentContext) => setAppointment({ isOpen: true, context }),
    openCalculator: () => setIsCalculatorOpen(true),
    openLegal: (kind: LegalKind) => setLegalKind(kind),
    contactUs,
    openArticle: (articleId: string) => setSelectedArticleId(articleId),
    openDocument: (titleOrId: string) => setSelectedDocument(titleOrId),
    applyToOpportunity: (opportunity: Opportunity) => setApplyOpportunity(opportunity),
    openSearch: (query?: string) => setSearch({ isOpen: true, query: query ?? '' }),
  };

  // Filtered services based on search and orientation/category
  const filteredServices = servicesData.filter((service) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        service.title.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q) ||
        service.category.toLowerCase().includes(q) ||
        (service.details ?? []).some((detail) => detail.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }
    if (selectedCategory && selectedCategory !== 'Tous') {
      if (!service.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const openAppointment = () => setAppointment({ isOpen: true });

  return (
    <AppActionsContext.Provider value={actions}>
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-red-500 selection:text-white flex flex-col justify-between w-full max-w-full overflow-x-hidden">

      {/* 1. Sticky Navigation Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleScrollToSection}
        currentLang={currentLang}
        onSelectLang={handleSelectLang}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onOpenAuth={(mode) => openAuth(mode)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenSearch={() => setSearch({ isOpen: true, query: '' })}
        onSelectServiceCategory={(cat) => {
          setSelectedCategory(cat);
          setSearchQuery('');
          handleScrollToSection('services');
        }}
        onSelectSector={handleSelectSector}
      />

      {/* Conditional: Dedicated Intelligence Page, Academy Page, Secteurs Page, Sector Detail Page, OR Main Landing Page */}
      {activeTab === 'dashboard' && user ? (
        <DashboardPage onNavigate={handleScrollToSection} />
      ) : activeTab === 'intelligence' ? (
        <IntelligencePage
          onNavigate={handleScrollToSection}
          onRequestAnalysis={() => setAppointment({ isOpen: true, context: { specialty: 'partenariat', source: 'intelligence' } })}
          onOpenRegister={handleOpenRegister}
        />
      ) : activeTab === 'academy' ? (
        <AcademyPage
          onNavigate={handleScrollToSection}
          onOpenRegister={handleOpenRegister}
          focus={focus?.type === 'course' ? focus : null}
          onFocusHandled={() => setFocus(null)}
        />
      ) : activeTab === 'secteurs' ? (
        <SecteursPage
          onSelectSector={handleSelectSector}
          onNavigate={handleScrollToSection}
          onOpenContact={() => contactUs({ subject: 'Partenariat commercial & distribution' })}
        />
      ) : activeTab === 'sector-detail' ? (
        <SectorDetailPage
          sectorId={selectedSectorId}
          onBackToSectors={() => {
            setActiveTab('secteurs');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onNavigate={handleScrollToSection}
          onOpenRegister={handleOpenRegister}
          onOpenAppointment={() => setAppointment({ isOpen: true, context: { source: `secteur-${selectedSectorId}` } })}
        />
      ) : activeTab === 'commerce-hub' ? (
        <CommerceHubPage
          initialTab={activeCommerceSubTab}
          onNavigateTab={handleScrollToSection}
          onOpenConsultation={() => setAppointment({ isOpen: true, context: { specialty: 'partenariat', source: 'commerce-hub' } })}
          onOpenSignUp={handleOpenRegister}
          focus={focus?.type === 'company' ? focus : null}
          onFocusHandled={() => setFocus(null)}
        />
      ) : activeTab === 'about' ? (
        <AboutPage
          onNavigate={handleScrollToSection}
          onOpenRegister={handleOpenRegister}
          onOpenContact={() => contactUs()}
          onOpenVideo={() => setIsVideoOpen(true)}
        />
      ) : activeTab === 'community' ? (
        <CommunityPage
          onNavigate={handleScrollToSection}
          onOpenRegister={handleOpenRegister}
          onOpenContact={() => contactUs()}
        />
      ) : activeTab === 'contact' ? (
        <ContactPage
          onNavigate={handleScrollToSection}
          onOpenRegister={handleOpenRegister}
          prefill={contactPrefill}
          onPrefillConsumed={() => setContactPrefill(null)}
        />
      ) : activeTab === 'evenements' || activeTab === 'stories' ? (
        <EventsPage
          onNavigate={handleScrollToSection}
          onOpenRegister={handleOpenRegister}
          onSelectSector={handleSelectSector}
          focus={focus?.type === 'event' ? focus : null}
          onFocusHandled={() => setFocus(null)}
        />
      ) : activeTab === 'resources' ? (
        <ResourcesPage
          onNavigate={handleScrollToSection}
          onOpenRegister={handleOpenRegister}
          onSelectSector={handleSelectSector}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
        />
      ) : (
        /* Main Single Page with All Sections Stacked Vertically */
        <main className="flex-1 w-full max-w-full overflow-x-hidden">

          {/* ========================================================================= */}
          {/* SECTION 1: HERO (ACCUEIL)                                                 */}
          {/* ========================================================================= */}
          <section id="hero" className="relative overflow-hidden w-full">
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <img
              src={heroClearBg}
              alt="QIAO Bridge - Connecting China and North Africa"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            {/* Refined Blue/Vibrant Overlay - Lighter in the center to make the background photo much more apparent */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#07152b]/60 via-[#07152b]/15 to-[#07152b]/70" />
          </div>

          <Hero
            selectedOrientation={selectedOrientation}
            onSelectOrientation={handleSelectOrientation}
            onSearch={handleSearch}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSearchQuery('');
              handleScrollToSection('services');
            }}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
            onOpenRegister={handleOpenRegister}
            onOpenVideo={() => setIsVideoOpen(true)}
            onExploreServices={() => handleScrollToSection('services')}
          />
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: SERVICES & CATALOGUE                                          */}
        {/* ========================================================================= */}
        <section id="services" className="scroll-mt-16 w-full">
          <ServicesSection
            services={filteredServices}
            activeCategory={selectedCategory}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onSearchEverywhere={() => setSearch({ isOpen: true, query: searchQuery })}
            onSelectCategory={handleSelectCategory}
            onSelectService={(service) => setSelectedService(service)}
            onOpenAllServicesModal={() => {
              setSelectedCategory('Tous');
              setSearchQuery('');
            }}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
            onOpenAppointment={openAppointment}
          />
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: POURQUOI QIAO / EXPERTISE & INTELLIGENCE                      */}
        {/* ========================================================================= */}
        <section id="why-qiao" className="scroll-mt-16 w-full">
          <TechHumanSection
            onOpenVideo={() => setIsVideoOpen(true)}
            onOpenMission={() => handleScrollToSection('how-it-works')}
          />
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: MÉTHODOLOGIE / COMMENT ÇA MARCHE                               */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="scroll-mt-16 w-full">
          <HowItWorksSection
            onJoinNow={handleOpenRegister}
            onOpenVideo={() => setIsVideoOpen(true)}
          />
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: QIAO ACADEMY                                                  */}
        {/* ========================================================================= */}
        <section id="academy" className="scroll-mt-16 w-full">
          <AcademySection
            onSelectDomain={(domain) => setSelectedDomain(domain)}
            onExploreCourses={() => handleScrollToSection('academy')}
            onOpenVideo={() => setIsVideoOpen(true)}
          />
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: SUCCÈS & TÉMOIGNAGES                                          */}
        {/* ========================================================================= */}
        <section id="stories" className="scroll-mt-16 w-full">
          <SuccessStoriesSection
            onSelectCaseStudy={(study) => setSelectedCaseStudy(study)}
            onContactExpert={() => contactUs()}
            onBookAppointment={openAppointment}
          />
        </section>

        {/* ========================================================================= */}
        {/* SECTION 7: PARTENAIRES & RÉSEAU INSTITUTIONNEL                            */}
        {/* ========================================================================= */}
        <section id="partners" className="scroll-mt-16 w-full">
          <PartnersNetworkSection
            onStartNow={handleOpenRegister}
            onBookAppointment={() => setAppointment({ isOpen: true, context: { specialty: 'partenariat', source: 'partenaires' } })}
            onContactUs={() => contactUs({ subject: 'Partenariat commercial & distribution' })}
          />
        </section>

        {/* ========================================================================= */}
        {/* SECTION 8: RESSOURCES, ARTICLES & SIMULATEURS                             */}
        {/* ========================================================================= */}
        <section id="resources" className="scroll-mt-16 w-full">
          <ResourcesSection
            onOpenArticle={(articleId) => setSelectedArticleId(articleId)}
            onOpenReport={(documentId) => setSelectedDocument(documentId)}
            onOpenEvent={(eventId) => {
              setFocus({ type: 'event', id: eventId });
              handleScrollToSection('evenements');
            }}
            onOpenTool={(toolId) => {
              if (toolId === 'tool-customs') handleScrollToSection('reglementation');
              else if (toolId === 'tool-directory') handleScrollToSection('entreprises');
              else setIsCalculatorOpen(true);
            }}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
            onJoinCommunity={() => (user ? handleScrollToSection('community') : handleOpenRegister())}
            onViewAll={(section) => handleScrollToSection(section)}
          />
        </section>

        {/* ========================================================================= */}
        {/* SECTION 9: CONTACT & FOOTER                                              */}
        {/* ========================================================================= */}
        <ContactFooterSection
          showOnlyFooter={false}
          onScrollToSection={handleScrollToSection}
        />
      </main>
      )}

      {/* Interactive Modals */}
      <ImportCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
      />

      <AuthModal defaultOrigin={selectedOrientation} />

      <AppointmentModal
        isOpen={appointment.isOpen}
        context={appointment.context}
        onClose={() => setAppointment({ isOpen: false })}
      />

      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onRequestQuote={handleRequestQuote}
      />

      <CaseStudyModal
        study={selectedCaseStudy}
        onClose={() => setSelectedCaseStudy(null)}
        onStartSimilarProject={() =>
          contactUs({
            subject: 'Sourcing & audit d\'usine en Chine',
            message: `Bonjour, je souhaite lancer un projet similaire au cas « ${selectedCaseStudy?.company ?? ''} ».\n\nMon besoin : `,
          })
        }
      />

      <CourseDetailModal
        domain={selectedDomain}
        onClose={() => setSelectedDomain(null)}
        onOpenCatalog={() => handleScrollToSection('academy')}
      />

      <ArticleModal
        articleId={selectedArticleId}
        onClose={() => setSelectedArticleId(null)}
        onContactSpecialist={(article) =>
          contactUs({
            subject: 'Autre demande',
            message: `Bonjour, suite à la lecture de l'analyse « ${article.title} », je souhaiterais échanger avec un expert QIAO.\n\n`,
          })
        }
      />

      <DocumentModal
        documentKey={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onContactAnalyst={(doc) =>
          contactUs({
            subject: 'Autre demande',
            message: `Bonjour, je souhaite une analyse sur-mesure en complément du document « ${doc.title} ».\n\n`,
          })
        }
      />

      <OpportunityApplyModal
        opportunity={applyOpportunity}
        onClose={() => setApplyOpportunity(null)}
      />

      <LegalModal kind={legalKind} onClose={() => setLegalKind(null)} />

      <SearchModal
        isOpen={search.isOpen}
        initialQuery={search.query}
        onClose={() => setSearch({ isOpen: false, query: '' })}
        onSelect={handleSearchHit}
      />
    </div>
    </AppActionsContext.Provider>
  );
}
