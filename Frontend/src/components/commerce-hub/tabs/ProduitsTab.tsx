import React, { useState } from 'react';
import {
  Package,
  TrendingUp,
  Search,
  ChevronDown,
  ArrowRight,
  Download,
  Calendar,
  FileText,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Ship,
  Handshake,
  Layers,
  BarChart3,
  X
} from 'lucide-react';
import { CommerceHubTab } from '../../../types';
import { NorthAfricaTargetMarketsMap } from '../components/NorthAfricaTargetMarketsMap';

interface ProduitsTabProps {
  onSelectTab: (tab: CommerceHubTab) => void;
  onOpenProductDetail?: (productName: string) => void;
}

export const ProduitsTab: React.FC<ProduitsTabProps> = ({
  onSelectTab,
  onOpenProductDetail,
}) => {
  const [direction, setDirection] = useState('Toutes les directions');
  const [country, setCountry] = useState('Tous les pays');
  const [category, setCategory] = useState('Toutes les catégories');
  const [subCategory, setSubCategory] = useState('Toutes les sous-catégories');
  const [searchQuery, setSearchQuery] = useState('');
  const [volumeTab, setVolumeTab] = useState<'export' | 'import'>('export');
  const [growthPeriod, setGrowthPeriod] = useState('2020 - 2024');
  const [selectedProductModal, setSelectedProductModal] = useState<string | null>(null);
  const [downloadModalDoc, setDownloadModalDoc] = useState<string | null>(null);

  // 5 KPI Metrics matching screenshot
  const metrics = [
    {
      value: '1 250+',
      label: 'Produits analysés',
      change: '+18% vs 2023',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      value: '320',
      label: 'Produits à fort potentiel',
      change: '+24% vs 2023',
      icon: TrendingUp,
      color: 'text-indigo-600',
    },
    {
      value: '24,1 Mds USD',
      label: "Exportations vers l'Afrique du Nord",
      change: '+20% vs 2023',
      icon: Ship,
      color: 'text-blue-600',
    },
    {
      value: '22,7 Mds USD',
      label: "Importations depuis l'Afrique du Nord",
      change: '+16% vs 2023',
      icon: Ship,
      color: 'text-cyan-600',
    },
    {
      value: '680',
      label: 'Opportunités produits identifiées',
      change: '+35% vs 2023',
      icon: Handshake,
      color: 'text-purple-600',
    },
  ];

  // Volume bar chart data
  const exportVolumeProducts = [
    { name: 'Machines & équipements', value: '8,2', pct: 82, icon: '🏭' },
    { name: 'Produits électroniques', value: '6,1', pct: 61, icon: '📱' },
    { name: 'Textiles & habillement', value: '3,4', pct: 34, icon: '👕' },
    { name: 'Produits chimiques', value: '2,8', pct: 28, icon: '🧪' },
    { name: 'Véhicules & pièces', value: '2,1', pct: 21, icon: '🚗' },
    { name: 'Produits métallurgiques', value: '1,9', pct: 19, icon: '⚙️' },
    { name: 'Produits en plastique', value: '1,6', pct: 16, icon: '🧴' },
    { name: 'Meubles & décoration', value: '1,3', pct: 13, icon: '🛋️' },
    { name: 'Autres produits', value: '0,9', pct: 9, icon: '📦' },
  ];

  const importVolumeProducts = [
    { name: 'Hydrocarbures & gaz', value: '9,4', pct: 94, icon: '⛽' },
    { name: 'Minerais & métaux bruts', value: '4,8', pct: 48, icon: '⛏️' },
    { name: 'Engrais & phosphates', value: '3,9', pct: 39, icon: '🌾' },
    { name: 'Produits agricoles', value: '2,2', pct: 22, icon: '🫒' },
    { name: 'Câblage & composants auto', value: '1,4', pct: 14, icon: '🔌' },
    { name: 'Produits de la mer', value: '0,7', pct: 7, icon: '🐟' },
    { name: 'Textiles confectionnés', value: '0,3', pct: 3, icon: '🧵' },
  ];

  const currentVolumeList = volumeTab === 'export' ? exportVolumeProducts : importVolumeProducts;

  // Top 5 Products in Growth
  const topGrowthProducts = [
    { rank: 1, name: 'Panneaux solaires', growth: '+68%', icon: '☀️' },
    { rank: 2, name: 'Batteries lithium', growth: '+52%', icon: '🔋' },
    { rank: 3, name: 'Vêtements techniques', growth: '+45%', icon: '👔' },
    { rank: 4, name: 'Engrais agricoles', growth: '+38%', icon: '🌾' },
    { rank: 5, name: 'Véhicules électriques', growth: '+36%', icon: '⚡' },
  ];

  // 8 High Potential Products matching screenshot
  const highPotentialProducts = [
    {
      id: 'hp-1',
      name: 'Panneaux solaires',
      tag1: 'Énergie',
      tag2: 'Import',
      growth: '68%',
      image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'hp-2',
      name: 'Smartphones',
      tag1: 'Électronique',
      tag2: 'Import',
      growth: '52%',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'hp-3',
      name: 'Textile technique',
      tag1: 'Textile',
      tag2: 'Export',
      growth: '45%',
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'hp-4',
      name: 'Huile d’olive',
      tag1: 'Agroalimentaire',
      tag2: 'Export',
      growth: '38%',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'hp-5',
      name: 'Matériel médical',
      tag1: 'Santé',
      tag2: 'Import',
      growth: '34%',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'hp-6',
      name: 'Pièces automobiles',
      tag1: 'Automobile',
      tag2: 'Import',
      growth: '32%',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'hp-7',
      name: 'Meubles modernes',
      tag1: 'Ameublement',
      tag2: 'Export',
      growth: '28%',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'hp-8',
      name: 'Produits cosmétiques',
      tag1: 'Cosmétique',
      tag2: 'Export',
      growth: '26%',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80',
    },
  ];

  // Useful Resources matching screenshot
  const usefulResources = [
    { title: 'Catalogue des produits prioritaires', size: 'PDF - 2,4 MB' },
    { title: 'Guide d’importation depuis la Chine', size: 'PDF - 1,8 MB' },
    { title: 'Étude sur la demande en Afrique du Nord', size: 'PDF - 3,1 MB' },
    { title: 'HS Codes et réglementation', size: 'PDF - 1,2 MB' },
  ];

  // Latest Analysis Articles matching screenshot
  const latestArticles = [
    {
      title: 'Produits chinois : quelles opportunités pour l’Afrique du Nord ?',
      date: '5 Août 2024',
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=200&q=80',
    },
    {
      title: 'La demande croissante pour les véhicules électriques',
      date: '28 Juillet 2024',
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80',
    },
    {
      title: 'Textile technique : un secteur prometteur',
      date: '20 Juillet 2024',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=200&q=80',
    },
    {
      title: 'Produits agricoles : vers une coopération plus forte',
      date: '12 Juillet 2024',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. SEARCH & 4 DROPDOWN FILTERS BAR                                        */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          
          {/* 4 Selects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            
            {/* 1. Direction commerciale */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Direction commerciale</label>
              <div className="relative">
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option>Toutes les directions</option>
                  <option>Chine → Afrique du Nord</option>
                  <option>Afrique du Nord → Chine</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Pays */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pays</label>
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

            {/* 3. Catégorie de produits */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Catégorie de produits</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option>Toutes les catégories</option>
                  <option>Machines & équipements</option>
                  <option>Produits électroniques</option>
                  <option>Textiles & habillement</option>
                  <option>Produits chimiques</option>
                  <option>Agroalimentaire</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. Sous-catégorie */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sous-catégorie</label>
              <div className="relative">
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option>Toutes les sous-catégories</option>
                  <option>Smartphones</option>
                  <option>Panneaux solaires</option>
                  <option>Batteries lithium</option>
                  <option>Huile d'olive</option>
                  <option>Véhicules électriques</option>
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
              placeholder="Rechercher un produit, HS code..."
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
      {/* 2. FIVE KPI METRICS CARDS (EXACT MATCH SCREENSHOT)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-shadow flex items-start justify-between"
            >
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {m.value}
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-1 leading-snug">
                  {m.label}
                </div>
                <div className="text-[11px] font-bold text-emerald-600 mt-2">
                  {m.change}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. ROW 1: 3 ANALYTICS VISUALS (VOLUME, CROISSANCE, RÉPARTITION)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Produits par volume d'échanges (2024) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">
              Produits par volume d'échanges <span className="text-slate-400 font-normal text-xs">(2024)</span>
            </h3>

            {/* Toggle Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
              <button
                onClick={() => setVolumeTab('export')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  volumeTab === 'export'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Exportations de la Chine
              </button>
              <button
                onClick={() => setVolumeTab('import')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  volumeTab === 'import'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Importations de l'Afrique du Nord
              </button>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="space-y-2">
              {currentVolumeList.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800 truncate">
                      <span className="text-xs">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 ml-2">{item.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${item.pct}%` }}
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Scale Axis */}
            <div className="flex justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-100 mt-3 font-semibold">
              <span>Mds USD</span>
              <span>0</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Col 2: Croissance des principaux produits (Multi-line chart) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Croissance des principaux produits
              </h3>
              <select
                value={growthPeriod}
                onChange={(e) => setGrowthPeriod(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer"
              >
                <option>2020 - 2024</option>
                <option>2022 - 2024</option>
                <option>2023 - 2024</option>
              </select>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10.5px] text-slate-600 font-medium mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                <span className="truncate">Produits électroniques</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-700 shrink-0" />
                <span className="truncate">Machines & équipements</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                <span className="truncate">Textiles & habillement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">Produits agricoles</span>
              </div>
            </div>

            {/* SVG Line Graph Simulation (Indice 2020 = 100) */}
            <div className="relative h-[180px] w-full pt-2">
              <svg viewBox="0 0 300 160" className="w-full h-full overflow-visible">
                {/* Horizontal Grid lines */}
                <line x1="30" y1="20" x2="290" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="50" x2="290" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="80" x2="290" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="110" x2="290" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="140" x2="290" y2="140" stroke="#e2e8f0" strokeWidth="1" />

                {/* Y-axis Labels */}
                <text x="5" y="24" fontSize="8" fill="#94a3b8">250</text>
                <text x="5" y="54" fontSize="8" fill="#94a3b8">200</text>
                <text x="5" y="84" fontSize="8" fill="#94a3b8">150</text>
                <text x="5" y="114" fontSize="8" fill="#94a3b8">100</text>
                <text x="5" y="144" fontSize="8" fill="#94a3b8">0</text>

                {/* Line 1: Electronics (Red) */}
                <polyline
                  points="30,110 95,95 160,78 225,60 290,40"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                />
                <circle cx="290" cy="40" r="3.5" fill="#ef4444" />

                {/* Line 2: Machinery (Blue) */}
                <polyline
                  points="30,110 95,102 160,88 225,75 290,55"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="2.5"
                />
                <circle cx="290" cy="55" r="3.5" fill="#1d4ed8" />

                {/* Line 3: Textile (Sky) */}
                <polyline
                  points="30,110 95,108 160,98 225,92 290,82"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2"
                />
                <circle cx="290" cy="82" r="3" fill="#0284c7" />

                {/* Line 4: Agriculture (Amber) */}
                <polyline
                  points="30,110 95,115 160,118 225,120 290,112"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
                <circle cx="290" cy="112" r="3" fill="#f59e0b" />
              </svg>

              {/* X-axis labels */}
              <div className="flex justify-between pl-8 pr-1 text-[10px] text-slate-400 font-semibold mt-1">
                <span>2020</span>
                <span>2021</span>
                <span>2022</span>
                <span>2023</span>
                <span>2024</span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Répartition des échanges par catégorie (Donut) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 tracking-tight">
              Répartition des échanges par catégorie
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">(en % du total, 2024)</p>

            <div className="flex items-center gap-4 my-1">
              {/* Donut Chart */}
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#1d4ed8" strokeWidth="4.5" strokeDasharray="28 72" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#0284c7" strokeWidth="4.5" strokeDasharray="24 76" strokeDashoffset="-28" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="16 84" strokeDashoffset="-52" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="10 90" strokeDashoffset="-68" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="8 92" strokeDashoffset="-78" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="4.5" strokeDasharray="6 94" strokeDashoffset="-86" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#d97706" strokeWidth="4.5" strokeDasharray="5 95" strokeDashoffset="-92" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#94a3b8" strokeWidth="4.5" strokeDasharray="3 97" strokeDashoffset="-97" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-black text-slate-900 leading-none">46,8</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Mds USD</span>
                  <span className="text-[8px] text-slate-400">(Total)</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1 text-[10.5px] flex-1">
                {[
                  { label: 'Machines & équipements', pct: '28%', color: 'bg-blue-700' },
                  { label: 'Produits électroniques', pct: '24%', color: 'bg-sky-600' },
                  { label: 'Textiles & habillement', pct: '16%', color: 'bg-blue-500' },
                  { label: 'Produits chimiques', pct: '10%', color: 'bg-red-500' },
                  { label: 'Produits agricoles', pct: '8%', color: 'bg-amber-500' },
                  { label: 'Métaux & minerais', pct: '6%', color: 'bg-purple-500' },
                  { label: 'Plastiques & caoutchouc', pct: '5%', color: 'bg-amber-600' },
                  { label: 'Autres', pct: '3%', color: 'bg-slate-400' },
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

      </div>

      {/* ========================================================================= */}
      {/* 4. ROW 2: TOP 5 CROISSANCE (LEFT) & PRODUITS A FORT POTENTIEL (RIGHT)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Top 5 produits en croissance */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 tracking-tight">
              Top 5 produits en croissance
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2 pr-2">Produit</th>
                    <th className="py-2 px-1 text-center">Taux de croissance<br />(2020-2024)</th>
                    <th className="py-2 pl-2 text-right">Opportunités</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-800">
                  {topGrowthProducts.map((p) => (
                    <tr key={p.rank} className="hover:bg-slate-50">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 w-3">{p.rank}</span>
                          <span className="text-base select-none">{p.icon}</span>
                          <span className="font-bold text-slate-900 truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-1 text-center font-black text-emerald-600">
                        {p.growth}
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <button
                          onClick={() => setSelectedProductModal(p.name)}
                          className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <span className="text-[10px] text-emerald-600 font-bold">📶</span>
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <button
              onClick={() => {}}
              className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tous les produits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Produits à fort potentiel (Grid of 8 cards) */}
        <div id="produits-a-fort-potentiel" className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Produits à fort potentiel
              </h3>
              <button
                onClick={() => {}}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Voir plus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4x2 Grid of 8 Product Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {highPotentialProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProductModal(prod.name)}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="h-24 overflow-hidden relative bg-slate-100">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate mb-1">
                        {prod.name}
                      </h4>
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-500 mb-2">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm">{prod.tag1}</span>
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-sm">{prod.tag2}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black text-emerald-600 pt-1.5 border-t border-slate-100">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{prod.growth}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. ROW 3: MARCHÉS CIBLES (LEFT), RESSOURCES (MID), DERNIÈRES ANALYSES (RIGHT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Marchés cibles en Afrique du Nord */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 tracking-tight">
              Marchés cibles en Afrique du Nord
            </h3>

            {/* Real Geographic Map of North Africa with Country Badges (Matching Screenshot) */}
            <NorthAfricaTargetMarketsMap onSelectCountry={(c) => setCountry(c)} />
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={() => onSelectTab('flux-commerciaux')}
              className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Voir le détail par pays</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Col 2: Ressources utiles */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 tracking-tight">
              Ressources utiles
            </h3>

            <div className="space-y-2.5">
              {usefulResources.map((res, i) => (
                <div
                  key={i}
                  onClick={() => setDownloadModalDoc(res.title)}
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {res.title}
                      </div>
                      <div className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                        <span>PDF</span>
                        <span>•</span>
                        <span className="text-slate-500 font-normal">{res.size.replace('PDF - ', '')}</span>
                      </div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-red-500 group-hover:text-red-600 shrink-0 ml-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3: Dernières analyses */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Dernières analyses
              </h3>
              <button
                onClick={() => onSelectTab('analyses')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
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
                  className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="w-11 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {art.title}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {art.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: PRODUCT DETAIL                                                  */}
      {/* ========================================================================= */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setSelectedProductModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Fiche produit : {selectedProductModal}
                </h3>
                <p className="text-xs text-slate-500">Flux d’import-export, tarifs douaniers et opportunités</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Ce segment affiche une forte croissance annuelle moyenne (+35% à +68%) stimulée par les accords bilatéraux et la modernisation des filières industrielles.
              </p>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarif douanier moyen :</span>
                  <span className="font-bold text-slate-900">0% à 5% (selon pays)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Principaux débouchés :</span>
                  <span className="font-bold text-slate-900">Maroc, Algérie, Égypte</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Conformité requise :</span>
                  <span className="font-bold text-slate-900">Certificat CE / Norme NM / Inspection douane</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedProductModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setSelectedProductModal(null);
                  onSelectTab('opportunites');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Voir les opportunités d'affaires
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: RESOURCE DOWNLOAD                                               */}
      {/* ========================================================================= */}
      {downloadModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center relative">
            <button
              onClick={() => setDownloadModalDoc(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Télécharger le document
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-semibold">
              « {downloadModalDoc} »
            </p>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Le document PDF haute résolution et les tableaux statistiques associés sont prêts pour le téléchargement.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDownloadModalDoc(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  alert(`Le téléchargement de « ${downloadModalDoc} » a débuté.`);
                  setDownloadModalDoc(null);
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
