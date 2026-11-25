import { HUB_OPPORTUNITIES } from '../data/hubOpportunities';
import { SECTORS_DETAILS, SectorData } from '../data/sectorsData';
import { SUB_SECTOR_DETAILS, subSectorOpportunityId } from '../data/subSectorDetails';
import { Opportunity } from './models';
import { setQueryParams } from './routes';
import { normalize } from './text';

/** Pays des opportunités, avec le titre de leur page. */
export const OPPORTUNITY_COUNTRIES = [
  { name: 'Tunisie', code: 'TN', heading: 'Opportunités en Tunisie' },
  { name: 'Maroc', code: 'MA', heading: 'Opportunités au Maroc' },
  { name: 'Algérie', code: 'DZ', heading: 'Opportunités en Algérie' },
  { name: 'Égypte', code: 'EG', heading: 'Opportunités en Égypte' },
  { name: 'Libye', code: 'LY', heading: 'Opportunités en Libye' },
  { name: 'Chine', code: 'CN', heading: 'Opportunités en Chine' },
];

export const countryCodeOf = (name: string | null | undefined) =>
  OPPORTUNITY_COUNTRIES.find((country) => normalize(country.name) === normalize(name))?.code ?? null;

/** Opportunité affichée sur le site, quelle que soit sa source (base, pages secteurs, Commerce Hub). */
export interface OpportunityEntry {
  id: string;
  title: string;
  type: string;
  country: string;
  countryCode: string | null;
  sectorLabel: string;
  sector: SectorData | null;
  description: string | null;
  amount: string | null;
  partner: string | null;
  image: string | null;
  from: string | null;
  to: string | null;
  deadline: string | null;
  published: string | null;
  verified: boolean;
  urgent: boolean;
  /** Présente pour une opportunité de la base : la candidature se dépose en ligne. */
  record: Opportunity | null;
}

export function fromRecord(record: Opportunity): OpportunityEntry {
  const country = record.country || record.toCountry;
  return {
    id: record.id,
    title: record.title,
    type: record.type,
    country,
    countryCode: countryCodeOf(country),
    sectorLabel: record.sector,
    sector: null,
    description: record.description,
    amount: record.amountLabel,
    partner: record.partnerType,
    image: record.image,
    from: record.fromCountry,
    to: record.toCountry,
    deadline: record.deadline,
    published: record.publishedAt,
    verified: record.verified,
    urgent: record.urgent,
    record,
  };
}

/** Opportunités présentées sur les pages secteurs et dans le Commerce Hub (secteurs masqués exclus). */
function buildStaticOpportunities(): OpportunityEntry[] {
  const visibleSectors = Object.values(SECTORS_DETAILS).filter((sector) => !sector.hidden);
  return [
    ...visibleSectors.flatMap((sector) =>
      sector.opportunities.map(
        (item): OpportunityEntry => ({
          id: `${sector.id}-${item.id}`,
          title: item.title,
          type: item.type,
          country: item.country,
          countryCode: item.countryCode,
          sectorLabel: sector.title,
          sector,
          description: null,
          amount: null,
          partner: null,
          image: null,
          from: null,
          to: null,
          deadline: null,
          published: null,
          verified: false,
          urgent: false,
          record: null,
        }),
      ),
    ),
    // Opportunités propres à chaque sous-secteur (pages sous-secteurs).
    ...visibleSectors.flatMap((sector) =>
      sector.subSectors.flatMap((subSector) =>
        (SUB_SECTOR_DETAILS[subSector.id]?.opportunities ?? []).map(
          (item): OpportunityEntry => ({
            id: subSectorOpportunityId(sector.id, subSector.id, item.id),
            title: item.title,
            type: item.type,
            country: item.country,
            countryCode: item.countryCode,
            sectorLabel: subSector.title,
            sector,
            description: SUB_SECTOR_DETAILS[subSector.id].intro,
            amount: null,
            partner: null,
            image: null,
            from: null,
            to: null,
            deadline: null,
            published: null,
            verified: false,
            urgent: false,
            record: null,
          }),
        ),
      ),
    ),
    ...HUB_OPPORTUNITIES.map(
      (item): OpportunityEntry => ({
        id: item.id,
        title: item.title,
        type: item.badge,
        country: item.toCountry,
        countryCode: countryCodeOf(item.toCountry),
        sectorLabel: item.sector,
        sector: null,
        description: item.description,
        amount: item.amount,
        partner: item.partnerType,
        image: item.image,
        from: item.fromCountry,
        to: item.toCountry,
        deadline: null,
        published: null,
        verified: false,
        urgent: false,
        record: null,
      }),
    ),
  ];
}

export const STATIC_OPPORTUNITIES: OpportunityEntry[] = buildStaticOpportunities();

/** Recalcule la liste après le chargement des contenus modifiés par l'administration. */
export function rebuildStaticOpportunities() {
  STATIC_OPPORTUNITIES.splice(0, STATIC_OPPORTUNITIES.length, ...buildStaticOpportunities());
}

/** Ouvre la page des opportunités : une opportunité, un pays, un secteur, ou toutes. */
export function opportunityRoute(target: { id?: string; country?: string; sector?: string } = {}) {
  setQueryParams({ tab: 'opportunites-pays', op: target.id ?? null, pays: target.country ?? null, secteur: target.sector ?? null, cv: null, dv: null, sub: null });
}
