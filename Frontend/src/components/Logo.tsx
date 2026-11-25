import React from 'react';
import emblem from '../assets/images/qiao-emblem.svg';
import wordmark from '../assets/images/qiao-wordmark.svg';
import emblemReverse from '../assets/images/qiao-emblem-reverse.svg';
import wordmarkReverse from '../assets/images/qiao-wordmark-reverse.svg';

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
// Slogan lisible : « THE BRIDGE BETWEEN / CHINA & NORTH AFRICA » (logo officiel).
const TAGLINE_SIZES = {
  sm: 'text-[6.5px] sm:text-[7px]',
  md: 'text-[7.5px] sm:text-[8px]',
  lg: 'text-[9px]',
  xl: 'text-[10.5px]',
};
const BRAND_SIZES = {
  sm: 'text-[7.5px] sm:text-[8px]',
  md: 'text-[8.5px] sm:text-[9.5px]',
  lg: 'text-[11px]',
  xl: 'text-[12.5px]',
};
const DASH_WIDTHS = {
  sm: 'w-1.5 sm:w-2',
  md: 'w-2 sm:w-3',
  lg: 'w-4',
  xl: 'w-5',
};

/**
 * Logo QIAO officiel (fichiers vectoriels) : net à toutes les tailles, jamais traduit ni inversé en arabe.
 * Sur fond sombre (variant « dark ») : version inversée du même logo, sans plaque ni cadre :
 * pont rouge vers bleu clair, « QIAO » en blanc, slogan en blanc, « CHINA » en rouge.
 */
export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'transparent', size = 'md', showText = true }) => {
  const isDark = variant === 'dark';
  const content = (
    <div translate="no" dir="ltr" className="flex items-center gap-2 sm:gap-3">
      <img
        src={isDark ? emblemReverse : emblem}
        alt="QIAO - The Bridge Between China & North Africa"
        className={`${EMBLEM_HEIGHTS[size]} w-auto shrink-0 transition-transform duration-300 group-hover:scale-105`}
      />

      {showText && (
        <div className="flex flex-col justify-center gap-[3px] sm:gap-1 text-left select-none shrink-0">
          <img src={isDark ? wordmarkReverse : wordmark} alt="" className={`${WORDMARK_HEIGHTS[size]} w-auto self-start`} />
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className={`${DASH_WIDTHS[size]} h-[1.5px] rounded-full shrink-0 ${isDark ? 'bg-red-500' : 'bg-red-600'}`} />
            <span className={`${TAGLINE_SIZES[size]} font-bold tracking-[0.18em] leading-none ${isDark ? 'text-white' : 'text-[#0a1b38]'}`}>THE BRIDGE BETWEEN</span>
            <span className={`${DASH_WIDTHS[size]} h-[1.5px] rounded-full shrink-0 ${isDark ? 'bg-sky-300' : 'bg-[#0a1b38]'}`} />
          </div>
          <div className={`${BRAND_SIZES[size]} font-extrabold tracking-[0.14em] leading-none`}>
            {/* Logo officiel : « THE BRIDGE BETWEEN / CHINA & NORTH AFRICA ». */}
            {/* Espace réel (pas une marge) : les marges sont inversées quand la page est en arabe. */}
            <span className={isDark ? 'text-red-500' : 'text-red-600'}>CHINA</span>{' '}
            <span className={isDark ? 'text-sky-200' : 'text-[#0a2f6b]'}>&amp; NORTH AFRICA</span>
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

  // « dark » : posé directement sur le fond sombre ; « light » et « transparent » : couleurs officielles.
  return (
    <div className={`inline-flex items-center cursor-pointer select-none group ${isDark ? 'drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]' : ''} ${className}`}>
      {content}
    </div>
  );
};
