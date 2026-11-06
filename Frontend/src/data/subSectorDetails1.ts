import type { SubSectorDetail } from './subSectorDetails';

/** Contenu propre à chaque sous-secteur : logistique, industrie, énergie. */
export const SUB_SECTOR_DETAILS_1: Record<string, SubSectorDetail> = {
  'log-maritime': {
    intro:
      "L'essentiel des échanges entre la Chine et l'Afrique du Nord passe par la mer. Les lignes directes vers Tanger Med, Port-Saïd, Radès ou Djendjen raccourcissent les délais et rendent le fret plus prévisible pour les importateurs comme pour les exportateurs.",
    figures: [
      { value: '10,2 M EVP', label: 'traités à Tanger Med en 2024' },
      { value: '≈ 12 %', label: 'du commerce mondial passe par le canal de Suez' },
      { value: '25 à 35 jours', label: 'de transit maritime Shanghai – Maghreb' },
    ],
    trends: [
      'Des lignes directes Chine – Maghreb qui évitent les transbordements en Europe.',
      'La montée du groupage (LCL) pour les PME qui importent de petits volumes.',
      'La digitalisation des formalités portuaires : PortNet, Nafeza, TTN.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Tanger Med, premier port à conteneurs de Méditerranée, et Casablanca.' },
      { code: 'EG', country: 'Égypte', text: 'Port-Saïd et la zone du canal de Suez, carrefour Asie – Europe.' },
      { code: 'TN', country: 'Tunisie', text: "Radès et le futur port en eau profonde d'Enfidha." },
    ],
    opportunities: [
      { id: 'lm-1', title: 'Lignes de groupage Ningbo – Radès', country: 'Tunisie', countryCode: 'TN', type: 'Partenariat logistique' },
      { id: 'lm-2', title: 'Agence maritime à Port-Saïd', country: 'Égypte', countryCode: 'EG', type: 'Joint-venture' },
    ],
    services: [
      'Comparer les armateurs, les lignes et les délais de transit.',
      'Négocier les tarifs de fret en conteneur complet ou en groupage.',
      'Préparer le connaissement et les documents douaniers.',
      "Suivre l'expédition jusqu'au dédouanement à l'arrivée.",
    ],
  },
  'log-aerien': {
    intro:
      "Le fret aérien sert les marchandises urgentes, fragiles ou de grande valeur : électronique, pièces de rechange, produits pharmaceutiques, e-commerce. Les hubs de correspondance et les vols cargo relient les grandes villes chinoises à Casablanca, Alger, Tunis et Le Caire en quelques jours.",
    figures: [
      { value: '3 à 7 jours', label: 'de délai porte à porte en fret express' },
      { value: '4 hubs', label: 'de correspondance : Dubaï, Doha, Istanbul, Addis-Abeba' },
      { value: '< 48 h', label: 'de dédouanement pour un envoi express complet' },
    ],
    trends: [
      'La croissance du e-commerce transfrontalier, qui multiplie les petits colis.',
      'Des zones cargo modernisées dans les aéroports de Casablanca, Alger et Le Caire.',
      'Le transport sous température dirigée pour la pharmacie et les produits frais.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Aéroport Mohammed V de Casablanca et sa plateforme cargo.' },
      { code: 'EG', country: 'Égypte', text: 'Aéroport international du Caire et sa zone cargo.' },
      { code: 'DZ', country: 'Algérie', text: "Aéroport d'Alger, porte d'entrée des importations urgentes." },
    ],
    opportunities: [
      { id: 'la-1', title: 'Fret express pour pièces industrielles', country: 'Algérie', countryCode: 'DZ', type: 'Service logistique' },
      { id: 'la-2', title: 'Plateforme cargo pour le e-commerce', country: 'Maroc', countryCode: 'MA', type: 'Investissement' },
    ],
    services: [
      'Choisir entre fret aérien standard, express et affrètement.',
      'Grouper plusieurs fournisseurs chinois dans un même envoi.',
      'Organiser la chaîne du froid pour les produits sensibles.',
      'Préparer la lettre de transport aérien et le dédouanement.',
    ],
  },
  'log-terrestre': {
    intro:
      "Une fois arrivées au port, les marchandises doivent rejoindre usines, entrepôts et clients. Le transport routier et ferroviaire, avec les corridors maghrébins et transsahariens, relie les ports aux zones industrielles et aux marchés d'Afrique subsaharienne.",
    figures: [
      { value: '6 pays', label: 'reliés par la route transsaharienne' },
      { value: '320 km/h', label: 'sur la ligne à grande vitesse Tanger – Casablanca' },
      { value: 'Rail + route', label: 'pour relier les ports aux zones industrielles' },
    ],
    trends: [
      'La modernisation des réseaux ferroviaires, notamment au Maroc et en Algérie.',
      'Le transport multimodal entre ports, ports secs et zones industrielles.',
      "L'arrivée des camions électriques et du suivi GPS des flottes.",
    ],
    markets: [
      { code: 'DZ', country: 'Algérie', text: 'Corridor transsaharien et réseau ferroviaire étendu vers le sud.' },
      { code: 'MA', country: 'Maroc', text: 'Autoroutes et ligne à grande vitesse entre Tanger et Casablanca.' },
      { code: 'EG', country: 'Égypte', text: 'Réseau routier national étendu et nouvelles lignes de train rapide.' },
    ],
    opportunities: [
      { id: 'lt-1', title: 'Camions électriques pour le dernier kilomètre', country: 'Maroc', countryCode: 'MA', type: 'Partenariat' },
      { id: 'lt-2', title: 'Port sec et plateforme rail-route', country: 'Algérie', countryCode: 'DZ', type: 'Investissement' },
    ],
    services: [
      'Identifier des transporteurs routiers et ferroviaires fiables.',
      "Organiser l'acheminement entre le port et votre site.",
      'Mettre en relation avec des fabricants chinois de véhicules utilitaires.',
      'Étudier la faisabilité de plateformes multimodales.',
    ],
  },
  'log-integree': {
    intro:
      "Entreposage, préparation de commandes, gestion des stocks et distribution : la logistique intégrée confie toute la chaîne à un prestataire 3PL ou 4PL. Les zones franches d'Afrique du Nord permettent de stocker sous douane et de réexporter vers l'Europe et l'Afrique.",
    figures: [
      { value: '3PL / 4PL', label: "modèles d'externalisation logistique" },
      { value: 'Sous douane', label: 'droits suspendus tant que la marchandise reste en zone franche' },
      { value: 'Europe & Afrique', label: 'marchés desservis depuis les zones franches du Maghreb' },
    ],
    trends: [
      "La demande d'entrepôts modernes portée par le e-commerce.",
      "Les zones franches qui attirent les fabricants asiatiques près de l'Europe.",
      "L'automatisation des entrepôts et le suivi des stocks en temps réel.",
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Zones franches de Tanger Med et de Kénitra.' },
      { code: 'TN', country: 'Tunisie', text: 'Parcs de Bizerte et Zarzis, régime totalement exportateur.' },
      { code: 'EG', country: 'Égypte', text: 'Zone économique du canal de Suez.' },
    ],
    opportunities: [
      { id: 'li-1', title: "Entrepôt sous douane près d'Alger", country: 'Algérie', countryCode: 'DZ', type: 'Co-investissement' },
      { id: 'li-2', title: 'Prestataire 3PL pour marques chinoises', country: 'Maroc', countryCode: 'MA', type: 'Partenariat' },
    ],
    services: [
      'Choisir le bon régime : zone franche, entrepôt sous douane, admission temporaire.',
      'Sélectionner un prestataire 3PL ou 4PL adapté à vos volumes.',
      "Comparer les coûts d'implantation entre zones franches.",
      'Négocier les contrats de prestation logistique.',
    ],
  },
  'log-chaine': {
    intro:
      "Une chaîne d'approvisionnement entre la Chine et l'Afrique du Nord doit concilier coût, délai et sécurité. Visibilité sur les stocks, choix des Incoterms, diversification des fournisseurs et traçabilité évitent les ruptures et les surcoûts.",
    figures: [
      { value: '11', label: 'Incoterms 2020 pour répartir coûts et risques' },
      { value: '2 à 3', label: 'fournisseurs conseillés pour un produit stratégique' },
      { value: 'Temps réel', label: 'suivi des conteneurs et des stocks' },
    ],
    trends: [
      'La diversification des fournisseurs pour limiter les ruptures.',
      "La traçabilité numérique des lots, de l'usine au client final.",
      "Le rapprochement de la production au Maghreb pour servir l'Europe.",
    ],
    markets: [
      { code: 'CN', country: 'Chine', text: 'Bassins industriels du Zhejiang, du Guangdong et du Jiangsu.' },
      { code: 'TN', country: 'Tunisie', text: "Sous-traitance industrielle tournée vers l'Europe." },
      { code: 'MA', country: 'Maroc', text: 'Plateformes industrielles automobile et aéronautique.' },
    ],
    opportunities: [
      { id: 'lc-1', title: 'Plateforme de traçabilité des lots', country: 'Tunisie', countryCode: 'TN', type: 'Partenariat technologique' },
      { id: 'lc-2', title: "Centrale d'achat pour PME maghrébines", country: 'Chine', countryCode: 'CN', type: 'Sourcing' },
    ],
    services: [
      'Cartographier votre chaîne et repérer les points de risque.',
      'Trouver et auditer des fournisseurs de secours.',
      'Choisir les Incoterms et les conditions de paiement adaptés.',
      'Mettre en place un suivi des commandes et des stocks.',
    ],
  },
  'log-ports': {
    intro:
      "Ports, terminaux et zones logistiques se modernisent au sud de la Méditerranée, souvent avec des entreprises chinoises. Ces projets ouvrent des marchés de construction, d'équipements portuaires, d'exploitation et de services.",
    figures: [
      { value: 'Eau profonde', label: "projet de port d'Enfidha en Tunisie" },
      { value: 'El Hamdania', label: 'projet de port du centre algérien, à Cherchell' },
      { value: 'SCZONE', label: 'zone économique du canal de Suez, en Égypte' },
    ],
    trends: [
      'La modernisation des terminaux à conteneurs et de leurs équipements.',
      "Des ports en eau profonde capables d'accueillir les plus grands navires.",
      'Des zones logistiques et industrielles adossées aux ports.',
    ],
    markets: [
      { code: 'DZ', country: 'Algérie', text: "Port du centre d'El Hamdania, à Cherchell." },
      { code: 'TN', country: 'Tunisie', text: "Port en eau profonde d'Enfidha." },
      { code: 'EG', country: 'Égypte', text: 'Ports de la zone du canal de Suez : Sokhna et Port-Saïd Est.' },
    ],
    opportunities: [
      { id: 'lp-1', title: 'Équipements de manutention portuaire', country: 'Égypte', countryCode: 'EG', type: 'Fourniture' },
      { id: 'lp-2', title: "Exploitation d'un terminal vraquier", country: 'Algérie', countryCode: 'DZ', type: 'Concession' },
    ],
    services: [
      "Suivre les appels d'offres portuaires et les projets publics.",
      'Constituer des consortiums sino-maghrébins pour répondre aux marchés.',
      "Identifier des fabricants chinois d'équipements portuaires.",
      'Accompagner les concessions et partenariats public-privé.',
    ],
  },
  'ind-auto': {
    intro:
      "Le Maroc est devenu le premier producteur automobile d'Afrique, et l'Algérie relance son industrie avec des constructeurs étrangers, dont plusieurs chinois. Les marques chinoises, leaders du véhicule électrique, cherchent des partenaires pour l'assemblage, les pièces et la distribution.",
    figures: [
      { value: '≈ 700 000', label: 'véhicules par an de capacité de production au Maroc' },
      { value: '≈ 60 %', label: 'des véhicules électriques du monde produits en Chine' },
      { value: '1er', label: "producteur automobile d'Afrique : le Maroc" },
    ],
    trends: [
      "L'arrivée des véhicules et batteries électriques chinois.",
      "L'intégration locale des pièces : câblage, sièges, plastiques.",
      "La relance de l'assemblage automobile en Algérie.",
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Usines de Tanger et Kénitra, réseau dense de sous-traitants.' },
      { code: 'DZ', country: 'Algérie', text: "Nouvelles usines d'assemblage de marques étrangères." },
      { code: 'EG', country: 'Égypte', text: 'Programme national de fabrication de véhicules électriques.' },
    ],
    opportunities: [
      { id: 'ia-1', title: 'Fabrication de faisceaux électriques', country: 'Tunisie', countryCode: 'TN', type: 'Sous-traitance' },
      { id: 'ia-2', title: 'Réseau de distribution de véhicules électriques', country: 'Égypte', countryCode: 'EG', type: 'Distribution' },
    ],
    services: [
      "Identifier des constructeurs et équipementiers chinois prêts à s'implanter.",
      "Étudier les règles d'intégration locale et les incitations.",
      'Trouver des sous-traitants certifiés IATF 16949.',
      "Organiser des visites d'usines en Chine et au Maghreb.",
    ],
  },
  'ind-elec': {
    intro:
      "La Chine fabrique la majorité des composants et appareils électroniques du monde. En Afrique du Nord, la demande en smartphones, électroménager et objets connectés progresse, et la sous-traitance électronique se développe en Tunisie et au Maroc.",
    figures: [
      { value: '1re', label: 'puissance mondiale de fabrication électronique : la Chine' },
      { value: 'Tunisie & Maroc', label: "pôles de sous-traitance électronique pour l'Europe" },
      { value: 'CE / RoHS', label: "normes exigées pour vendre en Europe et au Maghreb" },
    ],
    trends: [
      "L'assemblage local de smartphones et d'électroménager.",
      "La sous-traitance de cartes électroniques pour l'automobile.",
      "Les objets connectés pour la maison et l'industrie.",
    ],
    markets: [
      { code: 'TN', country: 'Tunisie', text: "Sous-traitance électronique et câblage pour l'Europe." },
      { code: 'DZ', country: 'Algérie', text: "Assemblage d'électroménager et de téléviseurs." },
      { code: 'EG', country: 'Égypte', text: "Usines d'assemblage de smartphones de marques chinoises." },
    ],
    opportunities: [
      { id: 'ie-1', title: 'Assemblage de smartphones', country: 'Égypte', countryCode: 'EG', type: 'Investissement' },
      { id: 'ie-2', title: "Composants pour l'électroménager", country: 'Algérie', countryCode: 'DZ', type: 'Fourniture' },
    ],
    services: [
      "Sourcer des composants auprès d'usines chinoises auditées.",
      'Vérifier la conformité CE, RoHS et les normes locales.',
      'Mettre en relation avec des assembleurs et des distributeurs.',
      'Négocier les licences de marque et le service après-vente.',
    ],
  },
  'ind-textile': {
    intro:
      "La Tunisie, le Maroc et l'Égypte confectionnent pour les grandes marques européennes, au plus près de leurs clients. La Chine fournit tissus, fils, accessoires et machines, et ses groupes cherchent des ateliers partenaires pour produire près de l'Europe.",
    figures: [
      { value: '2 à 5 jours', label: "de livraison vers l'Europe depuis le Maghreb" },
      { value: 'Coton égyptien', label: 'réputé pour ses fibres longues' },
      { value: 'OEKO-TEX', label: 'certification souvent exigée par les marques' },
    ],
    trends: [
      "La production rapprochée de l'Europe (nearshoring).",
      'Les tissus techniques et durables.',
      'La traçabilité et les certifications sociales et environnementales.',
    ],
    markets: [
      { code: 'TN', country: 'Tunisie', text: 'Confection et denim pour les marques européennes.' },
      { code: 'MA', country: 'Maroc', text: 'Pôles de Casablanca et Tanger, mode rapide.' },
      { code: 'EG', country: 'Égypte', text: 'Coton, filature et zones industrielles qualifiées.' },
    ],
    opportunities: [
      { id: 'it-1', title: 'Atelier de confection pour un groupe chinois', country: 'Maroc', countryCode: 'MA', type: 'Joint-venture' },
      { id: 'it-2', title: 'Approvisionnement en tissus techniques', country: 'Tunisie', countryCode: 'TN', type: 'Sourcing' },
    ],
    services: [
      'Trouver des fournisseurs de tissus, fils et accessoires certifiés.',
      'Auditer les ateliers et les usines partenaires.',
      'Négocier les minimums de commande et les délais.',
      'Accompagner les certifications OEKO-TEX et BSCI.',
    ],
  },
  'ind-mat': {
    intro:
      "Les grands chantiers d'Afrique du Nord consomment ciment, acier, céramique et verre. La Chine apporte lignes de production, matériaux innovants et équipements, tandis que l'Algérie et l'Égypte exportent déjà leur ciment.",
    figures: [
      { value: 'Algérie', label: 'exportatrice de ciment et de clinker' },
      { value: 'Céramique', label: 'filière forte en Tunisie et en Égypte' },
      { value: 'Bas carbone', label: 'nouvelle exigence pour les matériaux' },
    ],
    trends: [
      'Les ciments et bétons bas carbone.',
      'La préfabrication et les matériaux légers.',
      'La modernisation des lignes de production.',
    ],
    markets: [
      { code: 'DZ', country: 'Algérie', text: "Cimenteries et aciéries tournées vers l'export." },
      { code: 'EG', country: 'Égypte', text: 'Grands projets urbains et villes nouvelles.' },
      { code: 'MA', country: 'Maroc', text: 'Céramique, verre et matériaux pour le logement.' },
    ],
    opportunities: [
      { id: 'im-1', title: 'Ligne de panneaux préfabriqués', country: 'Algérie', countryCode: 'DZ', type: 'Transfert de technologie' },
      { id: 'im-2', title: 'Distribution de carrelage et de sanitaires', country: 'Libye', countryCode: 'LY', type: 'Distribution' },
    ],
    services: [
      'Sourcer des équipements de production auprès de fabricants chinois.',
      'Vérifier la conformité des matériaux aux normes locales.',
      'Mettre en relation avec les distributeurs et les promoteurs.',
      "Étudier la faisabilité d'une usine locale.",
    ],
  },
  'ind-agro': {
    intro:
      "Transformer localement les produits agricoles crée de la valeur et des emplois : huiles, conserves, jus, produits laitiers, emballages. Les équipementiers chinois proposent des lignes complètes à coût compétitif, et le marché chinois s'ouvre aux produits transformés du Maghreb.",
    figures: [
      { value: 'Lignes complètes', label: 'proposées par les équipementiers chinois' },
      { value: 'GACC', label: 'enregistrement obligatoire pour exporter des aliments vers la Chine' },
      { value: 'Emballage', label: 'maillon clé de la valeur ajoutée' },
    ],
    trends: [
      "L'automatisation des lignes de conditionnement.",
      'Les emballages recyclables et allégés.',
      'Les normes de sécurité alimentaire : ISO 22000, HACCP.',
    ],
    markets: [
      { code: 'TN', country: 'Tunisie', text: "Huile d'olive conditionnée, dattes et conserves." },
      { code: 'MA', country: 'Maroc', text: 'Agrumes, conserves de poisson et produits du terroir.' },
      { code: 'EG', country: 'Égypte', text: "Industrie alimentaire à grande échelle pour l'Afrique et le Moyen-Orient." },
    ],
    opportunities: [
      { id: 'ig-1', title: "Ligne de conditionnement d'huile d'olive", country: 'Tunisie', countryCode: 'TN', type: 'Équipement' },
      { id: 'ig-2', title: "Usine d'emballages alimentaires", country: 'Égypte', countryCode: 'EG', type: 'Investissement' },
    ],
    services: [
      "Sourcer des lignes de transformation et d'emballage.",
      "Préparer l'enregistrement GACC pour exporter vers la Chine.",
      'Accompagner les certifications HACCP et ISO 22000.',
      'Trouver des acheteurs et des distributeurs en Chine.',
    ],
  },
  'ind-vertes': {
    intro:
      "Décarboner l'industrie devient une condition d'accès au marché européen, avec le mécanisme d'ajustement carbone aux frontières (MACF). Les solutions chinoises en énergie solaire, efficacité énergétique et recyclage aident les industriels du Maghreb à réduire leurs émissions.",
    figures: [
      { value: 'MACF', label: 'taxe carbone européenne aux frontières, appliquée progressivement' },
      { value: '> 80 %', label: 'des modules solaires du monde fabriqués en Chine' },
      { value: 'Recyclage', label: 'plastiques, métaux et déchets industriels' },
    ],
    trends: [
      "L'autoconsommation solaire dans les usines.",
      "Le recyclage industriel et l'économie circulaire.",
      "La mesure et la réduction de l'empreinte carbone.",
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Industriels exportateurs soumis aux exigences européennes.' },
      { code: 'TN', country: 'Tunisie', text: 'Zones industrielles qui passent au solaire.' },
      { code: 'EG', country: 'Égypte', text: 'Grands sites industriels et zone du canal de Suez.' },
    ],
    opportunities: [
      { id: 'iv-1', title: 'Centrale solaire pour une zone industrielle', country: 'Tunisie', countryCode: 'TN', type: 'Projet clé en main' },
      { id: 'iv-2', title: 'Unité de recyclage des plastiques', country: 'Maroc', countryCode: 'MA', type: 'Joint-venture' },
    ],
    services: [
      'Réaliser un premier bilan énergétique et carbone.',
      "Sélectionner des fournisseurs chinois d'équipements verts.",
      'Identifier les financements verts disponibles.',
      'Préparer vos exportations aux exigences du MACF.',
    ],
  },
  'en-solaire': {
    intro:
      "L'Afrique du Nord bénéficie de l'un des meilleurs ensoleillements au monde, et la Chine domine la fabrication des panneaux, onduleurs et batteries. Centrales au sol, toitures industrielles et pompage solaire offrent des débouchés à tous les niveaux.",
    figures: [
      { value: '580 MW', label: 'complexe Noor Ouarzazate au Maroc' },
      { value: '≈ 1,65 GW', label: 'parc solaire de Benban en Égypte' },
      { value: '> 80 %', label: 'des modules solaires du monde fabriqués en Chine' },
    ],
    trends: [
      "Les appels d'offres publics pour de grandes centrales.",
      "L'autoconsommation dans l'industrie et l'agriculture.",
      "L'association du solaire et du stockage par batteries.",
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: "Programme Noor et projets privés pour l'industrie." },
      { code: 'EG', country: 'Égypte', text: 'Benban et projets dans la zone du canal de Suez.' },
      { code: 'TN', country: 'Tunisie', text: 'Concessions solaires et autoproduction.' },
    ],
    opportunities: [
      { id: 'es-1', title: 'Toitures solaires pour zones industrielles', country: 'Maroc', countryCode: 'MA', type: 'Projet clé en main' },
      { id: 'es-2', title: 'Pompage solaire agricole', country: 'Algérie', countryCode: 'DZ', type: 'Fourniture' },
    ],
    services: [
      "Sélectionner des fabricants chinois de modules et d'onduleurs certifiés.",
      "Suivre les appels d'offres solaires du Maghreb.",
      'Monter des consortiums EPC sino-maghrébins.',
      'Vérifier les certifications IEC et la conformité au réseau.',
    ],
  },
  'en-eolien': {
    intro:
      "Les côtes du Maroc et le golfe de Suez comptent parmi les sites les plus ventés de la région. Les turbiniers chinois, devenus leaders mondiaux, accompagnent la croissance des parcs terrestres et préparent les premiers projets en mer.",
    figures: [
      { value: '≈ 2 GW', label: 'de capacité éolienne installée au Maroc' },
      { value: '545 MW', label: 'parc de Zafarana en Égypte' },
      { value: '1re', label: 'puissance éolienne mondiale : la Chine' },
    ],
    trends: [
      'Des parcs terrestres de plus en plus puissants.',
      "Les premiers projets d'éolien en mer en Méditerranée.",
      "Le couplage de l'éolien avec l'hydrogène vert.",
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Tarfaya, Tanger et projets du programme éolien national.' },
      { code: 'EG', country: 'Égypte', text: 'Golfe de Suez : Zafarana et Ras Ghareb.' },
      { code: 'TN', country: 'Tunisie', text: 'Sites du Cap Bon et projets en concession.' },
    ],
    opportunities: [
      { id: 'ee-1', title: "Fourniture d'éoliennes pour un parc de 200 MW", country: 'Égypte', countryCode: 'EG', type: 'Fourniture' },
      { id: 'ee-2', title: 'Maintenance de parcs éoliens', country: 'Maroc', countryCode: 'MA', type: 'Services' },
    ],
    services: [
      'Identifier des turbiniers et sous-traitants chinois.',
      'Accompagner les études de vent et de raccordement.',
      "Suivre les appels d'offres éoliens.",
      'Organiser la formation des équipes de maintenance.',
    ],
  },
  'en-h2': {
    intro:
      "Grâce au soleil, au vent et à la proximité de l'Europe, l'Afrique du Nord veut produire de l'hydrogène vert et de l'ammoniac pour l'export. La Chine, premier fabricant d'électrolyseurs, est un partenaire naturel pour ces projets.",
    figures: [
      { value: '1 million d’ha', label: "de foncier réservé par le Maroc à l'hydrogène vert" },
      { value: 'SCZONE', label: "zone égyptienne qui concentre les projets d'hydrogène vert" },
      { value: '1er', label: "fabricant mondial d'électrolyseurs : la Chine" },
    ],
    trends: [
      "Les projets d'ammoniac vert destiné à l'export.",
      'Des électrolyseurs chinois à coût compétitif.',
      "Les corridors d'hydrogène vers l'Europe.",
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: '« Offre Maroc » dédiée à l’hydrogène vert.' },
      { code: 'EG', country: 'Égypte', text: "Projets d'ammoniac vert dans la zone du canal de Suez." },
      { code: 'TN', country: 'Tunisie', text: "Stratégie nationale et projet de corridor vers l'Europe." },
    ],
    opportunities: [
      { id: 'eh-1', title: "Fourniture d'électrolyseurs", country: 'Égypte', countryCode: 'EG', type: 'Fourniture' },
      { id: 'eh-2', title: "Étude d'un site d'ammoniac vert", country: 'Maroc', countryCode: 'MA', type: 'Étude' },
    ],
    services: [
      "Mettre en relation avec des fabricants chinois d'électrolyseurs.",
      'Structurer des consortiums pour répondre aux appels à projets.',
      'Analyser les cadres réglementaires nationaux.',
      "Identifier les financements et les acheteurs à l'export.",
    ],
  },
  'en-stockage': {
    intro:
      "Le stockage par batteries stabilise les réseaux et valorise l'énergie solaire et éolienne. Les fabricants chinois de batteries lithium-fer-phosphate (LFP) proposent des systèmes pour les centrales, les industriels et les sites isolés.",
    figures: [
      { value: 'LFP', label: 'technologie de batterie la plus utilisée pour le stockage' },
      { value: '> 75 %', label: 'des batteries lithium-ion produites en Chine' },
      { value: '24 h/24', label: "d'électricité solaire grâce au stockage" },
    ],
    trends: [
      'De grands systèmes de stockage couplés aux centrales solaires.',
      'Le stockage pour les usines et les zones industrielles.',
      'Les micro-réseaux pour les sites isolés.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Projets solaires avec stockage et réseaux intelligents.' },
      { code: 'EG', country: 'Égypte', text: 'Stockage associé aux grands parcs solaires et éoliens.' },
      { code: 'TN', country: 'Tunisie', text: "Industriels et zones d'activités." },
    ],
    opportunities: [
      { id: 'et-1', title: 'Système de stockage de 100 MWh', country: 'Égypte', countryCode: 'EG', type: 'Projet clé en main' },
      { id: 'et-2', title: 'Micro-réseaux pour sites isolés', country: 'Algérie', countryCode: 'DZ', type: 'Fourniture' },
    ],
    services: [
      'Comparer les fournisseurs chinois de batteries et de systèmes de stockage.',
      'Vérifier les normes de sécurité et les garanties.',
      'Dimensionner une solution avec nos partenaires techniques.',
      'Organiser la maintenance et le recyclage des batteries.',
    ],
  },
  'en-reseau': {
    intro:
      "Raccorder les nouvelles centrales et relier les pays entre eux demande des lignes, des postes et des réseaux intelligents. Les groupes chinois du secteur électrique fournissent câbles, transformateurs et solutions de pilotage.",
    figures: [
      { value: 'Maroc – Espagne', label: 'liaison électrique déjà en service' },
      { value: 'ELMED', label: "projet de câble sous-marin entre la Tunisie et l'Italie" },
      { value: 'Réseaux intelligents', label: 'pour piloter la production et la demande' },
    ],
    trends: [
      "Les interconnexions entre pays et avec l'Europe.",
      'Les compteurs intelligents et la gestion à distance.',
      'La réduction des pertes sur les réseaux.',
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: "Interconnexion en construction avec l'Arabie saoudite." },
      { code: 'TN', country: 'Tunisie', text: "Projet ELMED de liaison avec l'Italie." },
      { code: 'DZ', country: 'Algérie', text: 'Extension du réseau vers le sud et les sites solaires.' },
    ],
    opportunities: [
      { id: 'er-1', title: 'Fourniture de transformateurs et de câbles', country: 'Algérie', countryCode: 'DZ', type: 'Fourniture' },
      { id: 'er-2', title: 'Déploiement de compteurs intelligents', country: 'Tunisie', countryCode: 'TN', type: 'Projet public' },
    ],
    services: [
      "Suivre les appels d'offres des sociétés d'électricité.",
      'Trouver des fabricants chinois de câbles et de transformateurs.',
      'Vérifier les normes et les procédures de qualification.',
      'Préparer des offres groupées avec des partenaires locaux.',
    ],
  },
  'en-efficacite': {
    intro:
      "Consommer moins d'énergie est souvent le gain le plus rapide pour une entreprise. Éclairage LED, pompes à chaleur, moteurs efficaces et gestion technique des bâtiments réduisent la facture des usines, des hôtels et des bâtiments publics.",
    figures: [
      { value: "Jusqu'à 60 %", label: "d'économie sur l'éclairage avec des LED" },
      { value: 'Audit', label: "première étape de tout projet d'efficacité" },
      { value: '2 à 4 ans', label: 'de retour sur investissement fréquent' },
    ],
    trends: [
      'Les audits énergétiques obligatoires pour les gros consommateurs.',
      'La rénovation énergétique des hôtels et des bâtiments publics.',
      'La gestion technique centralisée des bâtiments.',
    ],
    markets: [
      { code: 'TN', country: 'Tunisie', text: "Programmes d'aide à la maîtrise de l'énergie." },
      { code: 'MA', country: 'Maroc', text: "Efficacité énergétique dans l'industrie et le bâtiment." },
      { code: 'EG', country: 'Égypte', text: "Baisse des subventions et hausse du prix de l'énergie." },
    ],
    opportunities: [
      { id: 'ef-1', title: "Rénovation énergétique d'hôtels", country: 'Tunisie', countryCode: 'TN', type: 'Services' },
      { id: 'ef-2', title: 'Éclairage public LED', country: 'Maroc', countryCode: 'MA', type: 'Projet public' },
    ],
    services: [
      'Réaliser un audit énergétique avec nos partenaires.',
      'Sourcer des équipements efficaces auprès de fabricants chinois.',
      'Monter des contrats de performance énergétique.',
      'Identifier les aides et les financements disponibles.',
    ],
  },
};
