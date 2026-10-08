import { slugify } from '../../common/text';
import { Article } from '../../modules/articles/article.entity';

const IMG = (id: string, w = 400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

type ArticleInput = Omit<Partial<Article>, 'id'> & { id?: string; title: string; summary: string; keyPoints: string[]; content: string[] };

function article(input: ArticleInput): Partial<Article> {
  return { author: 'QIAO Intelligence', ...input, id: input.id ?? slugify(input.title) };
}

export const ARTICLES: Partial<Article>[] = [
  // --- Accueil -------------------------------------------------------------------
  article({
    id: 'art-1',
    title: 'Commerce Chine - Afrique du Nord : Tendances 2024',
    category: 'Macroéconomie',
    publishedAt: '2024-05-12',
    dateLabel: '12 mai 2024',
    readTime: '5 min',
    image: IMG('photo-1460925895917-afdab827c52f'),
    author: 'Département Études Économiques QIAO',
    placements: ['home'],
    summary: 'Les échanges entre la Chine et les pays du Maghreb poursuivent leur croissance, portés par l’industrie, l’énergie et le e-commerce.',
    keyPoints: [
      'Progression à deux chiffres des importations de biens d’équipement chinois.',
      'Montée en puissance des exportations agroalimentaires maghrébines vers la Chine.',
      'Rôle croissant des plateformes numériques dans les flux B2B.',
    ],
    content: [
      'Les échanges économiques et industriels entre la Chine et la région Afrique du Nord connaissent une accélération sans précédent. Dans le cadre des accords bilatéraux et des corridors logistiques modernisés, les entreprises bénéficient désormais de dispositifs incitatifs et d’une fluidification des formalités douanières.',
      'Les biens d’équipement, l’électronique et les matériaux de construction dominent les importations, tandis que les phosphates, l’huile d’olive et les produits de la mer progressent à l’export.',
    ],
    countries: ['Chine', 'Tunisie', 'Algérie', 'Maroc', 'Égypte'],
    analysisType: 'Tendances macro',
  }),
  article({
    id: 'art-2',
    title: 'S’implanter en Tunisie : Guide complet pour les investisseurs',
    category: 'Investissement',
    publishedAt: '2024-05-05',
    dateLabel: '05 mai 2024',
    readTime: '8 min',
    image: IMG('photo-1577962917302-cd874c4e31d2'),
    author: 'Bureau QIAO Tunis',
    placements: ['home'],
    summary: 'Formes juridiques, incitations de la loi sur l’investissement, zones franches et recrutement : la feuille de route pour s’installer en Tunisie.',
    keyPoints: [
      'Régime totalement exportateur et avantages fiscaux de la loi 2016-71.',
      'Guichet unique de la TIA et délais de création réduits.',
      'Main-d’œuvre qualifiée et proximité logistique avec l’Europe.',
    ],
    content: [
      'La Tunisie offre aux investisseurs chinois une porte d’entrée vers l’Europe et l’Afrique grâce à ses accords commerciaux et à ses parcs d’activités économiques de Bizerte et Zarzis.',
      'La création d’une SARL ou d’une SA s’effectue via le guichet unique de l’Agence de promotion de l’industrie, avec un accompagnement possible des équipes QIAO pour les statuts bilingues et l’ouverture des comptes.',
    ],
    countries: ['Tunisie'],
    analysisType: 'Analyses par pays',
  }),
  article({
    id: 'art-3',
    title: 'Les secteurs d’opportunités entre la Chine et l’Afrique du Nord',
    category: 'Opportunités',
    publishedAt: '2024-04-28',
    dateLabel: '28 avril 2024',
    readTime: '6 min',
    image: IMG('photo-1454165804606-c3d57bc86b40'),
    placements: ['home'],
    summary: 'Énergies renouvelables, automobile, agro-industrie et logistique concentrent l’essentiel des nouveaux projets bilatéraux.',
    keyPoints: [
      'Solaire et hydrogène vert : forte complémentarité technologique.',
      'Composants automobiles et véhicules électriques en plein essor au Maroc.',
      'Agro-industrie : demande chinoise en produits premium certifiés.',
    ],
    content: [
      'Les investisseurs chinois privilégient désormais des projets industriels intégrés, associant production locale, transfert de compétences et accès aux marchés tiers.',
      'Pour les entreprises nord-africaines, la Chine représente un marché d’exportation majeur pour les produits agricoles transformés et les ressources minérales valorisées.',
    ],
    countries: ['Chine', 'Maroc', 'Tunisie', 'Algérie', 'Égypte'],
    analysisType: 'Tendances macro',
  }),
  // --- QIAO Intelligence -----------------------------------------------------------
  article({
    id: 'ana-1',
    title: 'Pourquoi la Chine renforce sa présence en Afrique du Nord ?',
    category: 'Géoéconomie',
    publishedAt: '2024-08-10',
    dateLabel: '10 Août 2024',
    readTime: '6 min de lecture',
    image: IMG('photo-1556761175-5973dc0f32e7'),
    placements: ['intelligence'],
    summary: 'Position géographique, accords commerciaux et besoins en infrastructures expliquent l’intérêt stratégique de la Chine pour le Maghreb.',
    keyPoints: [
      'Accès privilégié aux marchés européens et africains.',
      'Projets d’infrastructures portuaires et ferroviaires structurants.',
      'Partenariats industriels dans les batteries et le solaire.',
    ],
    content: [
      'L’Afrique du Nord occupe une position charnière entre l’Europe, l’Afrique subsaharienne et le Moyen-Orient. Pour les entreprises chinoises, s’y implanter permet de produire au plus près de marchés à forte demande.',
      'Les investissements récents dans les gigafactories marocaines, les parcs solaires égyptiens et les zones industrielles algériennes illustrent cette stratégie de long terme.',
    ],
    countries: ['Chine', 'Maroc', 'Égypte', 'Algérie'],
    analysisType: 'Tendances macro',
  }),
  article({
    id: 'ana-2',
    title: 'Les secteurs les plus prometteurs pour 2025',
    category: 'Prospective',
    publishedAt: '2024-08-05',
    dateLabel: '5 Août 2024',
    readTime: '8 min de lecture',
    image: IMG('photo-1551836022-d5d88e9218df'),
    placements: ['intelligence'],
    summary: 'Le classement QIAO des secteurs à plus fort potentiel de croissance pour les partenariats sino-maghrébins.',
    keyPoints: [
      'Énergies renouvelables et stockage en tête du classement.',
      'E-commerce cross-border en forte accélération.',
      'Santé et pharma : relocalisation de la production de génériques.',
    ],
    content: [
      'Notre analyse croise les flux commerciaux, les annonces d’investissement et les politiques publiques des cinq pays d’Afrique du Nord pour identifier les secteurs les plus porteurs.',
      'Les énergies renouvelables, l’e-commerce, l’automobile électrique et la santé ressortent comme les quatre moteurs principaux de la coopération en 2025.',
    ],
    analysisType: 'Prévisions & Scénarios',
  }),
  article({
    id: 'ana-3',
    title: 'Comment réussir un partenariat avec une entreprise chinoise ?',
    category: 'Bonnes pratiques',
    publishedAt: '2024-08-01',
    dateLabel: '1 Août 2024',
    readTime: '5 min de lecture',
    image: IMG('photo-1522071820081-009f0129c71c'),
    placements: ['intelligence'],
    summary: 'Due diligence, contrats bilingues, relation de confiance : les clés d’un partenariat durable.',
    keyPoints: [
      'Vérifier la licence commerciale et l’historique du partenaire.',
      'Prévoir un contrat bilingue avec clause d’arbitrage CIETAC ou CCI.',
      'Investir dans la relation (Guanxi) et la présence terrain.',
    ],
    content: [
      'La réussite d’un partenariat sino-maghrébin repose autant sur la qualité juridique des engagements que sur la compréhension mutuelle des cultures d’affaires.',
      'Les équipes QIAO recommandent d’organiser au moins une visite sur site avant tout engagement significatif et de formaliser chaque étape par écrit dans les deux langues.',
    ],
    analysisType: 'Analyses par pays',
  }),
  // --- Hub Commerce : Analyses -----------------------------------------------------
  article({
    id: 'tendances-ecommerce-afrique-du-nord-2024',
    title: 'Les tendances du e-commerce en Afrique du Nord (2024)',
    category: 'E-commerce & Marchés',
    publishedAt: '2024-09-12',
    dateLabel: '12 Sept. 2024',
    readTime: '6 min de lecture',
    image: 'asset:china_corridor_night_skyline_1790804583067.jpg',
    placements: ['analyses'],
    summary:
      'Une analyse complète des habitudes d’achat numériques, de la pénétration mobile et de l’intégration des plateformes chinoises de cross-border dans les cinq pays nord-africains.',
    keyPoints: [
      'Pénétration mobile dépassant 84% dans les grands centres urbains de Casablanca, Alger, Tunis et Le Caire.',
      'Hausse de 38% des commandes directes B2C et B2B via les marketplaces internationales.',
      'Développement accéléré de solutions de paiement électronique et de conformité douanière simplifiée.',
    ],
    content: [
      'Le commerce électronique entre la Chine et l’Afrique du Nord connaît un tournant décisif. En 2024, le volume des transactions numériques transfrontalières a progressé de plus de 22%, soutenu par une adoption fulgurante du smartphone et une demande insatiable en produits technologiques et équipements spécialisés.',
      'Les entreprises locales tirent parti d’infrastructures logistiques modernisées, notamment à travers les hubs aéroportuaires et portuaires méditerranéens, réduisant les délais de livraison moyens de 18 jours à moins de 8 jours pour les flux express.',
      'Les perspectives 2025 indiquent une diversification accrue vers l’exportation de produits maghrébins haut de gamme vers les plateformes e-commerce chinoises, en particulier dans les secteurs de l’huile d’olive, des cosmétiques naturels et de l’artisanat d’art.',
    ],
    countries: ['Maroc', 'Algérie', 'Tunisie', 'Égypte', 'Libye'],
    sector: 'Électronique & High-Tech',
    analysisType: 'Marchés e-commerce',
  }),
  article({
    id: 'energies-renouvelables-transition-verte',
    title: 'Opportunités dans les énergies renouvelables et la transition verte',
    category: 'Énergies & Projets',
    publishedAt: '2024-08-28',
    dateLabel: '28 Août 2024',
    readTime: '8 min de lecture',
    image: 'asset:solar_farm_tunisia_1790805165350.jpg',
    placements: ['analyses'],
    summary:
      'Évaluation des synergies industrielles sino-nord-africaines dans le photovoltaïque, le stockage par batterie et la production d’hydrogène vert.',
    keyPoints: [
      'Investissements industriels conjoints prévus à plus de 4,5 milliards USD d’ici 2028.',
      'Transfert de technologie pour la fabrication locale de composants et d’onduleurs solaires.',
      'Positionnement stratégique de l’Afrique du Nord comme pont énergétique vert vers l’Europe.',
    ],
    content: [
      'L’Afrique du Nord dispose d’un des gisements solaires les plus exceptionnels au monde, tandis que les industriels chinois mènent la chaîne mondiale des équipements solaires et des solutions de stockage par batterie.',
      'Cette complémentarité naturelle s’est concrétisée en 2024 par la signature de plus d’une quinzaine de protocoles d’accord industriels et de co-entreprises au Maroc, en Algérie et en Tunisie.',
      'QIAO Intelligence identifie ce secteur comme l’un des trois vecteurs prioritaires de croissance durable pour les partenariats bilatéraux jusqu’en 2030.',
    ],
    countries: ['Maroc', 'Algérie', 'Tunisie'],
    sector: 'Énergies Renouvelables',
    analysisType: 'Prévisions & Scénarios',
  }),
  article({
    id: 'importations-categories-supply-chains',
    title: 'Analyse des importations par catégorie de produits et résilience des supply chains',
    category: 'Commerce International',
    publishedAt: '2024-07-15',
    dateLabel: '15 Juillet 2024',
    readTime: '5 min de lecture',
    image: 'asset:container_port_cargo_1790805153002.jpg',
    placements: ['analyses'],
    summary:
      'Radiographie détaillée des 10 principaux groupes de produits échangés entre la Chine et les pays maghrébins avec focus logistique portuaire.',
    keyPoints: [
      'Prédominance des produits électroniques (24%) et du textile/mode (18%).',
      'Montée en puissance des machines industrielles et outillages de précision (+16% en volume).',
      'Renforcement de la desserte maritime directe via les corridors Tanger Med, Djendjen et Radès.',
    ],
    content: [
      'L’évolution structurelle des flux commerciaux témoigne d’une transition vers des biens à plus forte valeur ajoutée. Les importations ne se limitent plus aux produits de consommation courante mais englobent des biens d’équipement cruciaux pour l’industrialisation locale.',
      'La modernisation des infrastructures logistiques portuaires a permis une fluidification substantielle des formalités de dédouanement et une diminution des coûts de fret unitaire.',
      'Pour les exportateurs nord-africains, les créneaux les plus prometteurs en Chine résident dans les phosphates transformés, les câbles automobiles, et les denrées agroalimentaires certifiées.',
    ],
    countries: ['Maroc', 'Algérie', 'Tunisie', 'Égypte'],
    sector: 'Machines & Équipements',
    analysisType: 'Tendances macro',
  }),
  // --- Hub Commerce : Produits ------------------------------------------------------
  ...[
    {
      title: 'Produits chinois : quelles opportunités pour l’Afrique du Nord ?',
      publishedAt: '2024-08-05',
      dateLabel: '5 Août 2024',
      image: IMG('photo-1578575437130-527eed3abbec', 200),
      summary: 'Électronique, machines et matériaux : les catégories chinoises les plus demandées par les importateurs maghrébins.',
      sector: 'Électronique & High-Tech',
    },
    {
      title: 'La demande croissante pour les véhicules électriques',
      publishedAt: '2024-07-28',
      dateLabel: '28 Juillet 2024',
      image: IMG('photo-1503376780353-7e6692767b70', 200),
      summary: 'Les constructeurs chinois accélèrent au Maroc, en Égypte et en Algérie grâce à des incitations fiscales ciblées.',
      sector: 'Machines & Équipements',
    },
    {
      title: 'Textile technique : un secteur prometteur',
      publishedAt: '2024-07-20',
      dateLabel: '20 Juillet 2024',
      image: IMG('photo-1489987707025-afc232f7ea0f', 200),
      summary: 'Tissus techniques et co-production textile : une complémentarité forte entre bassins chinois et ateliers tunisiens et marocains.',
      sector: 'Vêtements & Mode',
    },
    {
      title: 'Produits agricoles : vers une coopération plus forte',
      publishedAt: '2024-07-12',
      dateLabel: '12 Juillet 2024',
      image: IMG('photo-1474979266404-7eaacbcd87c5', 200),
      summary: 'Huile d’olive, dattes, agrumes : les protocoles phytosanitaires ouvrent de nouveaux débouchés en Chine.',
      sector: 'Agroalimentaire',
    },
  ].map((item) =>
    article({
      ...item,
      category: 'Produits',
      readTime: '5 min de lecture',
      placements: ['produits'],
      analysisType: 'Tendances macro',
      keyPoints: [
        'Demande en hausse confirmée par les données douanières 2024.',
        'Normes et certifications à anticiper avant la première expédition.',
        'Partenaires vérifiés disponibles dans l’annuaire QIAO.',
      ],
      content: [
        item.summary,
        'Les analystes de QIAO Intelligence recommandent de tester le marché avec un premier lot accompagné, puis de sécuriser un contrat-cadre avec un partenaire certifié.',
      ],
    }),
  ),
  // --- Hub Commerce : Vue d'ensemble -----------------------------------------------
  ...[
    {
      title: 'Le e-commerce chinois : quelles opportunités pour l’Afrique du Nord ?',
      publishedAt: '2024-08-05',
      dateLabel: '5 Août 2024',
      image: IMG('photo-1586528116311-ad8dd3c8310d', 200),
      summary: 'Les marketplaces chinoises s’ouvrent aux marques nord-africaines : modalités d’accès et premiers retours d’expérience.',
      analysisType: 'Marchés e-commerce',
    },
    {
      title: 'Produits agricoles nord-africains : un potentiel croissant sur le marché chinois',
      publishedAt: '2024-07-28',
      dateLabel: '28 Juillet 2024',
      image: IMG('photo-1500937386664-56d1dfef3854', 200),
      summary: 'Le consommateur chinois recherche des produits méditerranéens premium et tracés.',
      analysisType: 'Tendances macro',
    },
    {
      title: 'Logistique et ports : un levier stratégique pour les échanges sino-nord-africains',
      publishedAt: '2024-07-20',
      dateLabel: '20 Juillet 2024',
      image: IMG('photo-1578575437130-527eed3abbec', 200),
      summary: 'Tanger Med, Port-Saïd, Djendjen et Radès : comment les ports redessinent les routes commerciales.',
      analysisType: 'Analyses par pays',
    },
    {
      title: 'Tendances 2025 : vers un commerce plus durable et digital',
      publishedAt: '2024-07-12',
      dateLabel: '12 Juillet 2024',
      image: IMG('photo-1451187580459-43490279c0fa', 200),
      summary: 'Décarbonation de la logistique, traçabilité et paiements numériques transforment les échanges bilatéraux.',
      analysisType: 'Prévisions & Scénarios',
    },
  ].map((item) =>
    article({
      ...item,
      category: 'Analyse',
      readTime: '6 min de lecture',
      placements: ['vue-ensemble'],
      keyPoints: [
        'Une dynamique confirmée par les indicateurs QIAO Intelligence.',
        'Des opportunités concrètes pour les PME des deux rives.',
        'Un accompagnement disponible pour passer à l’action.',
      ],
      content: [
        item.summary,
        'Cette analyse s’appuie sur les données douanières, les annonces d’investissement et les retours terrain de nos bureaux de Tunis, Casablanca, Alger et Shanghai.',
      ],
    }),
  ),
  // --- Hub Commerce : Marchés e-commerce -------------------------------------------
  ...[
    {
      title: "E-commerce chinois : quelles opportunités pour l'Afrique du Nord ?",
      publishedAt: '2024-08-05',
      dateLabel: '5 Août 2024',
      image: 'asset:china_ecommerce_report_1790808742649.jpg',
      category: 'Cross-border',
      countries: ['Chine', 'Maroc', 'Égypte'],
      summary: 'Comment les vendeurs nord-africains peuvent tirer parti de Tmall Global, JD Worldwide et Douyin.',
    },
    {
      title: 'Les nouvelles tendances du live commerce en Chine',
      publishedAt: '2024-07-28',
      dateLabel: '28 Juillet 2024',
      image: 'asset:china_corridor_night_skyline_1790804583067.jpg',
      category: 'Innovation',
      countries: ['Chine'],
      summary: 'Le live shopping représente désormais plus d’un quart du e-commerce chinois : mode d’emploi pour les marques étrangères.',
    },
    {
      title: 'Le comportement des consommateurs en Afrique du Nord en 2024',
      publishedAt: '2024-07-20',
      dateLabel: '20 Juillet 2024',
      image: 'asset:hightech_electronics_1790888270277.jpg',
      category: 'Consommation',
      countries: ['Tunisie', 'Algérie', 'Maroc'],
      summary: 'Mobile first, paiement à la livraison et sensibilité au prix : portrait de l’acheteur en ligne maghrébin.',
    },
    {
      title: 'Cross-border : comment réussir son entrée sur les plateformes chinoises ?',
      publishedAt: '2024-07-12',
      dateLabel: '12 Juillet 2024',
      image: 'asset:container_port_cargo_1790805153002.jpg',
      category: 'Réglementation',
      countries: ['Chine', 'Libye', 'Égypte'],
      summary: 'Enregistrement, conformité produit, logistique et fiscalité : la check-list du vendeur cross-border.',
    },
  ].map((item) =>
    article({
      ...item,
      readTime: '6 min de lecture',
      placements: ['marches'],
      analysisType: 'Marchés e-commerce',
      keyPoints: [
        'Des plateformes en forte croissance des deux côtés du corridor.',
        'Des exigences de conformité à anticiper dès le lancement.',
        'Un accompagnement QIAO pour ouvrir sa boutique et gérer la logistique.',
      ],
      content: [
        item.summary,
        'Les experts e-commerce de QIAO accompagnent les marques dans le choix des plateformes, la localisation des fiches produits et l’organisation des flux logistiques.',
      ],
    }),
  ),
];
