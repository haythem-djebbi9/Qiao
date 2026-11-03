import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { uploadsPath } from '../../common/uploads';
import { Brackets, In, IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { normalize, sqlUnaccent } from '../../common/text';
import { ActivityService, RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { CommunityAccessService } from './community-access.service';
import { CommunityNotifier, postTarget } from './community-notifier.service';
import {
  AttachmentRef,
  Community,
  CommunityAttachment,
  CommunityPost,
  Follow,
  PostBookmark,
  PostComment,
  ProfessionalCategory,
  Reaction,
} from './community.entities';
import { CommunitiesService } from './communities.service';
import { CreateCommentDto, CreatePostDto, FeedQueryDto, QuestionStatusDto, UpdatePostDto } from './community.dto';
import { MemberSummary, ProfilesService } from './profiles.service';

export const ATTACHMENTS_DIR = uploadsPath('community');
export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

/** Types de fichiers acceptés, vérifiés aussi par leur signature binaire. */
export const ALLOWED_FILES: Record<string, { ext: string[]; kind: 'image' | 'file'; magic?: number[][] }> = {
  'image/jpeg': { ext: ['.jpg', '.jpeg'], kind: 'image', magic: [[0xff, 0xd8, 0xff]] },
  'image/png': { ext: ['.png'], kind: 'image', magic: [[0x89, 0x50, 0x4e, 0x47]] },
  'image/webp': { ext: ['.webp'], kind: 'image', magic: [[0x52, 0x49, 0x46, 0x46]] },
  'image/gif': { ext: ['.gif'], kind: 'image', magic: [[0x47, 0x49, 0x46, 0x38]] },
  'application/pdf': { ext: ['.pdf'], kind: 'file', magic: [[0x25, 0x50, 0x44, 0x46]] },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: ['.docx'], kind: 'file', magic: [[0x50, 0x4b, 0x03, 0x04]] },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: ['.xlsx'], kind: 'file', magic: [[0x50, 0x4b, 0x03, 0x04]] },
};

const LANGUAGE_BY_INTERFACE: Record<string, string> = { FR: 'fr', AR: 'ar', EN: 'en', ZH: 'zh' };
const POPULARITY_SQL = '("post"."likesCount" * 2 + "post"."commentsCount" * 3)';

export interface CommentView {
  id: string;
  postId: string;
  parentId: string | null;
  author: MemberSummary | null;
  text: string | null;
  status: string;
  likes: number;
  isLiked: boolean;
  isAccepted: boolean;
  createdAt: Date;
  editedAt: Date | null;
  canEdit: boolean;
  canModerate: boolean;
  replies: CommentView[];
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(CommunityPost) private readonly posts: Repository<CommunityPost>,
    @InjectRepository(PostComment) private readonly comments: Repository<PostComment>,
    @InjectRepository(Reaction) private readonly reactions: Repository<Reaction>,
    @InjectRepository(PostBookmark) private readonly bookmarks: Repository<PostBookmark>,
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(CommunityAttachment) private readonly attachments: Repository<CommunityAttachment>,
    @InjectRepository(Community) private readonly communities: Repository<Community>,
    @InjectRepository(ProfessionalCategory) private readonly categories: Repository<ProfessionalCategory>,
    private readonly access: CommunityAccessService,
    private readonly notifier: CommunityNotifier,
    private readonly profiles: ProfilesService,
    private readonly communitiesService: CommunitiesService,
    private readonly activity: ActivityService,
    private readonly rateLimiter: RateLimiter,
  ) {}

  // ==========================================================================
  // Fil & lecture
  // ==========================================================================

  private baseQuery() {
    return this.posts
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .leftJoinAndSelect('post.professionalCategory', 'professionalCategory');
  }

  /** Restreint une requête aux publications lisibles par le visiteur (même règle que l'URL directe). */
  async applyVisibility(query: SelectQueryBuilder<CommunityPost>, viewer: User | null, options: { includeArchived?: boolean } = {}) {
    query.andWhere('post.status = :published', { published: 'published' });
    if (!options.includeArchived) query.andWhere("(community.id IS NULL OR community.status = 'active')");
    if (!this.access.isAdmin(viewer)) {
      const active = await this.access.activeCommunityIds(viewer);
      query.andWhere(
        new Brackets((qb) => {
          qb.where('community.id IS NULL').orWhere("community.visibility = 'public'");
          if (active.length) qb.orWhere('community.id IN (:...activeCommunities)', { activeCommunities: active });
        }),
      );
    }
    const blocked = [...(await this.access.blockedUserIds(viewer))];
    if (blocked.length) query.andWhere('author.id NOT IN (:...blockedAuthors)', { blockedAuthors: blocked });
    return query;
  }

  /**
   * Fil Community. Tris documentés et déterministes :
   *  - recent : plus récentes d'abord ;
   *  - popular : score = 2 × réactions + 3 × commentaires, puis plus récentes ;
   *  - unanswered : questions ouvertes sans aucune réponse d'un autre membre ;
   *  - questions : toutes les questions, plus récentes d'abord ;
   *  - my-communities : publications des communautés rejointes ;
   *  - following : publications des membres et discussions suivis.
   */
  async feed(query: FeedQueryDto, viewer: User | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.baseQuery();
    await this.applyVisibility(qb, viewer, { includeArchived: !!query.community });

    if (query.community) {
      const { community, membership } = await this.access.findDiscoverable(query.community, viewer);
      if (!this.access.canViewContent(community, membership, viewer)) {
        throw new ForbiddenException('Les discussions de cette communauté sont réservées à ses membres.');
      }
      qb.andWhere('community.id = :communityId', { communityId: community.id });
    }
    if (query.author) {
      const author = await this.profiles.findByHandle(query.author);
      qb.andWhere('author.id = :authorId', { authorId: author.id });
    }
    if (query.type) qb.andWhere('post.type = :type', { type: query.type });
    if (query.category) qb.andWhere('professionalCategory.id = :category', { category: query.category });
    if (query.language) qb.andWhere('post.language = :language', { language: query.language });
    if (query.from) qb.andWhere('post.createdAt >= :from', { from: new Date(query.from) });
    if (query.questionStatus) qb.andWhere('post.questionStatus = :questionStatus', { questionStatus: query.questionStatus });
    if (query.q) {
      qb.andWhere(
        `(${sqlUnaccent("COALESCE(post.title, '')")} LIKE :q OR ${sqlUnaccent('post.content')} LIKE :q OR ${sqlUnaccent('post.tags')} LIKE :q OR ${sqlUnaccent('author.fullName')} LIKE :q)`,
        { q: `%${normalize(query.q)}%` },
      );
    }

    switch (query.filter) {
      case 'popular':
        qb.addSelect(POPULARITY_SQL, 'popularity').orderBy('popularity', 'DESC').addOrderBy('post.createdAt', 'DESC');
        break;
      case 'unanswered':
        qb.andWhere("post.type = 'question' AND post.questionStatus = 'open' AND post.firstResponseAt IS NULL").orderBy('post.createdAt', 'DESC');
        break;
      case 'questions':
        qb.andWhere("post.type = 'question'").orderBy('post.createdAt', 'DESC');
        break;
      case 'my-communities': {
        const active = await this.access.activeCommunityIds(viewer);
        if (!viewer || active.length === 0) return { items: [], total: 0, page, hasMore: false };
        qb.andWhere('community.id IN (:...mine)', { mine: active }).orderBy('post.createdAt', 'DESC');
        break;
      }
      case 'following': {
        if (!viewer) return { items: [], total: 0, page, hasMore: false };
        const followed = await this.follows.find({ where: { follower: { id: viewer.id } } });
        const users = followed.filter((f) => f.targetType === 'user').map((f) => f.targetId);
        const posts = followed.filter((f) => f.targetType === 'post').map((f) => f.targetId);
        if (users.length === 0 && posts.length === 0) return { items: [], total: 0, page, hasMore: false };
        qb.andWhere(
          new Brackets((sub) => {
            if (users.length) sub.orWhere('author.id IN (:...followedUsers)', { followedUsers: users });
            if (posts.length) sub.orWhere('post.id IN (:...followedPosts)', { followedPosts: posts });
          }),
        );
        qb.andWhere('author.id != :viewerId', { viewerId: viewer.id }).orderBy('post.createdAt', 'DESC');
        break;
      }
      default:
        qb.orderBy('post.createdAt', 'DESC');
    }

    const total = await qb.clone().orderBy().getCount();
    const rows = await qb.offset((page - 1) * limit).limit(limit).getMany();
    const items = await this.presentPosts(rows, viewer, { preview: true });
    return { items, total, page, hasMore: page * limit < total };
  }

  async getPost(id: string, viewer: User | null) {
    const post = await this.findPost(id);
    await this.access.assertCanViewPost(post, viewer);
    const [view] = await this.presentPosts([post], viewer, { preview: false });
    return view;
  }

  async drafts(user: User) {
    const rows = await this.baseQuery()
      .where('author.id = :id AND post.status = :status', { id: user.id, status: 'draft' })
      .orderBy('post.updatedAt', 'DESC')
      .getMany();
    return this.presentPosts(rows, user, { preview: false });
  }

  async findPost(id: string) {
    const post = await this.posts.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Publication introuvable.');
    return post;
  }

  async findComment(id: string) {
    const comment = await this.comments.findOne({ where: { id }, relations: { post: { author: true, community: true }, parent: true } });
    if (!comment) throw new NotFoundException('Commentaire introuvable.');
    return comment;
  }

  /** Présente des publications avec l'état propre au visiteur (réaction, favori, suivi, droits). */
  async presentPosts(posts: CommunityPost[], viewer: User | null, options: { preview: boolean }) {
    if (posts.length === 0) return [];
    const ids = posts.map((p) => p.id);
    const [summaries, liked, bookmarked, followed, moderated, memberships, previews] = await Promise.all([
      this.profiles.summaries(posts.map((p) => p.author.id), viewer),
      viewer
        ? this.reactions.find({ where: { user: { id: viewer.id }, targetType: 'post', targetId: In(ids) } }).then((rows) => new Set(rows.map((r) => r.targetId)))
        : Promise.resolve(new Set<string>()),
      viewer
        ? this.bookmarks.find({ where: { user: { id: viewer.id }, post: { id: In(ids) } } }).then((rows) => new Set(rows.map((r) => r.post.id)))
        : Promise.resolve(new Set<string>()),
      viewer
        ? this.follows.find({ where: { follower: { id: viewer.id }, targetType: 'post', targetId: In(ids) } }).then((rows) => new Set(rows.map((r) => r.targetId)))
        : Promise.resolve(new Set<string>()),
      this.access.moderatedCommunityIds(viewer),
      this.access.membershipsByCommunity(viewer, [...new Set(posts.map((p) => p.community?.id).filter((id): id is string => !!id))]),
      options.preview ? this.previewComments(ids, viewer) : Promise.resolve(new Map<string, CommentView[]>()),
    ]);

    return posts.map((post) => {
      const isAuthor = viewer?.id === post.author.id;
      const canModerate = moderated === 'all' || (!!post.community && moderated.includes(post.community.id));
      const membership = post.community ? memberships.get(post.community.id) : null;
      const canParticipate = this.access.canParticipate(post.community, membership, viewer) && post.status === 'published';
      const commentsOpen = !post.locked && post.questionStatus !== 'closed';
      return {
        id: post.id,
        type: post.type,
        title: post.title,
        content: post.content,
        tags: post.tags,
        language: post.language,
        status: post.status,
        questionStatus: post.questionStatus,
        acceptedCommentId: post.acceptedCommentId,
        locked: post.locked,
        community: post.community
          ? { id: post.community.id, slug: post.community.slug, name: post.community.name, visibility: post.community.visibility }
          : null,
        professionalCategory: post.professionalCategory ? { id: post.professionalCategory.id, name: post.professionalCategory.name } : null,
        author: summaries.get(post.author.id) ?? null,
        likes: post.likesCount,
        commentsCount: post.commentsCount,
        attachments: post.attachments,
        links: post.links,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        editedAt: post.editedAt,
        isLiked: liked.has(post.id),
        isBookmarked: bookmarked.has(post.id),
        isFollowing: followed.has(post.id),
        permissions: {
          canEdit: isAuthor && ['published', 'draft'].includes(post.status),
          canDelete: isAuthor && post.status !== 'deleted',
          canModerate,
          canComment: canParticipate && (commentsOpen || canModerate),
          canReact: canParticipate,
          canSetQuestionStatus: post.type === 'question' && (isAuthor || canModerate),
          canMessageAuthor: !!viewer && !isAuthor,
        },
        preview: previews.get(post.id) ?? [],
      };
    });
  }

  // ==========================================================================
  // Création / édition / suppression
  // ==========================================================================

  async create(user: User, dto: CreatePostDto) {
    this.rateLimiter.hit(`post:${user.id}`, 10, 10 * 60_000, 'Vous publiez trop rapidement. Réessayez dans quelques minutes.');
    let community: Community | null = null;
    if (dto.communityId) {
      community = await this.communities.findOne({ where: { id: dto.communityId } });
      if (!community) throw new NotFoundException('Communauté introuvable.');
      const membership = await this.access.membership(user, community.id);
      if (!this.access.canDiscover(community, membership, user)) throw new NotFoundException('Communauté introuvable.');
      if (!this.access.canPublish(community, membership, user)) {
        throw new ForbiddenException(`Rejoignez la communauté « ${community.name} » pour y publier.`);
      }
    }
    if (dto.type === 'question' && !dto.title?.trim()) throw new BadRequestException('Donnez un titre à votre question.');
    const professionalCategory = await this.resolveCategory(dto.professionalCategory);
    const attachments = await this.claimAttachments(user, dto.attachmentIds ?? [], null);
    const status = dto.draft ? 'draft' : 'published';

    const post = await this.posts.save(
      this.posts.create({
        author: { id: user.id } as User,
        community,
        type: dto.type,
        title: dto.title?.trim() || null,
        content: dto.content.trim(),
        tags: cleanTags(dto.tags),
        professionalCategory,
        language: dto.language ?? LANGUAGE_BY_INTERFACE[user.language] ?? 'fr',
        status,
        questionStatus: dto.type === 'question' ? 'open' : null,
        attachments,
        links: dto.links ?? [],
      }),
    );
    await this.attachments.update({ id: In(attachments.map((a) => a.id)) }, { postId: post.id });
    await this.follows.save(this.follows.create({ follower: { id: user.id } as User, targetType: 'post', targetId: post.id })).catch(() => undefined);
    if (status === 'published') await this.afterPublish(post, user);
    return this.getPost(post.id, user);
  }

  private async afterPublish(post: CommunityPost, user: User) {
    if (post.community) await this.communitiesService.refreshCounts(post.community.id);
    await this.activity.record(post.type === 'question' ? 'question_created' : 'post_created', user.id, { type: 'post', id: post.id });
    const full = await this.findPost(post.id);
    await this.notifier.notifyMentions(`${post.title ?? ''} ${post.content}`, full, user);
  }

  async update(user: User, id: string, dto: UpdatePostDto) {
    const post = await this.findPost(id);
    if (post.author.id !== user.id) throw new ForbiddenException('Vous ne pouvez modifier que vos propres publications.');
    if (!['published', 'draft'].includes(post.status)) throw new BadRequestException('Cette publication ne peut plus être modifiée.');
    const wasDraft = post.status === 'draft';
    if (dto.publish && wasDraft) {
      const membership = post.community ? await this.access.membership(user, post.community.id) : null;
      if (!this.access.canPublish(post.community, membership, user)) throw new ForbiddenException('Vous ne pouvez plus publier dans cette communauté.');
    }
    if (dto.title !== undefined) post.title = dto.title.trim() || null;
    if (post.type === 'question' && !post.title) throw new BadRequestException('Une question doit avoir un titre.');
    if (dto.content !== undefined) post.content = dto.content.trim();
    if (dto.tags !== undefined) post.tags = cleanTags(dto.tags);
    if (dto.language !== undefined) post.language = dto.language;
    if (dto.professionalCategory !== undefined) post.professionalCategory = await this.resolveCategory(dto.professionalCategory);
    if (dto.links !== undefined) post.links = dto.links;
    if (dto.attachmentIds !== undefined) {
      const kept = post.attachments.filter((a) => dto.attachmentIds!.includes(a.id));
      const added = await this.claimAttachments(user, dto.attachmentIds.filter((aid) => !kept.some((k) => k.id === aid)), post.id);
      post.attachments = [...kept, ...added].slice(0, 4);
      await this.attachments.update({ id: In(added.map((a) => a.id)) }, { postId: post.id });
    }
    if (!wasDraft) post.editedAt = new Date();
    if (dto.publish && wasDraft) {
      post.status = 'published';
      post.createdAt = new Date();
    }
    await this.posts.save(post);
    if (dto.publish && wasDraft) await this.afterPublish(post, user);
    return this.getPost(post.id, user);
  }

  /** Suppression par l'auteur : la publication disparaît de la communauté ; un historique est conservé pour la modération. */
  async remove(user: User, id: string) {
    const post = await this.findPost(id);
    if (post.author.id !== user.id) throw new ForbiddenException('Vous ne pouvez supprimer que vos propres publications.');
    post.status = 'deleted';
    await this.posts.save(post);
    if (post.community) await this.communitiesService.refreshCounts(post.community.id);
    return { success: true };
  }

  async setQuestionStatus(user: User, id: string, dto: QuestionStatusDto) {
    const post = await this.findPost(id);
    await this.access.assertCanViewPost(post, user);
    if (post.type !== 'question') throw new BadRequestException("Seules les questions ont un statut.");
    const isAuthor = post.author.id === user.id;
    if (!isAuthor && !(await this.access.isModerator(user, post.community?.id))) {
      throw new ForbiddenException("Seul l'auteur de la question ou un modérateur peut changer son statut.");
    }
    let acceptedAuthorId: string | null = null;
    if (dto.status === 'answered' && dto.acceptedCommentId) {
      const comment = await this.comments.findOne({ where: { id: dto.acceptedCommentId, post: { id: post.id }, status: 'published' } });
      if (!comment) throw new BadRequestException('Réponse introuvable dans cette discussion.');
      if (comment.author.id === post.author.id) throw new BadRequestException("La réponse acceptée doit venir d'un autre membre.");
      post.acceptedCommentId = comment.id;
      acceptedAuthorId = comment.author.id;
    } else if (dto.status !== 'answered') {
      post.acceptedCommentId = null;
    }
    post.questionStatus = dto.status;
    await this.posts.save(post);
    if (acceptedAuthorId) {
      await this.notifier.send(
        [acceptedAuthorId],
        'answer_accepted',
        { title: 'Votre réponse a été acceptée', body: `« ${post.title} » — l'auteur a retenu votre réponse.` },
        postTarget(post),
        user.id,
      );
    }
    return this.getPost(post.id, user);
  }

  private async resolveCategory(id: string | undefined | null) {
    if (!id) return null;
    const category = await this.categories.findOne({ where: { id } });
    if (!category) throw new BadRequestException('Catégorie professionnelle inconnue.');
    return category;
  }

  // ==========================================================================
  // Commentaires
  // ==========================================================================

  private async commentViews(rows: PostComment[], post: Pick<CommunityPost, 'id' | 'acceptedCommentId'>, viewer: User | null, canModerate: boolean) {
    const blocked = await this.access.blockedUserIds(viewer);
    const visibleRows = rows.filter((c) => !blocked.has(c.author.id));
    const summaries = await this.profiles.summaries(visibleRows.map((c) => c.author.id), viewer);
    const liked = viewer
      ? new Set(
          (await this.reactions.find({ where: { user: { id: viewer.id }, targetType: 'comment', targetId: In(visibleRows.map((c) => c.id).concat('00000000-0000-0000-0000-000000000000')) } })).map(
            (r) => r.targetId,
          ),
        )
      : new Set<string>();
    return visibleRows.map((comment): CommentView => {
      const isAuthor = viewer?.id === comment.author.id;
      const showText = comment.status === 'published' || isAuthor || (canModerate && comment.status !== 'deleted');
      return {
        id: comment.id,
        postId: post.id,
        parentId: comment.parent?.id ?? null,
        author: comment.status === 'deleted' && !isAuthor ? null : summaries.get(comment.author.id) ?? null,
        text: showText ? comment.text : null,
        status: comment.status,
        likes: comment.likesCount,
        isLiked: liked.has(comment.id),
        isAccepted: post.acceptedCommentId === comment.id,
        createdAt: comment.createdAt,
        editedAt: comment.editedAt,
        canEdit: isAuthor && comment.status === 'published',
        canModerate,
        replies: [],
      };
    });
  }

  /** Aperçu du fil : les 2 derniers commentaires publiés de chaque publication. */
  private async previewComments(postIds: string[], viewer: User | null) {
    const map = new Map<string, CommentView[]>();
    for (const postId of postIds) {
      const rows = await this.comments.find({
        where: { post: { id: postId }, status: 'published', parent: IsNull() },
        relations: { parent: true },
        order: { createdAt: 'DESC' },
        take: 2,
      });
      map.set(postId, await this.commentViews(rows.reverse(), { id: postId, acceptedCommentId: null }, viewer, false));
    }
    return map;
  }

  /**
   * Commentaires d'une discussion : ordre chronologique, réponse acceptée en tête, réponses (un niveau) sous leur parent.
   * Contenus retirés affichés comme tels ; supprimés sans réponse masqués.
   */
  async listComments(postId: string, viewer: User | null) {
    const post = await this.findPost(postId);
    await this.access.assertCanViewPost(post, viewer);
    const canModerate = await this.access.isModerator(viewer, post.community?.id);
    const rows = await this.comments.find({ where: { post: { id: postId } }, relations: { parent: true }, order: { createdAt: 'ASC' } });
    const views = await this.commentViews(rows, post, viewer, canModerate);
    const byId = new Map(views.map((v) => [v.id, v]));
    const roots: CommentView[] = [];
    for (const view of views) {
      const parent = view.parentId ? byId.get(view.parentId) : null;
      if (parent) parent.replies.push(view);
      else if (!view.parentId) roots.push(view);
    }
    const visible = roots.filter((root) => root.status !== 'deleted' || root.replies.length > 0);
    visible.sort((a, b) => Number(b.isAccepted) - Number(a.isAccepted) || a.createdAt.getTime() - b.createdAt.getTime());
    return visible;
  }

  async addComment(user: User, postId: string, dto: CreateCommentDto) {
    this.rateLimiter.hit(`comment:${user.id}`, 30, 10 * 60_000, 'Vous commentez trop rapidement. Réessayez dans quelques minutes.');
    const post = await this.findPost(postId);
    const membership = await this.access.assertCanViewPost(post, user);
    if (post.status !== 'published') throw new BadRequestException('Cette publication ne reçoit plus de commentaires.');
    if (!this.access.canParticipate(post.community, membership, user)) {
      throw new ForbiddenException('Rejoignez la communauté pour participer à cette discussion.');
    }
    const canModerate = await this.access.isModerator(user, post.community?.id);
    if ((post.locked || post.questionStatus === 'closed') && !canModerate) {
      throw new ForbiddenException(post.locked ? 'Discussion verrouillée par la modération.' : 'Cette question est fermée.');
    }
    if (await this.access.isBlockedBetween(user.id, post.author.id)) throw new ForbiddenException('Action impossible avec ce membre.');

    let parent: PostComment | null = null;
    if (dto.parentId) {
      parent = await this.comments.findOne({ where: { id: dto.parentId, post: { id: postId } }, relations: { parent: true } });
      if (!parent || parent.status !== 'published') throw new BadRequestException('Commentaire parent introuvable.');
      // Un seul niveau d'imbrication : une réponse à une réponse est rattachée au commentaire d'origine.
      if (parent.parent) parent = await this.comments.findOneOrFail({ where: { id: parent.parent.id } });
    }

    const comment = await this.comments.save(
      this.comments.create({ post: { id: postId } as CommunityPost, author: { id: user.id } as User, parent, text: dto.text.trim() }),
    );
    post.commentsCount = await this.comments.count({ where: { post: { id: postId }, status: 'published' } });
    if (!post.firstResponseAt && user.id !== post.author.id) post.firstResponseAt = new Date();
    await this.posts.save(post);
    await this.follows.save(this.follows.create({ follower: { id: user.id } as User, targetType: 'post', targetId: post.id })).catch(() => undefined);
    await this.activity.record('comment_created', user.id, { type: 'post', id: post.id });

    // Notifications (sans doublon : réponse > commentaire > suivi > mention), uniquement aux membres ayant encore accès.
    const notified = new Set<string>([user.id]);
    const allowed = new Set(await this.notifier.filterPostAudience(post, [post.author.id, parent?.author.id].filter((id): id is string => !!id)));
    if (parent && !allowed.has(parent.author.id)) notified.add(parent.author.id);
    if (!allowed.has(post.author.id)) notified.add(post.author.id);
    const subject = post.title ? `« ${post.title} »` : 'votre publication';
    if (parent && !notified.has(parent.author.id)) {
      await this.notifier.send([parent.author.id], 'comment_reply', { title: `${user.fullName} a répondu à votre commentaire`, body: truncate(dto.text) }, postTarget(post), user.id);
      notified.add(parent.author.id);
    }
    if (!notified.has(post.author.id)) {
      await this.notifier.send(
        [post.author.id],
        post.type === 'question' ? 'question_reply' : 'post_comment',
        {
          title: post.type === 'question' ? `Nouvelle réponse à votre question` : `${user.fullName} a commenté votre publication`,
          body: post.type === 'question' ? `${user.fullName} a répondu à ${subject}.` : truncate(dto.text),
        },
        postTarget(post),
        user.id,
      );
      notified.add(post.author.id);
    }
    const followers = (await this.follows.find({ where: { targetType: 'post', targetId: post.id }, relations: { follower: true } }))
      .map((f) => f.follower.id)
      .filter((id) => !notified.has(id));
    const audience = await this.notifier.filterPostAudience(post, followers);
    await this.notifier.send(audience, 'followed_activity', { title: 'Nouvelle activité dans une discussion suivie', body: `${user.fullName} a commenté ${post.title ? `« ${post.title} »` : 'une publication'}.` }, postTarget(post), user.id);
    audience.forEach((id) => notified.add(id));
    await this.notifier.notifyMentions(dto.text, post, user, [...notified]);

    const [view] = await this.commentViews([{ ...comment, author: user, parent } as PostComment], post, user, canModerate);
    return { comment: view, commentsCount: post.commentsCount };
  }

  async updateComment(user: User, commentId: string, text: string) {
    const comment = await this.findComment(commentId);
    if (comment.author.id !== user.id) throw new ForbiddenException('Vous ne pouvez modifier que vos propres commentaires.');
    if (comment.status !== 'published') throw new BadRequestException('Ce commentaire ne peut plus être modifié.');
    comment.text = text.trim();
    comment.editedAt = new Date();
    await this.comments.save(comment);
    return { id: comment.id, text: comment.text, editedAt: comment.editedAt };
  }

  async removeComment(user: User, commentId: string) {
    const comment = await this.findComment(commentId);
    if (comment.author.id !== user.id) throw new ForbiddenException('Vous ne pouvez supprimer que vos propres commentaires.');
    comment.status = 'deleted';
    await this.comments.save(comment);
    await this.afterCommentHidden(comment);
    return { success: true };
  }

  /** Recalcule les compteurs et rouvre la question si la réponse acceptée disparaît. */
  async afterCommentHidden(comment: PostComment) {
    const post = await this.findPost(comment.post.id);
    post.commentsCount = await this.comments.count({ where: { post: { id: post.id }, status: 'published' } });
    if (post.acceptedCommentId === comment.id) {
      post.acceptedCommentId = null;
      if (post.questionStatus === 'answered') post.questionStatus = 'open';
    }
    await this.posts.save(post);
  }

  // ==========================================================================
  // Réactions, favoris, suivi de discussion
  // ==========================================================================

  async toggleReaction(user: User, targetType: 'post' | 'comment', targetId: string) {
    const post = targetType === 'post' ? await this.findPost(targetId) : (await this.findComment(targetId)).post;
    const fullPost = targetType === 'post' ? post : await this.findPost(post.id);
    const membership = await this.access.assertCanViewPost(fullPost, user);
    if (!this.access.canParticipate(fullPost.community, membership, user) || fullPost.status !== 'published') {
      throw new ForbiddenException('Rejoignez la communauté pour réagir.');
    }
    if (targetType === 'comment') {
      const comment = await this.findComment(targetId);
      if (comment.status !== 'published') throw new BadRequestException('Ce commentaire n’est plus disponible.');
    }
    const existing = await this.reactions.findOne({ where: { user: { id: user.id }, targetType, targetId, reactionType: 'like' } });
    if (existing) {
      await this.reactions.remove(existing);
    } else {
      // La contrainte unique (membre, cible, type) empêche tout doublon, même en cas de double clic.
      await this.reactions.insert({ user: { id: user.id } as User, targetType, targetId, reactionType: 'like' }).catch(() => undefined);
    }
    const likes = await this.reactions.count({ where: { targetType, targetId, reactionType: 'like' } });
    if (targetType === 'post') await this.posts.update(targetId, { likesCount: likes });
    else await this.comments.update(targetId, { likesCount: likes });
    return { liked: !existing, likes };
  }

  async toggleBookmark(user: User, postId: string) {
    const post = await this.findPost(postId);
    await this.access.assertCanViewPost(post, user);
    const existing = await this.bookmarks.findOne({ where: { post: { id: postId }, user: { id: user.id } } });
    if (existing) await this.bookmarks.remove(existing);
    else await this.bookmarks.save(this.bookmarks.create({ post: { id: postId } as CommunityPost, user: { id: user.id } as User }));
    return { bookmarked: !existing };
  }

  async toggleFollowPost(user: User, postId: string) {
    const post = await this.findPost(postId);
    await this.access.assertCanViewPost(post, user);
    const existing = await this.follows.findOne({ where: { follower: { id: user.id }, targetType: 'post', targetId: postId } });
    if (existing) await this.follows.remove(existing);
    else await this.follows.save(this.follows.create({ follower: { id: user.id } as User, targetType: 'post', targetId: postId }));
    return { following: !existing };
  }

  /** Publications enregistrées encore accessibles (espace membre). */
  async listBookmarks(user: User) {
    const rows = await this.bookmarks.find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } });
    const visible: CommunityPost[] = [];
    for (const row of rows) {
      const ok = await this.access.assertCanViewPost(row.post, user).then(() => row.post.status === 'published').catch(() => false);
      if (ok) visible.push(row.post);
    }
    return this.presentPosts(visible, user, { preview: false });
  }

  // ==========================================================================
  // Pièces jointes
  // ==========================================================================

  async upload(user: User, file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    this.rateLimiter.hit(`upload:${user.id}`, 30, 60 * 60_000);
    const rule = ALLOWED_FILES[file.mimetype];
    const ext = extname(file.originalname).toLowerCase();
    if (!rule || !rule.ext.includes(ext)) {
      throw new BadRequestException('Format non accepté : images JPG, PNG, WEBP, GIF ou documents PDF, DOCX, XLSX.');
    }
    if (file.size > MAX_ATTACHMENT_SIZE) throw new BadRequestException('Fichier trop volumineux (5 Mo maximum).');
    if (rule.magic && !rule.magic.some((sig) => sig.every((byte, i) => file.buffer[i] === byte))) {
      throw new BadRequestException('Le contenu du fichier ne correspond pas à son format.');
    }
    await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
    const storageName = `${randomUUID()}${ext}`;
    await fs.writeFile(join(ATTACHMENTS_DIR, storageName), file.buffer);
    const attachment = await this.attachments.save(
      this.attachments.create({
        owner: { id: user.id } as User,
        originalName: file.originalname.slice(0, 200),
        mime: file.mimetype,
        size: file.size,
        storagePath: storageName,
      }),
    );
    return { id: attachment.id, name: attachment.originalName, mime: attachment.mime, size: attachment.size, kind: rule.kind } satisfies AttachmentRef;
  }

  private async claimAttachments(user: User, ids: string[], postId: string | null): Promise<AttachmentRef[]> {
    if (ids.length === 0) return [];
    const rows = await this.attachments.find({ where: { id: In(ids) }, relations: { owner: true } });
    if (rows.length !== ids.length || rows.some((r) => r.owner.id !== user.id || (r.postId && r.postId !== postId))) {
      throw new BadRequestException('Pièce jointe invalide.');
    }
    return rows.map((r) => ({ id: r.id, name: r.originalName, mime: r.mime, size: r.size, kind: ALLOWED_FILES[r.mime]?.kind ?? 'file' }));
  }

  /** Fichier servi uniquement si le visiteur peut lire la publication (ou s'il en est le propriétaire avant publication). */
  async attachmentFile(id: string, viewer: User | null) {
    const attachment = await this.attachments.findOne({ where: { id }, relations: { owner: true } });
    if (!attachment) throw new NotFoundException('Fichier introuvable.');
    if (attachment.postId) {
      const post = await this.findPost(attachment.postId);
      await this.access.assertCanViewPost(post, viewer);
    } else if (attachment.owner.id !== viewer?.id) {
      throw new NotFoundException('Fichier introuvable.');
    }
    return { path: join(ATTACHMENTS_DIR, attachment.storagePath), mime: attachment.mime, name: attachment.originalName };
  }
}

function cleanTags(tags: string[] | undefined) {
  return [...new Set((tags ?? []).map((t) => t.trim()).filter(Boolean))].slice(0, 5);
}

function truncate(text: string, length = 120) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
}
