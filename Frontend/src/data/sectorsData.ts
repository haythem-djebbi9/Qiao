import agriHeroImg from '../assets/images/agriculture_hero_tractor_tomatoes_1791038528049.jpg';
import oliveOilImg from '../assets/images/olive_oil_export_1790805177453.jpg';
import logistiqueHeroImg from '../assets/images/logistique_hero_port_airplane_1791117964971.jpg';
import logistiquePortImg from '../assets/images/container_port_cargo_1790805153002.jpg';
import industrieHeroImg from '../assets/images/industrial_engineer_machine_1790805190415.jpg';
import carsAutomotiveImg from '../assets/images/automotive_port_cars_1790888307439.jpg';
import electronicsImg from '../assets/images/hightech_electronics_1790888270277.jpg';
import textileImg from '../assets/images/textile_fashion_apparel_1790888282892.jpg';
import constructionMaterialsImg from '../assets/images/construction_materials_1790888295961.jpg';
import techHeroImg from '../assets/images/tech_hero_digital_ai_1791120272815.jpg';
import ecommerceDevicesImg from '../assets/images/ecommerce_devices_marketplace_1790934935730.jpg';
import tourismeHeroImg from '../assets/images/tourisme_hero_mediterranean_1791120978697.jpg';
import tourismeCulturelImg from '../assets/images/tourisme_culturel_ruins_1791120961864.jpg';
import tourismeFormBgImg from '../assets/images/tourisme_form_eljem_travelers_1791120995273.jpg';
import constructionHeroImg from '../assets/images/construction_hero_cranes_1791121225865.jpg';
import constructionSmartCityImg from '../assets/images/construction_smart_city_1791121243322.jpg';
import constructionFormBgImg from '../assets/images/construction_engineer_blueprints_1791121263858.jpg';
import energieHeroImg from '../assets/images/energie_hero_wind_sun_1791122005950.jpg';
import energieFormBgImg from '../assets/images/energie_form_solar_wind_1791122024548.jpg';
import energieSuccessSolarImg from '../assets/images/energie_success_solar_1791122039577.jpg';
import energieSolairePvImg from '../assets/images/energie_solaire_pv_1791122091083.jpg';
import energieH2StorageImg from '../assets/images/energie_h2_storage_1791122054924.jpg';
import energieBessImg from '../assets/images/energie_bess_bess_1791122068768.jpg';
import industrieRobotImg from '../assets/images/industrie_robot_arm_card_1791221523303.jpg';
import santeDoctorImg from '../assets/images/sante_doctor_microscope_card_1791221540419.jpg';

export interface SubSector {
  id: string;
  title: string;
  description: string;
  iconName: string;
  image: string;
}

export interface SectorOpportunity {
  id: string;
  title: string;
  country: string;
  countryCode: 'TN' | 'MA' | 'DZ' | 'EG' | 'LY' | 'CN';
  type: string;
}

export interface SectorService {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface SectorSuccessStory {
  corridor: string; // e.g. "TUNISIE ➔ CHINE"
  title: string;
  description: string;
  image: string;
}

export interface SectorData {
  id: string;
  tag: string;
  title: string;
  subTitle: string;
  heroDescription: string;
  heroSlogan: string;
  heroBg: string;
  heroPills: { label: string; iconName: string }[];
  
  // 4 horizontal pillars
  fourPillars: {
    title: string;
    description: string;
    iconName: string;
  }[];

  // Overview section
  overviewTitle: string;
  overviewDescription: string;
  overviewButtonText: string;
  stats: {
    value: string;
    label: string;
    iconName: string;
  }[];
  quote: string;

  // Sub-sectors
  subSectorsTitle: string;
  subSectors: SubSector[];

  // 3-columns
  opportunities: SectorOpportunity[];
  services: SectorService[];
  successStory: SectorSuccessStory;

  // Bottom form
  formTitle: string;
  formSubtitle: string;
  formBg: string;
  projectTypes: string[];

  // Footer signature
  footerSignature: string;
}

export const SECTORS_LIST: {
  id: string;
  title: string;
  description: string;
  iconName: string;
  image: string;
}[] = [
  {
    id: 'logistique',
    title: 'Commerce & Logistique',
    description: "Import-Export, chaîne d'approvisionnement, logistique, zones franches.",
    iconName: 'Package',
    image: logistiquePortImg,
  },
  {
    id: 'industrie',
    title: 'Industrie & Manufacturing',
    description: 'Automobile, électronique, textile, matériaux de construction, équipements industriels.',
    iconName: 'Settings',
    image: industrieRobotImg,
  },
  {
    id: 'energie',
    title: 'Énergie & Énergies renouvelables',
    description: 'Solaire, éolien, hydrogène, efficacité énergétique.',
    iconName: 'Leaf',
    image: energieHeroImg,
  },
  {
    id: 'construction',
    title: 'Infrastructure & Construction',
    description: 'BTP, villes intelligentes, transport, infrastructures portuaires et ferroviaires.',
    iconName: 'Building2',
    image: constructionHeroImg,
  },
  {
    id: 'agriculture',
    title: 'Agriculture & Agroalimentaire',
    description: 'Produits agricoles, transformation alimentaire, technologies agricoles.',
    iconName: 'Sprout',
    image: agriHeroImg,
  },
  {
    id: 'tech',
    title: 'Technologies & Digital',
    description: 'IA, fintech, e-commerce, télécoms, solutions digitales.',
    iconName: 'Cpu',
    image: techHeroImg,
  },
  {
    id: 'sante',
    title: 'Santé & Sciences de la vie',
    description: 'Pharmaceutique, dispositifs médicaux, biotechnologie, santé digitale.',
    iconName: 'PlusCircle',
    image: santeDoctorImg,
  },
  {
    id: 'tourisme',
    title: 'Tourisme & Culture',
    description: 'Hôtellerie, tourisme durable, industrie culturelle et créative.',
    iconName: 'Sun',
    image: tourismeHeroImg,
  },
];

export const SECTORS_DETAILS: Record<string, SectorData> = {
  // 1. TOURISME & SERVICES
  tourisme: {
    id: 'tourisme',
    tag: 'SECTEUR',
    title: 'Tourisme & Services',
    subTitle: 'Des expériences qui rapprochent les peuples.',
    heroDescription:
      'QIAO facilite les partenariats dans le secteur du tourisme et des services entre la Chine et l’Afrique du Nord pour développer des destinations attractives, des infrastructures modernes et des services de qualité, créant ainsi des opportunités économiques durables.',
    heroSlogan: 'Des destinations touristiques, des liens culturels plus forts.',
    heroBg: tourismeHeroImg,
    heroPills: [
      { label: 'Tourisme culturel', iconName: 'Plane' },
      { label: 'Tourisme balnéaire', iconName: 'Sun' },
      { label: 'Tourisme patrimonial', iconName: 'Landmark' },
      { label: 'Écotourisme', iconName: 'Leaf' },
      { label: 'Hôtellerie & restauration', iconName: 'ConciergeBell' },
      { label: 'Services aux voyageurs', iconName: 'Settings' },
      { label: 'Événements & MICE', iconName: 'Users' },
      { label: 'Économie créative', iconName: 'Heart' },
    ],
    fourPillars: [
      {
        title: 'Des visiteurs plus nombreux',
        description: 'Développer des destinations attractives pour les marchés de la Chine et du monde.',
        iconName: 'Users',
      },
      {
        title: 'Des investissements durables',
        description: 'Des infrastructures et des services de qualité pour une croissance à long terme.',
        iconName: 'TrendingUp',
      },
      {
        title: 'Des échanges culturels',
        description: 'Renforcer la compréhension et l’amitié entre les peuples.',
        iconName: 'Handshake',
      },
      {
        title: 'Un tourisme responsable',
        description: 'Préserver le patrimoine naturel et culturel pour les générations futures.',
        iconName: 'Leaf',
      },
    ],
    overviewTitle: 'Un secteur à fort potentiel',
    overviewDescription:
      'L’Afrique du Nord possède un patrimoine naturel, culturel et historique exceptionnel. Grâce à des partenariats stratégiques avec la Chine, nous pouvons développer des infrastructures touristiques modernes, diversifier l’offre de services et attirer plus de visiteurs, tout en créant des emplois et en soutenant les économies locales.',
    overviewButtonText: 'En savoir plus sur notre approche',
    stats: [
      { value: '150 Md $', label: 'de marché mondial du tourisme (en 2023)', iconName: 'Briefcase' },
      { value: '+1,4 Md', label: 'de touristes internationaux (en 2023)', iconName: 'Users' },
      { value: '6', label: "pays d'Afrique du Nord couverts", iconName: 'Globe' },
      { value: '100+', label: 'projets et opportunités identifiés', iconName: 'FileText' },
    ],
    quote:
      'Le tourisme est plus qu’un voyage, c’est un pont entre les cultures, une source d’opportunités et un moteur de développement durable.',
    subSectorsTitle: 'Sous-secteurs clés',
    subSectors: [
      {
        id: 't-culturel',
        title: 'Tourisme culturel',
        description: 'Sites historiques, musées, circuits culturels',
        iconName: 'Landmark',
        image: tourismeCulturelImg,
      },
      {
        id: 't-balneaire',
        title: 'Tourisme balnéaire',
        description: 'Stations côtières, resorts, activités nautiques',
        iconName: 'Sun',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 't-patrimonial',
        title: 'Tourisme patrimonial',
        description: 'Médinas, patrimoine UNESCO, tourisme religieux',
        iconName: 'ImageIcon',
        image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 't-eco',
        title: 'Écotourisme',
        description: 'Parcs naturels, randonnées, tourisme durable',
        iconName: 'Leaf',
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 't-hotel',
        title: 'Hôtellerie & restauration',
        description: 'Hôtels, resorts, gastronomie locale et internationale',
        iconName: 'ConciergeBell',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 't-mice',
        title: 'Événements & MICE',
        description: 'Congrès, salons, voyages d’affaires, incentives',
        iconName: 'Users',
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
      },
    ],
    opportunities: [
      { id: 'op1', title: "Développement d’un resort balnéaire à Djerba", country: 'Tunisie', countryCode: 'TN', type: 'Investissement' },
      { id: 'op2', title: 'Rénovation de sites patrimoniaux', country: 'Maroc', countryCode: 'MA', type: 'Partenariat' },
      { id: 'op3', title: "Écotourisme dans le parc de l’Ahaggar", country: 'Algérie', countryCode: 'DZ', type: 'Développement durable' },
      { id: 'op4', title: 'Chaîne hôtelière en Afrique du Nord', country: 'Égypte', countryCode: 'EG', type: 'Investissement' },
      { id: 'op5', title: 'Centre de congrès international à Tunis', country: 'Tunisie', countryCode: 'TN', type: 'Infrastructure' },
    ],
    services: [
      { id: 's1', title: 'Identification de partenaires', description: 'Investisseurs, opérateurs, institutions', iconName: 'Search' },
      { id: 's2', title: 'Études de marché', description: 'Analyse des tendances touristiques et des segments porteurs', iconName: 'FileText' },
      { id: 's3', title: 'Mise en relation qualifiée', description: 'Rencontres B2B et accompagnement', iconName: 'Users' },
      { id: 's4', title: 'Appui au financement', description: 'Conseils sur les financements et les aides', iconName: 'Settings' },
      { id: 's5', title: 'Veille stratégique', description: 'Suivi des projets et des appels d’offres', iconName: 'TrendingUp' },
    ],
    successStory: {
      corridor: 'TUNISIE ➔ CHINE',
      title: 'Un partenariat pour faire rayonner Djerba',
      description:
        'Grâce à l’accompagnement de QIAO, un investisseur chinois et un groupe hôtelier tunisien ont développé un resort haut de gamme à Djerba, créant plus de 300 emplois et attirant des milliers de visiteurs internationaux.',
      image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
    },
    formTitle: 'Vous avez un projet touristique ?',
    formSubtitle: 'Notre équipe est à votre écoute pour identifier les meilleures opportunités et vous accompagner à chaque étape.',
    formBg: tourismeFormBgImg,
    projectTypes: ['Investissement hôtelier', 'Agence de voyages & MICE', 'Écotourisme', 'Rénovation patrimoniale', 'Autre projet'],
    footerSignature: 'Découvrir Partager Bâtir ensemble un avenir plus fort.',
  },

  // 2. TECHNOLOGIES & DIGITAL
  tech: {
    id: 'tech',
    tag: 'SECTEUR',
    title: 'Technologies & Digital',
    subTitle: 'Des innovations d’aujourd’hui pour un avenir partagé.',
    heroDescription:
      'QIAO connecte les acteurs de la tech entre la Chine et l’Afrique du Nord pour développer des partenariats stratégiques dans l’intelligence artificielle, le cloud souverain, les télécommunications 5G, l’e-commerce et les solutions fintech innovantes.',
    heroSlogan: 'Des idées sans frontières pour un monde plus connecté.',
    heroBg: techHeroImg,
    heroPills: [
      { label: 'Intelligence artificielle', iconName: 'Cpu' },
      { label: 'Cloud & Data Centers', iconName: 'Cloud' },
      { label: 'Télécommunications & 5G', iconName: 'Radio' },
      { label: 'E-commerce & Marketplaces', iconName: 'ShoppingCart' },
      { label: 'Fintech & Paiement digital', iconName: 'CreditCard' },
      { label: 'Smart Cities & IoT', iconName: 'Building2' },
      { label: 'Startups & Deeptech', iconName: 'Rocket' },
    ],
    fourPillars: [
      {
        title: 'Un écosystème en pleine expansion',
        description: 'Des hubs technologiques dynamiques, incubateurs et marchés ultra-complémentaires.',
        iconName: 'Lightbulb',
      },
      {
        title: 'Des talents et ingénieurs d’élite',
        description: 'Une jeunesse qualifiée, multilingue et des opportunités majeures de R&D conjointe.',
        iconName: 'TrendingUp',
      },
      {
        title: 'Un réseau international d’envergure',
        description: 'Leaders tech de Shenzhen/Beijing, investisseurs VC et institutions publiques connectés.',
        iconName: 'Users',
      },
      {
        title: 'Un impact durable & souverain',
        description: 'Des solutions numériques favorisant la croissance inclusive et la modernisation des États.',
        iconName: 'Leaf',
      },
    ],
    overviewTitle: 'Un secteur moteur de l’économie de demain',
    overviewDescription:
      'La Chine est un géant mondial de l’innovation technologique, leader en IA, brevets et infrastructures numériques. L’Afrique du Nord dispose d’un vivier exceptionnel d’ingénieurs, d’une position géographique charnière et d’une forte adoption du digital. Ensemble, nous créons des ponts technologiques concrets, du prototypage jusqu’au déploiement à grande échelle.',
    overviewButtonText: 'En savoir plus sur notre approche tech',
    stats: [
      { value: '300 Md $', label: 'investissements tech chinois à l’international', iconName: 'TrendingUp' },
      { value: '1,5 Md', label: 'utilisateurs internet en Afrique & Asie connectés', iconName: 'Users' },
      { value: '6', label: "pays d’Afrique du Nord couverts par nos corridors", iconName: 'Globe' },
      { value: '200+', label: 'partenariats technologiques & deals identifiés', iconName: 'Rocket' },
    ],
    quote:
      'La technologie n’a de véritable valeur que lorsqu’elle rapproche les peuples, favorise le partage des connaissances et crée des opportunités concrètes pour tous.',
    subSectorsTitle: 'Sous-secteurs clés',
    subSectors: [
      {
        id: 'tech-ia',
        title: 'Intelligence Artificielle & Big Data',
        description: 'Algorithmes prédictifs, vision par ordinateur, LLM, automatisation industrielle',
        iconName: 'Cpu',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'tech-cloud',
        title: 'Cloud & Infrastructure Data',
        description: 'Data centers éco-efficients, cloud souverain, cybersécurité et stockage distribué',
        iconName: 'Cloud',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'tech-telecom',
        title: 'Télécoms, Fibre & Réseaux 5G',
        description: 'Déploiement fibre optique, tours télécoms, 5G industrielle, connectivité rurale',
        iconName: 'Radio',
        image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'tech-ecom',
        title: 'E-commerce & Logistique Digitale',
        description: 'Plateformes transfrontalières B2B, traçabilité et intégration des paiements mobiles',
        iconName: 'ShoppingCart',
        image: ecommerceDevicesImg,
      },
      {
        id: 'tech-fintech',
        title: 'Fintech & Solutions de Paiement',
        description: 'Inclusion financière, microcrédit, portefeuilles électroniques, passerelles bilatérales',
        iconName: 'CreditCard',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'tech-smart',
        title: 'Smart Cities & IoT Urbain',
        description: 'Systèmes de transport intelligents, capteurs connectés, gestion automatisée de l’énergie',
        iconName: 'Building2',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      },
    ],
    opportunities: [
      { id: 'tech-op1', title: 'Plateforme e-commerce B2B Chine - Afrique du Nord', country: 'Tunisie', countryCode: 'TN', type: 'E-commerce' },
      { id: 'tech-op2', title: "Centre d'excellence & R&D en Intelligence Artificielle", country: 'Maroc', countryCode: 'MA', type: 'Partenariat' },
      { id: 'tech-op3', title: 'Data Center régional & Infrastructure Cloud souverain', country: 'Algérie', countryCode: 'DZ', type: 'Investissement' },
      { id: 'tech-op4', title: "Passerelle Fintech transfrontalière et micro-paiements", country: 'Égypte', countryCode: 'EG', type: 'Fintech' },
      { id: 'tech-op5', title: 'Réseaux 5G campus industriel & IoT logistique', country: 'Libye', countryCode: 'LY', type: 'Télécoms' },
    ],
    services: [
      { id: 'ts1', title: 'Identification de partenaires tech', description: 'Startups, licornes chinoises, intégrateurs et fonds VC', iconName: 'Search' },
      { id: 'ts2', title: 'Analyses technologiques & benchmarks', description: 'Études de faisabilité, conformité réglementaire & data privacy', iconName: 'FileText' },
      { id: 'ts3', title: 'Mise en relation qualifiée B2B', description: 'Rencontres bilatérales, missions tech en Chine et Afrique du Nord', iconName: 'Users' },
      { id: 'ts4', title: 'Levée de fonds & co-investissement', description: 'Conseils stratégiques et accès aux fonds de capital-risque', iconName: 'Settings' },
      { id: 'ts5', title: 'Transfert technologique & IP', description: 'Licensing, brevets, accélération et incubation conjointe', iconName: 'TrendingUp' },
    ],
    successStory: {
      corridor: 'TUNISIE ➔ CHINE',
      title: "Une startup IA tunisienne s'associe à un géant tech de Shenzhen",
      description:
        "Grâce à l'accompagnement de QIAO, une pépite technologique tunisienne experte en computer vision et traitement du langage a conclu un partenariat de codéveloppement avec un leader technologique de Shenzhen, levant 3,2M$ pour déployer sa solution à l'échelle pan-africaine.",
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    },
    formTitle: 'Vous avez un projet technologique ou digital ?',
    formSubtitle: 'Notre équipe et notre réseau d’experts tech sino-africains sont à votre disposition pour identifier les meilleures synergies.',
    formBg: electronicsImg,
    projectTypes: [
      'Intelligence Artificielle & Big Data',
      'Développement Plateforme E-commerce',
      'Fintech, Paiement & Microcrédit',
      'Infrastructure Télécom, Fibre & 5G',
      'Cloud Souverain & Cybersécurité',
      'Smart City & IoT Industriel',
      'Autre projet tech',
    ],
    footerSignature: 'Bâtir ensemble l’autoroute numérique entre la Chine et l’Afrique du Nord.',
  },

  // 3. SANTÉ & PHARMA
  sante: {
    id: 'sante',
    tag: 'SECTEUR',
    title: 'Santé & Pharma',
    subTitle: 'Des partenariats pour une meilleure santé et un avenir plus sain.',
    heroDescription:
      'QIAO rapproche les acteurs de la santé entre la Chine et l’Afrique du Nord pour développer des partenariats dans les médicaments, les dispositifs médicaux, la biotechnologie et les infrastructures de santé, et améliorer l’accès aux soins pour tous.',
    heroSlogan: 'Des solutions de santé pour des sociétés plus résilientes.',
    heroBg: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1920&q=85',
    heroPills: [
      { label: 'Médicaments génériques', iconName: 'Pill' },
      { label: 'Dispositifs médicaux', iconName: 'Stethoscope' },
      { label: 'Biotechnologie', iconName: 'Dna' },
      { label: 'Santé digitale (e-santé)', iconName: 'Activity' },
      { label: 'Infrastructures hospitalières', iconName: 'Building2' },
      { label: 'Recherche & innovation', iconName: 'Microscope' },
      { label: 'Formation médicale', iconName: 'GraduationCap' },
      { label: 'Accès aux soins', iconName: 'Heart' },
    ],
    fourPillars: [
      {
        title: 'Une demande croissante',
        description: 'Des besoins de santé en forte augmentation en Afrique du Nord.',
        iconName: 'HeartPulse',
      },
      {
        title: 'Des opportunités concrètes',
        description: 'Des projets dans la production, la distribution et les infrastructures.',
        iconName: 'TrendingUp',
      },
      {
        title: 'Un réseau de partenaires',
        description: 'Entreprises, institutions de santé, chercheurs et investisseurs.',
        iconName: 'Users',
      },
      {
        title: 'Un impact durable',
        description: 'Une meilleure santé pour des populations plus fortes et plus productives.',
        iconName: 'Leaf',
      },
    ],
    overviewTitle: 'Un secteur vital pour le développement',
    overviewDescription:
      'L’accès à des soins de qualité est un pilier essentiel du développement humain. Grâce à des partenariats stratégiques avec la Chine, l’Afrique du Nord peut renforcer ses capacités de production pharmaceutique, moderniser ses infrastructures de santé et adopter des technologies médicales innovantes pour répondre aux besoins de ses populations.',
    overviewButtonText: 'En savoir plus sur notre approche',
    stats: [
      { value: '200 Md $', label: 'de marché pharmaceutique en Afrique (2023)', iconName: 'Pill' },
      { value: '+600', label: 'millions d’habitants à servir en Afrique', iconName: 'Users' },
      { value: '6', label: "pays d'Afrique du Nord couverts", iconName: 'Globe' },
      { value: '120+', label: 'projets et opportunités identifiés', iconName: 'FileText' },
    ],
    quote:
      'Investir dans la santé, c’est investir dans des sociétés plus fortes et plus prospères.',
    subSectorsTitle: 'Sous-secteurs clés',
    subSectors: [
      {
        id: 'sante-med',
        title: 'Médicaments génériques',
        description: 'Production, distribution et accès aux traitements',
        iconName: 'Pill',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sante-disp',
        title: 'Dispositifs médicaux',
        description: 'Équipements hospitaliers, diagnostics, imagerie',
        iconName: 'Stethoscope',
        image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sante-biotech',
        title: 'Biotechnologie',
        description: 'Vaccins, thérapies innovantes, recherche clinique',
        iconName: 'Dna',
        image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sante-digital',
        title: 'Santé digitale',
        description: 'Télémédecine, dossiers médicaux électroniques, solutions IA',
        iconName: 'Activity',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sante-hosp',
        title: 'Infrastructures hospitalières',
        description: 'Hôpitaux, cliniques, centres spécialisés',
        iconName: 'Building2',
        image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sante-form',
        title: 'Formation médicale',
        description: 'Renforcement des compétences et échanges académiques',
        iconName: 'GraduationCap',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      },
    ],
    opportunities: [
      { id: 'sante-op1', title: 'Usine de production de médicaments génériques', country: 'Tunisie', countryCode: 'TN', type: 'Partenariat industriel' },
      { id: 'sante-op2', title: 'Distribution de dispositifs médicaux', country: 'Maroc', countryCode: 'MA', type: 'Santé' },
      { id: 'sante-op3', title: 'Centre de recherche en biotechnologie', country: 'Algérie', countryCode: 'DZ', type: 'Innovation' },
      { id: 'sante-op4', title: "Modernisation d'un hôpital régional", country: 'Égypte', countryCode: 'EG', type: 'Infrastructure' },
      { id: 'sante-op5', title: 'Plateforme de télémédecine nationale', country: 'Libye', countryCode: 'LY', type: 'E-santé' },
    ],
    services: [
      { id: 'ss1', title: 'Identification de partenaires', description: 'Laboratoires, hôpitaux, investisseurs', iconName: 'Search' },
      { id: 'ss2', title: 'Études de marché', description: 'Analyse des besoins et des tendances', iconName: 'FileText' },
      { id: 'ss3', title: 'Mise en relation qualifiée', description: 'Rencontres B2B et accompagnement', iconName: 'Users' },
      { id: 'ss4', title: 'Appui au financement', description: 'Conseils sur les financements et aides', iconName: 'Settings' },
      { id: 'ss5', title: 'Veille stratégique', description: 'Suivi des appels d’offres et des réglementations', iconName: 'TrendingUp' },
    ],
    successStory: {
      corridor: 'ALGÉRIE ➔ CHINE',
      title: 'Un hôpital moderne pour une meilleure prise en charge',
      description:
        'Grâce à QIAO, un partenariat entre un groupe hospitalier algérien et une entreprise chinoise a permis la construction d’un hôpital de 300 lits équipé de technologies de pointe, améliorant l’accès aux soins pour plus de 500 000 habitants.',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    },
    formTitle: 'Vous avez un projet dans la santé ?',
    formSubtitle: 'Notre équipe est à votre écoute pour identifier les meilleures opportunités et vous accompagner à chaque étape.',
    formBg: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    projectTypes: ['Production pharmaceutique', 'Dispositifs & Matériel médical', 'Clinique ou hôpital privé', 'Biotechnologie & R&D', 'Télémédecine', 'Autre projet de santé'],
    footerSignature: 'Des partenariats pour une vie meilleure.',
  },

  // 4. LOGISTIQUE & TRANSPORT
  logistique: {
    id: 'logistique',
    tag: 'SECTEUR',
    title: 'Logistique & Transport',
    subTitle: 'Des connexions qui font avancer les économies.',
    heroDescription:
      'QIAO facilite les partenariats dans le secteur de la logistique et du transport entre la Chine et l’Afrique du Nord pour développer des infrastructures efficaces, des chaînes d’approvisionnement résilientes et une connectivité régionale renforcée.',
    heroSlogan: 'Plus qu’un transport, des opportunités sans frontières.',
    heroBg: logistiqueHeroImg,
    heroPills: [
      { label: 'Transport maritime', iconName: 'Anchor' },
      { label: 'Transport aérien', iconName: 'Plane' },
      { label: 'Transport terrestre', iconName: 'Truck' },
      { label: 'Logistique intégrée', iconName: 'Package' },
      { label: 'Chaîne d’approvisionnement', iconName: 'Share2' },
      { label: 'Ports et infrastructures', iconName: 'Building' },
      { label: 'Solutions digitales', iconName: 'Cpu' },
    ],
    fourPillars: [
      {
        title: 'Des routes plus connectées',
        description: 'Faciliter les échanges entre l’Afrique du Nord, la Chine et le reste du monde.',
        iconName: 'Globe',
      },
      {
        title: 'Des opportunités concrètes',
        description: 'Des projets d’infrastructures et de services logistiques.',
        iconName: 'TrendingUp',
      },
      {
        title: 'Un réseau de partenaires',
        description: 'Opérateurs, institutions, investisseurs et experts.',
        iconName: 'Users',
      },
      {
        title: 'Une croissance durable',
        description: 'Des solutions de transport plus vertes et plus intelligentes.',
        iconName: 'Leaf',
      },
    ],
    overviewTitle: 'Un secteur stratégique pour l’intégration régionale',
    overviewDescription:
      'La logistique et le transport sont des leviers essentiels pour renforcer la compétitivité des économies de l’Afrique du Nord. Grâce à des partenariats avec la Chine, la région peut moderniser ses infrastructures, optimiser ses chaînes d’approvisionnement et devenir un hub stratégique entre l’Afrique, l’Europe et l’Asie.',
    overviewButtonText: 'En savoir plus sur notre approche',
    stats: [
      { value: '320 Md $', label: 'de marché mondial de la logistique (en 2023)', iconName: 'Package' },
      { value: '+6%', label: 'de croissance annuelle du secteur', iconName: 'TrendingUp' },
      { value: '6', label: "pays d'Afrique du Nord couverts", iconName: 'Globe' },
      { value: '100+', label: 'projets et opportunités identifiés', iconName: 'Handshake' },
    ],
    quote:
      'Une logistique performante rapproche les marchés, crée des emplois et ouvre de nouvelles perspectives pour les générations futures.',
    subSectorsTitle: 'Sous-secteurs clés',
    subSectors: [
      {
        id: 'log-maritime',
        title: 'Transport maritime',
        description: 'Ports, lignes maritimes, services de fret',
        iconName: 'Anchor',
        image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'log-aerien',
        title: 'Transport aérien',
        description: 'Fret aérien, hubs régionaux, services cargo',
        iconName: 'Plane',
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'log-terrestre',
        title: 'Transport terrestre',
        description: 'Réseaux routiers, transport ferroviaire',
        iconName: 'Truck',
        image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'log-integree',
        title: 'Logistique intégrée',
        description: 'Entrepôts, zones franches, solutions 3PL/4PL',
        iconName: 'Package',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'log-chaine',
        title: 'Chaîne d’approvisionnement',
        description: 'Gestion des flux, traçabilité, optimisation',
        iconName: 'Share2',
        image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'log-ports',
        title: 'Ports et infrastructures',
        description: 'Modernisation portuaire, terminaux, zones logistiques',
        iconName: 'Building',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
      },
    ],
    opportunities: [
      { id: 'log-op1', title: "Extension du port en eau profonde d'Enfidha", country: 'Tunisie', countryCode: 'TN', type: 'Infrastructure portuaire' },
      { id: 'log-op2', title: 'Plateforme logistique Casablanca', country: 'Maroc', countryCode: 'MA', type: 'Zone franche' },
      { id: 'log-op3', title: 'Ligne ferroviaire minérale est-ouest', country: 'Algérie', countryCode: 'DZ', type: 'Transport ferroviaire' },
      { id: 'log-op4', title: 'Modernisation des terminaux de conteneurs', country: 'Égypte', countryCode: 'EG', type: 'Infrastructure portuaire' },
      { id: 'log-op5', title: 'Centre logistique régional en Libye', country: 'Libye', countryCode: 'LY', type: 'Transport et entreposage' },
    ],
    services: [
      { id: 'ls1', title: 'Identification de partenaires', description: 'Opérateurs, investisseurs, institutions', iconName: 'Search' },
      { id: 'ls2', title: 'Études de marché', description: 'Analyses sectorielles et réglementaires', iconName: 'FileText' },
      { id: 'ls3', title: 'Mise en relation qualifiée', description: 'Rencontres B2B et accompagnement', iconName: 'Users' },
      { id: 'ls4', title: 'Appui au financement', description: 'Conseils sur les financements et PPP', iconName: 'Settings' },
      { id: 'ls5', title: 'Veille stratégique', description: 'Suivi des projets et des appels d’offres', iconName: 'TrendingUp' },
    ],
    successStory: {
      corridor: 'MAROC ➔ CHINE',
      title: 'Modernisation d’un terminal portuaire à Casablanca',
      description:
        'Grâce à QIAO, un consortium chinois et marocain a conclu un partenariat pour moderniser un terminal à conteneurs, augmentant la capacité de traitement de 40% et créant plus de 1 000 emplois dans la région.',
      image: logistiquePortImg,
    },
    formTitle: 'Vous avez un projet logistique ?',
    formSubtitle: 'Notre équipe est à votre écoute pour identifier les meilleures opportunités et vous accompagner à chaque étape.',
    formBg: logistiquePortImg,
    projectTypes: ['Fret maritime Chine-Maghreb', 'Entrepôt & Zone Franche', 'Transport multimodal', 'Dédouanement & Transit', 'Terminal logistique'],
    footerSignature: 'Des connexions pour des horizons plus proches.',
  },

  // 5. INDUSTRIE & MANUFACTURING
  industrie: {
    id: 'industrie',
    tag: 'SECTEUR',
    title: 'Industrie & Manufacturing',
    subTitle: 'Des partenariats industriels pour un avenir plus compétitif.',
    heroDescription:
      'QIAO facilite les partenariats industriels entre la Chine et l’Afrique du Nord pour développer des capacités de production, transférer des technologies et créer de la valeur locale.',
    heroSlogan: 'Des industries plus fortes pour demain.',
    heroBg: industrieHeroImg,
    heroPills: [
      { label: 'Innovation', iconName: 'Lightbulb' },
      { label: 'Compétitivité', iconName: 'TrendingUp' },
      { label: 'Transfert de technologie', iconName: 'Share2' },
      { label: 'Production locale', iconName: 'Factory' },
      { label: 'Chaînes de valeur', iconName: 'Link' },
      { label: 'Emplois durables', iconName: 'Users' },
    ],
    fourPillars: [
      {
        title: 'Un écosystème industriel connecté',
        description: 'Entreprises, investisseurs et institutions des deux rives.',
        iconName: 'Share2',
      },
      {
        title: 'Des technologies de pointe',
        description: 'Accès aux dernières innovations industrielles.',
        iconName: 'Cpu',
      },
      {
        title: 'Un accompagnement expert',
        description: 'De l’identification des partenaires à la mise en œuvre.',
        iconName: 'Users',
      },
      {
        title: 'Un impact réel',
        description: 'Plus d’emplois, plus de valeur locale et une industrie durable.',
        iconName: 'Leaf',
      },
    ],
    overviewTitle: 'Un secteur clé pour des économies plus résilientes',
    overviewDescription:
      'L’industrie est un moteur de croissance, d’innovation et d’emploi. Grâce à des partenariats stratégiques avec la Chine, l’Afrique du Nord peut renforcer ses capacités industrielles, moderniser ses infrastructures et intégrer des chaînes de valeur régionales et mondiales.',
    overviewButtonText: 'En savoir plus sur notre vision',
    stats: [
      { value: '1,5 Md $', label: 'd’investissements potentiels', iconName: 'TrendingUp' },
      { value: '200+', label: 'entreprises chinoises partenaires', iconName: 'Users' },
      { value: '6', label: "pays d'Afrique du Nord couverts", iconName: 'Globe' },
      { value: '50+', label: 'projets industriels identifiés', iconName: 'Settings' },
    ],
    quote: 'Une industrie plus forte, c’est des sociétés plus prospères.',
    subSectorsTitle: 'Sous-secteurs industriels',
    subSectors: [
      {
        id: 'ind-auto',
        title: 'Automobile',
        description: 'Assemblage, pièces, mobilité électrique',
        iconName: 'Car',
        image: carsAutomotiveImg,
      },
      {
        id: 'ind-elec',
        title: 'Électronique',
        description: 'Composants, assemblage, solutions high-tech',
        iconName: 'Cpu',
        image: electronicsImg,
      },
      {
        id: 'ind-textile',
        title: 'Textile & Habillement',
        description: 'Production, transformation, design',
        iconName: 'Shirt',
        image: textileImg,
      },
      {
        id: 'ind-mat',
        title: 'Matériaux de construction',
        description: 'Ciment, acier, céramique, matériaux innovants',
        iconName: 'Building2',
        image: constructionMaterialsImg,
      },
      {
        id: 'ind-agro',
        title: 'Agro-industrie',
        description: 'Transformation alimentaire, emballage',
        iconName: 'Settings',
        image: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'ind-vertes',
        title: 'Industries vertes',
        description: 'Solutions industrielles durables et bas carbone',
        iconName: 'Leaf',
        image: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=600&q=80',
      },
    ],
    opportunities: [
      { id: 'ind-op1', title: 'Implantation d’une unité de composants automobiles', country: 'Tunisie', countryCode: 'TN', type: 'Automobile' },
      { id: 'ind-op2', title: 'Production de panneaux solaires', country: 'Maroc', countryCode: 'MA', type: 'Énergies renouvelables' },
      { id: 'ind-op3', title: 'Partenariat pour une usine de matériel électronique', country: 'Algérie', countryCode: 'DZ', type: 'Électronique' },
      { id: 'ind-op4', title: 'Production de matériaux de construction', country: 'Égypte', countryCode: 'EG', type: 'Ciment & céramique' },
      { id: 'ind-op5', title: 'Sous-traitance textile pour l’export', country: 'Chine — Tunisie', countryCode: 'CN', type: 'Textile' },
    ],
    services: [
      { id: 'is1', title: 'Identification de partenaires', description: 'Fabricants, investisseurs, fournisseurs', iconName: 'Search' },
      { id: 'is2', title: 'Études de faisabilité', description: 'Analyses techniques et économiques', iconName: 'FileText' },
      { id: 'is3', title: 'Mise en relation qualifiée', description: 'Rencontres B2B et accompagnement', iconName: 'Users' },
      { id: 'is4', title: 'Appui à l’implantation', description: 'Conseils réglementaires et logistiques', iconName: 'Settings' },
      { id: 'is5', title: 'Suivi et développement', description: 'Accès aux marchés et financement', iconName: 'TrendingUp' },
    ],
    successStory: {
      corridor: 'MAROC ➔ CHINE',
      title: 'Une unité de pièces automobiles au Maroc',
      description:
        'Grâce à QIAO, un fabricant chinois de pièces automobiles a établi une unité de production au Maroc, créant plus de 300 emplois et approvisionnant le marché européen.',
      image: carsAutomotiveImg,
    },
    formTitle: 'Vous avez un projet industriel ?',
    formSubtitle: 'Notre équipe est à votre écoute pour identifier les meilleures opportunités et vous accompagner à chaque étape.',
    formBg: logistiquePortImg,
    projectTypes: ['Usine de montage automobile', 'Composants électroniques', 'Transformation textile / habillement', 'Ligne de production automatisée', 'Matériaux & Plasturgie'],
    footerSignature: 'Des connexions durables pour une industrie plus forte.',
  },

  // 6. ÉNERGIE & ÉNERGIES RENOUVELABLES
  energie: {
    id: 'energie',
    tag: 'SECTEUR',
    title: 'Énergie & Énergies renouvelables',
    subTitle: 'Des partenariats pour une transition énergétique durable.',
    heroDescription:
      'QIAO connecte les acteurs de l’énergie entre la Chine et l’Afrique du Nord pour développer des projets durables, partager des technologies avancées et accélérer la transition vers une économie verte.',
    heroSlogan: 'Une énergie plus propre pour demain.',
    heroBg: energieHeroImg,
    heroPills: [
      { label: 'Énergie solaire', iconName: 'Leaf' },
      { label: 'Énergie éolienne', iconName: 'Wind' },
      { label: 'Hydrogène vert', iconName: 'H2' },
      { label: 'Stockage d’énergie', iconName: 'BatteryCharging' },
      { label: 'Réseaux & infrastructure', iconName: 'Zap' },
      { label: 'Efficacité énergétique', iconName: 'Leaf' },
    ],
    fourPillars: [
      {
        title: 'Une transition nécessaire',
        description: 'Répondre aux besoins énergétiques d’aujourd’hui et de demain.',
        iconName: 'Leaf',
      },
      {
        title: 'Des investissements stratégiques',
        description: 'Des projets à fort impact économique et environnemental.',
        iconName: 'TrendingUp',
      },
      {
        title: 'Un réseau international',
        description: 'Entreprises, gouvernements, institutions, investisseurs.',
        iconName: 'Users',
      },
      {
        title: 'Un avenir durable',
        description: 'Des solutions pour des sociétés plus résilientes et plus vertes.',
        iconName: 'Sprout',
      },
    ],
    overviewTitle: 'Un secteur clé pour un avenir durable',
    overviewDescription:
      'L’Afrique du Nord dispose d’un potentiel énergétique exceptionnel, notamment solaire et éolien. La Chine, leader mondial des technologies et des infrastructures énergétiques, est un partenaire naturel pour accompagner la région dans sa transition énergétique. Ensemble, nous créons des opportunités concrètes pour une énergie propre, accessible et compétitive.',
    overviewButtonText: 'En savoir plus sur notre approche',
    stats: [
      { value: '2 000+', label: 'heures d’ensoleillement par an en moyenne', iconName: 'Sun' },
      { value: '100 Md $', label: 'd’investissements prévus d’ici 2030', iconName: 'Coins' },
      { value: '6', label: "pays d'Afrique du Nord couverts", iconName: 'Users' },
      { value: '80+', label: 'projets et opportunités identifiés', iconName: 'FileText' },
    ],
    quote:
      'Les énergies renouvelables sont un pont entre la croissance économique, la sécurité énergétique et la protection de notre planète.',
    subSectorsTitle: 'Sous-secteurs clés',
    subSectors: [
      {
        id: 'en-solaire',
        title: 'Énergie solaire',
        description: 'Centrales solaires, toitures solaires, solutions PV',
        iconName: 'Sun',
        image: energieSolairePvImg,
      },
      {
        id: 'en-eolien',
        title: 'Énergie éolienne',
        description: 'Parcs éoliens onshore et offshore',
        iconName: 'Wind',
        image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'en-h2',
        title: 'Hydrogène vert',
        description: 'Production, stockage et export',
        iconName: 'H2',
        image: energieH2StorageImg,
      },
      {
        id: 'en-stockage',
        title: 'Stockage d’énergie',
        description: 'Batteries, solutions de flexibilité, smart grids',
        iconName: 'BatteryCharging',
        image: energieBessImg,
      },
      {
        id: 'en-reseau',
        title: 'Réseaux & infrastructure',
        description: 'Transport et distribution d’électricité',
        iconName: 'Zap',
        image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'en-efficacite',
        title: 'Efficacité énergétique',
        description: 'Solutions pour l’industrie, le bâtiment et les villes',
        iconName: 'Leaf',
        image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80',
      },
    ],
    opportunities: [
      { id: 'en-op1', title: 'Parc solaire de 500 MW', country: 'Tunisie', countryCode: 'TN', type: "Appel d'offres" },
      { id: 'en-op2', title: 'Projet éolien offshore', country: 'Maroc', countryCode: 'MA', type: 'Partenariat' },
      { id: 'en-op3', title: 'Production d’hydrogène vert', country: 'Algérie', countryCode: 'DZ', type: 'Investissement' },
      { id: 'en-op4', title: 'Modernisation du réseau électrique', country: 'Égypte', countryCode: 'EG', type: 'Coopération technique' },
      { id: 'en-op5', title: 'Solutions de stockage d’énergie', country: 'Libye', countryCode: 'LY', type: 'Fournisseurs et partenaires' },
    ],
    services: [
      { id: 'es1', title: 'Identification de partenaires', description: 'Producteurs, investisseurs, fournisseurs', iconName: 'Search' },
      { id: 'es2', title: 'Études de faisabilité', description: 'Analyses techniques, économiques et environnementales', iconName: 'FileText' },
      { id: 'es3', title: 'Appui au financement', description: 'Mise en relation avec des institutions et fonds d’investissement', iconName: 'ShieldCheck' },
      { id: 'es4', title: 'Accompagnement réglementaire', description: 'Conseils juridiques et administratifs', iconName: 'FileCheck' },
      { id: 'es5', title: 'Veille stratégique', description: 'Suivi des appels d’offres et des projets', iconName: 'TrendingUp' },
    ],
    successStory: {
      corridor: 'TUNISIE ➔ CHINE',
      title: 'Une centrale solaire pour un avenir plus vert',
      description:
        'Avec l’accompagnement de QIAO, un consortium chinois et tunisien a développé une centrale solaire de 200 MW, contribuant à la sécurité énergétique du pays et à la réduction des émissions de CO2.',
      image: energieSuccessSolarImg,
    },
    formTitle: 'Vous avez un projet dans l’énergie ?',
    formSubtitle: 'Notre équipe est à votre écoute pour identifier les meilleures opportunités et vous accompagner à chaque étape.',
    formBg: energieFormBgImg,
    projectTypes: ['Centrale solaire PV', 'Parc éolien terrestre/côtier', 'Projet Hydrogène Vert', 'Batteries & Systèmes BESS', 'Réseau & Câblage HV', 'Autre projet d’énergie'],
    footerSignature: 'Des connexions pour un monde plus durable.',
  },

  // 7. CONSTRUCTION & IMMOBILIER
  construction: {
    id: 'construction',
    tag: 'SECTEUR',
    title: 'Construction & Immobilier',
    subTitle: 'Bâtir aujourd’hui les villes de demain.',
    heroDescription:
      'QIAO connecte les acteurs de la construction et de l’immobilier entre la Chine et l’Afrique du Nord pour développer des projets durables, innovants et inclusifs.',
    heroSlogan: 'Des infrastructures durables pour des communautés plus fortes.',
    heroBg: constructionHeroImg,
    heroPills: [
      { label: 'Bâtiments résidentiels', iconName: 'Home' },
      { label: 'Bâtiments commerciaux', iconName: 'Building2' },
      { label: 'Infrastructures publiques', iconName: 'Landmark' },
      { label: 'Construction durable', iconName: 'Leaf' },
      { label: 'Matériaux innovants', iconName: 'Settings' },
      { label: 'Ingénierie & conseil', iconName: 'HardHat' },
      { label: 'Villes intelligentes', iconName: 'Building' },
    ],
    fourPillars: [
      {
        title: 'Des projets à fort potentiel',
        description: 'Répondre aux besoins croissants en logements, infrastructures et espaces urbains.',
        iconName: 'TrendingUp',
      },
      {
        title: 'Des partenaires fiables',
        description: 'Entreprises, investisseurs et institutions des deux rives.',
        iconName: 'Handshake',
      },
      {
        title: 'Une approche durable',
        description: 'Des constructions plus vertes et plus résilientes.',
        iconName: 'Leaf',
      },
      {
        title: 'Un impact régional',
        description: 'Des villes plus inclusives pour une meilleure qualité de vie.',
        iconName: 'Users',
      },
    ],
    overviewTitle: 'Un secteur en pleine transformation',
    overviewDescription:
      'L’Afrique du Nord connaît une forte demande en infrastructures et en logements, portée par l’urbanisation, la croissance démographique et les grands projets d’aménagement. La Chine apporte son expertise, ses capacités de financement et ses technologies avancées pour soutenir des projets de construction modernes, durables et compétitifs.',
    overviewButtonText: 'En savoir plus sur notre approche',
    stats: [
      { value: '1 000 Md $', label: 'de besoins en infrastructures en Afrique d’ici 2030', iconName: 'TrendingUp' },
      { value: '+300', label: 'entreprises chinoises actives dans la construction à l’international', iconName: 'Users' },
      { value: '6', label: "pays d'Afrique du Nord couverts", iconName: 'Globe' },
      { value: '150+', label: 'projets et opportunités identifiés', iconName: 'FileText' },
    ],
    quote:
      'Des infrastructures modernes ne sont pas seulement des bâtiments, mais des opportunités pour des sociétés plus prospères.',
    subSectorsTitle: 'Sous-secteurs clés',
    subSectors: [
      {
        id: 'c-residentiel',
        title: 'Logement résidentiel',
        description: 'Projets résidentiels, logements sociaux, smart housing',
        iconName: 'Home',
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'c-commercial',
        title: 'Immobilier commercial',
        description: 'Bureaux, centres commerciaux, espaces multi-usages',
        iconName: 'Building2',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'c-publiques',
        title: 'Infrastructures publiques',
        description: 'Routes, ponts, ports, aéroports, réseaux urbains',
        iconName: 'Landmark',
        image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'c-durable',
        title: 'Construction durable',
        description: 'Bâtiments verts, efficacité énergétique, matériaux écologiques',
        iconName: 'Leaf',
        image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'c-materiaux',
        title: 'Matériaux de construction',
        description: 'Ciment, acier, verre, matériaux innovants',
        iconName: 'Settings',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'c-smart',
        title: 'Villes intelligentes',
        description: 'Aménagement urbain, solutions numériques, mobilité durable',
        iconName: 'Building',
        image: constructionSmartCityImg,
      },
    ],
    opportunities: [
      { id: 'c-op1', title: 'Nouveau quartier résidentiel à Tunis', country: 'Tunisie', countryCode: 'TN', type: 'Logement' },
      { id: 'c-op2', title: 'Extension du tramway de Casablanca', country: 'Maroc', countryCode: 'MA', type: 'Infrastructure' },
      { id: 'c-op3', title: 'Projet de ville nouvelle à Sidi Abdellah', country: 'Algérie', countryCode: 'DZ', type: 'Urbanisme' },
      { id: 'c-op4', title: 'Zone économique spéciale à Ain Sokhna', country: 'Égypte', countryCode: 'EG', type: 'Immobilier industriel' },
      { id: 'c-op5', title: 'Modernisation des infrastructures urbaines', country: 'Libye', countryCode: 'LY', type: 'Partenariat public-privé' },
    ],
    services: [
      { id: 'cs1', title: 'Identification de partenaires', description: 'Promoteurs, investisseurs, institutions', iconName: 'Handshake' },
      { id: 'cs2', title: 'Études de marché', description: 'Analyses techniques et réglementaires', iconName: 'FileText' },
      { id: 'cs3', title: 'Mise en relation qualifiée', description: 'Rencontres B2B et accompagnement', iconName: 'Users' },
      { id: 'cs4', title: 'Appui au financement', description: 'Conseils sur les financements et PPP', iconName: 'Settings' },
      { id: 'cs5', title: 'Veille stratégique', description: 'Suivi des appels d’offres et des projets', iconName: 'TrendingUp' },
    ],
    successStory: {
      corridor: 'ALGÉRIE ➔ CHINE',
      title: 'Un éco-quartier durable à Alger',
      description:
        'Avec l’appui de QIAO, un promoteur algérien et une entreprise chinoise ont conclu un partenariat pour la construction d’un éco-quartier de 5 000 logements intégrant des solutions d’efficacité énergétique et des espaces verts.',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    },
    formTitle: 'Vous avez un projet de construction ou immobilier ?',
    formSubtitle: 'Notre équipe est à votre écoute pour identifier les meilleures opportunités et vous accompagner à chaque étape.',
    formBg: constructionFormBgImg,
    projectTypes: ['Complexe résidentiel', 'Centre commercial & Bureaux', 'Infrastructure routière / ponts', 'Fourniture de matériaux de BTP', 'Partenariat PPP'],
    footerSignature: 'Construire ensemble des territoires plus forts.',
  },

  // 8. AGRICULTURE & AGROALIMENTAIRE
  agriculture: {
    id: 'agriculture',
    tag: 'SECTEUR',
    title: 'Agriculture & Agroalimentaire',
    subTitle: 'Des terres fertiles. Des partenariats durables. Une sécurité alimentaire partagée.',
    heroDescription:
      'QIAO connecte les acteurs de l’agriculture et de l’agroalimentaire entre la Chine et l’Afrique du Nord, pour développer des chaînes de valeur durables, innovantes et compétitives.',
    heroSlogan: 'Des récoltes d’aujourd’hui, des opportunités de demain.',
    heroBg: agriHeroImg,
    heroPills: [
      { label: 'Production', iconName: 'Leaf' },
      { label: 'Transformation', iconName: 'Settings' },
      { label: 'Exportation', iconName: 'Globe' },
      { label: 'Innovation', iconName: 'Lightbulb' },
      { label: 'Partenariats', iconName: 'Handshake' },
    ],
    fourPillars: [
      {
        title: 'Un marché à fort potentiel',
        description: 'Une demande mondiale croissante en produits agricoles et alimentaires.',
        iconName: 'Leaf',
      },
      {
        title: 'Des opportunités concrètes',
        description: 'Des projets d’investissement et de partenariat.',
        iconName: 'TrendingUp',
      },
      {
        title: 'Un réseau qualifié',
        description: 'Producteurs, transformateurs, exportateurs, distributeurs.',
        iconName: 'Users',
      },
      {
        title: 'Un développement durable',
        description: 'Pour des filières résilientes et inclusives.',
        iconName: 'Sprout',
      },
    ],
    overviewTitle: 'Un secteur stratégique pour des régions complémentaires',
    overviewDescription:
      'L’Afrique du Nord dispose de terres fertiles, d’un climat diversifié et d’un savoir-faire reconnu. La Chine apporte des technologies avancées, des marchés vastes et une expertise en transformation agroalimentaire. Ensemble, nous créons de nouvelles opportunités pour une agriculture plus productive, plus durable et plus connectée.',
    overviewButtonText: 'En savoir plus sur notre approche',
    stats: [
      { value: '1,2 Md', label: 'de consommateurs en Chine', iconName: 'Users' },
      { value: '+30%', label: 'de la demande alimentaire d’ici 2030', iconName: 'Sprout' },
      { value: '6', label: "pays d'Afrique du Nord couverts", iconName: 'Globe' },
      { value: '100+', label: 'projets et opportunités identifiés', iconName: 'TrendingUp' },
    ],
    quote:
      'L’agriculture est un pont naturel entre nos régions. Elle nourrit les peuples et renforce les liens économiques et humains.',
    subSectorsTitle: 'Sous-secteurs clés',
    subSectors: [
      {
        id: 'ag-olei',
        title: 'Oléiculture',
        description: 'Huile d’olive, olives de table, dérivés',
        iconName: 'Apple',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'ag-fruits',
        title: 'Fruits & Légumes',
        description: 'Agrumes, dattes, fruits frais et transformés',
        iconName: 'Apple',
        image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'ag-tech',
        title: 'Agri-tech & Irrigation',
        description: 'Technologies agricoles, serres, irrigation intelligente',
        iconName: 'Settings',
        image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'ag-cereales',
        title: 'Céréales & Légumineuses',
        description: 'Production, stockage, transformation',
        iconName: 'Wheat',
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'ag-lait',
        title: 'Produits laitiers',
        description: 'Lait, fromages, produits transformés',
        iconName: 'Milk',
        image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'ag-durable',
        title: 'Agriculture durable',
        description: 'Bio, éco-responsable, résiliente au climat',
        iconName: 'Leaf',
        image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
      },
    ],
    opportunities: [
      { id: 'ag-op1', title: 'Partenariat pour une unité de transformation de dattes', country: 'Tunisie', countryCode: 'TN', type: 'Investissement' },
      { id: 'ag-op2', title: 'Exportation d’huile d’olive vers la Chine', country: 'Maroc', countryCode: 'MA', type: 'Exportation' },
      { id: 'ag-op3', title: 'Projet de serres intelligentes', country: 'Algérie', countryCode: 'DZ', type: 'Technologie' },
      { id: 'ag-op4', title: 'Distribution de produits agroalimentaires nord-africains', country: 'Chine', countryCode: 'CN', type: 'Partenariat' },
    ],
    services: [
      { id: 'as1', title: 'Identification de partenaires', description: 'Producteurs, investisseurs, distributeurs', iconName: 'Settings' },
      { id: 'as2', title: 'Études de marché', description: 'Analyses sectorielles et réglementaires', iconName: 'FileText' },
      { id: 'as3', title: 'Mise en relation qualifiée', description: 'Rencontres B2B et accompagnement', iconName: 'Users' },
      { id: 'as4', title: 'Appui à l’export', description: 'Conseils logistiques et réglementaires', iconName: 'ShieldCheck' },
      { id: 'as5', title: 'Veille et opportunités', description: 'Appels d’offres, projets, financements', iconName: 'Search' },
    ],
    successStory: {
      corridor: 'TUNISIE ➔ CHINE',
      title: 'L’huile d’olive tunisienne sur le marché chinois',
      description:
        'Grâce à l’accompagnement de QIAO, un producteur tunisien a conclu un accord de distribution avec un partenaire chinois, ouvrant la voie à une présence durable sur le marché asiatique.',
      image: oliveOilImg,
    },
    formTitle: 'Parlons de vos projets agricoles',
    formSubtitle: 'Notre équipe est à votre écoute pour identifier les meilleures opportunités et vous accompagner à chaque étape.',
    formBg: agriHeroImg,
    projectTypes: ['Exportation agroalimentaire vers la Chine', 'Transformation & Emballage', 'Agri-tech & Serres connectées', 'Oléiculture & Produits du terroir', 'Matériel & Équipement agricole'],
    footerSignature: 'Des connexions pour une alimentation durable.',
  },
};

// Aliases for tech sector
SECTORS_DETAILS['technologie'] = SECTORS_DETAILS['tech'];
SECTORS_DETAILS['technologies'] = SECTORS_DETAILS['tech'];
SECTORS_DETAILS['technology'] = SECTORS_DETAILS['tech'];

// Aliases for tourism sector
SECTORS_DETAILS['tourism'] = SECTORS_DETAILS['tourisme'];
SECTORS_DETAILS['tourisme-et-services'] = SECTORS_DETAILS['tourisme'];
SECTORS_DETAILS['tourisme-et-culture'] = SECTORS_DETAILS['tourisme'];
SECTORS_DETAILS['tourisme-culture'] = SECTORS_DETAILS['tourisme'];

// Aliases for construction sector
SECTORS_DETAILS['immobilier'] = SECTORS_DETAILS['construction'];
SECTORS_DETAILS['construction-immobilier'] = SECTORS_DETAILS['construction'];
SECTORS_DETAILS['construction-et-immobilier'] = SECTORS_DETAILS['construction'];

// Aliases for energie sector
SECTORS_DETAILS['energy'] = SECTORS_DETAILS['energie'];
SECTORS_DETAILS['energies'] = SECTORS_DETAILS['energie'];
SECTORS_DETAILS['energies-renouvelables'] = SECTORS_DETAILS['energie'];
SECTORS_DETAILS['energie-et-energies-renouvelables'] = SECTORS_DETAILS['energie'];

// Aliases for sante sector
SECTORS_DETAILS['pharma'] = SECTORS_DETAILS['sante'];
SECTORS_DETAILS['sante-pharma'] = SECTORS_DETAILS['sante'];
SECTORS_DETAILS['sante-et-pharma'] = SECTORS_DETAILS['sante'];
SECTORS_DETAILS['health'] = SECTORS_DETAILS['sante'];
SECTORS_DETAILS['sante-et-sciences-de-la-vie'] = SECTORS_DETAILS['sante'];



