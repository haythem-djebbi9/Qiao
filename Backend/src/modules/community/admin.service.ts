import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { normalize, slugify, sqlUnaccent } from '../../common/text';
import { ActivityEvent } from '../platform/platform.entities';
import { AuditService } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { CommunityNotifier } from './community-notifier.service';
import {
  Community,
  CommunityCategory,
  CommunityMembership,
  CommunityPost,
  ExpertProfile,
  ProfessionalCategory,
} from './community.entities';
import {
  AccountStatusDto,
  AdminMembersQueryDto,
  AuditQueryDto,
  CategoryDto,
  CommunityAdminDto,
  VerificationDecisionDto,
} from './community.dto';
import { CommunitiesService } from './communities.service';
import { ModerationService } from './moderation.service';
import { ProfilesService } from './profiles.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Community) private readonly communities: Repository<Community>,
    @InjectRepository(CommunityCategory) private readonly communityCategories: Repository<CommunityCategory>,
    @InjectRepository(ProfessionalCategory) private readonly professionalCategories: Repository<ProfessionalCategory>,
    @InjectRepository(CommunityMembership) private readonly memberships: Repository<CommunityMembership>,
    @InjectRepository(CommunityPost) private readonly posts: Repository<CommunityPost>,
    @InjectRepository(ExpertProfile) private readonly experts: Repository<ExpertProfile>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly communitiesService: CommunitiesService,
    private readonly moderation: ModerationService,
    private readonly profiles: ProfilesService,
    private readonly notifier: CommunityNotifier,
    private readonly audit: AuditService,
  ) {}

  // --- Catégories --------------------------------------------------------------------------

  async categories() {
    const [communityCategories, professionalCategories] = await Promise.all([
      this.communityCategories.find({ order: { sortOrder: 'ASC', name: 'ASC' } }),
      this.professionalCategories.find({ order: { sortOrder: 'ASC', name: 'ASC' } }),
    ]);
    return { communityCategories, professionalCategories };
  }

  async saveCategory(admin: User, kind: 'community' | 'professional', dto: CategoryDto) {
    const repository = kind === 'community' ? this.communityCategories : this.professionalCategories;
    const existing = await repository.findOne({ where: { id: dto.id } });
    const saved = await repository.save({ ...(existing ?? {}), id: dto.id, name: dto.name.trim(), sortOrder: dto.sortOrder ?? existing?.sortOrder ?? 99, active: dto.active ?? true });
    await this.audit.log(admin, existing ? 'category.update' : 'category.create', { type: `${kind}-category`, id: saved.id, label: saved.name });
    return this.categories();
  }

  async deleteCategory(admin: User, kind: 'community' | 'professional', id: string) {
    const repository = kind === 'community' ? this.communityCategories : this.professionalCategories;
    const category = await repository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Catégorie introuvable.');
    const used =
      kind === 'community'
        ? await this.communities.count({ where: { category: { id } } })
        : (await this.posts.count({ where: { professionalCategory: { id } } })) +
          (await this.experts.createQueryBuilder('e').where(":id = ANY(string_to_array(e.categories, ','))", { id }).getCount());
    if (used > 0) {
      // Catégorie utilisée : désactivée (masquée des formulaires) plutôt que supprimée.
      category.active = false;
      await repository.save(category);
      await this.audit.log(admin, 'category.deactivate', { type: `${kind}-category`, id, label: category.name });
    } else {
      await repository.delete(id);
      await this.audit.log(admin, 'category.delete', { type: `${kind}-category`, id, label: category.name });
    }
    return this.categories();
  }

  // --- Communautés -------------------------------------------------------------------------

  async listCommunities(admin: User) {
    const rows = await this.communities.find({ order: { status: 'ASC', sortOrder: 'ASC', name: 'ASC' } });
    const moderators = await this.memberships.find({
      where: { community: { id: In(rows.map((r) => r.id).concat('00000000-0000-0000-0000-000000000000')) }, status: 'active', role: 'moderator' },
      relations: { community: true, user: true },
    });
    return rows.map((community) => ({
      ...this.communitiesService.present(community, null, admin),
      rules: community.rules,
      moderators: moderators
        .filter((m) => m.community.id === community.id)
        .map((m) => ({ membershipId: m.id, id: m.user.id, fullName: m.user.fullName, handle: m.user.handle })),
    }));
  }

  private validatePolicy(dto: CommunityAdminDto) {
    if (dto.visibility === 'private' && dto.membershipPolicy !== 'invite') {
      throw new BadRequestException('Une communauté privée est accessible uniquement sur invitation.');
    }
  }

  private async category(id: string | undefined) {
    if (!id) return null;
    const category = await this.communityCategories.findOne({ where: { id } });
    if (!category) throw new BadRequestException('Catégorie inconnue.');
    return category;
  }

  async createCommunity(admin: User, dto: CommunityAdminDto) {
    this.validatePolicy(dto);
    const slug = dto.slug ?? slugify(dto.name).slice(0, 78);
    if (await this.communities.exist({ where: { slug } })) throw new ConflictException('Une communauté utilise déjà cette adresse.');
    const community = await this.communities.save(
      this.communities.create({
        slug,
        name: dto.name.trim(),
        description: dto.description.trim(),
        rules: dto.rules?.trim() || null,
        category: await this.category(dto.categoryId),
        coverImage: dto.coverImage?.trim() || null,
        icon: dto.icon ?? 'Users',
        languages: dto.languages.length ? dto.languages : ['fr'],
        scope: dto.scope?.trim() || null,
        visibility: dto.visibility,
        membershipPolicy: dto.membershipPolicy,
        featured: dto.featured ?? false,
        createdBy: { id: admin.id } as User,
        sortOrder: 99,
      }),
    );
    await this.audit.log(admin, 'community.create', { type: 'community', id: community.id, label: community.name }, { visibility: dto.visibility, membershipPolicy: dto.membershipPolicy });
    return community;
  }

  async updateCommunity(admin: User, id: string, dto: CommunityAdminDto) {
    this.validatePolicy(dto);
    const community = await this.communities.findOne({ where: { id } });
    if (!community) throw new NotFoundException('Communauté introuvable.');
    if (dto.slug && dto.slug !== community.slug && (await this.communities.exist({ where: { slug: dto.slug } }))) {
      throw new ConflictException('Une communauté utilise déjà cette adresse.');
    }
    const before = { visibility: community.visibility, membershipPolicy: community.membershipPolicy, name: community.name };
    Object.assign(community, {
      slug: dto.slug ?? community.slug,
      name: dto.name.trim(),
      description: dto.description.trim(),
      rules: dto.rules?.trim() || null,
      category: await this.category(dto.categoryId),
      coverImage: dto.coverImage?.trim() || null,
      icon: dto.icon ?? community.icon,
      languages: dto.languages.length ? dto.languages : community.languages,
      scope: dto.scope?.trim() || null,
      visibility: dto.visibility,
      membershipPolicy: dto.membershipPolicy,
      featured: dto.featured ?? community.featured,
    });
    await this.communities.save(community);
    await this.audit.log(admin, 'community.update', { type: 'community', id, label: community.name }, { before, after: { visibility: dto.visibility, membershipPolicy: dto.membershipPolicy, name: community.name } });
    return community;
  }

  async setCommunityStatus(admin: User, id: string, status: 'active' | 'archived') {
    const community = await this.communities.findOne({ where: { id } });
    if (!community) throw new NotFoundException('Communauté introuvable.');
    community.status = status;
    await this.communities.save(community);
    await this.audit.log(admin, status === 'archived' ? 'community.archive' : 'community.restore', { type: 'community', id, label: community.name });
    return community;
  }

  /** Suppression définitive uniquement pour une communauté sans publication ; sinon, archivage. */
  async deleteCommunity(admin: User, id: string) {
    const community = await this.communities.findOne({ where: { id } });
    if (!community) throw new NotFoundException('Communauté introuvable.');
    const posts = await this.posts.count({ where: { community: { id } } });
    if (posts > 0) throw new BadRequestException('Cette communauté contient des publications : archivez-la plutôt que de la supprimer.');
    await this.communities.delete(id);
    await this.audit.log(admin, 'community.delete', { type: 'community', id, label: community.name });
    return { success: true };
  }

  async assignModerator(admin: User, communityId: string, userId: string) {
    const [community, user] = await Promise.all([
      this.communities.findOne({ where: { id: communityId } }),
      this.users.findOne({ where: { id: userId } }),
    ]);
    if (!community || !user) throw new NotFoundException('Communauté ou membre introuvable.');
    if (user.status !== 'active') throw new BadRequestException('Ce compte est suspendu.');
    const membership =
      (await this.memberships.findOne({ where: { community: { id: communityId }, user: { id: userId } } })) ??
      this.memberships.create({ community: { id: communityId } as Community, user: { id: userId } as User });
    membership.status = 'active';
    membership.role = 'moderator';
    membership.joinedAt = membership.joinedAt ?? new Date();
    membership.decidedBy = { id: admin.id } as User;
    membership.decidedAt = new Date();
    await this.memberships.save(membership);
    await this.communitiesService.refreshCounts(communityId);
    await this.audit.log(admin, 'role.moderator.assign', { type: 'member', id: userId, label: user.fullName }, { community: community.slug });
    await this.notifier.send(
      [userId],
      'moderation',
      { title: `Vous êtes modérateur de ${community.name}`, body: 'Vous pouvez examiner les signalements et les demandes d’adhésion de cette communauté.' },
      { type: 'community', id: community.id, link: `community/c/${community.slug}` },
    );
    return this.listCommunities(admin);
  }

  async removeModerator(admin: User, communityId: string, userId: string) {
    const membership = await this.memberships.findOne({ where: { community: { id: communityId }, user: { id: userId } }, relations: { community: true, user: true } });
    if (!membership || membership.role !== 'moderator') throw new NotFoundException('Modérateur introuvable.');
    membership.role = 'member';
    await this.memberships.save(membership);
    await this.audit.log(admin, 'role.moderator.revoke', { type: 'member', id: userId, label: membership.user.fullName }, { community: membership.community.slug });
    return this.listCommunities(admin);
  }

  // --- Membres ------------------------------------------------------------------------------

  async members(query: AdminMembersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.users.createQueryBuilder('user').leftJoin(ExpertProfile, 'expert', 'expert.userId = user.id').orderBy('user.createdAt', 'DESC');
    if (query.q) {
      qb.andWhere(`(${sqlUnaccent('user.fullName')} LIKE :q OR lower(user.email) LIKE :q OR user.handle LIKE :q)`, { q: `%${normalize(query.q)}%` });
    }
    if (query.status) qb.andWhere('user.status = :status', { status: query.status });
    if (query.role) qb.andWhere('user.role = :role', { role: query.role });
    if (query.verification) qb.andWhere('expert.verificationStatus = :verification', { verification: query.verification });
    const [users, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    const experts = await this.experts.find({ where: { userId: In(users.map((u) => u.id).concat('00000000-0000-0000-0000-000000000000')) } });
    const expertById = new Map(experts.map((e) => [e.userId, e]));
    const moderatorRows = await this.memberships.find({
      where: { user: { id: In(users.map((u) => u.id).concat('00000000-0000-0000-0000-000000000000')) }, role: 'moderator', status: 'active' },
      relations: { user: true, community: true },
    });
    return {
      total,
      page,
      items: users.map((user) => {
        const expert = expertById.get(user.id);
        return {
          id: user.id,
          fullName: user.fullName,
          handle: user.handle,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
          status: user.status,
          suspendedUntil: user.suspendedUntil,
          suspensionReason: user.suspensionReason,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          expert: expert ? { headline: expert.headline, verificationStatus: expert.verificationStatus, categories: expert.categories } : null,
          moderates: moderatorRows.filter((m) => m.user.id === user.id).map((m) => m.community.name),
        };
      }),
    };
  }

  async setStatus(admin: User, userId: string, dto: AccountStatusDto) {
    const target = await this.users.findOne({ where: { id: userId } });
    if (!target) throw new NotFoundException('Membre introuvable.');
    await this.moderation.setAccountStatus(admin, target, dto.status, dto.days, dto.reason?.trim() || null);
    return { id: target.id, status: target.status, suspendedUntil: target.suspendedUntil };
  }

  async setRole(admin: User, userId: string, role: 'user' | 'admin') {
    if (userId === admin.id) throw new BadRequestException('Vous ne pouvez pas modifier votre propre rôle.');
    const target = await this.users.findOne({ where: { id: userId } });
    if (!target) throw new NotFoundException('Membre introuvable.');
    if (target.status !== 'active' && role === 'admin') throw new BadRequestException('Ce compte est suspendu.');
    const before = target.role;
    target.role = role;
    await this.users.save(target);
    await this.audit.log(admin, 'role.change', { type: 'member', id: target.id, label: target.fullName }, { before, after: role });
    return { id: target.id, role: target.role };
  }

  // --- Vérification des experts -----------------------------------------------------------------

  async verifications(status = 'pending') {
    const rows = await this.experts.find({
      where: status === 'all' ? {} : { verificationStatus: status as ExpertProfile['verificationStatus'] },
      relations: { user: true, verifiedBy: true },
      order: { verificationRequestedAt: 'ASC' },
    });
    const categoryRows = await this.professionalCategories.find();
    const name = new Map(categoryRows.map((c) => [c.id, c.name]));
    return rows.map((expert) => ({
      userId: expert.userId,
      fullName: expert.user.fullName,
      handle: expert.user.handle,
      email: expert.user.email,
      avatarUrl: expert.user.avatarUrl,
      headline: expert.headline,
      categories: expert.categories.map((id) => name.get(id) ?? id),
      evidence: expert.verificationEvidence,
      status: expert.verificationStatus,
      note: expert.verificationNote,
      requestedAt: expert.verificationRequestedAt,
      decidedAt: expert.verifiedAt,
      decidedBy: expert.verifiedBy?.fullName ?? null,
    }));
  }

  async decideVerification(admin: User, userId: string, dto: VerificationDecisionDto) {
    const expert = await this.experts.findOne({ where: { userId }, relations: { user: true } });
    if (!expert) throw new NotFoundException('Profil professionnel introuvable.');
    const before = expert.verificationStatus;
    expert.verificationStatus = dto.decision;
    expert.verificationNote = dto.note?.trim() || null;
    expert.verifiedBy = { id: admin.id } as User;
    expert.verifiedAt = new Date();
    await this.experts.save(expert);
    await this.audit.log(admin, `expert.${dto.decision === 'verified' ? 'verify' : dto.decision === 'rejected' ? 'reject' : 'reset'}`, { type: 'member', id: userId, label: expert.user.fullName }, { before, note: expert.verificationNote });
    await this.notifier.send(
      [userId],
      'expert_verification',
      dto.decision === 'verified'
        ? { title: 'Profil professionnel vérifié', body: 'Le badge « Vérifié par QIAO » apparaît désormais sur votre profil.' }
        : dto.decision === 'rejected'
          ? { title: 'Vérification non validée', body: expert.verificationNote ? `Motif : ${expert.verificationNote}` : 'Vos justificatifs n’ont pas permis de valider votre profil.' }
          : { title: 'Vérification réinitialisée', body: expert.verificationNote ?? 'Votre profil n’est plus marqué comme vérifié.' },
      { type: 'settings', id: userId, link: 'community/settings' },
    );
    return this.verifications('pending');
  }

  // --- Journal d'audit & statistiques ---------------------------------------------------------------

  auditLog(query: AuditQueryDto) {
    return this.audit.list({ page: query.page ?? 1, limit: query.limit ?? 30, action: query.action, targetType: query.targetType });
  }

  /** Indicateurs d'adoption (30 derniers jours sauf mention contraire). Aucun contenu privé n'est utilisé. */
  async analytics() {
    const events = this.dataSource.getRepository(ActivityEvent);
    const since = (days: number) => new Date(Date.now() - days * 86_400_000);
    const countEvents = (type: string, days = 30) =>
      events.createQueryBuilder('e').where('e.type = :type AND e.createdAt >= :since', { type, since: since(days) }).getCount();
    const distinctUsers = async (types: string[], from: Date, to?: Date) => {
      const qb = events
        .createQueryBuilder('e')
        .select('DISTINCT e.userId', 'userId')
        .where('e.type IN (:...types) AND e.userId IS NOT NULL AND e.createdAt >= :from', { types, from });
      if (to) qb.andWhere('e.createdAt < :to', { to });
      return new Set((await qb.getRawMany<{ userId: string }>()).map((r) => r.userId));
    };
    const activeTypes = ['community_visit', 'post_created', 'question_created', 'comment_created', 'membership_joined', 'contact_initiated'];

    const [totalUsers, visitors, monthlyActive, previousActive] = await Promise.all([
      this.users.count(),
      distinctUsers(['community_visit'], since(30)),
      distinctUsers(activeTypes, since(30)),
      distinctUsers(activeTypes, since(60), since(30)),
    ]);
    const retained = [...previousActive].filter((id) => monthlyActive.has(id)).length;

    const questionStats = await this.posts
      .createQueryBuilder('post')
      .select('COUNT(*)', 'total')
      .addSelect('COUNT(post.firstResponseAt)', 'answered')
      .addSelect(
        'percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("post"."firstResponseAt" - "post"."createdAt")))',
        'medianSeconds',
      )
      .where("post.type = 'question' AND post.status = 'published'")
      .getRawOne<{ total: string; answered: string; medianSeconds: string | null }>();

    const activeCommunities = await this.dataSource.query(
      `SELECT COUNT(DISTINCT p."communityId")::int AS count FROM community_posts p
       WHERE p."communityId" IS NOT NULL AND p.status = 'published' AND (
         p."createdAt" >= $1 OR EXISTS (SELECT 1 FROM community_comments c WHERE c."postId" = p.id AND c."createdAt" >= $1)
       )`,
      [since(30)],
    );

    const [newMemberships, posts, questions, comments, profileViews, contacts, reportsSubmitted, reportsResolved, authFailures, linkErrors] = await Promise.all([
      countEvents('membership_joined'),
      countEvents('post_created'),
      countEvents('question_created'),
      countEvents('comment_created'),
      countEvents('profile_view'),
      countEvents('contact_initiated'),
      countEvents('report_submitted'),
      countEvents('report_resolved'),
      countEvents('auth_failure'),
      countEvents('link_error'),
    ]);
    const [communities, experts, verifiedExperts] = await Promise.all([
      this.communities.count({ where: { status: 'active' } }),
      this.experts.count({ where: { listed: true } }),
      this.experts.count({ where: { listed: true, verificationStatus: 'verified' } }),
    ]);

    const totalQuestions = Number(questionStats?.total ?? 0);
    const answeredQuestions = Number(questionStats?.answered ?? 0);
    return {
      period: '30 derniers jours',
      totalUsers,
      communityVisitors: visitors.size,
      visitorRate: totalUsers ? Math.round((visitors.size / totalUsers) * 100) : 0,
      monthlyActiveMembers: monthlyActive.size,
      retentionRate: previousActive.size ? Math.round((retained / previousActive.size) * 100) : null,
      newMemberships,
      posts,
      questions,
      comments,
      questionsAllTime: totalQuestions,
      questionsAnsweredRate: totalQuestions ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      medianFirstResponseMinutes: questionStats?.medianSeconds ? Math.round(Number(questionStats.medianSeconds) / 60) : null,
      activeCommunities: activeCommunities[0]?.count ?? 0,
      communities,
      experts,
      verifiedExperts,
      expertProfileViews: profileViews,
      contactInitiations: contacts,
      reportsSubmitted,
      reportsResolved,
      authFailures,
      linkErrors,
    };
  }
}
