import React, { useState } from 'react';
import {
  FileText,
  TrendingUp,
  Calendar,
  Wrench,
  ArrowRight,
  Download,
  Mail,
  ShieldCheck,
  Users,
  Globe,
  Lightbulb,
  Shield,
  Building2,
  Briefcase,
  Star,
  CheckCircle2,
  ExternalLink,
  Calculator,
  BookOpen,
} from 'lucide-react';
import nightBridgeImg from '../assets/images/night_bridge_banner_1787502138759.jpg';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { resolveImage } from '../lib/assets';
import { Article, QiaoDocument, QiaoEvent } from '../lib/models';
import { useToast } from '../context/ToastContext';

interface ResourcesSectionProps {
  onOpenCalculator?: () => void;
  onOpenArticle: (articleId: string) => void;
  onOpenReport: (documentId: string) => void;
  onOpenEvent: (eventId: string) => void;
  onOpenTool: (toolId: 'tool-customs' | 'tool-directory') => void;
  onJoinCommunity?: () => void;
  onViewAll: (section: string) => void;
}

export const ResourcesSection: React.FC<ResourcesSectionProps> = ({
  onOpenCalculator,
  onOpenArticle,
  onOpenReport,
  onOpenEvent,
  onOpenTool,
  onJoinCommunity,
  onViewAll,
}) => {
  const { notify } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterSending, setNewsletterSending] = useState(false);
  const { data: articlesData = [] } = useApi<Article[]>('/articles', { placement: 'home' }, []);
  const { data: reportsData = [] } = useApi<QiaoDocument[]>('/documents', { section: 'home' }, []);
  const { data: eventsData = [] } = useApi<QiaoEvent[]>('/events', { placement: 'home' }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterSending(true);
    try {
      const result = await api.post<{ alreadySubscribed: boolean }>('/newsletter/subscribe', {
        email: newsletterEmail,
        topic: 'general',
        source: 'accueil',
      });
      setNewsletterSubscribed(true);
      if (result.alreadySubscribed) notify('Cette adresse est déjà abonnée à notre veille économique.', 'info');
      setNewsletterEmail('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Inscription impossible.', 'error');
    } finally {
      setNewsletterSending(false);
    }
  };

  return (
    <section id="resources" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs sm:text-sm font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
            <span className="w-6 h-[2px] bg-red-600 inline-block"></span>
            <span>Ressources & Intelligence</span>
            <span className="w-6 h-[2px] bg-red-600 inline-block"></span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Informez-vous. Inspirez-vous. <span className="text-red-600">Prenez de l'avance.</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Accédez à des contenus exclusifs, des analyses de marché et des outils pratiques pour réussir vos projets entre la Chine et l'Afrique du Nord.
          </p>
        </div>

        {/* 4 Cards Grid (Articles, Rapports, Événements, Outils) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Articles & Analyses */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div>
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Articles & Analyses</h3>
                    <p className="text-[11px] text-slate-400">Conseils d'experts et décryptages des marchés.</p>
                  </div>
                </div>
                <button
                  onClick={() => onViewAll('intelligence')}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                >
                  <span>Voir tout</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {articlesData.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onOpenArticle(item.id)}
                    className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer group flex items-start gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100 mt-0.5">
                      <img
                        src={resolveImage(item.image)}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-red-600 transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>{item.dateLabel}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
              <button
                onClick={() => onViewAll('analyses')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Explorer toutes les analyses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Rapports & Études */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div>
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Rapports & Études</h3>
                    <p className="text-[11px] text-slate-400">Données fiables et études de marché à jour.</p>
                  </div>
                </div>
                <button
                  onClick={() => onViewAll('rapports')}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                >
                  <span>Voir tout</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {reportsData.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => onOpenReport(report.id)}
                    className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer group flex items-start gap-3"
                  >
                    <div className="w-8 h-10 rounded-md bg-red-50 text-red-600 border border-red-200 flex flex-col items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                      <span className="text-[8px] font-bold uppercase">{report.format}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-red-600 transition-colors leading-snug line-clamp-2">
                        {report.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{report.format} • {report.sizeLabel}</span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          <span>{report.downloadsLabel.replace(' téléchargements', '')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
              <button
                onClick={() => onViewAll('resources')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Télécharger les études sectorielles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Événements & Webinaires */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div>
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Événements & Webinaires</h3>
                    <p className="text-[11px] text-slate-400">Participez à nos événements et rencontrez des experts.</p>
                  </div>
                </div>
                <button
                  onClick={() => onViewAll('evenements')}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                >
                  <span>Voir tout</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {eventsData.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onOpenEvent(event.id)}
                    className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer group flex items-start gap-3"
                  >
                    <div className="w-11 h-12 rounded-xl bg-blue-50 text-blue-800 border border-blue-200/80 flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span className="text-sm font-extrabold leading-none">{event.dateRange.split(' ')[0]}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider">{event.monthYear.split(' ')[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                        {event.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {event.location} • {event.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
              <button
                onClick={() => onViewAll('evenements')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Consulter le calendrier des événements</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Outils & Ressources (Includes interactive Import Simulator) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div>
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Outils & Ressources</h3>
                    <p className="text-[11px] text-slate-400">Des outils pratiques pour faciliter vos démarches.</p>
                  </div>
                </div>
                <button
                  onClick={onOpenCalculator}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                >
                  <span>Voir tout</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {/* 1. Import Simulator */}
                <div
                  onClick={onOpenCalculator}
                  className="p-4 hover:bg-red-50/50 transition-colors cursor-pointer group flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
                      Simulateur de coûts d'importation
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Estimez vos coûts en quelques clics
                    </p>
                  </div>
                </div>

                {/* 2. Customs Guide */}
                <div
                  onClick={() => onOpenTool('tool-customs')}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                      Guide des formalités douanières
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Documents et procédures par pays
                    </p>
                  </div>
                </div>

                {/* 3. Experts Directory */}
                <div
                  onClick={() => onOpenTool('tool-directory')}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
                      Annuaire des experts
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Trouvez le bon expert rapidement
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
              <button
                onClick={onOpenCalculator}
                className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Accéder aux simulateurs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Newsletter Subscription Box (Page 4 Middle) */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center lg:text-left">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Restez informé</h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Recevez chaque semaine les dernières actualités, études et opportunités directement dans votre boîte mail.
                </p>
              </div>
            </div>

            <div className="w-full lg:w-auto flex-1 max-w-md">
              {newsletterSubscribed ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Merci ! Vous êtes désormais inscrit à notre veille économique.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Votre adresse e-mail"
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="submit"
                    disabled={newsletterSending}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    {newsletterSending ? 'Inscription...' : "S'abonner"}
                  </button>
                </form>
              )}
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 justify-center lg:justify-start">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Aucun spam. Désabonnement en 1 clic.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Community Dark Blue Banner with continuous bridge panorama (Exact copy of Image 1) */}
        <div className="mt-12 relative bg-[#07152b] rounded-3xl overflow-hidden text-white shadow-2xl border border-blue-900/30">
          {/* Background Map Matrix and Radial Glow */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Right-aligned illuminated bridge image seamlessly blending into the navy background */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[42%] z-0 pointer-events-none overflow-hidden">
            <img
              src={nightBridgeImg}
              alt="Illuminated bridge and city skyline"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-left"
            />
            {/* Smooth gradient blend from solid dark blue to the image */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#07152b] via-[#07152b]/60 to-transparent" />
          </div>

          {/* Banner Inner Content */}
          <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Heading & Call-to-actions (5 cols) */}
              <div className="lg:col-span-4 text-center lg:text-left space-y-5">
                <h3 className="text-2xl sm:text-[28px] font-bold tracking-tight text-white leading-tight">
                  Rejoignez une communauté <br className="hidden sm:inline" />
                  qui bâtit des <span className="text-red-500 font-bold">ponts</span> durables.
                </h3>

                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <button
                    onClick={onJoinCommunity}
                    className="px-5 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs sm:text-sm font-medium rounded-xl transition-all shadow-md shadow-red-500/30 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Rejoindre QIAO</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onViewAll('community')}
                    className="px-4 py-2.5 bg-[#0a1b38]/80 hover:bg-[#0f244a] text-white text-xs sm:text-sm font-normal rounded-xl border border-blue-500/40 hover:border-sky-400 transition-colors cursor-pointer"
                  >
                    Découvrir la communauté
                  </button>
                </div>
              </div>

              {/* Middle 4 Pillars (4 cols) */}
              <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 text-center">
                {/* Pillar 1: Échangez */}
                <div className="flex flex-col items-center group">
                  <div className="w-12 h-12 rounded-full border border-blue-500/40 bg-blue-900/30 flex items-center justify-center text-blue-300 mb-2 shadow-[0_0_12px_rgba(59,130,246,0.2)] group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-white">Échangez</div>
                  <p className="text-[11px] text-slate-300 font-light mt-0.5 leading-snug">
                    avec des professionnels et entrepreneurs
                  </p>
                </div>

                {/* Pillar 2: Collaborez */}
                <div className="flex flex-col items-center group">
                  <div className="w-12 h-12 rounded-full border border-blue-500/40 bg-blue-900/30 flex items-center justify-center text-blue-300 mb-2 shadow-[0_0_12px_rgba(59,130,246,0.2)] group-hover:scale-105 transition-transform">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-white">Collaborez</div>
                  <p className="text-[11px] text-slate-300 font-light mt-0.5 leading-snug">
                    sur des projets concrets et innovants
                  </p>
                </div>

                {/* Pillar 3: Grandissez */}
                <div className="flex flex-col items-center group">
                  <div className="w-12 h-12 rounded-full border border-blue-500/40 bg-blue-900/30 flex items-center justify-center text-blue-300 mb-2 shadow-[0_0_12px_rgba(59,130,246,0.2)] group-hover:scale-105 transition-transform">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-white">Grandissez</div>
                  <p className="text-[11px] text-slate-300 font-light mt-0.5 leading-snug">
                    grâce à un réseau international et solidaire
                  </p>
                </div>

                {/* Pillar 4: Avancez */}
                <div className="flex flex-col items-center group">
                  <div className="w-12 h-12 rounded-full border border-blue-500/40 bg-blue-900/30 flex items-center justify-center text-blue-300 mb-2 shadow-[0_0_12px_rgba(59,130,246,0.2)] group-hover:scale-105 transition-transform">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-white">Avancez</div>
                  <p className="text-[11px] text-slate-300 font-light mt-0.5 leading-snug">
                    avec des solutions fiables et adaptées
                  </p>
                </div>
              </div>

              {/* Far Right 3 cols reserve area for bridge visual on large screens */}
              <div className="hidden lg:block lg:col-span-3"></div>

            </div>
          </div>
        </div>

        {/* Bottom Unified White Card for 5 stats (Exact match to Image 1 Bottom) */}
        <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-0 lg:divide-x lg:divide-slate-100 items-center">
            
            {/* Stat 1: 10,000+ Membres actifs (Blue Users icon) */}
            <div className="flex items-center justify-center gap-3 px-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sky-600 shrink-0">
                <Users className="w-7 h-7 stroke-[1.8]" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">10,000+</div>
                <div className="text-xs text-slate-500 font-light mt-0.5 whitespace-nowrap">Membres actifs</div>
              </div>
            </div>

            {/* Stat 2: 5,000+ Experts & prestataires (Red Building icon) */}
            <div className="flex items-center justify-center gap-3 px-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-red-600 shrink-0">
                <Building2 className="w-7 h-7 stroke-[1.8]" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">5,000+</div>
                <div className="text-xs text-slate-500 font-light mt-0.5 whitespace-nowrap">Experts & prestataires</div>
              </div>
            </div>

            {/* Stat 3: 20+ Pays connectés (Blue Globe icon) */}
            <div className="flex items-center justify-center gap-3 px-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sky-600 shrink-0">
                <Globe className="w-7 h-7 stroke-[1.8]" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">20+</div>
                <div className="text-xs text-slate-500 font-light mt-0.5 whitespace-nowrap">Pays connectés</div>
              </div>
            </div>

            {/* Stat 4: 1,200+ Projets réalisés (Red Briefcase icon) */}
            <div className="flex items-center justify-center gap-3 px-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-red-600 shrink-0">
                <Briefcase className="w-7 h-7 stroke-[1.8]" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">1,200+</div>
                <div className="text-xs text-slate-500 font-light mt-0.5 whitespace-nowrap">Projets réalisés</div>
              </div>
            </div>

            {/* Stat 5: 98% Taux de satisfaction (Blue Star icon) */}
            <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-3 px-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sky-600 shrink-0">
                <Star className="w-7 h-7 stroke-[1.8]" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">98%</div>
                <div className="text-xs text-slate-500 font-light mt-0.5 whitespace-nowrap">Taux de satisfaction</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
