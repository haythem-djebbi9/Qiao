import React, { useState } from 'react';
import {
  ShoppingCart,
  TrendingUp,
  Globe,
  Package,
  Users,
  ShoppingBag,
  ChevronDown,
  ArrowRight,
  Search,
  ExternalLink,
  Smartphone,
  Truck,
  CreditCard,
  Building2,
  Handshake,
  BarChart3,
  Flame,
  CheckCircle2,
  FileText,
  Eye,
  Filter,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { CommerceHubTab } from '../../../types';
import { FlagIcon } from '../../common/FlagIcon';

// Image assets for article thumbnails
import reportCoverImg from '../../../assets/images/china_ecommerce_report_1790808742649.jpg';
import electronicsImg from '../../../assets/images/hightech_electronics_1790888270277.jpg';
import corridorNightImg from '../../../assets/images/china_corridor_night_skyline_1790804583067.jpg';
import containerPortImg from '../../../assets/images/container_port_cargo_1790805153002.jpg';

interface MarchesEcommerceTabProps {
  onSelectTab: (tab: CommerceHubTab) => void;
  onOpenReport?: (title: string) => void;
  onOpenSignUp?: () => void;
}

export const MarchesEcommerceTab: React.FC<MarchesEcommerceTabProps> = ({
  onSelectTab,
  onOpenReport,
  onOpenSignUp,
}) => {
  const [direction, setDirection] = useState('Chine → Afrique du Nord');
  const [country, setCountry] = useState('Tous les pays');
  const [marketType, setMarketType] = useState('B2C & B2B');
  const [category, setCategory] = useState('Toutes les catégories');
  const [platform, setPlatform] = useState('Toutes les plateformes');
  const [evolutionTab, setEvolutionTab] = useState<'chine' | 'na' | 'comparaison'>('comparaison');
  const [selectedPlatformModal, setSelectedPlatformModal] = useState<any | null>(null);

  // Quick country pills list with authentic FlagIcon
  const countryFilters = [
    { id: 'Tous les pays', label: 'Tous les pays', code: null },
    { id: 'Maroc', label: 'Maroc', code: 'MA' },
    { id: 'Algérie', label: 'Algérie', code: 'DZ' },
    { id: 'Tunisie', label: 'Tunisie', code: 'TN' },
    { id: 'Égypte', label: 'Égypte', code: 'EG' },
    { id: 'Libye', label: 'Libye', code: 'LY' },
  ];

  // Chinese Platforms (Authentic Logos & Real FlagIcon)
  const chinesePlatforms = [
    {
      id: 'alibaba',
      name: 'Alibaba',
      subtitle: 'B2B Marketplace',
      countryCode: 'CN',
      countryName: 'Chine',
      activeUsers: '1.3 Md',
      color: '#ff6a00',
      description: "Plus grand écosystème de commerce de gros au monde, connectant fournisseurs chinois et acheteurs nord-africains.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <svg viewBox="0 0 40 32" className="w-5 h-4 shrink-0" fill="none">
            <path
              d="M 20 4 C 11.2 4 4 11.2 4 20 C 4 24.5 5.8 28.5 8.8 31.4 C 11.8 28.5 15.6 26.5 20 26.5 C 24.4 26.5 28.2 28.5 31.2 31.4 C 34.2 28.5 36 24.5 36 20 C 36 11.2 28.8 4 20 4 Z"
              fill="#ff6a00"
            />
            <path
              d="M 12 18 Q 20 25 28 18"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span className="text-xs font-black text-[#ff6a00] font-sans tracking-tight">Alibaba</span>
        </div>
      ),
    },
    {
      id: 'jd',
      name: 'JD.COM',
      subtitle: 'B2C Marketplace',
      countryCode: 'CN',
      countryName: 'Chine',
      activeUsers: '580 M',
      color: '#e1251b',
      description: "Leader de la distribution directe et de la chaîne logistique intelligente en Chine.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[9px] font-black text-[#e1251b]">
            JD
          </div>
          <span className="text-xs font-black text-[#e1251b] font-sans tracking-tight">JD.COM</span>
        </div>
      ),
    },
    {
      id: 'pinduoduo',
      name: 'Pinduoduo',
      subtitle: 'Social Commerce',
      countryCode: 'CN',
      countryName: 'Chine',
      activeUsers: '890 M',
      color: '#e02e24',
      description: "Pionnier mondial des achats groupés interactifs et du modèle C2M (Consumer-to-Manufacturer).",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <div className="w-4 h-4 rounded-md bg-[#e02e24] flex items-center justify-center text-white text-[9px] font-bold">
            拼
          </div>
          <span className="text-xs font-bold text-[#e02e24] font-sans tracking-tight">Pinduoduo</span>
        </div>
      ),
    },
    {
      id: 'douyin',
      name: 'Douyin',
      subtitle: 'Live Commerce',
      countryCode: 'CN',
      countryName: 'Chine',
      activeUsers: '750 M',
      color: '#161823',
      description: "Plateforme pionnière du commerce vidéo en direct générant plus de 300 Mds USD de GMV annuel.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <div className="w-4 h-4 rounded bg-[#161823] flex items-center justify-center text-white text-[8px] font-black">
            d
          </div>
          <span className="text-xs font-black text-[#161823] font-sans tracking-tight">Douyin</span>
        </div>
      ),
    },
    {
      id: 'tmall',
      name: 'Tmall',
      subtitle: 'B2C Premium',
      countryCode: 'CN',
      countryName: 'Chine',
      activeUsers: '480 M',
      color: '#ff0036',
      description: "Portail privilégié des marques internationales et premium pour pénétrer le marché des consommateurs chinois.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <div className="w-4 h-4 rounded bg-[#ff0036] text-white flex items-center justify-center text-[9px] font-black">
            T
          </div>
          <span className="text-xs font-black text-[#ff0036] font-sans tracking-tight">Tmall</span>
        </div>
      ),
    },
    {
      id: 'temu',
      name: 'TEMU',
      subtitle: 'Cross-border',
      countryCode: 'CN',
      countryName: 'Chine',
      activeUsers: '450 M',
      color: '#fb7701',
      description: "Expansion fulgurante en e-commerce transfrontalier avec expéditions directes d'usines.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <div className="px-1.5 py-0.5 rounded bg-[#fb7701] text-white text-[9px] font-black tracking-wider">
            TEMU
          </div>
        </div>
      ),
    },
  ];

  // North African Platforms (Authentic Logos & Real FlagIcon)
  const naPlatforms = [
    {
      id: 'jumia',
      name: 'Jumia',
      subtitle: 'Pan-Afrique',
      countryCode: 'MA',
      secondaryCodes: ['EG', 'DZ', 'TN'],
      countryName: 'Pan-Afrique (MA, EG, DZ, TN)',
      color: '#f68b1e',
      description: "Leader de l'e-commerce en Afrique avec présence forte au Maroc, Égypte, Algérie et Tunisie.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <span className="text-xs font-black text-slate-900 tracking-tight font-sans">JUMIA</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#f68b1e] flex items-center justify-center text-[7px] text-white">★</span>
        </div>
      ),
    },
    {
      id: 'avito',
      name: 'Avito',
      subtitle: 'Maroc',
      countryCode: 'MA',
      countryName: 'Maroc',
      color: '#00a0e3',
      description: "Première plateforme de petites annonces et marketplace au Maroc avec plus de 6M de visiteurs mensuels.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <span className="text-xs font-black text-[#00a0e3] font-sans tracking-tight">Avito</span>
          <div className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-[#97c93e]" />
            <span className="w-1 h-1 rounded-full bg-[#ff6600]" />
          </div>
        </div>
      ),
    },
    {
      id: 'mytek',
      name: 'Mytek',
      subtitle: 'Tunisie',
      countryCode: 'TN',
      countryName: 'Tunisie',
      color: '#e30613',
      description: "Premier site e-commerce high-tech et électroménager en Tunisie avec réseau de distribution physique et digital.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <span className="text-xs font-black text-[#e30613] font-sans tracking-wider">mytek</span>
        </div>
      ),
    },
    {
      id: 'karamti',
      name: 'Karamti',
      subtitle: 'Maroc',
      countryCode: 'MA',
      countryName: 'Maroc',
      color: '#d6001c',
      description: "Marketplace marocaine en forte expansion sur la mode, la beauté et les produits du quotidien.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <span className="text-xs font-extrabold text-[#d6001c] font-sans">Karamti</span>
        </div>
      ),
    },
    {
      id: 'ouedkniss',
      name: 'Ouedkniss',
      subtitle: 'Algérie',
      countryCode: 'DZ',
      countryName: 'Algérie',
      color: '#f58220',
      description: "Portail numéro 1 en Algérie pour l'e-commerce, l'automobile, l'immobilier et les produits électroniques.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <span className="text-xs font-black text-[#f58220] font-sans">Ouedkniss</span>
        </div>
      ),
    },
    {
      id: 'opensooq',
      name: 'OpenSooq',
      subtitle: 'Libye & MENA',
      countryCode: 'LY',
      secondaryCodes: ['EG'],
      countryName: 'Libye & Région MENA',
      color: '#1b75bb',
      description: "Marketplace dominante en Libye et au Proche-Orient pour les échanges B2C et C2C.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <span className="text-xs font-black text-[#1b75bb] font-sans">OpenSooq</span>
        </div>
      ),
    },
    {
      id: 'noon',
      name: 'Noon',
      subtitle: 'Égypte',
      countryCode: 'EG',
      countryName: 'Égypte & MENA',
      color: '#feee00',
      description: "Géant régional du e-commerce avec centres de tri automatisés au Caire et à Alexandrie.",
      logo: (
        <div className="flex items-center gap-1 select-none bg-slate-900 px-1.5 py-0.5 rounded">
          <span className="text-xs font-black text-[#feee00] font-sans">noon</span>
        </div>
      ),
    },
    {
      id: 'dabchy',
      name: 'Dabchy',
      subtitle: 'Tunisie',
      countryCode: 'TN',
      countryName: 'Tunisie & Maghreb',
      color: '#ff4081',
      description: "Plateforme leader de la mode seconde main et du prêt-à-porter en Tunisie et Algérie.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <span className="text-xs font-black text-[#ff4081] font-sans">dabchy</span>
        </div>
      ),
    },
    {
      id: 'bosta',
      name: 'Bosta E-com',
      subtitle: 'Égypte',
      countryCode: 'EG',
      countryName: 'Égypte',
      color: '#e84545',
      description: "Infrastructure logistique et de livraison dernier kilomètre pour les e-commerçants égyptiens.",
      logo: (
        <div className="flex items-center gap-1 select-none">
          <span className="text-xs font-black text-[#e84545] font-sans">bosta</span>
        </div>
      ),
    },
  ];

  // Best selling products table with authentic FlagIcon for corridor & top markets
  const bestSellingProducts = [
    {
      rank: '1',
      category: 'Électronique & smartphones',
      from: 'CN',
      targets: ['EG', 'MA', 'DZ', 'TN'],
      share: '24%',
      growth: '+28%',
      volume: '6,8 Mds USD'
    },
    {
      rank: '2',
      category: 'Vêtements & mode',
      from: 'CN',
      targets: ['MA', 'TN', 'EG', 'DZ'],
      share: '18%',
      growth: '+22%',
      volume: '5,1 Mds USD'
    },
    {
      rank: '3',
      category: 'Électroménager',
      from: 'CN',
      targets: ['DZ', 'EG', 'MA', 'LY'],
      share: '12%',
      growth: '+20%',
      volume: '3,4 Mds USD'
    },
    {
      rank: '4',
      category: 'Produits maison & déco',
      from: 'CN',
      targets: ['EG', 'MA', 'TN', 'LY'],
      share: '10%',
      growth: '+18%',
      volume: '2,8 Mds USD'
    },
    {
      rank: '5',
      category: 'Beauté & cosmétiques',
      from: 'CN',
      targets: ['MA', 'TN', 'EG', 'DZ'],
      share: '8%',
      growth: '+26%',
      volume: '2,3 Mds USD'
    },
  ];

  // Category sales breakdown
  const categorySalesDonut = [
    { name: 'Électronique', pct: 24, color: '#0c4a9e' },
    { name: 'Mode & habillement', pct: 18, color: '#f97316' },
    { name: 'Maison & déco', pct: 12, color: '#ef4444' },
    { name: 'Beauté & cosmétiques', pct: 10, color: '#a855f7' },
    { name: 'Équipements industriels', pct: 8, color: '#0284c7' },
    { name: 'Produits automobiles', pct: 6, color: '#78716c' },
    { name: 'Jouets & loisirs', pct: 5, color: '#eab308' },
    { name: 'Autres', pct: 17, color: '#cbd5e1' },
  ];

  // Payment methods
  const paymentMethods = [
    { name: 'Paiement à la livraison (COD)', pct: 42, width: '100%' },
    { name: 'Cartes bancaires', pct: 24, width: '57%' },
    { name: 'Portefeuilles mobiles', pct: 14, width: '33%' },
    { name: 'Virements bancaires', pct: 8, width: '19%' },
    { name: 'Paiements internationaux', pct: 7, width: '17%' },
    { name: 'Autres', pct: 5, width: '12%' },
  ];

  // Zoom by country with authentic FlagIcon
  const countryBreakdown = [
    {
      code: 'TN',
      name: 'Tunisie',
      vol: '2,1 Mds USD',
      growth: '+20%',
      penetration: '54%',
      leadingPlatform: 'Mytek & Jumia',
      codShare: '38%'
    },
    {
      code: 'DZ',
      name: 'Algérie',
      vol: '4,3 Mds USD',
      growth: '+18%',
      penetration: '49%',
      leadingPlatform: 'Ouedkniss & Yassir',
      codShare: '65%'
    },
    {
      code: 'MA',
      name: 'Maroc',
      vol: '6,8 Mds USD',
      growth: '+22%',
      penetration: '62%',
      leadingPlatform: 'Avito & Jumia',
      codShare: '42%'
    },
    {
      code: 'EG',
      name: 'Égypte',
      vol: '12,4 Mds USD',
      growth: '+19%',
      penetration: '58%',
      leadingPlatform: 'Noon & Amazon EG',
      codShare: '48%'
    },
    {
      code: 'LY',
      name: 'Libye',
      vol: '2,8 Mds USD',
      growth: '+16%',
      penetration: '44%',
      leadingPlatform: 'OpenSooq & Boutiques',
      codShare: '72%'
    },
  ];

  // Key trends
  const keyTrends = [
    { title: 'Croissance du cross-border e-commerce', icon: <Globe className="w-4 h-4 text-blue-600" /> },
    { title: 'Expansion du live commerce', icon: <Smartphone className="w-4 h-4 text-blue-600" /> },
    { title: 'Augmentation de la demande pour les marques chinoises', icon: <Package className="w-4 h-4 text-blue-600" /> },
    { title: 'Développement des entrepôts et de la logistique régionale', icon: <Building2 className="w-4 h-4 text-blue-600" /> },
    { title: 'Plus de solutions de paiement locales', icon: <CreditCard className="w-4 h-4 text-blue-600" /> },
    { title: 'Opportunités pour les marques nord-africaines en Chine', icon: <Handshake className="w-4 h-4 text-blue-600" /> },
  ];

  // Latest analysis articles with authentic FlagIcon tags
  const latestArticles = [
    {
      title: "E-commerce chinois : quelles opportunités pour l'Afrique du Nord ?",
      date: '5 Août 2024',
      image: reportCoverImg,
      countryTags: ['CN', 'MA', 'EG'],
      tagLabel: 'Cross-border'
    },
    {
      title: 'Les nouvelles tendances du live commerce en Chine',
      date: '28 Juillet 2024',
      image: corridorNightImg,
      countryTags: ['CN'],
      tagLabel: 'Innovation'
    },
    {
      title: 'Le comportement des consommateurs en Afrique du Nord en 2024',
      date: '20 Juillet 2024',
      image: electronicsImg,
      countryTags: ['TN', 'DZ', 'MA'],
      tagLabel: 'Consommation'
    },
    {
      title: 'Cross-border : comment réussir son entrée sur les plateformes chinoises ?',
      date: '12 Juillet 2024',
      image: containerPortImg,
      countryTags: ['CN', 'LY', 'EG'],
      tagLabel: 'Réglementation'
    },
  ];

  // Filtered platforms
  const filteredNaPlatforms = country === 'Tous les pays'
    ? naPlatforms
    : naPlatforms.filter((p) => p.countryName.toLowerCase().includes(country.toLowerCase()) || p.subtitle.toLowerCase().includes(country.toLowerCase()));

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. FILTER BAR WITH AUTHENTIC VECTOR FLAGS                                 */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        
        {/* Quick Country Pills with Real FlagIcon */}
        <div className="mb-4 pb-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-blue-600" />
              Filtrer par pays :
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {countryFilters.map((f) => {
              const isSelected = country === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setCountry(f.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                  }`}
                >
                  {f.code && <FlagIcon country={f.code} size="xs" />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6 Grid Select Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          
          {/* Direction */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Direction du marché
            </label>
            <div className="relative">
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Chine → Afrique du Nord</option>
                <option>Afrique du Nord → Chine</option>
                <option>Échanges bilatéraux</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Pays */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
              <span>Pays cible</span>
              {country !== 'Tous les pays' && (
                <span className="inline-flex items-center gap-1">
                  <FlagIcon country={country} size="xs" />
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
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

          {/* Type de marché */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Type de marché
            </label>
            <div className="relative">
              <select
                value={marketType}
                onChange={(e) => setMarketType(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>B2C & B2B</option>
                <option>B2C Direct</option>
                <option>B2B Cross-border</option>
                <option>Social Commerce</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Catégorie de produits */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Catégorie de produits
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Toutes les catégories</option>
                <option>Électronique & High-Tech</option>
                <option>Mode & Vêtements</option>
                <option>Maison & Déco</option>
                <option>Beauté & Cosmétiques</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Plateforme */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Plateforme
            </label>
            <div className="relative">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Toutes les plateformes</option>
                <option>Alibaba / Taobao (Chine)</option>
                <option>JD.COM (Chine)</option>
                <option>Jumia (Afrique)</option>
                <option>Avito (Maroc)</option>
                <option>Mytek (Tunisie)</option>
                <option>Ouedkniss (Algérie)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Appliquer Button (Navy) */}
          <button
            onClick={() => {}}
            className="w-full bg-[#0c2448] hover:bg-[#081a36] text-white py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Appliquer</span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FIVE METRIC CARDS WITH AUTHENTIC VECTOR FLAG BADGES                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Metric 1 - Chine */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-bold border border-red-100">
              <FlagIcon country="CN" size="xs" />
              <span>Chine</span>
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">450 Mds</span>
              <span className="text-[11px] font-bold text-blue-600 uppercase">USD</span>
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
              Taille du marché e-commerce en Chine (2024)
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>+12%</span>
            <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
          </div>
        </div>

        {/* Metric 2 - Afrique du Nord */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex items-center -space-x-1">
              <FlagIcon country="MA" size="xs" />
              <FlagIcon country="DZ" size="xs" />
              <FlagIcon country="TN" size="xs" />
              <FlagIcon country="EG" size="xs" />
              <FlagIcon country="LY" size="xs" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">28,4 Mds</span>
              <span className="text-[11px] font-bold text-blue-600 uppercase">USD</span>
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
              Marché e-commerce en Afrique du Nord (2024)
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>+18%</span>
            <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
          </div>
        </div>

        {/* Metric 3 - Export Chine Cross-border */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-200">
              <FlagIcon country="CN" size="xs" />
              <span>Cross-border</span>
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">320 Mds</span>
              <span className="text-[11px] font-bold text-blue-600 uppercase">USD</span>
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
              Exportations e-commerce chinoises (global)
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>+14%</span>
            <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
          </div>
        </div>

        {/* Metric 4 - Consommateurs Chine */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-bold">
              <FlagIcon country="CN" size="xs" />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              500+ M
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
              Consommateurs en ligne en Chine
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>+9%</span>
            <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
          </div>
        </div>

        {/* Metric 5 - Consommateurs Afrique du Nord */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="flex items-center -space-x-1">
              <FlagIcon country="MA" size="xs" />
              <FlagIcon country="DZ" size="xs" />
              <FlagIcon country="TN" size="xs" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              78 M
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
              Consommateurs en Afrique du Nord
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <span>+20%</span>
            <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. ROW 1: ÉVOLUTION DU MARCHÉ / PLATEFORMES CHINE / PLATEFORMES AFRIQUE   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Évolution du marché e-commerce */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Évolution du marché e-commerce</span>
              </h3>
            </div>

            {/* Toggle buttons: Chine / Afrique du Nord / Comparaison with FlagIcon */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold mb-3">
              <button
                onClick={() => setEvolutionTab('chine')}
                className={`flex-1 py-1 px-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                  evolutionTab === 'chine' ? 'bg-[#0c4a9e] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FlagIcon country="CN" size="xs" />
                <span>Chine</span>
              </button>
              <button
                onClick={() => setEvolutionTab('na')}
                className={`flex-1 py-1 px-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                  evolutionTab === 'na' ? 'bg-[#0c4a9e] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center -space-x-1">
                  <FlagIcon country="MA" size="xs" />
                  <FlagIcon country="TN" size="xs" />
                </div>
                <span>Afrique du Nord</span>
              </button>
              <button
                onClick={() => setEvolutionTab('comparaison')}
                className={`flex-1 py-1 px-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center gap-1 ${
                  evolutionTab === 'comparaison' ? 'bg-[#0c4a9e] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Comparaison</span>
              </button>
            </div>

            {/* SVG Trend Line Chart */}
            <div className="relative w-full h-[180px] bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 360 140" className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1="30" y1="20" x2="350" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="55" x2="350" y2="55" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="90" x2="350" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="120" x2="350" y2="120" stroke="#e2e8f0" strokeWidth="1" />

                {/* Y-axis labels */}
                <text x="25" y="10" textAnchor="end" fontSize="8" fill="#94a3b8">Mds USD</text>
                <text x="25" y="23" textAnchor="end" fontSize="8" fill="#94a3b8">190</text>
                <text x="25" y="58" textAnchor="end" fontSize="8" fill="#94a3b8">290</text>
                <text x="25" y="93" textAnchor="end" fontSize="8" fill="#94a3b8">100</text>
                <text x="25" y="123" textAnchor="end" fontSize="8" fill="#94a3b8">0</text>

                {/* X-axis labels */}
                <text x="50" y="134" textAnchor="middle" fontSize="8" fill="#64748b">2020</text>
                <text x="110" y="134" textAnchor="middle" fontSize="8" fill="#64748b">2021</text>
                <text x="170" y="134" textAnchor="middle" fontSize="8" fill="#64748b">2022</text>
                <text x="230" y="134" textAnchor="middle" fontSize="8" fill="#64748b">2023</text>
                <text x="290" y="134" textAnchor="middle" fontSize="8" fill="#64748b">2024</text>

                {/* Red Line: Chine */}
                {(evolutionTab === 'chine' || evolutionTab === 'comparaison') && (
                  <>
                    <path
                      d="M 50,85 L 110,75 L 170,62 L 230,48 L 290,30"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="50" cy="85" r="3.5" fill="#ef4444" />
                    <circle cx="110" cy="75" r="3.5" fill="#ef4444" />
                    <circle cx="170" cy="62" r="3.5" fill="#ef4444" />
                    <circle cx="230" cy="48" r="3.5" fill="#ef4444" />
                    <circle cx="290" cy="30" r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                  </>
                )}

                {/* Blue Line: Afrique du Nord */}
                {(evolutionTab === 'na' || evolutionTab === 'comparaison') && (
                  <>
                    <path
                      d="M 50,115 L 110,110 L 170,105 L 230,98 L 290,92"
                      fill="none"
                      stroke="#0c4a9e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="50" cy="115" r="3" fill="#0c4a9e" />
                    <circle cx="110" cy="110" r="3" fill="#0c4a9e" />
                    <circle cx="170" cy="105" r="3" fill="#0c4a9e" />
                    <circle cx="230" cy="98" r="3" fill="#0c4a9e" />
                    <circle cx="290" cy="92" r="4" fill="#0c4a9e" stroke="#ffffff" strokeWidth="1.5" />
                  </>
                )}
              </svg>

              {/* End Badges Floating on Right with authentic FlagIcon */}
              <div className="absolute right-2 top-2 space-y-1.5 pointer-events-none">
                <div className="bg-red-50/95 border border-red-200/90 px-2 py-0.5 rounded-lg text-right shadow-2xs flex items-center justify-between gap-1.5">
                  <FlagIcon country="CN" size="xs" />
                  <div>
                    <div className="text-[8.5px] font-bold text-red-500 uppercase">Chine</div>
                    <div className="text-[11px] font-black text-red-700 leading-none">2 400 Mds $</div>
                  </div>
                </div>
                <div className="bg-blue-50/95 border border-blue-200/90 px-2 py-0.5 rounded-lg text-right shadow-2xs flex items-center justify-between gap-1.5">
                  <div className="flex items-center -space-x-1">
                    <FlagIcon country="MA" size="xs" />
                    <FlagIcon country="DZ" size="xs" />
                  </div>
                  <div>
                    <div className="text-[8.5px] font-bold text-blue-500 uppercase">Afrique du Nord</div>
                    <div className="text-[11px] font-black text-[#0c4a9e] leading-none">28,4 Mds $</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom legend with FlagIcon */}
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 pt-3 border-t border-slate-100 mt-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <FlagIcon country="CN" size="xs" />
                <span className="font-semibold text-slate-800">Chine (+12%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center -space-x-1">
                  <FlagIcon country="MA" size="xs" />
                  <FlagIcon country="TN" size="xs" />
                </div>
                <span className="font-semibold text-slate-800">Afr. Nord (+18%)</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">QIAO Analytics</span>
          </div>
        </div>

        {/* Col 2: Principales plateformes en Chine with Real China FlagIcon */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FlagIcon country="CN" size="sm" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Plateformes en Chine
                </h3>
              </div>
              <button
                onClick={() => onSelectTab('entreprises')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer shrink-0"
              >
                <span>Voir toutes</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {chinesePlatforms.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlatformModal(p)}
                  className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 flex flex-col items-center justify-between text-center hover:bg-white hover:border-red-200 hover:shadow-xs transition-all cursor-pointer h-21 group relative"
                >
                  <div className="w-full flex items-center justify-between px-0.5">
                    <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">CN</span>
                    <FlagIcon country="CN" size="xs" />
                  </div>
                  <div className="my-auto py-0.5">{p.logo}</div>
                  <span className="text-[10px] text-slate-500 font-medium leading-tight truncate w-full">
                    {p.subtitle}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span className="flex items-center gap-1 font-medium">
              <FlagIcon country="CN" size="xs" />
              <span>6 plateformes majeures</span>
            </span>
            <span className="font-bold text-slate-700">GMV &gt; 1 800 Mds $</span>
          </div>
        </div>

        {/* Col 3: Plateformes actives en Afrique du Nord with Real North Africa FlagIcons */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex items-center -space-x-1 shrink-0">
                  <FlagIcon country="MA" size="xs" />
                  <FlagIcon country="DZ" size="xs" />
                  <FlagIcon country="TN" size="xs" />
                  <FlagIcon country="EG" size="xs" />
                  <FlagIcon country="LY" size="xs" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                  Plateformes Afrique du Nord
                </h3>
              </div>
              <button
                onClick={() => onSelectTab('entreprises')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer shrink-0"
              >
                <span>Voir toutes</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {filteredNaPlatforms.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlatformModal(p)}
                  className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 flex flex-col items-center justify-between text-center hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all cursor-pointer h-21 group relative"
                >
                  <div className="w-full flex items-center justify-between px-0.5">
                    <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">{p.countryCode}</span>
                    <div className="flex items-center -space-x-1">
                      <FlagIcon country={p.countryCode} size="xs" />
                      {p.secondaryCodes && p.secondaryCodes.length > 0 && (
                        <FlagIcon country={p.secondaryCodes[0]} size="xs" />
                      )}
                    </div>
                  </div>
                  <div className="my-auto py-0.5">{p.logo}</div>
                  <span className="text-[10px] text-slate-500 font-medium leading-tight truncate w-full">
                    {p.subtitle}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span className="flex items-center gap-1 font-medium">
              <span>Couverture régionale</span>
            </span>
            <span className="font-bold text-blue-700">78M cyberacheteurs</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. ROW 2: PRODUITS LES PLUS VENDUS / RÉPARTITION CATÉGORIE / MODES PAIEMENT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Produits les plus vendus vers l'Afrique du Nord with Real Corridor FlagIcons */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Top Produits Chine</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <FlagIcon country="CN" size="xs" /> ➔
                  <FlagIcon country="MA" size="xs" />
                  <FlagIcon country="DZ" size="xs" />
                  <FlagIcon country="TN" size="xs" />
                  <FlagIcon country="EG" size="xs" />
                </span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[11px]">
                    <th className="py-2 text-left w-5">#</th>
                    <th className="py-2 text-left">Catégorie</th>
                    <th className="py-2 text-center">Marchés cibles</th>
                    <th className="py-2 text-right">Part / Croiss.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bestSellingProducts.map((p) => (
                    <tr key={p.rank} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 font-bold text-slate-400">{p.rank}</td>
                      <td className="py-2 font-medium text-slate-800">
                        <div>{p.category}</div>
                        <div className="text-[10px] text-slate-400">{p.volume}</div>
                      </td>
                      <td className="py-2 text-center">
                        <div className="inline-flex items-center gap-1 justify-center">
                          {p.targets.map((tgt) => (
                            <FlagIcon key={tgt} country={tgt} size="xs" />
                          ))}
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <div className="font-bold text-slate-900">{p.share}</div>
                        <div className="font-extrabold text-emerald-600 text-[10px]">{p.growth}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right mt-3">
            <button
              onClick={() => onSelectTab('produits')}
              className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Voir le catalogue complet des produits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Col 2: Répartition des ventes par catégorie with Real FlagIcon */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Répartition des ventes par catégorie
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5">
              <span>Flux commercial :</span>
              <FlagIcon country="CN" size="xs" />
              <span>Chine →</span>
              <FlagIcon country="MA" size="xs" />
              <FlagIcon country="DZ" size="xs" />
              <FlagIcon country="TN" size="xs" />
              <FlagIcon country="EG" size="xs" />
              <FlagIcon country="LY" size="xs" />
              <span>Afrique du Nord (2024)</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Donut Chart */}
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                  
                  {/* Total C = 289 */}
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#0c4a9e" strokeWidth="16" strokeDasharray="69.4 219.6" strokeDashoffset="0" />
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#f97316" strokeWidth="16" strokeDasharray="52.0 237.0" strokeDashoffset="-69.4" />
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#ef4444" strokeWidth="16" strokeDasharray="34.7 254.3" strokeDashoffset="-121.4" />
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#a855f7" strokeWidth="16" strokeDasharray="28.9 260.1" strokeDashoffset="-156.1" />
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#0284c7" strokeWidth="16" strokeDasharray="23.1 265.9" strokeDashoffset="-185.0" />
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#78716c" strokeWidth="16" strokeDasharray="17.3 271.7" strokeDashoffset="-208.1" />
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#eab308" strokeWidth="16" strokeDasharray="14.5 274.5" strokeDashoffset="-225.4" />
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#cbd5e1" strokeWidth="16" strokeDasharray="49.1 239.9" strokeDashoffset="-239.9" />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-base font-black text-slate-900 leading-tight">24,1</span>
                  <span className="text-[9.5px] font-bold text-blue-700">Mds USD</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1 w-full text-[11px]">
                {categorySalesDonut.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-slate-700 font-medium">{c.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{c.pct}%</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Col 3: Modes de paiement préférés with Real FlagIcon */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Modes de paiement préférés
            </h3>
            <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1">
              <span>(en Afrique du Nord :</span>
              <FlagIcon country="MA" size="xs" />
              <FlagIcon country="DZ" size="xs" />
              <FlagIcon country="TN" size="xs" />
              <FlagIcon country="EG" size="xs" />
              <FlagIcon country="LY" size="xs" />
              <span>)</span>
            </p>

            <div className="space-y-3">
              {paymentMethods.map((m) => (
                <div key={m.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="text-[11.5px]">{m.name}</span>
                    <span className="font-extrabold text-blue-700">{m.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: m.width }}
                      className="bg-[#2563eb] h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. ROW 3: ZOOM PAR PAYS (AUTHENTIC VECTOR FLAGS) / TENDANCES / ANALYSES   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Zoom par pays (with authentic FlagIcon) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Zoom par pays <span className="font-normal text-slate-500 text-xs">(marché e-commerce, 2024)</span>
              </h3>
            </div>

            {/* 5 Country Cards with Real Vector Flags */}
            <div className="grid grid-cols-5 gap-2">
              {countryBreakdown.map((c) => {
                const isSelected = country === c.name;
                return (
                  <div
                    key={c.code}
                    onClick={() => setCountry(c.name)}
                    className={`rounded-xl p-2.5 flex flex-col items-center text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-400'
                        : 'bg-slate-50/80 border-slate-200/80 hover:bg-white hover:shadow-xs'
                    }`}
                  >
                    <div className="mb-1.5 shadow-2xs">
                      <FlagIcon country={c.code} size="lg" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 truncate w-full">
                      {c.name}
                    </span>
                    <span className="text-xs font-black text-slate-900 mt-1">
                      {c.vol}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-600 mt-0.5">
                      {c.growth}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Micro Details for selected country */}
            {country !== 'Tous les pays' && (
              <div className="mt-3 p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/60 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <FlagIcon country={country} size="xs" />
                    <span>Détails marché : {country}</span>
                  </div>
                  <button
                    onClick={() => setCountry('Tous les pays')}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    Réinitialiser
                  </button>
                </div>
                {(() => {
                  const match = countryBreakdown.find((cb) => cb.name === country);
                  if (!match) return null;
                  return (
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700 mt-1.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Pénétration web</span>
                        <span className="font-bold text-slate-900">{match.penetration}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Part COD (Cash)</span>
                        <span className="font-bold text-slate-900">{match.codShare}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Leader local</span>
                        <span className="font-bold text-slate-900 truncate block">{match.leadingPlatform}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-right mt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">5 pays d'Afrique du Nord</span>
            <button
              onClick={() => onSelectTab('flux-commerciaux')}
              className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Voir l'analyse des flux</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Col 2: Tendances clés */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Tendances clés du corridor</span>
            </h3>

            <div className="space-y-2.5">
              {keyTrends.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/70 border border-slate-100/80 hover:bg-blue-50/40 transition-colors"
                >
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs shrink-0 mt-0.5">
                    {t.icon}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 leading-snug">
                    {t.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3: Dernières analyses with FlagIcon Tags */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Dernières analyses
              </h3>
              <button
                onClick={() => onSelectTab('analyses')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Voir toutes les analyses</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {latestArticles.map((art, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectTab('analyses')}
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="w-14 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                    <img
                      src={art.image}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="inline-flex items-center -space-x-1">
                        {art.countryTags.map((tag) => (
                          <FlagIcon key={tag} country={tag} size="xs" />
                        ))}
                      </div>
                      <span className="text-[9.5px] font-bold text-blue-600 uppercase tracking-wider">
                        {art.tagLabel}
                      </span>
                    </div>
                    <h4 className="text-[11.5px] font-bold text-slate-800 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                      {art.title}
                    </h4>
                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>{art.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: PLATFORM PROFILE DETAIL                                         */}
      {/* ========================================================================= */}
      {selectedPlatformModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setSelectedPlatformModal(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                {selectedPlatformModal.logo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedPlatformModal.name}</h3>
                  <FlagIcon country={selectedPlatformModal.countryCode} size="sm" />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {selectedPlatformModal.subtitle} • {selectedPlatformModal.countryName}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {selectedPlatformModal.description}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Origine</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <FlagIcon country={selectedPlatformModal.countryCode} size="sm" />
                  <span>{selectedPlatformModal.countryName}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Statut</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Vérifié QIAO</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedPlatformModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setSelectedPlatformModal(null);
                  onSelectTab('entreprises');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0c2448] hover:bg-[#081a36] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Voir fiche dans Entreprises</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
