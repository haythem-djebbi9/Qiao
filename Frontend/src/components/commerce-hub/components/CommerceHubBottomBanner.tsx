import React from 'react';
import { Database, Target, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import skylineNightBg from '../../../assets/images/china_corridor_night_skyline_1790804583067.jpg';

interface CommerceHubBottomBannerProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  customPillars?: { label: string; icon: any }[];
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export const CommerceHubBottomBanner: React.FC<CommerceHubBottomBannerProps> = ({
  title = 'Rejoignez la communauté QIAO Intelligence',
  description = 'Accédez à des analyses exclusives, des opportunités vérifiées et un réseau de partenaires pour développer votre activité.',
  primaryButtonText = 'Créer un compte',
  secondaryButtonText = 'Demander une démonstration',
  customPillars,
  onPrimaryClick,
  onSecondaryClick,
}) => {
  const defaultPillars = [
    { label: 'DES DONNÉES FIABLES', icon: Database },
    { label: 'DES OPPORTUNITÉS CONCRÈTES', icon: Target },
    { label: 'UN RÉSEAU DE PARTENAIRES', icon: Users },
    { label: 'UN IMPACT RÉEL', icon: Sparkles },
  ];

  const pillars = customPillars && customPillars.length > 0 ? customPillars : defaultPillars;

  return (
    <div className="relative overflow-hidden bg-[#07152b] text-white py-12 px-6 sm:px-10 rounded-2xl shadow-2xl border border-slate-800">
      {/* Background Skyline Silhouette with gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={skylineNightBg}
          alt="Night City Skyline"
          className="w-full h-full object-cover object-center opacity-65 contrast-125 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07152b] via-[#07152b]/70 to-[#07152b]/50" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        {/* Left Side: Call to Action Details */}
        <div className="max-w-2xl text-center lg:text-left flex-1">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2.5">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed mb-6 max-w-xl">
            {description}
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
            <button
              onClick={onPrimaryClick}
              className="px-6 py-2.5 rounded-lg bg-[#E31E24] hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-red-600/30 transition-all cursor-pointer active:scale-95"
            >
              {primaryButtonText}
            </button>
            <button
              onClick={onSecondaryClick}
              className="px-5 py-2.5 rounded-lg bg-transparent hover:bg-white/10 text-white border border-white/60 hover:border-white font-medium text-xs sm:text-sm transition-all cursor-pointer"
            >
              {secondaryButtonText}
            </button>
          </div>
        </div>

        {/* Vertical divider on desktop */}
        <div className="hidden lg:block w-[1px] h-28 bg-slate-700/80" />

        {/* Right Side: 4 Core Checklist Pillars with Circular Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5 text-xs font-semibold tracking-wider text-slate-200 shrink-0 w-full sm:w-auto">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-xs"
              >
                <div className="w-6 h-6 rounded-full border border-slate-400 text-slate-300 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-100 uppercase tracking-[0.14em]">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
