import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAppActions } from '../../../context/AppActionsContext';
import {
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  ShieldCheck,
  Scale,
  Clock,
  ArrowRight,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
  Globe,
  Layers,
  X,
  FileCheck,
  Info,
  Building2,
  TrendingUp
} from 'lucide-react';
import { CommerceHubTab } from '../../../types';
import { FlagIcon } from '../../common/FlagIcon';

/** Résultat de /regulations/hs-codes. */
interface HsCodeResult {
  code: string;
  label: string;
  category: string;
  duties: Record<string, number>;
  requirements: string | null;
}

/** Fiche de /regulations/profiles/:key. */
interface RegulationProfile {
  id: string;
  name: string;
  kind: 'country' | 'agreement';
  summary: string;
  requirements: string[];
  documents: string[];
  agencies: string[];
  clearanceTime: string | null;
  guideDocumentId: string | null;
}

const DUTY_COUNTRIES: [string, string][] = [
  ['maroc', 'Maroc'],
  ['algerie', 'Algérie'],
  ['tunisie', 'Tunisie'],
  ['egypte', 'Égypte'],
  ['libye', 'Libye'],
];

interface ReglementationTabProps {
  onSelectTab: (tab: CommerceHubTab) => void;
  onOpenConsultation?: () => void;
  onOpenDocDetail?: (title: string) => void;
}

export const ReglementationTab: React.FC<ReglementationTabProps> = ({
  onSelectTab,
  onOpenConsultation,
  onOpenDocDetail,
}) => {
  const [selectedCountry, setSelectedCountry] = useState('Tous les pays');
  const [searchQuery, setSearchQuery] = useState('');
  const [hsSearchInput, setHsSearchInput] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [hsResults, setHsResults] = useState<HsCodeResult[] | null>(null);
  const [hsLoading, setHsLoading] = useState(false);
  const [profile, setProfile] = useState<RegulationProfile | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const { openDocument, navigate } = useAppActions();
  const [selectedCountryModal, setSelectedCountryModal] = useState<string | null>(null);

  // 5 KPI metrics matching screenshot
  const metrics = [
    {
      value: '120+',
      label: 'Réglementations clés',
      change: '+15% vs 2023',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      value: '75',
      label: 'Normes et certifications',
      change: '+18% vs 2023',
      icon: ShieldCheck,
      color: 'text-emerald-600',
    },
    {
      value: '12',
      label: 'Accords commerciaux',
      change: '+0% vs 2023',
      icon: Scale,
      color: 'text-indigo-600',
    },
    {
      value: '8',
      label: 'Guides par pays',
      change: '+33% vs 2023',
      icon: BookOpen,
      color: 'text-purple-600',
    },
    {
      value: '1 200+',
      label: 'Questions fréquentes',
      change: '+40% vs 2023',
      icon: HelpCircle,
      color: 'text-amber-600',
    },
  ];

  // 6 countries data with authentic FlagIcon
  const countryRegulations = [
    {
      id: 'chine',
      name: 'Chine',
      code: 'CN',
      items: [
        "Réglementations d'import",
        'Normes produits GB',
        'Procédures douanières GACC',
      ],
      desc: 'Accréditations CCC, douanes GACC et normes nationales GB pour accéder au marché chinois.',
    },
    {
      id: 'maroc',
      name: 'Maroc',
      code: 'MA',
      items: [
        "Réglementations d'import",
        'Normes NM & certifications',
        'Taxes et droits de douane',
      ],
      desc: 'Guichet unique PortNet, label NM et conformité Ministère de l’Industrie.',
    },
    {
      id: 'algerie',
      name: 'Algérie',
      code: 'DZ',
      items: [
        "Réglementations d'import",
        'Normes & conformité IANOR',
        'Règles bancaires d’importation',
      ],
      desc: 'Règles bancaires d’importation, conformité IANOR et certificats d’origine.',
    },
    {
      id: 'tunisie',
      name: 'Tunisie',
      code: 'TN',
      items: [
        "Réglementations d'import",
        'Contrôle technique INNORPI',
        'Procédures TTN TradeNet',
      ],
      desc: 'Plateforme TTN TradeNet, contrôle technique INNORPI et régimes suspensifs.',
    },
    {
      id: 'egypte',
      name: 'Égypte',
      code: 'EG',
      items: [
        "Système pré-douanier Nafeza",
        'Enregistrement GOEIC',
        'Contrôle de conformité',
      ],
      desc: 'Système pré-douanier Nafeza (ACI), contrôle GOEIC et certification d’enregistrement.',
    },
    {
      id: 'libye',
      name: 'Libye',
      code: 'LY',
      items: [
        "Réglementations d'importation",
        'Inspection avant expédition',
        'Procédures Tripoli & Misrata',
      ],
      desc: 'Accréditations d’importation, lettres de crédit documentaires et inspection de conformité pour Tripoli, Misrata et Benghazi.',
    },
  ];

  // 5 trade agreements
  const tradeAgreements = [
    {
      title: 'Forum sur la coopération sino-africaine (FOCAC)',
      subtitle: 'Cadre général de coopération',
      icon: Globe,
    },
    {
      title: 'Accord de libre-échange Chine – Maroc',
      subtitle: 'Avantages tarifaires et secteurs concernés',
      icon: Scale,
    },
    {
      title: 'Accord de libre-échange Chine – Tunisie',
      subtitle: 'Produits éligibles et procédures',
      icon: FileCheck,
    },
    {
      title: 'Zone de libre-échange continentale africaine (ZLECAf)',
      subtitle: 'Opportunités pour les exportateurs chinois',
      icon: Layers,
    },
    {
      title: 'Autres accords bilatéraux et régionaux',
      subtitle: 'Liens et documents officiels',
      icon: ExternalLink,
    },
  ];

  // Customs tariffs table data
  const tariffsData = [
    { name: 'Smartphones (8517)', code: '8517', ma: '0%', dz: '5%', tn: '5%', eg: '10%' },
    { name: 'Véhicules (8703)', code: '8703', ma: '10%', dz: '10%', tn: '10%', eg: '20%' },
    { name: 'Panneaux solaires (8541)', code: '8541', ma: '0%', dz: '0%', tn: '0%', eg: '5%' },
    { name: 'Huile d’olive (1509)', code: '1509', ma: '5%', dz: '0%', tn: '0%', eg: '5%' },
    { name: 'Textiles (6205)', code: '6205', ma: '12%', dz: '15%', tn: '10%', eg: '20%' },
  ];

  // 5 Downloadable resources
  const documentResources = [
    { title: "Guide d'importation en Algérie", format: 'PDF - 2,4 MB' },
    { title: 'Procédures douanières au Maroc', format: 'PDF - 1,8 MB' },
    { title: 'Normes de sécurité des produits en Chine', format: 'PDF - 3,1 MB' },
    { title: 'Réglementation e-commerce en Tunisie', format: 'PDF - 1,2 MB' },
    { title: 'Accords commerciaux Chine – Afrique', format: 'PDF - 2,6 MB' },
  ];

  // 6 Steps of Import/Export
  const importExportSteps = [
    { num: 1, title: 'Identifier le produit', sub: 'Code HS, normes applicables' },
    { num: 2, title: 'Vérifier la réglementation', sub: 'Pays, licences, certifications' },
    { num: 3, title: 'Calculer les coûts', sub: 'Droits de douane, taxes, transport' },
    { num: 4, title: 'Préparer les documents', sub: 'Factures, certificats, déclarations' },
    { num: 5, title: 'Passer la douane', sub: 'Contrôles et inspection' },
    { num: 6, title: 'Livrer sur le marché', sub: 'Distribution et conformité' },
  ];

  // 5 FAQs
  const faqQuestions = [
    {
      q: 'Quels sont les documents nécessaires pour importer en Algérie ?',
      a: 'Pour importer en Algérie, vous devez fournir la facture commerciale domiciliée auprès d’une banque commerciale agréée, le certificat d’origine, la note de colisage, le connaissement maritime (B/L) et le certificat de contrôle de conformité IANOR.',
    },
    {
      q: 'Quels produits sont soumis à des licences en Chine ?',
      a: 'La Chine impose des licences spécifiques gérées par le MOFCOM et les douanes (GACC) pour les denrées alimentaires, les cosmétiques, les produits chimiques dangereux et certains équipements électroniques de haute précision.',
    },
    {
      q: 'Comment bénéficier des avantages tarifaires de l’accord Chine–Maroc ?',
      a: 'Pour bénéficier des préférences tarifaires, l’exportateur doit émettre un certificat d’origine conforme attestant que le produit remplit les critères de transformation substantielle établis par le protocole bilatéral.',
    },
    {
      q: 'Quelles sont les normes requises pour les produits électroniques ?',
      a: 'En Chine, la certification obligatoire CCC (China Compulsory Certificate) est requise. En Afrique du Nord, les normes CE, NM (Maroc), NT (Tunisie) et EOS (Égypte) s’appliquent avec présentation des rapports de test en laboratoire agréé.',
    },
    {
      q: 'Quels sont les délais moyens de dédouanement ?',
      a: 'Les délais varient de 24 à 48 heures pour les cargaisons régulières sous circuit vert avec pré-dédouanement électronique (PortNet, Nafeza, TTN), et de 4 à 7 jours ouvrés en cas d’inspection physique ou analyse en laboratoire.',
    },
  ];

  const runHsSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setHsLoading(true);
    api
      .get<HsCodeResult[]>(`/regulations/hs-codes?q=${encodeURIComponent(q)}`)
      .then(setHsResults)
      .catch(() => setHsResults([]))
      .finally(() => setHsLoading(false));
  };

  // Fiche réglementaire réelle du pays ou de l'accord choisi.
  useEffect(() => {
    setProfile(null);
    setProfileMissing(false);
    if (!selectedCountryModal) return;
    api
      .get<RegulationProfile>(`/regulations/profiles/${encodeURIComponent(selectedCountryModal)}`)
      .then(setProfile)
      .catch(() => setProfileMissing(true));
  }, [selectedCountryModal]);

  const q = searchQuery.trim().toLowerCase();
  const matchesText = (...texts: string[]) => !q || texts.some((text) => text.toLowerCase().includes(q));
  const visibleCountries = countryRegulations.filter(
    (c) => (selectedCountry === 'Tous les pays' || c.name === selectedCountry) && matchesText(c.name, c.desc, ...c.items),
  );
  const visibleAgreements = tradeAgreements.filter(
    (acc) => (selectedCountry === 'Tous les pays' || acc.title.includes(selectedCountry) || !/Maroc|Tunisie|Algérie|Égypte|Libye/.test(acc.title)) && matchesText(acc.title, acc.subtitle),
  );
  const visibleDocuments = documentResources.filter(
    (doc) => (selectedCountry === 'Tous les pays' || doc.title.includes(selectedCountry) || !/Chine|Maroc|Tunisie|Algérie|Égypte|Libye/.test(doc.title)) && matchesText(doc.title),
  );
  const visibleFaq = faqQuestions.filter((item) => matchesText(item.q, item.a));
  const filtersActive = selectedCountry !== 'Tous les pays' || q !== '';
  const resetFilters = () => {
    setSelectedCountry('Tous les pays');
    setSearchQuery('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. FILTRES : PAYS ET RECHERCHE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pays</label>
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>Tous les pays</option>
                {countryRegulations.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Recherche</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && document.getElementById('reglementation-par-pays')?.scrollIntoView({ behavior: 'smooth' })}
                placeholder="Rechercher une réglementation, un document, une question..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 pr-11 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => document.getElementById('reglementation-par-pays')?.scrollIntoView({ behavior: 'smooth' })}
                aria-label="Rechercher"
                className="absolute right-1 top-1 bottom-1 px-3 bg-[#0a2559] hover:bg-blue-900 text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <button
            onClick={resetFilters}
            disabled={!filtersActive}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FIVE KPI METRICS CARDS (EXACT MATCH SCREENSHOT)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-shadow flex items-start justify-between"
            >
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {m.value}
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-1 leading-snug">
                  {m.label}
                </div>
                <div className="text-[11px] font-bold text-emerald-600 mt-2">
                  {m.change}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. ROW 1: RÉGLEMENTATION PAR PAYS (LEFT) & ACCORDS COMMERCIAUX (RIGHT)     */}
      {/* ========================================================================= */}
      <div id="reglementation-par-pays" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Réglementation par pays (approx 7 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Réglementation par pays
              </h2>
              <button
                onClick={() => setSelectedCountry('Tous les pays')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Voir tous les pays</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 6 Countries Cards in a horizontal grid with authentic FlagIcon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {visibleCountries.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between hover:border-blue-400 hover:shadow-xs transition-all text-center"
                >
                  <div>
                    {/* Flag Centered */}
                    <div className="flex items-center justify-center mb-2">
                      <FlagIcon country={c.code} size="xl" className="shadow-xs" />
                    </div>
                    {/* Country Name */}
                    <h3 className="text-xs font-black text-slate-900 mb-2.5">
                      {c.name}
                    </h3>
                    {/* 3 bullet labels */}
                    <div className="space-y-1.5 text-[10.5px] font-medium text-slate-600 text-left">
                      {c.items.map((item, i) => (
                        <div key={i} className="leading-tight text-slate-600">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Link Details */}
                  <button
                    onClick={() => setSelectedCountryModal(c.name)}
                    className="mt-4 pt-2 border-t border-slate-100 text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Voir les détails</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Accords commerciaux (approx 4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Accords commerciaux
              </h2>

            </div>

            <div className="space-y-2">
              {visibleAgreements.map((acc, idx) => {
                const Icon = acc.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedCountryModal(acc.title)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {acc.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {acc.subtitle}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0 ml-1" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. ROW 2: 3-COLUMN SECTION (HS SEARCH, TARIFS DOUANIERS, DOCUMENTS)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Recherche par code HS */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 tracking-tight">
              Recherche par code HS
            </h3>
            
            {/* Input with dark search button */}
            <div className="relative mb-4">
              <input
                id="recherche-code-sh"
                type="text"
                value={hsSearchInput}
                onChange={(e) => setHsSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runHsSearch(hsSearchInput)}
                placeholder="Entrez un code HS (ex: 8517) ou un mot-clé de produit..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => runHsSearch(hsSearchInput)}
                aria-label="Rechercher le code SH"
                className="absolute right-1 top-1 bottom-1 px-2.5 bg-[#0a2559] hover:bg-blue-900 text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-700 mb-2">
              Exemples populaires :
            </div>

            {/* Popular tags */}
            <div className="flex flex-wrap gap-2">
              {[
                { code: '8517', label: 'Smartphones' },
                { code: '8703', label: 'Voitures' },
                { code: '6403', label: 'Chaussures' },
                { code: '2106', label: 'Produits alimentaires' },
                { code: '7308', label: 'Structures en acier' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setHsSearchInput(`${item.code} ${item.label}`);
                    runHsSearch(item.code);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
                >
                  <strong className="text-blue-700 font-bold mr-1">{item.code}</strong>
                  {item.label}
                </button>
              ))}
            </div>
            {hsLoading && <p className="mt-3 text-xs text-slate-500">Recherche en cours...</p>}
            {!hsLoading && hsResults && hsResults.length === 0 && (
              <p className="mt-3 text-xs text-slate-500">Aucun code SH trouvé pour cette recherche.</p>
            )}
            {!hsLoading && hsResults && hsResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
                {hsResults.slice(0, 8).map((hs) => (
                  <div key={hs.code} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-bold text-slate-900">
                        <span className="text-blue-700 mr-1.5">{hs.code}</span>
                        {hs.label}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 shrink-0">{hs.category}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[10px]">
                      {DUTY_COUNTRIES.map(([key, label]) => (
                        <div key={key} className="bg-white rounded-md border border-slate-100 py-1">
                          <div className="text-slate-500">{label}</div>
                          <div className="font-black text-slate-900">{hs.duties?.[key] ?? '—'}{hs.duties?.[key] !== undefined ? ' %' : ''}</div>
                        </div>
                      ))}
                    </div>
                    {hs.requirements && <p className="mt-2 text-[11px] text-slate-600">{hs.requirements}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Col 2: Tarifs douaniers (exemple) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Tarifs douaniers <span className="text-slate-400 font-normal text-xs">(exemple)</span>
              </h3>
              <button
                onClick={() => {
                  const input = document.getElementById('recherche-code-sh') as HTMLInputElement | null;
                  input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  input?.focus();
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Chercher un autre code</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Tariffs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="py-1.5 pr-2">Produit (HS Code)</th>
                    <th className="py-1.5 px-1 text-center">Chine → Maroc</th>
                    <th className="py-1.5 px-1 text-center">Chine → Algérie</th>
                    <th className="py-1.5 px-1 text-center">Chine → Tunisie</th>
                    <th className="py-1.5 pl-1 text-center">Chine → Égypte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-800">
                  {tariffsData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 pr-2 font-semibold text-slate-900">{row.name}</td>
                      <td className="py-2 px-1 text-center">{row.ma}</td>
                      <td className="py-2 px-1 text-center">{row.dz}</td>
                      <td className="py-2 px-1 text-center">{row.tn}</td>
                      <td className="py-2 pl-1 text-center">{row.eg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Col 3: Documents et ressources */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Documents et ressources
              </h3>
              <button
                onClick={() => navigate('resources')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Voir toutes les ressources</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {visibleDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  onClick={() => (onOpenDocDetail ? onOpenDocDetail(doc.title) : openDocument(doc.title))}
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {doc.title}
                      </div>
                      <div className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                        <span>PDF</span>
                        <span>•</span>
                        <span className="text-slate-500 font-normal">{doc.format.replace('PDF - ', '')}</span>
                      </div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-red-500 group-hover:text-red-600 shrink-0 ml-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. ROW 3: PROCESSUS D'IMPORT/EXPORT (LEFT) & FOIRE AUX QUESTIONS (RIGHT)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Processus d'import/export (approx 7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-5">
              Processus d'import/export
            </h3>

            {/* 6 Steps Connected */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 relative">
              {importExportSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center relative group">
                  
                  {/* Step Circle */}
                  <div className="w-9 h-9 rounded-full bg-[#0c4a9e] text-white font-black text-sm flex items-center justify-center shadow-xs mb-2.5 shrink-0 group-hover:scale-105 transition-transform">
                    {step.num}
                  </div>

                  {/* Title */}
                  <div className="text-xs font-bold text-slate-900 leading-tight mb-1">
                    {step.title}
                  </div>

                  {/* Subtitle */}
                  <div className="text-[10px] text-slate-500 leading-snug">
                    {step.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Foire aux questions (approx 5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Foire aux questions
              </h3>
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === null ? 0 : null)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Voir toutes les FAQs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {visibleFaq.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-100 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left p-2.5 flex items-center justify-between gap-2 text-xs font-semibold text-slate-800 hover:text-blue-600 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="leading-snug">{item.q}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 text-[11px] text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-100 animate-in fade-in duration-150">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: COUNTRY DETAIL VIEW                                             */}
      {/* ========================================================================= */}
      {selectedCountryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setSelectedCountryModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <FlagIcon country={selectedCountryModal} size="xl" className="shadow-xs" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Réglementation : {selectedCountryModal}
                </h3>
                <p className="text-xs text-slate-500">Guide de conformité et exigences douanières</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-[55vh] overflow-y-auto">
              {!profile && !profileMissing && <p className="text-slate-500">Chargement de la fiche...</p>}
              {profileMissing && (
                <p>
                  Cette fiche n’est pas encore détaillée. Le guide « Accords commerciaux Chine – Afrique » rassemble les accords et leurs textes officiels.
                </p>
              )}
              {profile && (
                <>
                  <p>{profile.summary}</p>
                  {[
                    ['Exigences', profile.requirements],
                    ['Documents à fournir', profile.documents],
                    ['Organismes compétents', profile.agencies],
                  ].map(([title, items]) =>
                    (items as string[]).length ? (
                      <div key={title as string}>
                        <div className="text-[11px] font-bold text-slate-800 mb-1">{title as string}</div>
                        <ul className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-[11px]">
                          {(items as string[]).map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null,
                  )}
                  {profile.clearanceTime && (
                    <p>
                      <strong>Délai de dédouanement :</strong> {profile.clearanceTime}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedCountryModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Fermer
              </button>
              {(profile?.guideDocumentId || profileMissing) && (
                <button
                  onClick={() => {
                    const guide = profile?.guideDocumentId ?? 'accords-commerciaux-chine-afrique';
                    setSelectedCountryModal(null);
                    openDocument(guide);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Lire le guide
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedCountryModal(null);
                  if (onOpenConsultation) onOpenConsultation();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Demander un accompagnement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
