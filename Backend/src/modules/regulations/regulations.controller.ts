import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { matchesQuery, normalize, slugify } from '../../common/text';
import { HsCode, RegulationProfile } from './regulation.entities';

@Controller('regulations')
export class RegulationsController {
  constructor(
    @InjectRepository(HsCode) private readonly hsCodes: Repository<HsCode>,
    @InjectRepository(RegulationProfile) private readonly profiles: Repository<RegulationProfile>,
  ) {}

  /** Recherche par code SH (ex. « 8517 ») ou mot-clé produit (ex. « smartphone »). */
  @Get('hs-codes')
  async searchHsCodes(@Query('q') q?: string, @Query('featured') featured?: string) {
    const all = await this.hsCodes.find({ order: { code: 'ASC' } });
    if (featured === 'true') return all.filter((hs) => hs.featured);

    const query = (q ?? '').trim();
    if (!query) return all;
    const codePrefix = query.match(/^\d{2,8}/)?.[0];
    const words = normalize(query.replace(/^\d+\s*/, ''));
    return all.filter(
      (hs) =>
        (codePrefix && hs.code.startsWith(codePrefix.slice(0, 4))) ||
        (words.length > 1 && matchesQuery(words, hs.label, hs.category, hs.keywords ?? [])),
    );
  }

  @Get('profiles')
  listProfiles(@Query('kind') kind?: 'country' | 'agreement') {
    return this.profiles.find({ where: kind ? { kind } : {}, order: { name: 'ASC' } });
  }

  /** Fiche par identifiant ou par nom (« Maroc », « Accord de libre-échange Chine – Maroc »). */
  @Get('profiles/:key')
  async profile(@Param('key') key: string) {
    const profile =
      (await this.profiles.findOne({ where: { id: key } })) ??
      (await this.profiles.findOne({ where: { id: slugify(key) } }));
    if (!profile) throw new NotFoundException('Fiche réglementaire introuvable.');
    return profile;
  }
}
