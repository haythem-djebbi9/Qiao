import React, { useState } from 'react';
import {
  Building2,
  Ship,
  Scale,
  Languages,
  Users,
  Truck,
  Building,
  HeartPulse,
  Plane,
  GraduationCap,
  Briefcase,
  LayoutGrid,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  UserCheck,
  Lock,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { ServiceItem } from '../types';
import { useAppActions } from '../context/AppActionsContext';

interface ServicesSectionProps {
  services?: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  onOpenAllServicesModal?: () => void;
  onOpenCalculator?: () => void;
  onOpenAppointment?: () => void;
  activeCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  onSearchEverywhere?: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services = [],
  onSelectService,
  onOpenAllServicesModal,
  onOpenCalculator,
  onOpenAppointment,
  activeCategory: externalCategory,
  onSelectCategory,
  searchQuery,
  onClearSearch,
  onSearchEverywhere,
}) => {
  const { contactUs } = useAppActions();
  const [internalCategory, setInternalCategory] = useState<string>('Tous');
  const selectedCat = externalCategory || internalCategory;

  const categories = [
    'Tous',
    'Business',
    'Logistique',
    'Juridique',
    'Traduction',
    'Recrutement',
    'Immobilier',
    'Santé',
    'Tourisme',
  ];

  const handleCategoryClick = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat === 'Tous' ? null : cat);
    } else {
      setInternalCategory(cat);
    }
  };

  const filteredServices = selectedCat && selectedCat !== 'Tous'
    ? services.filter((s) => s.category.toLowerCase().includes(selectedCat.toLowerCase()))
    : services;
  // Map icon strings to Lucide components
  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Building2':
        return <Building2 className={className} />;
      case 'Ship':
        return <Ship className={className} />;
      case 'Scale':
        return <Scale className={className} />;
      case 'Languages':
        return <Languages className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'Truck':
        return <Truck className={className} />;
      case 'Building':
        return <Building className={className} />;
      case 'HeartPulse':
        return <HeartPulse className={className} />;
      case 'Plane':
        return <Plane className={className} />;
      case 'GraduationCap':
        return <GraduationCap className={className} />;
      case 'Briefcase':
        return <Briefcase className={className} />;
      default:
        return <Building2 className={className} />;
    }
  };

  return (
    <section id="services" className="py-16 sm:py-20 bg-[#f8fafc] relative border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="relative flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="text-center md:text-left max-w-2xl">
            <div className="text-xs sm:text-sm font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2">
              <span className="w-6 h-[2px] bg-red-600 inline-block"></span>
              <span>Trouvez le service qu'il vous faut</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Nos services <span className="text-red-600">les plus demandés</span>
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Des solutions sur-mesure pour accompagner vos projets et simplifier vos démarches.
            </p>
          </div>

          <button
            onClick={onOpenAllServicesModal}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-red-600 transition-colors self-center md:self-end group cursor-pointer"
          >
            <span>Voir tous les services</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCat === cat || (cat === 'Tous' && !selectedCat);
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {searchQuery && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm">
            <span className="text-slate-600">
              {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} pour « <strong className="text-slate-900">{searchQuery}</strong> »
            </span>
            <div className="flex items-center gap-3">
              <button onClick={onSearchEverywhere} className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer">
                Chercher aussi dans les opportunités, entreprises et rapports
              </button>
              <button onClick={onClearSearch} className="text-xs font-semibold text-red-600 hover:underline cursor-pointer">
                Effacer la recherche
              </button>
            </div>
          </div>
        )}

        {filteredServices.length === 0 && (
          <div className="mb-6 bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">Aucun service ne correspond à votre recherche.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onOpenAllServicesModal}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Voir tous les services
              </button>
              <button
                onClick={onOpenAppointment}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Parler à un expert
              </button>
            </div>
          </div>
        )}

        {/* 11 Services + 1 Extra Card (Grid 2 cols mobile, 3 cols tablet, 6 cols desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {filteredServices.map((service) => {
            const isRedAccent = service.accentColor === 'red';
            return (
              <div
                key={service.id}
                onClick={() => onSelectService(service)}
                className="group relative bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer transform hover:-translate-y-1"
              >
                {/* Image Container with Badge */}
                <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                  <img
                    src={service.image}
                    alt={service.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />

                  {/* Icon floating Badge */}
                  <div
                    className={`absolute bottom-2.5 left-2.5 w-8 h-8 rounded-xl flex items-center justify-center shadow-md backdrop-blur-sm ${
                      isRedAccent ? 'bg-white text-red-600 border border-red-100' : 'bg-white text-blue-600 border border-blue-100'
                    }`}
                  >
                    {renderIcon(service.iconName, 'w-4 h-4')}
                  </div>

                  {/* "NOUVEAU" badge if applicable */}
                  {service.isNew && (
                    <div className="absolute top-2.5 right-2.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                      Nouveau
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-red-600 transition-colors">
                    <span>Voir plus</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* 12th Card: Plus de services (demande de service sur-mesure) */}
          <div
            onClick={() =>
              contactUs({
                subject: 'Autre demande',
                message: "Bonjour, je recherche un service qui n'apparaît pas dans votre catalogue : ",
              })
            }
            className="group bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200/60 hover:border-blue-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-5 cursor-pointer transform hover:-translate-y-1"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                Plus de services
              </h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Découvrez encore plus de services adaptés à vos besoins spécifiques et à vos projets.
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-blue-100 flex items-center justify-between text-xs font-semibold text-blue-700">
              <span>Voir plus</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Feature highlight box: "Pourquoi choisir QIAO ?" (Page 2 Bottom) */}
        <div className="mt-14 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Intro text */}
            <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 pb-6 lg:pb-0 lg:pr-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  Pourquoi choisir QIAO ?
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nous vous connectons aux meilleurs experts et solutions pour vous faire gagner du temps, réduire les risques et atteindre vos objectifs.
              </p>
            </div>

            {/* 5 Features Column */}
            <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
              {/* Feature 1 */}
              <div className="flex flex-col space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-1">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Experts vérifiés</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Des professionnels qualifiés et rigoureusement sélectionnés pour vous garantir le meilleur niveau de service.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Support multilingue</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Assistance en chinois, français, arabe et anglais pour vous accompagner à chaque étape.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Accompagnement humain</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Un interlocuteur dédié pour comprendre vos besoins et vous apporter des solutions adaptées.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-1">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Confidentialité & Sécurité</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Vos données sont protégées et vos transactions sécurisées à 100%.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="flex flex-col space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Gain de temps</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Trouvez la bonne solution rapidement et concentrez-vous sur l'essentiel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
