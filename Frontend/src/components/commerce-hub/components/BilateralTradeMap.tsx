import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Ship,
  Compass,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import {
  BILATERAL_NORTH_AFRICA_PATHS,
  BILATERAL_CHINA_PATH,
  CORRIDOR_NORTH_AFRICA_PATHS,
  CORRIDOR_CHINA_PATH,
  CORRIDOR_BACKDROP_PATHS
} from './realMapData';

interface BilateralTradeMapProps {
  onViewAllFlux?: () => void;
  className?: string;
  compact?: boolean;
}

interface CountryInfo {
  id: string;
  name: string;
  flag: string;
  capital: string;
  tradeVol: string;
  exportsToChina: string;
  importsFromChina: string;
  growth: string;
  primaryGoods: string;
  color: string;
  hoverColor: string;
}

const NA_COUNTRIES_DATA: Record<string, CountryInfo> = {
  morocco: {
    id: 'morocco',
    name: 'Maroc',
    flag: '🇲🇦',
    capital: 'Rabat / Casablanca',
    tradeVol: '8,4 Mds USD',
    exportsToChina: '1,8 Mds USD',
    importsFromChina: '6,6 Mds USD',
    growth: '+22%',
    primaryGoods: 'Phosphates, composants auto, textiles & électronique',
    color: '#0284c7',
    hoverColor: '#0369a1',
  },
  algeria: {
    id: 'algeria',
    name: 'Algérie',
    flag: '🇩🇿',
    capital: 'Alger',
    tradeVol: '7,9 Mds USD',
    exportsToChina: '1,4 Mds USD',
    importsFromChina: '6,5 Mds USD',
    growth: '+17%',
    primaryGoods: 'Hydrocarbures, machinerie lourde, sidérurgie',
    color: '#0369a1',
    hoverColor: '#0c4a9e',
  },
  tunisia: {
    id: 'tunisia',
    name: 'Tunisie',
    flag: '🇹🇳',
    capital: 'Tunis',
    tradeVol: '5,6 Mds USD',
    exportsToChina: '0,9 Mds USD',
    importsFromChina: '4,7 Mds USD',
    growth: '+14%',
    primaryGoods: 'Composants électroniques, câblerie, huile d’olive',
    color: '#0284c7',
    hoverColor: '#0369a1',
  },
  libya: {
    id: 'libya',
    name: 'Libye',
    flag: '🇱🇾',
    capital: 'Tripoli',
    tradeVol: '4,3 Mds USD',
    exportsToChina: '2,9 Mds USD',
    importsFromChina: '1,4 Mds USD',
    growth: '+19%',
    primaryGoods: 'Pétrole brut, matériaux de reconstruction',
    color: '#0284c7',
    hoverColor: '#0369a1',
  },
  egypt: {
    id: 'egypt',
    name: 'Égypte',
    flag: '🇪🇬',
    capital: 'Le Caire / Alexandrie',
    tradeVol: '7,1 Mds USD',
    exportsToChina: '1,7 Mds USD',
    importsFromChina: '5,4 Mds USD',
    growth: '+18%',
    primaryGoods: 'Zone TEDA Suez, chimie, textiles, gaz liquéfié',
    color: '#0369a1',
    hoverColor: '#0c4a9e',
  },
};

export const BilateralTradeMap: React.FC<BilateralTradeMapProps> = ({
  onViewAllFlux,
  className = '',
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<'bilateral' | 'corridor'>('bilateral');
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(NA_COUNTRIES_DATA.morocco);
  const [hoveredFlow, setHoveredFlow] = useState<'import' | 'export' | null>(null);

  const activeCountryData = hoveredCountry && NA_COUNTRIES_DATA[hoveredCountry]
    ? NA_COUNTRIES_DATA[hoveredCountry]
    : selectedCountry;

  return (
    <div className={`bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-7 shadow-xs relative overflow-hidden ${className}`}>
      
      {/* Header controls inside card */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Cartographie Géographique Réelle • Données Douanières 2024
          </span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('bilateral')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'bilateral'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vue Bilatérale (Chine ↔ Afrique du Nord)
          </button>
          <button
            onClick={() => setViewMode('corridor')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'corridor'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Corridor Maritime & Soie</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BILATERAL SPLIT VIEW (EXACT MATCH TO USER SCREENSHOT)                  */}
      {/* ========================================================================= */}
      {viewMode === 'bilateral' && (
        <div className="relative w-full">
          
          {/* Main SVG Canvas */}
          <div className="relative w-full aspect-[21/10] sm:aspect-[21/9] min-h-[340px] max-h-[460px] bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 rounded-2xl border border-slate-100 overflow-hidden select-none">
            
            <svg
              viewBox="0 0 1000 420"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Glow & Shadow Filters */}
                <filter id="realGlowBlue" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0c4a9e" floodOpacity="0.35" />
                </filter>
                <filter id="realGlowRed" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#dc2626" floodOpacity="0.35" />
                </filter>
                <filter id="dropCountry" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.12" />
                </filter>

                {/* Gradients */}
                <linearGradient id="chinaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="60%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>

                <linearGradient id="blueArrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0c4a9e" />
                </linearGradient>

                <linearGradient id="redArrowGrad" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>

                {/* Arrow markers */}
                <marker
                  id="arrowBlue"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#0c4a9e" />
                </marker>

                <marker
                  id="arrowRed"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#dc2626" />
                </marker>

                {/* Faint coordinate grid pattern */}
                <pattern id="cartoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
                </pattern>
              </defs>

              {/* Background grid */}
              <rect width="1000" height="420" fill="url(#cartoGrid)" />

              {/* Compass Rose Accent in top center */}
              <g transform="translate(500, 48)" opacity="0.4">
                <circle cx="0" cy="0" r="14" fill="none" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2 2" />
                <path d="M 0 -12 L 3 0 L 0 12 L -3 0 Z" fill="#94a3b8" />
                <text x="0" y="-15" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#64748b">N</text>
              </g>

              {/* ============================================================= */}
              {/* LEFT SIDE: AFRIQUE DU NORD HEADER & ACCURATE GEOGRAPHY        */}
              {/* ============================================================= */}
              <g transform="translate(30, 28)">
                <text x="0" y="0" fontSize="17" fontWeight="900" fill="#0f2c69" letterSpacing="0.05em">
                  AFRIQUE DU NORD
                </text>
                <line x1="0" y1="8" x2="280" y2="8" stroke="#0c4a9e" strokeWidth="2.5" />
                <text x="0" y="24" fontSize="11" fontWeight="600" fill="#475569">
                  Maroc, Algérie, Tunisie, Libye, Égypte
                </text>
              </g>

              {/* North African Countries Geographic Group */}
              <g transform="translate(25, 95)" filter="url(#dropCountry)">
                
                {/* Morocco + Western Sahara (Continuous Territorial Presentation) */}
                <g
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredCountry('morocco')}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setSelectedCountry(NA_COUNTRIES_DATA.morocco)}
                >
                  <path
                    d={`${BILATERAL_NORTH_AFRICA_PATHS.morocco} ${BILATERAL_NORTH_AFRICA_PATHS.wsahara}`}
                    fill={hoveredCountry === 'morocco' ? '#0284c7' : '#0ea5e9'}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                    className="transition-colors duration-200"
                  />
                  <circle cx="78" cy="65" r="3.5" fill="#ffffff" />
                  <circle cx="78" cy="65" r="2" fill="#0369a1" />
                  <text
                    x="78"
                    y="55"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill="#0f172a"
                    className="pointer-events-none drop-shadow-xs font-sans"
                  >
                    Maroc
                  </text>
                </g>

                {/* Algeria */}
                <g
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredCountry('algeria')}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setSelectedCountry(NA_COUNTRIES_DATA.algeria)}
                >
                  <path
                    d={BILATERAL_NORTH_AFRICA_PATHS.algeria}
                    fill={hoveredCountry === 'algeria' ? '#0369a1' : '#0284c7'}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                    className="transition-colors duration-200"
                  />
                  <circle cx="148" cy="100" r="3.5" fill="#ffffff" />
                  <circle cx="148" cy="100" r="2" fill="#0c4a9e" />
                  <text
                    x="148"
                    y="118"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill="#ffffff"
                    className="pointer-events-none drop-shadow-xs font-sans"
                  >
                    Algérie
                  </text>
                </g>

                {/* Tunisia */}
                <g
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredCountry('tunisia')}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setSelectedCountry(NA_COUNTRIES_DATA.tunisia)}
                >
                  <path
                    d={BILATERAL_NORTH_AFRICA_PATHS.tunisia}
                    fill={hoveredCountry === 'tunisia' ? '#0284c7' : '#38bdf8'}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                    className="transition-colors duration-200"
                  />
                  <circle cx="192" cy="35" r="3" fill="#ffffff" />
                  <circle cx="192" cy="35" r="1.5" fill="#0369a1" />
                  <text
                    x="202"
                    y="25"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill="#0f172a"
                    className="pointer-events-none drop-shadow-xs font-sans"
                  >
                    Tunisie
                  </text>
                </g>

                {/* Libya */}
                <g
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredCountry('libya')}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setSelectedCountry(NA_COUNTRIES_DATA.libya)}
                >
                  <path
                    d={BILATERAL_NORTH_AFRICA_PATHS.libya}
                    fill={hoveredCountry === 'libya' ? '#0369a1' : '#0284c7'}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                    className="transition-colors duration-200"
                  />
                  <circle cx="248" cy="115" r="3.5" fill="#ffffff" />
                  <circle cx="248" cy="115" r="2" fill="#0c4a9e" />
                  <text
                    x="248"
                    y="132"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill="#ffffff"
                    className="pointer-events-none drop-shadow-xs font-sans"
                  >
                    Libye
                  </text>
                </g>

                {/* Egypt */}
                <g
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredCountry('egypt')}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setSelectedCountry(NA_COUNTRIES_DATA.egypt)}
                >
                  <path
                    d={BILATERAL_NORTH_AFRICA_PATHS.egypt}
                    fill={hoveredCountry === 'egypt' ? '#0c4a9e' : '#0369a1'}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                    className="transition-colors duration-200"
                  />
                  <circle cx="335" cy="120" r="3.5" fill="#ffffff" />
                  <circle cx="335" cy="120" r="2" fill="#0f2c69" />
                  <text
                    x="335"
                    y="138"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill="#ffffff"
                    className="pointer-events-none drop-shadow-xs font-sans"
                  >
                    Égypte
                  </text>
                </g>
              </g>

              {/* ============================================================= */}
              {/* RIGHT SIDE: CHINE HEADER & ACCURATE GEOGRAPHY (ROOSTER SHAPE) */}
              {/* ============================================================= */}
              <g transform="translate(680, 28)">
                <text x="280" y="0" textAnchor="end" fontSize="17" fontWeight="900" fill="#dc2626" letterSpacing="0.05em">
                  CHINE
                </text>
                <line x1="130" y1="8" x2="280" y2="8" stroke="#dc2626" strokeWidth="2.5" />
                <text x="280" y="24" textAnchor="end" fontSize="11" fontWeight="600" fill="#64748b">
                  Asie de l'Est • 2e Économie Mondiale
                </text>
              </g>

              {/* China Geographic Silhouette Group */}
              <g
                transform="translate(635, 88)"
                filter="url(#dropCountry)"
                className="cursor-pointer"
                onClick={() => setSelectedCountry(null)}
              >
                <path
                  d={BILATERAL_CHINA_PATH}
                  fill="url(#chinaGrad)"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  className="hover:brightness-105 transition-all"
                />

                {/* Beijing Capital Star Node */}
                <g transform="translate(236, 89)">
                  <circle cx="0" cy="0" r="10" fill="#facc15" opacity="0.3" className="animate-ping" />
                  <circle cx="0" cy="0" r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1" />
                  {/* Star */}
                  <polygon
                    points="0,-4 1.2,-1 4,-1 1.8,0.8 2.6,3.6 0,2 -2.6,3.6 -1.8,0.8 -4,-1 -1.2,-1"
                    fill="#dc2626"
                  />
                  <text
                    x="8"
                    y="3"
                    fontSize="10"
                    fontWeight="800"
                    fill="#7f1d1d"
                    className="pointer-events-none font-sans drop-shadow-xs"
                  >
                    Pékin (Beijing)
                  </text>
                </g>

                {/* Shanghai Commercial Port Node */}
                <g transform="translate(258, 146)">
                  <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
                  <circle cx="0" cy="0" r="2" fill="#dc2626" />
                  <text
                    x="7"
                    y="3"
                    fontSize="9"
                    fontWeight="700"
                    fill="#7f1d1d"
                    className="pointer-events-none font-sans"
                  >
                    Shanghai
                  </text>
                </g>

                {/* Guangzhou / Shenzhen Node */}
                <g transform="translate(225, 192)">
                  <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
                  <circle cx="0" cy="0" r="2" fill="#dc2626" />
                  <text
                    x="-6"
                    y="3"
                    textAnchor="end"
                    fontSize="9"
                    fontWeight="700"
                    fill="#7f1d1d"
                    className="pointer-events-none font-sans"
                  >
                    Shenzhen
                  </text>
                </g>
              </g>

              {/* ============================================================= */}
              {/* CENTER: BILATERAL TRADE FLOW ARROWS (BLUE IMPORT / RED EXPORT)*/}
              {/* ============================================================= */}

              {/* TOP ARROW: Importations (North Africa -> China) */}
              <g
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredFlow('import')}
                onMouseLeave={() => setHoveredFlow(null)}
              >
                {/* Flow Tube Glow */}
                <path
                  d="M 390,195 Q 520,120 670,175"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="8"
                  opacity={hoveredFlow === 'import' ? 0.35 : 0.15}
                  strokeLinecap="round"
                />
                {/* Main Curved Arrow */}
                <path
                  d="M 390,195 Q 520,120 660,175"
                  fill="none"
                  stroke="url(#blueArrowGrad)"
                  strokeWidth={hoveredFlow === 'import' ? 4 : 3.2}
                  strokeLinecap="round"
                  markerEnd="url(#arrowBlue)"
                  filter="url(#realGlowBlue)"
                />
                {/* Animated dash flow */}
                <path
                  d="M 390,195 Q 520,120 655,175"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeDasharray="6 14"
                  strokeLinecap="round"
                  className="animate-pulse"
                />

                {/* Badge: Importations 22,7 Mds USD */}
                <g transform="translate(525, 130)">
                  <rect
                    x="-75"
                    y="-22"
                    width="150"
                    height="42"
                    rx="12"
                    fill="#ffffff"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    filter="url(#realGlowBlue)"
                  />
                  <circle cx="-55" cy="-1" r="3.5" fill="#0284c7" />
                  <text
                    x="-44"
                    y="-7"
                    fontSize="10"
                    fontWeight="800"
                    fill="#0369a1"
                    letterSpacing="0.04em"
                  >
                    IMPORTATIONS
                  </text>
                  <text
                    x="-44"
                    y="11"
                    fontSize="13"
                    fontWeight="900"
                    fill="#0f2c69"
                  >
                    22,7 Mds USD
                  </text>
                  <text
                    x="56"
                    y="3"
                    fontSize="9"
                    fontWeight="700"
                    fill="#0284c7"
                  >
                    →
                  </text>
                </g>
              </g>

              {/* BOTTOM ARROW: Exportations (China -> North Africa) */}
              <g
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredFlow('export')}
                onMouseLeave={() => setHoveredFlow(null)}
              >
                {/* Flow Tube Glow */}
                <path
                  d="M 670,270 Q 520,340 395,245"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="8"
                  opacity={hoveredFlow === 'export' ? 0.35 : 0.15}
                  strokeLinecap="round"
                />
                {/* Main Curved Arrow */}
                <path
                  d="M 670,270 Q 520,340 405,245"
                  fill="none"
                  stroke="url(#redArrowGrad)"
                  strokeWidth={hoveredFlow === 'export' ? 4 : 3.2}
                  strokeLinecap="round"
                  markerEnd="url(#arrowRed)"
                  filter="url(#realGlowRed)"
                />
                {/* Animated dash flow */}
                <path
                  d="M 670,270 Q 520,340 410,245"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeDasharray="6 14"
                  strokeLinecap="round"
                  className="animate-pulse"
                />

                {/* Badge: Exportations 24,1 Mds USD */}
                <g transform="translate(525, 310)">
                  <rect
                    x="-75"
                    y="-22"
                    width="150"
                    height="42"
                    rx="12"
                    fill="#ffffff"
                    stroke="#dc2626"
                    strokeWidth="1.5"
                    filter="url(#realGlowRed)"
                  />
                  <circle cx="-55" cy="-1" r="3.5" fill="#dc2626" />
                  <text
                    x="-44"
                    y="-7"
                    fontSize="10"
                    fontWeight="800"
                    fill="#b91c1c"
                    letterSpacing="0.04em"
                  >
                    EXPORTATIONS
                  </text>
                  <text
                    x="-44"
                    y="11"
                    fontSize="13"
                    fontWeight="900"
                    fill="#991b1b"
                  >
                    24,1 Mds USD
                  </text>
                  <text
                    x="56"
                    y="3"
                    fontSize="9"
                    fontWeight="700"
                    fill="#dc2626"
                  >
                    ←
                  </text>
                </g>
              </g>

            </svg>
          </div>

          {/* Interactive Inspection Card when a North African Country or China is selected/hovered */}
          {activeCountryData && (
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activeCountryData.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{activeCountryData.name}</span>
                    <span className="font-medium text-slate-500">({activeCountryData.capital})</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                      {activeCountryData.growth} vs 2023
                    </span>
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    <strong>Filières clés :</strong> {activeCountryData.primaryGoods}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Échanges avec la Chine</div>
                  <div className="text-sm font-extrabold text-blue-700">{activeCountryData.tradeVol}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-red-500">Chine → {activeCountryData.name}</div>
                  <div className="text-xs font-bold text-slate-800">{activeCountryData.importsFromChina}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-sky-600">{activeCountryData.name} → Chine</div>
                  <div className="text-xs font-bold text-slate-800">{activeCountryData.exportsToChina}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FULL AFRO-EURASIAN CORRIDOR VIEW (REAL WORLD MAP WITH SHIPPING LANES)  */}
      {/* ========================================================================= */}
      {viewMode === 'corridor' && (
        <div className="relative w-full">
          <div className="relative w-full aspect-[21/9] min-h-[320px] max-h-[440px] bg-[#f8fafc] rounded-2xl border border-slate-200 overflow-hidden select-none">
            
            <svg
              viewBox="0 0 960 360"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <pattern id="seaGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Ocean background */}
              <rect width="960" height="360" fill="#f1f5f9" />
              <rect width="960" height="360" fill="url(#seaGrid)" />

              {/* Backdrop Eurasian & African countries in subtle neutral gray */}
              <g fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.6">
                {CORRIDOR_BACKDROP_PATHS.map((pathStr, i) => (
                  <path key={i} d={pathStr} />
                ))}
              </g>

              {/* North Africa highlighted in vivid maritime blue */}
              <g stroke="#ffffff" strokeWidth="1">
                <path d={`${CORRIDOR_NORTH_AFRICA_PATHS.morocco} ${CORRIDOR_NORTH_AFRICA_PATHS.wsahara}`} fill="#0284c7" />
                <path d={CORRIDOR_NORTH_AFRICA_PATHS.algeria} fill="#0369a1" />
                <path d={CORRIDOR_NORTH_AFRICA_PATHS.tunisia} fill="#38bdf8" />
                <path d={CORRIDOR_NORTH_AFRICA_PATHS.libya} fill="#0284c7" />
                <path d={CORRIDOR_NORTH_AFRICA_PATHS.egypt} fill="#0c4a9e" />
              </g>

              {/* China highlighted in Chinese Imperial Red */}
              <path
                d={CORRIDOR_CHINA_PATH}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth="1.2"
              />

              {/* MARITIME SILK ROAD SHIPPING LANE (Tanger Med -> Suez -> Malacca -> Shanghai) */}
              <path
                d="M 90,165 Q 160,160 215,170 Q 295,185 305,210 Q 330,265 425,295 Q 550,320 680,315 Q 730,305 770,270 Q 810,240 840,195"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeDasharray="5 4"
                className="animate-pulse"
              />

              {/* OVERLAND BELT & ROAD SILK ROAD (Xi'an -> Central Asia -> Tehran -> Istanbul / Cairo) */}
              <path
                d="M 760,175 Q 670,165 580,160 Q 480,165 390,180 Q 330,190 295,210"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 3"
              />

              {/* Strategic Port & Hub Pins */}
              {/* Tanger Med */}
              <circle cx="88" cy="165" r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <text x="88" y="155" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a">Tanger Med</text>

              {/* Suez Canal */}
              <circle cx="305" cy="210" r="4" fill="#0c4a9e" stroke="#ffffff" strokeWidth="1.5" />
              <text x="305" y="202" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a">Canal de Suez</text>

              {/* Shanghai Port */}
              <circle cx="840" cy="195" r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
              <text x="840" y="186" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#991b1b">Shanghai</text>

              {/* Beijing */}
              <circle cx="810" cy="126" r="4" fill="#facc15" stroke="#dc2626" strokeWidth="1.5" />
              <text x="810" y="118" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#7f1d1d">Pékin</text>

              {/* Legend overlay inside map */}
              <g transform="translate(20, 290)">
                <rect width="260" height="55" rx="8" fill="#ffffff" fillOpacity="0.9" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="12" y1="18" x2="35" y2="18" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="4 2" />
                <text x="42" y="21" fontSize="10" fontWeight="bold" fill="#0f172a">Route maritime (Canal de Suez)</text>
                
                <line x1="12" y1="38" x2="35" y2="38" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
                <text x="42" y="41" fontSize="10" fontWeight="bold" fill="#0f172a">Ceinture terrestre (Nouvelle Route de la Soie)</text>
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER: LEGEND + ACTION BUTTON (MATCHING USER SCREENSHOT)          */}
      {/* ========================================================================= */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Legend */}
        <div className="space-y-1.5 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#dc2626] shrink-0 shadow-2xs" />
            <span>
              <strong>Exportations</strong> (Chine → Afrique du Nord) : <span className="font-bold text-red-600">24,1 Mds USD</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0c4a9e] shrink-0 shadow-2xs" />
            <span>
              <strong>Importations</strong> (Afrique du Nord → Chine) : <span className="font-bold text-blue-700">22,7 Mds USD</span>
            </span>
          </div>
        </div>

        {/* Blue Action Button */}
        {onViewAllFlux && (
          <button
            onClick={onViewAllFlux}
            className="bg-[#0c4a9e] hover:bg-[#0a3d84] text-white px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <span>Voir tous les flux</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
};
