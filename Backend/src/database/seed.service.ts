import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { Course, LearningPath, TrainingDomain } from '../modules/academy/academy.entities';
import { Article } from '../modules/articles/article.entity';
import { AuthIdentity } from '../modules/auth/auth.entities';
import { ServiceOffering } from '../modules/catalog/service-offering.entity';
import {
  Community,
  CommunityCategory,
  CommunityMembership,
  CommunityPost,
  Conversation,
  ConversationParticipant,
  DEFAULT_PRIVACY,
  ExpertProfile,
  Follow,
  MemberProfile,
  Message,
  PostComment,
  ProfessionalCategory,
  Reaction,
} from '../modules/community/community.entities';
import { Company } from '../modules/companies/company.entities';
import { QiaoDocument } from '../modules/documents/document.entities';
import { QiaoEvent } from '../modules/events/event.entity';
import { Notification } from '../modules/notifications/notification.entity';
import { Opportunity } from '../modules/opportunities/opportunity.entities';
import { HsCode, RegulationProfile } from '../modules/regulations/regulation.entities';
import { CustomsTariff, FreightRate } from '../modules/simulations/simulation.entities';
import { User } from '../modules/users/user.entity';
import { UsersService } from '../modules/users/users.service';
import { COURSES, LEARNING_PATHS, TRAINING_DOMAINS } from './data/academy.data';
import { ARTICLES } from './data/articles.data';
import {
  COMMUNITY_CATEGORIES,
  PROFESSIONAL_CATEGORIES,
  SEED_COMMUNITIES,
  SEED_FOLLOWS,
  SEED_MEMBERS,
  SEED_POSTS,
  SeedComment,
} from './data/community.data';
import { COMPANIES } from './data/companies.data';
import { DOCUMENTS } from './data/documents.data';
import { EVENTS } from './data/events.data';
import { OPPORTUNITIES } from './data/opportunities.data';
import { CUSTOMS_TARIFFS, FREIGHT_RATES, HS_CODES, REGULATION_PROFILES } from './data/reference.data';
import { SERVICES } from './data/services.data';

/** Compte de démonstration (membre simple, sans rôle d'administration). */
export const DEMO_ACCOUNT = {
  email: 'sami.benali@qiao.tn',
  password: 'Qiao2026!',
};

/** Domaine réservé (RFC 2606) des membres fictifs : ils n'ont aucun moyen de connexion. */
const SEED_DOMAIN = 'membres.qiao.example';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Seed');

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>('DB_SEED', 'true') === 'true') {
      await this.run();
    }
    await this.ensureAdmin();
    const backfilled = await this.usersService.backfillHandles();
    if (backfilled) this.logger.log(`${backfilled} identifiant(s) @handle attribué(s)`);
  }

  /** Remplit chaque table vide avec le contenu du template (idempotent). */
  async run() {
    await this.seedTable(ServiceOffering, SERVICES);
    await this.seedTable(TrainingDomain, TRAINING_DOMAINS);
    await this.seedTable(Course, COURSES);
    await this.seedTable(LearningPath, LEARNING_PATHS);
    await this.seedTable(QiaoEvent, EVENTS);
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
    await this.seedTable(CommunityCategory, COMMUNITY_CATEGORIES);
    await this.seedTable(ProfessionalCategory, PROFESSIONAL_CATEGORIES);
    // Compte de démonstration et membres fictifs : jamais en production, sauf demande explicite (SEED_DEMO=true).
    const production = this.config.get<string>('NODE_ENV') === 'production';
    if (this.config.get<string>('SEED_DEMO', production ? 'false' : 'true') === 'true') {
      await this.seedDemoUser();
      await this.seedCommunity();
    } else {
      await this.seedCommunitiesOnly();
    }
    await this.backfillEmailIdentities();
  }

  /** Production : les communautés (présentation, règles, visibilité), sans membres ni discussions fictifs. */
  private async seedCommunitiesOnly() {
    if ((await this.dataSource.getRepository(Community).count()) > 0) return;
    for (const [index, seed] of SEED_COMMUNITIES.entries()) await this.createCommunity(seed, index);
    this.logger.log(`QIAO Community : ${SEED_COMMUNITIES.length} communautés insérées`);
  }

  private async createCommunity(seed: (typeof SEED_COMMUNITIES)[number], index: number) {
    const communities = this.dataSource.getRepository(Community);
    return communities.save(
      communities.create({
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        rules: seed.rules ?? "1. Restez courtois et professionnel.\n2. Pas de publicité non sollicitée ni de spam.\n3. Ne partagez pas d'informations personnelles d'autrui.\n4. Les recommandations sont des avis de membres, pas des garanties QIAO.",
        category: await this.dataSource.getRepository(CommunityCategory).findOneBy({ id: seed.category }),
        coverImage: seed.cover,
        icon: seed.icon,
        languages: seed.languages,
        scope: seed.scope,
        visibility: seed.visibility,
        membershipPolicy: seed.policy,
        featured: seed.featured ?? false,
        sortOrder: index,
      }),
    );
  }

  private async seedTable<T extends ObjectLiteral>(entity: EntityTarget<T>, rows: Partial<T>[]) {
    const repository = this.dataSource.getRepository(entity);
    if ((await repository.count()) > 0) return;
    await repository.save(rows.map((row) => repository.create(row as T)));
    this.logger.log(`${repository.metadata.tableName} : ${rows.length} lignes insérées`);
  }

  /**
   * Administrateur QIAO défini par les variables ADMIN_EMAIL / ADMIN_PASSWORD (jamais codé en dur).
   * Un compte existant est promu administrateur ; son mot de passe n'est défini que s'il n'en a pas.
   */
  private async ensureAdmin() {
    const email = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email) return;
    const users = this.dataSource.getRepository(User);
    const identities = this.dataSource.getRepository(AuthIdentity);
    let admin = await users.createQueryBuilder('user').addSelect('user.passwordHash').where('user.email = :email', { email }).getOne();
    if (!admin) {
      if (!password || password.length < 8) {
        this.logger.warn('ADMIN_EMAIL défini sans ADMIN_PASSWORD valide (8 caractères minimum) : administrateur non créé.');
        return;
      }
      const fullName = this.config.get<string>('ADMIN_NAME', 'Administrateur QIAO');
      admin = await users.save(
        users.create({
          fullName,
          email,
          passwordHash: await bcrypt.hash(password, 10),
          handle: await this.usersService.generateHandle(fullName),
          accountType: 'enterprise',
          origin: 'north-africa',
          title: 'Équipe QIAO',
          location: 'Tunis, Tunisie',
          role: 'admin',
          verified: true,
          termsAcceptedAt: new Date(),
        }),
      );
      this.logger.log(`Administrateur créé : ${email}`);
    } else {
      const patch: Partial<User> = {};
      if (admin.role !== 'admin') patch.role = 'admin';
      if (!admin.passwordHash && password && password.length >= 8) patch.passwordHash = await bcrypt.hash(password, 10);
      if (Object.keys(patch).length) {
        await users.update(admin.id, patch);
        this.logger.log(`Compte ${email} promu administrateur`);
      }
    }
    if (!(await identities.exist({ where: { provider: 'email', providerSubject: email } }))) {
      await identities.save(identities.create({ user: { id: admin.id } as User, provider: 'email', providerSubject: email, providerEmail: email, displayName: admin.fullName }));
    }
  }

  /** Les comptes à mot de passe créés avant les identités liées reçoivent leur identité « e-mail ». */
  private async backfillEmailIdentities() {
    const users = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.passwordHash IS NOT NULL')
      .getMany();
    const identities = this.dataSource.getRepository(AuthIdentity);
    for (const user of users) {
      if (!(await identities.exist({ where: { provider: 'email', providerSubject: user.email } }))) {
        await identities.save(identities.create({ user: { id: user.id } as User, provider: 'email', providerSubject: user.email, providerEmail: user.email, displayName: user.fullName }));
      }
    }
  }

  private async seedDemoUser() {
    const users = this.dataSource.getRepository(User);
    if (await users.exist({ where: { email: DEMO_ACCOUNT.email } })) return;

    const user = await users.save(
      users.create({
        fullName: 'Sami Benali',
        email: DEMO_ACCOUNT.email,
        passwordHash: await bcrypt.hash(DEMO_ACCOUNT.password, 10),
        handle: await this.usersService.generateHandle('Sami Benali'),
        company: 'Benali Import-Export',
        accountType: 'enterprise',
        origin: 'north-africa',
        title: 'Directeur Import-Export',
        location: 'Tunis, Tunisie',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80',
        verified: true,
        termsAcceptedAt: new Date(),
      }),
    );
    await this.dataSource.getRepository(MemberProfile).save({
      userId: user.id,
      headline: 'Directeur Import-Export',
      country: 'Tunisie',
      city: 'Tunis',
      languages: ['fr', 'ar', 'en'],
      sectors: ['import-export', 'agriculture'],
      interests: ['Sourcing', 'Huile d’olive'],
      privacy: DEFAULT_PRIVACY,
      notificationPrefs: {},
    });

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

  /**
   * Communautés, membres, discussions et relations de démonstration.
   * Exécuté une seule fois (table des communautés vide) ; remplace les données de l'ancien modèle Community.
   */
  private async seedCommunity() {
    const communities = this.dataSource.getRepository(Community);
    if ((await communities.count()) > 0) return;

    await this.dataSource.query('DROP TABLE IF EXISTS community_connections, community_experts, community_post_likes CASCADE');
    await this.dataSource.getRepository(CommunityPost).createQueryBuilder().delete().execute();

    const users = this.dataSource.getRepository(User);
    const profiles = this.dataSource.getRepository(MemberProfile);
    const experts = this.dataSource.getRepository(ExpertProfile);
    const memberships = this.dataSource.getRepository(CommunityMembership);
    const posts = this.dataSource.getRepository(CommunityPost);
    const comments = this.dataSource.getRepository(PostComment);
    const reactions = this.dataSource.getRepository(Reaction);
    const follows = this.dataSource.getRepository(Follow);
    const categories = this.dataSource.getRepository(CommunityCategory);
    const professional = this.dataSource.getRepository(ProfessionalCategory);

    // --- Membres (comptes sans aucune méthode de connexion) -----------------------------
    const byKey = new Map<string, User>();
    for (const [index, member] of SEED_MEMBERS.entries()) {
      const email = `${member.key}@${SEED_DOMAIN}`;
      const user =
        (await users.findOne({ where: { email } })) ??
        (await users.save(
          users.create({
            fullName: member.fullName,
            email,
            passwordHash: null,
            handle: await this.usersService.generateHandle(member.fullName),
            company: member.company ?? null,
            accountType: member.expert ? 'expert' : 'enterprise',
            origin: member.origin,
            title: member.headline,
            location: `${member.city}, ${member.country}`,
            avatarUrl: member.avatar || null,
            verified: true,
            createdAt: minutesAgo(60 * 24 * (120 - index * 4)),
          }),
        ));
      byKey.set(member.key, user);
      await profiles.save({
        userId: user.id,
        headline: member.headline,
        bio: member.bio ?? null,
        country: member.country,
        city: member.city,
        languages: member.languages,
        sectors: member.sectors,
        interests: [],
        privacy: { ...DEFAULT_PRIVACY, messages: member.expert ? 'everyone' : 'connections' },
        notificationPrefs: {},
      });
      if (member.expert) {
        await experts.save({
          userId: user.id,
          listed: true,
          headline: member.expert.headline,
          biography: member.bio ?? null,
          categories: member.expert.categories,
          countriesServed: member.expert.countriesServed,
          languages: member.languages,
          yearsExperience: member.expert.years,
          verificationStatus: member.expert.verification,
          verificationEvidence: member.expert.evidence ?? null,
          verificationRequestedAt: member.expert.verification === 'pending' ? minutesAgo(600) : null,
          verifiedAt: member.expert.verification === 'verified' ? minutesAgo(60 * 24 * 30) : null,
        });
      }
    }
    const demo = await users.findOne({ where: { email: DEMO_ACCOUNT.email } });

    // --- Communautés & adhésions ---------------------------------------------------------
    const bySlug = new Map<string, Community>();
    for (const [index, seed] of SEED_COMMUNITIES.entries()) {
      const community = await this.createCommunity(seed, index);
      bySlug.set(seed.slug, community);
      for (const key of seed.members) {
        await memberships.save(
          memberships.create({
            user: byKey.get(key)!,
            community,
            status: 'active',
            role: seed.moderators.includes(key) ? 'moderator' : 'member',
            joinedAt: minutesAgo(60 * 24 * 60),
          }),
        );
      }
      if (demo && seed.demo) {
        await memberships.save(
          memberships.create({
            user: demo,
            community,
            status: seed.demo,
            role: 'member',
            joinedAt: seed.demo === 'active' ? minutesAgo(60 * 24 * 10) : null,
            requestMessage: seed.demo === 'pending' ? 'Importateur textile à Tunis, je souhaite suivre les audits d’usines.' : null,
            invitedBy: seed.demo === 'invited' ? byKey.get(seed.moderators[0]) ?? null : null,
          }),
        );
      }
    }
    // Demande en attente pour illustrer la validation par les modérateurs.
    await memberships.save(
      memberships.create({
        user: byKey.get('nadia')!,
        community: bySlug.get('investment')!,
        status: 'pending',
        role: 'member',
        requestMessage: "Étudiante en commerce international, je prépare un mémoire sur les IDE chinois au Maghreb.",
      }),
    );

    // --- Publications, commentaires, réactions --------------------------------------------
    for (const seed of SEED_POSTS) {
      const author = byKey.get(seed.author)!;
      const post = await posts.save(
        posts.create({
          author,
          community: seed.community ? bySlug.get(seed.community)! : null,
          type: seed.type,
          title: seed.title ?? null,
          content: seed.content,
          tags: seed.tags,
          professionalCategory: seed.category ? await professional.findOneBy({ id: seed.category }) : null,
          language: seed.language ?? 'fr',
          status: 'published',
          questionStatus: seed.type === 'question' ? seed.questionStatus ?? 'open' : null,
          likesCount: seed.likes.length,
          createdAt: minutesAgo(seed.ageMinutes),
        }),
      );
      for (const key of seed.likes) {
        await reactions.insert({ user: byKey.get(key)!, targetType: 'post', targetId: post.id, reactionType: 'like' });
      }
      await follows.insert({ follower: author, targetType: 'post', targetId: post.id });

      const saveComment = async (data: SeedComment, parent: PostComment | null): Promise<PostComment> => {
        const comment = await comments.save(
          comments.create({
            post,
            author: byKey.get(data.author)!,
            parent,
            text: data.text,
            likesCount: data.likes?.length ?? 0,
            createdAt: minutesAgo(data.ageMinutes),
          }),
        );
        for (const key of data.likes ?? []) {
          await reactions.insert({ user: byKey.get(key)!, targetType: 'comment', targetId: comment.id, reactionType: 'like' });
        }
        for (const reply of data.replies ?? []) await saveComment(reply, comment);
        return comment;
      };
      const saved: PostComment[] = [];
      for (const data of seed.comments ?? []) saved.push(await saveComment(data, null));

      const total = await comments.count({ where: { post: { id: post.id } } });
      const firstForeign = (seed.comments ?? []).filter((c) => c.author !== seed.author).sort((a, b) => b.ageMinutes - a.ageMinutes)[0];
      await posts.update(post.id, {
        commentsCount: total,
        firstResponseAt: firstForeign ? minutesAgo(firstForeign.ageMinutes) : null,
        acceptedCommentId: seed.accepted !== undefined ? saved[seed.accepted]?.id ?? null : null,
      });
    }

    // --- Suivis entre membres ------------------------------------------------------------------
    for (const [follower, followed] of SEED_FOLLOWS) {
      await follows.insert({ follower: byKey.get(follower)!, targetType: 'user', targetId: byKey.get(followed)!.id });
    }
    if (demo) {
      await follows.insert({ follower: demo, targetType: 'user', targetId: byKey.get('zhao-ling')!.id });
      await this.seedDemoConversation(demo, byKey.get('karim')!);
    }
    for (const user of [...byKey.values(), ...(demo ? [demo] : [])]) {
      const [followers, following] = await Promise.all([
        follows.count({ where: { targetType: 'user', targetId: user.id } }),
        follows.count({ where: { follower: { id: user.id }, targetType: 'user' } }),
      ]);
      await profiles.update({ userId: user.id }, { followersCount: followers, followingCount: following });
    }

    // --- Compteurs des communautés --------------------------------------------------------------
    for (const community of bySlug.values()) {
      const [membersCount, postsCount] = await Promise.all([
        memberships.count({ where: { community: { id: community.id }, status: 'active' } }),
        posts.count({ where: { community: { id: community.id }, status: 'published' } }),
      ]);
      await communities.update(community.id, { membersCount, postsCount });
    }
    this.logger.log(
      `QIAO Community : ${SEED_COMMUNITIES.length} communautés, ${SEED_MEMBERS.length} membres, ${SEED_POSTS.length} discussions insérées`,
    );
  }

  /** Conversation privée de démonstration entre le compte démo et un transitaire. */
  private async seedDemoConversation(demo: User, karim: User) {
    const conversations = this.dataSource.getRepository(Conversation);
    const participants = this.dataSource.getRepository(ConversationParticipant);
    const messages = this.dataSource.getRepository(Message);
    const pairKey = [demo.id, karim.id].sort().join(':');
    if (await conversations.exist({ where: { pairKey } })) return;
    const conversation = await conversations.save(
      conversations.create({ pairKey, lastMessageAt: minutesAgo(25), contextType: 'profile', contextId: karim.handle, contextLabel: `Profil de ${karim.fullName}` }),
    );
    await participants.save([
      participants.create({ conversation, user: demo, lastReadAt: minutesAgo(200) }),
      participants.create({ conversation, user: karim, lastReadAt: minutesAgo(25) }),
    ]);
    await messages.save([
      messages.create({ conversation, author: demo, body: "Bonjour Karim, je prépare un premier conteneur de 20' depuis Ningbo vers Radès. Votre offre de groupage inclut-elle le dédouanement en Tunisie ?", createdAt: minutesAgo(240) }),
      messages.create({ conversation, author: karim, body: "Bonjour Sami, oui : nous gérons le dédouanement à Radès avec notre partenaire agréé. Envoyez-moi la facture proforma et la liste de colisage, je vous fais un devis sous 24h.", createdAt: minutesAgo(25) }),
    ]);
  }
}

