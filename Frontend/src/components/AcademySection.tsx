import React from 'react';
import {
  GraduationCap,
  Award,
  Video,
  TrendingUp,
  UserCheck,
  Briefcase,
  Truck,
  Scale,
  Languages,
  ArrowRight,
  Users,
  Play,
  Globe,
  Crown,
  Sparkles,
} from 'lucide-react';
import { TrainingDomain } from '../types';
import { useApi } from '../hooks/useApi';
import academyHeroImg from '../assets/images/qiao_academy_hero_1787505055310.jpg';

const DEFAULT_DOMAINS: TrainingDomain[] = [
  {
    id: 'business-commerce',
    title: 'Business & Commerce International',
    description: 'Stratégies, négociation, développement international et gestion des affaires.',
    iconName: 'Globe',
    coursesCount: 24,
    featuredCourse: 'Négocier avec des partenaires chinois',
    duration: '18h',
    accentColor: 'red',
  },
  {
    id: 'logistique-supply',
    title: 'Logistique & Supply Chain',
    description: "Optimisez vos opérations d'import-export et gérez votre chaîne logistique.",
    iconName: 'Truck',
    coursesCount: 18,
    featuredCourse: 'Incoterms et fret maritime',
    duration: '14h',
    accentColor: 'blue',
  },
  {
    id: 'droit-conformite',
    title: 'Droit & Conformité',
    description: 'Réglementation, contrats, fiscalité et droit des affaires Chine & Afrique du Nord.',
    iconName: 'Scale',
    coursesCount: 16,
    featuredCourse: 'Sécuriser ses contrats commerciaux',
    duration: '20h',
    accentColor: 'red',
  },
  {
    id: 'langues-communication',
    title: 'Langues & Communication',
    description: 'Chinois, arabe, français et anglais professionnel pour le business.',
    iconName: 'Languages',
    coursesCount: 30,
    featuredCourse: 'Chinois des affaires pour dirigeants',
    duration: '35h',
    accentColor: 'blue',
  },
  {
    id: 'marketing-digital',
    title: 'Marketing & Digital',
    description: 'Marketing digital, e-commerce, réseaux sociaux et croissance internationale.',
    iconName: 'TrendingUp',
    coursesCount: 15,
    featuredCourse: 'Vendre sur WeChat et Douyin',
    duration: '16h',
    accentColor: 'red',
  },
  {
    id: 'leadership-soft-skills',
    title: 'Leadership & Soft Skills',
    description: "Leadership, gestion d'équipe, prise de décision et intelligence émotionnelle.",
    iconName: 'UserCheck',
    coursesCount: 12,
    featuredCourse: 'Management interculturel',
    duration: '12h',
    accentColor: 'blue',
  },
];

interface AcademySectionProps {
  onSelectDomain: (domain: TrainingDomain) => void;
  onExploreCourses: () => void;
  onOpenVideo?: () => void;
}

export const AcademySection: React.FC<AcademySectionProps> = ({
  onSelectDomain,
  onExploreCourses,
  onOpenVideo,
}) => {
  // Domaines chargés depuis l'API (table training_domains), affichage immédiat avec les valeurs par défaut.
  const { data: domainsList = DEFAULT_DOMAINS } = useApi<TrainingDomain[]>('/academy/domains', undefined, DEFAULT_DOMAINS);

  return (
    <section id="academy" className="py-12 sm:py-16 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Hero Grid (Matches exact top layout of picture) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16">
          
          {/* Left Column (7 cols): Header, Text, 4 Features, Action Buttons */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tagline: QIAO ACADEMY with two accent underlines */}
            <div>
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-slate-900">QIAO</span>
                <span className="text-red-600">ACADEMY</span>
              </div>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="w-7 h-[3px] bg-red-600 rounded-full inline-block" />
                <span className="w-3 h-[3px] bg-blue-600 rounded-full inline-block" />
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Apprenez. Progressez. <br />
              Réussissez avec <span className="text-blue-600">QIAO Academy.</span>
            </h1>

            {/* Subtitle Paragraph */}
            <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed max-w-xl font-normal">
              Développez vos compétences, comprenez les marchés et maîtrisez les clés du business entre la Chine et l'Afrique du Nord grâce à des formations en ligne conçues par des experts.
            </p>

            {/* 4 Feature Items in 4 columns / responsive grid with subtle dividers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-y border-slate-200/80 py-4">
              {/* Feature 1 */}
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">Formations en ligne</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Accédez à des cours à votre rythme, 24/7.</p>
              </div>

              {/* Feature 2 */}
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">Experts et praticiens</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Apprenez auprès d'experts locaux et internationaux.</p>
              </div>

              {/* Feature 3 */}
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">Certificats reconnus</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Valorisez vos compétences avec des certifications.</p>
              </div>

              {/* Feature 4 */}
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">Mise à jour continue</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Contenus actualisés selon les tendances du marché.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-6">
              <button
                onClick={onExploreCourses}
                className="px-6 py-3.5 bg-[#07152b] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer transform active:scale-95"
              >
                <span>Explorer les formations</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={onExploreCourses}
                className="text-xs sm:text-sm font-bold text-slate-900 hover:text-red-600 transition-colors flex items-center gap-2 cursor-pointer group"
              >
                <span>Voir le programme complet</span>
                <ArrowRight className="w-4 h-4 text-red-600 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column (5 cols): Composite Image Banner + Badges */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[28px] overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-[4/3] sm:aspect-[16/11]">
              <img
                src={academyHeroImg}
                alt="QIAO Academy - Apprenez et Réussissez"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              
              {/* Overlay gradient for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-900/10 pointer-events-none" />

              {/* Center Floating Video Play Button */}
              <button
                onClick={onOpenVideo}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/95 hover:bg-white text-red-600 shadow-xl flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95 transition-all z-20 group"
                aria-label="Lire la vidéo de présentation"
              >
                <Play className="w-6 h-6 fill-red-600 ml-1 group-hover:scale-105 transition-transform" />
              </button>

              {/* Floating Top-Left Badge: 100+ Formations spécialisées */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-lg border border-slate-100 flex items-center gap-2.5 z-10 animate-in fade-in">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 leading-none">100+</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">Formations spécialisées</div>
                </div>
              </div>

              {/* Floating Top-Right Badge: 5,000+ Apprenants actifs */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-lg border border-slate-100 flex items-center gap-2.5 z-10 animate-in fade-in">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 leading-none">5,000+</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">Apprenants actifs</div>
                </div>
              </div>

              {/* Floating Bottom-Right Badge: 12 Domaines d'apprentissage */}
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-lg border border-slate-100 flex items-center gap-2.5 z-10 animate-in fade-in">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 leading-none">12</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">Domaines d'apprentissage</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: "— NOS DOMAINES DE FORMATION →" (Matches exact 6-card row) */}
        <div className="mb-14">
          <div className="text-center mb-8">
            <span className="text-xs sm:text-sm font-bold text-red-600 uppercase tracking-wider inline-flex items-center gap-1.5">
              <span>—</span>
              <span>NOS DOMAINES DE FORMATION</span>
              <span>→</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-4.5">
            {domainsList.map((domain) => {
              const isRed = domain.accentColor === 'red';
              return (
                <div
                  key={domain.id}
                  onClick={() => onSelectDomain(domain)}
                  className={`group rounded-2xl p-5 border text-center transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5 shadow-xs hover:shadow-lg ${
                    isRed
                      ? 'bg-white border-red-100/90 hover:border-red-300'
                      : 'bg-white border-blue-100/90 hover:border-blue-300'
                  }`}
                >
                  <div>
                    {/* Centered Circular Icon Badge */}
                    <div
                      className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-xs ${
                        isRed
                          ? 'bg-red-100/80 text-red-600'
                          : 'bg-blue-100/80 text-blue-600'
                      }`}
                    >
                      {(domain.iconName === 'Globe' || domain.iconName === 'Briefcase') && <Globe className="w-5 h-5" />}
                      {domain.iconName === 'Truck' && <Truck className="w-5 h-5" />}
                      {domain.iconName === 'Scale' && <Scale className="w-5 h-5" />}
                      {domain.iconName === 'Languages' && <Languages className="w-5 h-5" />}
                      {domain.iconName === 'TrendingUp' && <TrendingUp className="w-5 h-5" />}
                      {domain.iconName === 'UserCheck' && <UserCheck className="w-5 h-5" />}
                    </div>

                    {/* Domain Title */}
                    <h3 className="text-sm font-bold text-slate-900 leading-snug min-h-[40px] flex items-center justify-center">
                      {domain.title}
                    </h3>

                    {/* Domain Description */}
                    <p className="mt-2 text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                      {domain.description}
                    </p>
                  </div>

                  {/* Bottom "Voir les cours ->" link */}
                  <div
                    className={`mt-4 pt-3 flex items-center justify-center gap-1 text-xs font-semibold ${
                      isRed ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    <span>Voir les cours</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: "Pourquoi choisir QIAO Academy ?" (Matches exact bottom card) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left Header with Crown icon (4 cols) */}
            <div className="lg:col-span-4 lg:border-r border-slate-200/80 pb-6 lg:pb-0 lg:pr-8 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <Crown className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Pourquoi choisir QIAO Academy ?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Une plateforme éducative pensée pour les professionnels, entrepreneurs, étudiants et entreprises qui veulent aller plus loin dans leurs <span className="text-blue-600 font-semibold">opportunités</span>.
                </p>
              </div>
            </div>

            {/* Right 4 Features (8 cols) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              
              {/* Item 1: Apprentissage flexible */}
              <div className="space-y-1">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-2">
                  <Play className="w-4 h-4 fill-red-600" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Apprentissage flexible</h4>
                <p className="text-[11px] text-slate-500 leading-snug">Apprenez quand vous voulez, où vous voulez.</p>
              </div>

              {/* Item 2: Communauté active */}
              <div className="space-y-1">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Communauté active</h4>
                <p className="text-[11px] text-slate-500 leading-snug">Échangez, collaborez et grandissez ensemble.</p>
              </div>

              {/* Item 3: Parcours personnalisés */}
              <div className="space-y-1">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-2">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Parcours personnalisés</h4>
                <p className="text-[11px] text-slate-500 leading-snug">Suivez des parcours adaptés à vos objectifs.</p>
              </div>

              {/* Item 4: Solutions pour entreprises */}
              <div className="space-y-1">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Solutions pour entreprises</h4>
                <p className="text-[11px] text-slate-500 leading-snug">Formations sur-mesure pour vos équipes et vos projets.</p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
