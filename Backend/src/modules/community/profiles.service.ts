import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { matchesQuery, normalize, sqlUnaccent } from '../../common/text';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService, RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { CommunityAccessService } from './community-access.service';
import { CommunityNotifier } from './community-notifier.service';
import {
  CommunityMembership,
  CommunityPost,
  DEFAULT_PRIVACY,
  ExpertProfile,
  FieldVisibility,
  Follow,
  MemberBlock,
  MemberProfile,
  ProfessionalCategory,
} from './community.entities';
import {
  ExpertProfileDto,
  ExpertsQueryDto,
  MembersQueryDto,
  NotificationPrefsDto,
  PrivacyDto,
  UpdateMemberProfileDto,
  VerificationRequestDto,
} from './community.dto';
import { NOTIFICATION_KINDS } from './community-notifier.service';

/** Résumé public d'un membre (cartes, auteurs de publications, commentaires). */
export interface MemberSummary {
  id: string;
  handle: string | null;
  fullName: string;
  headline: string | null;
  location: string | null;
  avatarUrl: string | null;
  isExpert: boolean;
  expertVerified: boolean;
  suspended: boolean;
}

const DEFAULT_LIMIT = 12;

/** Le champ est-il visible pour ce visiteur ? (propriétaire et administrateurs voient tout) */
function fieldVisible(visibility: FieldVisibility | undefined, viewer: User | null, isOwner: boolean) {
  if (isOwner || viewer?.role === 'admin') return true;
  if (visibility === 'public') return true;
  if (visibility === 'members') return !!viewer;
  return false;
}

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(MemberProfile) private readonly profiles: Repository<MemberProfile>,
    @InjectRepository(ExpertProfile) private readonly experts: Repository<ExpertProfile>,
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(MemberBlock) private readonly blocks: Repository<MemberBlock>,
    @InjectRepository(CommunityMembership) private readonly memberships: Repository<CommunityMembership>,
    @InjectRepository(CommunityPost) private readonly posts: Repository<CommunityPost>,
    @InjectRepository(ProfessionalCategory) private readonly categories: Repository<ProfessionalCategory>,
    private readonly access: CommunityAccessService,
    private readonly notifier: CommunityNotifier,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
    private readonly rateLimiter: RateLimiter,
  ) {}

  // --- Chargement ----------------------------------------------------------------------

  async ensureProfile(userId: string): Promise<MemberProfile> {
    const existing = await this.profiles.findOne({ where: { userId } });
    if (existing) return existing;
    await this.profiles.insert({ userId, privacy: DEFAULT_PRIVACY, notificationPrefs: {} }).catch(() => undefined);
    return this.profiles.findOneOrFail({ where: { userId } });
  }

  /** Résumés publics de plusieurs membres en une seule requête par table. */
  async summaries(userIds: string[], viewer: User | null): Promise<Map<string, MemberSummary>> {
    const ids = [...new Set(userIds.filter(Boolean))];
    const map = new Map<string, MemberSummary>();
    if (ids.length === 0) return map;
    const [users, profiles, experts] = await Promise.all([
      this.users.find({ where: { id: In(ids) } }),
      this.profiles.find({ where: { userId: In(ids) } }),
      this.experts.find({ where: { userId: In(ids) } }),
    ]);
    const profileById = new Map(profiles.map((p) => [p.userId, p]));
    const expertById = new Map(experts.map((e) => [e.userId, e]));
    for (const user of users) {
      map.set(user.id, this.summary(user, profileById.get(user.id), expertById.get(user.id), viewer));
    }
    return map;
  }

  summary(user: User, profile: MemberProfile | undefined, expert: ExpertProfile | undefined, viewer: User | null): MemberSummary {
    const privacy = { ...DEFAULT_PRIVACY, ...(profile?.privacy ?? {}) };
    const isOwner = viewer?.id === user.id;
    const location = [profile?.city, profile?.country].filter(Boolean).join(', ') || user.location;
    return {
      id: user.id,
      handle: user.handle,
      fullName: user.fullName,
      headline: profile?.headline || expert?.headline || user.title,
      location: fieldVisible(privacy.location, viewer, isOwner) ? location : null,
      avatarUrl: user.avatarUrl,
      isExpert: !!expert?.listed,
      expertVerified: expert?.verificationStatus === 'verified',
      suspended: user.status === 'suspended',
    };
  }

  async findByHandle(handle: string) {
    const user = await this.users.findOne({ where: { handle: handle.toLowerCase() } });
    if (!user) throw new NotFoundException('Membre introuvable.');
    return user;
  }

  private async categoryNames(ids: string[] | null | undefined) {
    if (!ids?.length) return [];
    const rows = await this.categories.find({ where: { id: In(ids) } });
    const byId = new Map(rows.map((c) => [c.id, c.name]));
    return ids.map((id) => ({ id, name: byId.get(id) ?? id }));
  }

  // --- Profil public -----------------------------------------------------------------

  async publicProfile(handle: string, viewer: User | null) {
    const user = await this.findByHandle(handle);
    const isOwner = viewer?.id === user.id;
    const isAdmin = viewer?.role === 'admin';
    const [profile, expert] = await Promise.all([
      this.ensureProfile(user.id),
      this.experts.findOne({ where: { userId: user.id } }),
    ]);
    const privacy = { ...DEFAULT_PRIVACY, ...profile.privacy };

    if (!isOwner && !isAdmin && viewer && (await this.blocks.exist({ where: { blocker: { id: user.id }, blocked: { id: viewer.id } } }))) {
      throw new NotFoundException('Membre introuvable.');
    }
    if (!isOwner && !isAdmin && privacy.profile === 'members' && !viewer) {
      throw new UnauthorizedException('Ce profil est visible uniquement par les membres connectés.');
    }

    const visible = (field: keyof typeof DEFAULT_PRIVACY) => fieldVisible(privacy[field] as FieldVisibility, viewer, isOwner);
    const summary = this.summary(user, profile, expert ?? undefined, viewer);

    if (viewer && !isOwner && expert?.listed) {
      await this.experts.increment({ userId: user.id }, 'profileViews', 1);
      await this.activity.record('profile_view', viewer.id, { type: 'member', id: user.id });
    }

    const [relationship, communities, postsCount] = await Promise.all([
      this.relationship(user, viewer, privacy.messages),
      visible('communities') ? this.publicCommunities(user, viewer) : Promise.resolve(null),
      this.posts.count({ where: { author: { id: user.id }, status: 'published' } }),
    ]);

    return {
      ...summary,
      bio: visible('bio') ? profile.bio : null,
      company: visible('company') ? user.company : null,
      country: visible('location') ? profile.country : null,
      city: visible('location') ? profile.city : null,
      languages: visible('languages') ? profile.languages ?? [] : null,
      sectors: await this.categoryNames(profile.sectors),
      interests: profile.interests ?? [],
      email: visible('email') ? user.email : null,
      memberSince: user.createdAt,
      showActivity: visible('activity'),
      expert: expert?.listed || (expert && isOwner)
        ? {
            headline: expert.headline,
            biography: expert.biography,
            categories: await this.categoryNames(expert.categories),
            countriesServed: expert.countriesServed ?? [],
            languages: expert.languages ?? [],
            yearsExperience: expert.yearsExperience,
            verificationStatus: expert.verificationStatus,
            verifiedAt: expert.verificationStatus === 'verified' ? expert.verifiedAt : null,
          }
        : null,
      stats: { followers: profile.followersCount, following: profile.followingCount, posts: postsCount },
      communities,
      relationship,
    };
  }

  /** Communautés publiques/restreintes du membre (jamais les communautés privées, sauf membre commun). */
  private async publicCommunities(user: User, viewer: User | null) {
    const rows = await this.memberships.find({
      where: { user: { id: user.id }, status: 'active' },
      relations: { community: true },
    });
    const viewerCommunities = new Set(await this.access.activeCommunityIds(viewer));
    return rows
      .filter((row) => row.community.status === 'active')
      .filter((row) => row.community.visibility !== 'private' || viewerCommunities.has(row.community.id) || viewer?.role === 'admin')
      .map((row) => ({ id: row.community.id, slug: row.community.slug, name: row.community.name, role: row.role }));
  }

  /** Relation entre le visiteur et le membre : suivi, blocage, droit de lui écrire. */
  async relationship(user: User, viewer: User | null, policy = DEFAULT_PRIVACY.messages) {
    if (!viewer || viewer.id === user.id) {
      return { isSelf: viewer?.id === user.id, isFollowing: false, followsYou: false, blocked: false, canMessage: false, messageRestriction: viewer ? null : 'login' };
    }
    const [isFollowing, followsYou, blocked] = await Promise.all([
      this.follows.exist({ where: { follower: { id: viewer.id }, targetType: 'user', targetId: user.id } }),
      this.follows.exist({ where: { follower: { id: user.id }, targetType: 'user', targetId: viewer.id } }),
      this.blocks.exist({ where: { blocker: { id: viewer.id }, blocked: { id: user.id } } }),
    ]);
    const restriction = await this.messageRestriction(viewer, user, policy);
    return { isSelf: false, isFollowing, followsYou, blocked, canMessage: restriction === null, messageRestriction: restriction };
  }

  /**
   * Règles de messagerie (null = autorisé) :
   *  - jamais vers soi-même, un compte suspendu, ou en cas de blocage dans un sens ou l'autre ;
   *  - « everyone » : tout membre actif ;
   *  - « connections » (défaut) : membres partageant une communauté, ou que le destinataire suit ;
   *  - « nobody » : aucune nouvelle conversation (les conversations existantes restent ouvertes).
   */
  async messageRestriction(sender: User, recipient: User, policy?: string): Promise<string | null> {
    if (sender.id === recipient.id) return 'self';
    if (recipient.status !== 'active') return 'suspended';
    if (await this.access.isBlockedBetween(sender.id, recipient.id)) return 'blocked';
    const effective = policy ?? { ...DEFAULT_PRIVACY, ...(await this.ensureProfile(recipient.id)).privacy }.messages;
    if (sender.role === 'admin' || effective === 'everyone') return null;
    if (effective === 'nobody') return 'nobody';
    const recipientFollowsSender = await this.follows.exist({
      where: { follower: { id: recipient.id }, targetType: 'user', targetId: sender.id },
    });
    if (recipientFollowsSender) return null;
    const [senderCommunities, recipientCommunities] = await Promise.all([
      this.access.activeCommunityIds(sender),
      this.access.activeCommunityIds(recipient),
    ]);
    const shared = senderCommunities.some((id) => recipientCommunities.includes(id));
    return shared ? null : 'connections';
  }

  // --- Mon profil -------------------------------------------------------------------------

  async myProfile(user: User) {
    const [profile, expert] = await Promise.all([this.ensureProfile(user.id), this.experts.findOne({ where: { userId: user.id } })]);
    return {
      id: user.id,
      handle: user.handle,
      fullName: user.fullName,
      email: user.email,
      company: user.company,
      avatarUrl: user.avatarUrl,
      headline: profile.headline ?? user.title,
      bio: profile.bio,
      country: profile.country,
      city: profile.city,
      languages: profile.languages ?? [],
      sectors: profile.sectors ?? [],
      interests: profile.interests ?? [],
      privacy: { ...DEFAULT_PRIVACY, ...profile.privacy },
      notificationPrefs: Object.fromEntries(
        Object.keys(NOTIFICATION_KINDS).map((kind) => [kind, NOTIFICATION_KINDS[kind].mandatory ? true : profile.notificationPrefs?.[kind] !== false]),
      ),
      notificationKinds: Object.entries(NOTIFICATION_KINDS).map(([id, kind]) => ({ id, ...kind })),
      expert: expert
        ? {
            listed: expert.listed,
            headline: expert.headline,
            biography: expert.biography,
            categories: expert.categories,
            countriesServed: expert.countriesServed ?? [],
            languages: expert.languages ?? [],
            yearsExperience: expert.yearsExperience,
            verificationStatus: expert.verificationStatus,
            verificationNote: expert.verificationNote,
            verificationRequestedAt: expert.verificationRequestedAt,
          }
        : null,
      blocked: (await this.blocks.find({ where: { blocker: { id: user.id } }, order: { createdAt: 'DESC' } })).map((b) => ({
        id: b.blocked.id,
        handle: b.blocked.handle,
        fullName: b.blocked.fullName,
        avatarUrl: b.blocked.avatarUrl,
      })),
    };
  }

  async updateMyProfile(user: User, dto: UpdateMemberProfileDto) {
    if (dto.handle && dto.handle !== user.handle) {
      if (await this.users.exist({ where: { handle: dto.handle, id: Not(user.id) } })) {
        throw new ConflictException('Cet identifiant est déjà utilisé.');
      }
      user.handle = dto.handle;
    }
    if (dto.sectors) await this.assertCategories(dto.sectors);
    const profile = await this.ensureProfile(user.id);
    Object.assign(profile, {
      ...(dto.headline !== undefined && { headline: dto.headline.trim() || null }),
      ...(dto.bio !== undefined && { bio: dto.bio.trim() || null }),
      ...(dto.country !== undefined && { country: dto.country.trim() || null }),
      ...(dto.city !== undefined && { city: dto.city.trim() || null }),
      ...(dto.languages !== undefined && { languages: dto.languages }),
      ...(dto.sectors !== undefined && { sectors: dto.sectors }),
      ...(dto.interests !== undefined && { interests: dto.interests.map((i) => i.trim()).filter(Boolean) }),
    });
    await this.profiles.save(profile);
    // Les champs partagés avec le compte QIAO restent synchronisés (une seule identité).
    Object.assign(user, {
      ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
      ...(dto.company !== undefined && { company: dto.company.trim() || null }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl.trim() || null }),
      ...(dto.headline !== undefined && { title: dto.headline.trim() || null }),
      ...((dto.city !== undefined || dto.country !== undefined) && {
        location: [profile.city, profile.country].filter(Boolean).join(', ') || null,
      }),
    });
    await this.users.save(user);
    return this.myProfile(user);
  }

  async updatePrivacy(user: User, dto: PrivacyDto) {
    const profile = await this.ensureProfile(user.id);
    profile.privacy = { ...DEFAULT_PRIVACY, ...profile.privacy, ...Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)) };
    await this.profiles.save(profile);
    return this.myProfile(user);
  }

  async updateNotificationPrefs(user: User, dto: NotificationPrefsDto) {
    const profile = await this.ensureProfile(user.id);
    const prefs: Record<string, boolean> = { ...profile.notificationPrefs };
    for (const [kind, enabled] of Object.entries(dto.prefs)) {
      if (NOTIFICATION_KINDS[kind] && !NOTIFICATION_KINDS[kind].mandatory) prefs[kind] = !!enabled;
    }
    profile.notificationPrefs = prefs;
    await this.profiles.save(profile);
    return this.myProfile(user);
  }

  // --- Profil expert ---------------------------------------------------------------------

  private async assertCategories(ids: string[]) {
    const found = await this.categories.count({ where: { id: In(ids) } });
    if (found !== new Set(ids).size) throw new BadRequestException('Catégorie professionnelle inconnue.');
  }

  async upsertExpertProfile(user: User, dto: ExpertProfileDto) {
    if (dto.categories.length === 0) throw new BadRequestException('Choisissez au moins une catégorie professionnelle.');
    await this.assertCategories(dto.categories);
    const existing = await this.experts.findOne({ where: { userId: user.id } });
    const expert = existing ?? this.experts.create({ userId: user.id, verificationStatus: 'none' });
    const categoriesChanged = existing && [...existing.categories].sort().join() !== [...dto.categories].sort().join();
    Object.assign(expert, {
      headline: dto.headline.trim(),
      biography: dto.biography?.trim() || null,
      categories: dto.categories,
      countriesServed: dto.countriesServed ?? [],
      languages: dto.languages ?? [],
      yearsExperience: dto.yearsExperience ?? null,
      listed: dto.listed ?? true,
    });
    // Une vérification porte sur des domaines précis : les modifier impose une nouvelle vérification.
    if (categoriesChanged && expert.verificationStatus === 'verified') {
      expert.verificationStatus = 'none';
      expert.verificationNote = 'Domaines modifiés : une nouvelle vérification est nécessaire.';
    }
    await this.experts.save(expert);
    return this.myProfile(user);
  }

  async removeExpertProfile(user: User) {
    await this.experts.delete({ userId: user.id });
    return this.myProfile(user);
  }

  async requestVerification(user: User, dto: VerificationRequestDto) {
    const expert = await this.experts.findOne({ where: { userId: user.id } });
    if (!expert) throw new BadRequestException("Complétez d'abord votre profil professionnel.");
    if (expert.verificationStatus === 'verified') throw new BadRequestException('Votre profil est déjà vérifié.');
    if (expert.verificationStatus === 'pending') throw new BadRequestException('Une demande de vérification est déjà en cours.');
    Object.assign(expert, {
      verificationStatus: 'pending',
      verificationEvidence: dto.evidence.trim(),
      verificationRequestedAt: new Date(),
      verificationNote: null,
    });
    await this.experts.save(expert);
    const admins = await this.users.find({ where: { role: 'admin', status: 'active' } });
    for (const admin of admins) {
      await this.notifications.notify(admin, 'Vérification d’expert demandée', `${user.fullName} demande la vérification de son profil professionnel.`, 'community', 'community/admin', {
        kind: 'expert_verification',
        targetType: 'member',
        targetId: user.id,
      });
    }
    return this.myProfile(user);
  }

  // --- Suivre / bloquer -------------------------------------------------------------------

  async toggleFollow(viewer: User, handle: string) {
    const target = await this.findByHandle(handle);
    if (target.id === viewer.id) throw new BadRequestException('Vous ne pouvez pas vous suivre vous-même.');
    if (await this.access.isBlockedBetween(viewer.id, target.id)) throw new ForbiddenException('Action impossible avec ce membre.');
    const existing = await this.follows.findOne({ where: { follower: { id: viewer.id }, targetType: 'user', targetId: target.id } });
    if (existing) {
      await this.follows.remove(existing);
    } else {
      this.rateLimiter.hit(`follow:${viewer.id}`, 60, 60 * 60_000);
      await this.follows.save(this.follows.create({ follower: { id: viewer.id } as User, targetType: 'user', targetId: target.id }));
      await this.notifier.send(
        [target.id],
        'new_follower',
        { title: `${viewer.fullName} vous suit`, body: 'Ce membre recevra vos publications publiques dans son fil.' },
        { type: 'member', id: viewer.id, link: `community/member/${viewer.handle}` },
        viewer.id,
      );
    }
    await this.refreshFollowCounts([viewer.id, target.id]);
    const profile = await this.ensureProfile(target.id);
    return { following: !existing, followers: profile.followersCount };
  }

  private async refreshFollowCounts(userIds: string[]) {
    for (const userId of userIds) {
      await this.ensureProfile(userId);
      const [followers, following] = await Promise.all([
        this.follows.count({ where: { targetType: 'user', targetId: userId } }),
        this.follows.count({ where: { follower: { id: userId }, targetType: 'user' } }),
      ]);
      await this.profiles.update({ userId }, { followersCount: followers, followingCount: following });
    }
  }

  async followingIds(user: User): Promise<string[]> {
    const rows = await this.follows.find({ where: { follower: { id: user.id }, targetType: 'user' } });
    return rows.map((row) => row.targetId);
  }

  /** Membres suivis (espace membre). */
  async listFollowing(user: User) {
    const rows = await this.follows.find({ where: { follower: { id: user.id }, targetType: 'user' }, order: { createdAt: 'DESC' } });
    const summaries = await this.summaries(rows.map((r) => r.targetId), user);
    return rows
      .filter((row) => summaries.has(row.targetId))
      .map((row) => ({ ...summaries.get(row.targetId)!, followedAt: row.createdAt }));
  }

  async listFollowers(handle: string, viewer: User | null) {
    const user = await this.findByHandle(handle);
    const rows = await this.follows.find({ where: { targetType: 'user', targetId: user.id }, relations: { follower: true }, order: { createdAt: 'DESC' }, take: 100 });
    const summaries = await this.summaries(rows.map((r) => r.follower.id), viewer);
    return rows.map((row) => summaries.get(row.follower.id)).filter(Boolean);
  }

  async block(viewer: User, handle: string) {
    const target = await this.findByHandle(handle);
    if (target.id === viewer.id) throw new BadRequestException('Action impossible.');
    if (!(await this.blocks.exist({ where: { blocker: { id: viewer.id }, blocked: { id: target.id } } }))) {
      await this.blocks.save(this.blocks.create({ blocker: { id: viewer.id } as User, blocked: { id: target.id } as User }));
    }
    // Le blocage coupe aussi les abonnements dans les deux sens.
    await this.follows.delete({ follower: { id: viewer.id }, targetType: 'user', targetId: target.id });
    await this.follows.delete({ follower: { id: target.id }, targetType: 'user', targetId: viewer.id });
    await this.refreshFollowCounts([viewer.id, target.id]);
    return { blocked: true };
  }

  async unblock(viewer: User, handle: string) {
    const target = await this.findByHandle(handle);
    await this.blocks.delete({ blocker: { id: viewer.id }, blocked: { id: target.id } });
    return { blocked: false };
  }

  // --- Annuaire des experts & recommandations ------------------------------------------------

  async expertDirectory(query: ExpertsQueryDto, viewer: User | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const experts = await this.experts.find({ where: { listed: true }, relations: { user: true } });
    let candidates = experts.filter((e) => e.user.status === 'active');

    if (query.community) {
      const { community, membership } = await this.access.findDiscoverable(query.community, viewer);
      if (!this.access.canViewContent(community, membership, viewer)) throw new ForbiddenException('Communauté réservée à ses membres.');
      const members = await this.memberships.find({ where: { community: { id: community.id }, status: 'active' }, relations: { user: true } });
      const ids = new Set(members.map((m) => m.user.id));
      candidates = candidates.filter((e) => ids.has(e.userId));
    }

    const profiles = await this.profiles.find({ where: { userId: In(candidates.map((e) => e.userId)) } });
    const profileById = new Map(profiles.map((p) => [p.userId, p]));
    const blocked = await this.access.blockedUserIds(viewer);
    const categoryRows = await this.categories.find();
    const categoryName = new Map(categoryRows.map((c) => [c.id, c.name]));

    const filtered = candidates.filter((expert) => {
      const profile = profileById.get(expert.userId);
      const privacy = { ...DEFAULT_PRIVACY, ...(profile?.privacy ?? {}) };
      const companyVisible = fieldVisible(privacy.company, viewer, viewer?.id === expert.userId);
      if (blocked.has(expert.userId)) return false;
      if (query.category && !expert.categories.includes(query.category)) return false;
      if (query.country && normalize(profile?.country) !== normalize(query.country) && !(expert.countriesServed ?? []).some((c) => normalize(c) === normalize(query.country))) return false;
      if (query.language && !(expert.languages ?? profile?.languages ?? []).includes(query.language)) return false;
      if (query.company && !(companyVisible && matchesQuery(query.company, expert.user.company))) return false;
      if (query.verification === 'verified' && expert.verificationStatus !== 'verified') return false;
      return matchesQuery(
        query.q,
        expert.user.fullName,
        expert.headline,
        expert.biography,
        expert.categories.map((c) => categoryName.get(c) ?? c),
        companyVisible ? expert.user.company : null,
      );
    });

    // Tri déterministe : vérifiés d'abord, puis consultations du profil, puis nom.
    filtered.sort(
      (a, b) =>
        Number(b.verificationStatus === 'verified') - Number(a.verificationStatus === 'verified') ||
        b.profileViews - a.profileViews ||
        a.user.fullName.localeCompare(b.user.fullName),
    );
    const slice = filtered.slice((page - 1) * limit, page * limit);
    const summaries = await this.summaries(slice.map((e) => e.userId), viewer);
    const following = new Set(viewer ? await this.followingIds(viewer) : []);
    return {
      total: filtered.length,
      page,
      items: slice.map((expert) => {
        const profile = profileById.get(expert.userId);
        return {
          ...summaries.get(expert.userId)!,
          headline: expert.headline,
          categories: expert.categories.map((id) => ({ id, name: categoryName.get(id) ?? id })),
          countriesServed: expert.countriesServed ?? [],
          languages: expert.languages?.length ? expert.languages : profile?.languages ?? [],
          country: fieldVisible(profile?.privacy?.location ?? 'public', viewer, false) ? profile?.country ?? null : null,
          verificationStatus: expert.verificationStatus,
          isFollowing: following.has(expert.userId),
        };
      }),
    };
  }

  /**
   * Membres et experts recommandés. Score documenté et déterministe :
   * +3 par secteur commun, +2 même pays, +1 par langue commune, +2 par communauté commune, +1 expert vérifié.
   * Aucun placement sponsorisé n'est mélangé à ces recommandations.
   */
  async recommendedMembers(viewer: User | null, limit = 8) {
    const experts = await this.experts.find({ where: { listed: true }, relations: { user: true } });
    let candidateIds = experts.filter((e) => e.user.status === 'active').map((e) => e.userId);
    const viewerCommunities = await this.access.activeCommunityIds(viewer);
    if (viewer && viewerCommunities.length) {
      const peers = await this.memberships.find({
        where: { community: { id: In(viewerCommunities) }, status: 'active' },
        relations: { user: true, community: true },
      });
      candidateIds = [...new Set([...candidateIds, ...peers.filter((p) => p.user.status === 'active').map((p) => p.user.id)])];
    }
    const excluded = new Set<string>([...(viewer ? [viewer.id, ...(await this.followingIds(viewer))] : []), ...(await this.access.blockedUserIds(viewer))]);
    candidateIds = candidateIds.filter((id) => !excluded.has(id));

    const [profiles, viewerProfile, communityRows, categoryRows] = await Promise.all([
      this.profiles.find({ where: { userId: In(candidateIds) } }),
      viewer ? this.ensureProfile(viewer.id) : Promise.resolve(null),
      viewerCommunities.length
        ? this.memberships.find({ where: { community: { id: In(viewerCommunities) }, status: 'active', user: { id: In(candidateIds) } }, relations: { user: true } })
        : Promise.resolve([] as CommunityMembership[]),
      this.categories.find(),
    ]);
    const categoryName = new Map(categoryRows.map((c) => [c.id, c.name]));
    const profileById = new Map(profiles.map((p) => [p.userId, p]));
    const expertById = new Map(experts.map((e) => [e.userId, e]));
    const sharedCommunities = new Map<string, number>();
    communityRows.forEach((row) => sharedCommunities.set(row.user.id, (sharedCommunities.get(row.user.id) ?? 0) + 1));

    const viewerSectors = new Set(viewerProfile?.sectors ?? []);
    const viewerLanguages = new Set(viewerProfile?.languages ?? []);
    const scored = candidateIds.map((id) => {
      const profile = profileById.get(id);
      const expert = expertById.get(id);
      const sectors = new Set([...(profile?.sectors ?? []), ...(expert?.categories ?? [])]);
      const commonSectors = [...sectors].filter((s) => viewerSectors.has(s));
      const commonLanguages = [...new Set([...(profile?.languages ?? []), ...(expert?.languages ?? [])])].filter((l) => viewerLanguages.has(l));
      const sameCountry = !!viewerProfile?.country && normalize(profile?.country) === normalize(viewerProfile.country);
      const communities = sharedCommunities.get(id) ?? 0;
      const verified = expert?.verificationStatus === 'verified';
      const score = commonSectors.length * 3 + (sameCountry ? 2 : 0) + commonLanguages.length + communities * 2 + (verified ? 1 : 0);
      const reasons = [
        commonSectors.length ? `Secteur commun : ${categoryName.get(commonSectors[0]) ?? commonSectors[0]}` : null,
        communities ? `${communities} communauté${communities > 1 ? 's' : ''} en commun` : null,
        sameCountry ? `Également en ${profile?.country}` : null,
        !commonSectors.length && expert ? (categoryName.get(expert.categories[0]) ?? null) : null,
      ].filter(Boolean) as string[];
      return { id, score, verified, views: expert?.profileViews ?? 0, reason: reasons[0] ?? 'Membre QIAO Community' };
    });
    scored.sort((a, b) => b.score - a.score || Number(b.verified) - Number(a.verified) || b.views - a.views || a.id.localeCompare(b.id));
    const top = scored.slice(0, limit);
    const summaries = await this.summaries(top.map((s) => s.id), viewer);
    return top
      .filter((s) => summaries.has(s.id))
      .map((s) => ({
        ...summaries.get(s.id)!,
        country: profileById.get(s.id)?.country ?? null,
        reason: s.reason,
        isFollowing: false,
      }));
  }

  /** Recherche de membres (nom, @identifiant, titre) avec filtres pays / langue / secteur. */
  async searchMembers(query: MembersQueryDto, viewer: User | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const qb = this.users
      .createQueryBuilder('user')
      .leftJoin(MemberProfile, 'profile', 'profile.userId = user.id')
      .where('user.status = :status', { status: 'active' })
      .andWhere('user.handle IS NOT NULL');
    if (query.q) {
      qb.andWhere(
        `(${sqlUnaccent('user.fullName')} LIKE :q OR user.handle LIKE :q OR ${sqlUnaccent("COALESCE(profile.headline, user.title, '')")} LIKE :q)`,
        { q: `%${normalize(query.q)}%` },
      );
    }
    if (query.country) qb.andWhere('lower(profile.country) = lower(:country)', { country: query.country });
    if (query.language) qb.andWhere(':language = ANY(string_to_array(profile.languages, \',\'))', { language: query.language });
    if (query.sector) qb.andWhere(':sector = ANY(string_to_array(profile.sectors, \',\'))', { sector: query.sector });
    const blocked = [...(await this.access.blockedUserIds(viewer))];
    if (blocked.length) qb.andWhere('user.id NOT IN (:...blocked)', { blocked });
    const [users, total] = await qb.orderBy('user.fullName', 'ASC').skip((page - 1) * limit).take(limit).getManyAndCount();
    const summaries = await this.summaries(users.map((u) => u.id), viewer);
    const following = new Set(viewer ? await this.followingIds(viewer) : []);
    return { total, page, items: users.map((u) => ({ ...summaries.get(u.id)!, isFollowing: following.has(u.id) })) };
  }
}
