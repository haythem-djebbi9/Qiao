import React, { useState } from 'react';
import {
  BILATERAL_NORTH_AFRICA_PATHS,
  BILATERAL_CHINA_PATH
} from './realMapData';

interface CompactRealTradeMapProps {
  onSelectCountry?: (countryId: string) => void;
}

export const CompactRealTradeMap: React.FC<CompactRealTradeMapProps> = ({
  onSelectCountry,
}) => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full rounded-xl bg-slate-50/60 p-2 border border-slate-100 overflow-hidden select-none">
      
      {/* Country labels on left */}
      <div className="absolute left-2.5 top-8 text-[9px] text-slate-600 font-semibold space-y-0.5 pointer-events-none z-10 leading-tight">
        <div>Maroc</div>
        <div>Algérie</div>
        <div>Tunisie</div>
        <div>Libye</div>
        <div>Égypte</div>
      </div>

      {/* CHINE label under China */}
      <div className="absolute right-10 bottom-4 text-[10px] font-black text-slate-900 tracking-wider pointer-events-none z-10">
        CHINE
      </div>

      {/* SVG Map */}
      <svg
        viewBox="0 0 500 210"
        className="w-full h-auto drop-shadow-2xs"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="chGradCompact" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>

          <marker
            id="arrCompactBlue"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284c7" />
          </marker>

          <marker
            id="arrCompactRed"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#dc2626" />
          </marker>
        </defs>

        {/* Faint Grid lines in background */}
        <line x1="30" y1="30" x2="470" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="30" y1="90" x2="470" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="30" y1="150" x2="470" y2="150" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

        {/* North Africa Group (scaled down) */}
        <g transform="translate(45, 30) scale(0.48)">
          {/* Morocco */}
          <path
            d={`${BILATERAL_NORTH_AFRICA_PATHS.morocco} ${BILATERAL_NORTH_AFRICA_PATHS.wsahara}`}
            fill={hovered === 'morocco' ? '#0284c7' : '#0369a1'}
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-pointer transition-colors"
            onMouseEnter={() => setHovered('morocco')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectCountry?.('morocco')}
          />
          {/* Algeria */}
          <path
            d={BILATERAL_NORTH_AFRICA_PATHS.algeria}
            fill={hovered === 'algeria' ? '#0c4a9e' : '#0284c7'}
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-pointer transition-colors"
            onMouseEnter={() => setHovered('algeria')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectCountry?.('algeria')}
          />
          {/* Tunisia */}
          <path
            d={BILATERAL_NORTH_AFRICA_PATHS.tunisia}
            fill={hovered === 'tunisia' ? '#38bdf8' : '#0284c7'}
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-pointer transition-colors"
            onMouseEnter={() => setHovered('tunisia')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectCountry?.('tunisia')}
          />
          {/* Libya */}
          <path
            d={BILATERAL_NORTH_AFRICA_PATHS.libya}
            fill={hovered === 'libya' ? '#0284c7' : '#0369a1'}
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-pointer transition-colors"
            onMouseEnter={() => setHovered('libya')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectCountry?.('libya')}
          />
          {/* Egypt */}
          <path
            d={BILATERAL_NORTH_AFRICA_PATHS.egypt}
            fill={hovered === 'egypt' ? '#0f2c69' : '#0284c7'}
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-pointer transition-colors"
            onMouseEnter={() => setHovered('egypt')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectCountry?.('egypt')}
          />
        </g>

        {/* China Group (scaled down) */}
        <g transform="translate(315, 30) scale(0.46)">
          <path
            d={BILATERAL_CHINA_PATH}
            fill="url(#chGradCompact)"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-pointer hover:brightness-110 transition-all"
            onMouseEnter={() => setHovered('china')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectCountry?.('china')}
          />
          {/* China Five Stars Flag emblem */}
          <g transform="translate(195, 75)">
            <polygon points="0,-7 2,-2 7,-2 3,1 5,6 0,3 -5,6 -3,1 -7,-2 -2,-2" fill="#facc15" />
            <polygon points="12,-8 13,-6 15,-6 13,-5 14,-3 12,-4 10,-3 11,-5 9,-6 11,-6" fill="#facc15" transform="rotate(25, 12, -6)" />
            <polygon points="16,-3 17,-1 19,-1 17,0 18,2 16,1 14,2 15,0 13,-1 15,-1" fill="#facc15" transform="rotate(45, 16, -1)" />
            <polygon points="16,4 17,6 19,6 17,7 18,9 16,8 14,9 15,7 13,6 15,6" fill="#facc15" transform="rotate(10, 16, 6)" />
            <polygon points="12,9 13,11 15,11 13,12 14,14 12,13 10,14 11,12 9,11 11,11" fill="#facc15" transform="rotate(-15, 12, 11)" />
          </g>
        </g>

        {/* Top Arc: Importations 22,7 Mds USD (NA -> China) */}
        <g>
          <path
            d="M 195,85 Q 260,35 330,70"
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            markerEnd="url(#arrCompactBlue)"
          />
          {/* Label centered on top of arc */}
          <text x="260" y="25" textAnchor="middle" fontSize="9" fontWeight="600" fill="#0284c7">
            Importations
          </text>
          <text x="260" y="38" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0369a1">
            22,7 Mds USD
          </text>
        </g>

        {/* Bottom Arc: Exportations 24,1 Mds USD (China -> NA) */}
        <g>
          <path
            d="M 330,120 Q 260,170 195,135"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2.5"
            markerEnd="url(#arrCompactRed)"
          />
          {/* Label centered below bottom arc */}
          <text x="260" y="160" textAnchor="middle" fontSize="9" fontWeight="600" fill="#dc2626">
            Exportations
          </text>
          <text x="260" y="173" textAnchor="middle" fontSize="11" fontWeight="800" fill="#b91c1c">
            24,1 Mds USD
          </text>
        </g>

      </svg>
    </div>
  );
};
