import { useSyncExternalStore } from 'react';
import { SECTORS_DETAILS, SECTORS_LIST, SectorData } from '../data/sectorsData';
import { SUB_SECTOR_DETAILS, SubSectorDetail } from '../data/subSectorDetails';
import { api } from './api';
import { resolveImage } from './assets';
import { rebuildStaticOpportunities } from './opportunities';

/**
 * Contenus du site modifiés depuis l'administration (Admin : Contenus du site).
 * Le site part de ses contenus d'origine (data/) et applique par-dessus les documents enregistrés :
 * « sector:<id> » = fiche complète d'un secteur, avec ses sous-secteurs et leurs fiches détaillées.
 */
export interface SectorContent extends SectorData {
  hidden?: boolean;
  /** Carte de la page Secteurs et du menu. */
  card?: { title: string; description: string; image: string; iconName: string };
  /** Fiches détaillées des sous-secteurs, par identifiant de sous-secteur. */
  subSectorDetails?: Record<string, SubSectorDetail>;
  /** Ordre d'affichage sur la page Secteurs. */
  order?: number;
}

/** Contenu d'origine de chaque secteur, avant toute modification (pour « Rétablir l'original »). */
const ORIGINAL_SECTORS: Record<string, SectorData> = structuredClone(SECTORS_DETAILS);
const ORIGINAL_LIST = structuredClone(SECTORS_LIST);
const ORIGINAL_SUB_DETAILS: Record<string, SubSectorDetail> = structuredClone(SUB_SECTOR_DETAILS);

let version = 0;
let overrides: Record<string, unknown> = {};
const listeners = new Set<() => void>();
const notify = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

/** Re-rendu des pages quand les contenus changent. */
export function useSiteContentVersion() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => version,
  );
}

const resolveImages = (sector: SectorData): SectorData => ({
  ...sector,
  heroBg: resolveImage(sector.heroBg, sector.heroBg),
  formBg: resolveImage(sector.formBg, sector.formBg),
  successStory: sector.successStory ? { ...sector.successStory, image: resolveImage(sector.successStory.image, sector.successStory.image) } : sector.successStory,
  // Sous-secteur sans image : celle de l'en-tête du secteur.
  subSectors: (sector.subSectors ?? []).map((sub) => ({ ...sub, image: resolveImage(sub.image, sub.image) || resolveImage(sector.heroBg, sector.heroBg) })),
});

/** Fiche d'origine d'un secteur, augmentée de sa carte et des fiches de ses sous-secteurs (point de départ de l'éditeur). */
export function originalSector(id: string): SectorContent | null {
  const base = ORIGINAL_SECTORS[id];
  if (!base) return null;
  const card = ORIGINAL_LIST.find((item) => item.id === id);
  return {
    ...structuredClone(base),
    card: card ? { title: card.title, description: card.description, image: card.image, iconName: card.iconName } : undefined,
    subSectorDetails: Object.fromEntries(base.subSectors.filter((sub) => ORIGINAL_SUB_DETAILS[sub.id]).map((sub) => [sub.id, structuredClone(ORIGINAL_SUB_DETAILS[sub.id])])),
    order: ORIGINAL_LIST.findIndex((item) => item.id === id),
  };
}

/** Fiche actuelle d'un secteur (modifiée ou d'origine). */
export function currentSector(id: string): SectorContent | null {
  const saved = overrides[`sector:${id}`] as SectorContent | undefined;
  return saved ? structuredClone(saved) : originalSector(id);
}

export const isSectorModified = (id: string) => Boolean(overrides[`sector:${id}`]);
export const isOriginalSector = (id: string) => Boolean(ORIGINAL_SECTORS[id]);

/** Tous les secteurs connus (d'origine et créés par l'administration), dans l'ordre d'affichage. */
export function allSectorIds() {
  const created = Object.keys(overrides)
    .filter((key) => key.startsWith('sector:'))
    .map((key) => key.slice('sector:'.length))
    .filter((id) => !ORIGINAL_SECTORS[id]);
  const order = (id: string) => (currentSector(id)?.order ?? 999);
  return [...Object.keys(ORIGINAL_SECTORS), ...created].sort((a, b) => order(a) - order(b));
}

/** Applique les contenus enregistrés aux données du site (remplacement sur place : toutes les pages les voient). */
export function applySiteContent(next: Record<string, unknown>) {
  overrides = next;

  // Secteurs : on repart toujours des contenus d'origine.
  for (const key of Object.keys(SECTORS_DETAILS)) delete SECTORS_DETAILS[key];
  Object.assign(SECTORS_DETAILS, structuredClone(ORIGINAL_SECTORS));
  for (const key of Object.keys(SUB_SECTOR_DETAILS)) delete SUB_SECTOR_DETAILS[key];
  Object.assign(SUB_SECTOR_DETAILS, structuredClone(ORIGINAL_SUB_DETAILS));
  const list = structuredClone(ORIGINAL_LIST);

  for (const id of allSectorIds()) {
    const content = overrides[`sector:${id}`] as SectorContent | undefined;
    if (!content) continue;
    const { card, subSectorDetails, ...sector } = content;
    SECTORS_DETAILS[id] = resolveImages({ ...(ORIGINAL_SECTORS[id] ?? {}), ...sector, id } as SectorData);
    Object.assign(SUB_SECTOR_DETAILS, subSectorDetails ?? {});
    const entry = {
      id,
      title: card?.title || sector.title,
      description: card?.description || sector.heroDescription,
      iconName: card?.iconName || 'Briefcase',
      image: resolveImage(card?.image || sector.heroBg, card?.image || sector.heroBg),
    };
    const index = list.findIndex((item) => item.id === id);
    if (index >= 0) list[index] = entry;
    else list.push(entry);
  }

  const visible = allSectorIds()
    .filter((id) => !SECTORS_DETAILS[id]?.hidden)
    .map((id) => list.find((item) => item.id === id))
    .filter((item): item is (typeof list)[number] => Boolean(item));
  SECTORS_LIST.splice(0, SECTORS_LIST.length, ...visible);

  rebuildStaticOpportunities();
  notify();
}

/** Chargement au démarrage du site (sans effet si le serveur ne répond pas : les contenus d'origine restent). */
export async function loadSiteContent() {
  try {
    applySiteContent(await api.get<Record<string, unknown>>('/site-content'));
  } catch {
    // contenus d'origine
  }
}

/** Enregistre un secteur depuis l'administration et l'applique aussitôt. */
export async function saveSector(id: string, content: SectorContent) {
  await api.put(`/site-admin/contents/sector:${id}`, { data: { ...content, id } });
  await loadSiteContent();
}

/** Supprime les modifications d'un secteur (ou un secteur créé par l'administration). */
export async function resetSector(id: string) {
  await api.delete(`/site-admin/contents/sector:${id}`);
  await loadSiteContent();
}
