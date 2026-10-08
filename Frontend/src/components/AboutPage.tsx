import React, { useState } from 'react';
import {
  ArrowRight,
  Play,
  Users,
  Briefcase,
  BookOpen,
  Globe,
  TrendingUp,
  Lightbulb,
  Building2,
  Handshake,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Layers,
  Calendar,
  FileText,
  Award,
} from 'lucide-react';
import { AppTab } from '../types';
import { ContactFooterSection } from './ContactFooterSection';
import heroClearBg from '../data/herophoto.jpg';
import visionMountainFlagsImg from '../data/unpointverslavenir.jpg';
import missionPartnersImg from '../assets/images/about_mission_partners_uncut_1791236115168.jpg';
import containerPortImg from '../assets/images/container_port_cargo_1790805153002.jpg';
import qiaoAcademyImg from '../assets/images/qiao_academy_hero_1787505055310.jpg';
import qiaoIntelligenceImg from '../assets/images/qiao_intelligence.jpg';

// Official Partner & Institution Logos
import huaweiLogo from '../assets/logos/huawei.svg';
import alibabaLogo from '../assets/logos/alibaba.svg';
import tunisairLogo from '../assets/logos/tunisair_colored.svg';
import cepexLogo from '../assets/logos/cepex.jpg';
import fipaLogo from '../assets/logos/fipa_tunisia.png';
import uticaLogo from '../assets/logos/utica.gif';
import icescoLogo from '../assets/logos/icesco.png';
import amdieLogo from '../assets/logos/amdie.png';

// Real Geographic SVG Map Data
import {
  CHINA_MAP_PATH,
  NORTH_AFRICA_COUNTRIES,
  CountryInfo,
} from '../data/countryMapPaths';

interface AboutPageProps {
  onNavigate: (tab: AppTab | string) => void;
  onOpenRegister?: () => void;
  onOpenContact?: () => void;
  onOpenVideo?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onNavigate,
  onOpenRegister,
  onOpenContact,
  onOpenVideo,
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [activeCountry, setActiveCountry] = useState<CountryInfo | null>(null);

  const stories = [
    {
      quote:
        '« Grâce à QIAO, nous avons trouvé un partenaire chinois fiable pour développer notre activité en Tunisie. Un accompagnement professionnel et humain exceptionnel. »',
      author: 'Mohamed Trabelsi',
      role: 'PDG, Société Industrielle - Tunisie',
      image:
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80',
    },
    {
      quote:
        '« L’expertise de l’équipe QIAO à Shanghai et à Casablanca a permis à notre entreprise d’importer des lignes de production solaires en un temps record avec zéro incident douanier. »',
      author: 'Yassine Belkacem',
      role: 'Directeur Général, Maghreb Green Energy',
      image:
        'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    },
    {
      quote:
        '« Une plateforme indispensable pour sécuriser nos flux d’approvisionnement et bâtir des relations solides de long terme entre nos ingénieurs et les usines chinoises. »',
      author: 'Nadia Cherif',
      role: 'Responsable Achats & Sourcing Méditerranée',
      image:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const values = [
    {
      title: 'Confiance',
      description: 'Des relations durables basées sur la transparence et l’intégrité.',
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Ouverture',
      description: 'Des échanges sans frontières pour plus d’opportunités.',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Innovation',
      description: 'Des solutions modernes pour des défis réels.',
      image: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Respect',
      description: 'Des cultures, des personnes et des différences.',
      image: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Impact',
      description: 'Des actions concrètes pour un développement inclusif et durable.',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Excellence',
      description: 'Un engagement constant pour créer plus de valeur.',
      image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const ecosystem = [
    {
      title: 'Services',
      description: 'Des solutions concrètes pour vos projets',
      image: containerPortImg,
      tab: 'services',
    },
    {
      title: 'Academy',
      description: 'Développez vos compétences',
      image: qiaoAcademyImg,
      tab: 'academy',
    },
    {
      title: 'Intelligence',
      description: 'Des données et analyses pour mieux décider',
      image: qiaoIntelligenceImg,
      tab: 'intelligence',
    },
    {
      title: 'Community',
      description: 'Un réseau d’opportunités et de partenaires',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
      tab: 'community',
    },
    {
      title: 'Événements',
      description: 'Rencontrez, échangez, créez des opportunités',
      image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80',
      tab: 'evenements',
    },
    {
      title: 'Ressources',
      description: 'Des guides et outils pour aller plus loin',
      image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80',
      tab: 'resources',
    },
  ];

  const team = [
    {
      name: 'Sami Ben Jannet',
      role: 'Fondateur & CEO',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Li Wei',
      role: 'Directeur Chine',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Amira Khlifi',
      role: 'Relations Afrique du Nord',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Zhang Min',
      role: 'Partenariats internationaux',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Karim Haddad',
      role: 'Développement stratégique',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    },
  ];

  return (
    <div className="w-full bg-white text-slate-800 min-h-screen font-sans antialiased overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Matching About.png)                                       */}
      {/* ========================================================================= */}
      <section className="relative min-h-[660px] sm:min-h-[720px] lg:min-h-[780px] pt-36 sm:pt-44 pb-28 sm:pb-36 flex items-center overflow-hidden bg-slate-100 border-b border-slate-200/80">
        {/* Full-bleed Skyline Background Image at Full Opacity */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroClearBg}
            alt="Shanghai et Afrique du Nord Skyline"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle gradient only on the far left behind text so photo takes more visible space */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-3/5 lg:w-1/2 bg-gradient-to-r from-white/95 via-white/70 to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-8 text-left space-y-4">
              <span className="text-[#0a1c3d] font-bold text-xs uppercase tracking-widest block font-mono">
                À propos de QIAO
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0a1c3d] tracking-tight leading-[1.12]">
                Le pont entre <br />
                la Chine <span className="text-[#e01a22]">&</span> l'Afrique du Nord
              </h1>

              <div className="text-sm sm:text-base font-bold text-[#0a1c3d] leading-snug">
                Des connexions réelles. Des opportunités durables. <br />
                <span className="text-[#0a1c3d]">Un avenir partagé.</span>
              </div>

              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl font-normal">
                QIAO connecte les entreprises, les institutions et les talents entre la Chine et l’Afrique du Nord, pour créer de la croissance inclusive et un impact réel.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenRegister ? onOpenRegister() : onNavigate('contact')}
                  className="px-6 py-2.5 rounded-full bg-[#e01a22] hover:bg-[#c7151c] text-white font-medium text-xs sm:text-sm shadow-md shadow-red-600/20 hover:gap-3 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Rejoindre QIAO</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onOpenVideo ? onOpenVideo() : null}
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-[#1d4ed8] fill-[#1d4ed8]" />
                  <span>Voir la vidéo</span>
                </button>
              </div>
            </div>

            {/* Right: Floating Manifesto directly in the sky (No white card background, exactly like About.png) */}
            <div className="lg:col-span-4 flex justify-end">
              <div className="text-right space-y-1.5 select-none pr-2 lg:pr-6">
                <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0a1c3d] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                  DES PEUPLES
                </div>
                <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0a1c3d] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                  DES ENTREPRISES
                </div>
                <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0a1c3d] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                  DES OPPORTUNITÉS
                </div>
                <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a1c3d] pt-0.5 relative inline-block drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                  UN AVENIR PARTAGÉ
                  <div className="h-0.5 w-full bg-[#e01a22] rounded-full mt-1.5" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. NOTRE VISION SECTION (Dark Mountain Vista with Flags & Cursive Slogan) */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#07152b] text-white py-16 sm:py-20">
        {/* Background Mountain with Flags Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={visionMountainFlagsImg}
            alt="Vision de QIAO - Montagne et drapeaux"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center brightness-95"
          />
          {/* Subtle gradient overlay strictly on left for text legibility */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-3/5 lg:w-1/2 bg-gradient-to-r from-[#07152b]/95 via-[#07152b]/75 to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Row: Vision Text Left + Cursive Slogan Right */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-12">
            <div className="max-w-xl space-y-3">
              <span className="text-xs font-black tracking-widest text-sky-400 uppercase block font-mono">
                NOTRE VISION
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Un pont vers <br />
                un avenir partagé.
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                Devenir la plateforme de référence qui connecte durablement la Chine et l’Afrique du Nord, où les personnes, les entreprises, les connaissances et les opportunités peuvent circuler avec confiance et créer une prospérité mutuelle.
              </p>
            </div>

            {/* Script Calligraphy Right: "Des horizons plus proches" */}
            <div className="text-right select-none md:pt-4">
              <p className="font-['Caveat'] text-3xl sm:text-4xl lg:text-[42px] text-white font-bold leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                Des horizons<br />
                plus proches
              </p>
              <div className="w-16 h-1 bg-[#e01a22] rounded-full mt-2 ml-auto" />
            </div>
          </div>

          {/* Bottom Row: 4 Metric Pillars Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            {/* Item 1 */}
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center mb-2.5 shadow-sm">
                <Users className="w-5 h-5 text-sky-300" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white">
                PLUS DE CONNEXIONS
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                entre les peuples
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center mb-2.5 shadow-sm">
                <Briefcase className="w-5 h-5 text-sky-300" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white">
                PLUS D’OPPORTUNITÉS
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                pour les entreprises
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center mb-2.5 shadow-sm">
                <BookOpen className="w-5 h-5 text-sky-300" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white">
                PLUS DE CONNAISSANCES
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                pour une meilleure compréhension
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center mb-2.5 shadow-sm">
                <Globe className="w-5 h-5 text-sky-300" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white">
                PLUS D’IMPACT
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                pour les générations futures
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. NOTRE MISSION SECTION (3-Column Layout: Text - Photo - 3 Pillars)       */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Mission Description */}
            <div className="lg:col-span-4 space-y-4">
              <span className="text-[#0a1c3d] font-bold text-xs uppercase tracking-widest font-mono">
                NOTRE MISSION
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a1c3d] leading-tight">
                Faciliter les connexions.<br />
                Rendre les marchés compréhensibles.<br />
                Accompagner jusqu’à la concrétisation.
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Nous fournissons des informations fiables, des outils concrets et un réseau de partenaires de confiance pour simplifier les échanges économiques, commerciaux, académiques et culturels entre la Chine et l’Afrique du Nord.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('services')}
                  className="px-6 py-2.5 rounded-full bg-[#e01a22] hover:bg-[#c7151c] text-white font-medium text-xs sm:text-sm shadow-md shadow-red-600/20 hover:gap-3 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Découvrir nos services</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Middle Column: Business Partners Handshake Photo - Both men fully visible with white smudge */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full aspect-[4/3] max-w-xl overflow-hidden flex items-center justify-center">
                <img
                  src={missionPartnersImg}
                  alt="Partenaires d'affaires Chine Afrique"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain sm:object-cover object-center"
                />
                {/* White smudge on left edge */}
                <div className="absolute inset-y-0 left-0 w-24 sm:w-36 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
                {/* Subtle top & bottom blending */}
                <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Right Column: 3 Pillars with Blue Icons (Matching image.png) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Pillar 1 */}
              <div className="flex items-start gap-3.5">
                <Users className="w-6 h-6 text-[#1d4ed8] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0a1c3d] tracking-wide uppercase">
                    CONNECTER
                  </h3>
                  <p className="text-slate-600 text-xs mt-0.5 leading-snug">
                    Les bonnes personnes, les bons projets, les bons marchés.
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-5 h-0.5 bg-[#1d4ed8] rounded-full" />
                    <div className="w-5 h-0.5 bg-[#e01a22] rounded-full" />
                  </div>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="flex items-start gap-3.5">
                <Lightbulb className="w-6 h-6 text-[#1d4ed8] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0a1c3d] tracking-wide uppercase">
                    COMPRENDRE
                  </h3>
                  <p className="text-slate-600 text-xs mt-0.5 leading-snug">
                    Des analyses fiables pour mieux décider.
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-5 h-0.5 bg-[#4338ca] rounded-full" />
                    <div className="w-5 h-0.5 bg-[#e01a22] rounded-full" />
                  </div>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="flex items-start gap-3.5">
                <TrendingUp className="w-6 h-6 text-[#1d4ed8] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0a1c3d] tracking-wide uppercase">
                    ACCOMPAGNER
                  </h3>
                  <p className="text-slate-600 text-xs mt-0.5 leading-snug">
                    Un soutien concret jusqu’à la réussite.
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-5 h-0.5 bg-[#e01a22] rounded-full" />
                    <div className="w-5 h-0.5 bg-[#e01a22] rounded-full" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. NOS VALEURS SECTION (6 Cards matching About.png)                        */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a1c3d]">
                Nos Valeurs
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Les principes qui guident chacune de nos actions.
              </p>
            </div>
            <button
              onClick={() => onNavigate('about')}
              className="text-[#e01a22] hover:text-[#b81b21] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>Découvrir notre approche</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6 Value Cards Grid (1 row of 6 on desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {values.map((v, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 flex flex-col hover:shadow-md transition-all duration-300"
              >
                <div className="h-28 w-full overflow-hidden bg-slate-100">
                  <img
                    src={v.image}
                    alt={v.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-[#0a1c3d] text-sm mb-1">
                      {v.title}
                    </h3>
                    <p className="text-slate-600 text-[11px] leading-snug">
                      {v.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. NOTRE ÉCOSYSTÈME SECTION (6 Cards matching About.png)                  */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a1c3d]">
                Notre écosystème
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Un ensemble de services complémentaires pour vous accompagner à chaque étape.
              </p>
            </div>
            <button
              onClick={() => onNavigate('services')}
              className="text-[#e01a22] hover:text-[#b81b21] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>Explorer l’écosystème</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6 Ecosystem Cards Grid (1 row of 6 on desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ecosystem.map((eco, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate(eco.tab)}
                className="group relative h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-end p-3.5"
              >
                {/* Background Image at full opacity */}
                <img
                  src={eco.image}
                  alt={eco.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Bottom gradient overlay strictly behind text */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0a1c3d]/95 via-[#0a1c3d]/70 to-transparent pointer-events-none" />

                <div className="relative z-10 space-y-0.5">
                  <h3 className="font-bold text-white text-sm group-hover:text-red-200 transition-colors">
                    {eco.title}
                  </h3>
                  <p className="text-white/80 text-[11px] leading-snug line-clamp-2">
                    {eco.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CORRIDOR MAP & NOTRE IMPACT SECTION (Matching About.png)               */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Real Geographic Corridor Map: "Deux régions. D'infinies opportunités." */}
            <div className="lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0a1c3d]">
                    Deux régions. D'infinies opportunités.
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Cartographie géographique réelle des corridors d'échange
                  </p>
                </div>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Pont Stratégique
                </span>
              </div>

              {/* Graphic Corridor Map Representation with REAL Country Maps */}
              <div className="relative w-full bg-linear-to-b from-slate-50/90 to-sky-50/30 rounded-xl border border-slate-200/80 p-4 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 items-center">
                  
                  {/* Left: Real Geographic China Map */}
                  <div className="col-span-5 flex flex-col items-center">
                    <div className="w-full h-36 relative flex items-center justify-center">
                      <svg
                        viewBox="255 52 135 118"
                        className="w-full h-full drop-shadow-sm select-none"
                      >
                        <defs>
                          <linearGradient id="chinaRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#b91c1c" />
                          </linearGradient>
                          <radialGradient id="chinaGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                          </radialGradient>
                        </defs>

                        {/* Real Geographic China Silhouette */}
                        <path
                          d={CHINA_MAP_PATH}
                          fill="url(#chinaRedGrad)"
                          stroke="#ffffff"
                          strokeWidth="0.8"
                          strokeLinejoin="round"
                          opacity="0.95"
                        />

                        {/* Beijing Hub Node */}
                        <circle cx="347" cy="98" r="8" fill="url(#chinaGlow)" />
                        <circle cx="347" cy="98" r="3" fill="#ffffff" />
                        <circle cx="347" cy="98" r="1.5" fill="#ef4444" />
                        <text x="352" y="99" fill="#0f172a" fontSize="6.5" fontWeight="bold">
                          Pékin
                        </text>

                        {/* Shanghai Hub Node */}
                        <circle cx="376" cy="122" r="2.5" fill="#ffffff" stroke="#ef4444" strokeWidth="1" />
                        <text x="358" y="125" fill="#0f172a" fontSize="6" fontWeight="bold">
                          Shanghai
                        </text>

                        {/* Shenzhen / Guangzhou Hub Node */}
                        <circle cx="354" cy="148" r="2.5" fill="#ffffff" stroke="#ef4444" strokeWidth="1" />
                        <text x="328" y="150" fill="#0f172a" fontSize="6" fontWeight="bold">
                          Shenzhen
                        </text>
                      </svg>
                    </div>
                    <div className="text-center mt-1">
                      <span className="font-black text-[#b91c1c] text-xs tracking-wider uppercase block">
                        CHINE
                      </span>
                      <div className="flex flex-wrap gap-1 justify-center mt-1">
                        <span className="bg-red-50 text-red-900 border border-red-200/60 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          Pékin
                        </span>
                        <span className="bg-red-50 text-red-900 border border-red-200/60 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          Shanghai
                        </span>
                        <span className="bg-red-50 text-red-900 border border-red-200/60 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          Shenzhen
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Dynamic Bilateral Bridge Indicator */}
                  <div className="col-span-2 flex flex-col items-center text-center px-0.5">
                    <div className="flex items-center gap-0.5 text-[#e01a22] font-black text-[9px] tracking-wider uppercase mb-1">
                      <span>•••</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-black text-[#0a1c3d] uppercase tracking-tighter leading-tight">
                      FLUX<br />DIRECT
                    </span>
                    <div className="flex items-center gap-0.5 text-[#e01a22] font-black text-[9px] tracking-wider uppercase mt-1">
                      <ArrowRight className="w-3 h-3 rotate-180" />
                      <span>•••</span>
                    </div>
                  </div>

                  {/* Right: Real Geographic North Africa Map with All 5 Countries */}
                  <div className="col-span-5 flex flex-col items-center">
                    <div className="w-full h-36 relative flex items-center justify-center">
                      <svg
                        viewBox="24 74 178 120"
                        className="w-full h-full drop-shadow-sm select-none"
                      >
                        <g stroke="#ffffff" strokeWidth="0.8" strokeLinejoin="round">
                          {NORTH_AFRICA_COUNTRIES.map((c) => {
                            const isSelected = activeCountry?.id === c.id;
                            return (
                              <path
                                key={c.id}
                                d={c.path}
                                fill={isSelected ? '#f59e0b' : c.color}
                                opacity={isSelected ? 1 : 0.88}
                                className="transition-all duration-200 cursor-pointer hover:opacity-100"
                                onMouseEnter={() => setActiveCountry(c)}
                                onMouseLeave={() => setActiveCountry(null)}
                              />
                            );
                          })}
                        </g>

                        {/* Capital Cities on Real Map */}
                        {NORTH_AFRICA_COUNTRIES.map((c) => (
                          <g key={`node-${c.id}`}>
                            <circle
                              cx={c.hubCoords[0]}
                              cy={c.hubCoords[1]}
                              r={c.id === 'tunisie' ? '3' : '2'}
                              fill={c.id === 'tunisie' ? '#f59e0b' : '#ffffff'}
                              stroke="#0a1c3d"
                              strokeWidth="0.8"
                            />
                          </g>
                        ))}
                      </svg>
                    </div>
                    <div className="text-center mt-1">
                      <span className="font-black text-[#0369a1] text-xs tracking-wider uppercase block">
                        AFRIQUE DU NORD
                      </span>
                      <div className="flex flex-wrap gap-1 justify-center mt-1">
                        {NORTH_AFRICA_COUNTRIES.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseEnter={() => setActiveCountry(c)}
                            onMouseLeave={() => setActiveCountry(null)}
                            onClick={() => setActiveCountry(c)}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                              activeCountry?.id === c.id
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-sky-100 text-sky-900 hover:bg-sky-200'
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Country Highlight Info Strip */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-center">
                  {activeCountry ? (
                    <div className="text-[11px] text-[#0a1c3d] font-semibold flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-extrabold text-[#0a1c3d]">{activeCountry.name}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">{activeCountry.hubCity}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-blue-700 font-medium">{activeCountry.role}</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 font-medium">
                      Survolez un pays pour afficher ses filières économiques prioritaires avec la Chine.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: "Notre impact" with 4 Stat Boxes */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#0a1c3d]">
                Notre impact
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {/* Stat 1 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1d4ed8] mb-1.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-[#0a1c3d]">50 000+</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                    Membres de la communauté
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1d4ed8] mb-1.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-[#0a1c3d]">8 000+</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                    Entreprises accompagnées
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1d4ed8] mb-1.5">
                    <Handshake className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-[#0a1c3d]">120+</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                    Événements organisés
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1d4ed8] mb-1.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-[#0a1c3d]">6</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                    Pays d'Afrique du Nord couverts
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. NOTRE HISTOIRE & NOTRE ÉQUIPE SECTION                                   */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left: "Notre histoire" (Horizontal timeline) */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#0a1c3d]">
                  Notre histoire
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Des étapes clés vers un impact plus grand.
                </p>
              </div>

              {/* Timeline Horizontal Stepper */}
              <div className="relative pt-6">
                {/* Connecting Line */}
                <div className="absolute top-8 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
                
                <div className="grid grid-cols-6 gap-1 relative z-10 text-center">
                  {/* 2020 */}
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#1d4ed8] ring-4 ring-blue-50 mb-2" />
                    <span className="text-xs font-black text-[#0a1c3d]">2020</span>
                    <span className="text-[10px] text-slate-500 leading-tight mt-1">
                      Naissance de l'idée QIAO
                    </span>
                  </div>

                  {/* 2021 */}
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#1d4ed8] ring-4 ring-blue-50 mb-2" />
                    <span className="text-xs font-black text-[#0a1c3d]">2021</span>
                    <span className="text-[10px] text-slate-500 leading-tight mt-1">
                      Lancement de la plateforme
                    </span>
                  </div>

                  {/* 2022 */}
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#1d4ed8] ring-4 ring-blue-50 mb-2" />
                    <span className="text-xs font-black text-[#0a1c3d]">2022</span>
                    <span className="text-[10px] text-slate-500 leading-tight mt-1">
                      Premiers partenariats
                    </span>
                  </div>

                  {/* 2023 */}
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#1d4ed8] ring-4 ring-blue-50 mb-2" />
                    <span className="text-xs font-black text-[#0a1c3d]">2023</span>
                    <span className="text-[10px] text-slate-500 leading-tight mt-1">
                      Expansion régionale
                    </span>
                  </div>

                  {/* 2024 */}
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#1d4ed8] ring-4 ring-blue-50 mb-2" />
                    <span className="text-xs font-black text-[#0a1c3d]">2024</span>
                    <span className="text-[10px] text-slate-500 leading-tight mt-1">
                      50 000+ membres
                    </span>
                  </div>

                  {/* 2025 */}
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#e01a22] ring-4 ring-red-50 mb-2" />
                    <span className="text-xs font-black text-[#e01a22]">2025</span>
                    <span className="text-[10px] text-slate-500 leading-tight mt-1">
                      Vers un avenir plus grand
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: "Notre équipe" (5 Profile Avatars) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-[#0a1c3d]">
                    Notre équipe
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Des experts passionnés, à votre service.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('contact')}
                  className="text-[#e01a22] hover:text-[#b81b21] font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Voir toute l’équipe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 5 Team Member Cards */}
              <div className="grid grid-cols-5 gap-2 text-center pt-2">
                {team.map((member, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-sm border border-slate-200 mb-2">
                      <img
                        src={member.image}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#0a1c3d] leading-snug">
                      {member.name}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. ILS NOUS FONT CONFIANCE & HISTOIRES DE SUCCÈS                          */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: "Ils nous font confiance" Logos Grid */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#0a1c3d]">
                  Ils nous font confiance
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Des partenaires engagés à nos côtés.
                </p>
              </div>

              {/* Logos Grid with REAL official brand vectors and emblems */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {/* 1. HUAWEI */}
                <div
                  title="HUAWEI Technologies"
                  className="bg-white p-2.5 rounded-xl border border-slate-200/90 flex items-center justify-center h-20 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
                >
                  <img
                    src={huaweiLogo}
                    alt="HUAWEI"
                    className="max-h-10 max-w-[85%] object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                </div>

                {/* 2. Alibaba.com */}
                <div
                  title="Alibaba.com"
                  className="bg-white p-2.5 rounded-xl border border-slate-200/90 flex items-center justify-center h-20 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
                >
                  <img
                    src={alibabaLogo}
                    alt="Alibaba.com"
                    className="max-h-10 max-w-[88%] object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                </div>

                {/* 3. TUNISAIR */}
                <div
                  title="TUNISAIR - الخطوط التونسية"
                  className="bg-white p-2.5 rounded-xl border border-slate-200/90 flex items-center justify-center h-20 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={tunisairLogo}
                      alt="TUNISAIR"
                      className="h-9 w-9 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="text-left leading-none">
                      <span className="font-black text-[#e30613] text-xs tracking-wider block">TUNISAIR</span>
                      <span className="text-[8px] text-slate-400 block font-arabic mt-0.5">الخطوط التونسية</span>
                    </div>
                  </div>
                </div>

                {/* 4. CEPEX */}
                <div
                  title="CEPEX - Centre de Promotion des Exportations"
                  className="bg-white p-2 rounded-xl border border-slate-200/90 flex items-center justify-center h-20 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
                >
                  <img
                    src={cepexLogo}
                    alt="CEPEX - Centre de Promotion des Exportations"
                    className="max-h-12 max-w-[90%] object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                </div>

                {/* 5. FIPA Tunisia */}
                <div
                  title="FIPA Tunisia - Foreign Investment Promotion Agency"
                  className="bg-white p-2.5 rounded-xl border border-slate-200/90 flex items-center justify-center h-20 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
                >
                  <img
                    src={fipaLogo}
                    alt="FIPA Tunisia"
                    className="max-h-12 max-w-[88%] object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                </div>

                {/* 6. UTICA */}
                <div
                  title="UTICA - Union Tunisienne de l'Industrie, du Commerce et de l'Artisanat"
                  className="bg-white p-2 rounded-xl border border-slate-200/90 flex items-center justify-center h-20 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={uticaLogo}
                      alt="UTICA"
                      className="h-10 w-10 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="text-left leading-tight">
                      <span className="font-extrabold text-[#0a1c3d] text-xs tracking-wide block">UTICA</span>
                      <span className="text-[8px] text-slate-500 font-medium block">Tunisie</span>
                    </div>
                  </div>
                </div>

                {/* 7. ICESCO */}
                <div
                  title="ICESCO - Islamic World Educational, Scientific and Cultural Organization"
                  className="bg-white p-2.5 rounded-xl border border-slate-200/90 flex items-center justify-center h-20 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
                >
                  <img
                    src={icescoLogo}
                    alt="ICESCO"
                    className="max-h-12 max-w-[88%] object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                </div>

                {/* 8. AMDIE */}
                <div
                  title="AMDIE - Agence Marocaine de Développement des Investissements et des Exportations"
                  className="bg-white p-2.5 rounded-xl border border-slate-200/90 flex items-center justify-center h-20 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
                >
                  <img
                    src={amdieLogo}
                    alt="AMDIE Maroc"
                    className="max-h-11 max-w-[88%] object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>

            {/* Right: "Histoires de succès" Testimonial Carousel Card */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#0a1c3d]">
                  Histoires de succès
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Des projets concrets. Des ambitions réalisées.
                </p>
              </div>

              {/* Testimonial Card */}
              <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                  <img
                    src={stories[activeStoryIndex].image}
                    alt={stories[activeStoryIndex].author}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <p className="text-slate-700 text-xs italic leading-relaxed">
                    {stories[activeStoryIndex].quote}
                  </p>
                  <div>
                    <h4 className="font-bold text-[#0a1c3d] text-xs">
                      — {stories[activeStoryIndex].author}
                    </h4>
                    <p className="text-slate-500 text-[11px]">
                      {stories[activeStoryIndex].role}
                    </p>
                  </div>
                </div>

                {/* Carousel Navigation Arrows */}
                <button
                  onClick={() => setActiveStoryIndex((prev) => (prev > 0 ? prev - 1 : stories.length - 1))}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 cursor-pointer"
                  aria-label="Témoignage précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveStoryIndex((prev) => (prev < stories.length - 1 ? prev + 1 : 0))}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 cursor-pointer"
                  aria-label="Témoignage suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Dots */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {stories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStoryIndex(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeStoryIndex === i ? 'w-5 bg-[#1d4ed8]' : 'w-1.5 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. BOTTOM BANNER: "Rejoignez le pont qui crée des opportunités."           */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-[#071630] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            {/* Left text */}
            <div className="max-w-md space-y-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Rejoignez le pont qui crée des opportunités.
              </h3>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                Faites partie d’une communauté qui agit pour un avenir plus prospère entre la Chine et l’Afrique du Nord.
              </p>
            </div>

            {/* Middle Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenRegister ? onOpenRegister() : onNavigate('contact')}
                className="px-6 py-2.5 rounded-full bg-[#e01a22] hover:bg-[#c7151c] text-white font-medium text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                Créer un compte
              </button>
              <button
                onClick={() => onOpenContact ? onOpenContact() : onNavigate('contact')}
                className="px-6 py-2.5 rounded-full border border-white/80 hover:bg-white hover:text-[#071630] text-white font-medium text-xs sm:text-sm bg-white/5 backdrop-blur-sm transition-all cursor-pointer"
              >
                Nous contacter
              </button>
            </div>

            {/* Right: 4 bullet points with checkmark in circle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-xs text-white/90">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Des opportunités réelles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Un réseau international</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Un accompagnement expert</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Un impact durable</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FOOTER SECTION                                                        */}
      {/* ========================================================================= */}
      <ContactFooterSection
        showOnlyFooter={true}
        onScrollToSection={onNavigate}
      />
    </div>
  );
};
