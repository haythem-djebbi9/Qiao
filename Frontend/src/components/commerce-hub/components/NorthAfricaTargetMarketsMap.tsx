import React, { useState } from "react";

interface NorthAfricaTargetMarketsMapProps {
  onSelectCountry?: (country: string) => void;
}

export const NorthAfricaTargetMarketsMap: React.FC<NorthAfricaTargetMarketsMapProps> = ({
  onSelectCountry,
}) => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-blue-50/70 via-slate-50/50 to-blue-50/40 p-4 border border-blue-100 min-h-[200px] flex items-center justify-center overflow-hidden my-2 select-none">
      
      {/* Real Geographic Vector Map of North Africa */}
      <svg
        viewBox="0 0 400 200"
        className="w-full h-full max-h-[170px] drop-shadow-xs"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="countryGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.15" />
          </filter>
        </defs>

        <g stroke="#ffffff" strokeWidth="1.4" strokeLinejoin="round" filter="url(#countryGlow)">
          {/* Morocco (including Western Sahara / Southern Provinces) */}
          <path
            d="M 135.6 45.0 L 138.0 50.5 L 138.4 55.7 L 140.5 64.7 L 142.2 66.6 L 141.0 69.9 L 132.9 71.3 L 130.0 74.5 L 126.4 75.3 L 126.2 81.6 L 118.9 85.0 L 116.5 89.3 L 111.4 91.6 L 105.1 92.9 L 95.1 99.2 L 95.1 109.4 L 94.2 109.4 L 94.3 114.0 L 90.5 114.2 L 88.4 116.2 L 85.6 116.2 L 83.3 115.1 L 78.1 116.0 L 76.1 122.7 L 74.1 123.3 L 71.2 134.1 L 62.5 143.4 L 60.5 155.2 L 57.9 159.0 L 57.2 162.1 L 43.1 162.8 L 43.0 162.8 L 43.3 158.8 L 45.7 156.5 L 47.7 152.0 L 47.3 149.1 L 49.5 143.1 L 52.9 137.6 L 55.0 136.3 L 56.7 131.3 L 56.8 126.7 L 59.1 121.4 L 63.2 118.3 L 67.2 109.5 L 67.3 109.4 L 70.5 106.1 L 76.3 105.2 L 81.2 99.3 L 84.3 97.0 L 89.5 89.9 L 87.9 79.2 L 90.3 71.8 L 91.2 67.3 L 95.2 61.5 L 101.4 57.6 L 106.1 54.1 L 110.2 45.2 L 112.2 39.9 L 116.8 40.0 L 120.5 43.6 L 126.5 43.0 L 132.9 44.9 L 135.6 45.0 Z M 95.1 109.4 L 95.1 109.9 L 95.0 111.6 L 95.0 124.6 L 74.5 124.1 L 74.7 146.1 L 68.9 146.8 L 67.3 151.2 L 68.5 163.6 L 44.1 163.6 L 42.7 166.4 L 43.0 162.8 L 43.1 162.8 L 57.2 162.1 L 57.9 159.0 L 60.5 155.2 L 62.5 143.4 L 71.2 134.1 L 74.1 123.3 L 76.1 122.7 L 78.1 116.0 L 83.3 115.1 L 85.6 116.2 L 88.4 116.2 L 90.5 114.2 L 94.3 114.0 L 94.2 109.4 L 95.1 109.4 Z"
            fill={hoveredCountry === "morocco" ? "#2563eb" : "#1d4ed8"}
            className="cursor-pointer transition-colors duration-200"
            onMouseEnter={() => setHoveredCountry("morocco")}
            onMouseLeave={() => setHoveredCountry(null)}
            onClick={() => onSelectCountry?.("Maroc")}
          />

          {/* Algeria */}
          <path
            d="M 95.0 111.6 L 95.1 109.9 L 95.1 109.4 L 95.1 99.2 L 105.1 92.9 L 111.4 91.6 L 116.5 89.3 L 118.9 85.0 L 126.2 81.6 L 126.4 75.3 L 130.0 74.5 L 132.9 71.3 L 141.0 69.9 L 142.2 66.6 L 140.5 64.7 L 138.4 55.7 L 138.0 50.5 L 135.6 45.0 L 141.6 40.3 L 148.4 38.8 L 152.3 35.3 L 158.3 32.7 L 168.9 31.1 L 179.2 30.4 L 182.4 31.7 L 188.2 28.3 L 194.9 28.3 L 197.4 30.3 L 201.7 29.7 L 200.4 34.1 L 201.4 42.3 L 200.0 49.4 L 196.1 54.2 L 196.7 60.6 L 201.8 65.7 L 201.8 67.8 L 205.7 71.3 L 208.3 86.6 L 210.3 94.2 L 210.7 98.2 L 209.6 105.2 L 210.0 109.1 L 209.2 113.8 L 209.8 119.2 L 207.3 122.8 L 211.0 129.0 L 211.2 132.7 L 213.5 137.5 L 216.4 135.9 L 221.3 139.9 L 224.0 145.2 L 202.7 161.6 L 184.6 178.4 L 175.8 182.2 L 168.9 183.1 L 168.8 177.6 L 165.9 176.2 L 162.0 173.8 L 160.5 169.8 L 139.5 151.1 L 118.5 132.4 L 95.0 111.6 Z"
            fill={hoveredCountry === "algeria" ? "#3b82f6" : "#2563eb"}
            className="cursor-pointer transition-colors duration-200"
            onMouseEnter={() => setHoveredCountry("algeria")}
            onMouseLeave={() => setHoveredCountry(null)}
            onClick={() => onSelectCountry?.("Algérie")}
          />

          {/* Tunisia */}
          <path
            d="M 208.3 86.6 L 205.7 71.3 L 201.8 67.8 L 201.8 65.7 L 196.7 60.6 L 196.1 54.2 L 200.0 49.4 L 201.4 42.3 L 200.4 34.1 L 201.7 29.7 L 208.5 26.3 L 212.9 27.3 L 212.7 31.7 L 218.0 28.5 L 218.4 30.1 L 215.3 34.3 L 215.3 38.3 L 217.4 40.4 L 216.6 47.9 L 212.5 52.2 L 213.7 56.8 L 216.9 57.0 L 218.5 61.1 L 220.8 62.4 L 220.5 69.0 L 217.5 71.4 L 215.5 74.2 L 211.2 77.5 L 211.9 81.0 L 211.4 84.7 L 208.3 86.6 Z"
            fill={hoveredCountry === "tunisia" ? "#0ea5e9" : "#38bdf8"}
            className="cursor-pointer transition-colors duration-200"
            onMouseEnter={() => setHoveredCountry("tunisia")}
            onMouseLeave={() => setHoveredCountry(null)}
            onClick={() => onSelectCountry?.("Tunisie")}
          />

          {/* Libya */}
          <path
            d="M 305.1 157.9 L 305.1 175.0 L 298.0 175.0 L 297.9 178.6 L 273.0 162.2 L 248.1 145.8 L 241.8 150.5 L 237.4 153.6 L 233.9 148.9 L 224.0 145.2 L 221.3 139.9 L 216.4 135.9 L 213.5 137.5 L 211.2 132.7 L 211.0 129.0 L 207.3 122.8 L 209.8 119.2 L 209.2 113.8 L 210.0 109.1 L 209.6 105.2 L 210.7 98.2 L 210.3 94.2 L 208.3 86.6 L 211.4 84.7 L 211.9 81.0 L 211.2 77.5 L 215.5 74.2 L 217.5 71.4 L 220.5 69.0 L 220.8 62.4 L 228.2 65.3 L 230.8 64.6 L 236.0 66.0 L 244.3 69.9 L 247.2 77.5 L 252.8 79.2 L 261.6 82.7 L 268.2 87.0 L 271.3 84.8 L 274.3 80.8 L 272.8 74.3 L 274.8 70.1 L 279.3 66.1 L 283.6 64.9 L 292.0 66.7 L 294.1 70.5 L 296.5 70.5 L 298.4 72.0 L 304.6 73.0 L 306.2 75.8 L 303.9 79.9 L 304.9 83.6 L 303.3 88.9 L 305.1 95.8 L 305.1 126.3 L 305.1 157.9 Z"
            fill={hoveredCountry === "libya" ? "#2563eb" : "#1e40af"}
            className="cursor-pointer transition-colors duration-200"
            onMouseEnter={() => setHoveredCountry("libya")}
            onMouseLeave={() => setHoveredCountry(null)}
            onClick={() => onSelectCountry?.("Libye")}
          />

          {/* Egypt */}
          <path
            d="M 379.2 157.9 L 354.4 157.9 L 330.2 157.9 L 305.1 157.9 L 305.1 126.3 L 305.1 95.8 L 303.3 88.9 L 304.9 83.6 L 303.9 79.9 L 306.2 75.8 L 314.5 75.7 L 320.5 78.0 L 326.7 80.5 L 329.6 81.8 L 334.4 79.1 L 336.9 76.7 L 342.4 75.9 L 346.9 77.0 L 348.6 81.3 L 350.0 78.5 L 355.0 80.5 L 359.9 81.0 L 362.9 78.8 L 362.9 78.8 L 366.4 91.3 L 367.0 93.6 L 365.3 97.0 L 363.9 103.5 L 362.2 107.9 L 360.8 109.4 L 358.7 106.7 L 355.9 102.8 L 351.4 90.6 L 350.8 91.3 L 353.4 100.4 L 357.2 109.0 L 361.9 122.4 L 364.2 127.0 L 366.2 131.9 L 371.8 141.3 L 370.6 142.8 L 370.8 148.4 L 378.1 156.1 L 379.2 157.9 Z"
            fill={hoveredCountry === "egypt" ? "#1e40af" : "#1e3a8a"}
            className="cursor-pointer transition-colors duration-200"
            onMouseEnter={() => setHoveredCountry("egypt")}
            onMouseLeave={() => setHoveredCountry(null)}
            onClick={() => onSelectCountry?.("Égypte")}
          />
        </g>
      </svg>

      {/* Top Left Badges: MA, DZ, TN (Matching Screenshot Exactly) */}
      <div className="absolute left-3 top-3 space-y-1.5 z-10">
        {/* Maroc */}
        <div
          onMouseEnter={() => setHoveredCountry("morocco")}
          onMouseLeave={() => setHoveredCountry(null)}
          onClick={() => onSelectCountry?.("Maroc")}
          className={`bg-white/95 px-2.5 py-1 rounded-xl shadow-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
            hoveredCountry === "morocco"
              ? "border-blue-500 scale-105 ring-2 ring-blue-400/20 shadow-md"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-black text-slate-800 tracking-wider">MA</span>
          <span className="text-xs font-semibold text-slate-700">Maroc :</span>
          <strong className="text-xs font-extrabold text-blue-600">6,8 Mds</strong>
        </div>

        {/* Algérie */}
        <div
          onMouseEnter={() => setHoveredCountry("algeria")}
          onMouseLeave={() => setHoveredCountry(null)}
          onClick={() => onSelectCountry?.("Algérie")}
          className={`bg-white/95 px-2.5 py-1 rounded-xl shadow-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
            hoveredCountry === "algeria"
              ? "border-blue-500 scale-105 ring-2 ring-blue-400/20 shadow-md"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-black text-slate-800 tracking-wider">DZ</span>
          <span className="text-xs font-semibold text-slate-700">Algérie :</span>
          <strong className="text-xs font-extrabold text-blue-600">5,9 Mds</strong>
        </div>

        {/* Tunisie */}
        <div
          onMouseEnter={() => setHoveredCountry("tunisia")}
          onMouseLeave={() => setHoveredCountry(null)}
          onClick={() => onSelectCountry?.("Tunisie")}
          className={`bg-white/95 px-2.5 py-1 rounded-xl shadow-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
            hoveredCountry === "tunisia"
              ? "border-sky-500 scale-105 ring-2 ring-sky-400/20 shadow-md"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-black text-slate-800 tracking-wider">TN</span>
          <span className="text-xs font-semibold text-slate-700">Tunisie :</span>
          <strong className="text-xs font-extrabold text-blue-600">4,2 Mds</strong>
        </div>
      </div>

      {/* Bottom Right Badges: LY, EG (Matching Screenshot Exactly) */}
      <div className="absolute right-3 bottom-3 space-y-1.5 z-10">
        {/* Libye */}
        <div
          onMouseEnter={() => setHoveredCountry("libya")}
          onMouseLeave={() => setHoveredCountry(null)}
          onClick={() => onSelectCountry?.("Libye")}
          className={`bg-white/95 px-2.5 py-1 rounded-xl shadow-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
            hoveredCountry === "libya"
              ? "border-blue-500 scale-105 ring-2 ring-blue-400/20 shadow-md"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-black text-slate-800 tracking-wider">LY</span>
          <span className="text-xs font-semibold text-slate-700">Libye :</span>
          <strong className="text-xs font-extrabold text-blue-600">4,1 Mds</strong>
        </div>

        {/* Égypte */}
        <div
          onMouseEnter={() => setHoveredCountry("egypt")}
          onMouseLeave={() => setHoveredCountry(null)}
          onClick={() => onSelectCountry?.("Égypte")}
          className={`bg-white/95 px-2.5 py-1 rounded-xl shadow-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
            hoveredCountry === "egypt"
              ? "border-blue-500 scale-105 ring-2 ring-blue-400/20 shadow-md"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-black text-slate-800 tracking-wider">EG</span>
          <span className="text-xs font-semibold text-slate-700">Égypte :</span>
          <strong className="text-xs font-extrabold text-blue-600">4,1 Mds</strong>
        </div>
      </div>

    </div>
  );
};
