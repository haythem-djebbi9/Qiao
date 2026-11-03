import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Community, CommunityMembership, CommunityPost, MemberBlock } from './community.entities';

/**
 * Règles d'accès Community, appliquées côté serveur pour toutes les API (fil, recherche, URL directes) :
 *  - communauté publique : découvrable, contenu lisible par tous, participation (commentaire, réaction) pour tout membre connecté ;
 *  - communauté restreinte : découvrable, contenu et participation réservés aux membres actifs ;
 *  - communauté privée : invisible (404) sauf pour ses membres, invités et les administrateurs ;
 *  - publier dans une communauté exige d'en être membre actif ; le fil général (sans communauté) est public.
 * Les administrateurs QIAO voient tout. L'accès ne dépend jamais d'une inscription à QIAO Academy.
 */
@Injectable()
export class CommunityAccessService {
  constructor(
    @InjectRepository(CommunityMembership) private readonly memberships: Repository<CommunityMembership>,
    @InjectRepository(Community) private readonly communities: Repository<Community>,
    @InjectRepository(MemberBlock) private readonly blocks: Repository<MemberBlock>,
  ) {}

  isAdmin(user: User | null | undefined): boolean {
    return user?.role === 'admin';
  }

  async membership(user: User | null | undefined, communityId: string): Promise<CommunityMembership | null> {
    if (!user) return null;
    return this.memberships.findOne({ where: { user: { id: user.id }, community: { id: communityId } } });
  }

  async membershipsByCommunity(user: User | null | undefined, communityIds: string[]) {
    const map = new Map<string, CommunityMembership>();
    if (!user || communityIds.length === 0) return map;
    const rows = await this.memberships.find({
      where: { user: { id: user.id }, community: { id: In(communityIds) } },
      relations: { community: true },
    });
    rows.forEach((row) => map.set(row.community.id, row));
    return map;
  }

  /** Communautés dont le membre est actif (accès au contenu réservé). */
  async activeCommunityIds(user: User | null | undefined): Promise<string[]> {
    if (!user) return [];
    const rows = await this.memberships.find({
      where: { user: { id: user.id }, status: 'active' },
      relations: { community: true },
    });
    return rows.map((row) => row.community.id);
  }

  /** Communautés modérées par le membre (toutes pour un administrateur). */
  async moderatedCommunityIds(user: User | null | undefined): Promise<string[] | 'all'> {
    if (!user) return [];
    if (this.isAdmin(user)) return 'all';
    const rows = await this.memberships.find({
      where: { user: { id: user.id }, status: 'active', role: 'moderator' },
      relations: { community: true },
    });
    return rows.map((row) => row.community.id);
  }

  async isModerator(user: User | null | undefined, communityId: string | null | undefined): Promise<boolean> {
    if (!user) return false;
    if (this.isAdmin(user)) return true;
    if (!communityId) return false;
    const membership = await this.membership(user, communityId);
    return membership?.status === 'active' && membership.role === 'moderator';
  }

  async assertModerator(user: User, communityId: string | null | undefined) {
    if (!(await this.isModerator(user, communityId))) {
      throw new ForbiddenException('Action réservée aux modérateurs de cette communauté.');
    }
  }

  /** La communauté apparaît-elle dans le répertoire / la recherche pour ce visiteur ? */
  canDiscover(community: Community, membership: CommunityMembership | null | undefined, user: User | null | undefined) {
    if (this.isAdmin(user)) return true;
    if (community.visibility !== 'private') return true;
    return !!membership && ['active', 'invited'].includes(membership.status);
  }

  /** Le visiteur peut-il lire le contenu (publications, membres) de la communauté ? */
  canViewContent(community: Community | null, membership: CommunityMembership | null | undefined, user: User | null | undefined) {
    if (!community) return true;
    if (this.isAdmin(user)) return true;
    if (community.visibility === 'public') return true;
    return membership?.status === 'active';
  }

  /** Commenter / réagir / suivre la discussion. */
  canParticipate(community: Community | null, membership: CommunityMembership | null | undefined, user: User | null | undefined) {
    if (!user || user.status !== 'active') return false;
    if (!community) return true;
    if (community.status === 'archived') return false;
    if (membership?.status === 'banned') return false;
    if (this.isAdmin(user)) return true;
    if (community.visibility === 'public') return true;
    return membership?.status === 'active';
  }

  /** Publier une publication ou une question dans la communauté. */
  canPublish(community: Community | null, membership: CommunityMembership | null | undefined, user: User | null | undefined) {
    if (!user || user.status !== 'active') return false;
    if (!community) return true;
    if (community.status === 'archived') return false;
    return membership?.status === 'active' || this.isAdmin(user);
  }

  /** Charge une communauté visible par le visiteur (404 si privée et non autorisée, pour ne pas révéler son existence). */
  async findDiscoverable(slugOrId: string, user: User | null | undefined) {
    const community = await this.communities.findOne({
      where: isUuid(slugOrId) ? [{ id: slugOrId }, { slug: slugOrId }] : { slug: slugOrId },
    });
    if (!community) throw new NotFoundException('Communauté introuvable.');
    const membership = await this.membership(user, community.id);
    if (!this.canDiscover(community, membership, user)) throw new NotFoundException('Communauté introuvable.');
    return { community, membership };
  }

  /**
   * Vérifie qu'une publication est lisible par le visiteur.
   * Brouillons : auteur uniquement. Contenus masqués/retirés : auteur et modérateurs.
   */
  async assertCanViewPost(post: CommunityPost, user: User | null | undefined) {
    const membership = post.community ? await this.membership(user, post.community.id) : null;
    const isAuthor = !!user && post.author.id === user.id;
    if (post.status === 'draft' || post.status === 'deleted') {
      if (!isAuthor && !this.isAdmin(user)) throw new NotFoundException('Publication introuvable.');
    }
    if (post.community && !this.canDiscover(post.community, membership, user)) {
      throw new NotFoundException('Publication introuvable.');
    }
    if (!this.canViewContent(post.community, membership, user)) {
      throw new ForbiddenException(
        user
          ? 'Cette discussion est réservée aux membres de la communauté. Rejoignez-la pour y accéder.'
          : 'Connectez-vous et rejoignez la communauté pour accéder à cette discussion.',
      );
    }
    if (post.status === 'hidden' || post.status === 'removed') {
      const moderator = await this.isModerator(user, post.community?.id);
      if (!isAuthor && !moderator) throw new NotFoundException('Cette publication a été retirée par la modération.');
    }
    return membership;
  }

  /** Membres bloqués par le visiteur ou l'ayant bloqué (interactions coupées dans les deux sens). */
  async blockedUserIds(user: User | null | undefined): Promise<Set<string>> {
    if (!user) return new Set();
    const rows = await this.blocks.find({
      where: [{ blocker: { id: user.id } }, { blocked: { id: user.id } }],
      relations: { blocker: true, blocked: true },
    });
    return new Set(rows.map((row) => (row.blocker.id === user.id ? row.blocked.id : row.blocker.id)));
  }

  async isBlockedBetween(a: string, b: string) {
    return this.blocks.exist({
      where: [
        { blocker: { id: a }, blocked: { id: b } },
        { blocker: { id: b }, blocked: { id: a } },
      ],
    });
  }
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
