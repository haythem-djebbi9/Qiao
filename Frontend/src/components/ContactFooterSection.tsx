import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  Target,
  Handshake,
  Send,
  Lock,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Facebook,
  Twitter,
  Globe,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  User,
  Building2,
  ChevronDown,
  Shield,
  Youtube,
} from 'lucide-react';
import { Logo } from './Logo';
import { FlagIcon } from './common/FlagIcon';
import contactDayBridgeImg from '../assets/images/contact_day_bridge_1787502156332.jpg';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useAppActions } from '../context/AppActionsContext';
import { AppTab } from '../types';

interface ContactFooterSectionProps {
  onSelectTab?: (tab: AppTab) => void;
  onScrollToSection?: (sectionId: string) => void;
  showOnlyFooter?: boolean;
}

export const ContactFooterSection: React.FC<ContactFooterSectionProps> = ({
  onSelectTab,
  onScrollToSection,
  showOnlyFooter = false,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    domain: '',
    message: '',
    consent: false,
  });

  const { user } = useAuth();
  const { openLegal } = useAppActions();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Préremplit l'identité du membre connecté.
  React.useEffect(() => {
    if (user) {
      setFormData((current) => ({
        ...current,
        fullName: current.fullName || user.fullName,
        email: current.email || user.email,
        company: current.company || user.company || '',
      }));
    }
  }, [user]);

  const DOMAIN_LABELS: Record<string, string> = {
    business: "Création d'entreprise & Implantation",
    sourcing: "Sourcing industriel & Audit d'usines",
    logistique: 'Logistique internationale & Douane',
    juridique: 'Conseil juridique & Conformité',
    traduction: 'Traduction & Interprétation',
    recrutement: 'Recrutement & RH',
    academy: 'Formations QIAO Academy',
    autre: 'Autre projet bilatéral',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await api.post<{ reference: string }>('/contact', {
        source: 'home',
        fullName: formData.fullName,
        email: formData.email,
        company: formData.company || undefined,
        phone: formData.phone || undefined,
        sector: formData.domain ? DOMAIN_LABELS[formData.domain] : undefined,
        subject: formData.domain ? `Demande de devis — ${DOMAIN_LABELS[formData.domain]}` : 'Demande de devis',
        message: formData.message,
        consent: formData.consent,
      });
      setReference(response.reference);
      setSubmittedName(formData.fullName);
      setFormSubmitted(true);
      setFormData({
        fullName: user?.fullName ?? '',
        company: user?.company ?? '',
        email: user?.email ?? '',
        phone: '',
        domain: '',
        message: '',
        consent: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollTo = (sectionId: string) => {
    if (onScrollToSection) {
      onScrollToSection(sectionId);
      return;
    }
    if (onSelectTab) {
      onSelectTab(sectionId as AppTab);
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="contact" className={`bg-[#07152b] text-white relative overflow-hidden ${showOnlyFooter ? 'pt-8' : 'pt-16 sm:pt-20'}`}>
      
      {/* Decorative Bridge Line Watermark in Background on Bottom Right (Matches User Picture) */}
      <div className="absolute right-0 bottom-0 w-[580px] h-[340px] pointer-events-none opacity-20 hidden md:block overflow-hidden">
        <svg viewBox="0 0 700 400" fill="none" className="w-full h-full text-sky-400 stroke-current">
          {/* Main Tower 1 */}
          <path d="M 460 30 L 440 380 M 460 30 L 480 380" strokeWidth="2.5" />
          <path d="M 445 120 L 475 120 M 442 200 L 478 200 M 440 280 L 480 280" strokeWidth="1.5" />
          
          {/* Main Tower 2 */}
          <path d="M 620 60 L 605 380 M 620 60 L 635 380" strokeWidth="2" />
          
          {/* Roadway Deck */}
          <path d="M 0 320 Q 350 310, 700 270" strokeWidth="4" />
          <path d="M 0 330 Q 350 320, 700 280" strokeWidth="2" />
          
          {/* Main Stay Cables from Tower 1 */}
          <line x1="460" y1="50" x2="180" y2="320" strokeWidth="1" />
          <line x1="460" y1="70" x2="220" y2="320" strokeWidth="1" />
          <line x1="460" y1="90" x2="260" y2="320" strokeWidth="1" />
          <line x1="460" y1="110" x2="300" y2="320" strokeWidth="1" />
          <line x1="460" y1="130" x2="340" y2="320" strokeWidth="1" />
          <line x1="460" y1="150" x2="380" y2="320" strokeWidth="1" />
          <line x1="460" y1="170" x2="410" y2="320" strokeWidth="1" />
          
          <line x1="460" y1="50" x2="600" y2="285" strokeWidth="1" />
          <line x1="460" y1="70" x2="570" y2="290" strokeWidth="1" />
          <line x1="460" y1="90" x2="540" y2="295" strokeWidth="1" />
          <line x1="460" y1="110" x2="510" y2="305" strokeWidth="1" />
          
          {/* Pier foundation */}
          <path d="M 420 380 L 500 380 L 490 400 L 430 400 Z" fill="currentColor" fillOpacity="0.3" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Contact Us Section Header & Form (Only when NOT showOnlyFooter) */}
        {!showOnlyFooter && (
          <>
            <div className="bg-white text-slate-900 rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 lg:p-12 shadow-2xl border border-slate-200/90 mb-16 relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column (5 cols): Headline, bridge image, badges */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6">
              <div>
                {/* Top Badge: — CONTACTEZ QIAO — */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-[2px] bg-red-600 rounded-full" />
                  <span className="text-xs font-semibold text-slate-900 tracking-wider uppercase">
                    CONTACTEZ QIAO
                  </span>
                  <span className="w-6 h-[2px] bg-blue-600 rounded-full" />
                </div>

                {/* Main Headline */}
                <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 leading-[1.15]">
                  Prêt à construire <br />
                  des ponts vers <br />
                  <span className="text-red-600">de nouveaux <br />succès ?</span>
                </h2>

                {/* Subtitle */}
                <p className="mt-4 text-xs sm:text-sm text-slate-600 font-light leading-relaxed max-w-md">
                  Notre équipe est prête à vous accompagner. Discutons de votre projet et trouvons ensemble les meilleures solutions.
                </p>
              </div>

              {/* Cable-stayed daytime suspension bridge photo */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-48 sm:h-56 my-2 group">
                <img
                  src={contactDayBridgeImg}
                  alt="Modern cable-stayed bridge spanning water"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-3.5">
                  <div className="text-[11px] font-medium text-white/95 backdrop-blur-xs bg-slate-950/40 px-2.5 py-1 rounded-md">
                    🌉 Reliant la Chine et le Maghreb par le commerce et le savoir
                  </div>
                </div>
              </div>

              {/* 4 Circular Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {/* Badge 1: Réponse rapide */}
                <div className="flex flex-col items-center text-center group">
                  <div className="w-11 h-11 rounded-full border border-red-100 bg-red-50 flex items-center justify-center text-red-600 mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">Réponse rapide</div>
                  <div className="text-[10px] text-slate-500 font-light mt-0.5">Sous 24h</div>
                </div>

                {/* Badge 2: Confidentialité */}
                <div className="flex flex-col items-center text-center group">
                  <div className="w-11 h-11 rounded-full border border-red-100 bg-red-50 flex items-center justify-center text-red-600 mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">Confidentialité</div>
                  <div className="text-[10px] text-slate-500 font-light mt-0.5">Garantie</div>
                </div>

                {/* Badge 3: Solutions sur-mesure */}
                <div className="flex flex-col items-center text-center group">
                  <div className="w-11 h-11 rounded-full border border-red-100 bg-red-50 flex items-center justify-center text-red-600 mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">Sur-mesure</div>
                  <div className="text-[10px] text-slate-500 font-light mt-0.5">100% Adapté</div>
                </div>

                {/* Badge 4: Accompagnement expert */}
                <div className="flex flex-col items-center text-center group">
                  <div className="w-11 h-11 rounded-full border border-red-100 bg-red-50 flex items-center justify-center text-red-600 mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    <Handshake className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">Expert dédié</div>
                  <div className="text-[10px] text-slate-500 font-light mt-0.5">Biculturel</div>
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): Contact Form */}
            <div className="lg:col-span-7 bg-slate-50/70 p-6 sm:p-8 rounded-2xl border border-slate-200/80">
              {formSubmitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Demande reçue avec succès !</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto font-light leading-relaxed">
                    Merci {submittedName}. Notre conseiller expert pour votre secteur vous contactera par email sous <strong>24 heures ouvrées</strong> pour étudier votre projet.
                  </p>
                  <p className="text-xs text-slate-500">
                    Référence de votre demande : <strong className="font-mono text-slate-800">{reference}</strong>
                  </p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    Envoyer une autre demande
                  </button>
                  <div className="pt-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                      <ShieldCheck className="w-4 h-4" /> Vos données sont protégées & traitées en toute confidentialité
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nom Complet */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nom complet <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Ex: Mohamed Ben Salem"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300/80 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                    </div>

                    {/* Entreprise */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Entreprise / Organisation
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Ex: Société Industrielle S.A."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300/80 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Adresse e-mail <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nom@entreprise.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300/80 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                    </div>

                    {/* Téléphone */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Numéro de téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+216 ... / +86 ..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300/80 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Domaine de votre projet */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Domaine d'intérêt principal
                    </label>
                    <select
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300/80 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer"
                    >
                      <option value="">Sélectionnez un service...</option>
                      <option value="business">Création d'entreprise & Implantation (WFOE / JV)</option>
                      <option value="sourcing">Sourcing industriel & Audit d'usines en Chine</option>
                      <option value="logistique">Logistique internationale, Fret maritime & Douane</option>
                      <option value="juridique">Conseil juridique, Contrats bilingues & Conformité</option>
                      <option value="traduction">Traduction assermentée & Interprétation technique</option>
                      <option value="recrutement">Recrutement de talents & Gestion RH biculturelle</option>
                      <option value="academy">Formations QIAO Academy & Certifications</option>
                      <option value="autre">Autre projet bilatéral sur-mesure</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Décrivez brièvement votre projet <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Précisez votre secteur, les pays cibles (Chine, Tunisie, Algérie, Maroc...), vos délais et objectifs..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300/80 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                    />
                  </div>

                  {/* Consent checkbox */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="consent"
                      required
                      checked={formData.consent}
                      onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <label htmlFor="consent" className="text-xs text-slate-500 font-light cursor-pointer select-none leading-tight">
                      J'accepte que mes données soient traitées par QIAO pour me recontacter dans le cadre de ma demande. Aucune transmission à des tiers.
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 px-6 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-98 disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Envoi en cours...' : 'Envoyer ma demande de devis'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>

        {/* Global Offices Presence */}
        <div className="border-t border-slate-800/80 pt-10 pb-12">
          <div className="text-center mb-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Présence internationale & Bureaux régionaux
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Des équipes locales biculturelles à votre service en Chine et au Maghreb
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Shanghai */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-red-500/40 transition-colors">
              <div className="flex items-center gap-2 font-bold text-white text-sm mb-1.5">
                <FlagIcon country="CN" size="sm" /> <span>Shanghai, Chine</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Pudong Lujiazui Financial Center, Tower 2, Level 28
              </p>
              <div className="mt-2 text-slate-400 font-mono text-[10px]">
                +86 21 8039 4500
              </div>
            </div>

            {/* Tunis */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-red-500/40 transition-colors">
              <div className="flex items-center gap-2 font-bold text-white text-sm mb-1.5">
                <FlagIcon country="TN" size="sm" /> <span>Tunis, Tunisie</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Les Berges du Lac 2, Immeuble QIAO Bridge, 4ème étage
              </p>
              <div className="mt-2 text-slate-400 font-mono text-[10px]">
                +216 70 123 456
              </div>
            </div>

            {/* Alger */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-red-500/40 transition-colors">
              <div className="flex items-center gap-2 font-bold text-white text-sm mb-1.5">
                <FlagIcon country="DZ" size="sm" /> <span>Alger, Algérie</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Quartier d'Affaires Bab Ezzouar, Bâtiment C, 5ème étage
              </p>
              <div className="mt-2 text-slate-400 font-mono text-[10px]">
                +213 23 92 10 40
              </div>
            </div>

            {/* Casablanca */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-red-500/40 transition-colors">
              <div className="flex items-center gap-2 font-bold text-white text-sm mb-1.5">
                <FlagIcon country="MA" size="sm" /> <span>Casablanca, Maroc</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Casablanca Finance City, Tour CFC, 12ème étage
              </p>
              <div className="mt-2 text-slate-400 font-mono text-[10px]">
                +212 522 98 70 00
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 5-COLUMN DETAILED FOOTER (EXACT MATCH TO THE UPLOADED PICTURE)             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 py-12 border-t border-slate-800/80 text-xs text-slate-300">
          
          {/* Column 1: Logo & Mission Statement (4 cols) */}
          <div className="lg:col-span-4 space-y-4 pr-2">
            <div onClick={() => scrollTo('hero')} className="cursor-pointer inline-block">
              <Logo variant="dark" size="md" />
            </div>
            <p className="text-xs text-slate-300/90 leading-relaxed max-w-sm">
              QIAO connecte les entreprises, les institutions et les experts entre la Chine et l'Afrique du Nord pour créer des opportunités durables et des réussites partagées.
            </p>
          </div>

          {/* Column 2: Liens rapides (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white">Liens rapides</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button onClick={() => scrollTo('about')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <span className="text-slate-500">&gt;</span> <span>À propos de QIAO</span>
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('services')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <span className="text-slate-500">&gt;</span> <span>Nos services</span>
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('partners')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <span className="text-slate-500">&gt;</span> <span>Réseau de partenaires</span>
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('intelligence')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <span className="text-slate-500">&gt;</span> <span>Actualités</span>
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('contact')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <span className="text-slate-500">&gt;</span> <span>Contact</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Nos domaines d'expertise (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white">Nos domaines d'expertise</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button onClick={() => scrollTo('commerce-hub')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left">
                  <span className="text-slate-500">&gt;</span> <span>Commerce & Investissement</span>
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('services')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left">
                  <span className="text-slate-500">&gt;</span> <span>Finance & Banque</span>
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('construction')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left">
                  <span className="text-slate-500">&gt;</span> <span>Projets & Infrastructures</span>
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('flux-commerciaux')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left">
                  <span className="text-slate-500">&gt;</span> <span>Import / Export</span>
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('services')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left">
                  <span className="text-slate-500">&gt;</span> <span>Conseil stratégique</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contactez-nous with vertical line divider (2 cols) */}
          <div className="lg:col-span-2 space-y-3 lg:border-l lg:border-slate-800/80 lg:pl-6">
            <h4 className="text-sm font-bold text-white">Contactez-nous</h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Tunis, Tunisie<br />
                  <span className="text-[11px] text-slate-400">Présence en Chine et en Afrique du Nord</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-white shrink-0" />
                <a href="mailto:contact@qiao.tn" className="hover:text-white transition-colors">
                  contact@qiao.tn
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-white shrink-0" />
                <a href="tel:+21670123456" className="hover:text-white transition-colors">
                  +216 70 123 456
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
                <Clock className="w-4 h-4 text-white shrink-0" />
                <span>Lun - Ven : 9h00 - 18h00 (GMT+1)</span>
              </div>
            </div>
          </div>

          {/* Column 5: Suivez-nous with vertical line divider (2 cols) */}
          <div className="lg:col-span-2 space-y-3 lg:border-l lg:border-slate-800/80 lg:pl-6">
            <h4 className="text-sm font-bold text-white">Suivez-nous</h4>
            <div className="flex items-center gap-2.5 pt-1">
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-slate-500/80 hover:border-white hover:bg-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-slate-500/80 hover:border-white hover:bg-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-slate-500/80 hover:border-white hover:bg-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="YouTube"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>

              {/* X / Twitter */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-slate-500/80 hover:border-white hover:bg-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="X"
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Sub-footer bottom bar (Exact match to screenshot) */}
        <div className="py-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center text-xs text-slate-400 gap-4 sm:gap-6 text-center">
          <div>
            © {new Date().getFullYear()} QIAO. Tous droits réservés.
          </div>
          <div className="hidden sm:inline text-slate-600">|</div>
          <div>
            <button onClick={() => openLegal('legal')} className="hover:text-slate-200 transition-colors cursor-pointer">
              Mentions légales
            </button>
          </div>
          <div className="hidden sm:inline text-slate-600">|</div>
          <div>
            <button onClick={() => openLegal('privacy')} className="hover:text-slate-200 transition-colors cursor-pointer">
              Politique de confidentialité
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
