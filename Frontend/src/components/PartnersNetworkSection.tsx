import React, { useState } from 'react';
import {
  Globe,
  ShieldCheck,
  TrendingUp,
  HeartHandshake,
  ArrowRight,
  Calendar,
  Mail,
  Handshake,
  Landmark,
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Hexagon,
} from 'lucide-react';
import heroPanoramaImg from '../assets/images/qiao_clear_bg_1787498360320.jpg';

interface PartnersNetworkSectionProps {
  onStartNow: () => void;
  onBookAppointment: () => void;
  onContactUs: () => void;
}

export const PartnersNetworkSection: React.FC<PartnersNetworkSectionProps> = ({
  onStartNow,
  onBookAppointment,
  onContactUs,
}) => {
  const [carouselIndex, setCarouselIndex] = useState(0);

  const pillars = [
    {
      title: 'Réseau international',
      description: "Accédez à un réseau mondial d'experts, d'institutions et d'entreprises dans plus de 20 pays.",
      icon: Globe,
      color: 'blue',
    },
    {
      title: 'Partenaires vérifiés',
      description: 'Nous sélectionnons rigoureusement nos partenaires pour garantir qualité et fiabilité.',
      icon: ShieldCheck,
      color: 'red',
    },
    {
      title: 'Opportunités exclusives',
      description: "Bénéficiez d'opportunités d'affaires et d'avantages exclusifs grâce à nos partenariats stratégiques.",
      icon: TrendingUp,
      color: 'blue',
    },
    {
      title: 'Confiance & transparence',
      description: "Des relations basées sur l'éthique, la transparence et un engagement durable à vos côtés.",
      icon: HeartHandshake,
      color: 'red',
    },
  ];

  const clientLogos = [
    {
      id: 'tt',
      name: 'TUNISIE TELECOM',
      render: () => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 relative flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-8 h-8">
              <path d="M6 16 C6 8, 14 6, 20 8 C14 10, 10 14, 10 22 Z" fill="#0072ce" />
              <path d="M16 6 C24 6, 26 14, 24 20 C22 14, 18 10, 10 10 Z" fill="#e30613" />
              <circle cx="22" cy="10" r="3" fill="#ffffff" />
            </svg>
          </div>
          <div className="text-left">
            <span className="text-[9px] text-slate-400 block font-arabic leading-none mb-0.5">تونس للإتصالات</span>
            <span className="text-xs font-black tracking-tight text-slate-800">TUNISIE TELECOM</span>
          </div>
        </div>
      ),
    },
    {
      id: 'biat',
      name: 'BIAT',
      render: () => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-900 rounded-sm flex items-center justify-center relative overflow-hidden">
            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-amber-500 border-b-8 border-b-transparent" />
          </div>
          <span className="text-base font-black tracking-widest text-slate-900">BIAT</span>
        </div>
      ),
    },
    {
      id: 'sotufab',
      name: 'SOTUFAB',
      render: () => (
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-sm bg-red-600 text-white flex items-center justify-center">
            <Hexagon className="w-4 h-4 fill-current" />
          </div>
          <span className="text-sm font-black tracking-tight text-red-600">SOTUFAB</span>
        </div>
      ),
    },
    {
      id: 'puro',
      name: 'PURO ILUMINACIÓN',
      render: () => (
        <div className="text-center">
          <div className="text-sm font-black tracking-wider text-slate-900 flex items-center justify-center">
            <span>PUR</span>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 inline-block mx-0.5" />
          </div>
          <div className="text-[8px] tracking-widest font-semibold text-slate-400 uppercase -mt-0.5">
            ILUMINACIÓN
          </div>
        </div>
      ),
    },
    {
      id: 'amen',
      name: 'Amen BANK',
      render: () => (
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-emerald-600">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l-8-4v6l8 4 8-4v-6l-8 4z" />
            </svg>
          </div>
          <div className="text-left">
            <span className="text-[8px] text-emerald-600 block font-arabic leading-none">بنك الأمان</span>
            <span className="text-xs font-bold text-emerald-700">Amen BANK</span>
          </div>
        </div>
      ),
    },
    {
      id: 'ooredoo',
      name: 'ooredoo',
      render: () => (
        <div className="flex items-center">
          <span className="text-base font-black tracking-tight text-red-600 lowercase">ooredoo</span>
        </div>
      ),
    },
    {
      id: 'gica',
      name: 'GICA GROUPE',
      render: () => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-cyan-600 rounded-sm flex items-center justify-center text-white text-[9px] font-black">
            G
          </div>
          <span className="text-xs font-black tracking-tight text-slate-800 uppercase">GICA GROUPE</span>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    setCarouselIndex((prev) => (prev + 1) % clientLogos.length);
  };

  const handlePrev = () => {
    setCarouselIndex((prev) => (prev - 1 + clientLogos.length) % clientLogos.length);
  };

  return (
    <section id="partners" className="py-20 bg-slate-50/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header (Image 3) */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="text-xs sm:text-sm font-bold text-red-600 uppercase tracking-wider mb-2">
            ILS NOUS FONT CONFIANCE
          </div>
          
          {/* Red and Blue dual accent line */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <div className="w-8 h-[2px] bg-red-600 rounded-full" />
            <div className="w-8 h-[2px] bg-blue-600 rounded-full" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Des clients satisfaits, des partenariats <span className="text-red-600">qui durent</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500 font-light max-w-2xl mx-auto">
            Nous accompagnons des entreprises et des institutions de différents secteurs dans leurs projets en Chine et en Afrique du Nord.
          </p>
        </div>

        {/* Client Partners Logo Carousel Card (Image 3) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 mb-8 relative">
          <div className="flex items-center justify-between gap-2">
            {/* Left Chevron Button */}
            <button
              onClick={handlePrev}
              aria-label="Previous client logos"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 flex items-center justify-center shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Logos Row */}
            <div className="flex-1 flex items-center justify-around gap-6 overflow-x-auto py-2 px-2 scrollbar-none">
              {clientLogos.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-center px-4 py-2 hover:scale-105 transition-transform shrink-0"
                >
                  {client.render()}
                </div>
              ))}
            </div>

            {/* Right Chevron Button */}
            <button
              onClick={handleNext}
              aria-label="Next client logos"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 flex items-center justify-center shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 5 Bottom Stats in White Unified Card (Image 3) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 mb-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            
            {/* Stat 1: 1,200+ Entreprises accompagnées */}
            <div className="pt-3 sm:pt-0 sm:px-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <Handshake className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">1,200+</div>
              <div className="text-xs text-slate-500 font-light mt-0.5">Entreprises accompagnées</div>
            </div>

            {/* Stat 2: 20+ Institutions & partenaires publics */}
            <div className="pt-3 sm:pt-0 sm:px-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">20+</div>
              <div className="text-xs text-slate-500 font-light mt-0.5">Institutions & partenaires publics</div>
            </div>

            {/* Stat 3: 20+ Pays connectés Chine - Afrique du Nord */}
            <div className="pt-3 sm:pt-0 sm:px-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">20+</div>
              <div className="text-xs text-slate-500 font-light mt-0.5">Pays connectés Chine - Afrique du Nord</div>
            </div>

            {/* Stat 4: 98% Taux de satisfaction de nos clients */}
            <div className="pt-3 sm:pt-0 sm:px-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">98%</div>
              <div className="text-xs text-slate-500 font-light mt-0.5">Taux de satisfaction de nos clients</div>
            </div>

            {/* Stat 5: +35% De croissance moyenne des projets accompagnés */}
            <div className="col-span-2 sm:col-span-1 pt-3 sm:pt-0 sm:px-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-slate-900">+35%</div>
              <div className="text-xs text-slate-500 font-light mt-0.5">De croissance moyenne des projets</div>
            </div>

          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            const isRed = pillar.color === 'red';
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                      isRed ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{pillar.title}</h3>
                  <p className="text-xs text-slate-500 font-light leading-relaxed">{pillar.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner with Shanghai Bridge Night Skyline */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-[#07152b] border border-slate-800 p-8 sm:p-12 text-white">
          {/* Background image overlay */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img
              src={heroPanoramaImg}
              alt="Bridge background"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#07152b] via-[#07152b]/90 to-[#07152b]/80" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Prêt à transformer vos ambitions en <span className="text-red-400">succès</span> ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
              Rejoignez des milliers d'entreprises et de professionnels qui nous font déjà confiance. L'avenir se construit aujourd'hui avec QIAO.
            </p>

            <div className="pt-4 flex flex-wrap gap-3">
              <button
                onClick={onStartNow}
                className="px-6 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Commencer maintenant</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onBookAppointment}
                className="px-5 py-3 bg-slate-800/80 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Prendre rendez-vous</span>
              </button>

              <button
                onClick={onContactUs}
                className="px-5 py-3 bg-slate-800/80 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-red-400" />
                <span>Nous contacter</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

