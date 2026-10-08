import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { matchesQuery } from '../../common/text';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import {
  CommunityPost,
  Expert,
  ExpertConnection,
  MatchRequest,
  PostBookmark,
  PostComment,
  PostLike,
} from './community.entities';
import { CreateCommentDto, CreateMatchRequestDto, CreatePostDto, PostsQueryDto } from './community.dto';

const FEATURED_LIKES_THRESHOLD = 20;

function matchesFilter(post: CommunityPost, filter?: string): boolean {
  switch (filter) {
    case 'À la une':
      return post.category === 'À la une' || post.likesCount > FEATURED_LIKES_THRESHOLD;
    case 'Questions':
      return post.category === 'Questions' || post.tags.includes('Question');
    case 'Offres':
      return post.category === 'Offres' || post.tags.includes('Offres') || post.tags.includes('Partenariat');
    case 'Actualités':
      return post.category === 'Actualités' || post.tags.includes('Actualités') || post.tags.includes('Événement');
    default:
      return true;
  }
}

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(CommunityPost) private readonly posts: Repository<CommunityPost>,
    @InjectRepository(PostLike) private readonly likes: Repository<PostLike>,
    @InjectRepository(PostBookmark) private readonly bookmarks: Repository<PostBookmark>,
    @InjectRepository(PostComment) private readonly comments: Repository<PostComment>,
    @InjectRepository(Expert) private readonly experts: Repository<Expert>,
    @InjectRepository(ExpertConnection) private readonly connections: Repository<ExpertConnection>,
    @InjectRepository(MatchRequest) private readonly matchRequests: Repository<MatchRequest>,
    private readonly notifications: NotificationsService,
  ) {}

  // --- Publications --------------------------------------------------------

  async listPosts(query: PostsQueryDto, user: User | null) {
    const all = await this.posts.find({ order: { createdAt: 'DESC' } });
    const filtered = all.filter(
      (post) =>
        matchesFilter(post, query.filter) &&
        (!query.community || post.community === query.community) &&
        matchesQuery(query.q, post.content, post.authorName, post.tags, post.authorLocation),
    );
    const page = query.limit ? filtered.slice(0, query.limit) : filtered;

    const [likedIds, bookmarkedIds] = user
      ? await Promise.all([this.likedPostIds(user), this.bookmarkedPostIds(user)])
      : [new Set<string>(), new Set<string>()];

    const items = await Promise.all(
      page.map(async (post) => ({
        ...this.presentPost(post),
        isLiked: likedIds.has(post.id),
        isBookmarked: bookmarkedIds.has(post.id),
        comments: await this.latestComments(post.id, 3),
      })),
    );
    return { items, total: filtered.length };
  }

  async createPost(user: User, dto: CreatePostDto) {
    const tag = dto.tag?.trim();
    const post = await this.posts.save(
      this.posts.create({
        author: { id: user.id } as User,
        authorName: user.fullName,
        authorRole: user.title || 'Membre QIAO',
        authorLocation: user.location || (user.origin === 'china' ? 'Chine' : 'Afrique du Nord'),
        authorAvatar: user.avatarUrl,
        content: dto.content.trim(),
        tags: Array.from(new Set([tag, dto.category].filter((t): t is string => !!t))),
        category: dto.category,
        community: dto.community ?? null,
      }),
    );
    await this.notifications.notify(
      user,
      'Publication en ligne',
      'Votre publication est visible par la communauté QIAO.',
      'community',
      'community',
    );
    return { ...this.presentPost(post), isLiked: false, isBookmarked: false, comments: [] };
  }

  async toggleLike(user: User, postId: string) {
    const post = await this.findPost(postId);
    const existing = await this.likes.findOne({ where: { post: { id: postId }, user: { id: user.id } } });
    if (existing) {
      await this.likes.remove(existing);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      await this.likes.save(this.likes.create({ post: { id: postId } as CommunityPost, user: { id: user.id } as User }));
      post.likesCount += 1;
    }
    await this.posts.save(post);
    return { liked: !existing, likes: post.likesCount };
  }

  async toggleBookmark(user: User, postId: string) {
    await this.findPost(postId);
    const existing = await this.bookmarks.findOne({ where: { post: { id: postId }, user: { id: user.id } } });
    if (existing) {
      await this.bookmarks.remove(existing);
    } else {
      await this.bookmarks.save(this.bookmarks.create({ post: { id: postId } as CommunityPost, user: { id: user.id } as User }));
    }
    return { bookmarked: !existing };
  }

  async listComments(postId: string) {
    await this.findPost(postId);
    const items = await this.comments.find({ where: { post: { id: postId } }, order: { createdAt: 'ASC' } });
    return items.map((c) => this.presentComment(c));
  }

  async addComment(user: User, postId: string, dto: CreateCommentDto) {
    const post = await this.findPost(postId);
    const comment = await this.comments.save(
      this.comments.create({
        post: { id: postId } as CommunityPost,
        author: { id: user.id } as User,
        authorName: user.fullName,
        authorAvatar: user.avatarUrl,
        text: dto.text.trim(),
      }),
    );
    post.commentsCount += 1;
    await this.posts.save(post);
    return { comment: this.presentComment(comment), commentsCount: post.commentsCount };
  }

  async listBookmarks(user: User) {
    const rows = await this.bookmarks.find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } });
    return rows.map((row) => this.presentPost(row.post));
  }

  // --- Experts -------------------------------------------------------------

  async listExperts(user: User | null) {
    const experts = await this.experts.find({ order: { sortOrder: 'ASC' } });
    const connected = user ? await this.connectedExpertIds(user) : new Set<string>();
    return experts.map((expert) => ({ ...expert, connected: connected.has(expert.id) }));
  }

  async toggleConnection(user: User, expertId: string) {
    const expert = await this.experts.findOne({ where: { id: expertId } });
    if (!expert) throw new NotFoundException('Expert introuvable.');
    const existing = await this.connections.findOne({ where: { user: { id: user.id }, expert: { id: expertId } } });
    if (existing) {
      await this.connections.remove(existing);
    } else {
      await this.connections.save(this.connections.create({ user: { id: user.id } as User, expert }));
      await this.notifications.notify(
        user,
        `Demande de connexion envoyée à ${expert.name}`,
        `${expert.role} (${expert.country}) recevra votre profil et pourra échanger avec vous.`,
        'community',
        'community',
      );
    }
    return { connected: !existing };
  }

  async listConnections(user: User) {
    const rows = await this.connections.find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } });
    return rows.map((row) => ({ ...row.expert, connectedAt: row.createdAt }));
  }

  // --- QIAO Connect --------------------------------------------------------

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

  // --- Utilitaires ---------------------------------------------------------

  private async findPost(id: string) {
    const post = await this.posts.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Publication introuvable.');
    return post;
  }

  private presentPost(post: CommunityPost) {
    return {
      id: post.id,
      author: post.authorName,
      role: post.authorRole,
      location: post.authorLocation,
      avatar: post.authorAvatar,
      content: post.content,
      tags: post.tags,
      category: post.category,
      community: post.community,
      likes: post.likesCount,
      commentsCount: post.commentsCount,
      createdAt: post.createdAt,
    };
  }

  private presentComment(comment: PostComment) {
    return {
      id: comment.id,
      author: comment.authorName,
      avatar: comment.authorAvatar,
      text: comment.text,
      createdAt: comment.createdAt,
    };
  }

  private async latestComments(postId: string, take: number) {
    const items = await this.comments.find({ where: { post: { id: postId } }, order: { createdAt: 'DESC' }, take });
    return items.reverse().map((c) => this.presentComment(c));
  }

  private async likedPostIds(user: User) {
    const rows = await this.likes.find({ where: { user: { id: user.id } }, relations: { post: true } });
    return new Set(rows.map((row) => row.post.id));
  }

  private async bookmarkedPostIds(user: User) {
    const rows = await this.bookmarks.find({ where: { user: { id: user.id } } });
    return new Set(rows.map((row) => row.post.id));
  }

  private async connectedExpertIds(user: User) {
    const rows = await this.connections.find({ where: { user: { id: user.id } } });
    return new Set(rows.map((row) => row.expert.id));
  }
}
