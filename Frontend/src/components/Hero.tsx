import React, { useState } from 'react';
import {
  Search,
  Briefcase,
  Scale,
  Ship,
  MessageSquare,
  User,
  Building,
  Heart,
  Plane,
  MoreHorizontal,
  Users,
  ShieldCheck,
  Building2,
  Globe,
  Star,
} from 'lucide-react';

interface HeroProps {
  onSearch?: (query: string) => void;
  onSelectCategory?: (cat: string) => void;
  onSelectOrientation?: (origin: 'china' | 'north-africa') => void;
  selectedOrientation?: 'china' | 'north-africa' | null;
  onOpenCalculator?: () => void;
  onOpenRegister?: () => void;
  onOpenVideo?: () => void;
  onExploreServices?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSearch,
  onSelectCategory,
  onSelectOrientation,
  selectedOrientation: propOrientation,
  onOpenCalculator,
  onOpenRegister,
  onOpenVideo,
  onExploreServices,
}) => {
  const [internalOrientation, setInternalOrientation] = useState<'china' | 'north-africa' | null>(null);
  const selectedOrientation = propOrientation !== undefined ? propOrientation : internalOrientation;
  
  const handleOrientationChange = (origin: 'china' | 'north-africa') => {
    setInternalOrientation(origin);
    onSelectOrientation?.(origin);
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Business');

  const categories = [
    { name: 'Business', icon: Briefcase },
    { name: 'Juridique', icon: Scale },
    { name: 'Logistique', icon: Ship },
    { name: 'Traduction', icon: MessageSquare },
    { name: 'Recrutement', icon: User },
    { name: 'Immobilier', icon: Building },
    { name: 'Santé', icon: Heart },
    { name: 'Tourisme', icon: Plane },
    { name: 'Plus', icon: MoreHorizontal },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch?.(searchTerm.trim());
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleCategoryClick = (catName: string) => {
    if (catName === 'Plus') {
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    setActiveCategory(catName);
    onSelectCategory?.(catName);
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-[100svh] pt-24 sm:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col justify-between">
      
      {/* Main Hero Headline & CTAs (Lowered and Centered in the Page) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 flex-1 flex flex-col justify-center items-center py-6 sm:py-10 lg:py-14 my-auto">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          
          {/* Eyebrow Tag - Apex of pyramid */}
          <div className="inline-flex items-center justify-center text-[10px] sm:text-xs font-semibold text-white/90 uppercase tracking-[0.2em] mb-3.5 sm:mb-4 px-4 sm:px-5 py-1.5 rounded-full bg-[#07152b]/70 backdrop-blur-md border border-white/20 shadow-sm">
            CONNECTER LES CULTURES, CRÉER DES OPPORTUNITÉS
          </div>

          {/* Main Title - Pyramid stepped headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-bold text-white tracking-tight leading-[1.18] mb-4 drop-shadow-lg">
            <span className="block text-2xl sm:text-4xl lg:text-[42px] font-semibold text-white/95">
              Le pont entre
            </span>
            <span className="block mt-1.5">
              la <span className="text-red-500">Chine</span> &amp; <span className="text-sky-400">l'Afrique du Nord</span>
            </span>
          </h1>

          {/* Subtitle Description - Pyramid tier */}
          <div className="text-xs sm:text-sm lg:text-[14.5px] text-white/95 font-light leading-[1.7] mb-6 sm:mb-8 drop-shadow-md max-w-2xl text-center space-y-1 sm:space-y-1.5">
            <p className="font-normal">QIAO connecte les cultures, les entreprises et les opportunités.</p>
            <p>Trouvez les bons experts, accédez à des services de confiance</p>
            <p>et développez vos projets en toute sérénité.</p>
          </div>

          {/* Orientation Pill Buttons - Centered base of the pyramid */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-5">
            {/* China Pill */}
            <button
              onClick={() => handleOrientationChange('china')}
              className={`px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2.5 cursor-pointer shadow-xl active:scale-98 ${
                selectedOrientation === 'china'
                  ? 'bg-[#dc2626] text-white ring-2 ring-red-400'
                  : 'bg-[#dc2626] hover:bg-[#b91c1c] text-white'
              }`}
            >
              {/* Round China Flag Circle */}
              <span className="w-5 h-5 rounded-full bg-red-700 border border-red-400/50 flex items-center justify-center text-[10px] text-white shadow-xs font-bold shrink-0">
                ★
              </span>
              <span>Je viens de Chine</span>
            </button>

            {/* North Africa Pill */}
            <button
              onClick={() => handleOrientationChange('north-africa')}
              className={`px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2.5 cursor-pointer shadow-xl backdrop-blur-md active:scale-98 ${
                selectedOrientation === 'north-africa'
                  ? 'bg-[#0a1b38] text-white ring-2 ring-blue-400 border border-blue-400'
                  : 'bg-[#0a1b38]/90 hover:bg-[#122852] text-white border border-white/20'
              }`}
            >
              {/* Round Blue Globe Circle */}
              <span className="w-5 h-5 rounded-full bg-blue-600 border border-white/40 flex items-center justify-center text-[11px] text-white shadow-xs shrink-0">
                🌍
              </span>
              <span>Je viens d'Afrique du Nord</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Consolidated Dock & Coordinates Strip - Positioned cleanly at the base */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 mt-auto pt-6 sm:pt-8">
        
        {/* Sleek Dark Frosted Glass Dock (Search + Categories on Left, Key Metrics on Right) */}
        <div className="bg-[#061329]/85 backdrop-blur-xl rounded-[24px] p-3.5 sm:p-4 lg:p-5 px-5 sm:px-7 text-white border border-white/20 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
            
            {/* Left Section: Search Bar & Categories Row (7 Columns) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
              {/* Search Form Pill */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="flex items-center bg-[#0b1d3a]/60 border border-white/20 rounded-2xl p-1.5 focus-within:border-sky-400 transition-all shadow-inner">
                  <div className="pl-3.5 pr-2 text-white/70">
                    <Search className="w-4.5 h-4.5 text-white/80" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un service, un expert, une opportunité..."
                    className="flex-1 bg-transparent text-white placeholder-white/50 text-xs sm:text-sm font-light focus:outline-none pr-2"
                  />
                  <button
                    type="submit"
                    className="px-6 sm:px-8 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer active:scale-98"
                  >
                    Rechercher
                  </button>
                </div>
              </form>

              {/* Service Categories Icons Row with Outline Icons */}
              <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = activeCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryClick(cat.name)}
                      className={`flex flex-col items-center gap-1 group transition-all min-w-[50px] sm:min-w-[58px] p-1 rounded-lg cursor-pointer ${
                        isSelected ? 'text-white font-medium' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-center w-6 h-6 group-hover:scale-110 transition-transform">
                        {cat.name === 'Plus' ? (
                          <div className="grid grid-cols-2 gap-1 w-3.5 h-3.5 place-items-center">
                            <span className="w-1.5 h-1.5 rounded-full border border-white/60 group-hover:border-white" />
                            <span className="w-1.5 h-1.5 rounded-full border border-white/60 group-hover:border-white" />
                            <span className="w-1.5 h-1.5 rounded-full border border-white/60 group-hover:border-white" />
                            <span className="w-1.5 h-1.5 rounded-full border border-white/60 group-hover:border-white" />
                          </div>
                        ) : (
                          <Icon className="w-5 h-5 text-white/70 group-hover:text-white stroke-[1.5]" />
                        )}
                      </div>
                      <span className="text-[11px] text-white/70 group-hover:text-white whitespace-nowrap font-light">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Section: 5 Statistics Columns (5 Columns, with divider line) */}
            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/20 pt-3 lg:pt-0 lg:pl-6">
              <div className="grid grid-cols-5 gap-1 sm:gap-2 items-start text-center">
                
                {/* 1. +10,000 Utilisateurs actifs */}
                <div className="flex flex-col items-center">
                  <div className="mb-1 text-sky-400">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400 stroke-[1.6]" />
                  </div>
                  <div className="text-sm sm:text-base lg:text-[17px] font-bold text-white tracking-tight leading-tight">
                    +10,000
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-white/75 font-light mt-0.5 leading-tight">
                    Utilisateurs<br />actifs
                  </div>
                </div>

                {/* 2. +5,000 Experts & prestataires vérifiés */}
                <div className="flex flex-col items-center">
                  <div className="mb-1 text-red-400">
                    <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 stroke-[1.6]" />
                  </div>
                  <div className="text-sm sm:text-base lg:text-[17px] font-bold text-white tracking-tight leading-tight">
                    +5,000
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-white/75 font-light mt-0.5 leading-tight">
                    Experts &amp;<br />prestataires<br />vérifiés
                  </div>
                </div>

                {/* 3. +1,200 Entreprises accompagnées */}
                <div className="flex flex-col items-center">
                  <div className="mb-1 text-sky-400">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400 stroke-[1.6]" />
                  </div>
                  <div className="text-sm sm:text-base lg:text-[17px] font-bold text-white tracking-tight leading-tight">
                    +1,200
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-white/75 font-light mt-0.5 leading-tight">
                    Entreprises<br />accompagnées
                  </div>
                </div>

                {/* 4. +20 Pays connectés */}
                <div className="flex flex-col items-center">
                  <div className="mb-1 text-red-400">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 stroke-[1.6]" />
                  </div>
                  <div className="text-sm sm:text-base lg:text-[17px] font-bold text-white tracking-tight leading-tight">
                    +20
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-white/75 font-light mt-0.5 leading-tight">
                    Pays<br />connectés
                  </div>
                </div>

                {/* 5. 98% Taux de satisfaction */}
                <div className="flex flex-col items-center">
                  <div className="mb-1 text-amber-400">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 stroke-[1.6]" />
                  </div>
                  <div className="text-sm sm:text-base lg:text-[17px] font-bold text-white tracking-tight leading-tight">
                    98%
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-white/75 font-light mt-0.5 leading-tight">
                    Taux de<br />satisfaction
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Bottom Coordinates & Rating Strip - Full, unreduced size at the end of the photo */}
        <div className="mt-3.5 sm:mt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Shanghai Coordinates Pill */}
          <div className="flex items-center gap-2.5 bg-[#061329]/85 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="w-5 h-5 rounded-full bg-red-700 border border-red-500/40 flex items-center justify-center text-[10px] text-white shadow-xs font-bold shrink-0">
              ★
            </span>
            <div className="text-left">
              <div className="font-semibold text-white tracking-wider text-[11px]">SHANGHAI, CHINA</div>
              <div className="text-[10px] text-white/60 font-mono">31.2304° N, 121.4737° E</div>
            </div>
          </div>

          {/* Center: Mission Slogan & 4.8/5 Star Rating */}
          <div className="text-center px-2 py-0.5">
            <div className="text-white/90 text-xs sm:text-[13px] font-light">
              Des experts vérifiés et des services fiables pour accompagner vos projets internationaux.
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="text-xs font-semibold text-white">4.8/5</span>
              <div className="flex items-center text-amber-400 text-xs tracking-widest">
                ★★★★★
              </div>
            </div>
          </div>

          {/* Right: Tunis Coordinates Pill */}
          <div className="flex items-center gap-2.5 bg-[#061329]/85 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="w-5 h-5 rounded-full bg-blue-600 border border-white/40 flex items-center justify-center text-[10px] text-white shadow-xs font-bold shrink-0">
              🌍
            </span>
            <div className="text-left">
              <div className="font-semibold text-white tracking-wider text-[11px]">TUNIS, TUNISIA</div>
              <div className="text-[10px] text-white/60 font-mono">36.8065° N, 10.1815° E</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
