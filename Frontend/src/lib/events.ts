import { EventDetails, EventFormat, RegistrationStatus } from './models';

/** Types et libellés de l'administration des événements (Mon espace › Admin : Événements). */

export type EventStatus = 'draft' | 'published' | 'archived';

export const EVENT_STATUS_LABELS: Record<EventStatus, { label: string; tone: string }> = {
  draft: { label: 'Brouillon', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  published: { label: 'Publié', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archived: { label: 'Archivé', tone: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export const EVENT_FORMAT_LABELS: Record<EventFormat, string> = {
  onsite: 'Sur place',
  online: 'En ligne',
  hybrid: 'Hybride',
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, { label: string; tone: string }> = {
  confirmed: { label: 'Confirmé', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  waitlisted: { label: "Liste d'attente", tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Annulé', tone: 'bg-slate-100 text-slate-500 border-slate-200' },
};

/** Rubriques de la page Événements. */
export const EVENT_CATEGORY_OPTIONS = [
  { id: 'salons', label: 'Salons & Foires' },
  { id: 'conferences', label: 'Conférences' },
  { id: 'webinaires', label: 'Webinaires' },
  { id: 'missions', label: "Missions d'affaires" },
  { id: 'networking', label: 'Forums & Networking' },
];

/** Libellés de type proposés (texte libre accepté). */
export const EVENT_TYPE_SUGGESTIONS = ['Salon', 'Foire', 'Conférence', 'Forum', 'Webinaire', 'Atelier', 'Mission', 'Networking'];

export const EVENT_PLACEMENT_OPTIONS = [
  { id: 'events-page', label: 'Page Événements' },
  { id: 'community', label: 'Communauté' },
  { id: 'home', label: 'Accueil' },
];

/** Visuels QIAO proposés pour les fiches (stockés « asset:fichier »). */
export const EVENT_IMAGE_LIBRARY = [
  'asset:evenements_hero_panorama_1791400498744.jpg',
  'asset:evenements_hero_plaza_1791399698341.jpg',
  'asset:event_canton_fair_exterior_1791399745116.jpg',
  'asset:cat_salons_canton_1791399715213.jpg',
  'asset:cat_organisateurs_stage_1791399731228.jpg',
  'asset:mission_partners_clear_1791224240641.jpg',
  'asset:about_mission_partners_uncut_1791236115168.jpg',
  'asset:china_africa_handshake_1787501713904.jpg',
  'asset:entreprises_hero_handshake_1790936563064.jpg',
  'asset:tech_hero_digital_ai_1791120272815.jpg',
  'asset:secteurs_hero_skyline_1791220840877.jpg',
  'asset:china_corridor_night_skyline_1790804583067.jpg',
  'asset:secteurs_banner_partners_1791220299654.jpg',
  'asset:logistique_hero_port_airplane_1791117964971.jpg',
];

export interface EventStats {
  confirmed: number;
  waitlisted: number;
  /** null = places illimitées. */
  remaining: number | null;
  fillRate: number | null;
  cancelled?: number;
  present?: number;
}

export interface AdminEvent {
  id: string;
  title: string;
  category: string;
  categoryKey: string;
  startDate: string;
  endDate: string | null;
  dateRange: string;
  monthYear: string;
  time: string;
  format: EventFormat;
  location: string;
  country: string;
  onlineUrl: string | null;
  priceLabel: string | null;
  image: string;
  description: string;
  details: EventDetails | null;
  placements: string[];
  capacity: number;
  registrationOpen: boolean;
  registrationClosed: boolean;
  isPast: boolean;
  status: EventStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  stats: EventStats;
}

export interface EventsOverview {
  events: Record<EventStatus | 'total', number>;
  registrations: Record<RegistrationStatus | 'present', number>;
  upcoming: AdminEvent[];
}

export interface AdminRegistration {
  id: string;
  fullName: string;
  email: string;
  companyRole: string;
  badgeCode: string;
  status: RegistrationStatus;
  source: 'public' | 'admin';
  adminNote: string | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  checkedInAt: string | null;
  waitlistPosition: number | null;
  member: { id: string; fullName: string; avatarUrl: string | null; company: string | null } | null;
}

export interface EventRegistrations {
  event: { id: string; title: string; capacity: number; status: EventStatus; startDate: string; registrationOpen: boolean };
  summary: { confirmed: number; waitlisted: number; cancelled: number; present: number; capacity: number; remaining: number | null };
  items: AdminRegistration[];
}

/** « 15 - 19 OCT 2026 » */
export const eventDateLabel = (event: { dateRange: string; monthYear: string }) => `${event.dateRange} ${event.monthYear}`;

/** Jauge : « 12 / 80 places » ou « 12 inscrits (illimité) ». */
export const seatsLabel = (capacity: number, confirmed: number) =>
  capacity > 0 ? `${confirmed} / ${capacity} places` : `${confirmed} inscrit${confirmed > 1 ? 's' : ''} · places illimitées`;
