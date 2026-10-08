import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { Course, LearningPath, TrainingDomain } from '../modules/academy/academy.entities';
import { Article } from '../modules/articles/article.entity';
import { ServiceOffering } from '../modules/catalog/service-offering.entity';
import { CommunityPost, Expert, PostComment } from '../modules/community/community.entities';
import { Company } from '../modules/companies/company.entities';
import { QiaoDocument } from '../modules/documents/document.entities';
import { QiaoEvent } from '../modules/events/event.entity';
import { Notification } from '../modules/notifications/notification.entity';
import { Opportunity } from '../modules/opportunities/opportunity.entities';
import { HsCode, RegulationProfile } from '../modules/regulations/regulation.entities';
import { CustomsTariff, FreightRate } from '../modules/simulations/simulation.entities';
import { User } from '../modules/users/user.entity';
import { COURSES, LEARNING_PATHS, TRAINING_DOMAINS } from './data/academy.data';
import { ARTICLES } from './data/articles.data';
import { EXPERTS, POSTS } from './data/community.data';
import { COMPANIES } from './data/companies.data';
import { DOCUMENTS } from './data/documents.data';
import { EVENTS } from './data/events.data';
import { OPPORTUNITIES } from './data/opportunities.data';
import { CUSTOMS_TARIFFS, FREIGHT_RATES, HS_CODES, REGULATION_PROFILES } from './data/reference.data';
import { SERVICES } from './data/services.data';

/** Compte de démonstration (identifiants documentés dans Backend/README.md). */
export const DEMO_ACCOUNT = {
  email: 'sami.benali@qiao.tn',
  password: 'Qiao2026!',
};

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Seed');

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>('DB_SEED', 'true') === 'true') {
      await this.run();
    }
  }

  /** Remplit chaque table vide avec le contenu du template (idempotent). */
  async run() {
    await this.seedTable(ServiceOffering, SERVICES);
    await this.seedTable(TrainingDomain, TRAINING_DOMAINS);
    await this.seedTable(Course, COURSES);
    await this.seedTable(LearningPath, LEARNING_PATHS);
    await this.seedTable(QiaoEvent, EVENTS);
    await this.seedTable(Expert, EXPERTS);
    await this.seedTable(QiaoDocument, DOCUMENTS);
    await this.seedTable(Article, ARTICLES);
    await this.seedTable(Company, COMPANIES);
    await this.seedTable(CustomsTariff, CUSTOMS_TARIFFS);
    await this.seedTable(FreightRate, FREIGHT_RATES);
    await this.seedTable(HsCode, HS_CODES);
    await this.seedTable(RegulationProfile, REGULATION_PROFILES);
    await this.seedTable(
      Opportunity,
      OPPORTUNITIES.map(({ publishedDaysAgo, ...opportunity }) => ({ ...opportunity, publishedAt: daysAgo(publishedDaysAgo) })),
    );
    await this.seedPosts();
    await this.seedDemoUser();
  }

  private async seedTable<T extends ObjectLiteral>(entity: EntityTarget<T>, rows: Partial<T>[]) {
    const repository = this.dataSource.getRepository(entity);
    if ((await repository.count()) > 0) return;
    await repository.save(rows.map((row) => repository.create(row as T)));
    this.logger.log(`${repository.metadata.tableName} : ${rows.length} lignes insérées`);
  }

  private async seedPosts() {
    const posts = this.dataSource.getRepository(CommunityPost);
    if ((await posts.count()) > 0) return;
    const comments = this.dataSource.getRepository(PostComment);

    for (const { ageMinutes, seedComments = [], ...data } of POSTS) {
      const post = await posts.save(
        posts.create({ ...data, commentsCount: seedComments.length, createdAt: minutesAgo(ageMinutes) }),
      );
      for (const comment of seedComments) {
        await comments.save(
          comments.create({
            post,
            authorName: comment.author,
            authorAvatar: comment.avatar,
            text: comment.text,
            createdAt: minutesAgo(comment.ageMinutes),
          }),
        );
      }
    }
    this.logger.log(`community_posts : ${POSTS.length} publications insérées`);
  }

  private async seedDemoUser() {
    const users = this.dataSource.getRepository(User);
    if (await users.exist({ where: { email: DEMO_ACCOUNT.email } })) return;

    const user = await users.save(
      users.create({
        fullName: 'Sami Benali',
        email: DEMO_ACCOUNT.email,
        passwordHash: await bcrypt.hash(DEMO_ACCOUNT.password, 10),
        company: 'Benali Import-Export',
        accountType: 'enterprise',
        origin: 'north-africa',
        title: 'Directeur Import-Export',
        location: 'Tunis, Tunisie',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        verified: true,
      }),
    );

    const notifications = this.dataSource.getRepository(Notification);
    await notifications.save([
      notifications.create({
        user,
        title: 'Nouvelle opportunité : Agroalimentaire',
        body: "Exportation d'huile d'olive vers Shanghai réactualisée.",
        type: 'opportunity',
        link: 'commerce-hub',
        createdAt: minutesAgo(90),
      }),
      notifications.create({
        user,
        title: 'Webinaire Intelligence Chine-Maghreb',
        body: 'Session live demain à 14h00 CET.',
        type: 'event',
        link: 'evenements',
        createdAt: minutesAgo(300),
      }),
      notifications.create({
        user,
        title: 'Nouveau rapport disponible',
        body: 'Le rapport « China – North Africa Trade Outlook » est disponible au téléchargement.',
        type: 'resource',
        link: 'resources',
        createdAt: minutesAgo(1440),
      }),
    ]);
    this.logger.log(`Compte de démonstration créé : ${DEMO_ACCOUNT.email}`);
  }
}
