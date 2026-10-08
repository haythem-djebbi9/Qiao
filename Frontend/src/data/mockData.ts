import {
  ServiceItem,
  TrainingDomain,
  CaseStudy,
  Testimonial,
  PartnerLogo,
  ArticleItem,
  ReportItem,
  EventItem,
  ToolResourceItem,
} from '../types';

export const servicesData: ServiceItem[] = [
  {
    id: 'creation-entreprise',
    title: "Création d'entreprise & Conformité",
    description: 'Accompagnement complet pour créer, structurer et développer votre entreprise en toute conformité.',
    category: 'Business',
    iconName: 'Building2',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    accentColor: 'blue',
    details: [
      'Choix de la forme juridique adaptée (WFOE, Joint-Venture, SARL, SUARL)',
      'Enregistrement auprès des autorités et obtention des licences',
      'Ouverture de comptes bancaires multidevises',
      'Domiciliation commerciale et fiscale',
      'Assistance aux démarches de visas d’affaires et permis de travail'
    ]
  },
  {
    id: 'sourcing-import-export',
    title: 'Sourcing & Import / Export',
    description: 'Trouvez les meilleurs fournisseurs en Chine et importez en toute sécurité et au meilleur coût.',
    category: 'Logistique',
    iconName: 'Ship',
    image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
    accentColor: 'red',
    details: [
      'Identification et qualification d’usines et fournisseurs certifiés',
      'Audit d’usine, contrôle qualité pré-expédition et échantillonnage',
      'Négociation des prix et des conditions commerciales (Incoterms)',
      'Sécurisation des paiements internationaux (Crédits documentaires, Escrow)',
      'Gestion complète de la chaîne d’approvisionnement'
    ]
  },
  {
    id: 'conseil-juridique-fiscalite',
    title: 'Conseil juridique & Fiscalité',
    description: 'Expertise juridique et fiscale pour sécuriser vos activités et optimiser votre structure.',
    category: 'Juridique',
    iconName: 'Scale',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    accentColor: 'blue',
    details: [
      'Rédaction et révision des contrats bilingues (Chinois, Français, Arabe, Anglais)',
      'Protection de la propriété intellectuelle et enregistrement de marques en Chine et en Afrique du Nord',
      'Optimisation fiscale bilatérale et conventions de non-double imposition',
      'Médiation, arbitrage international et résolution de litiges commerciaux'
    ]
  },
  {
    id: 'traduction-interpretation',
    title: 'Traduction & Interprétation',
    description: 'Services linguistiques professionnels en chinois, arabe, français et anglais pour tous vos besoins.',
    category: 'Traduction',
    iconName: 'Languages',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    accentColor: 'red',
    details: [
      'Interprétation simultanée et consécutive pour délégations et foires (Canton Fair, etc.)',
      'Traduction assermentée de documents officiels, statuts et contrats',
      'Localisation de sites web, catalogues et supports marketing',
      'Accompagnateurs bilingues natifs pour missions d’affaires'
    ]
  },
  {
    id: 'recrutement-rh',
    title: 'Recrutement & RH',
    description: 'Recrutez les meilleurs talents locaux et gérez vos ressources humaines efficacement.',
    category: 'Recrutement',
    iconName: 'Users',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    accentColor: 'blue',
    details: [
      'Chasse de têtes de profils biculturels et trilingues (Chine - Maghreb)',
      'Recrutement d’ingénieurs, commerciaux et directeurs de pays',
      'Gestion de paie locale, portage salarial et conformité sociale',
      'Formations d’intégration interculturelle pour vos équipes'
    ]
  },
  {
    id: 'logistique-transport',
    title: 'Logistique & Transport',
    description: 'Solutions logistiques intégrées pour vos expéditions et livraisons internationales.',
    category: 'Logistique',
    iconName: 'Truck',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    accentColor: 'red',
    details: [
      'Fret maritime complet (FCL) et groupage (LCL) Chine - Afrique du Nord',
      'Fret aérien express pour pièces urgentes et prototypes',
      'Dédouanement portuaire et aéroportuaire prioritaire',
      'Entreposage sous douane et logistique du dernier kilomètre'
    ]
  },
  {
    id: 'immobilier-relocation',
    title: 'Immobilier & Relocation',
    description: 'Trouvez, achetez ou louez en toute confiance. Nous vous accompagnons dans votre installation.',
    category: 'Immobilier',
    iconName: 'Building',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    accentColor: 'blue',
    details: [
      'Recherche de bureaux, entrepôts et locaux industriels dans les parcs économiques',
      'Logement pour expatriés et cadres dirigeants',
      'Installation complète, démarches scolaires et conciergerie VIP'
    ]
  },
  {
    id: 'sante',
    title: 'Santé',
    description: 'Accédez à des services de santé fiables et à des partenaires médicaux de confiance.',
    category: 'Santé',
    iconName: 'HeartPulse',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    accentColor: 'red',
    details: [
      'Sourcing de matériel médical et dispositifs certifiés CE/FDA',
      'Partenariats hospitaliers et cliniques pour le tourisme médical',
      'Assurance santé internationale et évacuation sanitaire'
    ]
  },
  {
    id: 'tourisme-voyages',
    title: 'Tourisme & Voyages',
    description: 'Découvrez les meilleures offres de voyage et d’hébergement en Chine et en Afrique du Nord.',
    category: 'Tourisme',
    iconName: 'Plane',
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80',
    accentColor: 'blue',
    details: [
      'Organisation de missions d’affaires et délégations officielles',
      'Réservation d’hôtels d’affaires et transport privé avec chauffeur',
      'Circuits touristiques culturels et immersifs sur-mesure'
    ]
  },
  {
    id: 'formation-coaching',
    title: 'Formation & Coaching',
    description: 'Développez vos compétences grâce à nos formations professionnelles et sessions de coaching sur-mesure.',
    category: 'Business',
    iconName: 'GraduationCap',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    isNew: true,
    accentColor: 'red',
    details: [
      'Programmes certifiants QIAO Academy',
      'Coaching exécutif pour dirigeants négociant avec la Chine',
      'Masterclasses en logistique, douane et commerce international'
    ]
  },
  {
    id: 'conseil-business',
    title: 'Conseil & Business',
    description: 'Stratégie, étude de marché, business plan... bénéficiez de conseils d’experts pour booster votre croissance.',
    category: 'Business',
    iconName: 'Briefcase',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    accentColor: 'blue',
    details: [
      'Études de faisabilité et analyses concurrentielles approfondies',
      'Mise en relation B2B directe avec des décideurs et investisseurs',
      'Structuration de partenariats stratégiques et Joint-Ventures'
    ]
  }
];

export const trainingDomains: TrainingDomain[] = [
  {
    id: 'business-commerce',
    title: 'Business & Commerce International',
    description: 'Stratégies, négociation, développement international et gestion des affaires.',
    iconName: 'Briefcase',
    coursesCount: 24,
    featuredCourse: 'Négocier efficacement avec des partenaires chinois',
    duration: '18h de formation',
    accentColor: 'red'
  },
  {
    id: 'logistique-supply',
    title: 'Logistique & Supply Chain',
    description: 'Optimisez vos opérations d’import-export et gérez votre chaîne logistique.',
    iconName: 'Truck',
    coursesCount: 18,
    featuredCourse: 'Maîtrise des Incoterms 2020 et gestion du fret maritime',
    duration: '14h de formation',
    accentColor: 'blue'
  },
  {
    id: 'droit-conformite',
    title: 'Droit & Conformité',
    description: 'Réglementation, contrats, fiscalité et droit des affaires Chine & Afrique du Nord.',
    iconName: 'Scale',
    coursesCount: 16,
    featuredCourse: 'Sécuriser ses contrats commerciaux et propriété intellectuelle en Chine',
    duration: '20h de formation',
    accentColor: 'red'
  },
  {
    id: 'langues-communication',
    title: 'Langues & Communication',
    description: 'Chinois, arabe, français et anglais professionnel pour le business.',
    iconName: 'Languages',
    coursesCount: 30,
    featuredCourse: 'Chinois des affaires pour dirigeants francophones (Niveau 1 & 2)',
    duration: '35h de formation',
    accentColor: 'blue'
  },
  {
    id: 'marketing-digital',
    title: 'Marketing & Digital',
    description: 'Marketing digital, e-commerce, réseaux sociaux et croissance internationale.',
    iconName: 'TrendingUp',
    coursesCount: 15,
    featuredCourse: 'Vendre sur WeChat, Douyin et Tmall Global depuis l’Afrique du Nord',
    duration: '16h de formation',
    accentColor: 'red'
  },
  {
    id: 'leadership-soft-skills',
    title: 'Leadership & Soft Skills',
    description: 'Leadership, gestion d’équipe, prise de décision et intelligence émotionnelle.',
    iconName: 'UserCheck',
    coursesCount: 12,
    featuredCourse: 'Management interculturel : Diriger des équipes sino-maghrébines',
    duration: '12h de formation',
    accentColor: 'blue'
  }
];

export const caseStudiesData: CaseStudy[] = [
  {
    id: 'sotufab',
    company: 'SOTUFAB',
    tag: 'IMPORT - LOGISTIQUE',
    title: 'Importation de machines industrielles depuis la Chine vers la Tunisie.',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    logoText: 'SOTUFAB',
    logoBg: 'bg-red-600',
    metrics: [
      { label: 'Délais réduits de 35%', icon: 'Clock' },
      { label: 'Coûts optimisés de 22%', icon: 'TrendingDown' },
      { label: 'Livraison sécurisée', icon: 'ShieldCheck' }
    ],
    description: 'SOTUFAB Plast, leader de la transformation plastique en Tunisie, a fait appel à QIAO pour sourcer, inspecter en usine et acheminer 6 lignes d’injection haute précision depuis le Zhejiang.',
    results: [
      'Audit technique complet de 4 usines sélectionnées à Ningbo',
      'Négociation des conditions de garantie et pièces de rechange (-22%)',
      'Dédouanement fluide au port de Radès en moins de 48h'
    ]
  },
  {
    id: 'greentech',
    company: 'GreenTech',
    tag: "CRÉATION D'ENTREPRISE",
    title: 'Création d’une société commune tuniso-chinoise dans les énergies renouvelables.',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    logoText: 'GreenTech',
    logoBg: 'bg-emerald-600',
    metrics: [
      { label: 'Entreprise créée en 15 jours', icon: 'Calendar' },
      { label: 'Conformité 100% assurée', icon: 'CheckCircle2' },
      { label: 'Accompagnement complet', icon: 'Handshake' }
    ],
    description: 'GreenTech Energy a finalisé sa Joint-Venture avec un consortium de Shenzhen pour déployer des centrales photovoltaïques et des systèmes de stockage par batteries au Maghreb.',
    results: [
      'Pacte d’actionnaires bilingue validé sous juridiction mixte',
      'Obtention de tous les agréments ministériels en un temps record',
      'Mise en place de la gouvernance et nomination des directeurs locaux'
    ]
  },
  {
    id: 'modaluxe',
    company: 'ModaLuxe',
    tag: 'SOURCING - ACHATS',
    title: 'Sourcing de textiles haut de gamme auprès de fabricants chinois certifiés.',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80',
    logoText: 'ModaLuxe',
    logoBg: 'bg-amber-600',
    metrics: [
      { label: 'Fournisseurs vérifiés', icon: 'BadgeCheck' },
      { label: 'Qualité premium garantie', icon: 'Sparkles' },
      { label: 'Économies de 18%', icon: 'Percent' }
    ],
    description: 'ModaLuxe International a confié à QIAO la recherche de fabricants de soieries et tissus techniques certifiés OEKO-TEX dans les provinces du Jiangsu et du Guangdong.',
    results: [
      'Échantillonnage en 5 jours et tests de résistance certifiés',
      'Contrat cadre négocié avec clauses pénales strictes sur les délais',
      'Réduction des coûts matières de 18% avec une qualité irréprochable'
    ]
  }
];

export const testimonialsData: Testimonial[] = [
  {
    id: '1',
    name: 'Karim Ben Messaoud',
    role: 'Directeur Général',
    company: 'BuildPro',
    content: 'Grâce à QIAO, nous avons trouvé un fournisseur fiable en Chine et réduit nos coûts d’importation de 20%. Une équipe professionnelle et réactive !',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    companyLogo: 'BuildPro'
  },
  {
    id: '2',
    name: 'Li Na Wang',
    role: 'CEO',
    company: 'TechSolutions & GreenTech',
    content: 'QIAO nous a accompagnés dans la création de notre filiale en Afrique du Nord. Un service complet, humain et efficace. Je recommande vivement !',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    companyLogo: 'GreenTech'
  },
  {
    id: '3',
    name: 'Yassine Trabelsi',
    role: 'Entrepreneur',
    company: 'ModaLuxe International',
    content: 'Les formations de QIAO Academy m’ont permis de mieux comprendre le marché chinois et de développer mon activité à l’international en toute confiance.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    companyLogo: 'ModaLuxe'
  },
  {
    id: '4',
    name: 'Zhang Wei',
    role: 'Managing Director',
    company: 'Sino-Maghreb Logistics',
    content: 'Une plateforme indispensable pour tout entrepreneur chinois voulant investir en Tunisie, Algérie ou Maroc. Le réseau d’experts locaux est incomparable.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    companyLogo: 'SML Group'
  }
];

export const clientLogos: PartnerLogo[] = [
  { name: 'Tunisie Telecom', subtext: 'TUNISIE TELECOM', logoType: 'tt', category: 'client' },
  { name: 'BIAT', subtext: 'BANQUE INTERNATIONALE ARABE DE TUNISIE', logoType: 'biat', category: 'client' },
  { name: 'SOTUFAB', subtext: 'PLAST & INDUSTRY', logoType: 'sotufab', category: 'client' },
  { name: 'PURO ILUMINACION', subtext: 'LIGHTING SYSTEMS', logoType: 'puro', category: 'client' },
  { name: 'Amen BANK', subtext: 'بنك الأمان', logoType: 'amen', category: 'client' },
  { name: 'ooredoo', subtext: 'TELECOMMUNICATIONS', logoType: 'ooredoo', category: 'client' },
  { name: 'GICA Groupe', subtext: 'GROUPE INDUSTRIEL DES CIMENTS D’ALGÉRIE', logoType: 'gica', category: 'client' }
];

export const institutionalPartners: PartnerLogo[] = [
  { name: 'CCPIT', subtext: 'China Council for the Promotion of International Trade', logoType: 'ccpit', category: 'institution' },
  { name: 'TABC', subtext: 'Tunisia-Africa Business Council', logoType: 'tabc', category: 'institution' },
  { name: 'Bank of China', subtext: '中国银行', logoType: 'boc', category: 'institution' },
  { name: 'IFC', subtext: 'International Finance Corporation (World Bank Group)', logoType: 'ifc', category: 'institution' },
  { name: 'AFREXIMBANK', subtext: 'African Export-Import Bank', logoType: 'afrexim', category: 'institution' },
  { name: 'Chambres de Commerce', subtext: 'Chine - Afrique du Nord', logoType: 'ccina', category: 'institution' }
];

export const articlesData: ArticleItem[] = [
  {
    id: 'art-1',
    title: 'Commerce Chine - Afrique du Nord : Tendances 2024',
    date: '12 mai 2024',
    category: 'Macroéconomie',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'art-2',
    title: 'S’implanter en Tunisie : Guide complet pour les investisseurs',
    date: '05 mai 2024',
    category: 'Investissement',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'art-3',
    title: 'Les secteurs d’opportunités entre la Chine et l’Afrique du Nord',
    date: '28 avril 2024',
    category: 'Opportunités',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80'
  }
];

export const reportsData: ReportItem[] = [
  {
    id: 'rep-1',
    title: 'Rapport Annuel 2023 - Commerce Chine - Afrique du Nord',
    format: 'PDF',
    size: '8.4 Mo',
    date: 'Janvier 2024',
    downloadCount: '3.2k'
  },
  {
    id: 'rep-2',
    title: 'Guide des opportunités d’affaires en Algérie',
    format: 'PDF',
    size: '5.7 Mo',
    date: 'Février 2024',
    downloadCount: '2.1k'
  },
  {
    id: 'rep-3',
    title: 'Panorama des investissements chinois en Afrique du Nord',
    format: 'PDF',
    size: '6.1 Mo',
    date: 'Mars 2024',
    downloadCount: '4.5k'
  }
];

export const eventsData: EventItem[] = [
  {
    id: 'ev-1',
    day: '28',
    month: 'MAI',
    title: 'Webinaire : Réussir son importation depuis la Chine',
    location: 'En ligne',
    time: '16:00 (GMT+1)',
    isOnline: true
  },
  {
    id: 'ev-2',
    day: '12',
    month: 'JUIN',
    title: 'Forum d’affaires Chine - Tunisie 2024',
    location: 'Tunis, Tunisie',
    time: '09:00 - 18:00',
    isOnline: false
  },
  {
    id: 'ev-3',
    day: '25',
    month: 'JUIN',
    title: 'Atelier : Optimiser sa logistique internationale',
    location: 'En ligne',
    time: '15:00 (GMT+1)',
    isOnline: true
  }
];

export const toolsData: ToolResourceItem[] = [
  {
    id: 'tool-calc',
    title: 'Simulateur de coûts d’importation',
    description: 'Estimez vos coûts de fret, douane et taxes en quelques clics.',
    type: 'Calculateur interactif',
    iconName: 'Calculator',
    actionText: 'Lancer le simulateur'
  },
  {
    id: 'tool-customs',
    title: 'Guide des formalités douanières',
    description: 'Documents, certificats d’origine et procédures par pays.',
    type: 'Fiches pratiques',
    iconName: 'FileText',
    actionText: 'Consulter le guide'
  },
  {
    id: 'tool-directory',
    title: 'Annuaire des experts',
    description: 'Trouvez le bon avocat, transitaire ou interprète rapidement.',
    type: 'Base de données vérifiée',
    iconName: 'Users',
    actionText: 'Accéder à l’annuaire'
  }
];
