import { Field, newId } from './SchemaForm';

const COUNTRY_CODES = [
  { value: 'TN', label: 'Tunisie' },
  { value: 'MA', label: 'Maroc' },
  { value: 'DZ', label: 'Algérie' },
  { value: 'EG', label: 'Égypte' },
  { value: 'LY', label: 'Libye' },
  { value: 'CN', label: 'Chine' },
];
const title = (item: Record<string, unknown>) => String(item.title ?? item.label ?? item.value ?? item.name ?? '');

const opportunityFields: Field[] = [
  { key: 'title', label: 'Titre', type: 'text', required: true },
  { key: 'country', label: 'Pays (affiché)', type: 'text' },
  { key: 'countryCode', label: 'Drapeau', type: 'select', options: COUNTRY_CODES },
  { key: 'type', label: 'Type (ex. Investissement, Partenariat)', type: 'text' },
];
const newOpportunity = () => ({ id: newId('op'), title: '', country: 'Tunisie', countryCode: 'TN', type: 'Partenariat' });

/** Fiche détaillée d'un sous-secteur (page ouverte depuis « Sous-secteurs clés »). */
const subSectorDetailFields: Field[] = [
  { key: 'intro', label: 'Présentation', type: 'textarea' },
  {
    key: 'figures',
    label: 'Chiffres clés',
    type: 'list',
    itemTitle: (item) => `${item.value ?? ''} ${item.label ?? ''}`,
    newItem: () => ({ value: '', label: '' }),
    fields: [
      { key: 'value', label: 'Valeur (ex. 10,2 M EVP)', type: 'text' },
      { key: 'label', label: 'Libellé', type: 'text' },
    ],
  },
  { key: 'trends', label: 'Enjeux et tendances', type: 'lines' },
  {
    key: 'markets',
    label: 'Où agir (pays)',
    type: 'list',
    itemTitle: (item) => String(item.country ?? ''),
    newItem: () => ({ code: 'TN', country: 'Tunisie', text: '' }),
    fields: [
      { key: 'code', label: 'Drapeau', type: 'select', options: COUNTRY_CODES },
      { key: 'country', label: 'Pays', type: 'text' },
      { key: 'text', label: 'Texte', type: 'textarea' },
    ],
  },
  {
    key: 'opportunities',
    label: 'Opportunités (chacune a sa page)',
    type: 'list',
    itemTitle: title,
    newItem: () => ({ ...newOpportunity(), countryCode: 'TN' }),
    fields: opportunityFields,
  },
  { key: 'services', label: 'Comment QIAO vous accompagne', type: 'lines' },
];

/** Formulaire complet d'un secteur. Les sous-secteurs embarquent leur fiche détaillée (« detail »). */
export const SECTOR_FIELDS: Field[] = [
  {
    key: 'card',
    label: 'Carte (page Secteurs et menu)',
    type: 'group',
    fields: [
      { key: 'title', label: 'Titre de la carte', type: 'text' },
      { key: 'description', label: 'Description courte', type: 'textarea' },
      { key: 'image', label: 'Image de la carte', type: 'image' },
    ],
  },
  { key: 'hidden', label: 'Masquer ce secteur sur le site', type: 'boolean' },
  { key: 'order', label: 'Ordre d’affichage (0 = en premier)', type: 'number' },
  {
    key: 'hero',
    label: 'En-tête de la page',
    type: 'group',
    fields: [
      { key: 'tag', label: 'Étiquette', type: 'text' },
      { key: 'title', label: 'Titre', type: 'text', required: true },
      { key: 'subTitle', label: 'Sous-titre', type: 'text' },
      { key: 'heroDescription', label: 'Description', type: 'textarea' },
      { key: 'heroSlogan', label: 'Slogan', type: 'text' },
      { key: 'heroBg', label: 'Image de fond', type: 'image' },
    ],
  },
  {
    key: 'heroPills',
    label: 'Pastilles de l’en-tête',
    type: 'list',
    itemTitle: title,
    newItem: () => ({ label: '', iconName: 'CheckCircle2' }),
    fields: [{ key: 'label', label: 'Texte', type: 'text' }],
  },
  {
    key: 'overview',
    label: 'Présentation',
    type: 'group',
    fields: [
      { key: 'overviewTitle', label: 'Titre', type: 'text' },
      { key: 'overviewDescription', label: 'Texte', type: 'textarea' },
      { key: 'overviewButtonText', label: 'Bouton (mène à « À propos »)', type: 'text' },
      { key: 'quote', label: 'Citation', type: 'text' },
    ],
  },
  {
    key: 'fourPillars',
    label: 'Piliers',
    type: 'list',
    itemTitle: title,
    newItem: () => ({ title: '', description: '', iconName: 'Target' }),
    fields: [
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'stats',
    label: 'Chiffres clés',
    type: 'list',
    itemTitle: (item) => `${item.value ?? ''} ${item.label ?? ''}`,
    newItem: () => ({ value: '', label: '', iconName: 'TrendingUp' }),
    fields: [
      { key: 'value', label: 'Valeur', type: 'text' },
      { key: 'label', label: 'Libellé', type: 'text' },
    ],
  },
  { key: 'subSectorsTitle', label: 'Titre de la section des sous-secteurs', type: 'text' },
  {
    key: 'subSectors',
    label: 'Sous-secteurs clés (chacun a sa page)',
    type: 'list',
    itemTitle: title,
    newItem: () => ({ id: newId('sub'), title: '', description: '', image: '', iconName: 'Layers', detail: { intro: '', figures: [], trends: [], markets: [], opportunities: [], services: [] } }),
    fields: [
      { key: 'title', label: 'Titre', type: 'text', required: true },
      { key: 'description', label: 'Description courte', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'detail', label: 'Page du sous-secteur', type: 'group', fields: subSectorDetailFields },
    ],
  },
  { key: 'opportunities', label: 'Opportunités du secteur', type: 'list', itemTitle: title, newItem: newOpportunity, fields: opportunityFields },
  {
    key: 'services',
    label: 'Nos services pour ce secteur (chacun a sa fiche)',
    type: 'list',
    itemTitle: title,
    newItem: () => ({ id: newId('srv'), title: '', description: '', iconName: 'Handshake', detail: { intro: '', includes: [], steps: [] } }),
    fields: [
      { key: 'title', label: 'Titre', type: 'text', required: true },
      { key: 'description', label: 'Description courte', type: 'text' },
      {
        key: 'detail',
        label: 'Fiche du service',
        type: 'group',
        fields: [
          { key: 'intro', label: 'Présentation', type: 'textarea' },
          { key: 'includes', label: 'Ce que comprend ce service', type: 'lines' },
          { key: 'steps', label: 'Comment ça se passe (étapes)', type: 'lines' },
        ],
      },
    ],
  },
  {
    key: 'successStory',
    label: 'Histoire de succès',
    type: 'group',
    fields: [
      { key: 'corridor', label: 'Corridor (ex. TUNISIE ➔ CHINE)', type: 'text' },
      { key: 'title', label: 'Titre', type: 'text' },
      { key: 'description', label: 'Texte', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
  },
  {
    key: 'form',
    label: 'Formulaire de contact du secteur',
    type: 'group',
    fields: [
      { key: 'formTitle', label: 'Titre', type: 'text' },
      { key: 'formSubtitle', label: 'Texte', type: 'textarea' },
      { key: 'formBg', label: 'Image de fond', type: 'image' },
      { key: 'projectTypes', label: 'Types de projet proposés', type: 'lines' },
      { key: 'footerSignature', label: 'Signature du pied de page', type: 'text' },
    ],
  },
];

const lines = (key: string, label: string): Field => ({ key, label, type: 'lines' });
const text = (key: string, label: string, required = false): Field => ({ key, label, type: 'text', required });
const area = (key: string, label: string): Field => ({ key, label, type: 'textarea' });
const yes = (key: string, label: string): Field => ({ key, label, type: 'boolean' });
const number = (key: string, label: string): Field => ({ key, label, type: 'number' });
const image = (key: string, label: string): Field => ({ key, label, type: 'image' });
const choice = (key: string, label: string, values: string[]): Field => ({ key, label, type: 'select', options: values.map((value) => ({ value, label: value })) });

/** Coordonnées, réseaux sociaux et bureaux affichés sur tout le site (page Contact, pieds de page, mentions légales). */
export const SETTINGS_FIELDS: Field[] = [
  {
    key: 'contact',
    label: 'Coordonnées principales',
    type: 'group',
    fields: [
      { key: 'email', label: 'E-mail de contact', type: 'text', required: true },
      { key: 'phone', label: 'Téléphone', type: 'text' },
      { key: 'whatsapp', label: 'WhatsApp Business', type: 'text' },
      { key: 'hours', label: 'Horaires', type: 'text' },
    ],
  },
  {
    key: 'social',
    label: 'Réseaux sociaux (adresse complète de chaque page)',
    type: 'group',
    fields: [
      { key: 'instagram', label: 'Instagram', type: 'text' },
      { key: 'facebook', label: 'Facebook', type: 'text' },
      { key: 'linkedin', label: 'LinkedIn', type: 'text' },
      { key: 'x', label: 'X (Twitter)', type: 'text' },
      { key: 'youtube', label: 'YouTube', type: 'text' },
    ],
    help: 'Un réseau laissé vide n’est pas affiché sur le site.',
  },
  {
    key: 'media',
    label: 'Vidéo de présentation',
    type: 'group',
    fields: [{ key: 'videoUrl', label: 'Adresse de la vidéo (YouTube, Facebook, Vimeo ou fichier MP4)', type: 'text' }],
    help: 'Laissée vide, les boutons « Voir la vidéo » ne sont pas affichés.',
  },
  {
    key: 'offices',
    label: 'Bureaux (le premier est le siège)',
    type: 'list',
    itemTitle: (item) => String(item.name ?? ''),
    newItem: () => ({ name: '', city: '', countryCode: 'TN', address: [], phone: '', mapsUrl: '', image: '' }),
    fields: [
      { key: 'name', label: 'Nom (ex. Tunis (Siège social))', type: 'text', required: true },
      { key: 'city', label: 'Ville, pays', type: 'text' },
      { key: 'countryCode', label: 'Drapeau', type: 'select', options: COUNTRY_CODES },
      { key: 'address', label: 'Adresse', type: 'lines' },
      { key: 'phone', label: 'Téléphone du bureau', type: 'text' },
      { key: 'mapsUrl', label: 'Lien Google Maps', type: 'text' },
      { key: 'image', label: 'Photo', type: 'image' },
    ],
  },
];

/** Collections gérées par l'API /site-admin/collections. */
export const COLLECTIONS: { id: string; label: string; titleField: string; subtitle: (row: Record<string, unknown>) => string; fields: Field[] }[] = [
  {
    id: 'services',
    label: 'Services',
    titleField: 'title',
    subtitle: (row) => String(row.category ?? ''),
    fields: [
      text('title', 'Titre', true),
      text('category', 'Catégorie du catalogue (une nouvelle catégorie crée un nouveau filtre)', true),
      area('description', 'Description'),
      lines('details', 'Sous-services (affichés dans la fiche du service)'),
      image('image', 'Image'),
      choice('iconName', 'Icône', ['Briefcase', 'Building2', 'Ship', 'Scale', 'Languages', 'Users', 'Truck', 'Building', 'HeartPulse', 'Plane', 'GraduationCap']),
      yes('isNew', 'Afficher « Nouveau »'),
      choice('accentColor', 'Couleur', ['blue', 'red']),
      number('sortOrder', 'Ordre d’affichage'),
    ],
  },
  {
    id: 'opportunities',
    label: 'Opportunités',
    titleField: 'title',
    subtitle: (row) => `${row.country ?? ''} · ${row.sector ?? ''} · ${row.status === 'closed' ? 'fermée' : 'active'}`,
    fields: [
      text('title', 'Titre', true),
      text('type', 'Type (Importation, Exportation, Investissement, Partenariat...)', true),
      text('sector', 'Secteur', true),
      text('country', 'Pays', true),
      text('fromCountry', 'Pays d’origine'),
      text('toCountry', 'Pays de destination'),
      text('amountLabel', 'Montant affiché (ex. 1 – 5 M USD)'),
      number('amountMinUsd', 'Montant minimum (USD)'),
      number('amountMaxUsd', 'Montant maximum (USD)'),
      text('partnerType', 'Partenaire recherché'),
      area('description', 'Description'),
      image('image', 'Image'),
      text('deadline', 'Date limite (AAAA-MM-JJ)'),
      text('publishedAt', 'Date de publication (AAAA-MM-JJ)'),
      yes('verified', 'Vérifiée par QIAO'),
      yes('urgent', 'Urgente'),
      choice('status', 'Statut', ['active', 'closed']),
      lines('placements', 'Pages où l’afficher (intelligence, commerce-hub, entreprises)'),
    ],
  },
  {
    id: 'articles',
    label: 'Analyses et articles',
    titleField: 'title',
    subtitle: (row) => `${row.category ?? ''} · ${row.dateLabel ?? ''}`,
    fields: [
      text('title', 'Titre', true),
      area('summary', 'Résumé'),
      text('category', 'Catégorie', true),
      text('dateLabel', 'Date affichée (ex. 12 Sept. 2026)', true),
      text('publishedAt', 'Date de publication (AAAA-MM-JJ)'),
      text('readTime', 'Durée de lecture'),
      text('author', 'Auteur'),
      image('image', 'Image'),
      lines('keyPoints', 'Points clés'),
      lines('content', 'Paragraphes'),
      lines('placements', 'Pages où l’afficher (analyses, intelligence, ressources...)'),
      lines('countries', 'Pays concernés'),
      text('sector', 'Secteur'),
      text('analysisType', 'Type d’analyse'),
    ],
  },
  {
    id: 'documents',
    label: 'Documents et rapports',
    titleField: 'title',
    subtitle: (row) => `${row.kind ?? ''} · ${row.format ?? ''}`,
    fields: [
      text('title', 'Titre', true),
      text('kind', 'Type (Guide, Étude, Rapport...)', true),
      text('category', 'Catégorie', true),
      choice('format', 'Format', ['PDF', 'DOCX', 'XLSX', 'Vidéo']),
      text('sizeLabel', 'Taille affichée'),
      text('dateLabel', 'Date affichée', true),
      text('publishedAt', 'Date de publication (AAAA-MM-JJ)'),
      area('description', 'Description'),
      text('publisher', 'Éditeur'),
      image('image', 'Image'),
      lines('sections', 'Sections du document (contenu du fichier téléchargé)'),
      lines('countries', 'Pays concernés'),
      lines('needs', 'Besoins (filtre de la page Ressources)'),
      text('sector', 'Secteur'),
      text('reportType', 'Type de rapport'),
      yes('premium', 'Réservé aux membres'),
      number('pages', 'Nombre de pages'),
    ],
  },
  {
    id: 'companies',
    label: 'Entreprises',
    titleField: 'name',
    subtitle: (row) => `${row.country ?? ''} · ${row.sector ?? ''}`,
    fields: [
      text('name', 'Nom', true),
      text('nativeName', 'Nom d’origine (ex. en chinois)'),
      choice('origin', 'Origine', ['Chinoise', 'Nord-Africaine']),
      text('businessType', 'Activité (Fabricant, Distributeur...)'),
      text('country', 'Pays', true),
      choice('countryCode', 'Drapeau', ['CN', 'MA', 'DZ', 'TN', 'EG', 'LY']),
      text('city', 'Ville'),
      text('sector', 'Secteur', true),
      text('sectorGroup', 'Groupe de secteur'),
      lines('badges', 'Badges'),
      area('description', 'Description'),
      text('turnover', 'Chiffre d’affaires affiché'),
      number('turnoverMusd', 'Chiffre d’affaires (M USD)'),
      text('employees', 'Effectif'),
      text('founded', 'Année de création'),
      lines('certifications', 'Certifications'),
      lines('mainProducts', 'Produits principaux'),
      text('contactEmail', 'E-mail de contact'),
      text('logoColor', 'Couleur du logo (ex. #ff6a00)'),
      yes('verified', 'Vérifiée par QIAO'),
      yes('isStartup', 'Startup'),
      yes('featured', 'En vedette'),
      number('rating', 'Note (sur 5)'),
    ],
  },
];
