import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isAllFilter, matchesQuery, normalize } from '../../common/text';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { CompaniesQueryDto, ContactCompanyDto } from './companies.dto';
import { Company, CompanyContactRequest } from './company.entities';

function matchesSegment(company: Company, segment?: string): boolean {
  switch (segment) {
    case 'chinoises':
      return company.origin === 'Chinoise';
    case 'nord-africaines':
      return company.origin === 'Nord-Africaine';
    case 'startups':
      return company.isStartup;
    case 'distributeurs':
      return ['Distributeur', 'Retailer', 'Marketplace'].includes(company.businessType);
    case 'fabricants':
      return company.businessType === 'Fabricant';
    default:
      return true;
  }
}

/** « Fabricants » → Fabricant, « Retailers » → Retailer... */
function matchesBusinessType(company: Company, filter?: string): boolean {
  if (isAllFilter(filter)) return true;
  return normalize(filter).startsWith(normalize(company.businessType));
}

function matchesTurnover(company: Company, filter?: string): boolean {
  if (isAllFilter(filter)) return true;
  const value = company.turnoverMusd;
  if (value === null) return false;
  const f = normalize(filter);
  if (f.startsWith('<')) return value < 10;
  if (f.startsWith('>')) return value > 200;
  if (f.startsWith('10 m')) return value >= 10 && value <= 50;
  if (f.startsWith('50 m')) return value > 50 && value <= 200;
  return true;
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(CompanyContactRequest) private readonly requests: Repository<CompanyContactRequest>,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: CompaniesQueryDto) {
    const all = await this.companies.find();
    const filtered = all.filter(
      (company) =>
        matchesSegment(company, query.segment) &&
        (isAllFilter(query.country) || normalize(company.country) === normalize(query.country)) &&
        matchesBusinessType(company, query.type) &&
        (isAllFilter(query.sector) || normalize(company.sectorGroup) === normalize(query.sector)) &&
        matchesTurnover(company, query.turnover) &&
        (!query.verified || company.verified) &&
        (query.minRating === undefined || company.rating >= query.minRating) &&
        (!query.featured || company.featured) &&
        matchesQuery(query.q, company.name, company.nativeName, company.country, company.city, company.sector, company.badges, company.mainProducts ?? []),
    );

    const sorted = filtered.sort((a, b) => {
      if (query.sort === 'recent') return b.addedAt.localeCompare(a.addedAt);
      if (query.sort === 'rating') return b.rating - a.rating;
      if (query.sort === 'name') return a.name.localeCompare(b.name);
      return Number(b.featured) - Number(a.featured) || b.rating - a.rating;
    });
    return {
      items: query.limit ? sorted.slice(0, query.limit) : sorted,
      total: sorted.length,
    };
  }

  async findOne(id: string) {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Entreprise introuvable.');
    return company;
  }

  async contact(id: string, dto: ContactCompanyDto, user: User | null) {
    const company = await this.findOne(id);
    const request = await this.requests.save(
      this.requests.create({
        company,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        organization: dto.organization?.trim() || null,
        message: dto.message.trim(),
        user: user ? ({ id: user.id } as User) : null,
      }),
    );
    await this.notifications.notify(
      user,
      `Mise en relation demandée avec ${company.name}`,
      'QIAO vérifie votre demande et organise un premier échange sous 72h.',
      'opportunity',
      'dashboard',
    );
    return { id: request.id, createdAt: request.createdAt };
  }

  async listRequestsForUser(user: User) {
    const rows = await this.requests.find({
      where: [{ user: { id: user.id } }, { email: user.email }],
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => ({ id: row.id, createdAt: row.createdAt, company: { id: row.company.id, name: row.company.name, country: row.company.country } }));
  }
}
