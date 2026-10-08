import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Mail,
  Building2,
  Briefcase,
  Globe,
  TrendingUp,
  ListFilter,
  MessageSquare,
  Paperclip,
  Send,
  Phone,
  MapPin,
  Linkedin,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Shield,
  Users,
  Target,
  X,
  Compass,
  ArrowRight,
  Sparkles,
  Download,
  Copy,
  Check,
  Youtube
} from 'lucide-react';
import { StrategicRegionMap } from './StrategicRegionMap';
import { AppTab } from '../types';
import { Logo } from './Logo';
import shanghaiBanner from '../assets/images/contact_shanghai_greatwall_complete_1791404766592.jpg';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ContactPrefill, useAppActions } from '../context/AppActionsContext';

interface ContactPageProps {
  onNavigate: (tab: AppTab | string) => void;
  onOpenRegister?: () => void;
  prefill?: ContactPrefill | null;
  onPrefillConsumed?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ContactPage: React.FC<ContactPageProps> = ({
  onNavigate,
  onOpenRegister,
  prefill,
  onPrefillConsumed,
}) => {
  const { user } = useAuth();
  const { openLegal } = useAppActions();
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    role: '',
    country: '',
    sector: '',
    subject: '',
    message: '',
    consent: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [wechatModalOpen, setWechatModalOpen] = useState(false);
  const [copiedWeChat, setCopiedWeChat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Identité du membre connecté.
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || user.fullName,
      email: prev.email || user.email,
      company: prev.company || user.company || '',
      role: prev.role || user.title || '',
    }));
  }, [user]);

  // Demande préparée depuis une autre page (devis d'un service, étude de cas, article...).
  useEffect(() => {
    if (!prefill) return;
    setIsSubmitted(false);
    setFormData((prev) => ({
      ...prev,
      subject: prefill.subject ?? prev.subject,
      message: prefill.message ?? prev.message,
      sector: prefill.sector ?? prev.sector,
    }));
    onPrefillConsumed?.();
    setTimeout(() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' }), 150);
  }, [prefill, onPrefillConsumed]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        setSubmitError('Le fichier dépasse 10 MB. Merci de joindre un document plus léger.');
        e.target.value = '';
        return;
      }
      setSubmitError(null);
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.consent) {
      setSubmitError('Veuillez remplir les champs obligatoires et accepter les conditions.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    const body = new FormData();
    body.append('source', 'contact-page');
    body.append('fullName', formData.fullName);
    body.append('email', formData.email);
    body.append('company', formData.company);
    body.append('role', formData.role);
    body.append('country', formData.country);
    body.append('sector', formData.sector);
    body.append('subject', formData.subject);
    body.append('message', formData.message);
    body.append('consent', String(formData.consent));
    if (selectedFile) body.append('attachment', selectedFile);

    try {
      const response = await api.post<{ reference: string }>('/contact', body);
      setReference(response.reference);
      setSubmittedName(formData.fullName);
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      company: user?.company ?? '',
      role: user?.title ?? '',
      country: '',
      sector: '',
      subject: '',
      message: '',
      consent: false,
    });
    setSelectedFile(null);
    setIsSubmitted(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyWeChatId = () => {
    navigator.clipboard.writeText('QIAO_Connect_Official');
    setCopiedWeChat(true);
    setTimeout(() => setCopiedWeChat(false), 2000);
  };

  return (
    <div className="w-full bg-white text-slate-900 font-sans min-h-screen">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: "CONTACTEZ QIAO / Parlons de vos projets" (Matching image.png) */}
      {/* ========================================================================= */}
      <section className="relative bg-slate-50 border-b border-slate-200/80 py-10 sm:py-14 lg:py-16 min-h-[580px] lg:min-h-[640px] flex items-center">
        {/* Top small red accent mark */}
        <div className="w-12 h-1 bg-red-600 mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-20 rounded-b" />

        {/* Complete Background Visual Composite (Shanghai Pudong Skyline + Great Wall with high opacity and visibility) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <img
            src={shanghaiBanner}
            alt="Shanghai Skyline et Grande Muraille de Chine en plein jour"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-[center_top] filter contrast-105 opacity-100"
          />
          {/* Subtle soft gradient with much higher photo visibility/opacity across the banner */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/45 via-45% to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 8 cols: Logo, Eyebrow, Main title, Subtitle, Description, and Trust Badges */}
            <div className="lg:col-span-8 space-y-4 bg-white/85 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-white/80 shadow-md max-w-2xl">
              {/* QIAO Logo */}
              <div className="cursor-pointer inline-block" onClick={() => onNavigate('home')}>
                <Logo size="md" />
              </div>

              {/* Eyebrow */}
              <div className="text-[#133270] font-black text-xs sm:text-sm tracking-wider uppercase">
                CONTACTEZ QIAO
              </div>

              {/* Headings */}
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight text-[#0c2560] leading-none">
                  Parlons de vos projets
                </h1>
                <p className="text-lg sm:text-xl lg:text-[22px] font-bold text-[#143d8a] mt-2">
                  Des connexions réelles. Des opportunités concrètes.
                </p>
              </div>

              {/* Description */}
              <p className="text-slate-600 text-xs sm:text-sm lg:text-[15px] max-w-xl leading-relaxed">
                Notre équipe est à votre écoute pour répondre à vos questions, discuter de vos projets
                et vous accompagner à chaque étape de votre développement entre la Chine et l'Afrique du Nord.
              </p>

              {/* 4 Trust Badges in single horizontal row */}
              <div className="pt-4 flex flex-wrap items-center gap-5 sm:gap-7 text-xs sm:text-sm font-bold text-[#0c2560]">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 text-lg">🤝</span>
                  <span>Une écoute attentive</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Des réponses rapides</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Des experts à votre service</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Vos informations en toute confidentialité</span>
                </div>
              </div>
            </div>

            {/* Right 4 cols: Calligraphy quote & Geographic countries column */}
            <div className="lg:col-span-4 flex flex-col justify-between py-2 sm:py-4 gap-6 sm:gap-8 items-end">
              {/* Handwritten note in sky */}
              <div className="text-center sm:text-right bg-white/85 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/80 shadow-md max-w-xs w-full">
                <p className="font-serif italic text-xl sm:text-2xl text-[#0c2560] font-normal tracking-tight">
                  Plus qu'un contact,
                  <br />
                  <span className="text-red-600 font-semibold">un nouveau départ.</span>
                </p>
                <div className="w-12 h-1 bg-red-600 rounded-full mx-auto sm:ml-auto sm:mr-0 mt-2.5" />
              </div>

              {/* Geographic Column over mountain foreground */}
              <div className="bg-[#0c2560]/85 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 shadow-lg max-w-xs w-full text-right text-xs font-black tracking-wider text-white space-y-1">
                <div className="text-sky-300 text-[11px] font-bold tracking-widest pb-1 border-b border-white/20 uppercase">
                  Réseau Stratégique
                </div>
                <div>CHINE</div>
                <div>TUNISIE</div>
                <div>ALGÉRIE</div>
                <div>MAROC</div>
                <div>ÉGYPTE</div>
                <div>LIBYE</div>
                <div className="pt-2 text-[10px] text-amber-300 uppercase tracking-widest font-black border-t border-white/25">
                  DES OPPORTUNITÉS SANS FRONTIÈRES
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MAIN SECTION: FORM + DIRECT CHANNELS & WECHAT                          */}
      {/* ========================================================================= */}
      <section className="py-12 lg:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* =================================================================== */}
            {/* LEFT: CONTACT FORM (7 cols)                                         */}
            {/* =================================================================== */}
            <div id="contact-form" className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 scroll-mt-28">
              <div className="mb-6">
                <span className="text-red-600 font-bold text-xs uppercase tracking-wider block mb-1">
                  CONTACT
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Envoyez-nous un message
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Remplissez le formulaire ci-dessous et notre équipe vous répondra rapidement.
                </p>
              </div>

              {isSubmitted ? (
                /* Success Feedback State */
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-4 animate-in fade-in duration-300">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-900">Message envoyé avec succès !</h3>
                    <p className="text-emerald-700 text-sm mt-1 max-w-md mx-auto">
                      Merci <span className="font-semibold">{submittedName || 'cher partenaire'}</span>. Notre bureau de Tunis & Shanghai a bien reçu votre demande. Un conseiller vous contactera sous 24h.
                    </p>
                    <p className="text-emerald-800 text-xs mt-2">
                      Référence : <span className="font-mono font-bold">{reference}</span>
                      {selectedFile && <> · pièce jointe « {selectedFile.name} » reçue</>}
                    </p>
                  </div>
                  <button
                    onClick={handleResetForm}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-sm font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                /* Interactive Contact Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Row 1: Nom complet & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nom complet <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Ex : Ahmed Ben Ali"
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Adresse email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Ex : ahmed@entreprise.com"
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Entreprise & Fonction */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Entreprise / Organisation <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          name="company"
                          required
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="Ex : Nom de votre entreprise"
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Fonction
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          placeholder="Ex : Directeur, Fondateur..."
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Pays & Secteur d'activité */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Pays <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <select
                          name="country"
                          required
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none transition-all cursor-pointer"
                        >
                          <option value="">Sélectionnez votre pays</option>
                          <option value="Tunisie">Tunisie 🇹🇳</option>
                          <option value="Chine">Chine 🇨🇳</option>
                          <option value="Algérie">Algérie 🇩🇿</option>
                          <option value="Maroc">Maroc 🇲🇦</option>
                          <option value="Égypte">Égypte 🇪🇬</option>
                          <option value="Libye">Libye 🇱🇾</option>
                          <option value="Autre">Autre région</option>
                        </select>
                        <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400 text-xs">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Secteur d'activité
                      </label>
                      <div className="relative">
                        <TrendingUp className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <select
                          name="sector"
                          value={formData.sector}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none transition-all cursor-pointer"
                        >
                          <option value="">Ex : Import-Export, Industrie, Tech...</option>
                          <option value="Import-Export & Commerce">Import-Export & Commerce</option>
                          <option value="Énergie & Renouvelables">Énergie & Renouvelables</option>
                          <option value="Industrie & Machines">Industrie & Machines</option>
                          <option value="Agroalimentaire & Packaging">Agroalimentaire & Packaging</option>
                          <option value="Technologies, IA & E-commerce">Technologies, IA & E-commerce</option>
                          <option value="Logistique & Fret">Logistique & Fret international</option>
                          <option value="Finance & Investissement">Finance & Investissement</option>
                          <option value="Autre">Autre domaine</option>
                        </select>
                        <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400 text-xs">
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Sujet */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Sujet <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <ListFilter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <select
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none transition-all cursor-pointer"
                      >
                        <option value="">Sélectionnez un sujet</option>
                        <option value="Demande de devis / accompagnement">Demande de devis / accompagnement</option>
                        <option value="Sourcing & audit d'usine en Chine">Sourcing & audit d'usine en Chine</option>
                        <option value="Partenariat commercial & distribution">Partenariat commercial & distribution</option>
                        <option value="Investissement & création de Joint-Venture">Investissement & création de Joint-Venture</option>
                        <option value="Logistique, fret maritime et dédouanement">Logistique, fret maritime et dédouanement</option>
                        <option value="Participation à des salons B2B / Foire de Canton">Participation à des salons B2B / Foire de Canton</option>
                        <option value="Conseil juridique & conformité">Conseil juridique & conformité bilatérale</option>
                        <option value="Autre demande">Autre demande spécifique</option>
                      </select>
                      <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400 text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Message */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Votre message <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <textarea
                        name="message"
                        required
                        rows={4}
                        maxLength={1000}
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Décrivez votre projet, vos questions ou vos besoins... Plus vous êtes précis, plus nous pourrons vous aider."
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-y"
                      />
                    </div>
                    <div className="flex justify-end mt-1 text-[11px] text-slate-400 font-mono">
                      {formData.message.length} / 1000
                    </div>
                  </div>

                  {/* Row 6: File attachment (optional) */}
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-700">
                          Joindre un fichier <span className="text-slate-400 font-normal">(optionnel)</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {selectedFile ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" /> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          ) : (
                            'PDF, PPT, DOC, JPG ou PNG (max 10 MB)'
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                      {selectedFile ? (
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
                        >
                          Supprimer
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
                        >
                          Choisir un fichier
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 7: Consent checkbox */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="consent"
                      name="consent"
                      required
                      checked={formData.consent}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <label htmlFor="consent" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
                      J'accepte d'être contacté par l'équipe QIAO et j'accepte la{' '}
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          openLegal('privacy');
                        }}
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        politique de confidentialité
                      </span>
                      .
                    </label>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700 font-semibold">
                      {submitError}
                    </div>
                  )}

                  {/* Row 8: Submit button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all disabled:opacity-75 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Transmission en cours...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Envoyer le message</span>
                          <span className="text-lg leading-none">➔</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* =================================================================== */}
            {/* RIGHT: WECHAT & DIRECT CHANNELS (5 cols)                            */}
            {/* =================================================================== */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Card 1: WeChat Direct Connect */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {/* Left info */}
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#07C160] text-white flex items-center justify-center shadow-md">
                        <MessageCircle className="w-6 h-6 fill-white" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold">
                          Contactez-nous sur
                        </div>
                        <div className="text-xl font-black text-slate-900 leading-tight">
                          WeChat
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Discutez directement avec notre équipe sur WeChat pour une réponse rapide.
                    </p>

                    <button
                      onClick={() => setWechatModalOpen(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#07C160] hover:bg-[#06af56] text-white text-xs font-bold shadow transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Ouvrir sur WeChat</span>
                    </button>
                  </div>

                  {/* QR Code Container */}
                  <div className="w-32 bg-white p-2.5 rounded-xl border border-emerald-200 shadow-sm text-center shrink-0">
                    <div className="w-full aspect-square bg-white flex items-center justify-center p-1 rounded-lg border border-slate-100">
                      {/* Realistic SVG WeChat QR Code representation */}
                      <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                        {/* Corner 1 */}
                        <rect x="0" y="0" width="30" height="30" fill="currentColor" rx="2" />
                        <rect x="5" y="5" width="20" height="20" fill="white" rx="1" />
                        <rect x="10" y="10" width="10" height="10" fill="currentColor" rx="1" />
                        
                        {/* Corner 2 */}
                        <rect x="70" y="0" width="30" height="30" fill="currentColor" rx="2" />
                        <rect x="75" y="5" width="20" height="20" fill="white" rx="1" />
                        <rect x="80" y="10" width="10" height="10" fill="currentColor" rx="1" />

                        {/* Corner 3 */}
                        <rect x="0" y="70" width="30" height="30" fill="currentColor" rx="2" />
                        <rect x="5" y="75" width="20" height="20" fill="white" rx="1" />
                        <rect x="10" y="80" width="10" height="10" fill="currentColor" rx="1" />

                        {/* Matrix Grid Data Points */}
                        <rect x="35" y="5" width="5" height="10" fill="currentColor" />
                        <rect x="45" y="0" width="5" height="15" fill="currentColor" />
                        <rect x="55" y="10" width="10" height="5" fill="currentColor" />
                        <rect x="35" y="25" width="15" height="5" fill="currentColor" />
                        <rect x="55" y="20" width="5" height="10" fill="currentColor" />

                        {/* Center Icon circle */}
                        <circle cx="50" cy="50" r="14" fill="#07C160" />
                        {/* WeChat 2 bubbles */}
                        <circle cx="46" cy="48" r="5" fill="white" />
                        <circle cx="53" cy="53" r="4" fill="white" />
                        <circle cx="45" cy="47" r="1" fill="#07C160" />
                        <circle cx="48" cy="47" r="1" fill="#07C160" />
                        <circle cx="52" cy="52.5" r="0.8" fill="#07C160" />
                        <circle cx="54.5" cy="52.5" r="0.8" fill="#07C160" />

                        {/* Bottom & side data blocks */}
                        <rect x="35" y="65" width="10" height="5" fill="currentColor" />
                        <rect x="50" y="70" width="15" height="5" fill="currentColor" />
                        <rect x="70" y="35" width="5" height="25" fill="currentColor" />
                        <rect x="80" y="45" width="15" height="5" fill="currentColor" />
                        <rect x="85" y="60" width="10" height="15" fill="currentColor" />
                        <rect x="70" y="80" width="15" height="15" fill="currentColor" />
                        <rect x="40" y="85" width="20" height="5" fill="currentColor" />
                      </svg>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium mt-1 leading-tight">
                      Scannez le QR code avec votre application WeChat
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Autres moyens de contact */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Autres moyens de contact
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Choisissez le canal qui vous convient le mieux.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Email */}
                  <a
                    href="mailto:contact@qiao-platform.com"
                    className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Email</div>
                      <div className="text-sm font-bold text-blue-600 group-hover:underline">
                        contact@qiao-platform.com
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Nous répondons sous 24 heures.
                      </div>
                    </div>
                  </a>

                  {/* Téléphone */}
                  <a
                    href="tel:+21671123456"
                    className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Téléphone</div>
                      <div className="text-sm font-bold text-slate-800">
                        +216 71 123 456
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Lundi - Vendredi, 9h00 - 18h00 (GMT+1)
                      </div>
                    </div>
                  </a>

                  {/* Siège social */}
                  <div className="flex items-start gap-3.5 p-3 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Siège social</div>
                      <div className="text-sm font-bold text-slate-800">
                        Immeuble International City Center
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Avenue de la Bourse, Les Berges du Lac, 1053 Tunis, Tunisie
                      </div>
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Linkedin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500">LinkedIn</div>
                      <div className="text-xs font-medium text-slate-700 mt-0.5">
                        Suivez notre actualité et connectez avec notre équipe.
                      </div>
                    </div>
                  </a>

                  {/* WhatsApp Business */}
                  <a
                    href="https://wa.me/21671123456"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-emerald-50/50 transition-colors group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500">WhatsApp Business</div>
                      <div className="text-sm font-bold text-emerald-700">
                        +216 71 123 456
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Échangez directement avec nous.
                      </div>
                    </div>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION: "NOS BUREAUX" & "UNE PRÉSENCE DANS UNE RÉGION STRATÉGIQUE"     */}
      {/* ========================================================================= */}
      <section className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 8 cols: 3 Office Cards */}
            <div className="lg:col-span-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Nos bureaux
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Une présence locale pour être plus proches de nos partenaires.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-6">
                {/* Office 1: Tunis */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="h-32 w-full overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80"
                      alt="Tunis Headquarters"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
                      🇹🇳 Tunis
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                        <span className="text-red-600">🇹🇳</span>
                        <span>Tunis (Siège social)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Immeuble International City Center
                        <br />
                        Avenue de la Bourse, Les Berges du Lac
                        <br />
                        1053 Tunis, Tunisie
                      </p>
                    </div>
                    <a
                      href="https://maps.google.com/?q=Les+Berges+du+Lac+Tunis"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span>Voir sur Google Maps</span>
                      <span>➔</span>
                    </a>
                  </div>
                </div>

                {/* Office 2: Shanghai */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="h-32 w-full overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=600&q=80"
                      alt="Shanghai Office"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
                      🇨🇳 Shanghai
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                        <span className="text-red-600">🇨🇳</span>
                        <span>Shanghai (Bureau Asie)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Shanghai Tower, 100 Century Avenue
                        <br />
                        Pudong, Shanghai 200120, Chine
                      </p>
                    </div>
                    <a
                      href="https://maps.google.com/?q=Shanghai+Tower+Pudong"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span>Voir sur Google Maps</span>
                      <span>➔</span>
                    </a>
                  </div>
                </div>

                {/* Office 3: Casablanca */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="h-32 w-full overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=600&q=80"
                      alt="Casablanca Office"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
                      🇲🇦 Casablanca
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                        <span className="text-red-600">🇲🇦</span>
                        <span>Casablanca (Bureau Afrique du Nord)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Tour CFC, 100 Boulevard Sidi Mohamed Ben Abdellah
                        <br />
                        Casablanca, Maroc
                      </p>
                    </div>
                    <a
                      href="https://maps.google.com/?q=Casablanca+Finance+City+Tour+CFC"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span>Voir sur Google Maps</span>
                      <span>➔</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 cols: "Une présence dans une région stratégique" Map Graphic */}
            <div className="lg:col-span-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Une présence dans une région stratégique
                </h3>
              </div>

              {/* Strategic Region Real Map */}
              <StrategicRegionMap />
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BANNER: "Prêt à construire de nouvelles opportunités ?"                */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#021330] via-[#061b40] to-[#041535] text-white py-14">
        {/* City skyline background overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1920&q=80"
            alt="Skyline night"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 8 cols: CTA Text & Buttons */}
            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
                Prêt à construire de nouvelles opportunités ?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                Rejoignez la communauté QIAO et faites partie du pont entre la Chine et l'Afrique du Nord.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onOpenRegister}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg hover:shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Créer un compte</span>
                  <span>➔</span>
                </button>
                <button
                  onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/25 text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  Nous contacter
                </button>
              </div>
            </div>

            {/* Right 4 cols: 4 Value Pillars */}
            <div className="lg:col-span-4 space-y-3.5 border-t lg:border-t-0 lg:border-l border-white/15 pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                <Globe className="w-5 h-5 text-sky-400 shrink-0" />
                <span>Des opportunités réelles</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                <Compass className="w-5 h-5 text-sky-400 shrink-0" />
                <span>Un réseau international</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                <Target className="w-5 h-5 text-sky-400 shrink-0" />
                <span>Un accompagnement expert</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                <TrendingUp className="w-5 h-5 text-sky-400 shrink-0" />
                <span>Un impact durable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FOOTER: OFFICIAL INSTITUTIONAL FOOTER (Matching contact.png)           */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            {/* Logo */}
            <div className="cursor-pointer" onClick={() => onNavigate('home')}>
              <Logo size="md" />
            </div>

            {/* Main Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-600 font-medium">
              <button onClick={() => onNavigate('home')} className="hover:text-red-600 transition-colors">
                Accueil
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('about')} className="hover:text-red-600 transition-colors">
                À propos
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('secteurs')} className="hover:text-red-600 transition-colors">
                Secteurs
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('partners')} className="hover:text-red-600 transition-colors">
                Pays
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('commerce-hub')} className="hover:text-red-600 transition-colors">
                Opportunités
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('intelligence')} className="hover:text-red-600 transition-colors">
                Analyses
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('stories')} className="hover:text-red-600 transition-colors">
                Événements
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('resources')} className="hover:text-red-600 transition-colors">
                Ressources
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('contact')} className="text-red-600 font-bold">
                Contact
              </button>
            </nav>

            {/* Socials & Lang */}
            <div className="flex items-center gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 flex items-center justify-center transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors font-bold text-xs"
              >
                𝕏
              </a>

              <div className="pl-2 border-l border-slate-200">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  FR ⌵
                </span>
              </div>
            </div>
          </div>

          {/* Sublinks & Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <button onClick={() => openLegal('privacy')} className="hover:text-slate-600 transition-colors cursor-pointer">Confidentialité</button>
              <span>|</span>
              <button onClick={() => openLegal('terms')} className="hover:text-slate-600 transition-colors cursor-pointer">Conditions d'utilisation</button>
              <span>|</span>
              <button onClick={() => openLegal('legal')} className="hover:text-slate-600 transition-colors cursor-pointer">Mentions légales</button>
            </div>
            <div>© {new Date().getFullYear()} QIAO. Tous droits réservés.</div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 6. WECHAT MODAL                                                           */}
      {/* ========================================================================= */}
      {wechatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setWechatModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-full bg-[#07C160] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <MessageCircle className="w-8 h-8 fill-white" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">
              Scannez pour rejoindre sur WeChat
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Ouvrez WeChat &gt; Découvrir &gt; Scanner pour échanger avec notre conseiller dédié.
            </p>

            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-2 border-emerald-300 shadow-md flex items-center justify-center mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                <rect x="0" y="0" width="30" height="30" fill="currentColor" rx="2" />
                <rect x="5" y="5" width="20" height="20" fill="white" rx="1" />
                <rect x="10" y="10" width="10" height="10" fill="currentColor" rx="1" />
                <rect x="70" y="0" width="30" height="30" fill="currentColor" rx="2" />
                <rect x="75" y="5" width="20" height="20" fill="white" rx="1" />
                <rect x="80" y="10" width="10" height="10" fill="currentColor" rx="1" />
                <rect x="0" y="70" width="30" height="30" fill="currentColor" rx="2" />
                <rect x="5" y="75" width="20" height="20" fill="white" rx="1" />
                <rect x="10" y="80" width="10" height="10" fill="currentColor" rx="1" />
                <circle cx="50" cy="50" r="14" fill="#07C160" />
                <circle cx="46" cy="48" r="5" fill="white" />
                <circle cx="53" cy="53" r="4" fill="white" />
                <rect x="35" y="5" width="5" height="10" fill="currentColor" />
                <rect x="45" y="0" width="5" height="15" fill="currentColor" />
                <rect x="55" y="10" width="10" height="5" fill="currentColor" />
                <rect x="35" y="25" width="15" height="5" fill="currentColor" />
                <rect x="55" y="20" width="5" height="10" fill="currentColor" />
                <rect x="35" y="65" width="10" height="5" fill="currentColor" />
                <rect x="50" y="70" width="15" height="5" fill="currentColor" />
                <rect x="70" y="35" width="5" height="25" fill="currentColor" />
                <rect x="80" y="45" width="15" height="5" fill="currentColor" />
                <rect x="85" y="60" width="10" height="15" fill="currentColor" />
                <rect x="70" y="80" width="15" height="15" fill="currentColor" />
                <rect x="40" y="85" width="20" height="5" fill="currentColor" />
              </svg>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-700 font-bold">ID : QIAO_Connect_Official</span>
              <button
                onClick={copyWeChatId}
                className="text-emerald-700 font-semibold flex items-center gap-1 hover:text-emerald-800"
              >
                {copiedWeChat ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier ID</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
