import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { DataSource, Repository } from 'typeorm';
import { SeoService } from '../seo/seo.service';
import { ContentTranslation } from './content-translation.entity';

export const SITE_LANGUAGES = ['en', 'zh', 'ar'] as const;
export type SiteLanguage = (typeof SITE_LANGUAGES)[number];

/** Textes publics du catalogue, seuls envoyés au service de traduction (jamais de données de membres). */
const CATALOG: Record<string, string[]> = {
  courses: ['title', 'description', 'level', 'format', 'badge', 'instructorRole', 'duration', 'modules'],
  learning_paths: ['title', 'description', 'duration'],
  training_domains: ['title', 'description', 'featuredCourse', 'duration'],
  course_modules: ['title', 'description'],
  course_lessons: ['title'],
  events: ['title', 'category', 'dateRange', 'monthYear', 'time', 'location', 'country', 'priceLabel', 'description'],
  opportunities: ['title', 'type', 'sector', 'country', 'fromCountry', 'toCountry', 'amountLabel', 'partnerType', 'description'],
  articles: ['title', 'summary', 'category', 'dateLabel', 'readTime', 'keyPoints', 'content'],
  documents: ['title', 'kind', 'category', 'dateLabel', 'description'],
  services: ['title', 'category', 'description', 'details'],
  communities: ['name', 'description', 'rules'],
  community_categories: ['name'],
  professional_categories: ['name'],
};

const LANGUAGE_NAMES: Record<SiteLanguage, string> = {
  en: 'professional international business English',
  zh: 'Simplified Chinese (zh-CN)',
  ar: 'Modern Standard Arabic with Western digits (0-9)',
};
const SYSTEM_PROMPT = (language: SiteLanguage) => `You translate French content published on QIAO (桥), a B2B platform connecting China and North Africa, into ${LANGUAGE_NAMES[language]}.
Return only a JSON array of strings: same length and order as the input. Keep QIAO, QIAO Academy, brand, company and people's names, numbers, currency codes and URLs unchanged. Translate country names. Never add notes.`;

/** Lots volontairement petits : quelques textes nouveaux à chaque passage, sans à-coup de coût. */
const SYNC_INTERVAL_MS = 15 * 60_000;
const FIRST_SYNC_DELAY_MS = 30_000;
const BATCH_SIZE = 25;
const MAX_STRINGS_PER_RUN = 300;
const MAX_SOURCE_LENGTH = 6000;

const normalize = (text: string) => text.replace(/[\s  ]+/g, ' ').trim();
const hashOf = (text: string) => createHash('sha256').update(text).digest('hex');
const FRONTEND_DIST = process.env.FRONTEND_DIST ?? join(__dirname, '..', '..', '..', '..', 'Frontend', 'dist');

/** Traductions des contenus publiés par l'administration, complétées périodiquement avec Gemini. */
@Injectable()
export class I18nService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('I18n');
  private timers: NodeJS.Timeout[] = [];
  private running = false;

  constructor(
    @InjectRepository(ContentTranslation) private readonly translations: Repository<ContentTranslation>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly seo: SeoService,
  ) {}

  onApplicationBootstrap() {
    if (!this.seo.configured) {
      this.logger.warn('GEMINI_API_KEY absent : les contenus publiés depuis la mise en ligne ne sont pas traduits.');
      return;
    }
    this.timers.push(setTimeout(() => void this.sync(), FIRST_SYNC_DELAY_MS));
    this.timers.push(setInterval(() => void this.sync(), SYNC_INTERVAL_MS));
  }

  onModuleDestroy() {
    this.timers.forEach((timer) => clearTimeout(timer));
  }

  async dictionary(language: SiteLanguage) {
    const rows = await this.translations.find({ where: { language }, select: { source: true, target: true } });
    return Object.fromEntries(rows.map((row) => [row.source, row.target]));
  }

  /** Textes du catalogue, tels qu'ils sont affichés sur le site. */
  private async catalogTexts() {
    const texts = new Set<string>();
    for (const [table, columns] of Object.entries(CATALOG)) {
      const list = columns.map((column) => `"${column}"`).join(', ');
      const rows: Record<string, unknown>[] = await this.dataSource.query(`SELECT ${list} FROM "${table}"`);
      for (const row of rows) {
        for (const value of Object.values(row)) {
          for (const item of Array.isArray(value) ? value : [value]) {
            if (typeof item !== 'string') continue;
            const text = normalize(item);
            if (/\p{L}{2}/u.test(text) && text.length <= MAX_SOURCE_LENGTH) texts.add(text);
          }
        }
      }
    }
    return [...texts];
  }

  private staticDictionary(language: SiteLanguage): Record<string, string> {
    const file = join(FRONTEND_DIST, 'i18n', `${language}.json`);
    if (!existsSync(file)) return {};
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>;
  }

  async sync() {
    if (this.running) return;
    this.running = true;
    try {
      const texts = await this.catalogTexts();
      for (const language of SITE_LANGUAGES) {
        const known = new Set((await this.translations.find({ where: { language }, select: { source: true } })).map((row) => row.source));
        const dictionary = this.staticDictionary(language);
        const missing = texts.filter((text) => !known.has(text) && !dictionary[text]).slice(0, MAX_STRINGS_PER_RUN);
        for (let index = 0; index < missing.length; index += BATCH_SIZE) {
          await this.translateBatch(language, missing.slice(index, index + BATCH_SIZE));
        }
        if (missing.length) this.logger.log(`${language} : ${missing.length} texte(s) traduit(s)`);
      }
    } catch (err) {
      this.logger.warn(`Traduction des contenus interrompue : ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  private async translateBatch(language: SiteLanguage, sources: string[]) {
    const translated = await this.seo.translateStrings(SYSTEM_PROMPT(language), sources);
    const rows = sources
      .map((source, index) => ({ language, sourceHash: hashOf(source), source, target: translated[index]?.trim() ?? '' }))
      .filter((row) => row.target);
    if (rows.length) await this.translations.upsert(rows, ['language', 'sourceHash']);
  }
}
