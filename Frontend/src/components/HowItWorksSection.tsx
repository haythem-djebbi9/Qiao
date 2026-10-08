import React from 'react';
import {
  Search,
  ShieldCheck,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Play,
  Users,
  Building2,
  Globe,
  UserCheck,
} from 'lucide-react';
import bridgeLogoImg from '../assets/images/qiao_bridge_red_blue_1787498218294.jpg';

interface HowItWorksSectionProps {
  onJoinNow: () => void;
  onOpenVideo: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  onJoinNow,
  onOpenVideo,
}) => {
  const steps = [
    {
      number: '01',
      title: 'Recherchez',
      description: "Trouvez le service, l'expert ou l'opportunité dont vous avez besoin.",
      icon: Search,
      examples: 'Sourcing, conseil juridique, traduction, formation...',
    },
    {
      number: '02',
      title: 'Choisissez en confiance',
      description: 'Consultez les profils vérifiés, les avis et badges de confiance pour faire le bon choix.',
      icon: ShieldCheck,
      examples: 'Experts vérifiés, avis clients, badges qualité...',
    },
    {
      number: '03',
      title: 'Connectez-vous',
      description: 'Échangez, planifiez et collaborez facilement via la plateforme sécurisée QIAO.',
      icon: MessageSquare,
      examples: 'Messagerie sécurisée, visioconférence, documents...',
    },
    {
      number: '04',
      title: 'Développez-vous',
      description: "Lancez et faites croître vos projets en toute sérénité avec l'appui de notre écosystème.",
      icon: TrendingUp,
      examples: 'Suivi de projet, accompagnement, ressources et opportunités...',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-white relative overflow-hidden border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 4 Connected Step Cards (Matching Image 1) */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 items-stretch">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative flex flex-col">
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group">
                  
                  {/* Top Step Circle & Number Badge */}
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="relative mb-4">
                      {/* Big Circle Icon */}
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8]" />
                      </div>
                      
                      {/* Badge number directly below circle */}
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shadow-md">
                        {step.number}
                      </div>
                    </div>

                    {/* Step Title */}
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {step.title}
                    </h3>

                    {/* Subtle red accent line */}
                    <div className="w-5 h-[2px] bg-red-500 rounded-full mx-auto my-2.5 opacity-80" />

                    {/* Description */}
                    <p className="text-xs text-slate-600 font-light leading-relaxed px-1">
                      {step.description}
                    </p>
                  </div>

                  {/* Examples Box at bottom */}
                  <div className="mt-4 pt-3.5 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="text-left">
                        <span className="text-[11px] font-bold text-slate-900 block leading-tight">Exemples :</span>
                        <span className="text-[11px] text-slate-500 font-light leading-snug mt-0.5 block">{step.examples}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dotted indicator for next step on desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3.5 top-14 -translate-y-1/2 z-10 text-slate-300 pointer-events-none items-center">
                    <span className="text-xs tracking-widest text-slate-400 font-mono">⋯⋯→</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating Partnership Map Banner (Exact Match to Image 1 Bottom) */}
        <div className="bg-gradient-to-r from-blue-900/5 via-slate-900/5 to-red-900/5 rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          
          {/* Stylized Background World Map with Glowing Trajectory connecting China & North Africa */}
          <div className="absolute right-0 top-0 bottom-0 w-full lg:w-3/5 pointer-events-none opacity-40 lg:opacity-75 flex items-center justify-end overflow-hidden">
            <svg viewBox="0 0 700 350" className="w-full h-full object-cover">
              <defs>
                {/* Glow Filter */}
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Dotted Map Base Graphic */}
              <g fill="#0284c7" opacity="0.45">
                {/* Stylized Africa/Europe/Asia dotted silhouette clusters */}
                <circle cx="180" cy="180" r="3" />
                <circle cx="195" cy="175" r="3" />
                <circle cx="210" cy="170" r="3" />
                <circle cx="225" cy="165" r="3" />
                <circle cx="240" cy="170" r="3" />
                <circle cx="200" cy="190" r="3" />
                <circle cx="215" cy="195" r="3" />
                <circle cx="230" cy="200" r="3" />
                <circle cx="245" cy="205" r="3" />
                
                {/* Europe */}
                <circle cx="190" cy="120" r="2.5" />
                <circle cx="210" cy="115" r="2.5" />
                <circle cx="230" cy="110" r="2.5" />
                <circle cx="250" cy="115" r="2.5" />
                
                {/* Asia / China */}
                <circle cx="480" cy="150" r="3" />
                <circle cx="500" cy="140" r="3" />
                <circle cx="520" cy="145" r="3" />
                <circle cx="540" cy="150" r="3" />
                <circle cx="560" cy="160" r="3" />
                <circle cx="490" cy="165" r="3" />
                <circle cx="510" cy="170" r="3" />
                <circle cx="530" cy="175" r="3" />
                <circle cx="550" cy="180" r="3" />
                <circle cx="570" cy="190" r="3" />
                <circle cx="520" cy="195" r="3" />
                <circle cx="540" cy="200" r="3" />
                <circle cx="560" cy="205" r="3" />
              </g>

              {/* China Highlighted Area in Red */}
              <circle cx="535" cy="170" r="42" fill="#dc2626" opacity="0.22" filter="url(#glow-red)" />
              <circle cx="535" cy="170" r="24" fill="#dc2626" opacity="0.35" />

              {/* Glowing Arcs connecting North Africa to China */}
              <path
                d="M 210 185 Q 360 80 535 170"
                fill="none"
                stroke="url(#arc-gradient)"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />
              <path
                d="M 210 185 Q 370 120 535 170"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeOpacity="0.7"
              />
              <path
                d="M 210 185 Q 380 50 535 170"
                fill="none"
                stroke="#0284c7"
                strokeWidth="1"
                strokeDasharray="6 4"
                strokeOpacity="0.6"
              />

              {/* North Africa Pin (Blue) */}
              <circle cx="210" cy="185" r="6" fill="#0284c7" filter="url(#glow-blue)" />
              <circle cx="210" cy="185" r="3" fill="#FFFFFF" />

              {/* China Pin (Red) */}
              <circle cx="535" cy="170" r="7" fill="#dc2626" filter="url(#glow-red)" />
              <circle cx="535" cy="170" r="3.5" fill="#FFFFFF" />
            </svg>
          </div>

          <div className="relative z-10">
            {/* Top Row: QIAO Info & Buttons */}
            <div className="max-w-2xl space-y-4 mb-8">
              
              <div className="flex items-center gap-3.5">
                {/* Bridge Circular Badge */}
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-900 flex items-center justify-center shrink-0">
                  <img
                    src={bridgeLogoImg}
                    alt="QIAO Bridge"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                    QIAO, votre partenaire de confiance
                  </h3>
                  <div className="text-base sm:text-lg font-bold text-slate-900">
                    entre la <span className="text-red-600">Chine</span> et <span className="text-blue-600">l'Afrique du Nord</span>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed max-w-xl">
                Une méthode claire, un réseau fiable et des solutions sur-mesure pour transformer vos ambitions en succès durables.
              </p>

              {/* Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={onJoinNow}
                  className="px-6 py-2.5 bg-[#07152b] hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-full shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Rejoindre QIAO maintenant</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenVideo}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-medium rounded-full border border-slate-200 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </div>
                  <span>Voir la vidéo</span>
                </button>
              </div>
            </div>

            {/* Bottom Row: 4 Key Metrics (Exact Match to Image 1) */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
              
              {/* Stat 1: 10,000+ Utilisateurs actifs */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-slate-900">10,000+</div>
                  <div className="text-[11px] text-slate-500 font-light">Utilisateurs actifs</div>
                </div>
              </div>

              {/* Stat 2: 5,000+ Experts vérifiés */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-slate-900">5,000+</div>
                  <div className="text-[11px] text-slate-500 font-light">Experts vérifiés</div>
                </div>
              </div>

              {/* Stat 3: 1,200+ Entreprises accompagnées */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-slate-900">1,200+</div>
                  <div className="text-[11px] text-slate-500 font-light">Entreprises accompagnées</div>
                </div>
              </div>

              {/* Stat 4: 20+ Pays connectés */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-slate-900">20+</div>
                  <div className="text-[11px] text-slate-500 font-light">Pays connectés</div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

