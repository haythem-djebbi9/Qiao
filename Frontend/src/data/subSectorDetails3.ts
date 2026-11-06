import type { SubSectorDetail } from './subSectorDetails';

/** Contenu propre à chaque sous-secteur : santé, tourisme. */
export const SUB_SECTOR_DETAILS_3: Record<string, SubSectorDetail> = {
  'sante-med': {
    intro:
      "L'Égypte, le Maroc et l'Algérie produisent déjà une grande partie de leurs médicaments génériques et veulent augmenter cette part. La Chine, premier producteur mondial de principes actifs, est un fournisseur et un partenaire industriel clé.",
    figures: [
      { value: '1er', label: 'producteur mondial de principes actifs : la Chine' },
      { value: 'Gypto Pharma', label: "cité pharmaceutique égyptienne" },
      { value: 'AMM', label: 'autorisation de mise sur le marché obligatoire dans chaque pays' },
    ],
    trends: [
      'La production locale de génériques pour réduire les importations.',
      "L'approvisionnement sécurisé en principes actifs.",
      "L'export de médicaments vers l'Afrique subsaharienne.",
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: 'Grand marché et cité pharmaceutique.' },
      { code: 'DZ', country: 'Algérie', text: 'Politique de production locale de médicaments.' },
      { code: 'MA', country: 'Maroc', text: "Industrie pharmaceutique tournée vers l'Afrique." },
    ],
    opportunities: [
      { id: 'sm-1', title: 'Approvisionnement en principes actifs', country: 'Algérie', countryCode: 'DZ', type: 'Fourniture' },
      { id: 'sm-2', title: 'Ligne de production de génériques', country: 'Égypte', countryCode: 'EG', type: 'Investissement' },
    ],
    services: [
      'Identifier des fabricants chinois de principes actifs certifiés.',
      "Accompagner les dossiers d'autorisation de mise sur le marché.",
      'Vérifier les bonnes pratiques de fabrication (BPF).',
      'Mettre en relation avec des laboratoires locaux.',
    ],
  },
  'sante-disp': {
    intro:
      "Les hôpitaux et cliniques d'Afrique du Nord modernisent leurs équipements : imagerie, laboratoire, bloc opératoire, consommables. Les fabricants chinois offrent un large choix à des prix compétitifs, avec des certifications reconnues.",
    figures: [
      { value: 'CE / FDA', label: 'certifications attendues pour les dispositifs médicaux' },
      { value: 'Imagerie', label: 'scanners, IRM et échographes très demandés' },
      { value: 'Maintenance', label: 'critère décisif pour les hôpitaux' },
    ],
    trends: [
      "L'équipement des nouveaux hôpitaux publics et privés.",
      'Le diagnostic rapide et les laboratoires de proximité.',
      'Les consommables médicaux produits localement.',
    ],
    markets: [
      { code: 'DZ', country: 'Algérie', text: 'Programmes publics d’équipement hospitalier.' },
      { code: 'EG', country: 'Égypte', text: 'Assurance maladie universelle et nouveaux hôpitaux.' },
      { code: 'LY', country: 'Libye', text: 'Reconstruction et rééquipement du système de santé.' },
    ],
    opportunities: [
      { id: 'sd-1', title: "Équipements d'imagerie médicale", country: 'Égypte', countryCode: 'EG', type: 'Fourniture' },
      { id: 'sd-2', title: 'Distribution de consommables médicaux', country: 'Libye', countryCode: 'LY', type: 'Distribution' },
    ],
    services: [
      'Sourcer des dispositifs auprès de fabricants chinois certifiés.',
      "Préparer l'enregistrement auprès des autorités de santé.",
      'Organiser la formation et la maintenance.',
      "Suivre les appels d'offres hospitaliers.",
    ],
  },
  'sante-biotech': {
    intro:
      "Vaccins, biosimilaires et recherche clinique sont devenus des priorités de souveraineté sanitaire. Des partenariats avec des laboratoires chinois ont déjà permis de produire des vaccins en Égypte et au Maroc.",
    figures: [
      { value: 'Benslimane', label: 'usine de vaccins au Maroc, en partenariat avec la Chine' },
      { value: 'VACSERA', label: 'producteur égyptien de vaccins' },
      { value: 'Essais cliniques', label: 'à développer avec les hôpitaux universitaires' },
    ],
    trends: [
      'La production locale de vaccins et de biosimilaires.',
      'Les transferts de technologie entre laboratoires.',
      'La recherche clinique et les essais multicentriques.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Pôle vaccinal de Benslimane.' },
      { code: 'EG', country: 'Égypte', text: 'VACSERA et centres de recherche.' },
      { code: 'TN', country: 'Tunisie', text: 'Institut Pasteur de Tunis et recherche biomédicale.' },
    ],
    opportunities: [
      { id: 'sb-1', title: 'Transfert de technologie pour biosimilaires', country: 'Égypte', countryCode: 'EG', type: 'Transfert de technologie' },
      { id: 'sb-2', title: 'Partenariat de recherche clinique', country: 'Tunisie', countryCode: 'TN', type: 'Partenariat' },
    ],
    services: [
      'Identifier des laboratoires partenaires en Chine.',
      'Accompagner les accords de transfert de technologie.',
      'Analyser les cadres réglementaires des essais cliniques.',
      'Rechercher des financements pour la R&D.',
    ],
  },
  'sante-digital': {
    intro:
      "Téléconsultation, dossier médical électronique et intelligence artificielle rapprochent les patients des soins, notamment dans les zones éloignées. Les solutions chinoises de santé numérique sont parmi les plus avancées au monde.",
    figures: [
      { value: 'Télémédecine', label: 'pour les régions éloignées des hôpitaux' },
      { value: 'Dossier électronique', label: 'pour suivre le patient partout' },
      { value: 'IA', label: 'aide au diagnostic en imagerie' },
    ],
    trends: [
      'Les plateformes de téléconsultation.',
      "La numérisation des hôpitaux et de l'assurance maladie.",
      "L'IA pour l'imagerie et le dépistage.",
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: 'Numérisation de l’assurance maladie universelle.' },
      { code: 'MA', country: 'Maroc', text: 'Généralisation de la couverture médicale.' },
      { code: 'TN', country: 'Tunisie', text: 'Start-up de la santé numérique.' },
    ],
    opportunities: [
      { id: 'sg-1', title: 'Plateforme de téléconsultation régionale', country: 'Maroc', countryCode: 'MA', type: 'Partenariat technologique' },
      { id: 'sg-2', title: "IA d'aide à la lecture des radiographies", country: 'Égypte', countryCode: 'EG', type: 'Projet pilote' },
    ],
    services: [
      'Mettre en relation éditeurs chinois et établissements de santé.',
      'Vérifier la protection des données de santé.',
      'Monter des projets pilotes avec des hôpitaux.',
      'Accompagner les autorisations réglementaires.',
    ],
  },
  'sante-hosp': {
    intro:
      "Construire et équiper des hôpitaux, cliniques et centres spécialisés est une priorité dans toute la région. Les entreprises chinoises proposent des projets clés en main, de la conception à l'équipement et à la formation.",
    figures: [
      { value: 'Clés en main', label: "de la conception à l'équipement" },
      { value: 'PPP', label: 'pour financer de nouveaux hôpitaux' },
      { value: 'Centres spécialisés', label: 'cancérologie, cardiologie, dialyse' },
    ],
    trends: [
      'Les hôpitaux universitaires et régionaux.',
      'Les cliniques privées spécialisées.',
      'Les hôpitaux modulaires rapides à construire.',
    ],
    markets: [
      { code: 'DZ', country: 'Algérie', text: 'Nouveaux centres hospitaliers et centres anticancer.' },
      { code: 'EG', country: 'Égypte', text: "Hôpitaux de l'assurance maladie universelle." },
      { code: 'MA', country: 'Maroc', text: 'Centres hospitaliers universitaires en construction.' },
    ],
    opportunities: [
      { id: 'sh-1', title: 'Centre de dialyse clé en main', country: 'Algérie', countryCode: 'DZ', type: 'Projet clé en main' },
      { id: 'sh-2', title: 'Clinique privée spécialisée', country: 'Tunisie', countryCode: 'TN', type: 'Co-investissement' },
    ],
    services: [
      "Identifier des groupes chinois spécialisés dans l'hôpital clés en main.",
      'Monter des partenariats public-privé.',
      'Sourcer les équipements et le mobilier médical.',
      'Organiser la formation des équipes soignantes.',
    ],
  },
  'sante-form': {
    intro:
      "Former médecins, infirmiers et techniciens est indispensable pour faire fonctionner les nouveaux équipements et hôpitaux. La coopération médicale entre la Chine et l'Algérie existe depuis 1963, première mission médicale chinoise à l'étranger.",
    figures: [
      { value: '1963', label: "première mission médicale chinoise à l'étranger, en Algérie" },
      { value: 'Bourses', label: 'pour étudier la médecine en Chine' },
      { value: 'Simulation', label: 'centres de formation pratique' },
    ],
    trends: [
      'Les échanges universitaires et les bourses.',
      'Les centres de simulation médicale.',
      'La formation des techniciens biomédicaux.',
    ],
    markets: [
      { code: 'DZ', country: 'Algérie', text: 'Coopération médicale historique avec la Chine.' },
      { code: 'TN', country: 'Tunisie', text: 'Facultés de médecine reconnues dans la région.' },
      { code: 'EG', country: 'Égypte', text: 'Grandes universités de médecine.' },
    ],
    opportunities: [
      { id: 'sf-1', title: 'Centre de simulation médicale', country: 'Tunisie', countryCode: 'TN', type: 'Partenariat' },
      { id: 'sf-2', title: 'Formation de techniciens biomédicaux', country: 'Algérie', countryCode: 'DZ', type: 'Formation' },
    ],
    services: [
      'Mettre en relation universités et hôpitaux des deux rives.',
      'Organiser des programmes de formation sur mesure.',
      'Accompagner les échanges de praticiens.',
      'Sourcer des équipements de simulation.',
    ],
  },
  't-culturel': {
    intro:
      "Carthage, Volubilis, les pyramides de Gizeh, Timgad : l'Afrique du Nord concentre des sites historiques uniques. Les voyageurs chinois, de plus en plus nombreux à partir loin, recherchent des circuits culturels bien organisés et des guides parlant chinois.",
    figures: [
      { value: '17,4 millions', label: 'de touristes au Maroc en 2024' },
      { value: '15,7 millions', label: 'de touristes en Égypte en 2024' },
      { value: '≈ 155 millions', label: "de voyages de Chinois à l'étranger en 2019" },
    ],
    trends: [
      'Les circuits culturels en petits groupes.',
      'Les guides et contenus en langue chinoise.',
      'Les musées modernisés et les visites numériques.',
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: 'Pyramides, Louxor et Grand Musée égyptien.' },
      { code: 'TN', country: 'Tunisie', text: 'Carthage, El Jem et Dougga.' },
      { code: 'MA', country: 'Maroc', text: 'Villes impériales et Volubilis.' },
    ],
    opportunities: [
      { id: 'tc1', title: 'Circuits culturels pour voyageurs chinois', country: 'Égypte', countryCode: 'EG', type: 'Partenariat' },
      { id: 'tc2', title: 'Formation de guides sinophones', country: 'Tunisie', countryCode: 'TN', type: 'Formation' },
    ],
    services: [
      'Mettre en relation agences chinoises et réceptifs locaux.',
      'Adapter les offres aux attentes des voyageurs chinois.',
      'Promouvoir les destinations sur les plateformes chinoises.',
      'Accompagner les démarches de visa de groupe.',
    ],
  },
  't-balneaire': {
    intro:
      "Hammamet, Djerba, Agadir, Hurghada ou Charm el-Cheikh attirent chaque année des millions de vacanciers. Rénovation des hôtels, nouvelles stations et activités nautiques ouvrent des opportunités d'investissement et de partenariat.",
    figures: [
      { value: '≈ 10,3 millions', label: 'de touristes en Tunisie en 2024' },
      { value: 'Mer Rouge', label: 'destination balnéaire phare de l’Égypte' },
      { value: 'Toute l’année', label: 'saison prolongée grâce au climat' },
    ],
    trends: [
      'La rénovation des grands hôtels balnéaires.',
      'Les activités nautiques et les loisirs.',
      'Le tourisme balnéaire hors saison.',
    ],
    markets: [
      { code: 'TN', country: 'Tunisie', text: 'Djerba, Hammamet, Sousse et Monastir.' },
      { code: 'EG', country: 'Égypte', text: 'Hurghada, Charm el-Cheikh et El Alamein.' },
      { code: 'MA', country: 'Maroc', text: 'Agadir, Saïdia et Taghazout.' },
    ],
    opportunities: [
      { id: 'tb1', title: "Rénovation d'un hôtel balnéaire", country: 'Tunisie', countryCode: 'TN', type: 'Investissement' },
      { id: 'tb2', title: 'Centre de sports nautiques', country: 'Égypte', countryCode: 'EG', type: 'Partenariat' },
    ],
    services: [
      'Identifier des investisseurs hôteliers.',
      'Sourcer mobilier, équipements et matériaux de rénovation.',
      'Analyser le marché et la fréquentation.',
      'Accompagner les montages juridiques et fonciers.',
    ],
  },
  't-patrimonial': {
    intro:
      "Médinas, sites classés au patrimoine mondial de l'UNESCO et lieux de culte racontent l'histoire de la région. Leur préservation et leur mise en valeur créent des projets de restauration, de maisons d'hôtes et de visites guidées.",
    figures: [
      { value: '9', label: "sites UNESCO en Tunisie, dont la médina de Tunis" },
      { value: '9', label: "sites UNESCO au Maroc, dont Fès et Marrakech" },
      { value: '7', label: "sites UNESCO en Égypte et en Algérie" },
    ],
    trends: [
      'La restauration des médinas et des bâtiments anciens.',
      "Les maisons d'hôtes et riads de charme.",
      "Les visites guidées numériques et l'éclairage des sites.",
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Médinas de Fès, Marrakech et Essaouira.' },
      { code: 'TN', country: 'Tunisie', text: 'Médinas de Tunis, Sousse et Kairouan.' },
      { code: 'DZ', country: 'Algérie', text: "Casbah d'Alger et vallée du M'Zab." },
    ],
    opportunities: [
      { id: 'tp1', title: "Transformation d'un palais en maison d'hôtes", country: 'Maroc', countryCode: 'MA', type: 'Investissement' },
      { id: 'tp2', title: 'Visites guidées numériques de médinas', country: 'Tunisie', countryCode: 'TN', type: 'Partenariat technologique' },
    ],
    services: [
      'Identifier les projets de restauration et de valorisation.',
      'Mettre en relation investisseurs et propriétaires.',
      'Respecter les règles de protection du patrimoine.',
      'Développer des contenus de visite en chinois.',
    ],
  },
  't-eco': {
    intro:
      "Désert, oasis, montagnes de l'Atlas et parcs nationaux offrent des expériences recherchées par les voyageurs en quête de nature. L'écotourisme valorise les territoires ruraux tout en préservant l'environnement.",
    figures: [
      { value: 'Sahara', label: 'plus grand désert chaud du monde' },
      { value: 'Atlas', label: 'randonnées et villages berbères' },
      { value: 'Oasis', label: 'Tozeur, Siwa, Merzouga' },
    ],
    trends: [
      'Les écolodges et hébergements durables.',
      'Les randonnées et circuits dans le désert.',
      'Le tourisme rural et communautaire.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Atlas, Merzouga et vallées du Sud.' },
      { code: 'TN', country: 'Tunisie', text: 'Tozeur, Douz et parcs nationaux.' },
      { code: 'EG', country: 'Égypte', text: 'Oasis de Siwa et désert Blanc.' },
    ],
    opportunities: [
      { id: 'te1', title: 'Écolodge dans le désert', country: 'Maroc', countryCode: 'MA', type: 'Investissement' },
      { id: 'te2', title: 'Circuits nature pour groupes chinois', country: 'Tunisie', countryCode: 'TN', type: 'Partenariat' },
    ],
    services: [
      'Identifier des sites et des partenaires locaux.',
      'Sourcer des équipements durables : solaire, traitement de l’eau.',
      'Concevoir des circuits adaptés aux voyageurs chinois.',
      'Accompagner les démarches et autorisations.',
    ],
  },
  't-hotel': {
    intro:
      "L'hôtellerie et la restauration doivent suivre la hausse du nombre de visiteurs et la montée en gamme des attentes. Chaînes internationales, hôtels indépendants et restaurants cherchent équipements, formation et partenaires.",
    figures: [
      { value: 'Montée en gamme', label: 'des hôtels pour une clientèle exigeante' },
      { value: 'Équipements', label: 'cuisine, literie, mobilier à renouveler' },
      { value: 'Service en chinois', label: 'atout pour accueillir les voyageurs chinois' },
    ],
    trends: [
      "L'accueil adapté aux voyageurs chinois : paiement, langue, cuisine.",
      'La rénovation et la digitalisation des hôtels.',
      'La gastronomie locale mise en valeur.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Marrakech, Casablanca et grandes stations.' },
      { code: 'EG', country: 'Égypte', text: 'Le Caire, Louxor et la mer Rouge.' },
      { code: 'TN', country: 'Tunisie', text: 'Tunis, Djerba et la côte est.' },
    ],
    opportunities: [
      { id: 'th1', title: "Équipement d'hôtels en rénovation", country: 'Égypte', countryCode: 'EG', type: 'Fourniture' },
      { id: 'th2', title: "Programme d'accueil des voyageurs chinois", country: 'Maroc', countryCode: 'MA', type: 'Formation' },
    ],
    services: [
      "Sourcer mobilier, literie et équipements de cuisine.",
      'Former les équipes à l’accueil des voyageurs chinois.',
      'Intégrer WeChat Pay et Alipay pour les paiements.',
      'Mettre en relation avec des investisseurs hôteliers.',
    ],
  },
  't-mice': {
    intro:
      "Congrès, salons, voyages d'affaires et séminaires de motivation forment le tourisme MICE, à forte valeur. Les délégations chinoises qui viennent prospecter en Afrique du Nord ont besoin d'organisateurs fiables et bilingues.",
    figures: [
      { value: 'MICE', label: 'réunions, incentives, congrès et salons' },
      { value: 'Délégations', label: "d'affaires chinoises en hausse" },
      { value: 'Centres de congrès', label: 'à Marrakech, Tunis, Le Caire et Alger' },
    ],
    trends: [
      "L'organisation de missions d'affaires et de salons.",
      'Les séminaires d’entreprise et les voyages de récompense.',
      'Les événements hybrides, sur place et en ligne.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Marrakech, destination de congrès reconnue.' },
      { code: 'EG', country: 'Égypte', text: 'Le Caire et Charm el-Cheikh pour les grandes conférences.' },
      { code: 'TN', country: 'Tunisie', text: 'Tunis et Hammamet pour les séminaires.' },
    ],
    opportunities: [
      { id: 'tm1', title: "Organisation d'une mission d'affaires chinoise", country: 'Algérie', countryCode: 'DZ', type: 'Services' },
      { id: 'tm2', title: 'Salon professionnel sino-maghrébin', country: 'Maroc', countryCode: 'MA', type: 'Événement' },
    ],
    services: [
      'Organiser des délégations et des missions d’affaires.',
      'Trouver lieux, hôtels et prestataires événementiels.',
      'Fournir interprètes et accompagnateurs bilingues.',
      'Préparer les rendez-vous B2B avec des entreprises locales.',
    ],
  },
};
