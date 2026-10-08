import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Globe,
  Search,
  ChevronDown,
  ArrowRight,
  Sun,
  Activity,
  Settings,
  Apple,
  Truck,
  Lightbulb,
  Target,
  Download,
  Mail,
  Zap,
  Smartphone,
  Coins,
  CheckCircle2,
  X,
  Share2,
  Bookmark,
  FileText,
  RotateCcw,
  Sparkles,
  BarChart3,
  Calendar,
  Clock
} from 'lucide-react';
import { CommerceHubTab } from '../../../types';
import { BILATERAL_NORTH_AFRICA_PATHS } from '../components/realMapData';
import skylineImg from '../../../assets/images/china_corridor_night_skyline_1790804583067.jpg';
import solarImg from '../../../assets/images/solar_farm_tunisia_1790805165350.jpg';
import portImg from '../../../assets/images/container_port_cargo_1790805153002.jpg';

interface AnalysesTabProps {
  onSelectTab: (tab: CommerceHubTab) => void;
  onOpenArticle?: (title: string) => void;
}

interface ArticleDetail {
  id: string;
  title: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  summary: string;
  keyPoints: string[];
  content: string[];
}

export const AnalysesTab: React.FC<AnalysesTabProps> = ({
  onSelectTab,
  onOpenArticle,
}) => {
  // Filters
  const [period, setPeriod] = useState('2020 - 2024');
  const [country, setCountry] = useState('Tous les pays');
  const [sector, setSector] = useState('Toutes les catégories');
  const [analysisType, setAnalysisType] = useState('Toutes les analyses');
  
  // Interactive UI states
  const [ecommerceRegion, setEcommerceRegion] = useState<'chine' | 'na' | 'comp'>('chine');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredTrendYear, setHoveredTrendYear] = useState<number | null>(null);
  const [hoveredForecastYear, setHoveredForecastYear] = useState<number | null>(null);
  const [selectedArticleModal, setSelectedArticleModal] = useState<ArticleDetail | null>(null);

  const resetFilters = () => {
    setPeriod('2020 - 2024');
    setCountry('Tous les pays');
    setSector('Toutes les catégories');
    setAnalysisType('Toutes les analyses');
  };

  const hasActiveFilters =
    period !== '2020 - 2024' ||
    country !== 'Tous les pays' ||
    sector !== 'Toutes les catégories' ||
    analysisType !== 'Toutes les analyses';

  // Dynamic Metrics based on Country filter
  const getMetrics = () => {
    switch (country) {
      case 'Maroc':
        return {
          vol: '6,8 Mds',
          volGrowth: '+15%',
          ecom: '4,2 Mds',
          ecomGrowth: '+25%',
          export: '5,8 Mds',
          exportGrowth: '+12%',
          usersCn: '500+ M',
          usersNa: '22 M',
          usersNaGrowth: '+24%',
        };
      case 'Algérie':
        return {
          vol: '8,4 Mds',
          volGrowth: '+19%',
          ecom: '3,8 Mds',
          ecomGrowth: '+18%',
          export: '7,6 Mds',
          exportGrowth: '+16%',
          usersCn: '500+ M',
          usersNa: '26 M',
          usersNaGrowth: '+21%',
        };
      case 'Tunisie':
        return {
          vol: '4,3 Mds',
          volGrowth: '+12%',
          ecom: '2,1 Mds',
          ecomGrowth: '+20%',
          export: '3,6 Mds',
          exportGrowth: '+10%',
          usersCn: '500+ M',
          usersNa: '8,5 M',
          usersNaGrowth: '+17%',
        };
      case 'Égypte':
        return {
          vol: '6,1 Mds',
          volGrowth: '+17%',
          ecom: '5,6 Mds',
          ecomGrowth: '+28%',
          export: '5,2 Mds',
          exportGrowth: '+15%',
          usersCn: '500+ M',
          usersNa: '48 M',
          usersNaGrowth: '+29%',
        };
      case 'Libye':
        return {
          vol: '2,8 Mds',
          volGrowth: '+24%',
          ecom: '0,9 Mds',
          ecomGrowth: '+30%',
          export: '2,4 Mds',
          exportGrowth: '+22%',
          usersCn: '500+ M',
          usersNa: '3,8 M',
          usersNaGrowth: '+26%',
        };
      default:
        return {
          vol: '450 Mds',
          volGrowth: '+18%',
          ecom: '28,4 Mds',
          ecomGrowth: '+22%',
          export: '320 Mds',
          exportGrowth: '+14%',
          usersCn: '500+ M',
          usersNa: '78 M',
          usersNaGrowth: '+20%',
        };
    }
  };

  const metrics = getMetrics();

  // Articles Database
  const articlesList: ArticleDetail[] = [
    {
      id: 'art-1',
      title: 'Les tendances du e-commerce en Afrique du Nord (2024)',
      date: '12 Sept. 2024',
      readTime: '6 min de lecture',
      category: 'E-commerce & Marchés',
      image: skylineImg,
      summary: 'Une analyse complète des habitudes d’achat numériques, de la pénétration mobile et de l’intégration des plateformes chinoises de cross-border dans les cinq pays nord-africains.',
      keyPoints: [
        'Pénétration mobile dépassant 84% dans les grands centres urbains de Casablanca, Alger, Tunis et Le Caire.',
        'Hausse de 38% des commandes directes B2C et B2B via les marketplaces internationales.',
        'Développement accéléré de solutions de paiement électronique et de conformité douanière simplifiée.',
      ],
      content: [
        'Le commerce électronique entre la Chine et l’Afrique du Nord connaît un tournant décisif. En 2024, le volume des transactions numériques transfrontalières a progressé de plus de 22%, soutenu par une adoption fulgurante du smartphone et une demande insatiable en produits technologiques et équipements spécialisés.',
        'Les entreprises locales tirent parti d’infrastructures logistiques modernisées, notamment à travers les hubs aéroportuaires et portuaires méditerranéens, réduisant les délais de livraison moyens de 18 jours à moins de 8 jours pour les flux express.',
        'Les perspectives 2025 indiquent une diversification accrue vers l’exportation de produits maghrébins haut de gamme vers les plateformes e-commerce chinoises, en particulier dans les secteurs de l’huile d’olive, des cosmétiques naturels et de l’artisanat d’art.',
      ],
    },
    {
      id: 'art-2',
      title: 'Opportunités dans les énergies renouvelables et la transition verte',
      date: '28 Août 2024',
      readTime: '8 min de lecture',
      category: 'Énergies & Projets',
      image: solarImg,
      summary: 'Évaluation des synergies industrielles sino-nord-africaines dans le photovoltaïque, le stockage par batterie et la production d’hydrogène vert.',
      keyPoints: [
        'Investissements industriels conjoints prévus à plus de 4,5 milliards USD d’ici 2028.',
        'Transfert de technologie pour la fabrication locale de composants et d’onduleurs solaires.',
        'Positionnement stratégique de l’Afrique du Nord comme pont énergétique vert vers l’Europe.',
      ],
      content: [
        'L’Afrique du Nord dispose d’un des gisements solaires les plus exceptionnels au monde, tandis que les industriels chinois mènent la chaîne mondiale des équipements solaires et des solutions de stockage par batterie.',
        'Cette complémentarité naturelle s’est concrétisée en 2024 par la signature de plus d’une quinzaine de protocoles d’accord industriels et de co-entreprises au Maroc, en Algérie et en Tunisie.',
        'QIAO Intelligence identifie ce secteur comme l’un des trois vecteurs prioritaires de croissance durable pour les partenariats bilatéraux jusqu’en 2030.',
      ],
    },
    {
      id: 'art-3',
      title: 'Analyse des importations par catégorie de produits et résilience des supply chains',
      date: '15 Juillet 2024',
      readTime: '5 min de lecture',
      category: 'Commerce International',
      image: portImg,
      summary: 'Radiographie détaillée des 10 principaux groupes de produits échangés entre la Chine et les pays maghrébins avec focus logistique portuaire.',
      keyPoints: [
        'Prédominance des produits électroniques (24%) et du textile/mode (18%).',
        'Montée en puissance des machines industrielles et outillages de précision (+16% en volume).',
        'Renforcement de la desserte maritime directe via les corridors Tanger Med, Djendjen et Radès.',
      ],
      content: [
        'L’évolution structurelle des flux commerciaux témoigne d’une transition vers des biens à plus forte valeur ajoutée. Les importations ne se limitent plus aux produits de consommation courante mais englobent des biens d’équipement cruciaux pour l’industrialisation locale.',
        'La modernisation des infrastructures logistiques portuaires a permis une fluidification substantielle des formalités de dédouanement et une diminution des coûts de fret unitaire.',
        'Pour les exportateurs nord-africains, les créneaux les plus prometteurs en Chine résident dans les phosphates transformés, les câbles automobiles, et les denrées agroalimentaires certifiées.',
      ],
    },
  ];

  const handleDownloadReport = (title: string) => {
    setDownloadToast(`Téléchargement initié : ${title} (PDF, 4.2 Mo)`);
    setTimeout(() => {
      setDownloadToast(null);
    }, 4000);
  };

  return (
    <div id="analyses-content" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#07152b] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-sky-400/40 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{downloadToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. FILTER BAR (MATCHING SCREENSHOT WITH REAL INTERACTIVITY)               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
          
          {/* Période */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Période</label>
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>2020 - 2024</option>
                <option>2023 - 2024</option>
                <option>2018 - 2024</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Pays / Région */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pays / Région</label>
            <div className="relative">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Tous les pays</option>
                <option>Maroc</option>
                <option>Algérie</option>
                <option>Tunisie</option>
                <option>Égypte</option>
                <option>Libye</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Secteur */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Secteur</label>
            <div className="relative">
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Toutes les catégories</option>
                <option>Électronique & High-Tech</option>
                <option>Vêtements & Mode</option>
                <option>Machines & Équipements</option>
                <option>Énergies Renouvelables</option>
                <option>Agroalimentaire</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Type d'analyse */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Type d'analyse</label>
            <div className="relative">
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Toutes les analyses</option>
                <option>Tendances macro</option>
                <option>Prévisions & Scénarios</option>
                <option>Analyses par pays</option>
                <option>Marchés e-commerce</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Actions: Appliquer & Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}}
              className="flex-1 bg-[#0c2448] hover:bg-[#071830] text-white py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-white" />
              <span>Appliquer</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                title="Réinitialiser les filtres"
                className="p-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Active Filter Pills Indicator */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-400 font-medium">Filtres actifs :</span>
            {country !== 'Tous les pays' && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
                {country}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setCountry('Tous les pays')} />
              </span>
            )}
            {period !== '2020 - 2024' && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
                {period}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setPeriod('2020 - 2024')} />
              </span>
            )}
            {sector !== 'Toutes les catégories' && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
                {sector}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSector('Toutes les catégories')} />
              </span>
            )}
            {analysisType !== 'Toutes les analyses' && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
                {analysisType}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setAnalysisType('Toutes les analyses')} />
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-[11px] text-red-600 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Effacer tout
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. FIVE METRIC CARDS (ROW 1) - DYNAMIC & HIGH CONTRAST                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Volume total du commerce */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{metrics.vol}</span>
                <span className="text-xs font-bold text-blue-600 uppercase">USD</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-600 leading-snug mt-0.5">
                {country === 'Tous les pays' ? 'Volume total du commerce' : `Volume bilatéral (${country})`}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-emerald-600">
              {metrics.volGrowth} <span className="text-slate-400 font-normal text-[10px]">vs 2023</span>
            </div>
            <svg viewBox="0 0 50 16" className="w-12 h-4 text-emerald-500 stroke-current fill-none" strokeWidth="2">
              <path d="M 0 12 Q 12 14, 25 7 T 50 2" />
            </svg>
          </div>
        </div>

        {/* Card 2: E-commerce */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{metrics.ecom}</span>
                <span className="text-xs font-bold text-blue-600 uppercase">USD</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-600 leading-snug mt-0.5">
                E-commerce
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-emerald-600">
              {metrics.ecomGrowth} <span className="text-slate-400 font-normal text-[10px]">vs 2023</span>
            </div>
            <svg viewBox="0 0 50 16" className="w-12 h-4 text-blue-500 stroke-current fill-none" strokeWidth="2">
              <path d="M 0 14 Q 15 15, 28 8 T 50 2" />
            </svg>
          </div>
        </div>

        {/* Card 3: Exportations */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{metrics.export}</span>
                <span className="text-xs font-bold text-blue-600 uppercase">USD</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-600 leading-snug mt-0.5">
                Exportations chinoises
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-emerald-600">
              {metrics.exportGrowth} <span className="text-slate-400 font-normal text-[10px]">vs 2023</span>
            </div>
            <svg viewBox="0 0 50 16" className="w-12 h-4 text-purple-500 stroke-current fill-none" strokeWidth="2">
              <path d="M 0 10 Q 15 14, 30 7 T 50 3" />
            </svg>
          </div>
        </div>

        {/* Card 4: Consommateurs en ligne en Chine */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{metrics.usersCn}</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-600 leading-snug mt-0.5">
                Consommateurs en ligne en Chine
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-emerald-600">
              +9% <span className="text-slate-400 font-normal text-[10px]">vs 2023</span>
            </div>
            <svg viewBox="0 0 50 16" className="w-12 h-4 text-amber-500 stroke-current fill-none" strokeWidth="2">
              <path d="M 0 13 Q 18 13, 32 7 T 50 4" />
            </svg>
          </div>
        </div>

        {/* Card 5: Consommateurs en Afrique du Nord */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{metrics.usersNa}</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-600 leading-snug mt-0.5">
                Consommateurs e-commerce (AN)
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-emerald-600">
              {metrics.usersNaGrowth} <span className="text-slate-400 font-normal text-[10px]">vs 2023</span>
            </div>
            <svg viewBox="0 0 50 16" className="w-12 h-4 text-rose-500 stroke-current fill-none" strokeWidth="2">
              <path d="M 0 14 Q 15 15, 30 7 T 50 2" />
            </svg>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. ROW 2: TENDANCES DU COMMERCE / RÉPARTITION PAR PAYS / CATÉGORIES       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Tendances du commerce Chine – Afrique du Nord */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Tendances du commerce Chine – Afrique du Nord
              </h3>
              <button
                onClick={() => onSelectTab('flux-commerciaux')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Voir plus</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-medium">Mds USD (2020 - 2024)</span>

            {/* Chart + Badges Layout */}
            <div className="grid grid-cols-12 gap-2 mt-2 items-center">
              
              {/* Line Chart Area */}
              <div className="col-span-8 relative h-[180px]">
                <svg viewBox="0 0 200 140" className="w-full h-full overflow-visible">
                  {/* Grid lines with precise spacing */}
                  <line x1="25" y1="20" x2="200" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="25" y1="47" x2="200" y2="47" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="25" y1="74" x2="200" y2="74" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="25" y1="101" x2="200" y2="101" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="25" y1="128" x2="200" y2="128" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Y Axis Labels */}
                  <text x="2" y="23" fontSize="8" fill="#94a3b8" fontWeight="600">450</text>
                  <text x="2" y="50" fontSize="8" fill="#94a3b8" fontWeight="600">350</text>
                  <text x="2" y="77" fontSize="8" fill="#94a3b8" fontWeight="600">250</text>
                  <text x="2" y="104" fontSize="8" fill="#94a3b8" fontWeight="600">150</text>
                  <text x="12" y="130" fontSize="8" fill="#94a3b8" fontWeight="600">0</text>

                  {/* X Axis Labels */}
                  <text x="30" y="139" fontSize="7.5" fill="#64748b" fontWeight="600" textAnchor="middle">2020</text>
                  <text x="70" y="139" fontSize="7.5" fill="#64748b" fontWeight="600" textAnchor="middle">2021</text>
                  <text x="112" y="139" fontSize="7.5" fill="#64748b" fontWeight="600" textAnchor="middle">2022</text>
                  <text x="154" y="139" fontSize="7.5" fill="#64748b" fontWeight="600" textAnchor="middle">2023</text>
                  <text x="195" y="139" fontSize="7.5" fill="#64748b" fontWeight="600" textAnchor="middle">2024</text>

                  {/* Curve 1: Volume Total (Grey / Slate) */}
                  <path
                    d="M 30,105 L 70,90 L 112,72 L 154,54 L 195,25"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {[
                    { x: 30, y: 105, val: '235 Mds', year: 2020 },
                    { x: 70, y: 90, val: '280 Mds', year: 2021 },
                    { x: 112, y: 72, val: '340 Mds', year: 2022 },
                    { x: 154, y: 54, val: '390 Mds', year: 2023 },
                    { x: 195, y: 25, val: '450 Mds', year: 2024 },
                  ].map((pt) => (
                    <circle
                      key={pt.year}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredTrendYear === pt.year ? 4.5 : 3}
                      fill="#94a3b8"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredTrendYear(pt.year)}
                      onMouseLeave={() => setHoveredTrendYear(null)}
                    />
                  ))}

                  {/* Curve 2: Exportations Chine (Blue) */}
                  <path
                    d="M 30,115 L 70,106 L 112,94 L 154,80 L 195,62"
                    fill="none"
                    stroke="#0066cc"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {[
                    { x: 30, y: 115, val: '140 Mds', year: 2020 },
                    { x: 70, y: 106, val: '170 Mds', year: 2021 },
                    { x: 112, y: 94, val: '205 Mds', year: 2022 },
                    { x: 154, y: 80, val: '230 Mds', year: 2023 },
                    { x: 195, y: 62, val: '262 Mds', year: 2024 },
                  ].map((pt) => (
                    <circle
                      key={pt.year}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredTrendYear === pt.year ? 4.5 : 3}
                      fill="#0066cc"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredTrendYear(pt.year)}
                      onMouseLeave={() => setHoveredTrendYear(null)}
                    />
                  ))}

                  {/* Curve 3: Importations Afrique du Nord (Red) */}
                  <path
                    d="M 30,122 L 70,116 L 112,108 L 154,98 L 195,85"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {[
                    { x: 30, y: 122, val: '95 Mds', year: 2020 },
                    { x: 70, y: 116, val: '110 Mds', year: 2021 },
                    { x: 112, y: 108, val: '135 Mds', year: 2022 },
                    { x: 154, y: 98, val: '160 Mds', year: 2023 },
                    { x: 195, y: 85, val: '188 Mds', year: 2024 },
                  ].map((pt) => (
                    <circle
                      key={pt.year}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredTrendYear === pt.year ? 4.5 : 3}
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredTrendYear(pt.year)}
                      onMouseLeave={() => setHoveredTrendYear(null)}
                    />
                  ))}

                  {/* Active Tooltip on hover */}
                  {hoveredTrendYear && (
                    <g>
                      <rect
                        x="75"
                        y="2"
                        width="70"
                        height="20"
                        rx="4"
                        fill="#0f2448"
                        fillOpacity="0.9"
                      />
                      <text x="110" y="15" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {hoveredTrendYear} : {hoveredTrendYear === 2024 ? '450 Mds USD' : hoveredTrendYear === 2023 ? '390 Mds USD' : hoveredTrendYear === 2022 ? '340 Mds USD' : hoveredTrendYear === 2021 ? '280 Mds USD' : '235 Mds USD'}
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Right Side TCAM Badges */}
              <div className="col-span-4 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">
                  TCAM 2020-2024
                </div>
                
                <div className="p-2 rounded-xl bg-emerald-50/90 border border-emerald-100 text-center">
                  <div className="text-xs font-black text-emerald-600">+19%</div>
                  <div className="text-[9.5px] font-semibold text-slate-700 leading-tight">Volume total</div>
                </div>

                <div className="p-2 rounded-xl bg-blue-50/90 border border-blue-100 text-center">
                  <div className="text-xs font-black text-blue-600">+16%</div>
                  <div className="text-[9.5px] font-semibold text-slate-700 leading-tight">Export. Chine</div>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/90 border border-rose-100 text-center">
                  <div className="text-xs font-black text-rose-600">+21%</div>
                  <div className="text-[9.5px] font-semibold text-slate-700 leading-tight">Import. Maghreb</div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Legend */}
          <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-600 pt-3 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Volume total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0066cc]" />
              <span>Exportations (Chine)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>Importations (Afrique du Nord)</span>
            </div>
          </div>
        </div>

        {/* Col 2: Répartition des échanges par pays (2024) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Répartition des échanges par pays (2024)
              </h3>
              <span className="text-[11px] font-bold text-slate-400">Total: 28,6 Mds USD</span>
            </div>

            {/* North Africa Map with interactive vectors and SVG badges */}
            <div className="relative w-full h-[135px] bg-slate-50/80 rounded-xl overflow-hidden border border-slate-100 p-1">
              <svg viewBox="0 0 450 220" className="w-full h-full drop-shadow-2xs">
                {/* Morocco */}
                <path
                  d={`${BILATERAL_NORTH_AFRICA_PATHS.morocco} ${BILATERAL_NORTH_AFRICA_PATHS.wsahara}`}
                  fill={hoveredCountry === 'Maroc' ? '#0369a1' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCountry('Maroc')}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setCountry(country === 'Maroc' ? 'Tous les pays' : 'Maroc')}
                />
                {/* Algeria */}
                <path
                  d={BILATERAL_NORTH_AFRICA_PATHS.algeria}
                  fill={hoveredCountry === 'Algérie' ? '#0f172a' : '#0369a1'}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCountry('Algérie')}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setCountry(country === 'Algérie' ? 'Tous les pays' : 'Algérie')}
                />
                {/* Tunisia */}
                <path
                  d={BILATERAL_NORTH_AFRICA_PATHS.tunisia}
                  fill={hoveredCountry === 'Tunisie' ? '#0f172a' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCountry('Tunisie')}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setCountry(country === 'Tunisie' ? 'Tous les pays' : 'Tunisie')}
                />
                {/* Libya */}
                <path
                  d={BILATERAL_NORTH_AFRICA_PATHS.libya}
                  fill={hoveredCountry === 'Libye' ? '#0f172a' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCountry('Libye')}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setCountry(country === 'Libye' ? 'Tous les pays' : 'Libye')}
                />
                {/* Egypt */}
                <path
                  d={BILATERAL_NORTH_AFRICA_PATHS.egypt}
                  fill={hoveredCountry === 'Égypte' ? '#0f172a' : '#0369a1'}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCountry('Égypte')}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setCountry(country === 'Égypte' ? 'Tous les pays' : 'Égypte')}
                />

                {/* SVG-embedded country labels pinned to geographic centroids */}
                <g className="pointer-events-none select-none">
                  {/* Maroc */}
                  <rect x="25" y="80" width="70" height="18" rx="4" fill="#ffffff" fillOpacity="0.9" />
                  <text x="60" y="92" fontSize="7.5" fill="#0f2448" fontWeight="bold" textAnchor="middle">
                    Maroc <tspan fill="#0066cc" fontWeight="800">6,8 Mds</tspan>
                  </text>

                  {/* Algérie */}
                  <rect x="110" y="110" width="72" height="18" rx="4" fill="#ffffff" fillOpacity="0.9" />
                  <text x="146" y="122" fontSize="7.5" fill="#0f2448" fontWeight="bold" textAnchor="middle">
                    Algérie <tspan fill="#0066cc" fontWeight="800">8,4 Mds</tspan>
                  </text>

                  {/* Tunisie */}
                  <rect x="180" y="35" width="70" height="18" rx="4" fill="#ffffff" fillOpacity="0.9" />
                  <text x="215" y="47" fontSize="7.5" fill="#0f2448" fontWeight="bold" textAnchor="middle">
                    Tunisie <tspan fill="#0066cc" fontWeight="800">4,3 Mds</tspan>
                  </text>

                  {/* Libye */}
                  <rect x="250" y="125" width="66" height="18" rx="4" fill="#ffffff" fillOpacity="0.9" />
                  <text x="283" y="137" fontSize="7.5" fill="#0f2448" fontWeight="bold" textAnchor="middle">
                    Libye <tspan fill="#0066cc" fontWeight="800">2,8 Mds</tspan>
                  </text>

                  {/* Égypte */}
                  <rect x="345" y="105" width="68" height="18" rx="4" fill="#ffffff" fillOpacity="0.9" />
                  <text x="379" y="117" fontSize="7.5" fill="#0f2448" fontWeight="bold" textAnchor="middle">
                    Égypte <tspan fill="#0066cc" fontWeight="800">6,1 Mds</tspan>
                  </text>
                </g>
              </svg>
            </div>

            {/* List with progress bars */}
            <div className="space-y-1.5 mt-3">
              {[
                { rank: 1, country: 'Algérie', val: '8,4 Mds USD', pct: '29%', width: '100%' },
                { rank: 2, country: 'Maroc', val: '6,8 Mds USD', pct: '24%', width: '83%' },
                { rank: 3, country: 'Égypte', val: '6,1 Mds USD', pct: '21%', width: '72%' },
                { rank: 4, country: 'Tunisie', val: '4,3 Mds USD', pct: '15%', width: '52%' },
                { rank: 5, country: 'Libye', val: '2,8 Mds USD', pct: '10%', width: '35%' },
                { rank: 6, country: 'Autres', val: '0,5 Mds USD', pct: '1%', width: '4%' },
              ].map((item) => (
                <div
                  key={item.country}
                  onMouseEnter={() => setHoveredCountry(item.country)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setCountry(country === item.country ? 'Tous les pays' : item.country)}
                  className={`flex items-center justify-between gap-3 text-xs p-1 rounded-lg transition-colors cursor-pointer ${
                    hoveredCountry === item.country || country === item.country
                      ? 'bg-blue-50/80 font-bold'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 w-20 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 w-3">{item.rank}</span>
                    <span className="font-semibold text-slate-800">{item.country}</span>
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      style={{ width: item.width }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        hoveredCountry === item.country || country === item.country
                          ? 'bg-[#e50028]'
                          : 'bg-[#0066cc]'
                      }`}
                    />
                  </div>
                  <span className="font-extrabold text-slate-900 w-8 text-right shrink-0">
                    {item.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3: Analyse par catégorie de produits */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Analyse par catégorie de produits
              </h3>
              <button
                onClick={() => onSelectTab('produits')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Voir plus</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 mt-2">
              {[
                { name: 'Électronique & smartphones', pct: '24%', width: '100%', amount: '10,8 Mds' },
                { name: 'Vêtements & mode', pct: '18%', width: '75%', amount: '8,1 Mds' },
                { name: 'Produits maison & déco', pct: '12%', width: '50%', amount: '5,4 Mds' },
                { name: 'Machines & équipements', pct: '10%', width: '42%', amount: '4,5 Mds' },
                { name: 'Beauté & cosmétiques', pct: '8%', width: '33%', amount: '3,6 Mds' },
                { name: 'Produits automobiles', pct: '7%', width: '29%', amount: '3,1 Mds' },
                { name: 'Produits alimentaires', pct: '6%', width: '25%', amount: '2,7 Mds' },
                { name: 'Autres', pct: '15%', width: '63%', amount: '6,8 Mds' },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center justify-between gap-3 text-xs hover:bg-slate-50 p-0.5 rounded transition-colors">
                  <span className="font-semibold text-slate-700 w-44 shrink-0 truncate">
                    {cat.name}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      style={{ width: cat.width }}
                      className="bg-[#0066cc] h-full rounded-full transition-all duration-300"
                    />
                  </div>
                  <span className="font-extrabold text-slate-900 w-8 text-right shrink-0">
                    {cat.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. ROW 3: MARCHÉS E-COMMERCE / OPPORTUNITÉS / INSIGHTS IA QIAO             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Analyse des marchés e-commerce (Dynamic Toggled Data) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-3">
              Analyse des marchés e-commerce
            </h3>

            {/* 3 Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
              <button
                onClick={() => setEcommerceRegion('chine')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                  ecommerceRegion === 'chine' ? 'bg-[#0066cc] text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chine
              </button>
              <button
                onClick={() => setEcommerceRegion('na')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                  ecommerceRegion === 'na' ? 'bg-[#0066cc] text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Afrique du Nord
              </button>
              <button
                onClick={() => setEcommerceRegion('comp')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                  ecommerceRegion === 'comp' ? 'bg-[#0066cc] text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Comparaison
              </button>
            </div>

            {/* 4 Dynamic Stat Boxes Side by Side */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {ecommerceRegion === 'chine' ? (
                <>
                  {/* Box 1 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900">3,1 Mds</div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Utilisateurs e-commerce
                      </div>
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-600 mt-2">+12%</div>
                  </div>

                  {/* Box 2 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900">78%</div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Achats via mobile
                      </div>
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-600 mt-2">+8%</div>
                  </div>

                  {/* Box 3 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <Coins className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight">1 800 <span className="text-[10px]">USD</span></div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Panier moyen annuel
                      </div>
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-600 mt-2">+15%</div>
                  </div>

                  {/* Box 4 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-emerald-600">+22%</div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Croissance marché
                      </div>
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 mt-2">vs 2023</div>
                  </div>
                </>
              ) : ecommerceRegion === 'na' ? (
                <>
                  {/* NA Box 1 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900">78 M</div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Acheteurs en ligne
                      </div>
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-600 mt-2">+19%</div>
                  </div>

                  {/* NA Box 2 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900">84%</div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Commandes mobile
                      </div>
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-600 mt-2">+14%</div>
                  </div>

                  {/* NA Box 3 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <Coins className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight">320 <span className="text-[10px]">USD</span></div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Dépense moyenne
                      </div>
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-600 mt-2">+18%</div>
                  </div>

                  {/* NA Box 4 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-emerald-600">+26%</div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Accélération
                      </div>
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 mt-2">vs 2023</div>
                  </div>
                </>
              ) : (
                <>
                  {/* Comp Box 1 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900">82% vs 41%</div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Pénétration e-com
                      </div>
                    </div>
                    <div className="text-[10px] font-extrabold text-blue-600 mt-2">Écart +41 pts</div>
                  </div>

                  {/* Comp Box 2 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900">78% vs 84%</div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Usage smartphone
                      </div>
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-600 mt-2">Maghreb +6%</div>
                  </div>

                  {/* Comp Box 3 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900">94% vs 36%</div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Paiement digital
                      </div>
                    </div>
                    <div className="text-[10px] font-extrabold text-blue-600 mt-2">Potentiel fort</div>
                  </div>

                  {/* Comp Box 4 */}
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-[#0066cc] flex items-center justify-center mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-emerald-600">22% vs 26%</div>
                      <div className="text-[9px] font-semibold text-slate-500 leading-tight mt-0.5">
                        Croissance annuelle
                      </div>
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 mt-2">Rattrapage</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Col 2: Opportunités à fort potentiel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Opportunités à fort potentiel
              </h3>
              <button
                onClick={() => onSelectTab('opportunites')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Voir plus</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { title: 'Énergies renouvelables', subtitle: 'Demande croissante en Afrique du Nord', icon: <Sun className="w-4 h-4 text-white" /> },
                { title: 'Produits de santé & bien-être', subtitle: 'Marché en forte expansion', icon: <Activity className="w-4 h-4 text-white" /> },
                { title: 'Équipements industriels', subtitle: 'Modernisation des infrastructures', icon: <Settings className="w-4 h-4 text-white" /> },
                { title: 'Produits agroalimentaires', subtitle: 'Potentiel d’importation élevé', icon: <Apple className="w-4 h-4 text-white" /> },
                { title: 'E-commerce cross-border', subtitle: 'Accès à de nouveaux consommateurs', icon: <Truck className="w-4 h-4 text-white" /> },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => onSelectTab('opportunites')}>
                  <div className="w-8 h-8 rounded-xl bg-[#0c2448] group-hover:bg-[#0066cc] flex items-center justify-center shrink-0 shadow-2xs transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{item.title}</h4>
                    <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3: Insights IA QIAO */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Insights IA QIAO
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0066cc] font-bold text-[10px] border border-blue-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#0066cc]" />
                Nouveau
              </span>
            </div>

            <div className="space-y-3">
              {/* Insight 1 */}
              <div className="flex items-start gap-3 p-1">
                <div className="w-8 h-8 rounded-full border border-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-[#0c2448]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Croissance soutenue</h4>
                  <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                    Le commerce Chine – Afrique du Nord devrait croître de <span className="font-semibold text-blue-700">6 à 8%</span> par an jusqu’en 2030.
                  </p>
                </div>
              </div>

              {/* Insight 2 */}
              <div className="flex items-start gap-3 p-1">
                <div className="w-8 h-8 rounded-full border border-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-[#0c2448]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Segmentation des marchés</h4>
                  <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                    L’Algérie et le Maroc offrent le plus grand potentiel pour les produits électroniques et les équipements.
                  </p>
                </div>
              </div>

              {/* Insight 3 */}
              <div className="flex items-start gap-3 p-1">
                <div className="w-8 h-8 rounded-full border border-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Target className="w-4 h-4 text-[#0c2448]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Recommandation</h4>
                  <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                    Les entreprises devraient se concentrer sur l’e-commerce et les partenariats locaux pour accélérer leur développement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. ROW 4: SCÉNARIOS ET PRÉVISIONS / ANALYSES RÉCENTES / INSIGHTS & EMAIL   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Scénarios et prévisions (2025 - 2030) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-2">
              Scénarios et prévisions (2025 - 2030)
            </h3>

            {/* Legend row */}
            <div className="flex items-center gap-3 text-[10px] text-slate-600 font-medium mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Scénario optimiste</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0066cc]" />
                <span>Scénario de base</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>Scénario prudent</span>
              </div>
            </div>

            <span className="text-[10px] text-slate-400 font-medium">Mds USD</span>

            {/* Chart + Badges Layout */}
            <div className="grid grid-cols-12 gap-2 mt-1 items-center">
              
              {/* Line Chart */}
              <div className="col-span-7 relative h-[140px]">
                <svg viewBox="0 0 160 120" className="w-full h-full overflow-visible">
                  {/* Grid lines */}
                  <line x1="20" y1="15" x2="160" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="20" y1="45" x2="160" y2="45" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="20" y1="75" x2="160" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="20" y1="105" x2="160" y2="105" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Y Axis Labels */}
                  <text x="0" y="18" fontSize="7" fill="#94a3b8" fontWeight="600">400</text>
                  <text x="0" y="48" fontSize="7" fill="#94a3b8" fontWeight="600">250</text>
                  <text x="0" y="78" fontSize="7" fill="#94a3b8" fontWeight="600">200</text>
                  <text x="0" y="108" fontSize="7" fill="#94a3b8" fontWeight="600">150</text>

                  {/* X Axis Labels */}
                  <text x="25" y="118" fontSize="6.5" fill="#64748b" fontWeight="600">2025</text>
                  <text x="50" y="118" fontSize="6.5" fill="#64748b" fontWeight="600">2026</text>
                  <text x="75" y="118" fontSize="6.5" fill="#64748b" fontWeight="600">2027</text>
                  <text x="100" y="118" fontSize="6.5" fill="#64748b" fontWeight="600">2028</text>
                  <text x="125" y="118" fontSize="6.5" fill="#64748b" fontWeight="600">2029</text>
                  <text x="150" y="118" fontSize="6.5" fill="#64748b" fontWeight="600">2030</text>

                  {/* Green Curve (Optimiste) */}
                  <path
                    d="M 25,85 L 50,75 L 75,68 L 100,58 L 125,48 L 150,30"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  {[
                    { x: 25, y: 85, year: 2025 },
                    { x: 75, y: 68, year: 2027 },
                    { x: 150, y: 30, year: 2030 },
                  ].map((pt) => (
                    <circle
                      key={pt.year}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredForecastYear === pt.year ? 4 : 2.5}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredForecastYear(pt.year)}
                      onMouseLeave={() => setHoveredForecastYear(null)}
                    />
                  ))}

                  {/* Blue Curve (Base) */}
                  <path
                    d="M 25,92 L 50,86 L 75,78 L 100,72 L 125,65 L 150,55"
                    fill="none"
                    stroke="#0066cc"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  {[
                    { x: 25, y: 92, year: 2025 },
                    { x: 75, y: 78, year: 2027 },
                    { x: 150, y: 55, year: 2030 },
                  ].map((pt) => (
                    <circle
                      key={pt.year}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredForecastYear === pt.year ? 4 : 2.5}
                      fill="#0066cc"
                      stroke="#ffffff"
                      strokeWidth="1"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredForecastYear(pt.year)}
                      onMouseLeave={() => setHoveredForecastYear(null)}
                    />
                  ))}

                  {/* Red Curve (Prudent) */}
                  <path
                    d="M 25,100 L 50,96 L 75,92 L 100,88 L 125,84 L 150,78"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  {[
                    { x: 25, y: 100, year: 2025 },
                    { x: 75, y: 92, year: 2027 },
                    { x: 150, y: 78, year: 2030 },
                  ].map((pt) => (
                    <circle
                      key={pt.year}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredForecastYear === pt.year ? 4 : 2.5}
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="1"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredForecastYear(pt.year)}
                      onMouseLeave={() => setHoveredForecastYear(null)}
                    />
                  ))}
                </svg>
              </div>

              {/* Right Side Badges */}
              <div className="col-span-5 space-y-2">
                <div className="p-2 rounded-xl bg-emerald-50/90 border border-emerald-100 text-center">
                  <div className="text-xs font-black text-emerald-700">320 Mds USD</div>
                  <div className="text-[9px] font-semibold text-emerald-800 leading-tight">Scénario optimiste</div>
                </div>

                <div className="p-2 rounded-xl bg-blue-50/90 border border-blue-100 text-center">
                  <div className="text-xs font-black text-blue-700">260 Mds USD</div>
                  <div className="text-[9px] font-semibold text-blue-800 leading-tight">Scénario de base</div>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/90 border border-rose-100 text-center">
                  <div className="text-xs font-black text-rose-700">190 Mds USD</div>
                  <div className="text-[9px] font-semibold text-rose-800 leading-tight">Scénario prudent</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Col 2: Analyses récentes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Analyses récentes
              </h3>
              <button
                onClick={() => onSelectTab('rapports')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Voir toutes les analyses</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {articlesList.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticleModal(art)}
                  className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-14 h-12 rounded-lg object-cover shrink-0 shadow-2xs border border-slate-200/70"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {art.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {art.date}
                      </span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                        {art.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3: Two Stacked Cards (Télécharger nos insights + Restez informé) */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Card 1: Télécharger nos insights */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066cc] flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-900">Téléchargez nos insights</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Accédez à nos analyses exclusives et recevez les dernières tendances.
                </p>
                <button
                  onClick={() => handleDownloadReport('Perspectives & Analyses Stratégiques QIAO 2024')}
                  className="mt-3 w-full py-1.5 px-3 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 text-xs font-semibold text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger l'analyse complète (PDF)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Restez informé */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066cc] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-900">Restez informé</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Recevez nos nouvelles analyses par email.
                </p>

                {newsletterSubscribed ? (
                  <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center justify-between">
                    <span>✓ Merci pour votre inscription !</span>
                    <button
                      onClick={() => setNewsletterSubscribed(false)}
                      className="text-[10px] text-emerald-800 underline font-normal cursor-pointer"
                    >
                      Nouveau
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newsletterEmail) setNewsletterSubscribed(true);
                    }}
                    className="mt-3 flex items-center gap-1.5"
                  >
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Votre adresse email"
                      className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-[#0066cc] hover:bg-[#0055b3] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-2xs"
                    >
                      S'abonner
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: DETAILED ARTICLE READER                                         */}
      {/* ========================================================================= */}
      {selectedArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {selectedArticleModal.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {selectedArticleModal.date}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedArticleModal.readTime}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {selectedArticleModal.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedArticleModal(null)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-700 leading-relaxed">
              <div className="relative rounded-xl overflow-hidden max-h-[240px] shadow-xs">
                <img
                  src={selectedArticleModal.image}
                  alt={selectedArticleModal.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Summary box */}
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-100 text-slate-800 font-medium">
                {selectedArticleModal.summary}
              </div>

              {/* Key points */}
              <div>
                <h3 className="font-black text-slate-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  Points clés & enseignements stratégiques
                </h3>
                <ul className="space-y-1.5">
                  {selectedArticleModal.keyPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Content paragraphs */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {selectedArticleModal.content.map((p, idx) => (
                  <p key={idx} className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                Source : QIAO Intelligence Data Desk & Développements Économiques
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadReport(selectedArticleModal.title)}
                  className="bg-[#e50028] hover:bg-[#c90022] text-white px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger l'analyse (PDF)</span>
                </button>
                <button
                  onClick={() => setSelectedArticleModal(null)}
                  className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
