import React from 'react';

export type CountryCode = 'TN' | 'DZ' | 'MA' | 'EG' | 'LY' | 'CN' | 'tn' | 'dz' | 'ma' | 'eg' | 'ly' | 'cn';

interface FlagIconProps {
  country: CountryCode | string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const FlagIcon: React.FC<FlagIconProps> = ({
  country,
  className = '',
  size = 'md',
}) => {
  const code = (country || '').toUpperCase().trim();

  const sizeClasses = {
    xs: 'w-3.5 h-2.5',
    sm: 'w-4 h-3',
    md: 'w-5 h-3.5',
    lg: 'w-6 h-4.5',
    xl: 'w-8 h-5.5',
    '2xl': 'w-10 h-7',
  }[size];

  // Authentic vector flags with correct official colors & proportions
  const renderFlag = () => {
    switch (code) {
      case 'TN':
      case 'TUNISIE':
      case 'TUNISIA':
        return (
          // Tunisia: Red field with white circle containing red crescent and star
          <svg viewBox="0 0 300 200" className="w-full h-full" preserveAspectRatio="none">
            <rect width="300" height="200" fill="#e70013" />
            <circle cx="150" cy="100" r="45" fill="#ffffff" />
            {/* Red crescent inside white disc */}
            <path
              fillRule="evenodd"
              d="M 150,100 m -35,0 a 35,35 0 1,0 70,0 a 35,35 0 1,0 -70,0 M 158,100 m -28,0 a 28,28 0 1,1 56,0 a 28,28 0 1,1 -56,0"
              fill="#e70013"
            />
            {/* 5-pointed star */}
            <polygon
              points="162,84 167,95 178,95 169,102 173,113 162,106 151,113 155,102 146,95 157,95"
              fill="#e70013"
            />
          </svg>
        );

      case 'DZ':
      case 'ALGÉRIE':
      case 'ALGERIE':
      case 'ALGERIA':
        return (
          // Algeria: Green left half, white right half, red crescent and star
          <svg viewBox="0 0 300 200" className="w-full h-full" preserveAspectRatio="none">
            <rect width="150" height="200" fill="#006633" />
            <rect x="150" width="150" height="200" fill="#ffffff" />
            {/* Red crescent centered on boundary with fillRule evenodd */}
            <path
              fillRule="evenodd"
              d="M 150,100 m -50,0 a 50,50 0 1,0 100,0 a 50,50 0 1,0 -100,0 M 162,100 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"
              fill="#d21034"
            />
            {/* Red Star positioned into crescent horns */}
            <polygon
              points="168,78 174,93 190,93 177,102 182,117 168,107 154,117 159,102 146,93 162,93"
              fill="#d21034"
            />
          </svg>
        );

      case 'MA':
      case 'MAROC':
      case 'MOROCCO':
        return (
          // Morocco: Red field with emerald green five-pointed pentagram
          <svg viewBox="0 0 300 200" className="w-full h-full" preserveAspectRatio="none">
            <rect width="300" height="200" fill="#c1272d" />
            {/* Green interlaced pentagram */}
            <polygon
              points="150,48 181,142 100,86 200,86 119,142"
              stroke="#006233"
              strokeWidth="8"
              fill="none"
              strokeLinejoin="miter"
            />
          </svg>
        );

      case 'EG':
      case 'ÉGYPTE':
      case 'EGYPTE':
      case 'EGYPT':
        return (
          // Egypt: Tricolor (Red, White, Black) with Eagle of Saladin
          <svg viewBox="0 0 300 200" className="w-full h-full" preserveAspectRatio="none">
            <rect width="300" height="66.67" fill="#ce1126" />
            <rect y="66.67" width="300" height="66.67" fill="#ffffff" />
            <rect y="133.34" width="300" height="66.67" fill="#000000" />
            {/* Eagle of Saladin in gold */}
            <g transform="translate(150, 100) scale(0.7)">
              <path d="M -12 2 L -18 -12 L -9 -6 L 0 -16 L 9 -6 L 18 -12 L 12 2 Z" fill="#c09300" />
              <rect x="-6" y="-5" width="12" height="15" fill="#ffffff" stroke="#c09300" strokeWidth="1.5" />
              <path d="M -7 14 L 7 14 L 8 20 L -8 20 Z" fill="#c09300" />
              <ellipse cx="0" cy="0" rx="3" ry="5" fill="#c09300" />
            </g>
          </svg>
        );

      case 'LY':
      case 'LIBYE':
      case 'LIBYA':
        return (
          // Libya: Tricolor (Red, Black double-height, Green) with white crescent and star
          <svg viewBox="0 0 300 200" className="w-full h-full" preserveAspectRatio="none">
            <rect width="300" height="50" fill="#e70013" />
            <rect y="50" width="300" height="100" fill="#000000" />
            <rect y="150" width="300" height="50" fill="#239e46" />
            {/* White crescent & star in the center black band */}
            <path
              fillRule="evenodd"
              d="M 150,100 m -26,0 a 26,26 0 1,0 52,0 a 26,26 0 1,0 -52,0 M 156,100 m -21,0 a 21,21 0 1,1 42,0 a 21,21 0 1,1 -42,0"
              fill="#ffffff"
            />
            <polygon
              points="159,88 163,96 172,96 164,101 167,110 160,104 153,110 156,101 148,96 157,96"
              fill="#ffffff"
            />
          </svg>
        );

      case 'CN':
      case 'CHINE':
      case 'CHINA':
        return (
          // China: Red field with five golden stars
          <svg viewBox="0 0 300 200" className="w-full h-full" preserveAspectRatio="none">
            <rect width="300" height="200" fill="#de2910" />
            {/* Big star */}
            <polygon
              points="50,22 57,44 79,44 61,57 68,78 50,65 32,78 39,57 21,44 43,44"
              fill="#ffde00"
            />
            {/* 4 small stars */}
            <g fill="#ffde00">
              <polygon points="100,12 102,18 108,18 103,22 105,28 100,24 95,28 97,22 92,18 98,18" />
              <polygon points="120,32 122,38 128,38 123,42 125,48 120,44 115,48 117,42 112,38 118,38" />
              <polygon points="120,62 122,68 128,68 123,72 125,78 120,74 115,78 117,72 112,68 118,68" />
              <polygon points="100,82 102,88 108,88 103,92 105,98 100,94 95,98 97,92 92,88 98,88" />
            </g>
          </svg>
        );

      default:
        return (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
            {code.slice(0, 2)}
          </div>
        );
    }
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-2xs overflow-hidden shadow-2xs border border-black/10 select-none align-middle ${sizeClasses} ${className}`}
      title={code}
    >
      {renderFlag()}
    </span>
  );
};
