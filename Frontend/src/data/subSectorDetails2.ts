import type { SubSectorDetail } from './subSectorDetails';

/** Contenu propre à chaque sous-secteur : construction, agriculture, technologies. */
export const SUB_SECTOR_DETAILS_2: Record<string, SubSectorDetail> = {
  'c-residentiel': {
    intro:
      "La croissance urbaine crée un besoin durable de logements en Afrique du Nord, du logement social aux résidences haut de gamme. Les entreprises chinoises de construction apportent rapidité d'exécution, préfabrication et financements adaptés aux grands programmes.",
    figures: [
      { value: 'AADL', label: 'programmes algériens de logements en location-vente' },
      { value: 'Villes nouvelles', label: 'en Égypte, autour de la nouvelle capitale administrative' },
      { value: 'Préfabrication', label: 'pour livrer plus vite et à coût maîtrisé' },
    ],
    trends: [
      'Les grands programmes publics de logement social.',
      'La construction préfabriquée et modulaire.',
      'Les logements économes en énergie et connectés.',
    ],
    markets: [
      { code: 'DZ', country: 'Algérie', text: 'Programmes publics de logement de grande ampleur.' },
      { code: 'EG', country: 'Égypte', text: 'Villes nouvelles et projets résidentiels intégrés.' },
      { code: 'MA', country: 'Maroc', text: "Aide directe au logement et quartiers nouveaux." },
    ],
    opportunities: [
      { id: 'cr-1', title: 'Programme de logements préfabriqués', country: 'Algérie', countryCode: 'DZ', type: 'Construction' },
      { id: 'cr-2', title: 'Résidence connectée dans une ville nouvelle', country: 'Égypte', countryCode: 'EG', type: 'Co-investissement' },
    ],
    services: [
      'Identifier des entreprises chinoises de construction qualifiées.',
      'Sourcer matériaux, menuiseries et équipements au meilleur coût.',
      "Suivre les appels d'offres des programmes publics.",
      "Accompagner les partenariats entre promoteurs et constructeurs.",
    ],
  },
  'c-commercial': {
    intro:
      "Bureaux, centres commerciaux, hôtels et espaces mixtes accompagnent l'essor des métropoles du Maghreb et de l'Égypte. Les investisseurs recherchent des partenaires capables de concevoir, construire et équiper des bâtiments modernes.",
    figures: [
      { value: 'Iconic Tower', label: "plus haute tour d'Afrique, construite par une entreprise chinoise au Caire" },
      { value: 'Usage mixte', label: 'bureaux, commerces et logements dans un même projet' },
      { value: 'Clé en main', label: 'de la conception à la livraison' },
    ],
    trends: [
      'Les quartiers d’affaires des nouvelles capitales et des métropoles.',
      'Les projets mixtes qui combinent bureaux, commerces et logements.',
      'Les bâtiments certifiés pour leur performance environnementale.',
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: "Quartier d'affaires de la nouvelle capitale administrative." },
      { code: 'MA', country: 'Maroc', text: 'Casablanca Finance City et projets à Rabat et Tanger.' },
      { code: 'TN', country: 'Tunisie', text: 'Les Berges du Lac et pôles commerciaux de Tunis.' },
    ],
    opportunities: [
      { id: 'cc-1', title: 'Centre commercial de nouvelle génération', country: 'Maroc', countryCode: 'MA', type: 'Co-investissement' },
      { id: 'cc-2', title: 'Façades et équipements pour une tour de bureaux', country: 'Égypte', countryCode: 'EG', type: 'Fourniture' },
    ],
    services: [
      'Mettre en relation investisseurs, promoteurs et entreprises de construction.',
      'Sourcer façades, ascenseurs et équipements techniques.',
      'Analyser le marché et la demande locale.',
      'Accompagner les montages juridiques et financiers.',
    ],
  },
  'c-publiques': {
    intro:
      "Routes, ponts, ports, aéroports, stades et réseaux urbains : l'Afrique du Nord investit massivement dans ses infrastructures. Les groupes chinois de travaux publics y réalisent déjà des projets majeurs et cherchent des partenaires locaux.",
    figures: [
      { value: 'Mondial 2030', label: 'stades et transports à préparer au Maroc' },
      { value: 'Grande Mosquée d’Alger', label: 'construite par une entreprise chinoise' },
      { value: 'PPP', label: 'partenariats public-privé de plus en plus utilisés' },
    ],
    trends: [
      'Les infrastructures liées aux grands événements sportifs.',
      'Les transports urbains : tramways, métros, bus rapides.',
      'Les partenariats public-privé pour financer les projets.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Stades, routes et transports pour la Coupe du monde 2030.' },
      { code: 'DZ', country: 'Algérie', text: 'Autoroutes, rail et équipements publics.' },
      { code: 'EG', country: 'Égypte', text: 'Monorail, ponts et réseaux de la nouvelle capitale.' },
    ],
    opportunities: [
      { id: 'cp-1', title: 'Sous-traitance pour un chantier autoroutier', country: 'Algérie', countryCode: 'DZ', type: 'Sous-traitance' },
      { id: 'cp-2', title: 'Équipements pour un réseau de tramway', country: 'Maroc', countryCode: 'MA', type: 'Fourniture' },
    ],
    services: [
      "Suivre les appels d'offres internationaux de travaux publics.",
      'Constituer des groupements sino-maghrébins.',
      'Identifier sous-traitants et fournisseurs locaux.',
      'Accompagner les procédures de PPP et de financement.',
    ],
  },
  'c-durable': {
    intro:
      "Les bâtiments consomment une grande part de l'énergie du pays. Isolation, ventilation, toitures solaires et matériaux écologiques permettent de construire mieux, avec des solutions chinoises éprouvées et compétitives.",
    figures: [
      { value: 'Green City', label: 'ville verte Mohammed VI de Benguerir au Maroc' },
      { value: 'Solaire en toiture', label: 'pour réduire la facture des bâtiments' },
      { value: 'Matériaux biosourcés', label: 'terre, bois et isolants naturels' },
    ],
    trends: [
      'Les réglementations thermiques des bâtiments neufs.',
      'Les certifications de bâtiments verts.',
      'Les toitures solaires et le stockage pour les bâtiments.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Villes vertes et règlement thermique de construction.' },
      { code: 'TN', country: 'Tunisie', text: 'Bâtiments publics et hôtels économes en énergie.' },
      { code: 'EG', country: 'Égypte', text: 'Projets urbains labellisés dans les villes nouvelles.' },
    ],
    opportunities: [
      { id: 'cd-1', title: "Isolation et fenêtres performantes pour l'hôtellerie", country: 'Tunisie', countryCode: 'TN', type: 'Fourniture' },
      { id: 'cd-2', title: 'Quartier écologique pilote', country: 'Maroc', countryCode: 'MA', type: 'Partenariat' },
    ],
    services: [
      'Sourcer des matériaux et équipements performants.',
      'Vérifier les certifications et la conformité locale.',
      'Mettre en relation avec des bureaux d’études spécialisés.',
      'Identifier les financements verts pour le bâtiment.',
    ],
  },
  'c-materiaux': {
    intro:
      "Ciment, acier, verre, aluminium et matériaux innovants alimentent les chantiers de la région. Importer au bon prix, produire localement ou distribuer de nouvelles solutions : chaque modèle a ses opportunités.",
    figures: [
      { value: 'Ciment', label: "exporté par l'Algérie et l'Égypte" },
      { value: 'Verre & aluminium', label: 'très demandés pour les façades modernes' },
      { value: 'Normes locales', label: 'à vérifier avant chaque importation' },
    ],
    trends: [
      'Les matériaux légers et préfabriqués.',
      'Les ciments et bétons à faible empreinte carbone.',
      "L'importation de produits finis de second œuvre depuis la Chine.",
    ],
    markets: [
      { code: 'LY', country: 'Libye', text: 'Reconstruction et forte demande en matériaux.' },
      { code: 'DZ', country: 'Algérie', text: 'Production locale de ciment et d’acier.' },
      { code: 'EG', country: 'Égypte', text: 'Villes nouvelles et grands projets publics.' },
    ],
    opportunities: [
      { id: 'cm-1', title: 'Importation de menuiseries aluminium', country: 'Libye', countryCode: 'LY', type: 'Distribution' },
      { id: 'cm-2', title: 'Unité de béton prêt à l’emploi', country: 'Maroc', countryCode: 'MA', type: 'Investissement' },
    ],
    services: [
      'Sourcer des matériaux auprès de fabricants chinois audités.',
      'Comparer les coûts rendus avec le fret et les droits.',
      'Vérifier la conformité aux normes du pays de destination.',
      'Trouver des distributeurs et des négociants locaux.',
    ],
  },
  'c-smart': {
    intro:
      "Les villes intelligentes combinent urbanisme, transports, énergie et services numériques. Les entreprises chinoises, très actives dans les technologies urbaines, accompagnent les villes nouvelles d'Égypte et du Maroc.",
    figures: [
      { value: 'Nouvelle capitale', label: "projet de ville intelligente en Égypte" },
      { value: 'IoT', label: 'capteurs pour l’éclairage, l’eau et la circulation' },
      { value: 'Mobilité', label: 'transports propres et billettique intégrée' },
    ],
    trends: [
      'La gestion intelligente de l’éclairage, de l’eau et des déchets.',
      'Les centres de supervision urbaine.',
      'La mobilité électrique et partagée.',
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: 'Villes nouvelles connectées et services numériques publics.' },
      { code: 'MA', country: 'Maroc', text: 'Benguerir, Casablanca et projets de mobilité durable.' },
      { code: 'TN', country: 'Tunisie', text: 'Projets municipaux pilotes de ville intelligente.' },
    ],
    opportunities: [
      { id: 'cs-1', title: "Gestion intelligente de l'éclairage public", country: 'Égypte', countryCode: 'EG', type: 'Projet public' },
      { id: 'cs-2', title: 'Billettique pour transports urbains', country: 'Maroc', countryCode: 'MA', type: 'Partenariat technologique' },
    ],
    services: [
      'Identifier les fournisseurs chinois de solutions urbaines.',
      "Suivre les appels d'offres des villes et des agences publiques.",
      'Monter des projets pilotes avec les collectivités.',
      'Vérifier la sécurité des données et la conformité locale.',
    ],
  },
  'ag-olei': {
    intro:
      "La Tunisie compte parmi les premiers producteurs et exportateurs d'huile d'olive au monde, et le Maroc et l'Algérie développent leurs vergers. En Chine, la demande en huile d'olive de qualité progresse, portée par la cuisine saine et les cadeaux haut de gamme.",
    figures: [
      { value: '≈ 340 000 t', label: "d'huile d'olive produites en Tunisie en 2024-2025" },
      { value: '1er', label: "exportateur mondial d'huile d'olive bio : la Tunisie" },
      { value: 'GACC', label: 'enregistrement obligatoire pour vendre en Chine' },
    ],
    trends: [
      "L'export en bouteilles de marque plutôt qu'en vrac.",
      "Les huiles bio et à indication d'origine.",
      'La vente en ligne en Chine : Tmall, JD, Douyin.',
    ],
    markets: [
      { code: 'TN', country: 'Tunisie', text: 'Sfax, Sousse, Kairouan : cœur de la production.' },
      { code: 'MA', country: 'Maroc', text: 'Vergers modernes de Meknès et Marrakech.' },
      { code: 'CN', country: 'Chine', text: 'Shanghai, Pékin et Canton : marchés de consommation.' },
    ],
    opportunities: [
      { id: 'ao-1', title: "Exportation d'huile d'olive bio en bouteilles", country: 'Chine', countryCode: 'CN', type: 'Export' },
      { id: 'ao-2', title: 'Moulin et ligne de conditionnement moderne', country: 'Tunisie', countryCode: 'TN', type: 'Équipement' },
    ],
    services: [
      "Préparer l'enregistrement GACC et l'étiquetage chinois.",
      'Trouver des importateurs et distributeurs en Chine.',
      'Accompagner la création de marque et la vente en ligne.',
      "Sourcer des équipements de trituration et d'embouteillage.",
    ],
  },
  'ag-fruits': {
    intro:
      "Agrumes, dattes, tomates et fruits rouges font la réputation des producteurs nord-africains. De nouveaux protocoles sanitaires ouvrent progressivement le marché chinois, très demandeur de fruits de qualité.",
    figures: [
      { value: '1er', label: "exportateur mondial d'oranges : l'Égypte" },
      { value: 'Deglet Nour', label: 'variété de dattes phare de Tunisie et d’Algérie' },
      { value: 'Chaîne du froid', label: 'clé pour exporter des produits frais' },
    ],
    trends: [
      "L'ouverture du marché chinois par protocole phytosanitaire.",
      'Les fruits transformés : jus, purées, fruits secs.',
      'La logistique sous température dirigée.',
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: 'Oranges et raisins de table pour l’export.' },
      { code: 'TN', country: 'Tunisie', text: 'Dattes Deglet Nour et agrumes du Cap Bon.' },
      { code: 'MA', country: 'Maroc', text: 'Agrumes, tomates et fruits rouges.' },
    ],
    opportunities: [
      { id: 'af-1', title: 'Exportation de dattes vers la Chine', country: 'Chine', countryCode: 'CN', type: 'Export' },
      { id: 'af-2', title: 'Station de conditionnement frigorifique', country: 'Égypte', countryCode: 'EG', type: 'Investissement' },
    ],
    services: [
      'Vérifier les protocoles sanitaires en vigueur pour chaque produit.',
      'Trouver des importateurs chinois de fruits.',
      'Organiser la logistique sous température dirigée.',
      'Accompagner les certifications GLOBALG.A.P. et bio.',
    ],
  },
  'ag-tech': {
    intro:
      "Le manque d'eau pousse l'agriculture nord-africaine vers l'irrigation de précision, les serres et le pilotage numérique. La Chine fabrique à grande échelle serres, systèmes goutte-à-goutte, capteurs et drones agricoles.",
    figures: [
      { value: 'Goutte-à-goutte', label: "pour économiser l'eau d'irrigation" },
      { value: 'Génération Green', label: 'stratégie agricole du Maroc 2020-2030' },
      { value: 'Drones', label: 'pour traiter et surveiller les cultures' },
    ],
    trends: [
      "L'irrigation de précision et le pompage solaire.",
      'Les serres modernes pour produire toute l’année.',
      'Les capteurs et applications de pilotage des cultures.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Souss-Massa et grands périmètres irrigués.' },
      { code: 'EG', country: 'Égypte', text: 'Projets de bonification des terres désertiques.' },
      { code: 'DZ', country: 'Algérie', text: 'Agriculture saharienne et nouvelles exploitations.' },
    ],
    opportunities: [
      { id: 'at-1', title: 'Serres multichapelles pour maraîchage', country: 'Algérie', countryCode: 'DZ', type: 'Fourniture' },
      { id: 'at-2', title: 'Irrigation goutte-à-goutte et pompage solaire', country: 'Maroc', countryCode: 'MA', type: 'Projet clé en main' },
    ],
    services: [
      'Sourcer serres, systèmes d’irrigation et capteurs.',
      'Mettre en relation avec des intégrateurs agricoles.',
      'Organiser des démonstrations et des visites techniques.',
      'Identifier les subventions agricoles disponibles.',
    ],
  },
  'ag-cereales': {
    intro:
      "Le blé, l'orge et les légumineuses sont au cœur de la sécurité alimentaire de la région, qui importe une grande partie de ses besoins. Stockage, semences, mécanisation et transformation offrent de nombreux débouchés.",
    figures: [
      { value: '1er', label: "importateur mondial de blé : l'Égypte" },
      { value: 'Silos', label: 'capacités de stockage à moderniser' },
      { value: 'Mécanisation', label: 'tracteurs et moissonneuses à renouveler' },
    ],
    trends: [
      'Le développement de la production locale de céréales.',
      'La modernisation du stockage pour limiter les pertes.',
      'La transformation : semoules, pâtes, aliments du bétail.',
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: 'Grands besoins en importation et en stockage.' },
      { code: 'DZ', country: 'Algérie', text: 'Développement des céréales dans le sud.' },
      { code: 'MA', country: 'Maroc', text: 'Semences et mécanisation agricole.' },
    ],
    opportunities: [
      { id: 'ac-1', title: 'Silos métalliques de stockage', country: 'Algérie', countryCode: 'DZ', type: 'Fourniture' },
      { id: 'ac-2', title: 'Moissonneuses-batteuses et tracteurs', country: 'Égypte', countryCode: 'EG', type: 'Distribution' },
    ],
    services: [
      'Sourcer silos, machines agricoles et équipements de minoterie.',
      'Comparer les offres de fabricants chinois.',
      'Organiser le service après-vente et les pièces détachées.',
      "Suivre les appels d'offres des offices céréaliers.",
    ],
  },
  'ag-lait': {
    intro:
      "La consommation de lait et de produits laitiers progresse, mais la production locale reste insuffisante dans plusieurs pays. Élevage moderne, collecte, transformation et emballage sont autant de maillons à renforcer.",
    figures: [
      { value: 'Poudre de lait', label: "encore largement importée par l'Algérie" },
      { value: 'Collecte', label: 'centres réfrigérés à développer' },
      { value: 'Chaîne du froid', label: 'indispensable de la ferme au rayon' },
    ],
    trends: [
      'Les fermes laitières modernes et la génétique animale.',
      'Les centres de collecte réfrigérés.',
      'Les fromages et produits laitiers à plus forte valeur.',
    ],
    markets: [
      { code: 'DZ', country: 'Algérie', text: "Politique de réduction des importations de poudre de lait." },
      { code: 'TN', country: 'Tunisie', text: 'Transformation laitière et fromagerie.' },
      { code: 'EG', country: 'Égypte', text: 'Grand marché de consommation en croissance.' },
    ],
    opportunities: [
      { id: 'al-1', title: 'Ferme laitière moderne', country: 'Algérie', countryCode: 'DZ', type: 'Co-investissement' },
      { id: 'al-2', title: 'Ligne de production de fromages', country: 'Tunisie', countryCode: 'TN', type: 'Équipement' },
    ],
    services: [
      'Sourcer équipements de traite, de collecte et de transformation.',
      'Mettre en relation avec des investisseurs du secteur.',
      'Accompagner les normes sanitaires et la qualité.',
      'Étudier la faisabilité de projets laitiers.',
    ],
  },
  'ag-durable': {
    intro:
      "Agriculture biologique, gestion économe de l'eau et pratiques adaptées au climat renforcent la valeur des produits nord-africains. Ces démarches répondent à la demande croissante de produits sains en Europe comme en Chine.",
    figures: [
      { value: 'Bio', label: 'filière en forte croissance en Tunisie' },
      { value: 'Climat', label: 'sécheresses à anticiper dans toute la région' },
      { value: 'Traçabilité', label: 'attendue par les acheteurs internationaux' },
    ],
    trends: [
      "L'agriculture biologique certifiée pour l'export.",
      "La réutilisation des eaux et l'irrigation économe.",
      'Les variétés résistantes à la chaleur et à la sécheresse.',
    ],
    markets: [
      { code: 'TN', country: 'Tunisie', text: 'Huile d’olive, dattes et plantes aromatiques bio.' },
      { code: 'MA', country: 'Maroc', text: 'Argan, plantes médicinales et produits du terroir.' },
      { code: 'EG', country: 'Égypte', text: 'Herbes, épices et coton biologiques.' },
    ],
    opportunities: [
      { id: 'ad-1', title: 'Plantes aromatiques bio pour la Chine', country: 'Chine', countryCode: 'CN', type: 'Export' },
      { id: 'ad-2', title: "Station de traitement des eaux pour l'irrigation", country: 'Tunisie', countryCode: 'TN', type: 'Projet public' },
    ],
    services: [
      'Accompagner les certifications biologiques.',
      'Trouver des acheteurs de produits durables.',
      "Sourcer des solutions de gestion de l'eau.",
      'Mettre en place la traçabilité des lots.',
    ],
  },
  'tech-ia': {
    intro:
      "L'intelligence artificielle transforme l'industrie, la santé, la finance et les services publics. Les géants chinois de l'IA et les ingénieurs nord-africains, nombreux et multilingues, peuvent développer ensemble des solutions adaptées à la région.",
    figures: [
      { value: 'Digital Morocco 2030', label: 'stratégie numérique du Maroc' },
      { value: 'Arabe & français', label: 'langues à intégrer dans les modèles d’IA' },
      { value: 'Ingénieurs', label: 'formés chaque année en grand nombre au Maghreb' },
    ],
    trends: [
      'Les assistants et modèles de langage en arabe et en français.',
      "La vision par ordinateur pour l'industrie et l'agriculture.",
      'L’automatisation des services clients et administratifs.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: 'Stratégie Digital Morocco 2030 et technoparcs.' },
      { code: 'TN', country: 'Tunisie', text: 'Startup Act et ingénieurs reconnus en IA.' },
      { code: 'EG', country: 'Égypte', text: 'Stratégie nationale pour l’intelligence artificielle.' },
    ],
    opportunities: [
      { id: 'ti-1', title: "Vision par ordinateur pour le contrôle qualité", country: 'Tunisie', countryCode: 'TN', type: 'Partenariat technologique' },
      { id: 'ti-2', title: 'Assistant virtuel bilingue pour les services publics', country: 'Maroc', countryCode: 'MA', type: 'Projet public' },
    ],
    services: [
      'Mettre en relation start-up maghrébines et entreprises chinoises d’IA.',
      'Organiser des missions technologiques à Shenzhen et Pékin.',
      'Accompagner la protection des données et la conformité.',
      'Identifier les financements pour l’innovation.',
    ],
  },
  'tech-cloud': {
    intro:
      "Les entreprises et administrations veulent héberger leurs données au plus près, en sécurité et dans le respect des lois locales. Les fournisseurs chinois de cloud et de data centers accompagnent la construction d'infrastructures nationales.",
    figures: [
      { value: 'Cloud souverain', label: 'données hébergées dans le pays' },
      { value: 'Data centers', label: 'en construction au Maroc et en Égypte' },
      { value: 'Cybersécurité', label: 'priorité des entreprises et des États' },
    ],
    trends: [
      "Les data centers alimentés en énergie renouvelable.",
      'Les lois de protection des données personnelles.',
      'La migration des entreprises vers le cloud.',
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: 'Data centers et services cloud régionaux.' },
      { code: 'MA', country: 'Maroc', text: 'Projets de data centers verts.' },
      { code: 'DZ', country: 'Algérie', text: "Numérisation de l'administration et des entreprises." },
    ],
    opportunities: [
      { id: 'tc-1', title: 'Data center modulaire', country: 'Maroc', countryCode: 'MA', type: 'Co-investissement' },
      { id: 'tc-2', title: 'Services de cybersécurité pour PME', country: 'Tunisie', countryCode: 'TN', type: 'Partenariat' },
    ],
    services: [
      'Identifier des fournisseurs de cloud et d’équipements de data centers.',
      'Vérifier la conformité aux lois sur les données.',
      'Mettre en relation avec des intégrateurs locaux.',
      'Accompagner les appels d’offres publics numériques.',
    ],
  },
  'tech-telecom': {
    intro:
      "Fibre optique, réseaux mobiles 4G et 5G, connectivité rurale : les télécoms sont la base de l'économie numérique. Les équipementiers chinois Huawei et ZTE sont des partenaires de longue date des opérateurs nord-africains.",
    figures: [
      { value: '5G', label: 'en cours de déploiement en Afrique du Nord' },
      { value: 'Huawei & ZTE', label: 'équipementiers présents depuis des années' },
      { value: 'Fibre', label: 'jusqu’au domicile et aux entreprises' },
    ],
    trends: [
      'Le lancement de la 5G pour les villes et l’industrie.',
      'Le déploiement de la fibre jusqu’à l’abonné.',
      'La connectivité des zones rurales.',
    ],
    markets: [
      { code: 'MA', country: 'Maroc', text: '5G et fibre pour les grandes villes.' },
      { code: 'EG', country: 'Égypte', text: 'Grand marché mobile et lancement de la 5G.' },
      { code: 'DZ', country: 'Algérie', text: 'Extension de la fibre et de la 4G.' },
    ],
    opportunities: [
      { id: 'tt-1', title: 'Déploiement de fibre optique', country: 'Algérie', countryCode: 'DZ', type: 'Sous-traitance' },
      { id: 'tt-2', title: 'Pylônes et sites télécoms partagés', country: 'Égypte', countryCode: 'EG', type: 'Investissement' },
    ],
    services: [
      'Trouver des équipementiers et sous-traitants télécoms.',
      'Suivre les appels d’offres des opérateurs.',
      'Accompagner les agréments des régulateurs.',
      'Organiser des visites techniques en Chine.',
    ],
  },
  'tech-ecom': {
    intro:
      "Le commerce en ligne progresse vite en Afrique du Nord, porté par le mobile. Les plateformes et vendeurs chinois cherchent des partenaires locaux pour la livraison, le paiement et le service client, tandis que les marques du Maghreb visent les plateformes chinoises.",
    figures: [
      { value: 'Mobile', label: 'premier canal d’achat en ligne' },
      { value: 'Paiement à la livraison', label: 'encore très utilisé au Maghreb' },
      { value: 'Tmall Global', label: 'porte d’entrée des marques étrangères en Chine' },
    ],
    trends: [
      'La livraison rapide et les points relais.',
      'Le paiement mobile qui remplace peu à peu le paiement à la livraison.',
      'La vente en direct vidéo, née en Chine.',
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: 'Premier marché du e-commerce en Afrique du Nord.' },
      { code: 'MA', country: 'Maroc', text: 'Plateformes locales et vente sur les réseaux sociaux.' },
      { code: 'CN', country: 'Chine', text: 'Tmall Global, JD et Douyin pour les marques étrangères.' },
    ],
    opportunities: [
      { id: 'te-1', title: "Entrepôt et livraison pour vendeurs chinois", country: 'Égypte', countryCode: 'EG', type: 'Partenariat logistique' },
      { id: 'te-2', title: 'Boutique de produits maghrébins sur Tmall Global', country: 'Chine', countryCode: 'CN', type: 'Export' },
    ],
    services: [
      'Choisir les bonnes plateformes de part et d’autre.',
      'Organiser la logistique transfrontalière et les retours.',
      'Mettre en place les solutions de paiement.',
      'Adapter les fiches produits et la communication.',
    ],
  },
  'tech-fintech': {
    intro:
      "Une grande partie de la population reste peu bancarisée, ce qui ouvre la voie au paiement mobile, au microcrédit et aux portefeuilles électroniques. L'expérience chinoise de WeChat Pay et Alipay inspire les solutions de la région.",
    figures: [
      { value: 'InstaPay', label: 'paiement instantané lancé en Égypte' },
      { value: 'Portefeuilles mobiles', label: 'en forte croissance au Maroc et en Tunisie' },
      { value: 'Inclusion', label: 'des populations peu bancarisées' },
    ],
    trends: [
      'Le paiement mobile et par QR code.',
      'Le microcrédit et le financement des petites entreprises.',
      'Les transferts d’argent internationaux moins chers.',
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: 'Écosystème fintech parmi les plus actifs d’Afrique.' },
      { code: 'MA', country: 'Maroc', text: 'Paiement mobile et régulation favorable.' },
      { code: 'TN', country: 'Tunisie', text: 'Start-up fintech et bac à sable réglementaire.' },
    ],
    opportunities: [
      { id: 'tf-1', title: 'Paiement par QR code pour commerçants', country: 'Maroc', countryCode: 'MA', type: 'Partenariat technologique' },
      { id: 'tf-2', title: 'Plateforme de microcrédit', country: 'Égypte', countryCode: 'EG', type: 'Investissement' },
    ],
    services: [
      'Mettre en relation fintechs chinoises et acteurs locaux.',
      'Analyser les régulations bancaires et les licences.',
      'Identifier des investisseurs du secteur.',
      'Accompagner les projets pilotes avec les banques.',
    ],
  },
  'tech-smart': {
    intro:
      "Capteurs, transports intelligents et gestion automatisée de l'énergie rendent les villes plus efficaces. Les technologies chinoises de l'Internet des objets sont déjà utilisées dans de nombreuses villes du monde.",
    figures: [
      { value: 'IoT', label: 'capteurs connectés pour les services urbains' },
      { value: 'Supervision', label: 'centres de pilotage de la ville' },
      { value: 'Énergie', label: 'éclairage et bâtiments pilotés à distance' },
    ],
    trends: [
      'La gestion du trafic et du stationnement.',
      "Le comptage intelligent de l'eau et de l'électricité.",
      'La vidéoprotection et la gestion des urgences.',
    ],
    markets: [
      { code: 'EG', country: 'Égypte', text: 'Villes nouvelles connectées.' },
      { code: 'MA', country: 'Maroc', text: 'Projets de villes intelligentes et de mobilité.' },
      { code: 'TN', country: 'Tunisie', text: 'Communes pilotes pour les services numériques.' },
    ],
    opportunities: [
      { id: 'tz-1', title: 'Gestion intelligente du stationnement', country: 'Tunisie', countryCode: 'TN', type: 'Projet public' },
      { id: 'tz-2', title: "Compteurs d'eau connectés", country: 'Égypte', countryCode: 'EG', type: 'Fourniture' },
    ],
    services: [
      'Sourcer capteurs et plateformes IoT.',
      'Monter des projets pilotes avec les villes.',
      'Vérifier la sécurité et la protection des données.',
      'Identifier les financements de projets urbains.',
    ],
  },
};
