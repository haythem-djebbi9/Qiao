import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowRight,
  ChevronDown,
  RotateCcw,
  Scale,
  Download,
  Building2,
  FileText,
  Layers,
  Sparkles,
  ArrowUpRight,
  Globe,
  Ship,
  Compass,
  Users,
  Factory,
  Cpu,
  Shirt,
  FlaskConical,
  Car,
  Flame,
  Wheat,
  Gem,
  Scissors
} from 'lucide-react';
import { CommerceHubTab } from '../../../types';
import { CompactRealTradeMap } from '../components/CompactRealTradeMap';
import nightSkylineImg from '../../../assets/images/china_corridor_night_skyline_1790804583067.jpg';
import cargoShipImg from '../../../assets/images/ecommerce_hero_cargo_ship_1790887696581.jpg';
import bridgeImg from '../../../assets/images/qiao_bridge_red_blue_1787498218294.jpg';
import portImg from '../../../assets/images/container_port_cargo_1790805153002.jpg';

interface FluxCommerciauxTabProps {
  onSelectTab: (tab: CommerceHubTab) => void;
  onOpenReport?: (title: string) => void;
}

export const FluxCommerciauxTab: React.FC<FluxCommerciauxTabProps> = ({
  onSelectTab,
  onOpenReport,
}) => {
  const [period, setPeriod] = useState('2020 - 2024');
  const [fluxType, setFluxType] = useState('Tous les flux');
  const [country, setCountry] = useState('Tous les pays');
  const [category, setCategory] = useState('Toutes les catégories');
  const [countryTab, setCountryTab] = useState<'export' | 'import' | 'total'>('export');
  const [chartPeriod, setChartPeriod] = useState('2020 - 2024');

  const handleResetFilters = () => {
    setPeriod('2020 - 2024');
    setFluxType('Tous les flux');
    setCountry('Tous les pays');
    setCategory('Toutes les catégories');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. FILTER BAR (MATCHING SCREENSHOT)                                       */}
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
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>2020 - 2024</option>
                <option>2023 - 2024</option>
                <option>2018 - 2024</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Flux */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Flux</label>
            <div className="relative">
              <select
                value={fluxType}
                onChange={(e) => setFluxType(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Tous les flux</option>
                <option>Exportations (Chine → Afrique du Nord)</option>
                <option>Importations (Afrique du Nord → Chine)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Pays d'Afrique du Nord */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pays d'Afrique du Nord</label>
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

          {/* Catégorie de produits */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Catégorie de produits</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Toutes les catégories</option>
                <option>Machines & équipements</option>
                <option>Électronique & High-Tech</option>
                <option>Hydrocarbures & Énergie</option>
                <option>Produits agricoles</option>
                <option>Textiles & Habillement</option>
                <option>Produits chimiques</option>
                <option>Véhicules & Automobile</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Reset Button */}
          <div>
            <button
              onClick={handleResetFilters}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Réinitialiser les filtres</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FOUR METRIC CARDS (ROW 1)                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Échanges commerciaux totaux */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 leading-snug">
              Échanges commerciaux totaux
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">46,8 Mds</span>
              <span className="text-xs font-bold text-blue-600 uppercase">USD</span>
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>↑ +18%</span>
              <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
            </div>
          </div>
        </div>

        {/* Card 2: Exportations de la Chine → Afrique du Nord */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center shrink-0">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 leading-snug">
              Exportations de la Chine → Afrique du Nord
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">24,1 Mds</span>
              <span className="text-xs font-bold text-blue-600 uppercase">USD</span>
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>↑ +20%</span>
              <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
            </div>
          </div>
        </div>

        {/* Card 3: Importations de l'Afrique du Nord → Chine */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center shrink-0">
            <Ship className="w-6 h-6 transform -scale-x-100" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 leading-snug">
              Importations de l'Afrique du Nord → Chine
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">22,7 Mds</span>
              <span className="text-xs font-bold text-blue-600 uppercase">USD</span>
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>↑ +16%</span>
              <span className="text-slate-400 font-normal text-[11px]">vs 2023</span>
            </div>
          </div>
        </div>

        {/* Card 4: Balance commerciale */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0c4a9e] flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 leading-snug">
              Balance commerciale
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">+1,4 Mds</span>
              <span className="text-xs font-bold text-blue-600 uppercase">USD</span>
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              en faveur de la Chine
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. ROW 2: MAP / ÉVOLUTION DES ÉCHANGES / CORRIDORS COMMERCIAUX             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Flux commerciaux Chine ↔ Afrique du Nord (2024) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">
              Flux commerciaux Chine ↔ Afrique du Nord (2024)
            </h3>

            <CompactRealTradeMap
              onSelectCountry={(c) => {
                const mapNames: Record<string, string> = {
                  morocco: 'Maroc',
                  algeria: 'Algérie',
                  tunisia: 'Tunisie',
                  egypt: 'Égypte',
                  libya: 'Libye',
                };
                if (mapNames[c]) setCountry(mapNames[c]);
              }}
            />
          </div>

          {/* Bottom row: Legend on left, Action Button on right */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
            <div className="space-y-1 text-[10px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                <span>Exportations (Chine ↔ Afrique du Nord)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0284c7] shrink-0" />
                <span>Importations (Afrique du Nord → Chine)</span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('produits')}
              className="py-2 px-3.5 rounded-xl bg-[#0066cc] hover:bg-[#0055b3] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
            >
              <span>Voir le détail par pays</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Col 2: Évolution des échanges */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header + Dropdown */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#0f2c69] tracking-tight">
                Évolution des échanges
              </h3>
              <div className="relative">
                <select
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1 pr-7 text-xs font-semibold text-[#0f2c69] shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option>2020 - 2024</option>
                  <option>2018 - 2024</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#0f2c69] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Subtitle & CAGR Badge */}
            <div className="flex items-end justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500">Mds USD</span>
              
              {/* Badge matching image.png */}
              <div className="bg-[#e8f7fa] border border-[#d0f0f5] rounded-xl px-3.5 py-1.5 flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#0d9488]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                  <line x1="2" y1="21" x2="22" y2="21" strokeWidth="2" />
                </svg>
                <div>
                  <div className="text-base sm:text-lg font-black text-[#0f2c69] leading-tight">+18%</div>
                  <div className="text-[10px] font-bold text-[#0f2c69]/80 whitespace-nowrap">CAGR (2020-2024)</div>
                </div>
              </div>
            </div>

            {/* Chart Area with Y-axis line and Grid lines */}
            <div className="relative w-full pt-4 pb-1 pl-4">
              
              {/* Vertical Y-axis line with upward arrow on left */}
              <div className="absolute left-1 top-2 bottom-6 flex flex-col items-center pointer-events-none">
                <span className="text-[8px] text-slate-400 font-bold -mb-1 leading-none">▲</span>
                <div className="w-[1px] flex-1 bg-slate-200" />
              </div>

              {/* Horizontal gridlines */}
              <div className="absolute left-1 right-0 top-6 bottom-6 flex flex-col justify-between pointer-events-none opacity-80">
                <div className="border-b border-slate-100 w-full" />
                <div className="border-b border-slate-100 w-full" />
                <div className="border-b border-slate-100 w-full" />
                <div className="border-b border-slate-200 w-full" /> {/* baseline */}
              </div>

              {/* Bars Row */}
              <div className="relative z-10 flex items-end justify-between gap-1 sm:gap-2 px-1 sm:px-2 h-[180px]">
                {[
                  { year: '2020', exp: '28,1', imp: '18,4', expPx: 92, impPx: 60 },
                  { year: '2021', exp: '32,5', imp: '20,1', expPx: 106, impPx: 66 },
                  { year: '2022', exp: '39,6', imp: '22,8', expPx: 129, impPx: 74 },
                  { year: '2023', exp: '45,8', imp: '26,4', expPx: 149, impPx: 86 },
                  { year: '2024', exp: '46,8', imp: '24,1', expPx: 153, impPx: 79 },
                ].map((item) => (
                  <div key={item.year} className="flex-1 flex flex-col items-center justify-end">
                    {/* The two bars side by side */}
                    <div className="flex items-end justify-center gap-[2px]">
                      {/* Dark Blue Export Bar */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10.5px] font-extrabold text-slate-800 leading-none mb-1">
                          {item.exp}
                        </span>
                        <div
                          style={{ height: `${item.expPx}px` }}
                          className="w-4 sm:w-5 bg-[#005bb5] hover:bg-[#004899] rounded-t-xs transition-all"
                        />
                      </div>

                      {/* Light Blue Import Bar */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10.5px] font-extrabold text-slate-800 leading-none mb-1">
                          {item.imp}
                        </span>
                        <div
                          style={{ height: `${item.impPx}px` }}
                          className="w-4 sm:w-5 bg-[#60b5ff] hover:bg-[#48a8ff] rounded-t-xs transition-all"
                        />
                      </div>
                    </div>

                    {/* Year Label below baseline */}
                    <span className="text-xs font-semibold text-slate-500 mt-2">
                      {item.year}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Bottom Legend */}
          <div className="flex items-center justify-center gap-8 pt-3 border-t border-slate-100 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#005bb5]" />
              <span className="text-xs font-bold text-[#0f2c69]">Exportations</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#60b5ff]" />
              <span className="text-xs font-bold text-[#0f2c69]">Importations</span>
            </div>
          </div>
        </div>

        {/* Col 3: Principaux corridors commerciaux */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Principaux corridors commerciaux
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mb-3 mt-0.5">Mds USD (2024)</p>

            <div className="space-y-3 mt-4">
              {[
                { name: 'Chine ↔ Maroc', value: '8,4', width: '92%' },
                { name: 'Chine ↔ Algérie', value: '7,9', width: '86%' },
                { name: 'Chine ↔ Égypte', value: '7,1', width: '78%' },
                { name: 'Chine ↔ Tunisie', value: '5,6', width: '61%' },
                { name: 'Chine ↔ Libye', value: '4,3', width: '47%' },
              ].map((corridor) => (
                <div key={corridor.name} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700 w-28 shrink-0">
                    {corridor.name}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      style={{ width: corridor.width }}
                      className="bg-[#0066cc] h-full rounded-full transition-all duration-500"
                    />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 w-7 text-right shrink-0">
                    {corridor.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end mt-4">
            <button
              onClick={() => onSelectTab('produits')}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tous les corridors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. ROW 3: TOP 5 EXPORTS / TOP 5 IMPORTS / RÉPARTITION PAR PAYS            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Top 5 produits exportés par la Chine */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Top 5 produits exportés par la Chine
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mb-3 mt-0.5">Mds USD (2024)</p>

            <div className="space-y-2 mt-2">
              {[
                { rank: 1, name: 'Machines & équipements', value: '8,2', icon: <Factory className="w-3.5 h-3.5 text-blue-700" /> },
                { rank: 2, name: 'Produits électroniques', value: '6,1', icon: <Cpu className="w-3.5 h-3.5 text-blue-700" /> },
                { rank: 3, name: 'Textiles & habillement', value: '3,4', icon: <Shirt className="w-3.5 h-3.5 text-blue-700" /> },
                { rank: 4, name: 'Produits chimiques', value: '2,8', icon: <FlaskConical className="w-3.5 h-3.5 text-blue-700" /> },
                { rank: 5, name: 'Véhicules & pièces', value: '2,1', icon: <Car className="w-3.5 h-3.5 text-blue-700" /> },
              ].map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black flex items-center justify-center">
                      {item.rank}
                    </span>
                    <div className="w-5 h-5 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end mt-4">
            <button
              onClick={() => onSelectTab('produits')}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tous les produits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Col 2: Top 5 produits importés d'Afrique du Nord */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Top 5 produits importés d'Afrique du Nord
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mb-3 mt-0.5">Mds USD (2024)</p>

            <div className="space-y-2 mt-2">
              {[
                { rank: 1, name: 'Hydrocarbures (pétrole & gaz)', value: '12,5', icon: <Flame className="w-3.5 h-3.5 text-blue-700" /> },
                { rank: 2, name: 'Produits agricoles (huile d’olive, dattes)', value: '4,1', icon: <Wheat className="w-3.5 h-3.5 text-blue-700" /> },
                { rank: 3, name: 'Minerais & métaux', value: '2,8', icon: <Gem className="w-3.5 h-3.5 text-blue-700" /> },
                { rank: 4, name: 'Produits chimiques', value: '1,9', icon: <FlaskConical className="w-3.5 h-3.5 text-blue-700" /> },
                { rank: 5, name: 'Textiles & cuir', value: '1,4', icon: <Scissors className="w-3.5 h-3.5 text-blue-700" /> },
              ].map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black flex items-center justify-center">
                      {item.rank}
                    </span>
                    <div className="w-5 h-5 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end mt-4">
            <button
              onClick={() => onSelectTab('produits')}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tous les produits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Col 3: Répartition des échanges par pays */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-3">
              Répartition des échanges par pays
            </h3>

            {/* Filter Tabs: Exportations / Importations / Total */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
              <button
                onClick={() => setCountryTab('export')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                  countryTab === 'export' ? 'bg-[#0066cc] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Exportations
              </button>
              <button
                onClick={() => setCountryTab('import')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                  countryTab === 'import' ? 'bg-[#0066cc] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Importations
              </button>
              <button
                onClick={() => setCountryTab('total')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                  countryTab === 'total' ? 'bg-[#0066cc] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Total
              </button>
            </div>

            {/* Donut Chart and Legend */}
            <div className="flex items-center gap-4 my-2">
              {/* Donut */}
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {/* Maroc 35% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#2563eb" strokeWidth="4.5" strokeDasharray="35 65" strokeDashoffset="0" />
                  {/* Algérie 28% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#38bdf8" strokeWidth="4.5" strokeDasharray="28 72" strokeDashoffset="-35" />
                  {/* Égypte 20% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f97316" strokeWidth="4.5" strokeDasharray="20 80" strokeDashoffset="-63" />
                  {/* Tunisie 12% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#ec4899" strokeWidth="4.5" strokeDasharray="12 88" strokeDashoffset="-83" />
                  {/* Libye 5% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="5 95" strokeDashoffset="-95" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-sm font-black text-slate-900 leading-tight">24,1</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Mds USD</span>
                  <span className="text-[7.5px] font-semibold text-slate-400">(Exportations)</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 text-xs flex-1">
                {[
                  { country: 'Maroc', pct: '35%', color: '#2563eb' },
                  { country: 'Algérie', pct: '28%', color: '#38bdf8' },
                  { country: 'Égypte', pct: '20%', color: '#f97316' },
                  { country: 'Tunisie', pct: '12%', color: '#ec4899' },
                  { country: 'Libye', pct: '5%', color: '#ef4444' },
                ].map((item) => (
                  <div key={item.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 font-medium">{item.country}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end mt-4">
            <button
              onClick={() => onSelectTab('produits')}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir la répartition détaillée</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. ROW 4: TENDANCES ET PERSPECTIVES + RAPPORTS LIÉS                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Tendances et perspectives with Panoramic Night Cityscape */}
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden shadow-xs border border-slate-800 text-white min-h-[220px] flex flex-col justify-between p-6">
          {/* Background image + dark overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={nightSkylineImg}
              alt="Tendances et perspectives"
              className="w-full h-full object-cover brightness-50"
            />
            <div className="absolute inset-0 bg-[#08182b]/85 backdrop-blur-[1px]" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <h3 className="text-base font-bold text-white tracking-tight mb-5">
              Tendances et perspectives
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Item 1 */}
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-full bg-[#0066cc]/40 border border-[#38bdf8]/40 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[#38bdf8]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Croissance continue</h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    +18% de croissance annuelle des échanges
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-full bg-[#0066cc]/40 border border-[#38bdf8]/40 flex items-center justify-center">
                  <Compass className="w-4 h-4 text-[#38bdf8]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Diversification</h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    De nouveaux produits et secteurs émergents
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-full bg-[#0066cc]/40 border border-[#38bdf8]/40 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#38bdf8]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Opportunités B2B</h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Des marchés en forte demande
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-full bg-[#0066cc]/40 border border-[#38bdf8]/40 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-[#38bdf8]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Partenariats stratégiques</h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Une coopération plus durable et équilibrée
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Rapports & analyses liés */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Rapports & analyses liés
              </h3>
              <button
                onClick={() => onSelectTab('rapports')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Voir tous les rapports</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: 'Le commerce sino-nord-africain en 2024 : chiffres et tendances',
                  size: 'PDF · 2,4 MB',
                  image: cargoShipImg,
                },
                {
                  title: 'Les opportunités par produit et par pays',
                  size: 'PDF · 3,1 MB',
                  image: bridgeImg,
                },
                {
                  title: 'Perspectives 2025 : vers un partenariat renforcé',
                  size: 'PDF · 1,8 MB',
                  image: portImg,
                },
              ].map((rep, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenReport?.(rep.title)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={rep.image}
                      alt={rep.title}
                      className="w-12 h-10 rounded-lg object-cover shrink-0 shadow-2xs border border-slate-200/60"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {rep.title}
                      </h4>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1 py-0.2 rounded bg-red-50 text-red-600 font-bold border border-red-100 text-[8.5px]">
                          PDF
                        </span>
                        <span>{rep.size.replace('PDF · ', '')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenReport?.(rep.title);
                    }}
                    className="w-7 h-7 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
