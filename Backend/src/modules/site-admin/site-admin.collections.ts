import { EntityTarget, ObjectLiteral } from 'typeorm';
import { Article } from '../articles/article.entity';
import { ServiceOffering } from '../catalog/service-offering.entity';
import { Company, CompanyContactRequest } from '../companies/company.entities';
import { ContactMessage } from '../contact/contact-message.entity';
import { Appointment } from '../appointments/appointment.entity';
import { QiaoDocument, ResourceRequest } from '../documents/document.entities';
import { NewsletterSubscription } from '../newsletter/newsletter-subscription.entity';
import { Opportunity, OpportunityApplication } from '../opportunities/opportunity.entities';

export type FieldType = 'string' | 'text' | 'strings' | 'number' | 'boolean';

export interface FieldDef {
  type: FieldType;
  required?: boolean;
  nullable?: boolean;
  options?: string[];
  max?: number;
}

export interface CollectionDef {
  entity: EntityTarget<ObjectLiteral>;
  /** Champ affiché comme titre et utilisé pour fabriquer l'identifiant. */
  titleField: string;
  fields: Record<string, FieldDef>;
  /** Valeurs d'une nouvelle fiche pour les colonnes obligatoires non saisies. */
  defaults: Record<string, unknown>;
  order: Record<string, 'ASC' | 'DESC'>;
}

const s = (required = false, max = 300): FieldDef => ({ type: 'string', required, max });
const opt = (max = 300): FieldDef => ({ type: 'string', nullable: true, max });
const text = (required = false): FieldDef => ({ type: 'text', required, max: 20000 });
const list = (nullable = false): FieldDef => ({ type: 'strings', nullable });
const num = (nullable = false): FieldDef => ({ type: 'number', nullable });
const bool: FieldDef = { type: 'boolean' };
const today = () => new Date().toISOString().slice(0, 10);

/** Contenus publics du site modifiables par l'administration, champ par champ. */
export const COLLECTIONS: Record<string, CollectionDef> = {
  services: {
    entity: ServiceOffering,
    titleField: 'title',
    order: { sortOrder: 'ASC', title: 'ASC' },
    defaults: { iconName: 'Briefcase', image: '', isNew: false, accentColor: 'blue', details: [], sortOrder: 100 },
    fields: {
      title: s(true, 120),
      category: s(true, 80),
      description: text(true),
      details: list(),
      image: s(false, 500),
      iconName: s(false, 40),
      isNew: bool,
      accentColor: { type: 'string', options: ['blue', 'red'] },
      sortOrder: num(),
    },
  },
  opportunities: {
    entity: Opportunity,
    titleField: 'title',
    order: { publishedAt: 'DESC' },
    defaults: {
      fromCountry: '',
      toCountry: '',
      amountLabel: '',
      amountIcon: 'dollar',
      partnerType: '',
      image: '',
      verified: false,
      urgent: false,
      status: 'active',
      placements: ['intelligence', 'commerce-hub'],
      publishedAt: today(),
    },
    fields: {
      title: s(true, 200),
      type: s(true, 60),
      sector: s(true, 120),
      country: s(true, 80),
      fromCountry: s(false, 80),
      toCountry: s(false, 80),
      amountLabel: s(false, 80),
      amountMinUsd: num(true),
      amountMaxUsd: num(true),
      partnerType: s(false, 120),
      description: text(true),
      image: s(false, 500),
      deadline: opt(40),
      publishedAt: s(false, 20),
      verified: bool,
      urgent: bool,
      status: { type: 'string', options: ['active', 'closed'] },
      placements: list(),
    },
  },
  articles: {
    entity: Article,
    titleField: 'title',
    order: { publishedAt: 'DESC' },
    defaults: { readTime: '5 min de lecture', image: '', author: 'QIAO Intelligence', keyPoints: [], content: [], placements: ['analyses'], publishedAt: today() },
    fields: {
      title: s(true, 200),
      summary: text(true),
      category: s(true, 80),
      publishedAt: s(false, 20),
      dateLabel: s(true, 40),
      readTime: s(false, 40),
      author: s(false, 120),
      image: s(false, 500),
      keyPoints: list(),
      content: list(),
      placements: list(),
      countries: list(true),
      sector: opt(120),
      analysisType: opt(80),
    },
  },
  documents: {
    entity: QiaoDocument,
    titleField: 'title',
    order: { publishedAt: 'DESC' },
    defaults: { format: 'PDF', sizeLabel: '1 MB', publisher: 'QIAO', baseDownloads: 0, premium: false, pages: 10, publishedAt: today() },
    fields: {
      title: s(true, 200),
      kind: s(true, 60),
      category: s(true, 80),
      format: { type: 'string', options: ['PDF', 'DOCX', 'XLSX', 'Vidéo'] },
      sizeLabel: s(false, 40),
      publishedAt: s(false, 20),
      dateLabel: s(true, 40),
      description: text(true),
      publisher: s(false, 120),
      image: opt(500),
      countries: list(true),
      needs: list(true),
      sector: opt(120),
      reportType: opt(80),
      sections: list(true),
      premium: bool,
      pages: num(),
    },
  },
  companies: {
    entity: Company,
    titleField: 'name',
    order: { featured: 'DESC', name: 'ASC' },
    defaults: {
      origin: 'Nord-Africaine',
      businessType: 'Distributeur',
      countryCode: 'TN',
      city: '',
      sectorGroup: '',
      badges: [],
      verified: false,
      rating: 4.5,
      logoColor: '#0a1c3d',
      isStartup: false,
      featured: false,
      addedAt: today(),
      addedLabel: '',
    },
    fields: {
      name: s(true, 120),
      nativeName: opt(120),
      origin: { type: 'string', options: ['Chinoise', 'Nord-Africaine'] },
      businessType: s(false, 60),
      country: s(true, 80),
      countryCode: { type: 'string', options: ['CN', 'MA', 'DZ', 'TN', 'EG', 'LY'] },
      city: s(false, 120),
      sector: s(true, 120),
      sectorGroup: s(false, 120),
      badges: list(),
      description: text(true),
      turnover: opt(60),
      turnoverMusd: num(true),
      employees: opt(60),
      founded: opt(20),
      certifications: list(true),
      mainProducts: list(true),
      contactEmail: opt(160),
      logoColor: s(false, 20),
      verified: bool,
      isStartup: bool,
      featured: bool,
      rating: num(),
    },
  },
};

/** Demandes reçues, consultées par l'administration (lecture, et statut des messages de contact). */
export const INBOXES: Record<string, { entity: EntityTarget<ObjectLiteral>; relations?: string[] }> = {
  contact: { entity: ContactMessage },
  appointments: { entity: Appointment },
  applications: { entity: OpportunityApplication, relations: ['opportunity'] },
  'resource-requests': { entity: ResourceRequest },
  'company-requests': { entity: CompanyContactRequest, relations: ['company'] },
  newsletter: { entity: NewsletterSubscription },
};
