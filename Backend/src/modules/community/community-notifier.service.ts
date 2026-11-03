import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { CommunityAccessService } from './community-access.service';
import { CommunityMembership, CommunityPost, MemberProfile } from './community.entities';

/** Types de notifications Community (préférences réglables par le membre). */
export const NOTIFICATION_KINDS: Record<string, { label: string; mandatory?: boolean }> = {
  question_reply: { label: 'Réponses à mes questions' },
  post_comment: { label: 'Commentaires sur mes publications' },
  comment_reply: { label: 'Réponses à mes commentaires' },
  mention: { label: 'Mentions (@identifiant)' },
  answer_accepted: { label: 'Ma réponse est acceptée' },
  followed_activity: { label: 'Activité des discussions suivies' },
  new_follower: { label: 'Nouveaux abonnés' },
  membership_decision: { label: "Décisions sur mes demandes d'adhésion" },
  invitation: { label: 'Invitations à rejoindre une communauté' },
  membership_request: { label: "Demandes d'adhésion à valider (modérateurs)" },
  report_received: { label: 'Nouveaux signalements à traiter (modérateurs)' },
  message: { label: 'Nouveaux messages privés' },
  moderation: { label: 'Décisions de modération me concernant', mandatory: true },
  expert_verification: { label: 'Vérification de mon profil expert', mandatory: true },
};

export interface NotificationTarget {
  type: 'post' | 'community' | 'conversation' | 'member' | 'report' | 'settings';
  id: string;
  /** Lien de navigation interprété par le site (ex. community/post/<id>). */
  link: string;
}

export const postTarget = (post: Pick<CommunityPost, 'id'>): NotificationTarget => ({
  type: 'post',
  id: post.id,
  link: `community/post/${post.id}`,
});

const MENTION_PATTERN = /(^|[\s(])@([a-z0-9][a-z0-9-]{1,58})/gi;

export function extractHandles(text: string): string[] {
  const handles = new Set<string>();
  for (const match of text.matchAll(MENTION_PATTERN)) handles.add(match[2].toLowerCase());
  return [...handles].slice(0, 10);
}

/**
 * Envoie les notifications Community en respectant :
 *  - les préférences du destinataire ;
 *  - les blocages entre membres ;
 *  - l'accès au contenu (aucun extrait de discussion restreinte pour un non-membre) ;
 *  - la confidentialité des messages privés (jamais de contenu dans la notification).
 */
@Injectable()
export class CommunityNotifier {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly access: CommunityAccessService,
    @InjectRepository(MemberProfile) private readonly profiles: Repository<MemberProfile>,
    @InjectRepository(CommunityMembership) private readonly memberships: Repository<CommunityMembership>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async send(
    recipientIds: string[],
    kind: keyof typeof NOTIFICATION_KINDS,
    content: { title: string; body: string },
    target: NotificationTarget,
    actorId?: string | null,
  ) {
    const unique = [...new Set(recipientIds)].filter((id) => id && id !== actorId);
    if (unique.length === 0) return;
    const prefs = await this.profiles.find({ where: { userId: In(unique) } });
    const disabled = new Set(
      NOTIFICATION_KINDS[kind]?.mandatory ? [] : prefs.filter((p) => p.notificationPrefs?.[kind] === false).map((p) => p.userId),
    );
    for (const recipientId of unique) {
      if (disabled.has(recipientId)) continue;
      if (actorId && (await this.access.isBlockedBetween(actorId, recipientId))) continue;
      await this.notifications.notify({ id: recipientId } as User, content.title, content.body, 'community', target.link, {
        kind,
        targetType: target.type,
        targetId: target.id,
      });
    }
  }

  /** Garde uniquement les destinataires autorisés à lire la publication. */
  async filterPostAudience(post: CommunityPost, userIds: string[]): Promise<string[]> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0 || !post.community || post.community.visibility === 'public') return unique;
    const [members, admins] = await Promise.all([
      this.memberships.find({
        where: { community: { id: post.community.id }, status: 'active', user: { id: In(unique) } },
        relations: { user: true },
      }),
      this.users.find({ where: { id: In(unique), role: 'admin' } }),
    ]);
    const allowed = new Set([...members.map((m) => m.user.id), ...admins.map((a) => a.id)]);
    return unique.filter((id) => allowed.has(id));
  }

  /** Notifie les membres mentionnés (@identifiant) qui ont accès à la discussion. */
  async notifyMentions(text: string, post: CommunityPost, actor: User, excludeIds: string[] = []) {
    const handles = extractHandles(text);
    if (handles.length === 0) return;
    const mentioned = await this.users.find({ where: { handle: In(handles), status: 'active' } });
    const audience = await this.filterPostAudience(
      post,
      mentioned.map((u) => u.id).filter((id) => !excludeIds.includes(id)),
    );
    await this.send(
      audience,
      'mention',
      {
        title: `${actor.fullName} vous a mentionné`,
        body: post.title ? `Dans « ${post.title} »` : 'Dans une discussion QIAO Community.',
      },
      postTarget(post),
      actor.id,
    );
  }
}
