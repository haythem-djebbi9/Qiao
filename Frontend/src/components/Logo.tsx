import React from 'react';
import emblem from '../assets/images/qiao-emblem.svg';
import wordmark from '../assets/images/qiao-wordmark.svg';

export interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'card' | 'transparent';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const EMBLEM_HEIGHTS = {
  sm: 'h-8 sm:h-9',
  md: 'h-11 sm:h-12',
  lg: 'h-14 sm:h-16',
  xl: 'h-[4.5rem] sm:h-20',
};
const WORDMARK_HEIGHTS = {
  sm: 'h-3.5 sm:h-4',
  md: 'h-[18px] sm:h-5',
  lg: 'h-6',
  xl: 'h-8',
};
const TAGLINE_SIZES = {
  sm: 'text-[5.5px] sm:text-[6px]',
  md: 'text-[6.5px] sm:text-[7px]',
  lg: 'text-[8.5px]',
  xl: 'text-[10px]',
};
const BRAND_SIZES = {
  sm: 'text-[6.5px] sm:text-[7px]',
  md: 'text-[7.5px] sm:text-[8.5px]',
  lg: 'text-[10px]',
  xl: 'text-[12px]',
};
const DASH_WIDTHS = {
  sm: 'w-1.5 sm:w-2',
  md: 'w-2 sm:w-3',
  lg: 'w-4',
  xl: 'w-5',
};

/** Logo QIAO officiel (fichier vectoriel) : net à toutes les tailles, jamais traduit ni inversé en arabe. */
export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'transparent', size = 'md', showText = true }) => {
  const isDark = variant === 'dark';
  const content = (
    <div translate="no" dir="ltr" className="flex items-center gap-2 sm:gap-3">
      <span className={`shrink-0 inline-flex ${isDark ? 'bg-white rounded-xl p-1' : ''}`}>
        <img src={emblem} alt="QIAO - The China Bridge" className={`${EMBLEM_HEIGHTS[size]} w-auto transition-transform duration-300 group-hover:scale-105`} />
      </span>

      {showText && (
        <div className="flex flex-col justify-center gap-[3px] sm:gap-1 text-left select-none shrink-0">
          <img src={wordmark} alt="" className={`${WORDMARK_HEIGHTS[size]} w-auto self-start ${isDark ? 'brightness-0 invert' : ''}`} />
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className={`${DASH_WIDTHS[size]} h-[1.5px] bg-red-600 rounded-full shrink-0`} />
            <span className={`${TAGLINE_SIZES[size]} font-semibold tracking-[0.2em] leading-none ${isDark ? 'text-white/80' : 'text-[#0a1b38]'}`}>THE BRIDGE BETWEEN</span>
            <span className={`${DASH_WIDTHS[size]} h-[1.5px] rounded-full shrink-0 ${isDark ? 'bg-sky-400' : 'bg-[#0a1b38]'}`} />
          </div>
          <div className={`${BRAND_SIZES[size]} font-bold tracking-[0.16em] leading-none`}>
            <span className="text-red-600">THE CHINA</span>
            <span className={`ml-1 ${isDark ? 'text-sky-300' : 'text-[#0a2f6b]'}`}>BRIDGE</span>
          </div>
        </div>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <div className={`inline-flex items-center justify-center bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 select-none group cursor-pointer px-3.5 py-2 rounded-2xl ${className}`}>
        {content}
      </div>
    );
  }

  return <div className={`inline-flex items-center cursor-pointer select-none group ${className}`}>{content}</div>;
};
