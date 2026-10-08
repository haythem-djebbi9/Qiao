import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isAllFilter, matchesQuery, normalize } from '../../common/text';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { renderDocument } from './document-renderer';
import { DocumentDownload, QiaoDocument, ResourceRequest } from './document.entities';
import { CreateResourceRequestDto, DocumentsQueryDto } from './documents.dto';

function formatDownloads(total: number): string {
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1).replace('.0', '')}k`;
  }
  return String(total);
}

function includesNormalized(values: string[] | null, filter?: string): boolean {
  if (isAllFilter(filter)) return true;
  return (values ?? []).some((value) => normalize(value) === normalize(filter));
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(QiaoDocument) private readonly documents: Repository<QiaoDocument>,
    @InjectRepository(DocumentDownload) private readonly downloads: Repository<DocumentDownload>,
    @InjectRepository(ResourceRequest) private readonly requests: Repository<ResourceRequest>,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: DocumentsQueryDto) {
    const all = await this.documents.find();
    const filtered = all.filter(
      (doc) =>
        (!query.section || (doc.sections ?? []).includes(query.section)) &&
        (!query.premium || doc.premium) &&
        (isAllFilter(query.category) || normalize(doc.category) === normalize(query.category)) &&
        includesNormalized(doc.needs, query.need) &&
        includesNormalized(doc.countries, query.country) &&
        (isAllFilter(query.format) || normalize(doc.format) === normalize(query.format)) &&
        (isAllFilter(query.type) || normalize(doc.reportType) === normalize(query.type)) &&
        (isAllFilter(query.sector) || normalize(doc.sector) === normalize(query.sector)) &&
        (isAllFilter(query.year) || doc.publishedAt.startsWith(query.year!)) &&
        matchesQuery(query.q, doc.title, doc.description, doc.category, doc.kind, doc.countries ?? [], doc.sector),
    );

    const sorted =
      query.sort === 'popular'
        ? filtered.sort((a, b) => b.baseDownloads + b.downloadsCount - (a.baseDownloads + a.downloadsCount))
        : filtered.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    return (query.limit ? sorted.slice(0, query.limit) : sorted).map((doc) => this.present(doc));
  }

  async findOne(id: string) {
    return this.present(await this.getDocument(id));
  }

  async download(id: string, user: User | null) {
    const doc = await this.getDocument(id);
    if (doc.format === 'Vidéo') {
      throw new BadRequestException('Cette ressource est une vidéo : utilisez le lecteur pour la consulter.');
    }
    if (doc.premium && !user) {
      throw new UnauthorizedException('Ressource Premium réservée aux membres : connectez-vous pour la télécharger.');
    }

    const file = await renderDocument(doc);
    doc.downloadsCount += 1;
    await this.documents.save(doc);
    await this.downloads.save(this.downloads.create({ document: doc, user: user ? ({ id: user.id } as User) : null }));
    return file;
  }

  async registerView(id: string) {
    const doc = await this.getDocument(id);
    doc.viewsCount += 1;
    await this.documents.save(doc);
    return { views: doc.viewsCount };
  }

  async createRequest(dto: CreateResourceRequestDto, user: User | null) {
    const request = await this.requests.save(
      this.requests.create({
        kind: dto.kind ?? 'request',
        title: dto.title.trim(),
        email: dto.email.trim().toLowerCase(),
        details: dto.details?.trim() || null,
        user: user ? ({ id: user.id } as User) : null,
      }),
    );
    await this.notifications.notify(
      user,
      request.kind === 'replay' ? 'Replay demandé' : 'Demande de ressource transmise',
      request.kind === 'replay'
        ? `Le lien du replay « ${request.title} » vous sera envoyé à ${request.email}.`
        : `Notre équipe de veille recherche « ${request.title} » et vous répond sous 48h.`,
      'resource',
      'dashboard',
    );
    return { id: request.id, createdAt: request.createdAt };
  }

  async listDownloadsForUser(user: User) {
    const rows = await this.downloads.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
      take: 30,
    });
    return rows.map((row) => ({ id: row.id, createdAt: row.createdAt, document: this.present(row.document) }));
  }

  private async getDocument(id: string) {
    const doc = await this.documents.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document introuvable.');
    return doc;
  }

  private present(doc: QiaoDocument) {
    const totalDownloads = doc.baseDownloads + doc.downloadsCount;
    return {
      ...doc,
      totalDownloads,
      downloadsLabel: `${formatDownloads(totalDownloads)} téléchargements`,
    };
  }
}
