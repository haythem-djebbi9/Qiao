import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isAllFilter, matchesQuery, normalize } from '../../common/text';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { ApplyOpportunityDto, OpportunitiesQueryDto } from './opportunities.dto';
import { Opportunity, OpportunityApplication } from './opportunity.entities';

/** « 500k - 2M USD » → [500 000, 2 000 000] */
function parseAmountRange(label: string): [number, number] | null {
  const values = Array.from(label.matchAll(/(\d+(?:[.,]\d+)?)\s*([kKmM])/g)).map(([, n, unit]) => {
    const base = Number(n.replace(',', '.'));
    return unit.toLowerCase() === 'k' ? base * 1_000 : base * 1_000_000;
  });
  return values.length === 2 ? [values[0], values[1]] : null;
}

function matchesSector(opportunity: Opportunity, filter?: string): boolean {
  if (isAllFilter(filter)) return true;
  const a = normalize(opportunity.sector);
  const b = normalize(filter);
  return a.includes(b) || b.includes(a) || b.split(/\s*&\s*/).some((part) => part.length > 3 && a.includes(part));
}

function matchesStatus(opportunity: Opportunity, filter?: string): boolean {
  if (isAllFilter(filter)) return true;
  const f = normalize(filter);
  if (f.startsWith('verif')) return opportunity.verified;
  if (f.startsWith('urgent')) return opportunity.urgent;
  return opportunity.status === 'active';
}

function matchesType(opportunity: Opportunity, filter?: string): boolean {
  if (isAllFilter(filter)) return true;
  return normalize(opportunity.type).includes(normalize(filter).slice(0, 6));
}

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(Opportunity) private readonly opportunities: Repository<Opportunity>,
    @InjectRepository(OpportunityApplication) private readonly applications: Repository<OpportunityApplication>,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: OpportunitiesQueryDto, user: User | null) {
    const all = await this.opportunities.find({ order: { publishedAt: 'DESC' } });
    const range = query.amount && !isAllFilter(query.amount) ? parseAmountRange(query.amount) : null;
    const applied = user ? await this.appliedIds(user) : new Set<string>();

    const filtered = all.filter(
      (opp) =>
        (!query.placement || opp.placements.includes(query.placement)) &&
        matchesType(opp, query.type) &&
        (isAllFilter(query.country) ||
          [opp.country, opp.fromCountry, opp.toCountry].some((c) => normalize(c) === normalize(query.country))) &&
        matchesSector(opp, query.sector) &&
        matchesStatus(opp, query.status) &&
        (!range ||
          ((opp.amountMaxUsd ?? Number.MAX_SAFE_INTEGER) >= range[0] && (opp.amountMinUsd ?? 0) <= range[1])) &&
        matchesQuery(query.q, opp.title, opp.sector, opp.country, opp.fromCountry, opp.toCountry, opp.partnerType, opp.description),
    );

    const page = query.limit ? filtered.slice(0, query.limit) : filtered;
    return page.map((opp) => ({ ...opp, hasApplied: applied.has(opp.id) }));
  }

  async findOne(id: string) {
    const opportunity = await this.opportunities.findOne({ where: { id } });
    if (!opportunity) throw new NotFoundException('Opportunité introuvable.');
    const applicationsCount = await this.applications.count({ where: { opportunity: { id } } });
    return { ...opportunity, applicationsCount };
  }

  async apply(id: string, dto: ApplyOpportunityDto, user: User | null) {
    const opportunity = await this.opportunities.findOne({ where: { id } });
    if (!opportunity) throw new NotFoundException('Opportunité introuvable.');
    if (opportunity.status !== 'active') {
      throw new ConflictException('Cette opportunité est clôturée.');
    }

    const email = dto.email.trim().toLowerCase();
    if (await this.applications.exist({ where: { opportunity: { id }, email } })) {
      throw new ConflictException('Vous avez déjà manifesté votre intérêt pour cette opportunité.');
    }

    const application = await this.applications.save(
      this.applications.create({
        opportunity,
        fullName: dto.fullName.trim(),
        email,
        company: dto.company?.trim() || null,
        phone: dto.phone?.trim() || null,
        message: dto.message?.trim() || null,
        user: user ? ({ id: user.id } as User) : null,
      }),
    );

    await this.notifications.notify(
      user,
      'Candidature transmise',
      `« ${opportunity.title} » : un expert QIAO vérifie votre dossier et vous met en relation sous 48h.`,
      'opportunity',
      'dashboard',
    );
    return { id: application.id, status: application.status, createdAt: application.createdAt };
  }

  async listForUser(user: User) {
    const rows = await this.applications.find({
      where: [{ user: { id: user.id } }, { email: user.email }],
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt,
      opportunity: row.opportunity,
    }));
  }

  private async appliedIds(user: User) {
    const rows = await this.applications.find({ where: [{ user: { id: user.id } }, { email: user.email }] });
    return new Set(rows.map((row) => row.opportunity.id));
  }
}
