import type { SectorOpportunity } from './sectorsData';
import { SUB_SECTOR_DETAILS_1 } from './subSectorDetails1';
import { SUB_SECTOR_DETAILS_2 } from './subSectorDetails2';
import { SUB_SECTOR_DETAILS_3 } from './subSectorDetails3';

/** Page d'information d'un sous-secteur : présentation, chiffres, enjeux, pays, opportunités, accompagnement. */
export interface SubSectorDetail {
  intro: string;
  figures: { value: string; label: string }[];
  trends: string[];
  markets: { code: SectorOpportunity['countryCode']; country: string; text: string }[];
  opportunities: SectorOpportunity[];
  services: string[];
}

export const SUB_SECTOR_DETAILS: Record<string, SubSectorDetail> = {
  ...SUB_SECTOR_DETAILS_1,
  ...SUB_SECTOR_DETAILS_2,
  ...SUB_SECTOR_DETAILS_3,
};

/** Identifiant global d'une opportunité de sous-secteur (page d'opportunité). */
export const subSectorOpportunityId = (sectorId: string, subSectorId: string, opportunityId: string) =>
  `${sectorId}-${subSectorId}-${opportunityId}`;
