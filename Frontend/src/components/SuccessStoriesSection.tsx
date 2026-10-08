import React, { useState } from 'react';
import {
  Building2,
  Handshake,
  Globe2,
  Users,
  Clock,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Percent,
  BadgeCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Mail,
  Quote,
  Star,
  Leaf,
  Layers,
  Hexagon,
} from 'lucide-react';
import { caseStudiesData, testimonialsData } from '../data/mockData';
import { CaseStudy } from '../types';

interface SuccessStoriesSectionProps {
  onSelectCaseStudy?: (study: CaseStudy) => void;
  onContactExpert?: () => void;
  onBookAppointment?: () => void;
}

export const SuccessStoriesSection: React.FC<SuccessStoriesSectionProps> = ({
  onSelectCaseStudy,
  onContactExpert,
  onBookAppointment,
}) => {
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev + 1) % testimonialsData.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
  };

  const renderMetricIcon = (iconName: string, isRed = false) => {
    const colorClass = isRed ? 'text-red-600' : 'text-blue-600';
    switch (iconName) {
      case 'Clock':
      case 'Calendar':
        return <Clock className={`w-4 h-4 ${colorClass}`} />;
      case 'TrendingDown':
      case 'Percent':
        return <TrendingDown className={`w-4 h-4 ${colorClass}`} />;
      case 'ShieldCheck':
      case 'CheckCircle2':
        return <ShieldCheck className={`w-4 h-4 ${colorClass}`} />;
      case 'Handshake':
        return <Handshake className={`w-4 h-4 ${colorClass}`} />;
      case 'BadgeCheck':
        return <BadgeCheck className={`w-4 h-4 ${colorClass}`} />;
      case 'Sparkles':
        return <Sparkles className={`w-4 h-4 ${colorClass}`} />;
      default:
        return <CheckCircle2 className={`w-4 h-4 ${colorClass}`} />;
    }
  };

  const renderCompanyLogo = (company: string) => {
    if (company === 'SOTUFAB') {
      return (
        <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
          <Hexagon className="w-5 h-5 fill-current" />
        </div>
      );
    }
    if (company === 'GreenTech') {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
          <Leaf className="w-5 h-5" />
        </div>
      );
    }
    if (company === 'ModaLuxe') {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
          <Layers className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
        {company[0]}
      </div>
    );
  };

  return (
    <section id="success-stories" className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header (Image 2) */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="text-xs sm:text-sm font-bold text-red-600 uppercase tracking-wider mb-2">
            ILS NOUS FONT CONFIANCE
          </div>
          
          {/* Red and Blue dual accent line */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <div className="w-8 h-[2px] bg-red-600 rounded-full" />
            <div className="w-8 h-[2px] bg-blue-600 rounded-full" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Des histoires de <span className="text-red-600">succès</span>, des partenariats durables
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500 font-light max-w-2xl mx-auto">
            QIAO accompagne chaque jour des entreprises et des professionnels à concrétiser leurs ambitions entre la Chine et l'Afrique du Nord.
          </p>
        </div>

        {/* 5 Stats Row - Clean Unified White Card (Image 2) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            
            {/* Stat 1 */}
            <div className="pt-3 sm:pt-0 sm:px-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">1,200+</div>
              <div className="text-xs text-slate-500 font-light mt-0.5">Entreprises accompagnées</div>
            </div>

            {/* Stat 2 */}
            <div className="pt-3 sm:pt-0 sm:px-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2">
                <Handshake className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">3,500+</div>
              <div className="text-xs text-slate-500 font-light mt-0.5">Projets réussis avec succès</div>
            </div>

            {/* Stat 3 */}
            <div className="pt-3 sm:pt-0 sm:px-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <Globe2 className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">20+</div>
              <div className="text-xs text-slate-500 font-light mt-0.5">Pays connectés dans le réseau</div>
            </div>

            {/* Stat 4 */}
            <div className="pt-3 sm:pt-0 sm:px-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">98%</div>
              <div className="text-xs text-slate-500 font-light mt-0.5">Taux de satisfaction de nos membres</div>
            </div>

            {/* Stat 5 */}
            <div className="col-span-2 sm:col-span-1 pt-3 sm:pt-0 sm:px-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">4.9/5</div>
              <div className="text-xs text-slate-500 font-light mt-0.5">Note moyenne de satisfaction</div>
            </div>

          </div>
        </div>

        {/* 3 Case Study Cards Grid (Exact Match to Image 2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {caseStudiesData.map((study) => {
            const isRed = study.company === 'GreenTech';
            const isBlue = study.company === 'SOTUFAB' || study.company === 'ModaLuxe';

            return (
              <div
                key={study.id}
                onClick={() => onSelectCaseStudy && onSelectCaseStudy(study)}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Image container with Pill Tag */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={study.image}
                      alt={study.company}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Category Tag Pill in Top Left (Image 2) */}
                    <div
                      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-xs ${
                        isRed
                          ? 'bg-red-50/95 text-red-600 border border-red-100'
                          : 'bg-blue-50/95 text-blue-600 border border-blue-100'
                      }`}
                    >
                      {study.tag}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    {/* Company Header with Logo */}
                    <div className="flex items-center gap-2.5 mb-3">
                      {renderCompanyLogo(study.company)}
                      <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                        {study.company}
                      </span>
                    </div>

                    {/* Subtitle description */}
                    <p className="text-xs text-slate-600 font-light leading-relaxed mb-4">
                      {study.title}
                    </p>

                    {/* Key Metrics / Check Items */}
                    <div className="space-y-2.5 pt-2">
                      {study.metrics.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                          {renderMetricIcon(m.icon, isRed)}
                          <span>{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Card Footer with arrow */}
                <div className="p-6 pt-0">
                  <div
                    className={`pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold ${
                      isRed ? 'text-red-600 group-hover:text-red-700' : 'text-blue-600 group-hover:text-blue-600'
                    }`}
                  >
                    <span>Voir l'histoire complète</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonials Slider */}
        <div className="my-10 bg-slate-50/70 rounded-3xl p-8 sm:p-10 border border-slate-200/80">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="text-red-600 text-lg">“</span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Ce que nos clients disent de nous
              </h3>
              <span className="text-red-600 text-lg">”</span>
            </div>

            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <button
                onClick={prevTestimonial}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-200 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextTestimonial}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-200 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonialsData.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Quote icon & Rating */}
                  <div className="flex items-center justify-between mb-4">
                    <Quote className="w-6 h-6 text-red-600/80" />
                    <div className="flex text-amber-400">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic font-light">
                    « {item.content} »
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      {item.role}, {item.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Consultation CTA Banner */}
        <div className="mt-12 bg-gradient-to-r from-[#07152b] via-[#0a1b38] to-[#07152b] rounded-3xl p-8 sm:p-10 text-white border border-slate-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                Prêt à concrétiser vos projets avec un partenaire de confiance ?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-light">
                Contactez nos experts et bénéficiez d'un accompagnement personnalisé pour atteindre vos objectifs.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={onContactExpert}
                  className="px-6 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-red-500/30 flex items-center gap-2 cursor-pointer"
                >
                  <span>Contactez-nous maintenant</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#services"
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  Découvrir nos services
                </a>
              </div>
            </div>

            {/* Right Col: 3 Quick Channels */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Channel 1 */}
              <div
                onClick={onContactExpert}
                className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl hover:border-red-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Parler à un expert</div>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-red-400">
                  <span>Réponse sous 24h</span>
                  <ArrowRight className="w-3 h-3" />
                </p>
              </div>

              {/* Channel 2 */}
              <div
                onClick={onBookAppointment}
                className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl hover:border-sky-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Prendre rendez-vous</div>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-sky-400">
                  <span>Avec nos spécialistes</span>
                  <ArrowRight className="w-3 h-3" />
                </p>
              </div>

              {/* Channel 3 */}
              <a
                href="mailto:contact@qiao.tn"
                className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white">Nous écrire</div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate group-hover:text-emerald-400">
                  contact@qiao.tn
                </p>
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
