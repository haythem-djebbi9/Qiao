import React, { useState } from 'react';
import {
  Building2,
  TrendingUp,
  Search,
  ChevronDown,
  ShieldCheck,
  Star,
  MapPin,
  Globe,
  ExternalLink,
  ArrowRight,
  CheckCircle,
  Briefcase,
  Users,
  ChevronLeft,
  X,
  Mail,
  Phone,
  Award,
  FileCheck2,
  Package,
  Layers,
  SlidersHorizontal,
  Handshake,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Smartphone,
  Truck,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { CommerceHubTab } from '../../../types';
import { FlagIcon } from '../../common/FlagIcon';

interface Company {
  id: string;
  name: string;
  type: string;
  country: string;
  countryCode: 'CN' | 'MA' | 'DZ' | 'TN' | 'EG' | 'LY';
  city: string;
  sector: string;
  badges: string[];
  logo: React.ReactNode;
  verified: boolean;
  rating: number;
  description: string;
  turnover?: string;
  employees?: string;
  founded?: string;
  certifications?: string[];
  mainProducts?: string[];
  contactEmail?: string;
}

interface EntreprisesTabProps {
  onSelectTab: (tab: CommerceHubTab) => void;
  onOpenCompanyDetail?: (companyName: string) => void;
  onOpenSignUp?: () => void;
}

export const EntreprisesTab: React.FC<EntreprisesTabProps> = ({
  onSelectTab,
  onOpenCompanyDetail,
  onOpenSignUp,
}) => {
  const [selectedCountry, setSelectedCountry] = useState('Tous les pays');
  const [companyType, setCompanyType] = useState('Tous les types');
  const [sector, setSector] = useState('Toutes les catégories');
  const [turnover, setTurnover] = useState('Tous les chiffres');
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredTab, setFeaturedTab] = useState<'toutes' | 'chinoises' | 'nord-africaines' | 'startups' | 'distributeurs' | 'fabricants'>('toutes');
  const [selectedModalCompany, setSelectedModalCompany] = useState<Company | null>(null);

  // 10 Featured Companies exactly matching screenshot
  const featuredCompanies: Company[] = [
    {
      id: 'alibaba',
      name: 'Alibaba Group',
      type: 'Chinoise',
      country: 'Chine',
      countryCode: 'CN',
      city: 'Hangzhou (Zhejiang)',
      sector: 'E-commerce',
      badges: ['E-commerce', 'Technologie'],
      verified: true,
      rating: 4.9,
      description: 'Leader mondial du commerce électronique B2B et B2C, de l’infrastructure cloud et de la logistique globale Cainiao.',
      turnover: '130 Mds USD',
      employees: '235 000+',
      founded: '1999',
      certifications: ['ISO 27001', 'ISO 9001', 'SOC 2 Type II'],
      mainProducts: ['Alibaba.com B2B Sourcing', 'AliExpress', 'Alibaba Cloud IA'],
      contactEmail: 'global-trade@alibaba-inc.com',
      logo: (
        <div className="flex flex-col items-center justify-center select-none">
          <div className="flex items-center gap-1">
            <svg viewBox="0 0 36 28" className="w-8 h-6 shrink-0" fill="none">
              <path
                d="M 18 3 C 10 3 4 9 4 17 C 4 21 6 24 9 27 C 12 24 15 22 18 22 C 21 22 24 24 27 27 C 30 24 32 21 32 17 C 32 9 26 3 18 3 Z"
                fill="#ff6a00"
              />
              <path
                d="M 11 15 Q 18 21 25 15"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <span className="text-[12px] font-black text-[#ff6a00] font-sans tracking-tight leading-none mt-0.5">
            Alibaba<span className="font-semibold text-slate-800">Group</span>
          </span>
        </div>
      ),
    },
    {
      id: 'jd',
      name: 'JD.COM',
      type: 'Chinoise',
      country: 'Chine',
      countryCode: 'CN',
      city: 'Pékin',
      sector: 'E-commerce',
      badges: ['E-commerce', 'Logistique'],
      verified: true,
      rating: 4.8,
      description: 'Pionnier de la distribution directe, de la logistique autonome et de la chaîne d’approvisionnement automatisée en Chine.',
      turnover: '150 Mds USD',
      employees: '450 000+',
      founded: '1998',
      certifications: ['ISO 9001', 'ISO 14001'],
      mainProducts: ['Retail B2C', 'JD Logistics Global', 'JD Worldwide Cross-border'],
      contactEmail: 'global-bd@jd.com',
      logo: (
        <div className="flex items-center gap-1.5 select-none">
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs font-black text-[#e1251b]">
            🐶
          </div>
          <span className="text-sm font-black text-[#e1251b] font-sans tracking-tight">
            JD.COM
          </span>
        </div>
      ),
    },
    {
      id: 'shein',
      name: 'SHEIN',
      type: 'Chinoise',
      country: 'Chine',
      countryCode: 'CN',
      city: 'Guangzhou / Singapour',
      sector: 'Mode & Textile',
      badges: ['Mode & Textile', 'E-commerce'],
      verified: true,
      rating: 4.7,
      description: 'Pionnier de la mode en ligne ultra-agile à la demande, reliant directement les fabricants textiles aux consommateurs.',
      turnover: '30 Mds USD',
      employees: '11 000+',
      founded: '2008',
      certifications: ['OEKO-TEX Standard 100', 'ISO 9001'],
      mainProducts: ['Prêt-à-porter', 'Accessoires & Maison', 'Cosmétiques'],
      contactEmail: 'partnerships@shein.com',
      logo: (
        <div className="flex items-center justify-center select-none">
          <span className="text-base font-black tracking-widest text-slate-900 font-sans">
            SHEIN
          </span>
        </div>
      ),
    },
    {
      id: 'huawei',
      name: 'HUAWEI',
      type: 'Chinoise',
      country: 'Chine',
      countryCode: 'CN',
      city: 'Shenzhen (Guangdong)',
      sector: 'Technologie',
      badges: ['Technologie', 'Solutions B2B'],
      verified: true,
      rating: 4.9,
      description: 'Fournisseur mondial d’infrastructures de télécommunications, de smartphones 5G, de cloud computing et d’énergie solaire.',
      turnover: '100 Mds USD',
      employees: '207 000+',
      founded: '1987',
      certifications: ['ISO 9001', 'TL 9000', 'ISO 14001', 'CE'],
      mainProducts: ['Infrastructures Télécoms 5G', 'Huawei Cloud & IA', 'Smart PV Solar Energy'],
      contactEmail: 'mena-enterprise@huawei.com',
      logo: (
        <div className="flex flex-col items-center justify-center select-none">
          <svg viewBox="0 0 40 32" className="w-7 h-5 shrink-0" fill="none">
            <path d="M20 2 C19 8 15 14 10 17 C16 16 19 12 20 2Z" fill="#e1140a" />
            <path d="M20 2 C21 8 25 14 30 17 C24 16 21 12 20 2Z" fill="#e1140a" />
            <path d="M20 18 C17 18 13 22 11 26 C15 25 18 23 20 18Z" fill="#e1140a" />
            <path d="M20 18 C23 18 27 22 29 26 C25 25 22 23 20 18Z" fill="#e1140a" />
            <circle cx="20" cy="27" r="1.5" fill="#e1140a" />
          </svg>
          <span className="text-[10px] font-black tracking-wider text-slate-800 font-sans mt-0.5">
            HUAWEI
          </span>
        </div>
      ),
    },
    {
      id: 'zte',
      name: 'ZTE',
      type: 'Chinoise',
      country: 'Chine',
      countryCode: 'CN',
      city: 'Shenzhen (Guangdong)',
      sector: 'Technologie',
      badges: ['Technologie', 'Télécoms'],
      verified: true,
      rating: 4.7,
      description: 'Constructeur télécom international déployant des réseaux 5G, équipements à fibre optique et routeurs en Afrique du Nord.',
      turnover: '18 Mds USD',
      employees: '72 000+',
      founded: '1985',
      certifications: ['ISO 9001', 'ISO 27001'],
      mainProducts: ['Réseaux mobiles 5G', 'Routeurs & Terminaux mobiles', 'Solutions Smart City'],
      contactEmail: 'contact-northafrica@zte.com.cn',
      logo: (
        <div className="flex items-center justify-center select-none">
          <span className="text-xl font-black text-[#0066cc] tracking-tight font-sans">
            ZTE
          </span>
        </div>
      ),
    },
    {
      id: 'haier',
      name: 'Haier',
      type: 'Chinoise',
      country: 'Chine',
      countryCode: 'CN',
      city: 'Qingdao (Shandong)',
      sector: 'Électroménager',
      badges: ['Électroménager', 'E-commerce'],
      verified: true,
      rating: 4.8,
      description: 'Numéro 1 mondial du gros électroménager et des maisons connectées, disposant d’un parc industriel géant en Égypte.',
      turnover: '37 Mds USD',
      employees: '100 000+',
      founded: '1984',
      certifications: ['ISO 9001', 'ISO 14001', 'CE'],
      mainProducts: ['Réfrigérateurs Smart', 'Climatiseurs Inverter', 'Lave-linge Direct Motion'],
      contactEmail: 'haier-mena@haier.com',
      logo: (
        <div className="flex items-center justify-center select-none">
          <span className="text-xl font-black text-[#005bac] tracking-tight font-sans">
            Haier
          </span>
        </div>
      ),
    },
    {
      id: 'ouedkniss',
      name: 'Ouedkniss',
      type: 'Nord-Africaine',
      country: 'Algérie',
      countryCode: 'DZ',
      city: 'Alger',
      sector: 'Marketplace',
      badges: ['Marketplace', 'Automobile'],
      verified: true,
      rating: 4.7,
      description: 'Portail numéro 1 en Algérie pour l’e-commerce, l’automobile, les équipements high-tech et les petites annonces.',
      turnover: '45 M USD',
      employees: '250+',
      founded: '2006',
      certifications: ['Agrément Ministère du Commerce'],
      mainProducts: ['Marketplace B2C & C2C', 'Annonces Automobiles', 'Paiement électronique'],
      contactEmail: 'pro@ouedkniss.com',
      logo: (
        <div className="flex items-center justify-center select-none">
          <span className="text-lg font-black text-[#f58220] tracking-tight font-sans">
            Oued<span className="text-slate-900">kniss</span>
          </span>
        </div>
      ),
    },
    {
      id: 'jumia',
      name: 'Jumia',
      type: 'Nord-Africaine',
      country: 'Maroc',
      countryCode: 'MA',
      city: 'Casablanca',
      sector: 'E-commerce',
      badges: ['E-commerce', 'Retail'],
      verified: true,
      rating: 4.6,
      description: 'Marketplace leader facilitant l’accès des marques et fournisseurs chinois aux consommateurs nord-africains avec JumiaPay.',
      turnover: '230 M USD',
      employees: '4 000+',
      founded: '2012',
      certifications: ['PCI-DSS', 'ISO 27001'],
      mainProducts: ['Marketplace Transfrontalière', 'JumiaPay', 'Jumia Logistics'],
      contactEmail: 'global-sellers@jumia.com',
      logo: (
        <div className="flex items-center gap-1 select-none">
          <span className="text-base font-black text-slate-900 tracking-tight font-sans">
            JUMIA
          </span>
          <span className="w-3.5 h-3.5 rounded-full bg-[#f68b1e] flex items-center justify-center text-[8px] text-white font-bold">
            ★
          </span>
        </div>
      ),
    },
    {
      id: 'mytek',
      name: 'Mytek',
      type: 'Nord-Africaine',
      country: 'Tunisie',
      countryCode: 'TN',
      city: 'Tunis',
      sector: 'Distribution',
      badges: ['Distribution', 'High-Tech'],
      verified: true,
      rating: 4.8,
      description: 'Premier site e-commerce high-tech et électroménager en Tunisie avec réseau de boutiques physiques et logistique express.',
      turnover: '85 M USD',
      employees: '450+',
      founded: '2004',
      certifications: ['ISO 9001'],
      mainProducts: ['Informatique & Gaming', 'Smartphones & Téléviseurs', 'Électroménager'],
      contactEmail: 'contact@mytek.tn',
      logo: (
        <div className="flex items-center justify-center select-none">
          <span className="text-lg font-black text-[#e30613] tracking-wider font-sans">
            mytek
          </span>
        </div>
      ),
    },
    {
      id: 'carrefour',
      name: 'Carrefour',
      type: 'Nord-Africaine',
      country: 'Égypte',
      countryCode: 'EG',
      city: 'Le Caire / Alexandrie',
      sector: 'Retail',
      badges: ['Retail', 'Grande distribution'],
      verified: true,
      rating: 4.7,
      description: 'Grand distributeur opéré par Majid Al Futtaim en Égypte, important massivement des produits ménagers et high-tech de Chine.',
      turnover: '920 M USD',
      employees: '8 500+',
      founded: '2002',
      certifications: ['ISO 22000', 'HACCP'],
      mainProducts: ['Grande distribution alimentaire & non-alimentaire', 'E-commerce Carrefour Egypt'],
      contactEmail: 'egypt-suppliers@mafcarrefour.com',
      logo: (
        <div className="flex flex-col items-center justify-center select-none">
          <div className="flex items-center gap-1">
            <svg viewBox="0 0 28 24" className="w-5 h-4" fill="none">
              <path d="M12 2 L2 12 L12 22 Z" fill="#e21a22" />
              <path d="M16 2 L26 12 L16 22 Z" fill="#00387b" />
            </svg>
            <span className="text-[10px] font-arabic font-bold text-slate-800">كارفور</span>
          </div>
          <span className="text-[10px] font-black text-[#00387b] font-sans tracking-tight -mt-0.5">
            Carrefour
          </span>
        </div>
      ),
    },
  ];

  // Recently added companies (Table on left-bottom)
  const newCompanies = [
    {
      name: 'ANKER',
      native: '安克创新',
      country: 'Chine',
      countryCode: 'CN' as const,
      sector: 'Électronique',
      type: 'Fabricant',
      date: '12 Sept. 2024',
      logo: <span className="font-black text-blue-600 text-xs tracking-tight">ANKER</span>,
    },
    {
      name: 'infinix',
      native: '传音Infinix',
      country: 'Chine',
      countryCode: 'CN' as const,
      sector: 'Smartphones',
      type: 'Fabricant',
      date: '10 Sept. 2024',
      logo: <div className="bg-slate-900 text-white font-bold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5"><span>infinix</span><span className="w-1 h-1 rounded-full bg-emerald-400" /></div>,
    },
    {
      name: 'LC WAIKIKI',
      native: 'LC Waikiki Tunisie',
      country: 'Tunisie',
      countryCode: 'TN' as const,
      sector: 'Mode & Textile',
      type: 'Distributeur',
      date: '8 Sept. 2024',
      logo: <span className="font-black text-[#002b49] text-[10px] tracking-tight">LC WAIKIKI</span>,
    },
    {
      name: 'CHERY',
      native: 'Chery Algérie',
      country: 'Algérie',
      countryCode: 'DZ' as const,
      sector: 'Automobile',
      type: 'Fabricant',
      date: '6 Sept. 2024',
      logo: <div className="border border-red-500 rounded-full px-1.5 text-[9px] font-black text-red-600">CHERY</div>,
    },
    {
      name: 'Spinneys',
      native: 'Spinneys Egypt',
      country: 'Égypte',
      countryCode: 'EG' as const,
      sector: 'Retail',
      type: 'Distributeur',
      date: '5 Sept. 2024',
      logo: <span className="font-extrabold text-emerald-700 text-xs">Spinneys</span>,
    },
  ];

  // Recent Opportunities (Right-bottom card)
  const recentOpportunities = [
    {
      id: 'opp-1',
      title: 'Recherche de distributeurs en Afrique du Nord',
      sector: 'Produits électroniques',
      country: 'Chine',
      countryCode: 'CN' as const,
      time: 'Il y a 1 jour',
      icon: <Smartphone className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'opp-2',
      title: 'Partenariat pour marketplace mode',
      sector: 'Maroc, Algérie, Tunisie',
      country: 'Chine',
      countryCode: 'CN' as const,
      time: 'Il y a 2 jours',
      icon: <ShoppingBag className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'opp-3',
      title: "Fournisseurs d'huile d'olive",
      sector: 'Export vers la Chine',
      country: 'Tunisie',
      countryCode: 'TN' as const,
      time: 'Il y a 3 jours',
      icon: <Sparkles className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'opp-4',
      title: 'Joint-venture logistique',
      sector: 'Afrique du Nord',
      country: 'Chine',
      countryCode: 'CN' as const,
      time: 'Il y a 4 jours',
      icon: <Truck className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'opp-5',
      title: 'Distributeurs cosmétiques',
      sector: 'Marché nord-africain',
      country: 'Chine',
      countryCode: 'CN' as const,
      time: 'Il y a 5 jours',
      icon: <Package className="w-4 h-4 text-blue-600" />,
    },
  ];

  // Sectors breakdown matching donut in screenshot
  const sectorsDonut = [
    { name: 'E-commerce', pct: 28, color: '#2563eb' },
    { name: 'Distribution & Retail', pct: 18, color: '#0284c7' },
    { name: 'Mode & Textile', pct: 12, color: '#a855f7' },
    { name: 'Électronique & High-Tech', pct: 10, color: '#f97316' },
    { name: 'Automobile & Mobilité', pct: 8, color: '#ef4444' },
    { name: 'Agroalimentaire', pct: 8, color: '#10b981' },
    { name: 'Santé & Beauté', pct: 6, color: '#ec4899' },
    { name: 'Logistique & Transport', pct: 5, color: '#f59e0b' },
    { name: 'Autres', pct: 5, color: '#94a3b8' },
  ];

  // Types of companies breakdown
  const companyTypesProgress = [
    { name: 'Fabricants', pct: 32 },
    { name: 'Distributeurs', pct: 24 },
    { name: 'Retailers', pct: 18 },
    { name: 'Marketplaces', pct: 12 },
    { name: 'Importateurs', pct: 8 },
    { name: 'Exportateurs', pct: 6 },
    { name: 'Prestataires de services', pct: 6 },
    { name: 'Autres', pct: 4 },
  ];

  // Filtered featured companies
  const filteredFeatured = featuredCompanies.filter((c) => {
    if (featuredTab === 'chinoises' && c.type !== 'Chinoise') return false;
    if (featuredTab === 'nord-africaines' && c.type !== 'Nord-Africaine') return false;
    if (featuredTab === 'distributeurs' && !c.badges.includes('Distribution') && !c.badges.includes('Retail')) return false;
    if (featuredTab === 'fabricants' && !c.type.includes('Chinoise') && c.id !== 'haier') return false;
    if (featuredTab === 'startups' && c.id !== 'ouedkniss' && c.id !== 'mytek') return false;

    if (selectedCountry !== 'Tous les pays') {
      if (selectedCountry === 'Chine' && c.countryCode !== 'CN') return false;
      if (selectedCountry === 'Maroc' && c.countryCode !== 'MA') return false;
      if (selectedCountry === 'Algérie' && c.countryCode !== 'DZ') return false;
      if (selectedCountry === 'Tunisie' && c.countryCode !== 'TN') return false;
      if (selectedCountry === 'Égypte' && c.countryCode !== 'EG') return false;
      if (selectedCountry === 'Libye' && c.countryCode !== 'LY') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q) ||
        c.badges.some((b) => b.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. FILTER BAR (MATCHING SCREENSHOT EXACTLY)                               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          
          {/* Pays */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Pays
            </label>
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Tous les pays</option>
                <option>Chine</option>
                <option>Maroc</option>
                <option>Algérie</option>
                <option>Tunisie</option>
                <option>Égypte</option>
                <option>Libye</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Type d'entreprise */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Type d'entreprise
            </label>
            <div className="relative">
              <select
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Tous les types</option>
                <option>Fabricants</option>
                <option>Distributeurs</option>
                <option>Retailers</option>
                <option>Marketplaces</option>
                <option>Importateurs</option>
                <option>Exportateurs</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Secteur d'activité */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Secteur d'activité
            </label>
            <div className="relative">
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Toutes les catégories</option>
                <option>E-commerce</option>
                <option>Distribution & Retail</option>
                <option>Mode & Textile</option>
                <option>Électronique & High-Tech</option>
                <option>Automobile & Mobilité</option>
                <option>Agroalimentaire</option>
                <option>Santé & Beauté</option>
                <option>Logistique & Transport</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Chiffre d'affaires */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Chiffre d'affaires
            </label>
            <div className="relative">
              <select
                value={turnover}
                onChange={(e) => setTurnover(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Tous les chiffres</option>
                <option>&lt; 10 M USD</option>
                <option>10 M - 50 M USD</option>
                <option>50 M - 200 M USD</option>
                <option>&gt; 200 M USD</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search bar with Navy Search Button */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une entreprise, un mot-clé..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => {}}
              className="absolute right-1 top-1 bottom-1 px-2.5 bg-[#0c2448] hover:bg-[#081a36] text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filtres avancés Button */}
          <button
            onClick={() => {}}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtres avancés</span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FOUR METRIC CARDS (MATCHING SCREENSHOT)                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: 6 200+ Entreprises identifiées */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              6 200+
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
              Entreprises identifiées
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>+12%</span>
              <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
            </div>
          </div>
        </div>

        {/* Card 2: 3 800+ Entreprises chinoises */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0 shadow-2xs">
            <FlagIcon country="CN" size="lg" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              3 800+
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
              Entreprises chinoises
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>+18%</span>
              <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
            </div>
          </div>
        </div>

        {/* Card 3: 2 400+ Entreprises en Afrique du Nord */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 p-1">
            <div className="flex flex-wrap items-center justify-center gap-0.5 max-w-[36px]">
              <FlagIcon country="TN" size="xs" />
              <FlagIcon country="DZ" size="xs" />
              <FlagIcon country="MA" size="xs" />
              <FlagIcon country="EG" size="xs" />
              <FlagIcon country="LY" size="xs" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              2 400+
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
              Entreprises en Afrique du Nord
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>+15%</span>
              <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
            </div>
          </div>
        </div>

        {/* Card 4: 1 200+ Opportunités de partenariat */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
            <Handshake className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              1 200+
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5 leading-snug">
              Opportunités de partenariat
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>+28%</span>
              <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN SECTION: 2-COLUMN LAYOUT (LEFT: 68% / RIGHT: 32%)                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN (lg:col-span-8)                                             */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section: Entreprises en vedette */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            
            {/* Header + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Entreprises en vedette
              </h2>
              <button
                onClick={() => {}}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>Voir toutes les entreprises</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mb-5 pb-3 border-b border-slate-100">
              {[
                { id: 'toutes', label: 'Toutes' },
                { id: 'chinoises', label: 'Entreprises chinoises' },
                { id: 'nord-africaines', label: 'Entreprises nord-africaines' },
                { id: 'startups', label: 'Startups' },
                { id: 'distributeurs', label: 'Distributeurs' },
                { id: 'fabricants', label: 'Fabricants' },
              ].map((tab) => {
                const isActive = featuredTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFeaturedTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0066cc] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 10 Company Cards Grid (5 columns x 2 rows) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {filteredFeatured.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedModalCompany(c)}
                  className="bg-white border border-slate-200/90 rounded-xl p-3 flex flex-col justify-between hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer text-center group"
                >
                  {/* Logo Container */}
                  <div className="h-12 flex items-center justify-center mb-2 px-1">
                    {c.logo}
                  </div>

                  {/* Company Name */}
                  <div className="text-xs font-bold text-slate-900 truncate mb-1.5">
                    {c.name}
                  </div>

                  {/* Sector Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-1 mb-2">
                    {c.badges.map((b) => (
                      <span
                        key={b}
                        className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded"
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  {/* Location with Flag */}
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-2.5">
                    <FlagIcon country={c.countryCode} size="xs" />
                    <span>{c.country}</span>
                  </div>

                  {/* Button Link */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10.5px] font-bold text-blue-600 group-hover:text-blue-700 inline-flex items-center gap-0.5">
                      <span>Voir le profil</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Section: Nouvelles entreprises ajoutées & Opportunités récentes (Side by Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Left: Nouvelles entreprises ajoutées */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Nouvelles entreprises ajoutées
                  </h3>
                  <button
                    onClick={() => {}}
                    className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Voir toutes</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[10.5px]">
                        <th className="py-2 text-left">Entreprise</th>
                        <th className="py-2 text-left">Pays</th>
                        <th className="py-2 text-left">Secteur</th>
                        <th className="py-2 text-left">Type</th>
                        <th className="py-2 text-left">Date d'ajout</th>
                        <th className="py-2 text-center w-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newCompanies.map((comp) => (
                        <tr key={comp.name} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 font-bold text-slate-800">
                            {comp.logo}
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                              <FlagIcon country={comp.countryCode} size="xs" />
                              <span>{comp.country}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-slate-600 text-[11px]">
                            {comp.sector}
                          </td>
                          <td className="py-2.5 text-slate-600 text-[11px]">
                            {comp.type}
                          </td>
                          <td className="py-2.5 text-slate-400 text-[10.5px]">
                            {comp.date}
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => {}}
                              className="w-5 h-5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer ml-auto"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Opportunités récentes */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Opportunités récentes
                  </h3>
                  <button
                    onClick={() => onSelectTab('opportunites')}
                    className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Voir toutes les opportunités</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {recentOpportunities.map((opp) => (
                    <div
                      key={opp.id}
                      onClick={() => onSelectTab('opportunites')}
                      className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100/90 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex items-start gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        {opp.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                          {opp.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5">
                          <span>{opp.sector}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <FlagIcon country={opp.countryCode} size="xs" />
                            <span>{opp.country}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        {opp.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN (lg:col-span-4)                                            */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Répartition des entreprises par pays with Vector North Africa Graphic */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Répartition des entreprises par pays
              </h3>
              <button
                onClick={() => {}}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Voir plus</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Interactive North Africa Countries Graphic Map */}
            <div className="relative w-full h-40 bg-gradient-to-r from-blue-900/90 via-[#0066cc] to-[#004080] rounded-xl p-3 overflow-hidden text-white flex items-center justify-between">
              
              {/* Silhouette background styling */}
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <svg viewBox="0 0 500 200" className="w-full h-full object-cover">
                  <path d="M 30,120 Q 80,60 140,80 T 260,70 T 360,90 T 480,140 L 480,200 L 30,200 Z" fill="#ffffff" />
                </svg>
              </div>

              {/* 4 Geographic Node Highlights */}
              <div className="relative z-10 w-full grid grid-cols-4 gap-1 text-center">
                {/* Maroc */}
                <div
                  onClick={() => setSelectedCountry('Maroc')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-xs p-2 rounded-lg border border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <FlagIcon country="MA" size="xs" />
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Maroc</div>
                  <div className="text-lg font-black text-white leading-tight">850</div>
                </div>

                {/* Algérie */}
                <div
                  onClick={() => setSelectedCountry('Algérie')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-xs p-2 rounded-lg border border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <FlagIcon country="DZ" size="xs" />
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Algérie</div>
                  <div className="text-lg font-black text-white leading-tight">620</div>
                </div>

                {/* Tunisie */}
                <div
                  onClick={() => setSelectedCountry('Tunisie')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-xs p-2 rounded-lg border border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <FlagIcon country="TN" size="xs" />
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Tunisie</div>
                  <div className="text-lg font-black text-white leading-tight">480</div>
                </div>

                {/* Égypte */}
                <div
                  onClick={() => setSelectedCountry('Égypte')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-xs p-2 rounded-lg border border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <FlagIcon country="EG" size="xs" />
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Égypte</div>
                  <div className="text-lg font-black text-white leading-tight">980</div>
                </div>
              </div>

            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
              <span>Afrique du Nord : 2 400+ entreprises</span>
              <span>Chine : 3 800+</span>
            </div>
          </div>

          {/* Card 2: Entreprises par secteur d'activité (Donut Chart) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">
              Entreprises par secteur d'activité
            </h3>

            <div className="flex items-center gap-4">
              
              {/* Donut Chart */}
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#f1f5f9" strokeWidth="16" />
                  
                  {/* C = 289 */}
                  {/* 28% = 80.9 */}
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#2563eb" strokeWidth="16" strokeDasharray="80.9 208.1" strokeDashoffset="0" />
                  {/* 18% = 52.0 */}
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#0284c7" strokeWidth="16" strokeDasharray="52.0 237.0" strokeDashoffset="-80.9" />
                  {/* 12% = 34.7 */}
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#a855f7" strokeWidth="16" strokeDasharray="34.7 254.3" strokeDashoffset="-132.9" />
                  {/* 10% = 28.9 */}
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#f97316" strokeWidth="16" strokeDasharray="28.9 260.1" strokeDashoffset="-167.6" />
                  {/* 8% = 23.1 */}
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#ef4444" strokeWidth="16" strokeDasharray="23.1 265.9" strokeDashoffset="-196.5" />
                  {/* 8% = 23.1 */}
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#10b981" strokeWidth="16" strokeDasharray="23.1 265.9" strokeDashoffset="-219.6" />
                  {/* 6% = 17.3 */}
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#ec4899" strokeWidth="16" strokeDasharray="17.3 271.7" strokeDashoffset="-242.7" />
                  {/* 5% = 14.5 */}
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#f59e0b" strokeWidth="16" strokeDasharray="14.5 274.5" strokeDashoffset="-260.0" />
                  {/* 5% = 14.5 */}
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#94a3b8" strokeWidth="16" strokeDasharray="14.5 274.5" strokeDashoffset="-274.5" />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-base font-black text-slate-900 leading-tight">6 200</span>
                  <span className="text-[9.5px] font-bold text-slate-500">Entreprises</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1 w-full text-[11px]">
                {sectorsDonut.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-700 font-medium truncate">{s.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 ml-1">{s.pct}%</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Card 3: Types d'entreprises (Progress Bars) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">
              Types d'entreprises
            </h3>

            <div className="space-y-2.5">
              {companyTypesProgress.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="text-[11.5px]">{item.name}</span>
                    <span className="font-extrabold text-slate-900">{item.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${item.pct * 2.8}%` }}
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
      {/* 4. MODAL: COMPANY PROFILE DETAIL                                          */}
      {/* ========================================================================= */}
      {selectedModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedModalCompany(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                {selectedModalCompany.logo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedModalCompany.name}
                  </h3>
                  <FlagIcon country={selectedModalCompany.countryCode} size="sm" />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {selectedModalCompany.type} • {selectedModalCompany.city}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {selectedModalCompany.badges.map((b) => (
                <span
                  key={b}
                  className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md"
                >
                  {b}
                </span>
              ))}
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Vérifié QIAO
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-700 leading-relaxed mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {selectedModalCompany.description}
            </p>

            {/* Quick figures */}
            <div className="grid grid-cols-3 gap-2.5 mb-4 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Chiffre d'affaires</span>
                <span className="text-xs font-black text-slate-900">{selectedModalCompany.turnover || 'Confidential'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Effectif</span>
                <span className="text-xs font-black text-slate-900">{selectedModalCompany.employees || '1 000+'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Fondation</span>
                <span className="text-xs font-black text-slate-900">{selectedModalCompany.founded || '2000'}</span>
              </div>
            </div>

            {/* Certifications & Products */}
            {selectedModalCompany.mainProducts && (
              <div className="mb-4">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Produits & Solutions Clés
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedModalCompany.mainProducts.map((prod) => (
                    <span key={prod} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedModalCompany(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setSelectedModalCompany(null);
                  onSelectTab('opportunites');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0c2448] hover:bg-[#081a36] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Voir opportunités liées</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
