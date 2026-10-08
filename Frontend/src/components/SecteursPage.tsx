import React, { useEffect } from 'react';
import {
  ArrowRight,
  TrendingUp,
  Users,
  FileText,
  Handshake,
  Package,
  Settings,
  Leaf,
  Building2,
  Sprout,
  Cpu,
  PlusCircle,
  Sun,
  Globe,
} from 'lucide-react';
import { SECTORS_LIST } from '../data/sectorsData';
import { ContactFooterSection } from './ContactFooterSection';
import heroClearBg from '../data/herophoto.jpg';
import secteursPartnersImg from '../assets/images/secteurs_partners_apparent_1791221199460.jpg';

interface SecteursPageProps {
  onSelectSector: (sectorId: string) => void;
  onNavigate: (tab: string) => void;
  onOpenContact: () => void;
}

export const SecteursPage: React.FC<SecteursPageProps> = ({
  onSelectSector,
  onNavigate,
  onOpenContact,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const getSectorCardIcon = (iconName: string) => {
    const iconClass = "w-4 h-4 text-[#0a1c3d]";
    switch (iconName) {
      case 'Package':
        return <Package className={iconClass} />;
      case 'Settings':
        return <Settings className={iconClass} />;
      case 'Leaf':
        return <Leaf className={iconClass} />;
      case 'Building2':
        return <Building2 className={iconClass} />;
      case 'Sprout':
        return <Sprout className={iconClass} />;
      case 'Cpu':
        return <Cpu className={iconClass} />;
      case 'PlusCircle':
      case 'Plus':
      case 'Activity':
        return <PlusCircle className={iconClass} />;
      case 'Sun':
        return <Sun className={iconClass} />;
      default:
        return <Globe className={iconClass} />;
    }
  };

  const handleExploreClick = () => {
    const el = document.getElementById('explore-secteurs');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-white text-slate-800 min-h-screen">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Matching image.png & secteurs.png)                        */}
      {/* ========================================================================= */}
      <section className="relative min-h-[520px] lg:min-h-[580px] pt-32 pb-16 flex items-center overflow-hidden bg-slate-100">
        {/* Full Opacity Panoramic Skyline Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroClearBg}
            alt="Skyline moderne Chine et Afrique du Nord"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          {/* Soft White Gradient strictly on the left to keep skyline at full opacity */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-3/4 lg:w-1/2 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 text-left space-y-4">
              {/* Tag SECTEURS */}
              <div className="flex items-center gap-2">
                <span className="text-[#0a1c3d] font-bold text-xs uppercase tracking-widest font-mono">
                  SECTEURS
                </span>
                <div className="w-8 h-0.5 bg-[#e01a22]" />
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0a1c3d] tracking-tight leading-[1.12]">
                Des opportunités concrètes<br />
                dans des secteurs stratégiques
              </h1>

              {/* Subhead */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                QIAO vous connecte aux partenaires, aux marchés et aux projets dans les secteurs à fort potentiel entre la Chine et l’Afrique du Nord.
              </p>

              {/* CTA Button */}
              <div className="pt-2">
                <button
                  onClick={handleExploreClick}
                  className="inline-flex items-center gap-2.5 bg-[#e01a22] hover:bg-[#c7151c] text-white font-medium px-6 py-3 rounded-full transition-all duration-300 shadow-md shadow-red-600/25 hover:shadow-red-600/40 hover:gap-3.5 cursor-pointer text-sm"
                >
                  <span>Explorer les secteurs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Artistic Cursive Slogan: "Des secteurs qui construisent demain" */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center text-center lg:text-right select-none pr-2 lg:pr-6">
              <div className="relative max-w-xs">
                <p className="font-['Caveat'] text-3xl sm:text-4xl lg:text-[42px] text-[#0a1c3d] font-bold leading-[1.08] tracking-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                  Des secteurs<br />
                  qui construisent<br />
                  demain
                </p>
                <div className="w-12 h-1 bg-[#e01a22] rounded-full mt-2 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE 4 WHITE PILLARS STRIP (Matching secteurs.png)                       */}
      {/* ========================================================================= */}
      <section className="relative z-20 -mt-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 py-4 px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 gap-4 sm:gap-0">
            {/* Item 1 */}
            <div className="flex items-center gap-3.5 sm:px-4 py-2 sm:py-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-[#1d4ed8]" />
              </div>
              <div>
                <p className="text-[#0a1c3d] text-xs sm:text-sm font-bold leading-tight">
                  Des informations fiables
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  et actualisées
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-3.5 sm:px-4 py-2 sm:py-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#1d4ed8]" />
              </div>
              <div>
                <p className="text-[#0a1c3d] text-xs sm:text-sm font-bold leading-tight">
                  Un accès à un réseau qualifié
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  de partenaires
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-3.5 sm:px-4 py-2 sm:py-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#1d4ed8]" />
              </div>
              <div>
                <p className="text-[#0a1c3d] text-xs sm:text-sm font-bold leading-tight">
                  Des analyses et études
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  de marché
                </p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-center gap-3.5 sm:px-4 py-2 sm:py-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Handshake className="w-5 h-5 text-[#1d4ed8]" />
              </div>
              <div>
                <p className="text-[#0a1c3d] text-xs sm:text-sm font-bold leading-tight">
                  Un accompagnement
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  de bout en bout
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION: EXPLOREZ NOS SECTEURS (8 Cards Grid)                           */}
      {/* ========================================================================= */}
      <section id="explore-secteurs" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a1c3d]">
              Explorez nos secteurs
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Découvrez les secteurs clés où naissent les opportunités entre la Chine et l’Afrique du Nord.
            </p>
          </div>
          <button
            onClick={handleExploreClick}
            className="text-[#e01a22] hover:text-[#b81b21] font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Voir tous les secteurs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 8 Sector Cards Grid (2 rows x 4 cols on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SECTORS_LIST.map((sector) => (
            <div
              key={sector.id}
              onClick={() => onSelectSector(sector.id)}
              className="group relative h-[360px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between p-5"
            >
              {/* Background Photo */}
              <img
                src={sector.image}
                alt={sector.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Bottom Gradient Overlay ONLY for text legibility (leaves upper 60% at 100% full opacity) */}
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0a1c3d] via-[#0a1c3d]/75 to-transparent pointer-events-none" />

              {/* Floating Top Left Circular Badge */}
              <div className="relative z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center">
                {getSectorCardIcon(sector.iconName)}
              </div>

              {/* Bottom Card Content */}
              <div className="relative z-10 space-y-1.5">
                <h3 className="font-bold text-white text-base leading-snug group-hover:text-red-200 transition-colors">
                  {sector.title}
                </h3>
                <p className="text-white/80 text-xs leading-relaxed line-clamp-2">
                  {sector.description}
                </p>
                <div className="pt-2">
                  <span className="text-white/95 text-xs font-semibold inline-flex items-center gap-1.5 group-hover:text-white group-hover:gap-2.5 transition-all">
                    <span>Découvrir le secteur</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION: UN POTENTIEL RÉEL (Metrics + Message)                         */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#f8fafc] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left text */}
            <div className="lg:col-span-5 space-y-3.5 text-left">
              <span className="text-[#e01a22] font-bold text-xs uppercase tracking-widest font-mono">
                UN POTENTIEL RÉEL
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0a1c3d] leading-tight">
                Des secteurs. Des marchés.<br />
                Des opportunités sans frontières.
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                La Chine et l’Afrique du Nord partagent des atouts complémentaires pour construire une croissance inclusive et durable.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenContact}
                  className="inline-flex items-center gap-2 bg-[#e01a22] hover:bg-[#c7151c] text-white font-medium px-6 py-2.5 rounded-full transition-all text-sm shadow-md shadow-red-600/20 hover:gap-3 cursor-pointer"
                >
                  <span>Parler à un expert</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right 4 Stat Columns in a single row */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {/* Stat 1 */}
              <div className="flex flex-col items-center">
                <Globe className="w-8 h-8 text-[#1d4ed8] mb-2 stroke-[1.5]" />
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0a1c3d]">6</div>
                <div className="text-xs text-slate-600 font-medium mt-1 leading-snug">
                  Pays d'Afrique<br />du Nord couverts
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center">
                <Building2 className="w-8 h-8 text-[#1d4ed8] mb-2 stroke-[1.5]" />
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0a1c3d]">20+</div>
                <div className="text-xs text-slate-600 font-medium mt-1 leading-snug">
                  Secteurs analysés
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center">
                <Handshake className="w-8 h-8 text-[#1d4ed8] mb-2 stroke-[1.5]" />
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0a1c3d]">500+</div>
                <div className="text-xs text-slate-600 font-medium mt-1 leading-snug">
                  Partenaires<br />potentiels
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex flex-col items-center">
                <FileText className="w-8 h-8 text-[#1d4ed8] mb-2 stroke-[1.5]" />
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0a1c3d]">100+</div>
                <div className="text-xs text-slate-600 font-medium mt-1 leading-snug">
                  Études et rapports<br />disponibles
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BOTTOM BANNER: "Vous ne trouvez pas votre secteur ?"                     */}
      {/* ========================================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl min-h-[220px] lg:min-h-[240px] flex items-center bg-[#071630]">
          {/* Background image of business partners at full opacity */}
          <img
            src={secteursPartnersImg}
            alt="Partenaires d'affaires Chine Afrique"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-right lg:object-center opacity-100"
          />
          {/* Left-only gradient overlay for text readability - stops before the faces to ensure they remain fully apparent */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-3/5 lg:w-1/2 bg-gradient-to-r from-[#071630] via-[#071630]/90 to-transparent pointer-events-none" />

          <div className="relative z-10 w-full p-8 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left text & button */}
            <div className="max-w-md space-y-2.5">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Vous ne trouvez pas votre secteur ?
              </h3>
              <p className="text-white/85 text-xs sm:text-sm leading-relaxed">
                Notre équipe peut vous fournir des informations sur mesure et vous connecter aux bons partenaires.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenContact}
                  className="inline-flex items-center gap-2 border border-white/80 hover:bg-white hover:text-[#0a1c3d] text-white font-medium px-5 py-2.5 rounded-full transition-all text-xs sm:text-sm bg-[#0a1c3d]/60 backdrop-blur-sm cursor-pointer hover:gap-3"
                >
                  <span>Nous contacter</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right quote cursive script: "Des connexions pour vos ambitions" */}
            <div className="text-right hidden sm:block select-none lg:pr-4">
              <p className="font-['Caveat'] text-2xl lg:text-3xl text-white font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                Des connexions<br />
                pour vos ambitions
              </p>
              <div className="w-12 h-0.5 bg-[#e01a22] rounded-full mt-1.5 ml-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FOOTER SECTION                                                          */}
      {/* ========================================================================= */}
      <ContactFooterSection
        showOnlyFooter={true}
        onScrollToSection={onNavigate}
      />
    </div>
  );
};
