import { contentOverride } from './siteContent';

/** Coordonnées et liens du site, modifiables dans « Admin : Contenus du site » > Paramètres du site. */
export interface SiteOffice {
  /** Nom affiché (ex. « Tunis (Siège social) »). */
  name: string;
  /** Ville et pays (ex. « Tunis, Tunisie »). */
  city: string;
  /** Drapeau : TN, MA, DZ, EG, LY ou CN. */
  countryCode: string;
  /** Adresse, une ligne par ligne affichée. */
  address: string[];
  phone: string;
  mapsUrl: string;
  image: string;
}

export interface SiteSettings {
  email: string;
  phone: string;
  whatsapp: string;
  hours: string;
  social: { linkedin: string; facebook: string; x: string; youtube: string };
  offices: SiteOffice[];
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  email: 'contact@qiao.tn',
  phone: '+216 71 123 456',
  whatsapp: '+216 71 123 456',
  hours: 'Lundi - Vendredi, 9h00 - 18h00 (GMT+1)',
  social: {
    linkedin: 'https://linkedin.com',
    facebook: 'https://facebook.com',
    x: 'https://x.com',
    youtube: 'https://youtube.com',
  },
  offices: [
    {
      name: 'Tunis (Siège social)',
      city: 'Tunis, Tunisie',
      countryCode: 'TN',
      address: ['Immeuble International City Center', 'Avenue de la Bourse, Les Berges du Lac', '1053 Tunis, Tunisie'],
      phone: '+216 71 123 456',
      mapsUrl: 'https://maps.google.com/?q=Les+Berges+du+Lac+Tunis',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Shanghai (Bureau Asie)',
      city: 'Shanghai, Chine',
      countryCode: 'CN',
      address: ['Shanghai Tower, 100 Century Avenue', 'Pudong, Shanghai 200120, Chine'],
      phone: '+86 21 8039 4500',
      mapsUrl: 'https://maps.google.com/?q=Shanghai+Tower+Pudong',
      image: 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Casablanca (Bureau Afrique du Nord)',
      city: 'Casablanca, Maroc',
      countryCode: 'MA',
      address: ['Tour CFC, 100 Boulevard Sidi Mohamed Ben Abdellah', 'Casablanca, Maroc'],
      phone: '+212 522 98 70 00',
      mapsUrl: 'https://maps.google.com/?q=Casablanca+Finance+City+Tour+CFC',
      image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=600&q=80',
    },
  ],
};

/** Paramètres en vigueur : ceux enregistrés par l'administration, complétés par les valeurs d'origine. */
export function siteSettings(): SiteSettings {
  const saved = contentOverride('site:settings') as Partial<SiteSettings> | undefined;
  if (!saved) return DEFAULT_SITE_SETTINGS;
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...saved,
    social: { ...DEFAULT_SITE_SETTINGS.social, ...(saved.social ?? {}) },
    offices: saved.offices?.length ? saved.offices : DEFAULT_SITE_SETTINGS.offices,
  };
}

/** Numéro utilisable dans un lien tel: ou wa.me (chiffres seulement). */
export const digits = (phone: string) => phone.replace(/[^\d]/g, '');
export const telHref = (phone: string) => `tel:+${digits(phone)}`;
export const whatsappHref = (phone: string) => `https://wa.me/${digits(phone)}`;
