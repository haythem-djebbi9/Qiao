import React, { useState } from 'react';
import {
  TrendingUp,
  Search,
  ChevronDown,
  ArrowRight,
  Clock,
  DollarSign,
  Users,
  Building2,
  Package,
  Handshake,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Layers,
  ArrowUpRight,
  X
} from 'lucide-react';
import { CommerceHubTab } from '../../../types';
import { FlagIcon } from '../../common/FlagIcon';
import solarPanelsImg from '../../../assets/images/solar_farm_tunisia_1790805165350.jpg';
import fashionTextileImg from '../../../assets/images/textile_fashion_apparel_1790888282892.jpg';
import oliveOilImg from '../../../assets/images/olive_oil_export_1790805177453.jpg';
import logisticsWarehouseImg from '../../../assets/images/container_port_cargo_1790805153002.jpg';
import cosmeticsImg from '../../../assets/images/pharma_laboratory_1790888319378.jpg';
import successStoryCityImg from '../../../assets/images/china_corridor_night_skyline_1790804583067.jpg';

interface OpportunitesTabProps {
  onSelectTab: (tab: CommerceHubTab) => void;
  onOpenOpportunityDetail?: (oppId: string) => void;
  onOpenSignUp?: () => void;
}

interface OpportunityItem {
  id: string;
  badge: 'IMPORTATION' | 'PARTENARIAT' | 'EXPORTATION' | 'INVESTISSEMENT' | 'DISTRIBUTION';
  title: string;
  sector: string;
  fromCountry: string;
  toCountry: string;
  fromFlag: string;
  toFlag: string;
  amount: string;
  partnerType: string;
  publishedAgo: string;
  image: string;
  description: string;
}

export const OpportunitesTab: React.FC<OpportunitesTabProps> = ({
  onSelectTab,
  onOpenOpportunityDetail,
  onOpenSignUp,
}) => {
  const [oppType, setOppType] = useState('Toutes les opportunités');
  const [targetCountry, setTargetCountry] = useState('Tous les pays');
  const [sector, setSector] = useState('Toutes les catégories');
  const [investmentAmount, setInvestmentAmount] = useState('Tous les montants');
  const [status, setStatus] = useState('Tous les statuts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModalOpp, setSelectedModalOpp] = useState<OpportunityItem | null>(null);

  // 5 Main Opportunities matching the user screenshot
  const opportunitiesList: OpportunityItem[] = [
    {
      id: 'opp-solar-tunisia',
      badge: 'IMPORTATION',
      title: 'Fourniture de panneaux solaires pour le marché tunisien',
      sector: 'Énergie & Équipements',
      fromCountry: 'Chine',
      toCountry: 'Tunisie',
      fromFlag: '🇨🇳',
      toFlag: '🇹🇳',
      amount: '500 000 – 2 M USD',
      partnerType: 'Partenaire distributeur',
      publishedAgo: 'Publié il y a 2 jours',
      image: solarPanelsImg,
      description: 'Recherche de distributeurs agréés pour des modules solaires photovoltaïques haut rendement et onduleurs hybrides avec service après-vente qualifié en Tunisie.',
    },
    {
      id: 'opp-fashion-ecommerce',
      badge: 'PARTENARIAT',
      title: 'Joint-venture pour plateforme e-commerce mode',
      sector: 'Mode & Textile',
      fromCountry: 'Chine',
      toCountry: 'Maroc',
      fromFlag: '🇨🇳',
      toFlag: '🇲🇦',
      amount: '1 – 5 M USD',
      partnerType: 'Joint-venture',
      publishedAgo: 'Publié il y a 3 jours',
      image: fashionTextileImg,
      description: 'Développement d’une joint-venture technologique et logistique pour le déploiement d’une marketplace de mode transfrontalière entre la Chine et le Maroc.',
    },
    {
      id: 'opp-olive-oil-china',
      badge: 'EXPORTATION',
      title: 'Exportation d’huile d’olive vers la Chine',
      sector: 'Produits agricoles',
      fromCountry: 'Tunisie',
      toCountry: 'Chine',
      fromFlag: '🇹🇳',
      toFlag: '🇨🇳',
      amount: '300 000 – 1 M USD',
      partnerType: 'Acheteurs chinois',
      publishedAgo: 'Publié il y a 4 jours',
      image: oliveOilImg,
      description: 'Contrat d’approvisionnement en huile d’olive extra vierge conditionnée (bouteilles 500ml et 1L) pour centrales d’achat premium à Shanghai et Beijing.',
    },
    {
      id: 'opp-logistics-algeria',
      badge: 'INVESTISSEMENT',
      title: 'Investissement dans un entrepôt logistique',
      sector: 'Logistique & Supply Chain',
      fromCountry: 'Chine',
      toCountry: 'Algérie',
      fromFlag: '🇨🇳',
      toFlag: '🇩🇿',
      amount: '2 – 10 M USD',
      partnerType: 'Investissement direct',
      publishedAgo: 'Publié il y a 5 jours',
      image: logisticsWarehouseImg,
      description: 'Co-investissement dans une plateforme logistique sous douane de 12 000 m² près d’Alger avec hub de tri automatisé pour colis e-commerce.',
    },
    {
      id: 'opp-cosmetics-morocco',
      badge: 'PARTENARIAT',
      title: 'Recherche de fabricants de cosmétiques naturels',
      sector: 'Santé & Beauté',
      fromCountry: 'Maroc',
      toCountry: 'Chine',
      fromFlag: '🇲🇦',
      toFlag: '🇨🇳',
      amount: '100 000 – 500 000 USD',
      partnerType: 'Contrat de fabrication',
      publishedAgo: 'Publié il y a 6 jours',
      image: cosmeticsImg,
      description: 'Partenariat OEM/ODM pour la formulation et le conditionnement de soins cosmétiques à base d’huile d’argan et d’ingrédients botaniques certifiés bio.',
    },
  ];

  // Filtering logic
  const filteredOpportunities = opportunitiesList.filter((opp) => {
    if (oppType !== 'Toutes les opportunités' && opp.badge.toLowerCase() !== oppType.toLowerCase()) {
      return false;
    }
    if (targetCountry !== 'Tous les pays' && !opp.toCountry.includes(targetCountry) && !opp.fromCountry.includes(targetCountry)) {
      return false;
    }
    if (sector !== 'Toutes les catégories' && !opp.sector.toLowerCase().includes(sector.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        opp.title.toLowerCase().includes(q) ||
        opp.sector.toLowerCase().includes(q) ||
        opp.toCountry.toLowerCase().includes(q) ||
        opp.fromCountry.toLowerCase().includes(q) ||
        opp.partnerType.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Country counts matching screenshot
  const targetCountryCounts = [
    { country: 'Tunisie', flag: '🇹🇳', count: 320 },
    { country: 'Algérie', flag: '🇩🇿', count: 280 },
    { country: 'Maroc', flag: '🇲🇦', count: 260 },
    { country: 'Égypte', flag: '🇪🇬', count: 180 },
    { country: 'Libye', flag: '🇱🇾', count: 90 },
  ];

  // Sectors progress list matching screenshot
  const mostWantedSectors = [
    { name: 'Énergie & Équipements', pct: 22, width: '92%' },
    { name: 'Mode & Textile', pct: 18, width: '75%' },
    { name: 'Produits agricoles', pct: 16, width: '67%' },
    { name: 'Logistique & Transport', pct: 12, width: '50%' },
    { name: 'Électronique & High-Tech', pct: 10, width: '42%' },
    { name: 'Santé & Beauté', pct: 8, width: '33%' },
    { name: 'Agroalimentaire', pct: 6, width: '25%' },
    { name: 'Autres', pct: 8, width: '33%' },
  ];

  // Types breakdown donut data
  const typesBreakdown = [
    { name: 'Importation', pct: 28, color: '#0c4a9e' },
    { name: 'Exportation', pct: 24, color: '#0284c7' },
    { name: 'Partenariat', pct: 18, color: '#38bdf8' },
    { name: 'Investissement', pct: 12, color: '#a855f7' },
    { name: 'Distribution', pct: 8, color: '#ec4899' },
    { name: 'Joint-venture', pct: 6, color: '#ef4444' },
    { name: 'Autres', pct: 4, color: '#f97316' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. FILTER BAR (MATCHING SCREENSHOT)                                       */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          
          {/* Type d'opportunité */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Type d'opportunité
            </label>
            <div className="relative">
              <select
                value={oppType}
                onChange={(e) => setOppType(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Toutes les opportunités</option>
                <option>Importation</option>
                <option>Exportation</option>
                <option>Partenariat</option>
                <option>Investissement</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Pays cible */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Pays cible
            </label>
            <div className="relative">
              <select
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Tous les pays</option>
                <option>Tunisie</option>
                <option>Algérie</option>
                <option>Maroc</option>
                <option>Égypte</option>
                <option>Libye</option>
                <option>Chine</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Secteur / Catégorie */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Secteur / Catégorie
            </label>
            <div className="relative">
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Toutes les catégories</option>
                <option>Énergie & Équipements</option>
                <option>Mode & Textile</option>
                <option>Produits agricoles</option>
                <option>Logistique & Supply Chain</option>
                <option>Santé & Beauté</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Montant d'investissement */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Montant d'investissement
            </label>
            <div className="relative">
              <select
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Tous les montants</option>
                <option>100k - 500k USD</option>
                <option>500k - 2M USD</option>
                <option>1M - 5M USD</option>
                <option>2M - 10M USD</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Statut
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Tous les statuts</option>
                <option>Actives</option>
                <option>Vérifiées QIAO</option>
                <option>Urgentes</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une opportunité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FIVE METRIC CARDS (MATCHING SCREENSHOT)                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                1 200+
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
                Opportunités actives
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>+32%</span>
            <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                480
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
                Projets d'investissement
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>+28%</span>
            <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                320
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
                Opportunités d'importation
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>+24%</span>
            <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                280
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
                Opportunités d'exportation
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>+18%</span>
            <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                120
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
                Recherches de partenaires
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>+40%</span>
            <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. TWO-COLUMN MAIN CONTENT: OPPORTUNITÉS RÉCENTES & ANALYTICS WIDGETS      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN (approx 65% width: lg:col-span-8)                          */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Opportunités récentes
            </h2>
            <button
              onClick={() => {
                setOppType('Toutes les opportunités');
                setTargetCountry('Tous les pays');
                setSector('Toutes les catégories');
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Voir toutes les opportunités</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-3.5">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left: Thumbnail + Titles + Badges */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    <img
                      src={opp.image}
                      alt={opp.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-[#0c4a9e] text-white text-[9.5px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                        {opp.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {opp.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        {opp.sector}
                      </span>

                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        <FlagIcon country={opp.fromCountry} size="sm" />
                        <span>{opp.fromCountry}</span>
                        <span className="text-slate-400 font-bold">→</span>
                        <FlagIcon country={opp.toCountry} size="sm" />
                        <span>{opp.toCountry}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Metadata + Button */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 gap-3 shrink-0">
                  <div className="space-y-1 text-right text-[11px] text-slate-500 font-medium">
                    <div className="flex items-center sm:justify-end gap-1.5 text-slate-800 font-bold text-xs">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span>{opp.amount}</span>
                    </div>
                    <div className="flex items-center sm:justify-end gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{opp.partnerType}</span>
                    </div>
                    <div className="flex items-center sm:justify-end gap-1.5 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{opp.publishedAgo}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onOpenOpportunityDetail) {
                        onOpenOpportunityDetail(opp.id);
                      } else {
                        setSelectedModalOpp(opp);
                      }
                    }}
                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    <span>Voir détails</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* ===================================================================== */}
          {/* SUB-SECTION ROW: COMMENT ÇA MARCHE ? & SUCCESS STORIES                */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
            
            {/* Sub-card 1: Comment ça marche ? */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">
                  Comment ça marche ?
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1.5 shadow-2xs">
                      <Search className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">1. Explorez</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Trouvez des opportunités vérifiées
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1.5 shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">2. Connectez</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Contactez les partenaires
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1.5 shadow-2xs">
                      <Handshake className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">3. Collaborez</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Développez votre projet
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1.5 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">4. Réussissez</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Un impact durable
                    </div>
                  </div>
                </div>
              </div>

              {/* Red CTA Button */}
              <button
                onClick={onOpenSignUp}
                className="w-full bg-[#e50028] hover:bg-[#c90022] text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Créer un compte gratuitement</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-card 2: Success stories */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Success stories
                  </h3>
                  <button
                    onClick={() => onSelectTab('analyses')}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Voir toutes les success stories</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card item */}
                <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50/70 p-3 flex items-start gap-3.5">
                  <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={successStoryCityImg}
                      alt="Importation de véhicules électriques en Tunisie"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      Importation de véhicules électriques en Tunisie
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                      Une entreprise tunisienne a conclu un partenariat avec un fabricant chinois pour la distribution de véhicules électriques.
                    </p>
                    <button
                      onClick={() => onSelectTab('analyses')}
                      className="text-xs font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      <span>Lire l'histoire</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Carousel indicator dots (1 red, 3 light blue) */}
              <div className="flex items-center justify-center gap-1.5 pt-3">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span className="w-2 h-2 rounded-full bg-sky-200" />
                <span className="w-2 h-2 rounded-full bg-sky-200" />
                <span className="w-2 h-2 rounded-full bg-sky-200" />
              </div>
            </div>

          </div>

        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN (approx 35% width: lg:col-span-4)                         */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Types d'opportunités (Donut breakdown) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">
              Types d'opportunités
            </h3>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-5">
              
              {/* SVG Donut */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                  
                  {/* Segments: total circumference = 2 * PI * 46 = 289 */}
                  {/* 28% = 80.9 */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#0c4a9e"
                    strokeWidth="16"
                    strokeDasharray="80.9 208.1"
                    strokeDashoffset="0"
                  />
                  {/* 24% = 69.4 */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="16"
                    strokeDasharray="69.4 219.6"
                    strokeDashoffset="-80.9"
                  />
                  {/* 18% = 52.0 */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="16"
                    strokeDasharray="52.0 237.0"
                    strokeDashoffset="-150.3"
                  />
                  {/* 12% = 34.7 */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="16"
                    strokeDasharray="34.7 254.3"
                    strokeDashoffset="-202.3"
                  />
                  {/* 8% = 23.1 */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="16"
                    strokeDasharray="23.1 265.9"
                    strokeDashoffset="-237.0"
                  />
                  {/* 6% = 17.3 */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="16"
                    strokeDasharray="17.3 271.7"
                    strokeDashoffset="-260.1"
                  />
                  {/* 4% = 11.6 */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="16"
                    strokeDasharray="11.6 277.4"
                    strokeDashoffset="-277.4"
                  />
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-base font-black text-slate-900">1 200</span>
                  <span className="text-[10px] text-slate-500 font-medium">Opportunités</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 w-full text-xs">
                {typesBreakdown.map((t) => (
                  <div key={t.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-slate-700 font-medium">{t.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{t.pct}%</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Card 2: Opportunités par pays cible */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Opportunités par pays cible
              </h3>
              <button
                onClick={() => onSelectTab('flux-commerciaux')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Voir tous les pays</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {targetCountryCounts.map((c) => (
                <div
                  key={c.country}
                  onClick={() => setTargetCountry(c.country)}
                  className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all cursor-pointer ${
                    targetCountry === c.country
                      ? 'bg-blue-50 border-blue-400 shadow-xs'
                      : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-center">
                    <FlagIcon country={c.country} size="lg" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 truncate w-full">
                    {c.country}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 mt-1">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Secteurs les plus recherchés */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Secteurs les plus recherchés
              </h3>
              <button
                onClick={() => onSelectTab('produits')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Voir tous les secteurs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {mostWantedSectors.map((s) => (
                <div
                  key={s.name}
                  onClick={() => setSector(s.name)}
                  className="space-y-1 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 group-hover:text-blue-700 transition-colors">
                      {s.name}
                    </span>
                    <span className="font-extrabold text-slate-900">{s.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: s.width }}
                      className="bg-[#2563eb] h-full rounded-full transition-all duration-500 group-hover:bg-[#1d4ed8]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Detail Modal for Opportunity */}
      {selectedModalOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedModalOpp(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#0c4a9e] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                {selectedModalOpp.badge}
              </span>
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                {selectedModalOpp.sector}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2 leading-snug">
              {selectedModalOpp.title}
            </h3>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {selectedModalOpp.description}
            </p>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Corridor</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <FlagIcon country={selectedModalOpp.fromCountry} size="sm" />
                  <span>{selectedModalOpp.fromCountry}</span>
                  <span className="text-slate-400">→</span>
                  <FlagIcon country={selectedModalOpp.toCountry} size="sm" />
                  <span>{selectedModalOpp.toCountry}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Budget estimé</span>
                <span className="font-extrabold text-blue-700">{selectedModalOpp.amount}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Type de partenaire</span>
                <span className="font-semibold text-slate-800">{selectedModalOpp.partnerType}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date de publication</span>
                <span className="font-semibold text-slate-800">{selectedModalOpp.publishedAgo}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedModalOpp(null);
                  if (onOpenSignUp) onOpenSignUp();
                }}
                className="flex-1 bg-[#e50028] hover:bg-[#c90022] text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Postuler à cette opportunité</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedModalOpp(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
