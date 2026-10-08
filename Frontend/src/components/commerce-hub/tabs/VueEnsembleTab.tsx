import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Building2,
  Package,
  Layers,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Globe,
  Truck,
  FileText,
  Search,
  ShoppingCart
} from 'lucide-react';
import { CommerceHubTab } from '../../../types';
import { BilateralTradeMap } from '../components/BilateralTradeMap';

interface VueEnsembleTabProps {
  onSelectTab: (tab: CommerceHubTab) => void;
  onOpenOpportunityDetail?: (oppId: string) => void;
}

const CHINESE_COMPANIES_LOGOS = [
  {
    id: 'alibaba',
    name: 'Alibaba',
    component: (
      <div className="flex items-center gap-1 select-none max-w-full">
        <svg viewBox="0 0 40 32" className="w-4.5 h-4 shrink-0" fill="none">
          <path
            d="M 5,20 C 12,28 28,28 35,20 C 32,24 22,27 12,24 C 8,23 6,21 5,20 Z"
            fill="#ff6000"
          />
          <path
            d="M 14,8 C 19,4 27,6 30,12 C 32,16 28,22 22,23 C 16,24 10,20 10,15 C 10,10 13,8 17,8 C 21,8 24,11 23,15 C 23,18 20,20 17,19"
            stroke="#ff6000"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-xs sm:text-sm font-extrabold text-[#ff6000] tracking-tight font-sans">
          Alibaba
        </span>
      </div>
    ),
  },
  {
    id: 'jd',
    name: 'JD.COM',
    component: (
      <div className="flex items-center gap-1 select-none max-w-full">
        <svg viewBox="0 0 36 36" className="w-5 h-5 shrink-0" fill="none">
          <path
            d="M 8,24 Q 14,28 24,24 Q 28,16 26,10 Q 20,6 14,9 Q 7,14 8,24 Z"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1.2"
          />
          <path d="M 12,10 Q 9,5 6,8 Q 7,12 11,11" fill="#cbd5e1" />
          <circle cx="25" cy="15" r="2.5" fill="#1e293b" />
          <circle cx="18" cy="12" r="1.8" fill="#1e293b" />
          <path d="M 10,21 Q 14,24 20,22 Q 22,25 24,25 Q 16,27 10,21" fill="#e1251b" />
          <path d="M 12,26 L 10,32 M 18,26 L 17,33 M 23,24 L 26,30" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-xs sm:text-sm font-extrabold text-[#e1251b] tracking-tight font-sans">
          JD.COM
        </span>
      </div>
    ),
  },
  {
    id: 'huawei',
    name: 'HUAWEI',
    component: (
      <div className="flex flex-col items-center justify-center select-none max-w-full">
        <svg viewBox="0 0 50 36" className="w-6 h-5" fill="none">
          <path d="M 25,3 C 24,10 24,16 25,22 C 26,16 26,10 25,3 Z" fill="#cf0a2c" />
          <path d="M 25,22 C 21,17 19,11 19,5 C 22,10 23,16 25,22 Z" fill="#cf0a2c" />
          <path d="M 25,22 C 29,17 31,11 31,5 C 28,10 27,16 25,22 Z" fill="#cf0a2c" />
          <path d="M 25,22 C 17,19 14,14 13,8 C 17,12 21,17 25,22 Z" fill="#cf0a2c" />
          <path d="M 25,22 C 33,19 36,14 37,8 C 33,12 29,17 25,22 Z" fill="#cf0a2c" />
          <path d="M 25,22 C 14,21 10,17 7,12 C 12,15 18,19 25,22 Z" fill="#cf0a2c" />
          <path d="M 25,22 C 36,21 40,17 43,12 C 38,15 32,19 25,22 Z" fill="#cf0a2c" />
          <path d="M 25,22 C 11,23 6,21 2,17 C 8,18 16,21 25,22 Z" fill="#cf0a2c" />
          <path d="M 25,22 C 39,23 44,21 48,17 C 42,18 34,21 25,22 Z" fill="#cf0a2c" />
        </svg>
        <span className="text-[8px] sm:text-[9px] font-black text-slate-900 tracking-[0.14em] uppercase font-sans mt-0.5">
          HUAWEI
        </span>
      </div>
    ),
  },
  {
    id: 'shein',
    name: 'SHEIN',
    component: (
      <span className="text-xs sm:text-sm font-black text-black tracking-[0.12em] uppercase font-sans select-none">
        SHEIN
      </span>
    ),
  },
  {
    id: 'zte',
    name: 'ZTE',
    component: (
      <span className="text-base sm:text-lg font-black text-[#0075c9] tracking-tight font-sans select-none">
        ZTE
      </span>
    ),
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi',
    component: (
      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#ff6900] rounded-lg sm:rounded-xl flex items-center justify-center shadow-2xs select-none shrink-0">
        <svg viewBox="0 0 32 32" className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="white">
          <rect x="7" y="9" width="3" height="14" rx="1.5" />
          <path d="M 10,13 Q 14,9 18,13 L 18,23 L 15,23 L 15,14 Q 13,11.5 10,13 Z" />
          <path d="M 18,13 Q 22,9 26,13 L 26,23 L 23,23 L 23,14 Q 21,11.5 18,13 Z" />
          <rect x="23" y="14" width="3" height="9" rx="1" />
          <circle cx="24.5" cy="10.5" r="1.5" />
        </svg>
      </div>
    ),
  },
  {
    id: 'lenovo',
    name: 'Lenovo',
    component: (
      <span className="text-xs sm:text-sm font-black text-[#e2231a] tracking-tight font-sans select-none">
        Lenovo
      </span>
    ),
  },
  {
    id: 'bytedance',
    name: 'ByteDance',
    component: (
      <div className="flex items-center gap-1 select-none max-w-full">
        <div className="flex items-end gap-0.5 h-4 shrink-0">
          <span className="w-1 h-2.5 bg-[#1f56ff] rounded-2xs" />
          <span className="w-1 h-4 bg-[#00d0bf] rounded-2xs" />
          <span className="w-1 h-2 bg-[#1f56ff] rounded-2xs" />
          <span className="w-1 h-3.5 bg-[#00d0bf] rounded-2xs" />
        </div>
        <span className="text-[11px] sm:text-xs font-bold text-[#1f2329] tracking-tight font-sans">
          ByteDance
        </span>
      </div>
    ),
  },
  {
    id: 'haier',
    name: 'Haier',
    component: (
      <span className="text-xs sm:text-sm font-black text-[#005bac] tracking-tight font-sans select-none">
        Haier
      </span>
    ),
  },
];

export const VueEnsembleTab: React.FC<VueEnsembleTabProps> = ({
  onSelectTab,
  onOpenOpportunityDetail,
}) => {
  const [selectedYearRange, setSelectedYearRange] = useState('2020 - 2024');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. CHIFFRES CLÉS (2024)                                                   */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Chiffres clés <span className="text-slate-400 font-normal text-sm">(2024)</span>
          </h2>
          <button
            onClick={() => onSelectTab('flux-commerciaux')}
            className="text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Voir toutes les données</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">46,8 Mds</span>
                  <span className="text-xs font-bold text-blue-600 uppercase">USD</span>
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1 leading-snug">
                  Échanges commerciaux Chine ↔ Afrique du Nord
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +18% vs 2023
              </span>
              <span className="text-slate-400 text-[11px]">Source : Douanes</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">24,1 Mds</span>
                  <span className="text-xs font-bold text-red-600 uppercase">USD</span>
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1 leading-snug">
                  Exportations vers l'Afrique du Nord
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +20% vs 2023
              </span>
              <span className="text-slate-400 text-[11px]">Chine → NA</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">22,7 Mds</span>
                  <span className="text-xs font-bold text-blue-600 uppercase">USD</span>
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1 leading-snug">
                  Importations depuis l'Afrique du Nord
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +16% vs 2023
              </span>
              <span className="text-slate-400 text-[11px]">NA → Chine</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">6 200+</span>
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1 leading-snug">
                  Entreprises actives dans le secteur
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +12% vs 2023
              </span>
              <span className="text-slate-400 text-[11px]">Réseau certifié</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FLUX COMMERCIAUX CHINE ↔ AFRIQUE DU NORD (MATCHING USER SCREENSHOT)     */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-black text-[#0f2c69] tracking-tight">
          Flux commerciaux <span className="font-semibold text-slate-700">Chine ↔ Afrique du Nord</span>
        </h2>

        <BilateralTradeMap onViewAllFlux={() => onSelectTab('flux-commerciaux')} />
      </div>

      {/* ========================================================================= */}
      {/* 3. TWO-COLUMN SECTION: HISTORIC BAR CHART + DONUT BREAKDOWN               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Col 2: Bar Chart - Évolution des échanges */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">
                Évolution des échanges
              </h3>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                +18% CAGR (2020-2024)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
              <span>(Chine ↔ Afrique du Nord, Mds USD)</span>
              <span className="font-medium text-slate-700">{selectedYearRange}</span>
            </div>

            {/* SVG Grouped Bar Chart */}
            <div className="h-[210px] w-full flex items-end justify-between gap-3 pt-6 pb-2 px-1">
              {[
                { year: '2020', exp: 28.1, imp: 18.4 },
                { year: '2021', exp: 32.5, imp: 20.1 },
                { year: '2022', exp: 39.6, imp: 22.8 },
                { year: '2023', exp: 45.8, imp: 26.4 },
                { year: '2024', exp: 46.8, imp: 24.1 },
              ].map((item) => (
                <div key={item.year} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-[140px]">
                    {/* Export Bar */}
                    <div
                      style={{ height: `${(item.exp / 50) * 100}%` }}
                      className="w-3.5 sm:w-4.5 bg-blue-700 rounded-t-sm group-hover:bg-blue-800 transition-all relative"
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-slate-900 text-white px-1 rounded whitespace-nowrap z-20 pointer-events-none">
                        {item.exp}
                      </span>
                    </div>
                    {/* Import Bar */}
                    <div
                      style={{ height: `${(item.imp / 50) * 100}%` }}
                      className="w-3.5 sm:w-4.5 bg-sky-400 rounded-t-sm group-hover:bg-sky-500 transition-all relative"
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-slate-900 text-white px-1 rounded whitespace-nowrap z-20 pointer-events-none">
                        {item.imp}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 mt-2">{item.year}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-blue-700" />
                <span>Exportations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-sky-400" />
                <span>Importations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Donut Chart - Répartition par catégorie de produits */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Répartition par catégorie de produits
            </h3>
            <p className="text-xs text-slate-500 mb-3">(en % des échanges, 2024)</p>

            <div className="flex items-center gap-4 my-2">
              {/* Donut graphic */}
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {/* Segment 1: Machinerie 28% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#1d4ed8" strokeWidth="4.5" strokeDasharray="28 72" strokeDashoffset="0" />
                  {/* Segment 2: Électronique 24% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="24 76" strokeDashoffset="-28" />
                  {/* Segment 3: Textile 16% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#60a5fa" strokeWidth="4.5" strokeDasharray="16 84" strokeDashoffset="-52" />
                  {/* Segment 4: Chimique 10% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="10 90" strokeDashoffset="-68" />
                  {/* Segment 5: Agricole 8% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray="8 92" strokeDashoffset="-78" />
                  {/* Segment 6: Métaux 6% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="4.5" strokeDasharray="6 94" strokeDashoffset="-86" />
                  {/* Segment 7: Autres 8% */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#94a3b8" strokeWidth="4.5" strokeDasharray="8 92" strokeDashoffset="-92" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-extrabold text-slate-900 leading-none">46,8</span>
                  <span className="text-[9px] text-slate-500 font-bold">Mds USD</span>
                </div>
              </div>

              {/* Categories Breakdown List */}
              <div className="space-y-1 text-[11px] flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#1d4ed8]" />
                    <span className="text-slate-700 truncate">Machinerie & équipements</span>
                  </div>
                  <span className="font-bold text-slate-900 ml-1">28%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                    <span className="text-slate-700 truncate">Produits électroniques</span>
                  </div>
                  <span className="font-bold text-slate-900 ml-1">24%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#60a5fa]" />
                    <span className="text-slate-700 truncate">Textiles & habillement</span>
                  </div>
                  <span className="font-bold text-slate-900 ml-1">16%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                    <span className="text-slate-700 truncate">Produits chimiques</span>
                  </div>
                  <span className="font-bold text-slate-900 ml-1">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span className="text-slate-700 truncate">Produits agricoles</span>
                  </div>
                  <span className="font-bold text-slate-900 ml-1">8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                    <span className="text-slate-700 truncate">Métaux & minerais</span>
                  </div>
                  <span className="font-bold text-slate-900 ml-1">6%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#94a3b8]" />
                    <span className="text-slate-700 truncate">Autres</span>
                  </div>
                  <span className="font-bold text-slate-900 ml-1">8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SECTEURS ET PRODUITS EN FORTE CROISSANCE (6 CARDS WITH PHOTOS)         */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Secteurs et produits en forte croissance
          </h2>
          <button
            onClick={() => onSelectTab('produits')}
            className="text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Voir tous les secteurs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {[
            {
              title: 'Électronique & High-Tech',
              growth: '+28%',
              desc: 'Demande croissante en Afrique du Nord',
              image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'Textile & Mode',
              growth: '+22%',
              desc: 'Opportunités de production et de distribution',
              image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'Produits agricoles',
              growth: '+20%',
              desc: 'Exportations vers le marché chinois',
              image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'Matériaux de construction',
              growth: '+18%',
              desc: 'Grands projets d’infrastructure',
              image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'Produits automobiles',
              growth: '+16%',
              desc: 'Essor de la mobilité en Afrique du Nord',
              image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
            },
            {
              title: 'Produits pharmaceutiques',
              growth: '+14%',
              desc: 'Demande en croissance',
              image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => onSelectTab('produits')}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="h-28 overflow-hidden relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                  {item.growth}
                </span>
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end text-red-600 text-xs font-bold">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. THREE-COLUMN SECTION: OPPORTUNITÉS / ENTREPRISES / DERNIÈRES ANALYSES  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Opportunités à ne pas manquer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Opportunités à ne pas manquer
              </h3>
              <button
                onClick={() => onSelectTab('opportunites')}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Voir toutes les opportunités →
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'opp-1',
                  type: 'IMPORT',
                  typeColor: 'bg-blue-50 text-blue-700 border-blue-200',
                  title: 'Distributeurs de produits électroniques en Afrique du Nord',
                  location: 'Algérie, Maroc, Tunisie',
                  timeAgo: 'Il y a 2 jours',
                },
                {
                  id: 'opp-2',
                  type: 'EXPORT',
                  typeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  title: 'Huile d’olive tunisienne vers la Chine',
                  location: 'Tunisie → Chine',
                  timeAgo: 'Il y a 3 jours',
                },
                {
                  id: 'opp-3',
                  type: 'PARTENARIAT',
                  typeColor: 'bg-purple-50 text-purple-700 border-purple-200',
                  title: 'Joint-venture pour production textile',
                  location: 'Maroc',
                  timeAgo: 'Il y a 5 jours',
                },
              ].map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => onSelectTab('opportunites')}
                  className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${opp.typeColor}`}>
                      {opp.type}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {opp.timeAgo}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
                    {opp.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      {opp.location}
                    </span>
                    <span className="text-red-600 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 2: Entreprises chinoises remarquables (Matching User Screenshot) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Entreprises chinoises remarquables
              </h3>
              <button
                onClick={() => onSelectTab('entreprises')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Voir toutes les entreprises</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {CHINESE_COMPANIES_LOGOS.map((co) => (
                <div
                  key={co.id}
                  onClick={() => onSelectTab('entreprises')}
                  className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-2 flex items-center justify-center text-center hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group h-16 sm:h-20 overflow-hidden w-full"
                  title={co.name}
                >
                  <div className="transition-transform group-hover:scale-105 duration-200 max-w-full flex items-center justify-center">
                    {co.component}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3: Dernières analyses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Dernières analyses
              </h3>
              <button
                onClick={() => onSelectTab('analyses')}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Voir toutes les analyses →
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: 'Le e-commerce chinois : quelles opportunités pour l’Afrique du Nord ?',
                  date: '5 Août 2024',
                  image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80',
                },
                {
                  title: 'Produits agricoles nord-africains : un potentiel croissant sur le marché chinois',
                  date: '28 Juillet 2024',
                  image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=200&q=80',
                },
                {
                  title: 'Logistique et ports : un levier stratégique pour les échanges sino-nord-africains',
                  date: '20 Juillet 2024',
                  image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=200&q=80',
                },
                {
                  title: 'Tendances 2025 : vers un commerce plus durable et digital',
                  date: '12 Juillet 2024',
                  image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=80',
                },
              ].map((art, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectTab('analyses')}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-14 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                      {art.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 mt-1 block flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {art.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
