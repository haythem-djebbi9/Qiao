import React, { useState, useEffect } from 'react';
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
  Play,
  X
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
import ecommerceCargoShipImg from '../../assets/images/ecommerce_hero_cargo_ship_1790887696581.jpg';
import reglementationHeroPortImg from '../../assets/images/reglementation_hero_port_1790896278386.jpg';
import rapportsHeroReportsImg from '../../assets/images/rapports_hero_reports_1790896412608.jpg';
import produitsHeroContainerImg from '../../assets/images/produits_hero_container_1790896614549.jpg';
import opportunitesHeroImg from '../../assets/images/opportunites_hero_handshake_port_1790897415451.jpg';
import entreprisesHeroImg from '../../assets/images/china_africa_handshake_1787501713904.jpg';
import ecommerceDevicesImg from '../../assets/images/ecommerce_devices_marketplace_1790934935730.jpg';
import analysesHeroDeskImg from '../../assets/images/analyses_hero_data_desk_1791034393458.jpg';

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
}) => {
  const [activeCommerceTab, setActiveCommerceTab] = useState<CommerceHubTab>(initialTab);
  const [modalReportTitle, setModalReportTitle] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { downloadDocument } = useDownloads();

  useEffect(() => {
    if (initialTab) {
      setActiveCommerceTab(initialTab);
    }
  }, [initialTab]);

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
      <div className={`relative bg-white border-b border-slate-200 overflow-hidden ${
        activeCommerceTab === 'opportunites' || activeCommerceTab === 'reglementation' || activeCommerceTab === 'rapports' || activeCommerceTab === 'produits' || activeCommerceTab === 'entreprises' || activeCommerceTab === 'marches-ecommerce' || activeCommerceTab === 'analyses'
          ? 'pt-24 sm:pt-28 pb-14 sm:pb-16 lg:pb-20 min-h-[380px] sm:min-h-[430px] flex items-center'
          : 'pt-24 sm:pt-28 pb-12 lg:pb-14'
      }`}>
        
        {/* Right Side: Photo with High Opacity & Clean Presentation */}
        <div className={`absolute right-0 top-[64px] sm:top-[72px] bottom-0 pointer-events-none select-none overflow-hidden ${
          activeCommerceTab === 'entreprises'
            ? 'w-full lg:w-[68%] xl:w-[65%]'
            : 'w-full lg:w-[68%] xl:w-[65%]'
        }`}>
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
          <div className={`absolute left-0 top-0 bottom-0 pointer-events-none ${
            activeCommerceTab === 'entreprises'
              ? 'w-4 sm:w-8 bg-gradient-to-r from-white to-transparent'
              : 'w-6 sm:w-12 bg-gradient-to-r from-white to-transparent'
          }`} />

          {/* Analyses Overlays matching screenshot */}
          {activeCommerceTab === 'analyses' && (
            <>
              {/* Top-left: DATA / INSIGHTS / STRATEGY... */}
              <div className="absolute top-4 sm:top-6 left-6 sm:left-12 text-left z-20 pointer-events-none hidden md:block">
                <div className="text-[11px] sm:text-[12px] tracking-[0.16em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                  DATA<br />
                  INSIGHTS<br />
                  STRATEGY<br />
                  OPPORTUNITIES<br />
                  A STRONGER TOMORROW
                </div>
                <div className="w-8 h-[2px] bg-red-600 mt-2 rounded-full shadow-xs" />
              </div>

              {/* Far top-right: DES DONNÉES / AUX OPPORTUNITÉS... with red vertical bar */}
              <div className="absolute top-4 sm:top-6 right-6 lg:right-10 text-left z-20 pointer-events-none hidden md:block">
                <div className="flex items-start gap-2">
                  <div className="w-[3px] h-20 bg-red-600 rounded-full shadow-xs shrink-0 mt-0.5" />
                  <div className="text-[10px] sm:text-[11px] tracking-[0.16em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                    DES DONNÉES<br />
                    AUX OPPORTUNITÉS<br />
                    POUR UN PARTENARIAT<br />
                    DURABLE<br />
                    CHINE - AFRIQUE<br />
                    DU NORD
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Flux commerciaux Overlays matching screenshot */}
          {activeCommerceTab === 'flux-commerciaux' && (
            <div className="absolute top-4 sm:top-6 left-6 sm:left-12 text-left z-20 pointer-events-none hidden md:block">
              <div className="text-[11px] sm:text-[12px] tracking-[0.16em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                CHINA ↔ NORTH AFRICA<br />
                TRADE FLOWS<br />
                REAL DATA<br />
                REAL OPPORTUNITIES
              </div>
              <div className="w-8 h-[2px] bg-red-600 mt-2 rounded-full shadow-xs" />
            </div>
          )}

          {/* Marchés e-commerce Overlays matching screenshot */}
          {activeCommerceTab === 'marches-ecommerce' && (
            <>
              {/* CHINE ↔ AFRIQUE DU NORD overlay (middle-left of image) */}
              <div className="absolute top-4 sm:top-6 left-6 sm:left-12 text-left z-20 pointer-events-none hidden md:block">
                <div className="text-[11px] sm:text-[12px] tracking-[0.16em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                  CHINE ↔ AFRIQUE DU NORD<br />
                  E-COMMERCE<br />
                  PLUS DE MARCHÉS<br />
                  PLUS D'OPPORTUNITÉS
                </div>
                <div className="w-8 h-[2px] bg-red-600 mt-2 rounded-full shadow-xs" />
              </div>

              {/* PLATEFORMES / CONSOMMATEURS / PRODUITS overlay (top-right of image) */}
              <div className="absolute top-4 sm:top-6 right-6 lg:right-10 text-left z-20 pointer-events-none hidden md:block">
                <div className="text-[10px] sm:text-[11px] tracking-[0.16em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                  PLATEFORMES<br />
                  CONSOMMATEURS<br />
                  PRODUITS<br />
                  LOGISTIQUE<br />
                  PAIEMENTS<br />
                  CROISSANCE
                </div>
                <div className="w-8 h-[2px] bg-red-600 ml-auto mt-2 rounded-full shadow-xs" />
              </div>
            </>
          )}

          {/* Opportunités Overlays matching user screenshot */}
          {activeCommerceTab === 'opportunites' && (
            <>
              {/* Connecting Markets Text (middle-left of image) */}
              <div className="absolute top-4 sm:top-6 left-8 sm:left-12 text-left z-20 pointer-events-none hidden md:block">
                <div className="text-[11px] sm:text-[12px] tracking-[0.16em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                  CONNECTING<br />
                  MARKETS<br />
                  CREATING<br />
                  OPPORTUNITIES
                </div>
                <div className="w-8 h-[2px] bg-red-600 mt-2 rounded-full shadow-xs" />
              </div>

              {/* Trade Partnerships Text (top-right of image) */}
              <div className="absolute top-4 sm:top-6 right-6 lg:right-10 text-left z-20 pointer-events-none hidden md:block">
                <div className="text-[10px] sm:text-[11px] tracking-[0.16em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                  TRADE<br />
                  PARTNERSHIPS<br />
                  INVESTMENT<br />
                  DISTRIBUTION<br />
                  JOINT VENTURES<br />
                  A SUSTAINABLE FUTURE
                </div>
                <div className="w-8 h-[2px] bg-red-600 mt-2 rounded-full shadow-xs" />
              </div>
            </>
          )}

          {/* Far Right Top Editorial Typography Overlay */}
          {activeCommerceTab === 'reglementation' && (
            <div className="absolute top-4 sm:top-6 right-6 lg:right-10 text-right z-20 pointer-events-none hidden md:block">
              <div className="text-[10px] sm:text-[11px] tracking-[0.2em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                RÈGLES<br />
                NORMES<br />
                DOUANES<br />
                CERTIFICATIONS<br />
                ACCORDS COMMERCIAUX<br />
                UN COMMERCE SÛR<br />
                UN AVENIR DURABLE
              </div>
              <div className="w-7 h-[2px] bg-red-600 ml-auto mt-2 rounded-full shadow-xs" />
            </div>
          )}

          {activeCommerceTab === 'rapports' && (
            <div className="absolute top-4 sm:top-6 right-6 lg:right-10 text-right z-20 pointer-events-none hidden md:block">
              <div className="text-[10px] sm:text-[11px] tracking-[0.2em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                KNOWLEDGE<br />
                INSIGHTS<br />
                OPPORTUNITIES<br />
                A STRONGER<br />
                CHINA – NORTH AFRICA<br />
                TOMORROW
              </div>
              <div className="w-7 h-[2px] bg-red-600 ml-auto mt-2 rounded-full shadow-xs" />
            </div>
          )}

          {activeCommerceTab === 'entreprises' && (
            <>
              {/* CONNECTER LES ENTREPRISES... overlay (middle-left) */}
              <div className="absolute top-4 sm:top-6 left-6 sm:left-10 text-left z-20 pointer-events-none hidden md:block">
                <div className="text-[10.5px] sm:text-[11.5px] tracking-[0.16em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                  CONNECTER<br />
                  LES ENTREPRISES<br />
                  CHINOISES ET<br />
                  NORD-AFRICAINES<br />
                  POUR UNE CROISSANCE<br />
                  PARTAGÉE
                </div>
                <div className="w-8 h-[2px] bg-red-600 mt-2 rounded-full shadow-xs" />
              </div>

              {/* BUSINESS PARTNERSHIPS... overlay (top-right) */}
              <div className="absolute top-4 sm:top-6 right-6 lg:right-10 text-left z-20 pointer-events-none hidden md:block">
                <div className="text-[10px] sm:text-[11px] tracking-[0.16em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                  BUSINESS<br />
                  PARTNERSHIPS<br />
                  SUPPLY CHAINS<br />
                  DISTRIBUTION<br />
                  JOINT VENTURES<br />
                  A SHARED FUTURE
                </div>
                <div className="w-8 h-[2px] bg-red-600 mt-2 rounded-full shadow-xs" />
              </div>
            </>
          )}

          {activeCommerceTab === 'produits' && (
            <div className="absolute top-6 sm:top-8 right-6 lg:right-10 text-right z-20 pointer-events-none hidden md:block">
              <div className="text-[10px] sm:text-[11px] tracking-[0.2em] font-extrabold text-white uppercase leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                CHINA<br />
                NORTH AFRICA<br />
                TRADE<br />
                PEOPLE<br />
                OPPORTUNITIES
              </div>
              <div className="w-7 h-[2px] bg-red-600 ml-auto mt-2 rounded-full shadow-xs" />
            </div>
          )}

          {/* Far Right Bottom Glass Card (Matching Screenshot) */}
          {activeCommerceTab !== 'opportunites' && activeCommerceTab !== 'marches-ecommerce' && activeCommerceTab !== 'entreprises' && (
            <div className="absolute bottom-6 right-6 lg:right-10 z-20 pointer-events-none hidden md:block">
              <div className="bg-white/90 backdrop-blur-md border-l-4 border-l-red-600 border border-white/60 px-4 py-2.5 rounded-lg shadow-xl text-left">
                <div className="text-[10.5px] font-black text-[#0f2448] tracking-[0.16em] leading-snug">
                  {activeCommerceTab === 'produits' ? (
                    <>
                      DES PRODUITS<br />
                      DES MARCHÉS<br />
                      DES PARTENARIATS<br />
                      UN AVENIR COMMUN
                    </>
                  ) : activeCommerceTab === 'reglementation' ? (
                    <>
                      COMPLIANCE<br />
                      BUILDS<br />
                      OPPORTUNITIES
                    </>
                  ) : activeCommerceTab === 'rapports' ? (
                    <>
                      QIAO<br />
                      INTELLIGENCE REPORT
                    </>
                  ) : activeCommerceTab === 'flux-commerciaux' ? (
                    <>
                      DES PONTS<br />
                      DES MARCHÉS<br />
                      DES PARTENARIATS<br />
                      UN AVENIR<br />
                      COMMUN
                    </>
                  ) : activeCommerceTab === 'analyses' ? (
                    <>
                      DES INSIGHTS<br />
                      DES DONNÉES<br />
                      DES DÉCISIONS<br />
                      UN IMPACT RÉEL
                    </>
                  ) : (
                    <>
                      BRIDGING<br />
                      BUSINESSES<br />
                      PEOPLES<br />
                      OPPORTUNITIES
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Left Side Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <div className={activeCommerceTab === 'entreprises' ? 'max-w-xl' : 'max-w-2xl'}>
            
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
                onClick={() => setIsVideoModalOpen(true)}
                className="bg-white/95 hover:bg-white text-slate-800 border border-slate-300 hover:border-slate-400 px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-700 text-slate-700" />
                <span>
                  {activeCommerceTab === 'opportunites'
                    ? 'Comment ça marche ?'
                    : activeCommerceTab === 'reglementation'
                    ? 'Voir le guide vidéo'
                    : activeCommerceTab === 'flux-commerciaux'
                    ? 'Voir la méthodologie'
                    : activeCommerceTab === 'analyses'
                    ? 'Méthodologie d’analyse'
                    : 'Voir la vidéo'}
                </span>
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
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 divide-x divide-slate-200/80 border-x border-slate-200/80 py-1.5 sm:py-2">
            {navTabs.map((tab) => {
              const isActive = activeCommerceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCommerceTab(tab.id);
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-1.5 sm:px-2 text-center transition-all cursor-pointer relative ${
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
            onOpenReport={(title) => {
              setActiveCommerceTab('rapports');
            }}
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
            onOpenReport={(title) => setActiveCommerceTab('rapports')}
          />
        )}

        {activeCommerceTab === 'entreprises' && (
          <EntreprisesTab
            onSelectTab={setActiveCommerceTab}
            onOpenCompanyDetail={(name) => {
              setActiveCommerceTab('opportunites');
            }}
          />
        )}

        {activeCommerceTab === 'opportunites' && (
          <OpportunitesTab
            onSelectTab={setActiveCommerceTab}
            onOpenOpportunityDetail={(id) => {
              if (onOpenConsultation) onOpenConsultation();
            }}
            onOpenSignUp={onOpenSignUp}
          />
        )}

        {activeCommerceTab === 'reglementation' && (
          <ReglementationTab
            onSelectTab={setActiveCommerceTab}
            onOpenDocDetail={(title) => {
              setActiveCommerceTab('rapports');
            }}
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
            onOpenArticle={(title) => {
              // open or highlight
            }}
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

      {/* Video Modal (Voir la vidéo) */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  QIAO Intelligence • Commerce & E-commerce Chine – Afrique du Nord
                </h3>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <img
                src={ecommerceCargoShipImg}
                alt="Video Preview"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="relative z-10 text-center p-6 max-w-lg">
                <div className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-600/40">
                  <Play className="w-7 h-7 fill-white text-white ml-1" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Comprendre les flux commerciaux bilatéraux en 3 minutes
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Découvrez comment les corridors logistiques maritimes et les plateformes numériques relient la Chine au Maroc, à la Tunisie, à l'Algérie et à l'Égypte.
                </p>
                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
                  <span>Durée : 3m 45s</span>
                  <span>•</span>
                  <span>Qualité : 4K HDR</span>
                  <span>•</span>
                  <span>Audio : Français / 中文</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
