import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';
import { Notification } from '../notifications/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { CommunityAccessService } from './community-access.service';
import { CommunityPost, MatchRequest } from './community.entities';
import { CreateMatchRequestDto, SearchQueryDto } from './community.dto';
import { CommunitiesService } from './communities.service';
import { PostsService } from './posts.service';
import { ProfilesService } from './profiles.service';

/** Fonctions transverses de QIAO Community : recherche globale, activité récente, recommandations, statistiques. */
@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(MatchRequest) private readonly matchRequests: Repository<MatchRequest>,
    @InjectRepository(Notification) private readonly notificationRows: Repository<Notification>,
    @InjectRepository(CommunityPost) private readonly posts: Repository<CommunityPost>,
    private readonly communities: CommunitiesService,
    private readonly postsService: PostsService,
    private readonly profiles: ProfilesService,
    private readonly access: CommunityAccessService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  /** Recherche Community : chaque résultat respecte les règles de visibilité de son objet. */
  async search(query: SearchQueryDto, viewer: User | null) {
    const type = query.type ?? 'all';
    const limit = type === 'all' ? 4 : query.limit ?? 10;
    const page = type === 'all' ? 1 : query.page ?? 1;
    const empty = { items: [], total: 0 };
    const postsQuery = (postType: 'post' | 'question') =>
      this.postsService.feed(
        {
          q: query.q,
          type: postType,
          community: query.community,
          category: query.category,
          language: query.language,
          from: query.from,
          questionStatus: postType === 'question' ? query.questionStatus : undefined,
          page,
          limit,
        },
        viewer,
      );
    const [communities, posts, questions, members, experts] = await Promise.all([
      ['all', 'communities'].includes(type) ? this.communities.list({ q: query.q, category: undefined, language: query.language, page, limit }, viewer) : empty,
      ['all', 'posts'].includes(type) ? postsQuery('post') : empty,
      ['all', 'questions'].includes(type) ? postsQuery('question') : empty,
      ['all', 'members'].includes(type) && query.q ? this.profiles.searchMembers({ q: query.q, country: query.country, language: query.language, page, limit }, viewer) : empty,
      ['all', 'experts'].includes(type)
        ? this.profiles.expertDirectory({ q: query.q, category: query.category, country: query.country, language: query.language, community: query.community, page, limit }, viewer)
        : empty,
    ]);
    return { type, page, communities, posts, questions, members, experts };
  }

  async recommendations(viewer: User | null) {
    const [communities, members] = await Promise.all([this.communities.recommended(viewer, 6), this.profiles.recommendedMembers(viewer, 8)]);
    return { communities, members };
  }

  /**
   * Activité récente du membre : réponses, commentaires, mentions, décisions d'adhésion (notifications Community)
   * et nouvelles discussions de ses communautés. Les messages privés restent dans la messagerie.
   */
  async recentActivity(user: User) {
    const [notifications, communityIds] = await Promise.all([
      this.notificationRows.find({
        where: { user: { id: user.id }, kind: Not(IsNull()), type: 'community' },
        order: { createdAt: 'DESC' },
        take: 12,
      }),
      this.access.activeCommunityIds(user),
    ]);
    const fromNotifications = notifications
      .filter((n) => n.kind !== 'message')
      .map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body, link: n.link, read: n.read, createdAt: n.createdAt }));
    let fromCommunities: typeof fromNotifications = [];
    if (communityIds.length) {
      const feed = await this.postsService.feed({ filter: 'my-communities', limit: 6, from: new Date(Date.now() - 14 * 86_400_000).toISOString() }, user);
      fromCommunities = feed.items
        .filter((post) => post.author?.id !== user.id)
        .map((post) => ({
          id: `post-${post.id}`,
          kind: 'new_discussion',
          title: `Nouvelle ${post.type === 'question' ? 'question' : 'discussion'} dans ${post.community?.name}`,
          body: post.title ?? post.content.slice(0, 100),
          link: `community/post/${post.id}`,
          read: true,
          createdAt: post.createdAt,
        }));
    }
    return [...fromNotifications, ...fromCommunities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }

  recordVisit(user: User) {
    return this.activity.recordVisit(user.id).then(() => ({ success: true }));
  }

  stats() {
    return this.communities.stats();
  }

  // --- QIAO Connect (service QIAO, distinct des interactions Community) ----------------------

  async createMatchRequest(dto: CreateMatchRequestDto, user: User | null) {
    const fullName = dto.fullName?.trim() || user?.fullName;
    const email = dto.email?.trim().toLowerCase() || user?.email;
    if (!fullName || !email) {
      throw new BadRequestException('Indiquez votre nom et votre e-mail pour être recontacté.');
    }
    const request = await this.matchRequests.save(
      this.matchRequests.create({
        profileType: dto.profileType,
        description: dto.description.trim(),
        fullName,
        email,
        user: user ? ({ id: user.id } as User) : null,
      }),
    );
    await this.notifications.notify(
      user,
      'Demande QIAO Connect enregistrée',
      `Profil recherché : ${dto.profileType}. Un conseiller vous proposera des contacts qualifiés sous 24h.`,
      'community',
      'dashboard',
    );
    return { id: request.id, createdAt: request.createdAt };
  }

  // --- Espace membre ------------------------------------------------------------------------

  listFollowing(user: User) {
    return this.profiles.listFollowing(user);
  }

  listBookmarks(user: User) {
    return this.postsService.listBookmarks(user);
  }

  async myStats(user: User) {
    const [posts, questions] = await Promise.all([
      this.posts.count({ where: { author: { id: user.id }, status: 'published', type: 'post' } }),
      this.posts.count({ where: { author: { id: user.id }, status: 'published', type: 'question', createdAt: MoreThan(new Date(0)) } }),
    ]);
    return { posts, questions };
  }
}
