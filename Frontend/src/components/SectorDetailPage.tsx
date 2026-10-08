import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Users,
  FileText,
  Handshake,
  Globe,
  Share2,
  Cpu,
  Zap,
  Building2,
  Building,
  Leaf,
  Sun,
  Package,
  Settings,
  ShieldCheck,
  Search,
  Check,
  Sparkles,
  Compass,
  Utensils,
  Briefcase,
  Radio,
  ShoppingCart,
  CreditCard,
  Rocket,
  Cloud,
  Database,
  Network,
  Smartphone,
  Code,
  Server,
  Pill,
  Stethoscope,
  Dna,
  GraduationCap,
  Heart,
  Anchor,
  Plane,
  Truck,
  Car,
  Activity,
  HeartPulse,
  Microscope,
  Wind,
  Flame,
  BatteryCharging,
  Battery,
  Coins,
  Home,
  Landmark,
  HardHat,
  Sprout,
  Apple,
  Wheat,
  Milk,
  Eye,
  Send,
  MessageSquare,
  ChevronDown,
  Linkedin,
  Youtube,
  Lightbulb,
  Factory,
  Link as LinkIcon,
  Shirt,
  Layers,
  ConciergeBell,
  Image as ImageIcon,
  Palette,
} from 'lucide-react';
import { SECTORS_DETAILS, SectorData } from '../data/sectorsData';
import { Logo } from './Logo';
import { api } from '../lib/api';
import { CountryFlag } from './common/CountryFlag';

interface SectorDetailPageProps {
  sectorId: string;
  onBackToSectors: () => void;
  onNavigate: (tab: string) => void;
  onOpenRegister?: () => void;
  onOpenAppointment?: () => void;
}

export const SectorDetailPage: React.FC<SectorDetailPageProps> = ({
  sectorId,
  onBackToSectors,
  onNavigate,
  onOpenAppointment,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    country: 'Tunisie',
    projectType: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fallback to construction if sectorId not found
  const sector: SectorData = SECTORS_DETAILS[sectorId] || SECTORS_DETAILS['construction'];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsSubmitted(false);
  }, [sectorId]);

  const getPillarIcon = (iconName: string) => {
    const iconClass = "w-6 h-6 text-white shrink-0";
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp className={iconClass} />;
      case 'Handshake': return <Handshake className={iconClass} />;
      case 'Leaf': return <Leaf className={iconClass} />;
      case 'Users': return <Users className={iconClass} />;
      case 'Sprout': return <Sprout className={iconClass} />;
      case 'Globe': return <Globe className={iconClass} />;
      case 'Share2': return <Share2 className={iconClass} />;
      case 'Cpu': return <Cpu className={iconClass} />;
      case 'Lightbulb': return <Lightbulb className={iconClass} />;
      case 'Rocket': return <Rocket className={iconClass} />;
      case 'ShieldCheck': return <ShieldCheck className={iconClass} />;
      case 'Cloud': return <Cloud className={iconClass} />;
      case 'Heart':
      case 'HeartPulse':
      case 'Activity': return <HeartPulse className={iconClass} />;
      default: return <TrendingUp className={iconClass} />;
    }
  };

  const getStatIcon = (iconName: string) => {
    const iconClass = "w-7 h-7 text-[#0a1c3d] shrink-0 mb-1.5";
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp className={iconClass} />;
      case 'Users': return <Users className={iconClass} />;
      case 'Globe': return <Globe className={iconClass} />;
      case 'FileText': return <FileText className={iconClass} />;
      case 'Package': return <Package className={iconClass} />;
      case 'Briefcase': return <Briefcase className={iconClass} />;
      case 'Cpu': return <Cpu className={iconClass} />;
      case 'Rocket': return <Rocket className={iconClass} />;
      case 'Cloud': return <Cloud className={iconClass} />;
      case 'Lightbulb': return <Lightbulb className={iconClass} />;
      case 'Zap': return <Zap className={iconClass} />;
      case 'Sun': return <Sun className="w-7 h-7 text-[#0a1c3d] shrink-0 mb-1.5" />;
      case 'Coins':
      case 'CreditCard': return <Coins className="w-7 h-7 text-emerald-600 shrink-0 mb-1.5" />;
      case 'Pill': return <Pill className="w-7 h-7 text-[#0a1c3d] shrink-0 mb-1.5" />;
      case 'Sprout': return <Sprout className={iconClass} />;
      case 'Handshake': return <Handshake className={iconClass} />;
      case 'Settings': return <Settings className={iconClass} />;
      default: return <Globe className={iconClass} />;
    }
  };

  const getSubSectorIcon = (iconName: string, customClass?: string) => {
    const iconClass = customClass || "w-4 h-4 text-[#0a1c3d]";
    switch (iconName) {
      case 'Home': return <Home className={iconClass} />;
      case 'Building2': return <Building2 className={iconClass} />;
      case 'Landmark': return <Landmark className={iconClass} />;
      case 'Leaf': return <Leaf className={customClass || "w-4 h-4 text-emerald-600"} />;
      case 'Settings': return <Settings className={iconClass} />;
      case 'Building': return <Building className={iconClass} />;
      case 'HardHat': return <HardHat className={iconClass} />;
      case 'Cpu': return <Cpu className={iconClass} />;
      case 'Cloud': return <Cloud className={iconClass} />;
      case 'Radio': return <Radio className={iconClass} />;
      case 'ShoppingCart': return <ShoppingCart className={iconClass} />;
      case 'CreditCard': return <CreditCard className={iconClass} />;
      case 'Rocket': return <Rocket className={iconClass} />;
      case 'Database': return <Database className={iconClass} />;
      case 'Network': return <Network className={iconClass} />;
      case 'Smartphone': return <Smartphone className={iconClass} />;
      case 'Code': return <Code className={iconClass} />;
      case 'Server': return <Server className={iconClass} />;
      case 'Globe': return <Globe className={iconClass} />;
      case 'Handshake': return <Handshake className={iconClass} />;
      case 'FileText': return <FileText className={iconClass} />;
      case 'Search': return <Search className={iconClass} />;
      case 'Zap': return <Zap className={customClass || "w-4 h-4 text-amber-500"} />;
      case 'Sun': return <Sun className={customClass || "w-4 h-4 text-amber-500"} />;
      case 'Wind': return <Wind className={customClass || "w-4 h-4 text-teal-600"} />;
      case 'H2': return <span className={customClass ? "font-extrabold text-[11px] leading-none" : "font-extrabold text-[12px] leading-none text-emerald-600"}>H₂</span>;
      case 'Battery':
      case 'BatteryCharging': return <BatteryCharging className={customClass || "w-4 h-4 text-emerald-600"} />;
      case 'Flame': return <Flame className={customClass || "w-4 h-4 text-orange-500"} />;
      case 'Sprout': return <Sprout className={iconClass} />;
      case 'Wheat': return <Wheat className={iconClass} />;
      case 'Apple': return <Apple className={iconClass} />;
      case 'Truck': return <Truck className={iconClass} />;
      case 'Anchor': return <Anchor className={iconClass} />;
      case 'Plane': return <Plane className={iconClass} />;
      case 'Package': return <Package className={iconClass} />;
      case 'Share2': return <Share2 className={iconClass} />;
      case 'Car': return <Car className={iconClass} />;
      case 'Lightbulb': return <Lightbulb className={iconClass} />;
      case 'Factory': return <Factory className={iconClass} />;
      case 'Link': return <LinkIcon className={iconClass} />;
      case 'Shirt': return <Shirt className={iconClass} />;
      case 'Layers': return <Layers className={iconClass} />;
      case 'TrendingUp': return <TrendingUp className={iconClass} />;
      case 'Users': return <Users className={iconClass} />;
      case 'Stethoscope': return <Stethoscope className={customClass || "w-4 h-4 text-blue-600"} />;
      case 'Pill': return <Pill className={customClass || "w-4 h-4 text-rose-500"} />;
      case 'Dna': return <Dna className={customClass || "w-4 h-4 text-indigo-600"} />;
      case 'Activity':
      case 'HeartPulse': return <HeartPulse className={customClass || "w-4 h-4 text-emerald-600"} />;
      case 'Microscope': return <Microscope className={customClass || "w-4 h-4 text-cyan-600"} />;
      case 'GraduationCap': return <GraduationCap className={customClass || "w-4 h-4 text-amber-600"} />;
      case 'Heart': return <Heart className={customClass || "w-4 h-4 text-rose-500"} />;
      case 'ConciergeBell': return <ConciergeBell className={iconClass} />;
      case 'Image':
      case 'ImageIcon': return <ImageIcon className={iconClass} />;
      case 'Palette': return <Palette className={iconClass} />;
      case 'Compass': return <Compass className={iconClass} />;
      case 'Utensils': return <Utensils className={iconClass} />;
      case 'Sparkles': return <Sparkles className={iconClass} />;
      case 'Briefcase': return <Briefcase className={iconClass} />;
      default: return <Building2 className={iconClass} />;
    }
  };

  const getServiceIcon = (iconName: string) => {
    const iconClass = "w-5 h-5 text-[#0a1c3d]";
    switch (iconName) {
      case 'Handshake': return <Handshake className={iconClass} />;
      case 'FileText': return <FileText className={iconClass} />;
      case 'Users': return <Users className={iconClass} />;
      case 'Settings': return <Settings className={iconClass} />;
      case 'TrendingUp': return <TrendingUp className={iconClass} />;
      case 'Search': return <Search className={iconClass} />;
      case 'ShieldCheck': return <ShieldCheck className={iconClass} />;
      case 'FileCheck': return <FileText className={iconClass} />;
      default: return <Handshake className={iconClass} />;
    }
  };

  const getCountryFlag = (code: string) => {
    return <CountryFlag code={code} size="sm" />;
  };

  const handleScrollToOpportunities = () => {
    const el = document.getElementById('opportunites-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToForm = () => {
    const el = document.getElementById('contact-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      await api.post('/contact', {
        source: 'sector',
        fullName: formData.fullName,
        email: formData.email,
        company: formData.company,
        country: formData.country,
        sector: sector.title,
        subject: formData.projectType || `Projet ${sector.title}`,
        message: formData.message,
        consent: true,
        context: { sectorId },
      });
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Envoi impossible.');
    }
  };

  return (
    <div className="w-full bg-white text-slate-900 min-h-screen font-sans antialiased selection:bg-red-500 selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Exact copy of construction.png)                          */}
      {/* ========================================================================= */}
      <section className="relative min-h-[580px] lg:min-h-[640px] pt-24 pb-12 flex items-center overflow-hidden border-b border-slate-200/80">
        
        {/* Background photo with strong opacity, clarity and rich visibility */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={sector.heroBg || "/images/agriculture_hero.jpg"}
            alt={sector.title}
            loading="eager"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1920&q=85";
            }}
            className={`w-full h-full object-cover contrast-[1.12] saturate-[1.18] brightness-[1.02] opacity-100 ${
              sector.id === 'industrie' ? 'object-right' : sector.id === 'logistique' ? 'object-top' : 'object-center'
            }`}
          />
          {/* Dégradé protecteur blanc pur et doux couvrant toute la colonne de gauche (from-white via-white/95 to-transparent), éliminant tout conflit visuel avec les conteneurs et camions en arrière-plan */}
          <div 
            className="absolute inset-y-0 left-0 w-full sm:w-[64%] lg:w-[54%] bg-gradient-to-r from-white via-white/95 to-transparent z-10"
            style={{
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 75px, rgba(0,0,0,1) 125px, rgba(0,0,0,1) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 75px, rgba(0,0,0,1) 125px, rgba(0,0,0,1) 100%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Sector tag, Titles, Description, CTA Buttons */}
            <div className="lg:col-span-7 text-left space-y-4">
              
              {/* SECTEUR Tag */}
              <div className="inline-flex items-center gap-2">
                <span className="text-[#0a1c3d] font-extrabold text-xs tracking-widest uppercase drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                  {sector.tag}
                </span>
                <span className="h-1 w-6 bg-[#e01a22] rounded-full" />
              </div>

              {/* Main Headline (e.g. Construction & Immobilier) */}
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-[#0a1c3d] tracking-tight leading-[1.05] drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]">
                {sector.title.includes('&') ? (
                  <>
                    <span>{sector.title.split('&')[0]}&</span>
                    <br />
                    <span>{sector.title.split('&')[1]}</span>
                  </>
                ) : (
                  sector.title
                )}
              </h1>

              {/* Subtitle Slogan */}
              <p className="text-lg sm:text-xl font-bold text-[#0a1c3d] pt-1 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                {sector.subTitle}
              </p>

              {/* Hero Paragraph Description */}
              <p className="text-slate-800 font-semibold text-sm sm:text-[15.5px] leading-relaxed max-w-xl drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                {sector.heroDescription}
              </p>

              {/* Action Buttons (Solid Red & Outline) */}
              <div className="pt-3 flex flex-wrap items-center gap-3.5">
                <button
                  onClick={handleScrollToOpportunities}
                  className="inline-flex items-center gap-2 bg-[#e01a22] hover:bg-[#c9141b] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-sm"
                >
                  <span>Explorer les opportunités</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleScrollToForm}
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#0a1c3d] font-semibold px-6 py-3 rounded-lg border border-slate-300 shadow-xs hover:border-slate-400 transition-all duration-200 cursor-pointer text-sm"
                >
                  <span>Nous contacter</span>
                </button>
              </div>
            </div>

            {/* Right Column: Floating Slogan & Navy Dock of Sub-sectors */}
            <div className="lg:col-span-5 flex flex-col items-end justify-center space-y-6">
              
              {/* Cursive / Brush Slogan */}
              {sector.heroSlogan && (
                <div className="hidden sm:block text-right pr-1">
                  {sector.id === 'industrie' || sector.id === 'agriculture' ? (
                    <div className="text-right">
                      <p className="font-serif italic text-2xl lg:text-[28px] leading-snug font-medium text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] max-w-xs ml-auto">
                        {sector.heroSlogan}
                      </p>
                    </div>
                  ) : sector.id === 'tourisme' || sector.id === 'construction' || sector.id === 'energie' || sector.id === 'sante' ? (
                    <div className="text-right pr-2 select-none">
                      <p className="font-serif italic text-2xl sm:text-[26px] lg:text-[30px] leading-[1.18] font-bold text-[#0a1c3d] max-w-[280px] ml-auto drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]">
                        {sector.heroSlogan}
                      </p>
                    </div>
                  ) : (
                    <div className="inline-block bg-white/90 backdrop-blur-md border border-white/80 shadow-xl shadow-slate-900/10 px-5 py-3.5 rounded-2xl text-right max-w-md">
                      <p className="font-serif italic text-xl lg:text-2xl leading-snug font-semibold text-[#0a1c3d] tracking-tight">
                        "{sector.heroSlogan}"
                      </p>
                      <div className="w-20 h-1 bg-[#e01a22] rounded-full ml-auto mt-2.5" />
                    </div>
                  )}
                </div>
              )}

              {/* Floating Dock of Sub-sectors */}
              {sector.heroPills && sector.heroPills.length > 0 && (
                <div className={`w-full max-w-[280px] rounded-2xl p-4 text-white space-y-2.5 ${
                  sector.id === 'agriculture'
                    ? 'bg-black/35 backdrop-blur-md border border-white/20 shadow-2xl'
                    : 'bg-[#0a1c3d] rounded-2xl shadow-2xl border border-blue-900/40'
                }`}>
                  {sector.heroPills.map((pill, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-2 py-1 hover:bg-white/10 rounded-xl transition-colors cursor-default"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shrink-0 text-white">
                        {getSubSectorIcon(pill.iconName, "w-4 h-4 text-white")}
                      </div>
                      <span className="text-xs font-semibold text-white/95 leading-tight">
                        {pill.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE 4 PILLARS BAR                                                      */}
      {/* ========================================================================= */}
      <section className={`w-full py-6 border-y ${
        sector.id === 'agriculture'
          ? 'bg-[#0d3320] text-white border-emerald-950/40'
          : 'bg-[#0a1c3d] text-white border-blue-900/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {sector.fourPillars.map((pillar, idx) => (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  {getPillarIcon(pillar.iconName)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white tracking-tight leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-blue-100/75 mt-1 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION "Un secteur en pleine transformation" (Pure White)             */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left: Heading, Description, Approach Button */}
            <div className="lg:col-span-5 text-left">
              <div className="w-10 h-1 bg-[#e01a22] rounded-full mb-3" />
              <h2 className="text-2xl sm:text-3xl font-black text-[#0a1c3d] tracking-tight leading-snug">
                {sector.overviewTitle}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mt-4">
                {sector.overviewDescription}
              </p>
              <button
                onClick={onOpenAppointment}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-[#0a1c3d] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>{sector.overviewButtonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right: 4 Stat Cards in a row + Quote Box */}
            <div className="lg:col-span-7">
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sector.stats.map((st, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col items-center text-center shadow-xs hover:shadow-sm transition-shadow"
                  >
                    {getStatIcon(st.iconName)}
                    <div className="text-xl sm:text-2xl font-black text-[#0a1c3d] tracking-tight">
                      {st.value}
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium leading-tight mt-1.5">
                      {st.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quote Box below */}
              <div className="bg-[#f0f7ff] border border-blue-100 rounded-xl p-4 sm:p-5 mt-4 flex items-start gap-3.5">
                <span className="text-4xl sm:text-5xl text-[#0a1c3d] font-serif leading-none shrink-0 -mt-1 font-bold select-none">
                  “
                </span>
                <div>
                  <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed italic">
                    {sector.quote}
                  </p>
                  <span className="block not-italic font-bold text-xs text-slate-600 mt-1.5">
                    — L'équipe QIAO
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION "Sous-secteurs clés" (6 Cards in a Single Row)                 */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-14 bg-[#fafbfc] border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-[#0a1c3d] tracking-tight">
              {sector.subSectorsTitle}
            </h2>
            <button
              onClick={handleScrollToOpportunities}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#e01a22] hover:underline cursor-pointer"
            >
              <span>Voir tous les sous-secteurs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6 Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {sector.subSectors.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Image */}
                <div className="h-32 w-full overflow-hidden relative bg-slate-100">
                  <img
                    src={sub.image}
                    alt={sub.title}
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80";
                    }}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Floating Round Icon Badge */}
                <div className="w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center -mt-4 ml-3 relative z-10 text-[#0a1c3d]">
                  {getSubSectorIcon(sub.iconName)}
                </div>

                {/* Text Content */}
                <div className="p-3 pt-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-[#0a1c3d] line-clamp-1 leading-snug">
                      {sub.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                      {sub.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. 3 COLUMNS: Opportunités, Nos services, Histoire de succès              */}
      {/* ========================================================================= */}
      <section id="opportunites-section" className="py-14 sm:py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* COLUMN 1: Opportunités actuelles (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xl font-black text-[#0a1c3d] tracking-tight">
                  Opportunités actuelles
                </h3>
                <button
                  onClick={handleScrollToForm}
                  className="text-xs font-bold text-[#e01a22] hover:underline cursor-pointer"
                >
                  Voir toutes les opportunités →
                </button>
              </div>

              <div className="space-y-2.5">
                {sector.opportunities.map((op) => (
                  <div
                    key={op.id}
                    onClick={handleScrollToForm}
                    className="p-3 rounded-xl border border-slate-200/80 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-2xs"
                  >
                    {/* Real Vector SVG Country Flag */}
                    <CountryFlag code={op.countryCode} size="md" />

                    {/* Middle Title & Country | Type */}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-[#0a1c3d] truncate group-hover:text-[#e01a22] transition-colors">
                        {op.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">{op.country}</span>
                        <span>|</span>
                        <span>{op.type}</span>
                      </div>
                    </div>

                    {/* Right Arrow */}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0a1c3d] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: Nos services pour ce secteur (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="pb-1">
                <h3 className="text-xl font-black text-[#0a1c3d] tracking-tight">
                  Nos services pour ce secteur
                </h3>
              </div>

              <div className="space-y-3">
                {sector.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50/80 text-[#0a1c3d] flex items-center justify-center shrink-0 border border-blue-100/80 mt-0.5">
                      {getServiceIcon(srv.iconName)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#0a1c3d] leading-snug">
                        {srv.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {srv.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 3: Histoire de succès (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="pb-1">
                <h3 className="text-xl font-black text-[#0a1c3d] tracking-tight">
                  Histoire de succès
                </h3>
              </div>

              {sector.successStory && (
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 p-4 shadow-xs">
                  {/* Photo */}
                  <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={sector.successStory.image || "/images/olive_oil.jpg"}
                      alt={sector.successStory.title}
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80";
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Corridor Tag (e.g. TUNISIE ➔ CHINE) with real SVG flags */}
                  <div className="text-[11px] font-extrabold tracking-wider text-[#e01a22] uppercase mt-3.5 flex items-center gap-1.5">
                    <CountryFlag
                      code={
                        sector.successStory.corridor.includes('MAROC')
                          ? 'MA'
                          : sector.successStory.corridor.includes('ALGÉRIE') || sector.successStory.corridor.includes('ALGERIE')
                          ? 'DZ'
                          : sector.successStory.corridor.includes('ÉGYPTE') || sector.successStory.corridor.includes('EGYPTE')
                          ? 'EG'
                          : sector.successStory.corridor.includes('LIBYE')
                          ? 'LY'
                          : 'TN'
                      }
                      size="xs"
                    />
                    <span>{sector.successStory.corridor}</span>
                    <CountryFlag code="CN" size="xs" />
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-extrabold text-[#0a1c3d] mt-1 leading-snug">
                    {sector.successStory.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">
                    {sector.successStory.description}
                  </p>

                  {/* Link */}
                  <button
                    onClick={onOpenAppointment}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e01a22] hover:underline mt-3.5 cursor-pointer"
                  >
                    <span>Lire l'histoire complète</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CONTACT FORM SECTION ("Parlons de vos projets...")                      */}
      {/* ========================================================================= */}
      <section id="contact-form-section" className="relative w-full overflow-hidden py-16 sm:py-24 border-t border-slate-200">
        
        {/* Full-bleed Background Photo with high clarity, strong opacity and vibrant visibility */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={sector.formBg || "/images/agriculture_hero.jpg"}
            alt={sector.formTitle}
            loading="eager"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1920&q=85";
            }}
            className="w-full h-full object-cover object-center brightness-105 contrast-[1.08] saturate-[1.12]"
          />
          {/* Soft directional gradient: gentle left shade for crisp text readability, fully clear and vibrant across the rest */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 via-45% to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 text-white space-y-4">
              <div className="w-10 h-1 bg-[#e01a22] rounded-full mb-3" />
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                {sector.formTitle}
              </h2>

              <p className="text-slate-100 text-sm leading-relaxed max-w-md drop-shadow-sm font-medium">
                {sector.formSubtitle}
              </p>

              {/* 3 Reassurance items - Horizontal row matching screenshot */}
              <div className="pt-6 flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-5 text-xs sm:text-sm font-semibold text-white drop-shadow-sm">
                <div className="inline-flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-red-400 shrink-0 drop-shadow-xs" />
                  <span>Une réponse rapide</span>
                </div>

                <div className="inline-flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-400 shrink-0 drop-shadow-xs" />
                  <span>Des experts sectoriels</span>
                </div>

                <div className="inline-flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-red-400 shrink-0 drop-shadow-xs" />
                  <span>Un accompagnement personnalisé</span>
                </div>
              </div>
            </div>

            {/* Right: Clean Glass Form Card */}
            <div className="lg:col-span-6">
              <div className="bg-white/85 sm:bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 sm:p-7 shadow-xl text-slate-800">
                <h3 className="text-lg font-black text-[#0a1c3d] mb-4 tracking-tight">
                  Envoyez-nous un message
                </h3>

                  {isSubmitted ? (
                    <div className="py-10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-base text-[#0a1c3d]">Message envoyé avec succès</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Notre équipe d'experts sectoriels reviendra vers vous sous 24h ouvrées.
                      </p>
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="text-xs font-bold text-[#e01a22] hover:underline pt-2 cursor-pointer"
                      >
                        Envoyer une autre demande
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                      
                      {/* Row 1: Nom complet & Adresse email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="Nom complet *"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0a1c3d] focus:ring-1 focus:ring-[#0a1c3d]"
                          />
                        </div>
                        <div>
                          <input
                            type="email"
                            required
                            placeholder="Adresse email *"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0a1c3d] focus:ring-1 focus:ring-[#0a1c3d]"
                          />
                        </div>
                      </div>

                      {/* Row 2: Entreprise & Pays */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="Entreprise / Organisation *"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0a1c3d] focus:ring-1 focus:ring-[#0a1c3d]"
                          />
                        </div>
                        <div className="relative">
                          <div className="absolute left-3 top-2.5 pointer-events-none flex items-center">
                            <CountryFlag code={formData.country} size="xs" />
                          </div>
                          <select
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full pl-8 pr-8 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0a1c3d] appearance-none bg-white"
                          >
                            <option value="Tunisie">Tunisie</option>
                            <option value="Maroc">Maroc</option>
                            <option value="Algérie">Algérie</option>
                            <option value="Égypte">Égypte</option>
                            <option value="Libye">Libye</option>
                            <option value="Chine">Chine</option>
                            <option value="Autre">Autre</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                        </div>
                      </div>

                      {/* Row 3: Type de projet */}
                      <div className="relative">
                        <select
                          value={formData.projectType}
                          onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0a1c3d] appearance-none bg-white pr-8"
                        >
                          <option value="">Type de projet *</option>
                          {sector.projectTypes.map((pt, i) => (
                            <option key={i} value={pt}>
                              {pt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>

                      {/* Row 4: Votre message */}
                      <div>
                        <textarea
                          rows={3}
                          required
                          placeholder="Votre message *"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0a1c3d] focus:ring-1 focus:ring-[#0a1c3d] resize-none"
                        />
                      </div>

                      {/* Submit Button (Solid Red) */}
                      {submitError && <p className="text-xs text-red-600 font-semibold">{submitError}</p>}
                      <button
                        type="submit"
                        className="w-full bg-[#e01a22] hover:bg-[#c9141b] text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Envoyer le message</span>
                      </button>

                    </form>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER (Exact copy of footer in construction.png)                      */}
      {/* ========================================================================= */}
      <footer className="w-full bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* Left: QIAO Logo */}
            <div 
              onClick={() => onNavigate('home')} 
              className="cursor-pointer hover:opacity-95 shrink-0"
            >
              <Logo variant="light" size="md" />
            </div>

            {/* Center: Navigation links */}
            <div className="text-center space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-700 font-medium">
                <button onClick={() => onNavigate('home')} className="hover:text-[#e01a22] transition-colors cursor-pointer">Accueil</button>
                <span>|</span>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-[#e01a22] transition-colors cursor-pointer">À propos</button>
                <span>|</span>
                <button onClick={onBackToSectors} className="text-[#e01a22] font-bold hover:underline cursor-pointer">Secteurs</button>
                <span>|</span>
                <button onClick={() => onNavigate('partners')} className="hover:text-[#e01a22] transition-colors cursor-pointer">Pays</button>
                <span>|</span>
                <button onClick={handleScrollToOpportunities} className="hover:text-[#e01a22] transition-colors cursor-pointer">Opportunités</button>
                <span>|</span>
                <button onClick={() => onNavigate('intelligence')} className="hover:text-[#e01a22] transition-colors cursor-pointer">Analyses</button>
                <span>|</span>
                <button onClick={() => onNavigate('resources')} className="hover:text-[#e01a22] transition-colors cursor-pointer">Événements</button>
                <span>|</span>
                <button onClick={() => onNavigate('resources')} className="hover:text-[#e01a22] transition-colors cursor-pointer">Ressources</button>
                <span>|</span>
                <button onClick={handleScrollToForm} className="hover:text-[#e01a22] transition-colors cursor-pointer">Contact</button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 text-[11px] text-slate-500">
                <button className="hover:underline">Confidentialité</button>
                <span>|</span>
                <button className="hover:underline">Conditions d'utilisation</button>
                <span>|</span>
                <button className="hover:underline">Mentions légales</button>
              </div>
            </div>

            {/* Right: Social icons, Language, Copyright, Cursive Slogan */}
            <div className="flex flex-col items-center lg:items-end space-y-2 shrink-0">
              <div className="flex items-center gap-3">
                {/* LinkedIn */}
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-6 h-6 rounded bg-[#0077b5] text-white flex items-center justify-center hover:opacity-90">
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
                {/* YouTube */}
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-6 h-6 rounded bg-[#ff0000] text-white flex items-center justify-center hover:opacity-90">
                  <Youtube className="w-3.5 h-3.5" />
                </a>
                {/* X */}
                <a href="https://x.com" target="_blank" rel="noreferrer" className="w-6 h-6 rounded bg-black text-white flex items-center justify-center hover:opacity-90 font-bold text-xs">
                  𝕏
                </a>
                {/* FR Language */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-slate-300 text-xs font-semibold text-slate-700">
                  <span>FR</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                © 2024 QIAO. Tous droits réservés.
              </div>

              {/* Cursive handwritten slogan */}
              <div className="font-serif italic text-sm sm:text-base text-[#0a1c3d] tracking-tight leading-tight text-right select-none max-w-[200px]">
                {sector.footerSignature}
              </div>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
};
