import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  ArrowLeftRight,
  Package,
  ShoppingCart,
  Building2,
  Target,
  FileText,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  Download,
  Share2,
  ArrowRight,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import { AppTab, CommerceHubTab } from '../../types';
import { VueEnsembleTab } from './tabs/VueEnsembleTab';
import { FluxCommerciauxTab } from './tabs/FluxCommerciauxTab';
import { ProduitsTab } from './tabs/ProduitsTab';
import { MarchesEcommerceTab } from './tabs/MarchesEcommerceTab';
import { EntreprisesTab } from './tabs/EntreprisesTab';
import { OpportunitesTab } from './tabs/OpportunitesTab';
import { ReglementationTab } from './tabs/ReglementationTab';
import { RapportsTab } from './tabs/RapportsTab';
import { AnalysesTab } from './tabs/AnalysesTab';
import { CommerceHubBottomBanner } from './components/CommerceHubBottomBanner';
import { FlagIcon } from '../common/FlagIcon';
import { useDownloads } from '../../hooks/useDownloads';
import { useAppActions } from '../../context/AppActionsContext';
import { slugify } from '../../lib/text';
import ecommerceCargoShipImg from '../../assets/images/ecommerce_hero_cargo_ship_1790887696581.jpg';
import reglementationHeroPortImg from '../../assets/images/reglementation_hero_port_1790896278386.jpg';
import rapportsHeroReportsImg from '../../assets/images/rapports_hero_reports_1790896412608.jpg';
import produitsHeroContainerImg from '../../assets/images/produits_hero_container_1790896614549.jpg';
import opportunitesHeroImg from '../../assets/images/opportunites_hero_handshake_port_1790897415451.jpg';
import entreprisesHeroImg from '../../assets/images/china_africa_handshake_1787501713904.jpg';
import ecommerceDevicesImg from '../../assets/images/ecommerce_devices_marketplace_1790934935730.jpg';
import analysesHeroDeskImg from '../../assets/images/intelligence_globe_hero_1789905766229.jpg';

interface CommerceHubPageProps {
  initialTab?: CommerceHubTab;
  onNavigateTab: (tab: AppTab) => void;
  onOpenConsultation?: () => void;
  onOpenSignUp?: () => void;
  focus?: { type: string; id: string } | null;
  onFocusHandled?: () => void;
}

export const CommerceHubPage: React.FC<CommerceHubPageProps> = ({
  initialTab = 'analyses',
  onNavigateTab,
  onOpenConsultation,
  onOpenSignUp,
  focus,
  onFocusHandled,
}) => {
  const [activeCommerceTab, setActiveCommerceTab] = useState<CommerceHubTab>(initialTab);
  const [focusCompanyId, setFocusCompanyId] = useState<string | null>(null);
  const { openDocument, openArticle } = useAppActions();

  // Recherche globale : l'entreprise choisie s'ouvre dans l'onglet Entreprises.
  useEffect(() => {
    if (focus?.type !== 'company') return;
    setActiveCommerceTab('entreprises');
    setFocusCompanyId(focus.id);
    onFocusHandled?.();
  }, [focus, onFocusHandled]);
  const [modalReportTitle, setModalReportTitle] = useState<string | null>(null);
  const { downloadDocument } = useDownloads();

  useEffect(() => {
    if (initialTab) {
      setActiveCommerceTab(initialTab);
    }
  }, [initialTab]);

  // Mobile : l'onglet actif reste visible dans la ligne d'onglets qui défile.
  const tabsRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = tabsRow.current;
    const active = row?.querySelector<HTMLElement>(`[data-hub-tab="${activeCommerceTab}"]`);
    if (!row || !active || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2, behavior: 'smooth' });
  }, [activeCommerceTab]);

  // Tab definitions exactly matching screenshot: icon on top, label below
  const navTabs: { id: CommerceHubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'vue-ensemble', label: "Vue d'ensemble", icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'flux-commerciaux', label: 'Flux commerciaux', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { id: 'produits', label: 'Produits', icon: <Package className="w-5 h-5" /> },
    { id: 'marches-ecommerce', label: 'Marchés e-commerce', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'entreprises', label: 'Entreprises', icon: <Building2 className="w-5 h-5" /> },
    { id: 'opportunites', label: 'Opportunités', icon: <Target className="w-5 h-5" /> },
    { id: 'reglementation', label: 'Réglementation', icon: <FileText className="w-5 h-5" /> },
    { id: 'rapports', label: 'Rapports & Études', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'analyses', label: 'Analyses', icon: <Lightbulb className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: DYNAMIC ACCORDING TO ACTIVE SUB-TAB                        */}
      {/* ========================================================================= */}
      <div className="relative bg-white border-b border-slate-200 overflow-hidden pt-24 sm:pt-28 pb-6 lg:pb-16 flex flex-col lg:flex-row lg:items-center lg:min-h-[440px]">
        
        {/* Right Side: Photo with High Opacity & Clean Presentation */}
        <div className="hub-hero-media order-last lg:order-none relative mt-6 mx-4 sm:mx-6 h-52 sm:h-72 rounded-2xl lg:rounded-none lg:mx-0 lg:mt-0 lg:h-auto lg:absolute lg:right-0 lg:top-[72px] lg:bottom-0 pointer-events-none select-none overflow-hidden">
          <img
            src={
              activeCommerceTab === 'opportunites'
                ? opportunitesHeroImg
                : activeCommerceTab === 'marches-ecommerce'
                ? ecommerceDevicesImg
                : activeCommerceTab === 'entreprises'
                ? entreprisesHeroImg
                : activeCommerceTab === 'produits'
                ? produitsHeroContainerImg
                : activeCommerceTab === 'rapports'
                ? rapportsHeroReportsImg
                : activeCommerceTab === 'analyses'
                ? analysesHeroDeskImg
                : activeCommerceTab === 'reglementation'
                ? reglementationHeroPortImg
                : ecommerceCargoShipImg
            }
            alt={
              activeCommerceTab === 'opportunites'
                ? "Opportunités d'affaires Chine - Afrique du Nord"
                : activeCommerceTab === 'marches-ecommerce'
                ? "Marchés e-commerce Chine - Afrique du Nord"
                : activeCommerceTab === 'entreprises'
                ? "Entreprises et acteurs clés Chine - Afrique du Nord"
                : activeCommerceTab === 'produits'
                ? "Produits et opportunités d'échanges Chine - Afrique du Nord"
                : activeCommerceTab === 'rapports'
                ? "Rapports & Études économiques Chine - Afrique du Nord"
                : activeCommerceTab === 'reglementation'
                ? "Réglementation et douanes Chine - Afrique du Nord"
                : activeCommerceTab === 'analyses'
                ? "Analyses et insights économiques Chine - Afrique du Nord"
                : "Commerce et E-commerce Chine - Afrique du Nord"
            }
            className={`w-full h-full opacity-100 contrast-[1.06] saturate-[1.1] ${
              activeCommerceTab === 'reglementation'
                ? 'object-cover object-[center_top] lg:object-top'
                : 'object-cover object-center'
            }`}
          />

          {/* Minimal, soft left edge feathering only to let photo shine strongly */}
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none" />


        </div>

        {/* Left Side Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <div className="max-w-2xl lg:max-w-[34rem]">
            
            {/* Top Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3">
              <button
                onClick={() => onNavigateTab('home')}
                className="text-[#e50028] font-bold hover:underline cursor-pointer"
              >
                QIAO
              </button>
              <span className="text-slate-500 font-normal">Intelligence</span>
              <span className="text-slate-300">&gt;</span>
              <button
                onClick={() => onNavigateTab('secteurs')}
                className="text-slate-500 hover:text-[#e50028] cursor-pointer"
              >
                Secteurs
              </button>
              <span className="text-slate-300">&gt;</span>
              <button
                onClick={() => setActiveCommerceTab('vue-ensemble')}
                className={`hover:text-[#e50028] cursor-pointer ${
                  activeCommerceTab === 'vue-ensemble' ? 'text-slate-800 font-semibold' : 'text-slate-600'
                }`}
              >
                Commerce & E-commerce
              </button>
              {activeCommerceTab !== 'vue-ensemble' && (
                <>
                  <span className="text-slate-300">&gt;</span>
                  <span className="text-slate-800 font-semibold">
                    {navTabs.find((t) => t.id === activeCommerceTab)?.label}
                  </span>
                </>
              )}
            </div>

            {/* Corridor Flag Badge */}
            {activeCommerceTab === 'marches-ecommerce' && (
              <div className="inline-flex items-center gap-2 bg-slate-900/5 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200/80 mb-2.5">
                <FlagIcon country="CN" size="xs" />
                <span className="text-[11px] font-bold text-slate-700">Chine</span>
                <span className="text-slate-400 text-xs">↔</span>
                <div className="flex items-center -space-x-1">
                  <FlagIcon country="MA" size="xs" />
                  <FlagIcon country="DZ" size="xs" />
                  <FlagIcon country="TN" size="xs" />
                  <FlagIcon country="EG" size="xs" />
                  <FlagIcon country="LY" size="xs" />
                </div>
                <span className="text-[11px] font-bold text-slate-700">Afrique du Nord</span>
              </div>
            )}

            {/* Main Bold Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-[#0f2c69] leading-tight">
              {activeCommerceTab === 'marches-ecommerce' ? (
                <>
                  Marchés <span className="text-[#0066cc]">e-commerce</span>
                </>
              ) : activeCommerceTab === 'opportunites' ? (
                'Opportunités'
              ) : activeCommerceTab === 'entreprises' ? (
                'Entreprises'
              ) : activeCommerceTab === 'produits' ? (
                'Produits'
              ) : activeCommerceTab === 'reglementation' ? (
                'Réglementation'
              ) : activeCommerceTab === 'rapports' ? (
                'Rapports & Études'
              ) : activeCommerceTab === 'analyses' ? (
                'Analyses'
              ) : activeCommerceTab === 'flux-commerciaux' ? (
                'Flux commerciaux'
              ) : (
                'Commerce & E-commerce'
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-[19px] font-bold text-[#0c2448] mt-2 tracking-tight">
              {activeCommerceTab === 'marches-ecommerce'
                ? 'Des plateformes. Des tendances. Des opportunités réelles.'
                : activeCommerceTab === 'opportunites'
                ? 'Des projets concrets. Des partenaires réels. Un impact durable.'
                : activeCommerceTab === 'entreprises'
                ? 'Des partenaires. Des marchés. Des opportunités.'
                : activeCommerceTab === 'produits'
                ? 'Des marchés à fort potentiel. Des opportunités concrètes.'
                : activeCommerceTab === 'reglementation'
                ? 'Des règles claires pour des échanges plus simples.'
                : activeCommerceTab === 'rapports'
                ? 'Des données fiables. Des analyses approfondies. Des décisions éclairées.'
                : activeCommerceTab === 'analyses'
                ? 'Des insights pour de meilleures décisions.'
                : activeCommerceTab === 'flux-commerciaux'
                ? 'Des données claires. Des opportunités concrètes.'
                : 'Des échanges plus intelligents. Des opportunités réelles.'}
            </p>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 font-normal mt-3.5 max-w-xl leading-relaxed">
              {activeCommerceTab === 'marches-ecommerce'
                ? 'Analysez les marchés e-commerce en Chine et en Afrique du Nord. Découvrez les plateformes clés, les comportements d’achat, les produits les plus demandés et les opportunités pour votre entreprise.'
                : activeCommerceTab === 'opportunites'
                ? 'Découvrez des opportunités d’affaires vérifiées entre la Chine et l’Afrique du Nord dans le commerce et l’e-commerce : importation, exportation, distribution, partenariats, investissement et joint ventures.'
                : activeCommerceTab === 'entreprises'
                ? "Découvrez les entreprises chinoises et nord-africaines actives dans le commerce et l'e-commerce. Identifiez des partenaires, fournisseurs, distributeurs et clients pour développer votre activité."
                : activeCommerceTab === 'produits'
                ? 'Explorez les produits les plus échangés entre la Chine et l’Afrique du Nord. Identifiez les tendances, la demande, les opportunités d’import-export et trouvez les bons partenaires.'
                : activeCommerceTab === 'reglementation'
                ? 'Accédez à toutes les informations réglementaires pour importer, exporter et faire du business entre la Chine et l’Afrique du Nord. Procédures, normes, tarifs douaniers, accords commerciaux et guides pratiques.'
                : activeCommerceTab === 'rapports'
                ? 'Accédez à des rapports exclusifs, des études de marché et des analyses stratégiques sur le commerce et l’e-commerce entre la Chine et l’Afrique du Nord. Des insights concrets pour saisir les opportunités et anticiper les tendances.'
                : activeCommerceTab === 'analyses'
                ? "Explorez des analyses avancées sur le commerce et l'e-commerce entre la Chine et l'Afrique du Nord. Des données fiables, des tendances claires et des recommandations concrètes pour saisir les opportunités."
                : activeCommerceTab === 'flux-commerciaux'
                ? "Analysez les échanges commerciaux entre la Chine et l'Afrique du Nord. Identifiez les produits clés, suivez les tendances et explorez de nouvelles opportunités pour un partenariat plus fort et plus équilibré."
                : "Explorez les flux commerciaux, identifiez les opportunités d'affaires entre la Chine et l'Afrique du Nord et connectez-vous avec les bons partenaires pour un commerce plus durable et inclusif."}
            </p>

            {/* 2 CTA Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (activeCommerceTab === 'reglementation') {
                    const el = document.getElementById('reglementation-par-pays');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else if (activeCommerceTab === 'rapports') {
                    const el = document.getElementById('derniers-rapports');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else if (activeCommerceTab === 'produits') {
                    const el = document.getElementById('produits-a-fort-potentiel');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else if (activeCommerceTab === 'opportunites') {
                    const el = document.getElementById('commerce-subnav-bar');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else if (activeCommerceTab === 'analyses') {
                    const el = document.getElementById('analyses-content');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setActiveCommerceTab('flux-commerciaux');
                    const tabsEl = document.getElementById('commerce-subnav-bar');
                    if (tabsEl) tabsEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-[#e50028] hover:bg-[#c90022] text-white px-5 py-2.5 rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>
                  {activeCommerceTab === 'opportunites'
                    ? 'Explorer les opportunités'
                    : activeCommerceTab === 'entreprises'
                    ? 'Trouver des partenaires'
                    : activeCommerceTab === 'produits'
                    ? 'Explorer les opportunités'
                    : activeCommerceTab === 'reglementation'
                    ? 'Explorer par pays'
                    : activeCommerceTab === 'rapports'
                    ? 'Parcourir les rapports'
                    : activeCommerceTab === 'analyses'
                    ? 'Explorer les analyses'
                    : activeCommerceTab === 'flux-commerciaux'
                    ? 'Télécharger le rapport'
                    : 'Explorer le secteur'}
                </span>
              </button>

              <button
                onClick={() => (onOpenConsultation ? onOpenConsultation() : onNavigateTab('contact'))}
                className="bg-white/95 hover:bg-white text-slate-800 border border-slate-300 hover:border-slate-400 px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <CalendarDays className="w-4 h-4 text-slate-700" />
                <span>Parler à un expert</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 9 SUB-NAVIGATION TABS (MATCHING SCREENSHOT LAYOUT)                 */}
      {/* ========================================================================= */}
      <div id="commerce-subnav-bar" className="sticky top-[64px] sm:top-[72px] z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          
          {/* 9 Tabs Container */}
          <div ref={tabsRow} className="flex gap-1 overflow-x-auto scrollbar-none lg:grid lg:grid-cols-9 lg:gap-0 lg:divide-x divide-slate-200/80 lg:border-x border-slate-200/80 py-1.5 sm:py-2">
            {navTabs.map((tab) => {
              const isActive = activeCommerceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-hub-tab={tab.id}
                  onClick={() => {
                    setActiveCommerceTab(tab.id);
                  }}
                  className={`shrink-0 min-w-[96px] lg:min-w-0 flex flex-col items-center justify-center py-2.5 px-2 text-center transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#0c4a9e] text-white rounded-lg shadow-xs font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className={`mb-1 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-600'}`}>
                    {tab.icon}
                  </div>
                  <span className="text-[11px] sm:text-xs tracking-tight whitespace-nowrap leading-tight">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ACTIVE SUB-PAGE CONTENT                                                */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {activeCommerceTab === 'vue-ensemble' && (
          <VueEnsembleTab
            onSelectTab={setActiveCommerceTab}
            onOpenOpportunityDetail={(id) => setActiveCommerceTab('opportunites')}
          />
        )}

        {activeCommerceTab === 'flux-commerciaux' && (
          <FluxCommerciauxTab
            onSelectTab={setActiveCommerceTab}
            onOpenReport={openDocument}
          />
        )}

        {activeCommerceTab === 'produits' && (
          <ProduitsTab
            onSelectTab={setActiveCommerceTab}
            onOpenProductDetail={(name) => {
              setActiveCommerceTab('opportunites');
            }}
          />
        )}

        {activeCommerceTab === 'marches-ecommerce' && (
          <MarchesEcommerceTab
            onSelectTab={setActiveCommerceTab}
            onOpenReport={openDocument}
          />
        )}

        {activeCommerceTab === 'entreprises' && (
          <EntreprisesTab
            focusCompanyId={focusCompanyId}
            onSelectTab={setActiveCommerceTab}
            onOpenCompanyDetail={(name) => {
              setActiveCommerceTab('opportunites');
            }}
          />
        )}

        {activeCommerceTab === 'opportunites' && (
          <OpportunitesTab
            onSelectTab={setActiveCommerceTab}
            onOpenSignUp={onOpenSignUp}
          />
        )}

        {activeCommerceTab === 'reglementation' && (
          <ReglementationTab
            onSelectTab={setActiveCommerceTab}
            onOpenConsultation={onOpenConsultation}
            onOpenDocDetail={openDocument}
          />
        )}

        {activeCommerceTab === 'rapports' && (
          <RapportsTab
            onSelectTab={setActiveCommerceTab}
            onOpenReportModal={(title) => {
              setModalReportTitle(title);
            }}
          />
        )}

        {activeCommerceTab === 'analyses' && (
          <AnalysesTab
            onSelectTab={setActiveCommerceTab}
            onOpenArticle={(title) => openArticle(slugify(title))}
          />
        )}
      </main>

      {/* ========================================================================= */}
      {/* 5. BOTTOM REUSABLE CTA BANNER                                             */}
      {/* ========================================================================= */}
      <CommerceHubBottomBanner
        title={
          activeCommerceTab === 'marches-ecommerce'
            ? 'Accédez à des opportunités e-commerce exclusives'
            : activeCommerceTab === 'opportunites'
            ? 'Transformez les opportunités en succès commercial'
            : activeCommerceTab === 'reglementation'
            ? 'Besoin d’un accompagnement ?'
            : activeCommerceTab === 'produits'
            ? 'Accédez à des données produits exclusives'
            : activeCommerceTab === 'rapports'
            ? 'Des analyses fiables pour un avenir plus connecté'
            : activeCommerceTab === 'analyses'
            ? 'Des analyses aujourd’hui, de plus grandes opportunités demain'
            : 'Rejoignez la communauté QIAO Intelligence'
        }
        description={
          activeCommerceTab === 'marches-ecommerce'
            ? 'Rejoignez QIAO Intelligence et entrez en contact avec des fournisseurs, distributeurs et partenaires vérifiés.'
            : activeCommerceTab === 'opportunites'
            ? 'Nos équipes à Pékin, Casablanca et Tunis vous accompagnent dans la vérification de vos partenaires et la négociation de vos contrats.'
            : activeCommerceTab === 'reglementation'
            ? 'Nos experts vous aident à comprendre et appliquer les réglementations dans chaque pays.'
            : activeCommerceTab === 'produits'
            ? 'Des analyses détaillées, des rapports complets et des opportunités personnalisées pour développer votre activité.'
            : activeCommerceTab === 'rapports'
            ? 'Accédez à des études exclusives et prenez une longueur d’avance sur les opportunités entre la Chine et l’Afrique du Nord.'
            : 'Accédez à des données fiables, des analyses exclusives et un réseau qualifié de plus de 6 200 entreprises sino-africaines.'
        }
        primaryButtonText={
          activeCommerceTab === 'reglementation' ? 'Demander une consultation' : 'Créer un compte'
        }
        secondaryButtonText={
          activeCommerceTab === 'reglementation' ? 'Contacter un expert' : 'Demander une démonstration'
        }
        customPillars={
          activeCommerceTab === 'reglementation'
            ? [
                { label: 'DES RÈGLES CLAIRES', icon: ShieldCheck },
                { label: 'DES ÉCHANGES SÉCURISÉS', icon: FileText },
                { label: 'DES OPPORTUNITÉS RÉELLES', icon: Target },
                { label: 'UN IMPACT DURABLE', icon: Sparkles },
              ]
            : undefined
        }
        onPrimaryClick={() => onOpenConsultation ? onOpenConsultation() : onOpenSignUp ? onOpenSignUp() : setActiveCommerceTab('opportunites')}
        onSecondaryClick={() => onOpenConsultation ? onOpenConsultation() : setActiveCommerceTab('contact' as any)}
      />

      {/* Modal preview when clicking download report */}
      {modalReportTitle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Télécharger le rapport
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              « {modalReportTitle} »
            </p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Le document PDF haute résolution et le jeu de données Excel associé sont prêts au téléchargement.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalReportTitle(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  downloadDocument(modalReportTitle);
                  setModalReportTitle(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-md"
              >
                Confirmer le téléchargement (PDF)
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
