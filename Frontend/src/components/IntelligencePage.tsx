import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import intelligenceHeroBg from '../data/qiao_intelligence.jpg';
import chinaNightCorridorBg from '../assets/images/china_corridor_night_skyline_1790804583067.jpg';
import northAfricaCorridorBg from '../assets/images/north_africa_corridor_medina_1790804596834.jpg';
import solarFarmTunisiaImg from '../assets/images/solar_farm_tunisia_1790805165350.jpg';
import containerPortCargoImg from '../assets/images/container_port_cargo_1790805153002.jpg';
import oliveOilExportImg from '../assets/images/olive_oil_export_1790805177453.jpg';
import industrialEngineerMachineImg from '../assets/images/industrial_engineer_machine_1790805190415.jpg';
import chinaEcommerceReportImg from '../assets/images/china_ecommerce_report_1790808742649.jpg';
import {
  Search,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Download,
  Calendar,
  MapPin,
  Globe,
  Building2,
  Users,
  FileText,
  TrendingUp,
  BarChart3,
  Cpu,
  Zap,
  ShoppingBag,
  Factory,
  Sprout,
  Truck,
  Palmtree,
  HeartPulse,
  Share2,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  DollarSign,
  Tag,
  ArrowUpRight,
  X,
  ShieldCheck,
  Award,
  ShoppingCart,
  Handshake
} from 'lucide-react';
import { AppTab } from '../types';
import { useApi } from '../hooks/useApi';
import { useDownloads } from '../hooks/useDownloads';
import { resolveImage } from '../lib/assets';
import { Article, Opportunity, QiaoDocument } from '../lib/models';
import { useAppActions } from '../context/AppActionsContext';

interface IntelligencePageProps {
  onNavigate: (tab: AppTab) => void;
  onRequestAnalysis?: () => void;
  onOpenRegister?: () => void;
}

const OPPORTUNITIES_PER_PAGE = 4;

export const IntelligencePage: React.FC<IntelligencePageProps> = ({
  onNavigate,
  onRequestAnalysis,
  onOpenRegister,
}) => {
  const { applyToOpportunity, openDocument, openArticle, openLegal } = useAppActions();
  const { downloadDocument, pending } = useDownloads();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('Tous les secteurs');
  const [activeCorridorModal, setActiveCorridorModal] = useState<'cn-na' | 'na-cn' | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [opportunityPage, setOpportunityPage] = useState(0);
  const [analysisOffset, setAnalysisOffset] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAppliedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setOpportunityPage(0);
  }, [appliedQuery, selectedSector]);  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Trending search tags matching screenshot
  const trendingTags = [
    'Chine',
    'Maroc',
    'Tunisie',
    'Algérie',
    'Égypte',
    'Investissement',
    'Export',
    'E-commerce',
  ];

  // 10 Sectors matching screenshot
  const sectors = [
    { id: 'all', name: 'Tous les secteurs', icon: Layers },
    { id: 'commerce', name: 'Commerce & E-commerce', icon: ShoppingBag },
    { id: 'industry', name: 'Industrie & Manufacturing', icon: Factory },
    { id: 'agri', name: 'Agroalimentaire & Agriculture', icon: Sprout },
    { id: 'energy', name: 'Énergie & Ressources', icon: Zap },
    { id: 'tech', name: 'Technologie & IA', icon: Cpu },
    { id: 'logistics', name: 'Logistique & Transport', icon: Truck },
    { id: 'construction', name: 'Construction & Immobilier', icon: Building2 },
    { id: 'tourism', name: 'Tourisme & Services', icon: Palmtree },
    { id: 'health', name: 'Santé & Pharma', icon: HeartPulse },
  ];

  // Opportunités, rapports et analyses : données de l'API.
  const { data: filteredOpportunities = [], loading: opportunitiesLoading } = useApi<Opportunity[]>(
    '/opportunities',
    { placement: 'intelligence', q: appliedQuery || undefined, sector: selectedSector },
    [],
  );
  const { data: reports = [] } = useApi<QiaoDocument[]>('/documents', { section: 'intelligence' }, []);
  const { data: analysesData = [] } = useApi<Article[]>('/articles', { placement: 'intelligence' }, []);

  const pageCount = Math.max(1, Math.ceil(filteredOpportunities.length / OPPORTUNITIES_PER_PAGE));
  const visibleOpportunities = filteredOpportunities.slice(
    opportunityPage * OPPORTUNITIES_PER_PAGE,
    (opportunityPage + 1) * OPPORTUNITIES_PER_PAGE,
  );
  const analyses = analysesData.length
    ? analysesData.map((_, i) => analysesData[(i + analysisOffset) % analysesData.length])
    : [];

  const cycleSector = (direction: 1 | -1) => {
    const index = sectors.findIndex((s) => s.name === selectedSector);
    let next = (index + direction + sectors.length) % sectors.length;
    if (sectors[next].id === 'commerce') next = (next + direction + sectors.length) % sectors.length;
    setSelectedSector(sectors[next].name);
  };

  const scrollToOpportunities = () =>
    document.getElementById('intelligence-opportunities')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: ZOOMED OUT EXPANSIVE PANORAMA                           */}
      {/* ========================================================================= */}
      <div className="relative min-h-[480px] lg:min-h-[530px] text-white overflow-hidden pt-28 sm:pt-32 pb-14 lg:pb-16 flex flex-col justify-center border-b border-slate-800 bg-[#050e1d]">
        
        {/* Cinematic Background Image - Lowered slightly with smooth perspective */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden bg-[#050e1d]">
          <img
            src={intelligenceHeroBg}
            alt="QIAO Intelligence"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-[center_60%] sm:object-[center_62%] transform translate-y-3 sm:translate-y-5 lg:translate-y-6 scale-100 sm:scale-[0.96] md:scale-[0.93] lg:scale-[0.90] origin-center transition-transform duration-500"
          />
          {/* Edge vignette and ambient fade to seamlessly blend the lowered photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050e1d]/85 via-transparent to-[#050e1d]/50 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050e1d] via-transparent to-[#050e1d]/45 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050e1d] via-[#050e1d]/50 to-transparent max-w-xl pointer-events-none" />
        </div>

        {/* Right Side Editorial Typography Overlays (Matching Screenshot) */}
        <div className="absolute top-32 right-8 xl:right-16 hidden lg:flex flex-col items-end text-right z-10 select-none pointer-events-none">
          {/* Top Right: CHINA to a STRONGER NORTH AFRICA */}
          <div className="text-right">
            <div className="text-xs sm:text-sm tracking-[0.25em] font-semibold text-white/90 uppercase">
              CHINA
            </div>
            <div className="text-[11px] sm:text-xs tracking-[0.2em] font-light text-slate-300">
              to a <span className="text-white font-bold">STRONGER</span>
            </div>
            <div className="text-xs sm:text-sm tracking-[0.25em] font-semibold text-white/90 uppercase">
              NORTH AFRICA
            </div>
            <div className="w-8 h-0.5 bg-red-600 ml-auto mt-1.5 rounded-full" />
          </div>

          {/* Middle Right Vertical Tags */}
          <div className="mt-10 space-y-1 text-[11px] tracking-[0.25em] text-slate-400 font-mono text-right">
            <div>DATA</div>
            <div>INSIGHTS</div>
            <div>OPPORTUNITIES</div>
            <div>PARTNERSHIPS</div>
            <div>GROWTH</div>
          </div>
        </div>

        {/* Bottom Right Balcony Glass Card (Matching Screenshot) */}
        <div className="absolute bottom-10 right-8 xl:right-16 hidden lg:block z-10 select-none pointer-events-none">
          <div className="bg-black/35 backdrop-blur-md border border-white/20 px-5 py-3 rounded-lg text-left shadow-2xl">
            <div className="text-[11px] font-extrabold text-white tracking-[0.2em] leading-snug">
              BRIDGING<br />
              MARKETS<br />
              CREATING<br />
              OPPORTUNITIES
            </div>
          </div>
        </div>

        {/* Hero Left Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-2xl">
            
            {/* Red Accent Dash + QIAO INTELLIGENCE */}
            <div className="inline-flex items-center gap-2.5 text-xs sm:text-[13px] font-semibold uppercase tracking-[0.22em] text-white/90 mb-4">
              <span className="w-5 h-[2.5px] bg-red-600 rounded-full" />
              <span>QIAO INTELLIGENCE</span>
            </div>

            {/* Main Bold Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight leading-[1.14] mb-4">
              <span className="block text-white">Comprendre les marchés.</span>
              <span className="block text-red-600">Anticiper les opportunités.</span>
            </h1>

            {/* Subtitle Description */}
            <p className="text-sm sm:text-base lg:text-[16px] text-slate-200 font-light leading-relaxed mb-7 max-w-xl">
              Des données. Des analyses. Des opportunités réelles entre la Chine et l'Afrique du Nord.
            </p>

            {/* White Rounded Search Bar with Red Action Button (Matching Screenshot) */}
            <div className="relative max-w-xl mb-5">
              <div className="flex items-center bg-white rounded-2xl overflow-hidden shadow-2xl p-1 sm:p-1.5 focus-within:ring-2 focus-within:ring-red-500 transition-all">
                <div className="pl-3.5 pr-2 text-slate-500">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setAppliedQuery(searchQuery.trim());
                      scrollToOpportunities();
                    }
                  }}
                  placeholder="Rechercher un marché, un secteur, une entreprise, une opportunité..."
                  className="flex-1 bg-transparent py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-normal"
                />
                <button
                  onClick={() => {
                    setAppliedQuery(searchQuery.trim());
                    scrollToOpportunities();
                  }}
                  className="w-10 sm:w-11 h-10 sm:h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm transform active:scale-95"
                  aria-label="Rechercher"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tendances Pills Row (Matching Screenshot: Chine, Maroc, Tunisie, Algérie, Égypte, Investissement, Export, E-commerce) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs sm:text-sm">
              <span className="text-white font-medium mr-1 select-none">Tendances :</span>
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(searchQuery === tag ? '' : tag);
                    scrollToOpportunities();
                  }}
                  className={`px-3 sm:px-3.5 py-1 rounded-full text-xs font-normal border transition-all cursor-pointer ${
                    searchQuery === tag
                      ? 'bg-red-600 text-white border-red-500 shadow-sm'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-200 border-white/20 hover:border-white/40 backdrop-blur-xs'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. STATS BAR (5 COLUMNS WITH RED OUTLINE ICONS ON WHITE CARD)             */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200 py-6 sm:py-8 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 items-center text-left">
            
            {/* Metric 1: Analyses de marché */}
            <div className="flex items-center gap-3.5">
              <div className="text-red-600 shrink-0">
                <BarChart3 className="w-8 h-8 stroke-[1.7]" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">50+</div>
                <div className="text-xs text-slate-600 font-light mt-0.5">Analyses de marché</div>
              </div>
            </div>

            {/* Metric 2: Rapports & études */}
            <div className="flex items-center gap-3.5">
              <div className="text-red-600 shrink-0">
                <FileText className="w-8 h-8 stroke-[1.7]" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">200+</div>
                <div className="text-xs text-slate-600 font-light mt-0.5">Rapports & études</div>
              </div>
            </div>

            {/* Metric 3: Opportunités identifiées */}
            <div className="flex items-center gap-3.5">
              <div className="text-red-600 shrink-0">
                <Building2 className="w-8 h-8 stroke-[1.7]" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">500+</div>
                <div className="text-xs text-slate-600 font-light mt-0.5">Opportunités identifiées</div>
              </div>
            </div>

            {/* Metric 4: Pays analysés */}
            <div className="flex items-center gap-3.5">
              <div className="text-red-600 shrink-0">
                <Globe className="w-8 h-8 stroke-[1.7]" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">15+</div>
                <div className="text-xs text-slate-600 font-light mt-0.5">Pays analysés</div>
              </div>
            </div>

            {/* Metric 5: Experts & partenaires */}
            <div className="flex items-center gap-3.5">
              <div className="text-red-600 shrink-0">
                <Users className="w-8 h-8 stroke-[1.7]" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">30+</div>
                <div className="text-xs text-slate-600 font-light mt-0.5">Experts & partenaires</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EXPLORER PAR SECTEUR (10 SECTOR CARDS MATCHING SCREENSHOT)             */}
      {/* ========================================================================= */}
      <div className="py-10 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Explorer par secteur
              </h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-light mt-1">
                <span className="w-3.5 h-[1.5px] bg-red-500" />
                <span>Analysez les opportunités par industrie</span>
              </div>
            </div>

            {/* Carousel Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSector('Tous les secteurs')}
                className="text-xs sm:text-sm font-medium text-slate-700 hover:text-red-600 transition-colors cursor-pointer"
              >
                Voir tous les secteurs
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => cycleSector(-1)}
                  className="w-7 h-7 rounded-full border border-slate-300 hover:border-slate-400 bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                  aria-label="Précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => cycleSector(1)}
                  className="w-7 h-7 rounded-full border border-slate-300 hover:border-slate-400 bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                  aria-label="Suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 10 Sector Cards Carousel / Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2.5 sm:gap-3">
            {sectors.map((sec) => {
              const Icon = sec.icon;
              const isSelected = selectedSector === sec.name;

              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    if (sec.id === 'commerce') {
                      onNavigate('commerce-hub');
                      return;
                    }
                    setSelectedSector(sec.name);
                    scrollToOpportunities();
                  }}
                  className={`flex flex-col items-center justify-center text-center p-3 sm:py-4 sm:px-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected || sec.id === 'commerce'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-102 hover:border-red-500'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:shadow-xs hover:bg-slate-50'
                  }`}
                >
                  <div className={`mb-2.5 p-1.5 rounded-lg ${isSelected || sec.id === 'commerce' ? 'text-white' : 'text-slate-700'}`}>
                    <Icon className="w-6 h-6 stroke-[1.6]" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-medium leading-tight line-clamp-2">
                    {sec.name}
                  </span>
                  {sec.id === 'commerce' && (
                    <span className="mt-1 text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                      9 pages
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Access Callout for the 9 Commerce & E-commerce pages */}
          <div className="mt-4 bg-gradient-to-r from-red-50 via-slate-50 to-blue-50 border border-red-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-sm">
                9
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-950 flex items-center gap-2">
                  <span>Hub Commerce & E-commerce Chine ↔ Afrique du Nord</span>
                  <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Exclusif
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Consultez les 9 pages détaillées : Vue d'ensemble, Flux, Produits, Marchés, 6 200+ Entreprises, Opportunités, Réglementation, Rapports et Analyses.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('commerce-hub')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Accéder aux 9 pages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BILATERAL CORRIDOR HERO CARDS (CHINE -> NA & NA -> CHINE)             */}
      {/* ========================================================================= */}
      <div className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Card 1: Chine -> Afrique du Nord (Pudong Skyline Shanghai at Night) */}
            <div
              onClick={() => setActiveCorridorModal('cn-na')}
              className="group relative rounded-2xl overflow-hidden shadow-2xl min-h-[320px] sm:min-h-[360px] flex flex-col justify-between p-6 sm:p-8 cursor-pointer transform hover:-translate-y-1 transition-all duration-300 border border-slate-800/40"
            >
              {/* Background Photo with Dark Dramatic Overlay */}
              <div className="absolute inset-0 select-none pointer-events-none">
                <img
                  src={chinaNightCorridorBg}
                  alt="Corridor Chine vers Afrique du Nord"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/35" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-black/35" />
              </div>

              {/* Top Row: Title, Subtitle, and Red Round ArrowUpRight Button */}
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Chine</span>
                    <span className="text-red-600 font-extrabold">→</span>
                    <span>Afrique du Nord</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-light mt-1.5 flex items-center gap-2 flex-wrap">
                    <span>Investissement</span>
                    <span className="text-slate-400">•</span>
                    <span>Export</span>
                    <span className="text-slate-400">•</span>
                    <span>Sourcing</span>
                    <span className="text-slate-400">•</span>
                    <span>Expansion</span>
                  </p>
                </div>

                {/* Red Circular Arrow Action Button with ArrowUpRight */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform shrink-0">
                  <ArrowUpRight className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
                </div>
              </div>

              {/* Bottom 3 Stats Row (Matching Screenshot Exactly) */}
              <div className="relative z-10 pt-6 sm:pt-8 border-t border-white/20 mt-auto">
                <div className="grid grid-cols-3 gap-3 text-left">
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-white tracking-tight">+28%</div>
                    <div className="text-[11px] sm:text-xs text-slate-300 font-light mt-1 leading-snug">
                      Échanges commerciaux en 2024
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-white tracking-tight">$ 12M+</div>
                    <div className="text-[11px] sm:text-xs text-slate-300 font-light mt-1 leading-snug">
                      Projets d'investissement identifiés
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-white tracking-tight">120+</div>
                    <div className="text-[11px] sm:text-xs text-slate-300 font-light mt-1 leading-snug">
                      Entreprises chinoises actives en Afrique du Nord
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Afrique du Nord -> Chine (North African Architecture & Oasis) */}
            <div
              onClick={() => setActiveCorridorModal('na-cn')}
              className="group relative rounded-2xl overflow-hidden shadow-2xl min-h-[320px] sm:min-h-[360px] flex flex-col justify-between p-6 sm:p-8 cursor-pointer transform hover:-translate-y-1 transition-all duration-300 border border-slate-800/40"
            >
              {/* Background Photo with Dark Dramatic Overlay */}
              <div className="absolute inset-0 select-none pointer-events-none">
                <img
                  src={northAfricaCorridorBg}
                  alt="Corridor Afrique du Nord vers Chine"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/35" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-black/35" />
              </div>

              {/* Top Row: Title, Subtitle, and Red Round ArrowUpRight Button */}
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Afrique du Nord</span>
                    <span className="text-red-600 font-extrabold">→</span>
                    <span>Chine</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-light mt-1.5 flex items-center gap-2 flex-wrap">
                    <span>Export</span>
                    <span className="text-slate-400">•</span>
                    <span>Partenariats</span>
                    <span className="text-slate-400">•</span>
                    <span>Accès au marché</span>
                  </p>
                </div>

                {/* Red Circular Arrow Action Button with ArrowUpRight */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform shrink-0">
                  <ArrowUpRight className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
                </div>
              </div>

              {/* Bottom 3 Stats Row (Matching Screenshot Exactly) */}
              <div className="relative z-10 pt-6 sm:pt-8 border-t border-white/20 mt-auto">
                <div className="grid grid-cols-3 gap-3 text-left">
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-white tracking-tight">+35%</div>
                    <div className="text-[11px] sm:text-xs text-slate-300 font-light mt-1 leading-snug">
                      Exportations vers la Chine en 2024
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-white tracking-tight">300+</div>
                    <div className="text-[11px] sm:text-xs text-slate-300 font-light mt-1 leading-snug">
                      Opportunités de partenariat
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-white tracking-tight">5</div>
                    <div className="text-[11px] sm:text-xs text-slate-300 font-light mt-1 leading-snug">
                      Pays clés (Maroc, Tunisie, Algérie, Égypte, Libye)
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. LES OPPORTUNITÉS DU MOMENT (4 DETAILED PROJECT CARDS MATCHING SCREENSHOT)*/}
      {/* ========================================================================= */}
      <div id="intelligence-opportunities" className="py-12 bg-white border-t border-slate-100 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Les opportunités du moment
              </h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-light mt-1.5">
                <span className="w-4 h-[2px] bg-red-600 rounded-full shrink-0" />
                <span>Des projets concrets. Des partenaires sérieux. Des marchés en mouvement.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('opportunites' as AppTab)}
                className="text-xs sm:text-sm font-medium text-red-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                Voir toutes les opportunités
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setOpportunityPage((page) => Math.max(0, page - 1))}
                  disabled={opportunityPage === 0}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-default"
                  aria-label="Précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpportunityPage((page) => Math.min(pageCount - 1, page + 1))}
                  disabled={opportunityPage >= pageCount - 1}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-default"
                  aria-label="Suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {!opportunitiesLoading && filteredOpportunities.length === 0 && (
            <div className="p-8 text-center border border-dashed border-slate-300 rounded-2xl text-sm text-slate-500 space-y-3">
              <p>Aucune opportunité ne correspond à « {appliedQuery || selectedSector} ».</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSector('Tous les secteurs');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Réinitialiser la recherche
              </button>
            </div>
          )}

          {/* 4 Cards Grid - Horizontal Layout Matching Screenshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {visibleOpportunities.map((opp) => (
              <div
                key={opp.id}
                onClick={() => setSelectedOpportunity(opp)}
                className="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 p-3 sm:p-3.5 flex flex-row items-stretch gap-3 cursor-pointer"
              >
                {/* Left Side: Rounded Photo Thumbnail */}
                <div className="w-28 sm:w-32 lg:w-32 min-h-[135px] rounded-xl overflow-hidden shrink-0 relative bg-slate-100">
                  <img
                    src={resolveImage(opp.image)}
                    alt={opp.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Right Side: Content Details */}
                <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                  <div>
                    {/* Category Pill Badge */}
                    <div className="mb-1.5">
                      <span className="bg-[#edf2f7] text-[#475569] text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase inline-block">
                        {opp.type}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug line-clamp-2 group-hover:text-red-600 transition-colors mb-2">
                      {opp.title}
                    </h3>

                    {/* Country & Sector */}
                    <div className="space-y-1 text-[11px] text-slate-600 font-normal">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        <span className="truncate">{opp.country}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {opp.sector === 'Énergie' ? (
                          <Zap className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        ) : opp.sector === 'Cosmétique' ? (
                          <Sparkles className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        ) : opp.sector === 'Agroalimentaire' ? (
                          <Sprout className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        ) : (
                          <Factory className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        )}
                        <span className="truncate">{opp.sector}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price / Budget and Red Circular Arrow Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      {opp.amountIcon === 'cart' ? (
                        <ShoppingCart className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      ) : opp.amountIcon === 'tag' ? (
                        <Tag className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      ) : opp.amountIcon === 'factory' ? (
                        <Building2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      ) : (
                        <DollarSign className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      )}
                      <span className="truncate">{opp.amountLabel}</span>
                    </div>

                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-red-500 text-red-500 bg-white flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-2xs shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. RAPPORTS & ÉTUDES (GAUCHE) + DERNIÈRES ANALYSES (DROITE)                */}
      {/* ========================================================================= */}
      <div className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* LEFT COLUMN: Rapports & études (7 Columns) */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Rapports & études
                  </h2>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-light mt-1">
                    <span className="w-3.5 h-[1.5px] bg-red-500" />
                    <span>Des analyses approfondies pour éclairer vos décisions.</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('rapports' as AppTab)}
                  className="text-xs sm:text-sm font-medium text-slate-700 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Voir tous les rapports</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 3 Report Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col"
                  >
                    {/* Image */}
                    <div
                      onClick={() => openDocument(rep.id)}
                      className="relative h-36 w-full overflow-hidden bg-slate-100 cursor-pointer"
                    >
                      <img
                        src={resolveImage(rep.image)}
                        alt={rep.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-slate-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                        {rep.kind}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4
                          onClick={() => openDocument(rep.id)}
                          className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug group-hover:text-red-600 transition-colors line-clamp-2 mb-2 cursor-pointer"
                        >
                          {rep.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-light flex items-center gap-1.5 mb-3">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{rep.dateLabel}</span>
                        </div>
                      </div>

                      {/* Download link matching screenshot */}
                      <button
                        onClick={() => downloadDocument(rep.id, rep.title)}
                        disabled={pending === rep.id}
                        className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-slate-700 hover:text-red-600 text-xs transition-colors cursor-pointer w-full text-left disabled:opacity-60"
                      >
                        <span className="font-medium text-[11px]">{rep.sizeLabel}</span>
                        <Download className={`w-3.5 h-3.5 text-red-600 ${pending === rep.id ? 'animate-bounce' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Dernières analyses (5 Columns) */}
            <div className="lg:col-span-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Dernières analyses
                  </h2>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-light mt-1">
                    <span className="w-3.5 h-[1.5px] bg-red-500" />
                    <span>Des insights pour garder une longueur d'avance.</span>
                  </div>
                </div>

                {/* Carousel buttons */}
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => onNavigate('analyses' as AppTab)}
                    className="text-xs text-slate-700 hover:text-red-600 font-semibold cursor-pointer hidden sm:inline"
                  >
                    Voir toutes les analyses →
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAnalysisOffset((o) => (o - 1 + Math.max(1, analysesData.length)) % Math.max(1, analysesData.length))}
                      className="w-6 h-6 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                      aria-label="Précédent"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAnalysisOffset((o) => (o + 1) % Math.max(1, analysesData.length))}
                      className="w-6 h-6 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                      aria-label="Suivant"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Article Rows */}
              <div className="space-y-3.5">
                {analyses.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => openArticle(article.id)}
                    className="group flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                  >
                    <img
                      src={resolveImage(article.image)}
                      alt={article.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-[13.5px] leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-light mt-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{article.dateLabel}</span>
                        <span>·</span>
                        <span>{article.readTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. CTA BANNER: OBTENEZ UNE ANALYSE PERSONNALISÉE (MATCHING SCREENSHOT)    */}
      {/* ========================================================================= */}
      <div className="relative bg-[#07152b] text-white overflow-hidden py-14 sm:py-16">
        {/* Night city lights ambient background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07152b] via-[#07152b]/95 to-[#07152b]/85" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-2.5">
              Obtenez une analyse personnalisée
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-light max-w-xl">
              Notre équipe d'experts vous fournit des insights sur mesure pour vos projets en Chine ou en Afrique du Nord.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (onRequestAnalysis) {
                  onRequestAnalysis();
                } else {
                  onNavigate('contact');
                }
              }}
              className="px-6 sm:px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow-lg transition-all cursor-pointer transform active:scale-98"
            >
              Demander une analyse
            </button>
            <button
              onClick={() => onNavigate('services')}
              className="px-6 sm:px-8 py-3 bg-transparent hover:bg-white/10 text-white border border-white/30 font-medium text-xs sm:text-sm rounded-lg transition-all cursor-pointer"
            >
              Découvrir nos offres
            </button>
          </div>

          {/* Right subtle aesthetic vertical text */}
          <div className="hidden xl:block text-right text-[9px] font-mono tracking-[0.2em] text-slate-400 space-y-1">
            <div>INSIGHTS</div>
            <div>PEOPLE</div>
            <div>OPPORTUNITIES</div>
            <div>A STRONGER TOMORROW</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. FOOTER DÉDIÉ (MATCHING SCREENSHOT EXACTLY)                             */}
      {/* ========================================================================= */}
      <footer className="bg-[#07152b] text-slate-300 text-xs font-light pt-14 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800/80">
            {/* Left Brand Column */}
            <div className="md:col-span-5 space-y-4">
              {/* QIAO Logo with Seal */}
              <div onClick={() => onNavigate('home')} className="cursor-pointer inline-block">
                <Logo size="sm" />
              </div>

              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                QIAO Intelligence fournit des analyses, des données et des opportunités pour renforcer les relations économiques entre la Chine et l'Afrique du Nord.
              </p>

              {/* Social links */}
              <div className="flex items-center gap-3 pt-1 text-slate-400">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white cursor-pointer transition-colors font-bold">in</a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white cursor-pointer transition-colors font-bold">f</a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white cursor-pointer transition-colors font-bold">▶</a>
                <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white cursor-pointer transition-colors font-bold">𝕏</a>
              </div>
            </div>

            {/* Nav Columns: À propos, Ressources, Support */}
            <div className="md:col-span-2">
              <h5 className="font-semibold text-white text-xs mb-3 uppercase tracking-wider">À propos</h5>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">Qui sommes-nous</button></li>
                <li><button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">Notre mission</button></li>
                <li><button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">Notre équipe</button></li>
                <li><button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer">Carrières</button></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="font-semibold text-white text-xs mb-3 uppercase tracking-wider">Ressources</h5>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><button onClick={() => onNavigate('analyses' as AppTab)} className="hover:text-white transition-colors cursor-pointer">Analyses</button></li>
                <li><button onClick={() => onNavigate('rapports' as AppTab)} className="hover:text-white transition-colors cursor-pointer">Rapports</button></li>
                <li><button onClick={() => onNavigate('marches-ecommerce' as AppTab)} className="hover:text-white transition-colors cursor-pointer">Études de marché</button></li>
                <li><button onClick={() => onNavigate('resources')} className="hover:text-white transition-colors">Blog</button></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h5 className="font-semibold text-white text-xs mb-3 uppercase tracking-wider">Support</h5>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Centre d'aide</button></li>
                <li><button onClick={() => openLegal('terms')} className="hover:text-white transition-colors cursor-pointer">Conditions d'utilisation</button></li>
                <li><button onClick={() => openLegal('privacy')} className="hover:text-white transition-colors cursor-pointer">Politique de confidentialité</button></li>
                <li><button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Nous contacter</button></li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright Strip */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-2">
            <div>© {new Date().getFullYear()} QIAO. Tous droits réservés.</div>
            <div>Conçu avec <span className="text-red-500">❤️</span> pour connecter les mondes.</div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL: OPPORTUNITY DETAILS                                               */}
      {/* ========================================================================= */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-48 w-full">
              <img
                src={resolveImage(selectedOpportunity.image)}
                alt={selectedOpportunity.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="absolute bottom-3 left-3 bg-slate-900 text-sky-300 text-xs font-bold px-3 py-1 rounded-md">
                {selectedOpportunity.type}
              </span>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {selectedOpportunity.title}
              </h3>

              <div className="flex flex-wrap gap-4 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
                <span className="flex items-center gap-1 font-medium text-slate-900">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  {selectedOpportunity.country}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {selectedOpportunity.sector}
                </span>
                <span className="flex items-center gap-1 font-bold text-slate-900">
                  <Tag className="w-3.5 h-3.5 text-red-600" />
                  {selectedOpportunity.amountLabel}
                </span>
                {selectedOpportunity.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Date limite : {selectedOpportunity.deadline}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-light">
                {selectedOpportunity.description}
              </p>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedOpportunity(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    const opportunity = selectedOpportunity;
                    setSelectedOpportunity(null);
                    applyToOpportunity(opportunity);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 shadow-md transition-all cursor-pointer"
                >
                  Postuler / Contacter l'expert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CORRIDOR DETAILS                                                  */}
      {/* ========================================================================= */}
      {activeCorridorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {activeCorridorModal === 'cn-na'
                    ? 'Corridor Chine → Afrique du Nord'
                    : 'Corridor Afrique du Nord → Chine'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Données macroéconomiques et opportunités bilatérales actualisées 2024
                </p>
              </div>
              <button
                onClick={() => setActiveCorridorModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-light mb-6">
              {activeCorridorModal === 'cn-na' ? (
                <>
                  <p>
                    Les investissements directs chinois (IDE) vers l'Afrique du Nord ont augmenté de 28% sur l'exercice 2023-2024, principalement concentrés dans les infrastructures portuaires, les gigafactories de batteries pour véhicules électriques (Maroc), les parcs solaires (Tunisie, Égypte) et l'assemblage industriel (Algérie).
                  </p>
                  <p>
                    QIAO accompagne plus de 120 entreprises chinoises dans leur implantation, négociation foncière, recrutement bilingue et conformité réglementaire locale.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    La demande chinoise pour les produits méditerranéens et les minéraux stratégiques (phosphate, cuivre, cobalt, huile d'olive, dattes deglet nour, agrumes) a progressé de 35%.
                  </p>
                  <p>
                    Grâce aux accords bilatéraux et aux plateformes de e-commerce transfrontalier, plus de 300 PME nord-africaines accèdent désormais au marché chinois sans intermédiaire coûteux.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActiveCorridorModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  const corridor = activeCorridorModal;
                  setActiveCorridorModal(null);
                  openDocument(
                    corridor === 'cn-na' ? "Opportunités d'investissement en Afrique du Nord" : "Guide d'exportation vers la Chine",
                  );
                }}
                className="px-5 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 shadow-md cursor-pointer"
              >
                Accéder au dossier complet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
