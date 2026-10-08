import React from 'react';

export type CountryCode = 'TN' | 'MA' | 'DZ' | 'EG' | 'LY' | 'CN' | 'FR' | string;

interface CountryFlagProps {
  country?: CountryCode;
  code?: CountryCode;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  country,
  code,
  className = '',
  size = 'md',
}) => {
  const rawCode = (code || country || '').toUpperCase().trim();
  
  // Normalize names or codes
  let normalizedCode = rawCode;
  if (rawCode === 'TUNISIE' || rawCode === 'TUNISIA') normalizedCode = 'TN';
  else if (rawCode === 'MAROC' || rawCode === 'MOROCCO') normalizedCode = 'MA';
  else if (rawCode === 'ALGÉRIE' || rawCode === 'ALGERIE' || rawCode === 'ALGERIA') normalizedCode = 'DZ';
  else if (rawCode === 'ÉGYPTE' || rawCode === 'EGYPTE' || rawCode === 'EGYPT') normalizedCode = 'EG';
  else if (rawCode === 'LIBYE' || rawCode === 'LIBYA') normalizedCode = 'LY';
  else if (rawCode === 'CHINE' || rawCode === 'CHINA') normalizedCode = 'CN';
  else if (rawCode === 'FRANCE') normalizedCode = 'FR';

  const sizeClass = {
    xs: 'w-4 h-4 text-[10px]',
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base',
  }[size] || 'w-6 h-6';

  const baseContainerClass = `inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 shadow-2xs border border-slate-200/80 bg-white ${sizeClass} ${className}`;

  switch (normalizedCode) {
    case 'TN':
      // Tunisia Flag: Red background, white circle with red crescent and star
      return (
        <span className={baseContainerClass} title="Tunisie">
          <svg viewBox="0 0 36 36" className="w-full h-full object-cover">
            <rect width="36" height="36" fill="#E70013" />
            <circle cx="18" cy="18" r="9" fill="#FFFFFF" />
            <circle cx="18" cy="18" r="7.2" fill="#E70013" />
            <circle cx="19.5" cy="18" r="6" fill="#FFFFFF" />
            <polygon
              points="18.5,14.5 19.8,17.2 22.8,17.2 20.4,18.8 21.3,21.5 18.5,19.9 15.7,21.5 16.6,18.8 14.2,17.2 17.2,17.2"
              fill="#E70013"
            />
          </svg>
        </span>
      );

    case 'MA':
      // Morocco Flag: Red background with green interlaced 5-pointed star
      return (
        <span className={baseContainerClass} title="Maroc">
          <svg viewBox="0 0 36 36" className="w-full h-full object-cover">
            <rect width="36" height="36" fill="#C1272D" />
            <polygon
              points="18,10 20.3,16.5 27,16.5 21.6,20.5 23.6,27 18,23 12.4,27 14.4,20.5 9,16.5 15.7,16.5"
              fill="none"
              stroke="#006233"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );

    case 'DZ':
      // Algeria Flag: Green left, white right, red crescent and star in center
      return (
        <span className={baseContainerClass} title="Algérie">
          <svg viewBox="0 0 36 36" className="w-full h-full object-cover">
            <defs>
              <mask id="dz-crescent-mask">
                <rect width="36" height="36" fill="#FFFFFF" />
                <circle cx="20.5" cy="18" r="7.2" fill="#000000" />
              </mask>
            </defs>
            <rect width="18" height="36" fill="#006633" />
            <rect x="18" width="18" height="36" fill="#FFFFFF" />
            {/* Red Crescent cleanly cut out */}
            <circle cx="18" cy="18" r="9" fill="#D21034" mask="url(#dz-crescent-mask)" />
            {/* Star */}
            <polygon
              points="19.5,13.5 20.8,16.5 24,16.8 21.5,18.8 22.3,22 19.5,20.2 16.7,22 17.5,18.8 15,16.8 18.2,16.5"
              fill="#D21034"
            />
          </svg>
        </span>
      );

    case 'CN':
      // China Flag: Red background, large yellow star and 4 small yellow stars
      return (
        <span className={baseContainerClass} title="Chine">
          <svg viewBox="0 0 36 36" className="w-full h-full object-cover">
            <rect width="36" height="36" fill="#DE2910" />
            {/* Big Star */}
            <polygon
              points="10,6 11.2,9.6 15,9.6 12,11.8 13.1,15.4 10,13.2 6.9,15.4 8,11.8 5,9.6 8.8,9.6"
              fill="#FFDE00"
            />
            {/* 4 Little Stars */}
            <polygon points="17,6 17.5,7.5 19,7.5 17.8,8.4 18.2,9.9 17,9 15.8,9.9 16.2,8.4 15,7.5 16.5,7.5" fill="#FFDE00" transform="scale(0.85) translate(4, 1)" />
            <polygon points="20,9.5 20.5,11 22,11 20.8,11.9 21.2,13.4 20,12.5 18.8,13.4 19.2,11.9 18,11 19.5,11" fill="#FFDE00" transform="scale(0.85) translate(4, 2)" />
            <polygon points="20,15 20.5,16.5 22,16.5 20.8,17.4 21.2,18.9 20,18 18.8,18.9 19.2,17.4 18,16.5 19.5,16.5" fill="#FFDE00" transform="scale(0.85) translate(4, 3)" />
            <polygon points="17,18.5 17.5,20 19,20 17.8,20.9 18.2,22.4 17,21.5 15.8,22.4 16.2,20.9 15,20 16.5,20" fill="#FFDE00" transform="scale(0.85) translate(4, 4)" />
          </svg>
        </span>
      );

    case 'EG':
      // Egypt Flag: Red, White, Black horizontal stripes with Gold Eagle
      return (
        <span className={baseContainerClass} title="Égypte">
          <svg viewBox="0 0 36 36" className="w-full h-full object-cover">
            <rect width="36" height="12" fill="#C8102E" />
            <rect y="12" width="36" height="12" fill="#FFFFFF" />
            <rect y="24" width="36" height="12" fill="#000000" />
            {/* Eagle of Saladin in gold */}
            <circle cx="18" cy="18" r="4" fill="#C09300" />
            <path d="M16 16 L20 16 L18 20 Z" fill="#997000" />
          </svg>
        </span>
      );

    case 'LY':
      // Libya Flag: Red, Black, Green with white crescent & star
      return (
        <span className={baseContainerClass} title="Libye">
          <svg viewBox="0 0 36 36" className="w-full h-full object-cover">
            <rect width="36" height="9" fill="#E70013" />
            <rect y="9" width="36" height="18" fill="#000000" />
            <rect y="27" width="36" height="9" fill="#239E46" />
            {/* White Crescent & Star */}
            <circle cx="18" cy="18" r="4.5" fill="#FFFFFF" />
            <circle cx="19.5" cy="18" r="3.6" fill="#000000" />
            <polygon
              points="18.5,16 19.2,17.3 20.6,17.3 19.5,18.1 19.9,19.4 18.5,18.6 17.1,19.4 17.5,18.1 16.4,17.3 17.8,17.3"
              fill="#FFFFFF"
            />
          </svg>
        </span>
      );

    case 'FR':
      return (
        <span className={baseContainerClass} title="France">
          <svg viewBox="0 0 36 36" className="w-full h-full object-cover">
            <rect width="12" height="36" fill="#002395" />
            <rect x="12" width="12" height="36" fill="#FFFFFF" />
            <rect x="24" width="12" height="36" fill="#ED2939" />
          </svg>
        </span>
      );

    default:
      return (
        <span className={baseContainerClass} title={country || 'Global'}>
          <span className="font-bold text-[10px] text-slate-600 uppercase">
            {normalizedCode.slice(0, 2) || '🌐'}
          </span>
        </span>
      );
  }
};
