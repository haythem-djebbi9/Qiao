import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { matchesQuery, normalize } from '../../common/text';
import { ActivityService, AuditService, RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { CommunityAccessService } from './community-access.service';
import { CommunityNotifier } from './community-notifier.service';
import {
  Community,
  CommunityCategory,
  CommunityMembership,
  CommunityPost,
  ExpertProfile,
  MemberProfile,
  MembershipStatus,
  ProfessionalCategory,
} from './community.entities';
import { CommunitiesQueryDto, CommunityMembersQueryDto, InviteMemberDto, MemberActionDto } from './community.dto';
import { ProfilesService } from './profiles.service';

/** État d'adhésion présenté à l'interface (identique partout : cartes, page, recherche). */
export type MembershipState = 'none' | MembershipStatus;

const communityTarget = (community: Community) => ({
  type: 'community' as const,
  id: community.id,
  link: `community/c/${community.slug}`,
});

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectRepository(Community) private readonly communities: Repository<Community>,
    @InjectRepository(CommunityMembership) private readonly memberships: Repository<CommunityMembership>,
    @InjectRepository(CommunityCategory) private readonly categories: Repository<CommunityCategory>,
    @InjectRepository(ProfessionalCategory) private readonly professionalCategories: Repository<ProfessionalCategory>,
    @InjectRepository(CommunityPost) private readonly posts: Repository<CommunityPost>,
    @InjectRepository(MemberProfile) private readonly profiles: Repository<MemberProfile>,
    @InjectRepository(ExpertProfile) private readonly experts: Repository<ExpertProfile>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly access: CommunityAccessService,
    private readonly notifier: CommunityNotifier,
    private readonly profilesService: ProfilesService,
    private readonly activity: ActivityService,
    private readonly audit: AuditService,
    private readonly rateLimiter: RateLimiter,
  ) {}

  // --- Présentation ------------------------------------------------------------------

  present(community: Community, membership: CommunityMembership | null | undefined, user: User | null) {
    return {
      id: community.id,
      slug: community.slug,
      name: community.name,
      description: community.description,
      category: community.category ? { id: community.category.id, name: community.category.name } : null,
      coverImage: community.coverImage,
      icon: community.icon,
      languages: community.languages,
      scope: community.scope,
      visibility: community.visibility,
      membershipPolicy: community.membershipPolicy,
      status: community.status,
      featured: community.featured,
      membersCount: community.membersCount,
      postsCount: community.postsCount,
      createdAt: community.createdAt,
      membership: {
        state: (membership?.status ?? 'none') as MembershipState,
        role: membership?.status === 'active' ? membership.role : null,
      },
      canViewContent: this.access.canViewContent(community, membership, user),
      canPublish: this.access.canPublish(community, membership, user),
    };
  }

  async categoriesList() {
    const [communityCategories, professionalCategories] = await Promise.all([
      this.categories.find({ where: { active: true }, order: { sortOrder: 'ASC', name: 'ASC' } }),
      this.professionalCategories.find({ where: { active: true }, order: { sortOrder: 'ASC', name: 'ASC' } }),
    ]);
    return { communityCategories, professionalCategories };
  }

  // --- Répertoire -------------------------------------------------------------------------

  async list(query: CommunitiesQueryDto, user: User | null) {
    const all = await this.communities.find({ where: { status: 'active' }, order: { featured: 'DESC', sortOrder: 'ASC', name: 'ASC' } });
    const memberships = await this.access.membershipsByCommunity(user, all.map((c) => c.id));
    const filtered = all.filter((community) => {
      const membership = memberships.get(community.id);
      if (!this.access.canDiscover(community, membership, user)) return false;
      if (query.scope === 'joined' && membership?.status !== 'active') return false;
      if (query.scope === 'featured' && !community.featured) return false;
      if (query.category && community.category?.id !== query.category) return false;
      if (query.language && !community.languages.includes(query.language)) return false;
      return matchesQuery(query.q, community.name, community.description, community.scope, community.category?.name);
    });
    const page = query.page ?? 1;
    const limit = query.limit ?? 24;
    return {
      total: filtered.length,
      page,
      items: filtered.slice((page - 1) * limit, page * limit).map((c) => this.present(c, memberships.get(c.id), user)),
    };
  }

  /**
   * Communautés recommandées : non rejointes, découvrables. Score déterministe :
   * +3 si la catégorie correspond à un secteur / intérêt du membre, +1 par langue commune,
   * +1 mise en avant éditoriale, puis nombre de membres.
   */
  async recommended(user: User | null, limit = 6) {
    const all = await this.communities.find({ where: { status: 'active' } });
    const memberships = await this.access.membershipsByCommunity(user, all.map((c) => c.id));
    const profile = user ? await this.profilesService.ensureProfile(user.id) : null;
    const interests = [...(profile?.sectors ?? []), ...(profile?.interests ?? [])].map(normalize);
    const languages = new Set(profile?.languages ?? []);
    return all
      .filter((c) => this.access.canDiscover(c, memberships.get(c.id), user) && c.visibility !== 'private')
      .filter((c) => !['active', 'pending', 'banned'].includes(memberships.get(c.id)?.status ?? ''))
      .map((c) => {
        const haystack = normalize(`${c.category?.id} ${c.category?.name} ${c.name}`);
        const categoryMatch = interests.some((i) => i && haystack.includes(i));
        const score = (categoryMatch ? 3 : 0) + c.languages.filter((l) => languages.has(l)).length + (c.featured ? 1 : 0);
        return { c, score };
      })
      .sort((a, b) => b.score - a.score || b.c.membersCount - a.c.membersCount || a.c.name.localeCompare(b.c.name))
      .slice(0, limit)
      .map(({ c }) => this.present(c, memberships.get(c.id), user));
  }

  async detail(slug: string, user: User | null) {
    const { community, membership } = await this.access.findDiscoverable(slug, user);
    const canViewContent = this.access.canViewContent(community, membership, user);
    const moderatorRows = await this.memberships.find({
      where: { community: { id: community.id }, status: 'active', role: 'moderator' },
      relations: { user: true },
    });
    const moderators = await this.profilesService.summaries(moderatorRows.map((m) => m.user.id), user);
    const isModerator = await this.access.isModerator(user, community.id);
    const pendingRequests = isModerator
      ? await this.memberships.count({ where: { community: { id: community.id }, status: 'pending' } })
      : 0;
    return {
      ...this.present(community, membership, user),
      rules: community.rules,
      moderators: [...moderators.values()],
      isModerator,
      pendingRequests,
      canViewContent,
    };
  }

  // --- Adhésion -----------------------------------------------------------------------------

  /**
   * Rejoindre : libre → actif ; sur validation → demande en attente ; sur invitation → refus sauf invitation.
   * Une exclusion (banned) interdit toute nouvelle demande ; un retrait (removed) impose une validation.
   */
  async join(slug: string, user: User, message?: string) {
    const { community, membership } = await this.access.findDiscoverable(slug, user);
    if (community.status === 'archived') throw new BadRequestException('Cette communauté est archivée.');
    this.rateLimiter.hit(`join:${user.id}`, 30, 60 * 60_000);

    const status = membership?.status;
    if (status === 'active') return this.membershipResult(community, membership!, user);
    if (status === 'pending') throw new BadRequestException('Votre demande est déjà en attente de validation.');
    if (status === 'banned') throw new ForbiddenException('Vous ne pouvez plus rejoindre cette communauté (exclusion par la modération).');

    let next: MembershipStatus;
    if (status === 'invited') next = 'active';
    else if (community.membershipPolicy === 'invite') throw new ForbiddenException('Cette communauté est accessible uniquement sur invitation.');
    else if (community.membershipPolicy === 'approval' || status === 'removed') next = 'pending';
    else next = 'active';

    const row = membership ?? this.memberships.create({ user: { id: user.id } as User, community: { id: community.id } as Community, role: 'member' });
    row.status = next;
    row.requestMessage = next === 'pending' ? message?.trim() || null : row.requestMessage;
    row.joinedAt = next === 'active' ? new Date() : row.joinedAt;
    row.decidedBy = null;
    row.decidedAt = null;
    const saved = await this.memberships.save(row);

    if (next === 'active') {
      await this.refreshCounts(community.id);
      await this.activity.record('membership_joined', user.id, { type: 'community', id: community.id });
    } else {
      const moderators = await this.moderatorIds(community.id);
      await this.notifier.send(
        moderators,
        'membership_request',
        { title: `Demande d'adhésion : ${community.name}`, body: `${user.fullName} souhaite rejoindre la communauté.` },
        { type: 'community', id: community.id, link: `community/c/${community.slug}/requests` },
        user.id,
      );
    }
    return this.membershipResult(await this.reload(community.id), saved, user);
  }

  /** Quitter (ou annuler une demande / refuser une invitation). Les contenus publiés sont conservés. */
  async leave(slug: string, user: User) {
    const { community, membership } = await this.access.findDiscoverable(slug, user);
    if (!membership || !['active', 'pending', 'invited'].includes(membership.status)) {
      throw new BadRequestException("Vous n'êtes pas membre de cette communauté.");
    }
    membership.status = 'left';
    membership.role = 'member';
    await this.memberships.save(membership);
    await this.refreshCounts(community.id);
    return this.membershipResult(await this.reload(community.id), membership, user);
  }

  private async membershipResult(community: Community, membership: CommunityMembership, user: User) {
    return this.present(community, membership, user);
  }

  private async reload(id: string) {
    return this.communities.findOneOrFail({ where: { id } });
  }

  async refreshCounts(communityId: string) {
    const [membersCount, postsCount] = await Promise.all([
      this.memberships.count({ where: { community: { id: communityId }, status: 'active' } }),
      this.posts.count({ where: { community: { id: communityId }, status: 'published' } }),
    ]);
    await this.communities.update(communityId, { membersCount, postsCount });
  }

  async moderatorIds(communityId: string) {
    const [moderators, admins] = await Promise.all([
      this.memberships.find({ where: { community: { id: communityId }, status: 'active', role: 'moderator' }, relations: { user: true } }),
      this.users.find({ where: { role: 'admin', status: 'active' } }),
    ]);
    return [...new Set([...moderators.map((m) => m.user.id), ...admins.map((a) => a.id)])];
  }

  // --- Membres & modération des adhésions ----------------------------------------------------

  async members(slug: string, query: CommunityMembersQueryDto, user: User | null) {
    const { community, membership } = await this.access.findDiscoverable(slug, user);
    if (!this.access.canViewContent(community, membership, user)) {
      throw new ForbiddenException('La liste des membres est réservée aux membres de la communauté.');
    }
    const status = query.status ?? 'active';
    if (status !== 'active') await this.access.assertModerator(user!, community.id);
    const rows = await this.memberships.find({
      where: { community: { id: community.id }, status: status as MembershipStatus },
      relations: { user: true },
      order: { role: 'DESC', joinedAt: 'ASC', createdAt: 'ASC' },
    });
    const visibleRows = rows.filter((r) => r.user.status === 'active' || status !== 'active');
    const filtered = visibleRows.filter((r) => matchesQuery(query.q, r.user.fullName, r.user.handle));
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const slice = filtered.slice((page - 1) * limit, page * limit);
    const summaries = await this.profilesService.summaries(slice.map((r) => r.user.id), user);
    return {
      total: filtered.length,
      page,
      items: slice.map((row) => ({
        membershipId: row.id,
        status: row.status,
        role: row.role,
        joinedAt: row.joinedAt,
        requestedAt: row.updatedAt,
        requestMessage: status === 'pending' ? row.requestMessage : null,
        member: summaries.get(row.user.id),
      })),
    };
  }

  async decide(slug: string, membershipId: string, decision: 'approve' | 'reject', moderator: User) {
    const { community } = await this.access.findDiscoverable(slug, moderator);
    await this.access.assertModerator(moderator, community.id);
    const membership = await this.memberships.findOne({
      where: { id: membershipId, community: { id: community.id } },
      relations: { user: true },
    });
    if (!membership || membership.status !== 'pending') throw new NotFoundException('Demande introuvable ou déjà traitée.');
    membership.status = decision === 'approve' ? 'active' : 'rejected';
    membership.decidedBy = { id: moderator.id } as User;
    membership.decidedAt = new Date();
    if (decision === 'approve') membership.joinedAt = new Date();
    await this.memberships.save(membership);
    await this.refreshCounts(community.id);
    if (decision === 'approve') await this.activity.record('membership_joined', membership.user.id, { type: 'community', id: community.id });
    await this.notifier.send(
      [membership.user.id],
      'membership_decision',
      decision === 'approve'
        ? { title: `Bienvenue dans ${community.name}`, body: 'Votre demande a été acceptée : vous avez accès aux discussions réservées aux membres.' }
        : { title: `Demande non retenue : ${community.name}`, body: "Les modérateurs n'ont pas accepté votre demande d'adhésion." },
      communityTarget(community),
    );
    return { id: membership.id, status: membership.status };
  }

  async invite(slug: string, dto: InviteMemberDto, moderator: User) {
    const { community } = await this.access.findDiscoverable(slug, moderator);
    await this.access.assertModerator(moderator, community.id);
    const key = dto.member.trim().replace(/^@/, '').toLowerCase();
    const invitee = await this.users.findOne({ where: [{ handle: key }, { email: key }] });
    if (!invitee || invitee.status !== 'active') throw new NotFoundException('Aucun membre actif ne correspond à cet identifiant ou e-mail.');
    const existing = await this.access.membership(invitee, community.id);
    if (existing?.status === 'active') throw new BadRequestException('Ce membre fait déjà partie de la communauté.');
    if (existing?.status === 'banned') throw new BadRequestException('Ce membre a été exclu de la communauté.');
    const row = existing ?? this.memberships.create({ user: { id: invitee.id } as User, community: { id: community.id } as Community, role: 'member' });
    row.status = 'invited';
    row.invitedBy = { id: moderator.id } as User;
    await this.memberships.save(row);
    await this.notifier.send(
      [invitee.id],
      'invitation',
      { title: `Invitation : ${community.name}`, body: `${moderator.fullName} vous invite à rejoindre cette communauté.` },
      communityTarget(community),
      moderator.id,
    );
    return { invited: invitee.fullName };
  }

  /** Actions d'un modérateur sur un membre : retirer, exclure, réintégrer, nommer / retirer modérateur. */
  async memberAction(slug: string, membershipId: string, dto: MemberActionDto, moderator: User) {
    const { community } = await this.access.findDiscoverable(slug, moderator);
    await this.access.assertModerator(moderator, community.id);
    const membership = await this.memberships.findOne({ where: { id: membershipId, community: { id: community.id } }, relations: { user: true } });
    if (!membership) throw new NotFoundException('Membre introuvable.');
    if (membership.user.id === moderator.id && ['remove', 'ban', 'demote'].includes(dto.action)) {
      throw new BadRequestException('Utilisez « Quitter » pour vous retirer vous-même.');
    }
    if (['promote', 'demote'].includes(dto.action) && moderator.role !== 'admin') {
      throw new ForbiddenException('Seuls les administrateurs QIAO attribuent le rôle de modérateur.');
    }
    switch (dto.action) {
      case 'remove':
        membership.status = 'removed';
        membership.role = 'member';
        break;
      case 'ban':
        membership.status = 'banned';
        membership.role = 'member';
        break;
      case 'unban':
        membership.status = 'left';
        break;
      case 'promote':
        if (membership.status !== 'active') throw new BadRequestException('Seul un membre actif peut devenir modérateur.');
        membership.role = 'moderator';
        break;
      case 'demote':
        membership.role = 'member';
        break;
    }
    membership.decidedBy = { id: moderator.id } as User;
    membership.decidedAt = new Date();
    await this.memberships.save(membership);
    await this.refreshCounts(community.id);
    await this.audit.log(moderator, `membership.${dto.action}`, { type: 'member', id: membership.user.id, label: membership.user.fullName }, {
      community: community.slug,
      reason: dto.reason ?? null,
    });
    if (['remove', 'ban'].includes(dto.action)) {
      await this.notifier.send(
        [membership.user.id],
        'moderation',
        {
          title: dto.action === 'ban' ? `Exclusion de ${community.name}` : `Retrait de ${community.name}`,
          body: dto.reason ? `Motif : ${dto.reason}` : 'Décision de la modération de la communauté.',
        },
        communityTarget(community),
      );
    }
    return { id: membership.id, status: membership.status, role: membership.role };
  }

  // --- Statistiques publiques ---------------------------------------------------------------

  async stats() {
    const [members, countries, companies, experts, communities] = await Promise.all([
      this.users.count({ where: { status: 'active' } }),
      this.profiles
        .createQueryBuilder('p')
        .select('COUNT(DISTINCT lower(p.country))', 'count')
        .where('p.country IS NOT NULL')
        .getRawOne<{ count: string }>(),
      this.users.createQueryBuilder('u').select('COUNT(DISTINCT lower(u.company))', 'count').where('u.company IS NOT NULL').getRawOne<{ count: string }>(),
      this.experts.count({ where: { listed: true } }),
      this.communities.count({ where: { status: 'active', visibility: In(['public', 'restricted']) } }),
    ]);
    return {
      members,
      countries: Number(countries?.count ?? 0),
      companies: Number(companies?.count ?? 0),
      experts,
      communities,
    };
  }
}
