import React, { useState } from 'react';
import {
  FileText,
  Search,
  ChevronDown,
  Download,
  Calendar,
  Star,
  Eye,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Mail,
  Share2,
  TrendingUp,
  Users,
  BarChart3,
  Globe,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { CommerceHubTab } from '../../../types';
import { FlagIcon } from '../../common/FlagIcon';

interface RapportsTabProps {
  onSelectTab: (tab: CommerceHubTab) => void;
  onOpenReportModal?: (reportTitle: string) => void;
}

export const RapportsTab: React.FC<RapportsTabProps> = ({
  onSelectTab,
  onOpenReportModal,
}) => {
  const [reportType, setReportType] = useState('Tous les types');
  const [countryRegion, setCountryRegion] = useState('Tous les pays');
  const [sector, setSector] = useState('Toutes les catégories');
  const [year, setYear] = useState('Toutes les années');
  const [searchQuery, setSearchQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [downloadModalReport, setDownloadModalReport] = useState<string | null>(null);

  // 4 KPI metrics matching screenshot
  const metrics = [
    {
      value: '320+',
      label: 'Rapports publiés',
      change: '+28% vs 2023',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      value: '50+',
      label: 'Organisations partenaires',
      change: '+25% vs 2023',
      icon: Users,
      color: 'text-indigo-600',
    },
    {
      value: '120 000+',
      label: 'Téléchargements',
      change: '+42% vs 2023',
      icon: Download,
      color: 'text-blue-600',
    },
    {
      value: '15+',
      label: 'Études exclusives QIAO',
      change: '+50% vs 2023',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  // 6 Top countries covered
  const topCountries = [
    { name: 'Chine', count: 78, pct: 100, flag: '🇨🇳' },
    { name: 'Tunisie', count: 56, pct: 72, flag: '🇹🇳' },
    { name: 'Algérie', count: 48, pct: 62, flag: '🇩🇿' },
    { name: 'Maroc', count: 46, pct: 59, flag: '🇲🇦' },
    { name: 'Égypte', count: 42, pct: 54, flag: '🇪🇬' },
    { name: 'Libye', count: 28, pct: 36, flag: '🇱🇾' },
  ];

  // 5 Main Latest Reports matching screenshot
  const mainReports = [
    {
      id: 'rep-1',
      title: 'China – North Africa Trade Outlook 2024',
      badge: 'Rapport phare',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Analyse complète des échanges commerciaux entre la Chine et l’Afrique du Nord, par secteur et par pays.',
      publisher: 'QIAO Intelligence',
      date: 'Juillet 2024',
      size: 'PDF - 4,2 MB',
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'rep-2',
      title: 'E-commerce in North Africa 2024',
      badge: 'Étude de marché',
      badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Tendances, comportements des consommateurs et opportunités pour les entreprises chinoises.',
      publisher: 'QIAO Intelligence',
      date: 'Juin 2024',
      size: 'PDF - 3,8 MB',
      image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'rep-3',
      title: 'Les opportunités dans les énergies renouvelables',
      badge: 'Étude sectorielle',
      badgeStyle: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      description: 'Focus sur le marché des panneaux solaires en Afrique du Nord.',
      publisher: 'QIAO Intelligence',
      date: 'Mai 2024',
      size: 'PDF - 2,6 MB',
      image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'rep-4',
      title: 'Marché des cosmétiques en Afrique du Nord',
      badge: 'Analyse secteur',
      badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Taille du marché, tendances et opportunités d’importation depuis la Chine.',
      publisher: 'QIAO Intelligence',
      date: 'Avril 2024',
      size: 'PDF - 3,1 MB',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'rep-5',
      title: 'Logistique et supply chain Chine – Afrique du Nord',
      badge: 'Rapport technique',
      badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
      description: 'Solutions logistiques, coûts et délais pour un commerce plus fluide.',
      publisher: 'QIAO Intelligence',
      date: 'Mars 2024',
      size: 'PDF - 2,9 MB',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
    },
  ];

  // 5 Most Consulted Reports
  const popularReports = [
    {
      rank: 1,
      title: 'China – North Africa Trade Outlook 2024',
      downloads: '12,4k téléchargements',
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=200&q=80',
    },
    {
      rank: 2,
      title: 'E-commerce in North Africa 2024',
      downloads: '9,8k téléchargements',
      image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=200&q=80',
    },
    {
      rank: 3,
      title: 'Renewable Energy Opportunities',
      downloads: '7,6k téléchargements',
      image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=200&q=80',
    },
    {
      rank: 4,
      title: 'Regulatory Guide for Importers',
      downloads: '6,9k téléchargements',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=200&q=80',
    },
    {
      rank: 5,
      title: 'North African Consumer Trends',
      downloads: '6,1k téléchargements',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=200&q=80',
    },
  ];

  // Contributing organisations matching screenshot
  const contributingOrgs = [
    { name: 'WORLD BANK', code: 'WB' },
    { name: 'UNCTAD', code: 'UNCTAD' },
    { name: 'ITC', code: 'ITC' },
    { name: 'AFREXIMBANK', code: 'AFREX' },
    { name: 'CCPIT', code: 'CCPIT' },
    { name: 'CHINA CUSTOMS', code: 'CUSTOMS' },
    { name: 'Union Africaine', code: 'AU' },
    { name: 'ESCWA', code: 'ESCWA' },
  ];

  // Upcoming studies matching screenshot
  const upcomingStudies = [
    {
      date: 'Sept. 2024',
      title: 'Le marché automobile en Afrique du Nord',
    },
    {
      date: 'Oct. 2024',
      title: 'L’agroalimentaire : opportunités et défis',
    },
    {
      date: 'Nov. 2024',
      title: 'L’intelligence artificielle dans le e-commerce',
    },
    {
      date: 'Déc. 2024',
      title: 'Guide d’investissement Chine – Afrique du Nord',
    },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSuccess(true);
    setTimeout(() => setNewsletterSuccess(false), 4000);
    setNewsletterEmail('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. SEARCH & 4 DROPDOWN FILTERS BAR                                        */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          
          {/* 4 Selects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            
            {/* 1. Type de rapport */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Type de rapport</label>
              <div className="relative">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option>Tous les types</option>
                  <option>Rapports phares</option>
                  <option>Études de marché</option>
                  <option>Études sectorielles</option>
                  <option>Rapports techniques</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Pays / Région */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pays / Région</label>
              <div className="relative">
                <select
                  value={countryRegion}
                  onChange={(e) => setCountryRegion(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option>Tous les pays</option>
                  <option>Chine</option>
                  <option>Tunisie</option>
                  <option>Algérie</option>
                  <option>Maroc</option>
                  <option>Égypte</option>
                  <option>Libye</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. Secteur */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Secteur</label>
              <div className="relative">
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option>Toutes les catégories</option>
                  <option>Commerce & échanges</option>
                  <option>E-commerce</option>
                  <option>Énergie & Industrie</option>
                  <option>Cosmétiques & Mode</option>
                  <option>Logistique & Transport</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. Année */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Année</label>
              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option>Toutes les années</option>
                  <option>2024</option>
                  <option>2023</option>
                  <option>2022</option>
                  <option>2021</option>
                  <option>2020</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Search bar on the right */}
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un rapport, une étude..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 pr-11 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => {}}
              className="absolute right-1 top-1 bottom-1 px-3 bg-[#0a2559] hover:bg-blue-900 text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FOUR KPI METRICS CARDS (EXACT MATCH SCREENSHOT)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-shadow flex items-start justify-between"
            >
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {m.value}
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-1 leading-snug">
                  {m.label}
                </div>
                <div className="text-xs font-bold text-emerald-600 mt-2">
                  {m.change}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. ROW 1: 3 ANALYTICS VISUALS (PUBLICATIONS, THEMATIQUES, TOP PAYS)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Évolution des publications (Bar + Line Chart) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Évolution des publications
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-slate-600 font-medium">Rapports</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span className="text-slate-600 font-medium">Études</span>
                </div>
              </div>
            </div>

            {/* SVG Chart with bars and line */}
            <div className="h-[210px] w-full flex items-end justify-between gap-3 pt-6 pb-2 px-1">
              {[
                { year: '2020', reports: 22, etudes: 35 },
                { year: '2021', reports: 34, etudes: 48 },
                { year: '2022', reports: 48, etudes: 63 },
                { year: '2023', reports: 65, etudes: 78 },
                { year: '2024', reports: 78, etudes: 92 },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-[140px] relative">
                    {/* Blue Bar for Rapports */}
                    <div
                      style={{ height: `${(item.reports / 100) * 100}%` }}
                      className="w-4 sm:w-5 bg-blue-400 rounded-t-sm group-hover:bg-blue-600 transition-colors"
                      title={`${item.reports} Rapports`}
                    />
                    {/* Red line point simulation */}
                    <div
                      style={{ bottom: `${(item.etudes / 100) * 100}%` }}
                      className="absolute w-2 h-2 rounded-full bg-red-600 border border-white shadow-2xs group-hover:scale-125 transition-transform"
                      title={`${item.etudes} Études`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 mt-2">{item.year}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 2: Répartition des rapports par thématique (2024) (Donut) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">
              Répartition des rapports par thématique <span className="text-slate-400 font-normal text-xs">(2024)</span>
            </h3>

            <div className="flex items-center gap-4 my-2">
              {/* Donut Chart SVG */}
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#1d4ed8" strokeWidth="4.5" strokeDasharray="28 72" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f97316" strokeWidth="4.5" strokeDasharray="18 82" strokeDashoffset="-28" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="4.5" strokeDasharray="14 86" strokeDashoffset="-46" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray="12 88" strokeDashoffset="-60" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="10 90" strokeDashoffset="-72" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="8 92" strokeDashoffset="-82" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#fbbf24" strokeWidth="4.5" strokeDasharray="6 94" strokeDashoffset="-90" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#94a3b8" strokeWidth="4.5" strokeDasharray="4 96" strokeDashoffset="-96" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black text-slate-900 leading-none">320</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Rapports</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1 text-[10.5px] flex-1">
                {[
                  { label: 'Commerce & échanges', pct: '28%', color: 'bg-blue-700' },
                  { label: 'E-commerce', pct: '18%', color: 'bg-orange-500' },
                  { label: 'Investissement', pct: '14%', color: 'bg-purple-500' },
                  { label: 'Réglementation & douanes', pct: '12%', color: 'bg-emerald-500' },
                  { label: 'Secteurs produits', pct: '10%', color: 'bg-red-500' },
                  { label: 'Analyses pays', pct: '8%', color: 'bg-blue-500' },
                  { label: 'Études consommateurs', pct: '6%', color: 'bg-amber-400' },
                  { label: 'Autres', pct: '4%', color: 'bg-slate-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                      <span className="text-slate-700 truncate">{item.label}</span>
                    </div>
                    <span className="font-bold text-slate-900 ml-1">{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Top pays couverts (Ranked Bars) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Top pays couverts
              </h3>
              <button
                onClick={() => onSelectTab('pays' as any)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Voir tous les pays</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List with progress bars */}
            <div className="space-y-2.5">
              {topCountries.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <FlagIcon country={c.name} size="sm" />
                  <span className="text-xs font-semibold text-slate-800 w-16 truncate">{c.name}</span>
                  <span className="text-xs font-black text-slate-900 w-6 text-right shrink-0">{c.count}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      style={{ width: `${c.pct}%` }}
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. ROW 2: DERNIERS RAPPORTS ET ÉTUDES (LEFT) & SIDEBAR (RIGHT)            */}
      {/* ========================================================================= */}
      <div id="derniers-rapports" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Derniers rapports et études (approx 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Derniers rapports et études
            </h2>
            <button
              onClick={() => {}}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tous les rapports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {mainReports.map((report) => (
              <div
                key={report.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                  {/* Thumbnail Image */}
                  <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={report.image}
                      alt={report.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {report.title}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${report.badgeStyle}`}>
                        {report.badge}
                      </span>
                    </div>

                    <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 leading-snug mb-2">
                      {report.description}
                    </p>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-slate-500 font-medium">
                      <span>{report.publisher}</span>
                      <span>|</span>
                      <span>{report.date}</span>
                      <span>|</span>
                      <span className="text-red-600 font-semibold flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{report.size}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => setDownloadModalReport(report.title)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:border-red-400 bg-white hover:bg-red-50/50 text-slate-800 hover:text-red-600 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 self-end sm:self-center"
                >
                  <Download className="w-3.5 h-3.5 text-red-600" />
                  <span>Télécharger</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sidebar (approx 4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Sidebar Card 1: Rapports les plus consultés */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Rapports les plus consultés
              </h3>
              <button
                onClick={() => {}}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Voir plus</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {popularReports.map((p) => (
                <div
                  key={p.rank}
                  onClick={() => setDownloadModalReport(p.title)}
                  className="flex items-center justify-between gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-black text-slate-900 w-3 text-center shrink-0">
                      {p.rank}
                    </span>
                    <div className="w-10 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {p.downloads}
                      </div>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-red-500 group-hover:text-red-600 shrink-0 ml-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Card 2: Organisations contributrices */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Organisations contributrices
              </h3>
              <button
                onClick={() => {}}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Voir tous les partenaires</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Grid of partner organisation badges */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {contributingOrgs.map((org, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-200/70 rounded-xl p-2 flex flex-col items-center justify-center hover:bg-white hover:border-slate-300 transition-all cursor-pointer h-14"
                  title={org.name}
                >
                  <Globe className="w-4 h-4 text-blue-700 mb-0.5" />
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">
                    {org.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Card 3: Abonnez-vous aux nouvelles publications */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                Abonnez-vous aux nouvelles publications
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-snug">
              Recevez nos derniers rapports et analyses directement par email.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Votre adresse email"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#0c4a9e] hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                S'abonner
              </button>
            </form>
            {newsletterSuccess && (
              <div className="text-[11px] text-emerald-600 font-bold mt-2">
                ✓ Merci ! Vous êtes bien inscrit aux alertes publications.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. ROW 3: ÉTUDES À VENIR (CALENDAR MILESTONES)                             */}
      {/* ========================================================================= */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-4">
          Études à venir
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingStudies.map((u, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-blue-600 mb-0.5">
                  {u.date}
                </div>
                <div className="text-xs font-semibold text-slate-800 leading-snug">
                  {u.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: REPORT DOWNLOAD                                                 */}
      {/* ========================================================================= */}
      {downloadModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center relative">
            <button
              onClick={() => setDownloadModalReport(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Télécharger le rapport
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-semibold">
              « {downloadModalReport} »
            </p>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Le rapport PDF complet haute résolution et les tableaux de données statistiques sont prêts.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDownloadModalReport(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  alert(`Le téléchargement de « ${downloadModalReport} » a débuté.`);
                  setDownloadModalReport(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-xs"
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
