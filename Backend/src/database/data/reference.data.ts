import { HsCode, RegulationProfile } from '../../modules/regulations/regulation.entities';
import { CustomsTariff, FreightRate } from '../../modules/simulations/simulation.entities';

const CATEGORY_LABELS: Record<string, string> = {
  machinery: 'Machines industrielles & Outillage',
  electronics: 'Matériel électronique & Informatique',
  textile: 'Textiles, tissus & habillement',
  raw_materials: 'Matières premières pour transformation',
  medical: 'Dispositifs médicaux certifiés',
};

/** [droit de douane, TVA] par catégorie. */
const COUNTRY_RATES: Record<string, { port: string; portFees: number; rates: Record<string, [number, number]> }> = {
  Tunisie: {
    port: 'Radès / Sfax',
    portFees: 450,
    rates: { machinery: [0.05, 0.19], electronics: [0.2, 0.19], textile: [0.3, 0.19], raw_materials: [0, 0.19], medical: [0, 0.07] },
  },
  Algérie: {
    port: "Alger / Oran / Djendjen",
    portFees: 520,
    rates: { machinery: [0.05, 0.19], electronics: [0.3, 0.19], textile: [0.3, 0.19], raw_materials: [0.05, 0.19], medical: [0.05, 0.09] },
  },
  Maroc: {
    port: 'Tanger Med / Casablanca',
    portFees: 480,
    rates: { machinery: [0.025, 0.2], electronics: [0.175, 0.2], textile: [0.4, 0.2], raw_materials: [0.025, 0.2], medical: [0.025, 0.07] },
  },
  Égypte: {
    port: 'Alexandrie / Port-Saïd',
    portFees: 400,
    rates: { machinery: [0.05, 0.14], electronics: [0.2, 0.14], textile: [0.3, 0.14], raw_materials: [0.02, 0.14], medical: [0.02, 0.05] },
  },
};

export const CUSTOMS_TARIFFS: Partial<CustomsTariff>[] = Object.entries(COUNTRY_RATES).flatMap(([country, config]) =>
  Object.entries(config.rates).map(([category, [dutyRate, vatRate]]) => ({
    country,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    dutyRate,
    vatRate,
    portFees: config.portFees,
    port: config.port,
  })),
);

const FREIGHT_BASE: Record<string, [number, string]> = {
  'sea-20ft': [2800, '28 à 35 jours'],
  'sea-40ft': [4600, '28 à 35 jours'],
  'sea-lcl': [1200, '35 à 45 jours'],
  air: [3800, '4 à 7 jours'],
};
const FREIGHT_FACTOR: Record<string, number> = { Tunisie: 1, Algérie: 1.08, Maroc: 0.95, Égypte: 0.9 };

export const FREIGHT_RATES: Partial<FreightRate>[] = Object.entries(FREIGHT_FACTOR).flatMap(([country, factor]) =>
  Object.entries(FREIGHT_BASE).map(([mode, [cost, transitTime]]) => ({
    country,
    mode,
    cost: Math.round((cost * factor) / 10) * 10,
    transitTime,
  })),
);

export const HS_CODES: Partial<HsCode>[] = [
  { code: '8517', label: 'Smartphones et appareils de télécommunication', category: 'Électronique', duties: { maroc: 0, algerie: 5, tunisie: 5, egypte: 10, libye: 0 }, keywords: ['smartphone', 'téléphone', 'mobile', 'routeur'], requirements: 'Homologation télécom (ANRT, ARPCE, INTT, NTRA).', featured: true },
  { code: '8703', label: 'Véhicules automobiles de tourisme', category: 'Automobile', duties: { maroc: 10, algerie: 10, tunisie: 10, egypte: 20, libye: 5 }, keywords: ['voiture', 'véhicule', 'automobile', 'suv'], requirements: 'Homologation du type et normes Euro.', featured: true },
  { code: '8541', label: 'Panneaux solaires et cellules photovoltaïques', category: 'Énergie', duties: { maroc: 0, algerie: 0, tunisie: 0, egypte: 5, libye: 0 }, keywords: ['solaire', 'panneau', 'photovoltaïque', 'pv'], requirements: 'Certification IEC 61215 / 61730.', featured: true },
  { code: '1509', label: 'Huile d’olive et ses fractions', category: 'Agroalimentaire', duties: { maroc: 5, algerie: 0, tunisie: 0, egypte: 5, libye: 0 }, keywords: ['huile', 'olive', 'alimentaire'], requirements: 'Enregistrement GACC de l’exportateur pour la Chine, certificat sanitaire.', featured: true },
  { code: '6205', label: 'Chemises pour hommes (textile)', category: 'Textile', duties: { maroc: 12, algerie: 15, tunisie: 10, egypte: 20, libye: 10 }, keywords: ['textile', 'chemise', 'vêtement', 'habillement'], requirements: 'Étiquetage de composition en arabe et en français.', featured: true },
  { code: '6403', label: 'Chaussures à dessus en cuir', category: 'Textile', duties: { maroc: 25, algerie: 30, tunisie: 20, egypte: 30, libye: 10 }, keywords: ['chaussure', 'cuir', 'souliers'], requirements: 'Contrôle de conformité et marquage d’origine.' },
  { code: '2106', label: 'Préparations alimentaires diverses', category: 'Agroalimentaire', duties: { maroc: 17.5, algerie: 30, tunisie: 20, egypte: 20, libye: 10 }, keywords: ['alimentaire', 'préparation', 'complément'], requirements: 'Analyse en laboratoire et étiquetage nutritionnel.' },
  { code: '7308', label: 'Constructions et structures en acier', category: 'Construction', duties: { maroc: 10, algerie: 15, tunisie: 15, egypte: 10, libye: 5 }, keywords: ['acier', 'structure', 'charpente', 'construction'], requirements: 'Certificat matière et normes EN 1090.' },
  { code: '8471', label: 'Ordinateurs et unités de traitement', category: 'Électronique', duties: { maroc: 0, algerie: 5, tunisie: 0, egypte: 0, libye: 0 }, keywords: ['ordinateur', 'pc', 'laptop', 'informatique'], requirements: 'Conformité CEM et sécurité électrique.' },
  { code: '8418', label: 'Réfrigérateurs et congélateurs', category: 'Électroménager', duties: { maroc: 17.5, algerie: 30, tunisie: 20, egypte: 30, libye: 10 }, keywords: ['réfrigérateur', 'frigo', 'congélateur', 'électroménager'], requirements: 'Étiquette énergétique et conformité gaz réfrigérants.' },
  { code: '8507', label: 'Accumulateurs électriques (batteries lithium-ion)', category: 'Énergie', duties: { maroc: 2.5, algerie: 5, tunisie: 5, egypte: 5, libye: 0 }, keywords: ['batterie', 'lithium', 'accumulateur', 'stockage'], requirements: 'UN 38.3 et transport marchandises dangereuses.' },
  { code: '8477', label: 'Machines pour le travail du caoutchouc et des plastiques', category: 'Machines', duties: { maroc: 2.5, algerie: 5, tunisie: 0, egypte: 2, libye: 0 }, keywords: ['machine', 'injection', 'plastique', 'presse'], requirements: 'Directive machines / certificat CE.' },
  { code: '3304', label: 'Produits de beauté et de maquillage', category: 'Cosmétiques', duties: { maroc: 25, algerie: 30, tunisie: 20, egypte: 40, libye: 10 }, keywords: ['cosmétique', 'beauté', 'maquillage', 'crème'], requirements: 'Enregistrement NMPA en Chine, autorisation sanitaire au Maghreb.' },
  { code: '0804', label: 'Dattes, figues et agrumes', category: 'Agroalimentaire', duties: { maroc: 25, algerie: 30, tunisie: 36, egypte: 5, libye: 0 }, keywords: ['dattes', 'deglet', 'fruit', 'agrumes'], requirements: 'Protocole phytosanitaire et certificat d’origine.' },
  { code: '3004', label: 'Médicaments conditionnés', category: 'Pharma', duties: { maroc: 2.5, algerie: 5, tunisie: 0, egypte: 2, libye: 0 }, keywords: ['médicament', 'pharma', 'générique'], requirements: 'AMM nationale et bonnes pratiques de fabrication.' },
  { code: '9018', label: 'Instruments et appareils médicaux', category: 'Santé', duties: { maroc: 2.5, algerie: 5, tunisie: 0, egypte: 2, libye: 0 }, keywords: ['médical', 'dispositif', 'instrument', 'hôpital'], requirements: 'Marquage CE médical ou équivalent FDA.' },
];

export const REGULATION_PROFILES: Partial<RegulationProfile>[] = [
  {
    id: 'chine',
    name: 'Chine',
    kind: 'country',
    countryCode: 'CN',
    summary: 'Accréditations CCC, douanes GACC et normes nationales GB pour accéder au marché chinois.',
    requirements: ['Enregistrement GACC des exportateurs de produits alimentaires', 'Certification obligatoire CCC pour l’électronique', 'Étiquetage en chinois simplifié', 'Normes nationales GB'],
    documents: ['Facture commerciale et liste de colisage', 'Certificat d’origine', 'Certificat sanitaire ou phytosanitaire', 'Connaissement maritime (B/L)'],
    agencies: ['GACC (Douanes chinoises)', 'SAMR / CNCA', 'MOFCOM'],
    clearanceTime: '24 à 72 heures',
    guideDocumentId: 'normes-de-securite-des-produits-en-chine',
  },
  {
    id: 'maroc',
    name: 'Maroc',
    kind: 'country',
    countryCode: 'MA',
    summary: 'Guichet unique PortNet, label NM et conformité Ministère de l’Industrie.',
    requirements: ['Engagement d’importation via PortNet', 'Conformité aux normes NM (IMANOR)', 'Contrôle technique à l’import pour les produits industriels', 'Préférences tarifaires selon les accords'],
    documents: ['Facture domiciliée', 'Certificat d’origine', 'Certificat de conformité', 'Déclaration BADR'],
    agencies: ['ADII (Douanes)', 'IMANOR', 'ONSSA (produits alimentaires)'],
    clearanceTime: '24 à 48 heures',
    guideDocumentId: 'procedures-douanieres-au-maroc',
  },
  {
    id: 'algerie',
    name: 'Algérie',
    kind: 'country',
    countryCode: 'DZ',
    summary: 'Règles bancaires d’importation, conformité IANOR et certificats d’origine.',
    requirements: ['Domiciliation bancaire préalable de l’opération', 'Contrôle de conformité IANOR / DCP', 'Respect de la liste des produits soumis à DAPS', 'Paiement par crédit documentaire'],
    documents: ['Facture domiciliée', 'Certificat d’origine', 'Certificat de conformité', 'Connaissement maritime (B/L)'],
    agencies: ['Douanes algériennes', 'IANOR', 'Banque d’Algérie'],
    clearanceTime: '3 à 7 jours',
    guideDocumentId: 'guide-d-importation-en-algerie',
  },
  {
    id: 'tunisie',
    name: 'Tunisie',
    kind: 'country',
    countryCode: 'TN',
    summary: 'Plateforme TTN TradeNet, contrôle technique INNORPI et régimes suspensifs.',
    requirements: ['Dépôt électronique via Tunisie TradeNet (TTN)', 'Contrôle technique INNORPI pour les produits réglementés', 'Régimes suspensifs pour les entreprises totalement exportatrices', 'Titre de commerce extérieur'],
    documents: ['Facture commerciale', 'Certificat d’origine', 'Liste de colisage', 'Déclaration en douane'],
    agencies: ['Douane tunisienne', 'INNORPI', 'CEPEX'],
    clearanceTime: '24 à 48 heures',
    guideDocumentId: 'reglementation-e-commerce-en-tunisie',
  },
  {
    id: 'egypte',
    name: 'Égypte',
    kind: 'country',
    countryCode: 'EG',
    summary: 'Système pré-douanier Nafeza (ACI), contrôle GOEIC et certification d’enregistrement.',
    requirements: ['Pré-enregistrement ACI sur Nafeza', 'Enregistrement des usines étrangères auprès du GOEIC', 'Normes égyptiennes EOS', 'Étiquetage en arabe'],
    documents: ['Facture certifiée', 'Certificat d’origine', 'Numéro ACID', 'Certificat d’enregistrement GOEIC'],
    agencies: ['Egyptian Customs Authority', 'GOEIC', 'EOS'],
    clearanceTime: '2 à 5 jours',
    guideDocumentId: 'egypte-systeme-nafeza-et-enregistrement-goeic',
  },
  {
    id: 'libye',
    name: 'Libye',
    kind: 'country',
    countryCode: 'LY',
    summary: 'Accréditations d’importation, lettres de crédit documentaires et inspection de conformité pour Tripoli, Misrata et Benghazi.',
    requirements: ['Licence d’importation', 'Lettre de crédit documentaire', 'Inspection avant expédition', 'Certificat de conformité'],
    documents: ['Facture certifiée', 'Certificat d’origine légalisé', 'Certificat d’inspection', 'Connaissement maritime (B/L)'],
    agencies: ['Douanes libyennes', 'Centre national de normalisation'],
    clearanceTime: '5 à 10 jours',
    guideDocumentId: 'procedures-d-importation-en-libye',
  },
  {
    id: 'forum-sur-la-cooperation-sino-africaine-focac',
    name: 'Forum sur la coopération sino-africaine (FOCAC)',
    kind: 'agreement',
    summary: 'Cadre général de coopération entre la Chine et les pays africains : financements, infrastructures, commerce et formation.',
    requirements: ['Programmes de financement concessionnel', 'Zones de coopération économique et commerciale', 'Facilitation de l’accès au marché chinois pour les produits agricoles africains'],
    documents: ['Plan d’action de Dakar', 'Déclarations ministérielles'],
    agencies: ['MOFCOM', 'Ministères des Affaires étrangères'],
    clearanceTime: null,
    guideDocumentId: 'accords-commerciaux-chine-afrique',
  },
  {
    id: 'accord-de-libre-echange-chine-maroc',
    name: 'Accord de libre-échange Chine – Maroc',
    kind: 'agreement',
    countryCode: 'MA',
    summary: 'Avantages tarifaires et secteurs concernés par le rapprochement commercial sino-marocain.',
    requirements: ['Certificat d’origine conforme', 'Respect des règles de transformation substantielle', 'Listes de démantèlement tarifaire'],
    documents: ['Certificat d’origine préférentiel', 'Déclaration du fournisseur'],
    agencies: ['ADII', 'GACC'],
    clearanceTime: null,
    guideDocumentId: 'accords-commerciaux-chine-afrique',
  },
  {
    id: 'accord-de-libre-echange-chine-tunisie',
    name: 'Accord de libre-échange Chine – Tunisie',
    kind: 'agreement',
    countryCode: 'TN',
    summary: 'Produits éligibles et procédures pour bénéficier des préférences tarifaires sino-tunisiennes.',
    requirements: ['Liste des produits éligibles', 'Certificat d’origine', 'Transport direct ou transbordement sous douane'],
    documents: ['Certificat d’origine préférentiel', 'Facture commerciale'],
    agencies: ['Douane tunisienne', 'CEPEX'],
    clearanceTime: null,
    guideDocumentId: 'accords-commerciaux-chine-afrique',
  },
  {
    id: 'zone-de-libre-echange-continentale-africaine-zlecaf',
    name: 'Zone de libre-échange continentale africaine (ZLECAf)',
    kind: 'agreement',
    summary: 'Opportunités pour les exportateurs chinois implantés en Afrique du Nord vers les 54 marchés africains.',
    requirements: ['Règles d’origine ZLECAf', 'Valeur ajoutée locale minimale', 'Calendriers de libéralisation tarifaire'],
    documents: ['Certificat d’origine ZLECAf'],
    agencies: ['Secrétariat de la ZLECAf'],
    clearanceTime: null,
    guideDocumentId: 'accords-commerciaux-chine-afrique',
  },
  {
    id: 'autres-accords-bilateraux-et-regionaux',
    name: 'Autres accords bilatéraux et régionaux',
    kind: 'agreement',
    summary: 'Accords de protection des investissements, conventions fiscales et accords régionaux (Agadir, GZALE).',
    requirements: ['Conventions de non-double imposition', 'Accords de promotion et protection des investissements'],
    documents: ['Textes officiels des conventions'],
    agencies: ['Ministères des Finances', 'Agences de promotion des investissements'],
    clearanceTime: null,
    guideDocumentId: 'accords-commerciaux-chine-afrique',
  },
];
