import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { slugify } from '../../common/text';
import { AuditService } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { COLLECTIONS, CollectionDef, INBOXES } from './site-admin.collections';
import { SiteContent } from './site-content.entity';

const CONTENT_KEY = /^[a-z0-9][a-z0-9:-]{2,119}$/;
const MAX_CONTENT_BYTES = 600_000;
const CONTACT_STATUSES = ['new', 'in-progress', 'closed'];

@Injectable()
export class SiteAdminService {
  constructor(
    @InjectRepository(SiteContent) private readonly contents: Repository<SiteContent>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  // --- Contenus du site (secteurs, sous-secteurs...) -----------------------------------------

  async allContents() {
    const rows = await this.contents.find();
    return Object.fromEntries(rows.map((row) => [row.key, row.data]));
  }

  async saveContent(admin: User, key: string, data: unknown) {
    if (!CONTENT_KEY.test(key)) throw new BadRequestException('Clé de contenu invalide.');
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new BadRequestException('Contenu invalide.');
    if (JSON.stringify(data).length > MAX_CONTENT_BYTES) throw new BadRequestException('Contenu trop volumineux.');
    await this.contents.save({ key, data: data as Record<string, unknown> });
    await this.audit.log(admin, 'site.content.save', { type: 'site-content', id: key });
    return { key, data };
  }

  async resetContent(admin: User, key: string) {
    await this.contents.delete({ key });
    await this.audit.log(admin, 'site.content.reset', { type: 'site-content', id: key });
    return { key, reset: true };
  }

  // --- Collections (services, opportunités, analyses, documents, entreprises) ---------------

  private collection(name: string): CollectionDef {
    const def = COLLECTIONS[name];
    if (!def) throw new NotFoundException('Collection inconnue.');
    return def;
  }

  /** Valeurs saisies, contrôlées et converties selon la définition des champs. */
  private clean(def: CollectionDef, input: Record<string, unknown>, creating: boolean) {
    const out: Record<string, unknown> = {};
    for (const [field, spec] of Object.entries(def.fields)) {
      if (!(field in input)) {
        if (creating && spec.required) throw new BadRequestException(`Le champ « ${field} » est obligatoire.`);
        continue;
      }
      const raw = input[field];
      if ((raw === null || raw === '') && spec.nullable) {
        out[field] = null;
        continue;
      }
      switch (spec.type) {
        case 'boolean':
          out[field] = Boolean(raw);
          break;
        case 'number': {
          const value = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
          if (!Number.isFinite(value)) throw new BadRequestException(`Le champ « ${field} » doit être un nombre.`);
          out[field] = value;
          break;
        }
        case 'strings': {
          const items = (Array.isArray(raw) ? raw : String(raw ?? '').split('\n'))
            .map((item) => String(item ?? '').trim())
            .filter(Boolean)
            .slice(0, 100);
          out[field] = items.length || !spec.nullable ? items : null;
          break;
        }
        default: {
          const value = String(raw ?? '').trim();
          if (spec.required && !value) throw new BadRequestException(`Le champ « ${field} » est obligatoire.`);
          if (spec.max && value.length > spec.max) throw new BadRequestException(`Le champ « ${field} » est trop long (${spec.max} caractères au plus).`);
          if (spec.options && value && !spec.options.includes(value)) throw new BadRequestException(`Valeur non autorisée pour « ${field} ».`);
          out[field] = value;
        }
      }
    }
    return out;
  }

  async list(name: string) {
    const def = this.collection(name);
    return this.dataSource.getRepository(def.entity).find({ order: def.order as never });
  }

  async create(admin: User, name: string, input: Record<string, unknown>) {
    const def = this.collection(name);
    const repository = this.dataSource.getRepository(def.entity);
    const values = this.clean(def, input, true);
    const base = slugify(String(values[def.titleField] ?? '')) || `${name}-${Date.now()}`;
    let id = base.slice(0, 100);
    for (let n = 2; await repository.exist({ where: { id } as never }); n += 1) id = `${base.slice(0, 95)}-${n}`;
    const row = repository.create({ ...def.defaults, ...values, id } as never);
    const saved = await repository.save(row);
    await this.audit.log(admin, 'site.collection.create', { type: name, id, label: String(values[def.titleField] ?? '') });
    return saved;
  }

  async update(admin: User, name: string, id: string, input: Record<string, unknown>) {
    const def = this.collection(name);
    const repository = this.dataSource.getRepository(def.entity);
    const row = await repository.findOne({ where: { id } as never });
    if (!row) throw new NotFoundException('Fiche introuvable.');
    Object.assign(row, this.clean(def, input, false));
    const saved = await repository.save(row);
    await this.audit.log(admin, 'site.collection.update', { type: name, id, label: String((row as Record<string, unknown>)[def.titleField] ?? '') });
    return saved;
  }

  async remove(admin: User, name: string, id: string) {
    const def = this.collection(name);
    const repository = this.dataSource.getRepository(def.entity);
    const row = await repository.findOne({ where: { id } as never });
    if (!row) throw new NotFoundException('Fiche introuvable.');
    try {
      await repository.remove(row);
    } catch {
      throw new BadRequestException('Cette fiche est liée à des demandes ou des téléchargements : modifiez-la ou fermez-la plutôt.');
    }
    await this.audit.log(admin, 'site.collection.delete', { type: name, id, label: String((row as Record<string, unknown>)[def.titleField] ?? '') });
    return { id, deleted: true };
  }

  // --- Demandes reçues ------------------------------------------------------------------------

  async inbox(name: string) {
    const def = INBOXES[name];
    if (!def) throw new NotFoundException('Liste inconnue.');
    return this.dataSource.getRepository(def.entity).find({
      relations: def.relations,
      order: { createdAt: 'DESC' } as never,
      take: 300,
    });
  }

  async setContactStatus(admin: User, id: string, status: string) {
    if (!CONTACT_STATUSES.includes(status)) throw new BadRequestException('Statut invalide.');
    const repository = this.dataSource.getRepository(INBOXES.contact.entity);
    const row = await repository.findOne({ where: { id } as never });
    if (!row) throw new NotFoundException('Message introuvable.');
    await repository.update({ id } as never, { status } as never);
    await this.audit.log(admin, 'site.contact.status', { type: 'contact-message', id }, { status });
    return { id, status };
  }
}
