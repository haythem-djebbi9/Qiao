import React from 'react';
import geminiLogoTransparent from '../assets/images/qiao_gemini_logo.png';

export interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'card' | 'transparent';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'transparent',
  size = 'md',
  showText = true,
}) => {
  const isCard = variant === 'card';
  const isDark = variant === 'dark';

  // Sizing configurations
  const emblemSizes = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-18 sm:h-20',
  };

  const qSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5 sm:w-5.5 sm:h-5.5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9',
  };

  const iSizes = {
    sm: 'w-1 h-4',
    md: 'w-1.5 h-5 sm:w-1.5 sm:h-5.5',
    lg: 'w-2 h-7',
    xl: 'w-2.5 h-9',
  };

  const aSizes = {
    sm: 'w-3.5 h-4',
    md: 'w-4.5 h-5 sm:w-5 sm:h-5.5',
    lg: 'w-6 h-7',
    xl: 'w-8 h-9',
  };

  const letterGap = {
    sm: 'gap-1.5',
    md: 'gap-2 sm:gap-2.5',
    lg: 'gap-3',
    xl: 'gap-4',
  };

  const bridgeTextSizes = {
    sm: 'text-[6px] sm:text-[6.5px]',
    md: 'text-[7px] sm:text-[8px]',
    lg: 'text-[9px]',
    xl: 'text-[11px]',
  };

  const countryTextSizes = {
    sm: 'text-[7.5px] sm:text-[8px]',
    md: 'text-[8.5px] sm:text-[9.5px]',
    lg: 'text-[11px]',
    xl: 'text-[13px]',
  };

  const dashWidths = {
    sm: 'w-2 sm:w-2.5',
    md: 'w-3 sm:w-4',
    lg: 'w-5',
    xl: 'w-6',
  };

  // Dynamic colors based on background variant
  const letterColor = isDark ? '#ffffff' : '#0a1b38';
  const navyTextColor = isDark ? 'text-white/95' : 'text-[#0a1b38]';
  const bridgeTextColor = isDark ? 'text-white/70' : 'text-slate-500';
  const blueDashColor = isDark ? 'bg-sky-400' : 'bg-[#0a1b38]';

  const content = (
    <div className="flex items-center gap-2.5 sm:gap-3.5">
      {/* 1. Circular Bridge Emblem */}
      <img
        src={geminiLogoTransparent}
        alt="QIAO - The China Bridge"
        className={`${emblemSizes[size]} w-auto object-contain transition-transform duration-300 group-hover:scale-105 shrink-0 ${
          isDark
            ? 'filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
            : 'filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
        }`}
      />

      {/* 2. Official Brand Typography: Q I Λ O + THE BRIDGE BETWEEN + CHINA & NORTH AFRICA */}
      {showText && (
        <div className="flex flex-col justify-center text-left select-none shrink-0">
          {/* Top Row: Q I Λ O */}
          <div className={`flex items-center ${letterGap[size]} leading-none`}>
            {/* Q with distinctive red tail */}
            <svg viewBox="0 0 28 28" className={`${qSizes[size]} shrink-0`} fill="none">
              <circle cx="12.5" cy="12.5" r="8.5" stroke={letterColor} strokeWidth="2.5" />
              <path d="M17.5 17.5 L23.5 23.5" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
            </svg>

            {/* I (vertical bar) */}
            <svg viewBox="0 0 6 28" className={`${iSizes[size]} shrink-0`} fill="none">
              <line x1="3" y1="4" x2="3" y2="21" stroke={letterColor} strokeWidth="2.5" strokeLinecap="round" />
            </svg>

            {/* Λ (clean chevron / A without crossbar) */}
            <svg viewBox="0 0 24 28" className={`${aSizes[size]} shrink-0`} fill="none">
              <path d="M3 21 L12 4 L21 21" stroke={letterColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="miter" />
            </svg>

            {/* O (geometric circle) */}
            <svg viewBox="0 0 28 28" className={`${qSizes[size]} shrink-0`} fill="none">
              <circle cx="14" cy="12.5" r="8.5" stroke={letterColor} strokeWidth="2.5" />
            </svg>
          </div>

          {/* Middle Row: — THE BRIDGE BETWEEN — */}
          <div className="flex items-center gap-1 sm:gap-1.5 my-0.5 sm:my-1">
            <span className={`${dashWidths[size]} h-[1.5px] bg-red-600 rounded-full shrink-0`} />
            <span className={`${bridgeTextSizes[size]} font-semibold tracking-[0.18em] sm:tracking-[0.22em] uppercase ${bridgeTextColor} leading-none`}>
              THE BRIDGE BETWEEN
            </span>
            <span className={`${dashWidths[size]} h-[1.5px] ${blueDashColor} rounded-full shrink-0`} />
          </div>

          {/* Bottom Row: CHINA & NORTH AFRICA */}
          <div className={`${countryTextSizes[size]} font-extrabold tracking-wider leading-none`}>
            <span className="text-red-600">CHINA</span>
            <span className={`ml-1 ${navyTextColor}`}>&amp; NORTH AFRICA</span>
          </div>
        </div>
      )}
    </div>
  );

  if (isCard) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 select-none group cursor-pointer px-3.5 py-2 rounded-2xl ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center cursor-pointer select-none group ${className}`}>
      {content}
    </div>
  );
};



