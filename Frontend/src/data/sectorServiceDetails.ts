/** Fiche de chaque service d'accompagnement proposé sur les pages secteurs : ce qu'il comprend et comment il se déroule. */
export interface SectorServiceDetail {
  intro: string;
  includes: string[];
  steps: string[];
}

const PARTNERS: SectorServiceDetail = {
  intro: 'QIAO recherche pour vous les entreprises, investisseurs et institutions qui correspondent à votre projet, en Chine comme en Afrique du Nord.',
  includes: [
    'Définition du profil de partenaire recherché',
    'Présélection de partenaires vérifiés',
    'Fiche de présentation de chaque partenaire',
    'Premier contact et organisation des échanges',
  ],
  steps: [
    'Entretien pour comprendre votre projet et vos critères',
    'Recherche et vérification des partenaires possibles',
    'Présentation d’une liste courte et mise en relation',
  ],
};

const STUDIES: SectorServiceDetail = {
  intro: 'Une analyse claire du marché visé pour décider en connaissance de cause : demande, concurrence, prix, réglementation et risques.',
  includes: [
    'Taille et évolution du marché',
    'Concurrents et niveaux de prix',
    'Règles d’importation et normes applicables',
    'Recommandations et plan d’action',
  ],
  steps: [
    'Cadrage des questions auxquelles l’étude doit répondre',
    'Collecte des données et entretiens sur le terrain',
    'Remise du rapport et présentation des conclusions',
  ],
};

const MATCHMAKING: SectorServiceDetail = {
  intro: 'Des rendez-vous d’affaires préparés avec des interlocuteurs sérieux, sur place ou à distance, avec un accompagnement bilingue.',
  includes: [
    'Sélection d’interlocuteurs qualifiés',
    'Préparation des rendez-vous B2B',
    'Interprétariat chinois, arabe, français et anglais',
    'Suivi après chaque rencontre',
  ],
  steps: [
    'Définition de vos objectifs et de vos cibles',
    'Organisation de l’agenda de rendez-vous',
    'Compte rendu et suivi des prochaines étapes',
  ],
};

const FINANCING: SectorServiceDetail = {
  intro: 'Des conseils pour financer votre projet : banques, fonds, partenariats public-privé et investisseurs chinois ou nord-africains.',
  includes: [
    'Analyse des besoins de financement',
    'Identification des sources de financement adaptées',
    'Préparation du dossier et de la présentation',
    'Mise en relation avec les financeurs',
  ],
  steps: [
    'Diagnostic du projet et du montant recherché',
    'Choix des financements et préparation du dossier',
    'Présentation aux financeurs et suivi des réponses',
  ],
};

const WATCH: SectorServiceDetail = {
  intro: 'Un suivi régulier des projets, des appels d’offres et des évolutions du secteur pour saisir les opportunités au bon moment.',
  includes: [
    'Suivi des appels d’offres publics et privés',
    'Alertes sur les nouveaux projets',
    'Veille réglementaire et concurrentielle',
    'Synthèse régulière des informations utiles',
  ],
  steps: [
    'Choix des sujets, pays et sources à suivre',
    'Mise en place des alertes',
    'Envoi régulier des synthèses et des opportunités',
  ],
};

const FEASIBILITY: SectorServiceDetail = {
  intro: 'Une étude qui vérifie si votre projet est réalisable et rentable avant d’engager des investissements importants.',
  includes: [
    'Analyse technique et choix du site',
    'Estimation des coûts et des revenus',
    'Cadre réglementaire et autorisations',
    'Analyse des risques et recommandations',
  ],
  steps: [
    'Cadrage du projet et des hypothèses',
    'Analyses techniques, financières et réglementaires',
    'Remise de l’étude avec une recommandation claire',
  ],
};

const SETUP: SectorServiceDetail = {
  intro: 'Un accompagnement pas à pas pour vous installer : choix de la structure, démarches, recrutement et premiers partenaires.',
  includes: [
    'Choix de la forme juridique et du lieu',
    'Démarches administratives et autorisations',
    'Recherche de locaux et de partenaires locaux',
    'Aide au recrutement des premières équipes',
  ],
  steps: [
    'Définition du projet d’implantation',
    'Réalisation des démarches et des recherches',
    'Démarrage de l’activité et suivi',
  ],
};

const FOLLOW_UP: SectorServiceDetail = {
  intro: 'Un suivi dans la durée pour faire grandir votre activité : nouveaux marchés, nouveaux partenaires et amélioration continue.',
  includes: [
    'Points réguliers sur l’avancement',
    'Recherche de nouveaux débouchés',
    'Mise en relation avec de nouveaux partenaires',
    'Tableau de bord des résultats',
  ],
  steps: [
    'Bilan de la situation et des objectifs',
    'Plan de développement sur plusieurs mois',
    'Suivi régulier et ajustements',
  ],
};

const REGULATORY: SectorServiceDetail = {
  intro: 'Un appui pour respecter les normes, obtenir les autorisations et réussir vos démarches douanières et sanitaires.',
  includes: [
    'Identification des normes et autorisations requises',
    'Préparation des dossiers d’enregistrement',
    'Relations avec les administrations',
    'Suivi jusqu’à l’obtention des autorisations',
  ],
  steps: [
    'Analyse de votre produit ou de votre activité',
    'Constitution et dépôt des dossiers',
    'Suivi des démarches jusqu’à leur aboutissement',
  ],
};

const EXPORT: SectorServiceDetail = {
  intro: 'Un accompagnement pour vendre vos produits à l’étranger, notamment en Chine : marchés cibles, démarches et acheteurs.',
  includes: [
    'Choix des marchés et des canaux de vente',
    'Démarches d’exportation et étiquetage',
    'Recherche d’importateurs et de distributeurs',
    'Participation aux salons professionnels',
  ],
  steps: [
    'Évaluation de votre offre pour l’export',
    'Préparation des démarches et des supports',
    'Prospection et premières ventes',
  ],
};

const TECH_TRANSFER: SectorServiceDetail = {
  intro: 'Un accompagnement pour acquérir ou partager une technologie, en protégeant la propriété intellectuelle de chaque partie.',
  includes: [
    'Identification des technologies et des partenaires',
    'Protection de la propriété intellectuelle',
    'Négociation des accords de licence ou de transfert',
    'Organisation de la formation des équipes',
  ],
  steps: [
    'Définition du besoin technologique',
    'Recherche du partenaire et négociation',
    'Signature de l’accord et suivi du transfert',
  ],
};

const BENCHMARK: SectorServiceDetail = {
  intro: 'Des analyses comparatives des solutions technologiques disponibles pour choisir la plus adaptée à votre projet.',
  includes: [
    'Comparaison des solutions et des fournisseurs',
    'Analyse des coûts et des performances',
    'Retours d’expérience d’utilisateurs',
    'Recommandation argumentée',
  ],
  steps: [
    'Définition de vos critères de choix',
    'Analyse et comparaison des solutions',
    'Présentation de la recommandation',
  ],
};

const FUNDRAISING: SectorServiceDetail = {
  intro: 'Un appui pour lever des fonds et trouver des co-investisseurs en Chine et en Afrique du Nord.',
  includes: [
    'Préparation du dossier investisseur',
    'Identification d’investisseurs ciblés',
    'Organisation des rencontres',
    'Accompagnement dans la négociation',
  ],
  steps: [
    'Évaluation du projet et du montant à lever',
    'Préparation des documents et prospection',
    'Rencontres, négociation et conclusion',
  ],
};

/** Clé : titre du service tel qu'il apparaît dans les données des secteurs. */
export const SECTOR_SERVICE_DETAILS: Record<string, SectorServiceDetail> = {
  'Identification de partenaires': PARTNERS,
  'Identification de partenaires tech': PARTNERS,
  'Études de marché': STUDIES,
  'Mise en relation qualifiée': MATCHMAKING,
  'Mise en relation qualifiée B2B': MATCHMAKING,
  'Appui au financement': FINANCING,
  'Veille stratégique': WATCH,
  'Veille et opportunités': WATCH,
  'Études de faisabilité': FEASIBILITY,
  'Appui à l’implantation': SETUP,
  'Suivi et développement': FOLLOW_UP,
  'Accompagnement réglementaire': REGULATORY,
  'Appui à l’export': EXPORT,
  'Transfert technologique & IP': TECH_TRANSFER,
  'Analyses technologiques & benchmarks': BENCHMARK,
  'Levée de fonds & co-investissement': FUNDRAISING,
};
