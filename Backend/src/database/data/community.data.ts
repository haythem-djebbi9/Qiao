/** Contenu de démonstration de QIAO Community (catégories, membres, communautés, discussions). */

const AVATAR = (id: string, w = 200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const COVER = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

export const COMMUNITY_CATEGORIES = [
  { id: 'chine-afrique', name: 'Chine – Afrique du Nord' },
  { id: 'agriculture', name: 'Agriculture & Agroalimentaire' },
  { id: 'commerce', name: 'Commerce international' },
  { id: 'import-export', name: 'Import & Export' },
  { id: 'logistique', name: 'Logistique & Transport' },
  { id: 'juridique', name: 'Juridique & Réglementation' },
  { id: 'tech', name: 'Technologie & IA' },
  { id: 'entrepreneuriat', name: 'Entrepreneuriat' },
  { id: 'investissement', name: 'Investissement' },
  { id: 'langues', name: 'Langues & Traduction' },
  { id: 'formation', name: 'Études & Formation' },
  { id: 'expatries', name: 'Expatriés & Relocation' },
].map((category, index) => ({ ...category, sortOrder: index, active: true }));

export const PROFESSIONAL_CATEGORIES = [
  { id: 'legal', name: 'Juridique' },
  { id: 'agriculture', name: 'Agriculture' },
  { id: 'import-export', name: 'Import & Export' },
  { id: 'customs', name: 'Douane & conformité' },
  { id: 'logistics', name: 'Logistique' },
  { id: 'translation', name: 'Traduction' },
  { id: 'accounting', name: 'Comptabilité & fiscalité' },
  { id: 'consulting', name: 'Conseil aux entreprises' },
  { id: 'technology', name: 'Technologie' },
  { id: 'engineering', name: 'Ingénierie' },
  { id: 'investment', name: 'Investissement & financement' },
  { id: 'healthcare', name: 'Santé' },
  { id: 'tourism', name: 'Tourisme' },
].map((category, index) => ({ ...category, sortOrder: index, active: true }));

export interface SeedMember {
  key: string;
  fullName: string;
  origin: 'china' | 'north-africa';
  avatar: string;
  headline: string;
  company?: string;
  country: string;
  city: string;
  languages: string[];
  sectors: string[];
  bio?: string;
  expert?: {
    headline: string;
    categories: string[];
    countriesServed: string[];
    years: number;
    verification: 'verified' | 'none' | 'pending';
    evidence?: string;
  };
}

export const SEED_MEMBERS: SeedMember[] = [
  { key: 'li-wei', fullName: 'Li Wei', origin: 'china', avatar: AVATAR('photo-1507003211169-0a1dd7228f2d'), headline: 'Entrepreneur — électronique grand public', company: 'Shanghai Lianhe Electronics', country: 'Chine', city: 'Shanghai', languages: ['zh', 'en', 'fr'], sectors: ['import-export', 'technology'] },
  {
    key: 'amina', fullName: 'Amina Ben Youssef', origin: 'north-africa', avatar: '', headline: 'Consultante en import-export', company: 'ABY Trade Consulting', country: 'Tunisie', city: 'Tunis', languages: ['fr', 'ar', 'en'], sectors: ['import-export', 'customs'],
    bio: "J'accompagne les PME tunisiennes dans leurs premières importations depuis la Chine : sourcing, incoterms, dédouanement.",
    expert: { headline: 'Consultante import-export Chine – Tunisie', categories: ['import-export', 'customs'], countriesServed: ['Tunisie', 'Chine'], years: 12, verification: 'verified' },
  },
  { key: 'zhang-min', fullName: 'Zhang Min', origin: 'china', avatar: '', headline: "Chargée d'investissements", company: 'Silk Road Capital', country: 'Chine', city: 'Beijing', languages: ['zh', 'en'], sectors: ['investment'] },
  {
    key: 'karim', fullName: 'Karim Haddad', origin: 'north-africa', avatar: AVATAR('photo-1500648767791-00dcc994a43e'), headline: 'Directeur logistique & transit', company: 'Haddad Transit', country: 'Algérie', city: 'Alger', languages: ['fr', 'ar', 'en'], sectors: ['logistics', 'customs'],
    expert: { headline: 'Transitaire maritime Chine – Maghreb, groupage et dédouanement', categories: ['logistics', 'customs'], countriesServed: ['Algérie', 'Tunisie', 'Chine'], years: 15, verification: 'verified' },
  },
  { key: 'chen-tao', fullName: 'Chen Tao', origin: 'china', avatar: AVATAR('photo-1506794778202-cad84cf45f1d'), headline: 'Directeur R&D CleanTech', company: 'Shenzhen SunBridge', country: 'Chine', city: 'Shenzhen', languages: ['zh', 'en'], sectors: ['technology', 'engineering'] },
  { key: 'nadia', fullName: 'Nadia Belkacem', origin: 'north-africa', avatar: '', headline: 'Étudiante en Master Commerce International', country: 'Algérie', city: 'Oran', languages: ['fr', 'ar', 'en'], sectors: ['import-export'] },
  { key: 'omar', fullName: 'Omar Tazi', origin: 'north-africa', avatar: AVATAR('photo-1492562080023-ab3db95bfbce'), headline: 'Responsable relocation', company: 'Atlas Relocation', country: 'Maroc', city: 'Casablanca', languages: ['fr', 'ar', 'en'], sectors: ['consulting'] },
  {
    key: 'liu-yan', fullName: 'Liu Yan', origin: 'china', avatar: '', headline: 'Professeure de mandarin & traductrice assermentée', country: 'Tunisie', city: 'Tunis', languages: ['zh', 'fr', 'ar'], sectors: ['translation'],
    expert: { headline: 'Traductrice chinois – français – arabe (contrats, salons, négociations)', categories: ['translation'], countriesServed: ['Tunisie', 'Chine'], years: 9, verification: 'verified' },
  },
  {
    key: 'wang-hui', fullName: 'Dr. Wang Hui', origin: 'china', avatar: AVATAR('photo-1472099645785-5658abf4ff4e'), headline: 'Expert en commerce international', company: 'Guangzhou Trade Institute', country: 'Chine', city: 'Guangzhou', languages: ['zh', 'en', 'fr'], sectors: ['import-export', 'consulting'],
    expert: { headline: 'Expert en commerce international Chine – Afrique', categories: ['import-export', 'consulting'], countriesServed: ['Chine', 'Maroc', 'Tunisie', 'Égypte'], years: 20, verification: 'verified' },
  },
  {
    key: 'youssef', fullName: 'Youssef El Amrani', origin: 'north-africa', avatar: AVATAR('photo-1519085360753-af0119f7cbe7'), headline: "Conseil en stratégie d'entreprise", company: 'Amrani Advisory', country: 'Maroc', city: 'Rabat', languages: ['fr', 'ar', 'en'], sectors: ['consulting', 'investment'],
    expert: { headline: "Conseil en stratégie d'implantation au Maroc", categories: ['consulting'], countriesServed: ['Maroc'], years: 14, verification: 'verified' },
  },
  {
    key: 'zhao-ling', fullName: 'Zhao Ling', origin: 'china', avatar: '', headline: 'Avocate en droit des affaires', company: 'Ling & Partners', country: 'Chine', city: 'Shanghai', languages: ['zh', 'en', 'fr'], sectors: ['legal'],
    expert: { headline: 'Avocate en droit des affaires sino-africain (contrats, JV, arbitrage)', categories: ['legal'], countriesServed: ['Chine', 'Tunisie', 'Maroc'], years: 11, verification: 'verified' },
  },
  {
    key: 'sofia', fullName: 'Sofia Mezhoud', origin: 'north-africa', avatar: '', headline: 'Investisseuse & mentore', company: 'Carthage Angels', country: 'Tunisie', city: 'Tunis', languages: ['fr', 'ar', 'en'], sectors: ['investment'],
    expert: { headline: 'Business angel — startups agri-tech et cleantech', categories: ['investment'], countriesServed: ['Tunisie', 'Algérie'], years: 8, verification: 'none' },
  },
  {
    key: 'li-mei', fullName: 'Li Mei', origin: 'china', avatar: '', headline: 'Responsable supply chain', company: 'Ningbo Ocean Supply', country: 'Chine', city: 'Ningbo', languages: ['zh', 'en'], sectors: ['logistics', 'import-export'],
    expert: { headline: "Audit d'usines et supply chain à Ningbo", categories: ['logistics', 'import-export'], countriesServed: ['Chine'], years: 10, verification: 'pending', evidence: 'Certification ISO 9001 Lead Auditor (n° IRCA 2019-55821), 10 ans chez Ningbo Ocean Supply.' },
  },
  {
    key: 'mona', fullName: 'Mona Fawzy', origin: 'north-africa', avatar: '', headline: 'Consultante réglementaire GOEIC', company: 'Nile Compliance', country: 'Égypte', city: 'Le Caire', languages: ['ar', 'en', 'fr'], sectors: ['customs', 'legal'],
    expert: { headline: 'Conformité GOEIC et enregistrement des importateurs en Égypte', categories: ['customs', 'legal'], countriesServed: ['Égypte'], years: 13, verification: 'verified' },
  },
  {
    key: 'ahmed-chen', fullName: 'Ahmed Chen', origin: 'china', avatar: AVATAR('photo-1556157382-97eda2d62296'), headline: "Avocat d'affaires franco-chinois", company: 'Chen Avocats', country: 'Chine', city: 'Shanghai', languages: ['zh', 'fr', 'en'], sectors: ['legal'],
    expert: { headline: "Avocat d'affaires : contrats d'achat internationaux et propriété intellectuelle", categories: ['legal'], countriesServed: ['Chine', 'Tunisie', 'France'], years: 16, verification: 'verified' },
  },
  {
    key: 'salma', fullName: 'Salma Gharbi', origin: 'north-africa', avatar: '', headline: 'Avocate en droit commercial — Barreau de Tunis', company: 'Cabinet Gharbi', country: 'Tunisie', city: 'Tunis', languages: ['fr', 'ar', 'en'], sectors: ['legal'],
    bio: "Avocate au Barreau de Tunis : création de sociétés, contrats de distribution, recouvrement et contentieux commercial.",
    expert: { headline: 'Avocate en droit commercial et des sociétés en Tunisie', categories: ['legal'], countriesServed: ['Tunisie'], years: 12, verification: 'verified' },
  },
  {
    key: 'hichem', fullName: 'Hichem Trabelsi', origin: 'north-africa', avatar: AVATAR('photo-1463453091185-61582044d556'), headline: 'Ingénieur agronome — filière oléicole', company: 'AgriSfax Conseil', country: 'Tunisie', city: 'Sfax', languages: ['fr', 'ar'], sectors: ['agriculture'],
    expert: { headline: "Ingénieur agronome, export d'huile d'olive et de dattes", categories: ['agriculture', 'customs'], countriesServed: ['Tunisie', 'Chine'], years: 18, verification: 'verified' },
  },
  { key: 'faten', fullName: 'Faten Jlassi', origin: 'north-africa', avatar: '', headline: "Productrice d'huile d'olive biologique", company: 'Domaine Jlassi', country: 'Tunisie', city: 'Kairouan', languages: ['ar', 'fr'], sectors: ['agriculture'] },
  { key: 'wu-jun', fullName: 'Wu Jun', origin: 'china', avatar: AVATAR('photo-1504257432389-52343af06ae3'), headline: 'Acheteur agroalimentaire', company: 'Qingdao Fresh Foods Group', country: 'Chine', city: 'Qingdao', languages: ['zh', 'en'], sectors: ['agriculture', 'import-export'] },
  { key: 'walid', fullName: 'Walid Mansouri', origin: 'north-africa', avatar: AVATAR('photo-1522529599102-193c0d76b5b6'), headline: 'Gérant de PME textile', company: 'Mansouri Textile', country: 'Tunisie', city: 'Monastir', languages: ['fr', 'ar'], sectors: ['import-export'] },
];

export interface SeedCommunity {
  slug: string;
  name: string;
  description: string;
  rules?: string;
  category: string;
  icon: string;
  cover: string;
  languages: string[];
  scope: string;
  visibility: 'public' | 'restricted' | 'private';
  policy: 'open' | 'approval' | 'invite';
  featured?: boolean;
  members: string[];
  moderators: string[];
  /** Statut du compte de démonstration dans la communauté. */
  demo?: 'active' | 'pending' | 'invited';
}

const DEFAULT_RULES =
  "1. Restez courtois et professionnel.\n2. Pas de publicité non sollicitée ni de spam.\n3. Ne partagez pas d'informations personnelles d'autrui.\n4. Les recommandations sont des avis de membres, pas des garanties QIAO.";

export const SEED_COMMUNITIES: SeedCommunity[] = [
  { slug: 'business', name: 'Business & Entrepreneurs', description: "Entrepreneurs et dirigeants qui développent des affaires entre la Chine et l'Afrique du Nord : retours d'expérience, partenariats, financement.", category: 'entrepreneuriat', icon: 'Users', cover: COVER('photo-1497366811353-6870744d04b2'), languages: ['fr', 'en', 'zh'], scope: 'Chine · Afrique du Nord', visibility: 'public', policy: 'open', featured: true, members: ['amina', 'youssef', 'li-wei', 'sofia', 'walid', 'omar'], moderators: ['amina'] },
  { slug: 'trade', name: 'China–North Africa Trade', description: 'Le carrefour du commerce sino-maghrébin : opportunités de distribution, sourcing, salons et actualité des corridors.', category: 'chine-afrique', icon: 'Handshake', cover: COVER('photo-1494412574643-ff11b0a5c1c3'), languages: ['fr', 'en', 'zh', 'ar'], scope: 'Chine · Maroc · Algérie · Tunisie · Égypte · Libye', visibility: 'public', policy: 'open', featured: true, members: ['li-wei', 'karim', 'sofia', 'wang-hui', 'wu-jun', 'amina'], moderators: ['wang-hui'], demo: 'active' },
  { slug: 'agriculture', name: 'Agriculture & Agroalimentaire', description: "Producteurs, exportateurs, ingénieurs et acheteurs : huile d'olive, dattes, agrumes, technologies agricoles et normes d'export vers la Chine.", category: 'agriculture', icon: 'Sprout', cover: COVER('photo-1500382017468-9049fed747ef'), languages: ['fr', 'ar', 'zh'], scope: 'Tunisie · Maroc · Algérie · Chine', visibility: 'public', policy: 'open', featured: true, members: ['hichem', 'faten', 'wu-jun', 'sofia', 'mona'], moderators: ['hichem'], demo: 'active' },
  { slug: 'juridique', name: 'Juridique & Réglementation', description: 'Questions juridiques et réglementaires : création de sociétés, contrats internationaux, propriété intellectuelle, recherche d’avocats.', rules: `${DEFAULT_RULES}\n5. Les réponses ne constituent pas une consultation juridique personnalisée.`, category: 'juridique', icon: 'Scale', cover: COVER('photo-1450101499163-c8848c66ca85'), languages: ['fr', 'ar', 'en', 'zh'], scope: 'Droit tunisien · marocain · chinois', visibility: 'public', policy: 'open', featured: true, members: ['zhao-ling', 'ahmed-chen', 'salma', 'mona', 'walid', 'amina'], moderators: ['zhao-ling'] },
  { slug: 'import-export', name: 'Import & Export', description: 'Incoterms, sourcing, douane, certifications : toutes les questions pratiques des importateurs et exportateurs.', category: 'import-export', icon: 'Ship', cover: COVER('photo-1578575437130-527eed3abbec'), languages: ['fr', 'ar', 'en'], scope: 'Chine ↔ Maghreb', visibility: 'public', policy: 'open', members: ['amina', 'karim', 'li-mei', 'walid', 'nadia', 'wang-hui'], moderators: ['amina'], demo: 'active' },
  { slug: 'logistique', name: 'Logistique & Transport', description: 'Fret maritime et aérien, groupage, entreposage et dédouanement entre les ports chinois et nord-africains.', category: 'logistique', icon: 'Truck', cover: COVER('photo-1586528116311-ad8dd3c8310d'), languages: ['fr', 'en', 'zh'], scope: 'Ningbo · Shanghai · Radès · Alger · Tanger Med', visibility: 'public', policy: 'open', members: ['karim', 'li-mei', 'amina'], moderators: ['karim'] },
  { slug: 'investment', name: 'Investissement', description: "Investisseurs, fonds et porteurs de projets : opportunités, structuration et retours d'expérience. Adhésion validée par les modérateurs.", category: 'investissement', icon: 'TrendingUp', cover: COVER('photo-1611974789855-9c2a0a7236a3'), languages: ['fr', 'en', 'zh'], scope: 'Chine · Afrique du Nord', visibility: 'restricted', policy: 'approval', members: ['zhang-min', 'sofia', 'wang-hui', 'youssef'], moderators: ['sofia'] },
  { slug: 'fournisseurs-chinois', name: 'Fournisseurs chinois vérifiés', description: 'Espace réservé aux acheteurs : retours sur les usines auditées, alertes qualité et bonnes pratiques de sourcing.', category: 'chine-afrique', icon: 'Factory', cover: COVER('photo-1565043666747-69f6646db940'), languages: ['fr', 'en', 'zh'], scope: 'Guangdong · Zhejiang · Jiangsu', visibility: 'restricted', policy: 'approval', members: ['li-mei', 'li-wei', 'amina', 'walid'], moderators: ['li-mei'], demo: 'pending' },
  { slug: 'etudiants', name: 'Étudiants & Formation', description: 'Études, stages et premiers emplois entre la Chine et le Maghreb : bourses, visas, conseils de carrière.', category: 'formation', icon: 'GraduationCap', cover: COVER('photo-1523240795612-9a054b0db644'), languages: ['fr', 'en', 'zh', 'ar'], scope: 'Universités & écoles', visibility: 'public', policy: 'open', members: ['nadia', 'liu-yan', 'li-wei'], moderators: ['liu-yan'] },
  { slug: 'expatries', name: 'Expatriés & Relocation', description: "S'installer et vivre au Maghreb ou en Chine : logement, écoles, démarches administratives.", category: 'expatries', icon: 'MapPin', cover: COVER('photo-1539020140153-e479b8c22e70'), languages: ['fr', 'en', 'zh'], scope: 'Casablanca · Tunis · Alger · Shanghai', visibility: 'public', policy: 'open', members: ['omar', 'chen-tao', 'zhang-min'], moderators: ['omar'] },
  { slug: 'culture-langues', name: 'Culture & Langues', description: 'Mandarin, arabe et français des affaires, interculturalité et traduction.', category: 'langues', icon: 'Languages', cover: COVER('photo-1528164344705-47542687000d'), languages: ['zh', 'fr', 'ar'], scope: 'Échanges culturels', visibility: 'public', policy: 'open', members: ['liu-yan', 'nadia', 'omar'], moderators: ['liu-yan'] },
  { slug: 'tech', name: 'Technologie & Innovation', description: "Cleantech, IA, e-commerce et transferts de technologie entre écosystèmes chinois et nord-africains.", category: 'tech', icon: 'Lightbulb', cover: COVER('photo-1518770660439-4636190af475'), languages: ['fr', 'en', 'zh'], scope: 'Shenzhen · Tunis · Casablanca', visibility: 'public', policy: 'open', members: ['chen-tao', 'sofia', 'li-wei'], moderators: ['chen-tao'] },
  { slug: 'cercle-investisseurs', name: 'Cercle des investisseurs QIAO', description: 'Cercle privé de co-investissement : dossiers confidentiels présentés par les membres. Accès sur invitation.', category: 'investissement', icon: 'Gem', cover: COVER('photo-1559526324-4b87b5e36e44'), languages: ['fr', 'en', 'zh'], scope: 'Confidentiel', visibility: 'private', policy: 'invite', members: ['sofia', 'zhang-min', 'youssef'], moderators: ['sofia'], demo: 'invited' },
];

export interface SeedComment {
  author: string;
  text: string;
  ageMinutes: number;
  likes?: string[];
  replies?: SeedComment[];
}

export interface SeedPostData {
  author: string;
  community: string | null;
  type: 'post' | 'question';
  title?: string;
  content: string;
  tags: string[];
  category?: string;
  language?: string;
  ageMinutes: number;
  likes: string[];
  comments?: SeedComment[];
  /** Index du commentaire accepté (questions résolues). */
  accepted?: number;
  questionStatus?: 'open' | 'answered' | 'closed';
}

export const SEED_POSTS: SeedPostData[] = [
  {
    author: 'walid', community: 'juridique', type: 'question', category: 'legal', ageMinutes: 95,
    title: 'Je cherche un avocat spécialisé en droit commercial en Tunisie',
    content: "Bonjour, je dois renégocier un contrat de distribution exclusive avec un fournisseur chinois et créer une filiale à Sousse. Pouvez-vous me recommander un avocat fiable en droit commercial à Tunis ou au Sahel ?",
    tags: ['Avocat', 'Droit commercial', 'Tunisie'], likes: ['amina', 'salma', 'zhao-ling'],
    comments: [
      { author: 'salma', ageMinutes: 70, text: "Bonjour Walid, je suis avocate au Barreau de Tunis et je traite régulièrement des contrats de distribution avec des fournisseurs chinois. N'hésitez pas à m'écrire en privé pour un premier échange.", likes: ['walid', 'amina'] },
      { author: 'amina', ageMinutes: 55, text: "J'ai travaillé avec Maître @salma-gharbi sur deux dossiers d'importation : très réactive et habituée aux contrats bilingues.", replies: [{ author: 'walid', ageMinutes: 40, text: 'Merci Amina, je la contacte.' }] },
      { author: 'zhao-ling', ageMinutes: 30, text: "Pour la partie chinoise du contrat (clause d'arbitrage CIETAC, loi applicable), je peux relire la version chinoise avec votre avocat tunisien." },
    ],
  },
  {
    author: 'faten', community: 'agriculture', type: 'question', category: 'agriculture', ageMinutes: 300, questionStatus: 'answered', accepted: 0,
    title: "Quels documents faut-il pour exporter de l'huile d'olive vers la Chine ?",
    content: "Nous produisons 40 tonnes d'huile d'olive bio par an à Kairouan. Un importateur de Shanghai est intéressé. Quelles démarches et quels certificats prévoir avant la première expédition ?",
    tags: ["Huile d'olive", 'Export', 'GACC'], likes: ['hichem', 'wu-jun', 'sofia', 'mona'],
    comments: [
      { author: 'hichem', ageMinutes: 260, text: "Trois étapes : 1) enregistrement de votre établissement auprès des douanes chinoises (GACC, système CIFER), 2) certificat d'origine et certificat sanitaire délivrés en Tunisie, 3) étiquette en chinois conforme GB 7718, collée avant le dédouanement. Comptez 6 à 8 semaines pour l'enregistrement GACC.", likes: ['faten', 'wu-jun', 'amina'] },
      { author: 'wu-jun', ageMinutes: 200, text: "Côté importateur, nous demandons aussi l'analyse du taux d'acidité et un échantillon de 2 litres. Les huiles bio doivent avoir une certification bio chinoise distincte pour porter la mention 有机." },
      { author: 'mona', ageMinutes: 150, text: "Attention aux délais de légalisation du certificat d'origine si vous passez par un transitaire égyptien ou marocain pour le groupage." },
    ],
  },
  {
    author: 'wu-jun', community: 'agriculture', type: 'post', ageMinutes: 420, language: 'fr',
    content: "Qingdao Fresh Foods recherche des fournisseurs de dattes Deglet Nour et d'huile d'olive extra vierge en Afrique du Nord pour 2026. Volumes : 200 t de dattes et 60 t d'huile. Les producteurs certifiés peuvent répondre ici ou m'écrire.",
    tags: ['Fournisseurs', 'Dattes', "Huile d'olive"], likes: ['hichem', 'faten', 'li-wei', 'sofia', 'karim'],
    comments: [{ author: 'faten', ageMinutes: 380, text: "Nous sommes intéressés pour l'huile d'olive bio. Je vous envoie notre fiche technique." }],
  },
  {
    author: 'li-wei', community: 'trade', type: 'post', ageMinutes: 120,
    content: 'À la recherche de partenaires en Afrique du Nord pour développer la distribution de produits électroniques.',
    tags: ['Partenariat', 'Distribution'], likes: ['karim', 'sofia', 'amina', 'wang-hui', 'wu-jun'],
    comments: [
      { author: 'karim', ageMinutes: 60, text: 'Bonjour Li Wei, notre groupe de distribution à Alger et Tunis serait très intéressé. Pouvons-nous échanger en privé ?' },
      { author: 'sofia', ageMinutes: 45, text: 'Excellente opportunité. Avez-vous déjà la certification CE / conformité maghrébine ?' },
    ],
  },
  {
    author: 'amina', community: 'business', type: 'post', ageMinutes: 240,
    content: "Webinaire : Comprendre les opportunités d'importation depuis la Chine. Rejoignez-nous jeudi à 18h (GMT+1) !",
    tags: ['Événement', 'Import/Export'], likes: ['youssef', 'walid', 'li-wei', 'omar'],
    comments: [{ author: 'youssef', ageMinutes: 180, text: "Inscrit ! Très hâte d'assister au volet sur la conformité douanière." }],
  },
  {
    author: 'zhang-min', community: 'investment', type: 'question', category: 'investment', ageMinutes: 360,
    title: "Quels secteurs offrent les meilleures opportunités d'investissement en Afrique du Nord ?",
    content: "Notre fonds étudie trois tickets de 2 à 5 M$ pour 2026. Quels secteurs vous semblent les plus porteurs, et quelles précautions prendre ?",
    tags: ['Investissement'], likes: ['sofia', 'wang-hui', 'youssef'],
    comments: [{ author: 'wang-hui', ageMinutes: 300, text: "Les énergies renouvelables (solaire et hydrogène vert) ainsi que l'agro-industrie et les composants automobiles." }],
  },
  {
    author: 'karim', community: 'logistique', type: 'post', ageMinutes: 480,
    content: "Offre d'espace groupage maritime Ningbo/Shanghai vers Alger & Radès avec dédouanement clé en main. Départs chaque semaine.",
    tags: ['Groupage', 'Logistique'], likes: ['amina', 'li-mei', 'walid'],
  },
  {
    author: 'walid', community: 'import-export', type: 'question', category: 'logistics', ageMinutes: 600,
    title: 'Quelles sociétés de logistique gèrent les envois entre la Chine et la Tunisie ?',
    content: 'Je cherche un transitaire capable de gérer des envois mensuels de 2 à 3 m³ de tissus depuis Guangzhou vers Monastir, porte à porte.',
    tags: ['Transitaire', 'Tunisie'], likes: ['nadia'],
  },
  {
    author: 'chen-tao', community: 'tech', type: 'post', ageMinutes: 720,
    content: 'Nouvelle législation sur les transferts technologiques solaires en Afrique du Nord : analyse comparative publiée sur QIAO.',
    tags: ['Actualités', 'Énergie'], likes: ['sofia', 'li-wei'],
  },
  {
    author: 'nadia', community: 'etudiants', type: 'question', ageMinutes: 1440, questionStatus: 'answered', accepted: 0,
    title: 'Stage de 6 mois à Shenzhen ou Ningbo : quelles démarches de visa ?',
    content: 'Je cherche un stage de 6 mois en sourcing ou logistique à Shenzhen ou Ningbo. Des conseils pour les démarches de visa ?',
    tags: ['Stage', 'Visa'], likes: ['liu-yan', 'li-wei'],
    comments: [{ author: 'li-wei', ageMinutes: 1300, text: "Il faut un visa X2 (stage de moins de 180 jours) : lettre d'invitation de l'entreprise, convention de stage de votre université et assurance. Comptez un mois." }],
  },
  {
    author: 'omar', community: 'expatries', type: 'post', ageMinutes: 2160,
    content: "Guide pratique pour les cadres chinois qui s'installent à Casablanca : logement, écoles internationales et démarches de résidence.",
    tags: ['Relocation', 'Maroc'], likes: ['chen-tao', 'zhang-min'],
  },
  {
    author: 'liu-yan', community: 'culture-langues', type: 'post', ageMinutes: 2880,
    content: 'Atelier gratuit de conversation en mandarin des affaires chaque samedi matin à Tunis. Places limitées à 12 personnes.',
    tags: ['Langues', 'Atelier'], likes: ['nadia', 'omar'],
  },
  {
    author: 'li-mei', community: 'fournisseurs-chinois', type: 'post', ageMinutes: 900,
    content: "Liste mise à jour des usines de textile auditées à Ningbo en septembre : 4 nouvelles usines conformes BSCI, 1 usine retirée suite à un audit qualité défavorable. Détails dans le fil.",
    tags: ['Audit', 'Textile'], likes: ['walid', 'amina'],
  },
  {
    author: 'sofia', community: 'cercle-investisseurs', type: 'post', ageMinutes: 1000,
    content: 'Deal flow du trimestre : trois dossiers agri-tech en Tunisie et en Algérie cherchent un co-investisseur chinois. Présentation jeudi en visio, réservée au cercle.',
    tags: ['Deal flow', 'Agri-tech'], likes: ['zhang-min', 'youssef'],
  },
  {
    author: 'youssef', community: null, type: 'post', ageMinutes: 60,
    content: "Bienvenue aux nouveaux membres de QIAO Community ! Présentez-vous en commentaire : votre secteur, votre pays et ce que vous recherchez. Inutile d'être inscrit à une formation pour participer.",
    tags: ['Bienvenue'], likes: ['amina', 'liu-yan', 'karim'],
    comments: [{ author: 'faten', ageMinutes: 30, text: "Bonjour à tous, productrice d'huile d'olive bio à Kairouan, je cherche des acheteurs en Chine." }],
  },
];

/** Abonnements entre membres (suivi). */
export const SEED_FOLLOWS: [string, string][] = [
  ['walid', 'salma'],
  ['faten', 'hichem'],
  ['nadia', 'liu-yan'],
  ['li-wei', 'karim'],
  ['wu-jun', 'hichem'],
  ['amina', 'zhao-ling'],
];
