import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { matchesQuery, normalize } from '../../common/text';
import { Course } from '../academy/academy.entities';
import { Article } from '../articles/article.entity';
import { ServiceOffering } from '../catalog/service-offering.entity';
import { Company } from '../companies/company.entities';
import { QiaoDocument } from '../documents/document.entities';
import { QiaoEvent } from '../events/event.entity';
import { Opportunity } from '../opportunities/opportunity.entities';

const LIMIT = 5;

export interface SearchHit {
  type: 'service' | 'opportunity' | 'document' | 'event' | 'course' | 'company' | 'article';
  id: string;
  title: string;
  subtitle: string;
}

/** Recherche transversale : services, opportunités, ressources, événements, formations, entreprises, analyses. */
@Controller('search')
export class SearchController {
  constructor(
    @InjectRepository(ServiceOffering) private readonly services: Repository<ServiceOffering>,
    @InjectRepository(Opportunity) private readonly opportunities: Repository<Opportunity>,
    @InjectRepository(QiaoDocument) private readonly documents: Repository<QiaoDocument>,
    @InjectRepository(QiaoEvent) private readonly events: Repository<QiaoEvent>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(Article) private readonly articles: Repository<Article>,
  ) {}

  @Get()
  async search(@Query('q') q = '') {
    if (normalize(q).length < 2) return { query: q, total: 0, results: [] as SearchHit[] };

    const [services, opportunities, documents, events, courses, companies, articles] = await Promise.all([
      this.services.find(),
      this.opportunities.find({ order: { publishedAt: 'DESC' } }),
      this.documents.find({ order: { publishedAt: 'DESC' } }),
      this.events.find({ order: { startDate: 'ASC' } }),
      this.courses.find({ order: { sortOrder: 'ASC' } }),
      this.companies.find(),
      this.articles.find({ order: { publishedAt: 'DESC' } }),
    ]);

    const results: SearchHit[] = [
      ...services
        .filter((s) => matchesQuery(q, s.title, s.description, s.category, s.details))
        .slice(0, LIMIT)
        .map((s) => ({ type: 'service' as const, id: s.id, title: s.title, subtitle: s.category })),
      ...opportunities
        .filter((o) => matchesQuery(q, o.title, o.sector, o.country, o.fromCountry, o.toCountry, o.description))
        .slice(0, LIMIT)
        .map((o) => ({ type: 'opportunity' as const, id: o.id, title: o.title, subtitle: `${o.type} · ${o.fromCountry} → ${o.toCountry}` })),
      ...companies
        .filter((c) => matchesQuery(q, c.name, c.sector, c.country, c.city, c.badges))
        .slice(0, LIMIT)
        .map((c) => ({ type: 'company' as const, id: c.id, title: c.name, subtitle: `${c.businessType} · ${c.country}` })),
      ...documents
        .filter((d) => matchesQuery(q, d.title, d.description, d.category, d.countries ?? []))
        .slice(0, LIMIT)
        .map((d) => ({ type: 'document' as const, id: d.id, title: d.title, subtitle: `${d.kind} · ${d.format}` })),
      ...events
        .filter((e) => matchesQuery(q, e.title, e.location, e.category, e.description))
        .slice(0, LIMIT)
        .map((e) => ({ type: 'event' as const, id: e.id, title: e.title, subtitle: `${e.dateRange} ${e.monthYear} · ${e.location}` })),
      ...courses
        .filter((c) => !c.trainingDomainId && matchesQuery(q, c.title, c.instructor, c.description))
        .slice(0, LIMIT)
        .map((c) => ({ type: 'course' as const, id: c.id, title: c.title, subtitle: `${c.instructor} · ${c.price} TND` })),
      ...articles
        .filter((a) => matchesQuery(q, a.title, a.summary, a.category))
        .slice(0, LIMIT)
        .map((a) => ({ type: 'article' as const, id: a.id, title: a.title, subtitle: `${a.category} · ${a.dateLabel}` })),
    ];

    return { query: q, total: results.length, results };
  }
}
