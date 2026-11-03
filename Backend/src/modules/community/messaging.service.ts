import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { ActivityService, PlatformEvents, RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { CommunityAccessService } from './community-access.service';
import { CommunityNotifier } from './community-notifier.service';
import { CommunityPost, Conversation, ConversationParticipant, Message } from './community.entities';
import { StartConversationDto } from './community.dto';
import { ProfilesService } from './profiles.service';

const RESTRICTION_MESSAGES: Record<string, string> = {
  self: 'Vous ne pouvez pas vous écrire à vous-même.',
  suspended: "Ce compte n'est pas disponible pour le moment.",
  blocked: 'Vous ne pouvez pas échanger avec ce membre.',
  nobody: "Ce membre n'accepte pas de nouveaux messages privés.",
  connections:
    "Ce membre accepte les messages des membres d'une communauté commune ou qu'il suit. Rejoignez une de ses communautés ou répondez publiquement à sa discussion.",
};

/**
 * Messagerie privée entre deux membres. Seuls les participants lisent ou écrivent dans une conversation :
 * ni les modérateurs ni les administrateurs n'y ont accès par l'API (seul un message signalé est copié dans le signalement).
 */
@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(ConversationParticipant) private readonly participants: Repository<ConversationParticipant>,
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(CommunityPost) private readonly posts: Repository<CommunityPost>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly access: CommunityAccessService,
    private readonly profiles: ProfilesService,
    private readonly notifier: CommunityNotifier,
    private readonly activity: ActivityService,
    private readonly rateLimiter: RateLimiter,
    private readonly usersService: UsersService,
    private readonly events: PlatformEvents,
  ) {}

  private pairKey(a: string, b: string) {
    return [a, b].sort().join(':');
  }

  /** Vérifie que le membre participe à la conversation (contrôle effectué à chaque lecture et écriture). */
  private async participation(user: User, conversationId: string) {
    const participant = await this.participants.findOne({
      where: { conversation: { id: conversationId }, user: { id: user.id } },
      relations: { conversation: true },
    });
    if (!participant) throw new NotFoundException('Conversation introuvable.');
    const other = await this.participants.findOne({
      where: { conversation: { id: conversationId }, user: { id: Not(user.id) } },
    });
    if (!other) throw new NotFoundException('Conversation introuvable.');
    return { participant, other };
  }

  async list(user: User) {
    const mine = await this.participants.find({ where: { user: { id: user.id } }, relations: { conversation: true } });
    if (mine.length === 0) return { items: [], unread: 0 };
    const conversationIds = mine.map((p) => p.conversation.id);
    const others = await this.participants.find({ where: { conversation: { id: In(conversationIds) }, user: { id: Not(user.id) } }, relations: { conversation: true } });
    const summaries = await this.profiles.summaries(others.map((o) => o.user.id), user);
    const otherByConversation = new Map(others.map((o) => [o.conversation.id, o]));
    const blocked = await this.access.blockedUserIds(user);

    const items = await Promise.all(
      mine.map(async (participant) => {
        const conversation = participant.conversation;
        const other = otherByConversation.get(conversation.id);
        const [last, unread] = await Promise.all([
          this.messages.findOne({ where: { conversation: { id: conversation.id } }, order: { createdAt: 'DESC' } }),
          this.unreadIn(conversation.id, user.id, participant.lastReadAt),
        ]);
        return {
          id: conversation.id,
          other: other ? summaries.get(other.user.id) ?? null : null,
          blocked: other ? blocked.has(other.user.id) : false,
          context: conversation.contextType ? { type: conversation.contextType, id: conversation.contextId, label: conversation.contextLabel } : null,
          lastMessage: last
            ? { body: last.status === 'removed' ? 'Message retiré' : last.body.slice(0, 140), fromMe: last.author.id === user.id, createdAt: last.createdAt }
            : null,
          unread,
          lastMessageAt: conversation.lastMessageAt,
        };
      }),
    );
    items.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    return { items, unread: items.reduce((sum, item) => sum + item.unread, 0) };
  }

  private unreadIn(conversationId: string, userId: string, lastReadAt: Date | null) {
    return this.messages.count({
      where: {
        conversation: { id: conversationId },
        author: { id: Not(userId) },
        ...(lastReadAt ? { createdAt: MoreThan(lastReadAt) } : {}),
      },
    });
  }

  async unreadCount(user: User) {
    const mine = await this.participants.find({ where: { user: { id: user.id } }, relations: { conversation: true } });
    let total = 0;
    for (const participant of mine) total += await this.unreadIn(participant.conversation.id, user.id, participant.lastReadAt);
    return { unread: total };
  }

  /** Démarre (ou reprend) une conversation avec un membre, éventuellement depuis une question ou un profil. */
  async start(user: User, dto: StartConversationDto) {
    await this.usersService.assertActive(user);
    const recipient = await this.users.findOne({ where: { id: dto.recipientId } });
    if (!recipient) throw new NotFoundException('Membre introuvable.');
    const existing = await this.conversations.findOne({ where: { pairKey: this.pairKey(user.id, recipient.id) } });

    if (existing) {
      const restriction = await this.continuationRestriction(user, recipient);
      if (restriction) throw new ForbiddenException(RESTRICTION_MESSAGES[restriction]);
    } else {
      const restriction = await this.profiles.messageRestriction(user, recipient);
      if (restriction) throw new ForbiddenException(RESTRICTION_MESSAGES[restriction]);
      this.rateLimiter.hit(`conversation:${user.id}`, 10, 60 * 60_000, 'Vous avez démarré beaucoup de conversations. Réessayez plus tard.');
    }

    let context: Pick<Conversation, 'contextType' | 'contextId' | 'contextLabel'> = { contextType: null, contextId: null, contextLabel: null };
    if (dto.contextType === 'post' && dto.contextId) {
      const post = await this.posts.findOne({ where: { id: dto.contextId } });
      if (post) {
        await this.access.assertCanViewPost(post, user);
        context = { contextType: 'post', contextId: post.id, contextLabel: (post.title ?? post.content).slice(0, 190) };
      }
    } else if (dto.contextType === 'profile') {
      context = { contextType: 'profile', contextId: recipient.handle, contextLabel: `Profil de ${recipient.fullName}` };
    }

    let conversation = existing;
    if (!conversation) {
      conversation = await this.conversations.save(
        this.conversations.create({ pairKey: this.pairKey(user.id, recipient.id), lastMessageAt: new Date(), ...context }),
      );
      await this.participants.save([
        this.participants.create({ conversation, user: { id: user.id } as User, lastReadAt: new Date() }),
        this.participants.create({ conversation, user: { id: recipient.id } as User, lastReadAt: null }),
      ]);
      // Prise de contact professionnelle : événement Community, distinct de toute conversion commerciale.
      await this.activity.record('contact_initiated', user.id, { type: 'member', id: recipient.id });
    } else if (context.contextType) {
      Object.assign(conversation, context);
      await this.conversations.save(conversation);
    }
    await this.send(user, conversation.id, dto.body);
    return { id: conversation.id };
  }

  /** Une conversation existante reste ouverte, sauf blocage ou compte suspendu. */
  private async continuationRestriction(user: User, recipient: User): Promise<string | null> {
    if (recipient.status !== 'active') return 'suspended';
    if (await this.access.isBlockedBetween(user.id, recipient.id)) return 'blocked';
    return null;
  }

  async thread(user: User, conversationId: string, before?: string) {
    const { participant, other } = await this.participation(user, conversationId);
    const rows = await this.messages.find({
      where: { conversation: { id: conversationId }, ...(before ? { createdAt: LessThan(new Date(before)) } : {}) },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    participant.lastReadAt = new Date();
    await this.participants.save(participant);
    const summaries = await this.profiles.summaries([other.user.id], user);
    const restriction = await this.continuationRestriction(user, other.user);
    const conversation = participant.conversation;
    return {
      id: conversation.id,
      other: summaries.get(other.user.id) ?? null,
      context: conversation.contextType ? { type: conversation.contextType, id: conversation.contextId, label: conversation.contextLabel } : null,
      canSend: restriction === null,
      restriction: restriction ? RESTRICTION_MESSAGES[restriction] : null,
      hasMore: rows.length === 50,
      messages: rows.reverse().map((m) => ({
        id: m.id,
        fromMe: m.author.id === user.id,
        body: m.status === 'removed' ? null : m.body,
        status: m.status,
        source: m.source,
        createdAt: m.createdAt,
      })),
    };
  }

  /** `source` : « wechat » pour une réponse tapée dans WeChat et relayée par le compte officiel QIAO. */
  async send(user: User, conversationId: string, body: string, source: 'web' | 'wechat' = 'web') {
    const { other } = await this.participation(user, conversationId);
    const restriction = await this.continuationRestriction(user, other.user);
    if (restriction) throw new ForbiddenException(RESTRICTION_MESSAGES[restriction]);
    const text = body.trim();
    if (!text) throw new BadRequestException('Votre message est vide.');
    this.rateLimiter.hit(`message:${user.id}`, 30, 60_000, 'Vous envoyez trop de messages. Patientez une minute.');

    const hadUnread = (await this.unreadIn(conversationId, other.user.id, other.lastReadAt)) > 0;
    const message = await this.messages.save(
      this.messages.create({ conversation: { id: conversationId } as Conversation, author: { id: user.id } as User, body: text, source }),
    );
    await this.conversations.update(conversationId, { lastMessageAt: message.createdAt });
    await this.participants.update({ conversation: { id: conversationId }, user: { id: user.id } }, { lastReadAt: message.createdAt });
    // Une seule notification tant que les messages précédents ne sont pas lus ; jamais de contenu dans la notification.
    if (!hadUnread) {
      await this.notifier.send(
        [other.user.id],
        'message',
        { title: `Nouveau message de ${user.fullName}`, body: 'Ouvrez votre messagerie QIAO Community pour le lire.' },
        { type: 'conversation', id: conversationId, link: `community/messages/${conversationId}` },
        user.id,
      );
    }
    // Relais vers les canaux externes choisis par le destinataire (WeChat).
    this.events.emit('message.sent', {
      messageId: message.id,
      conversationId,
      authorId: user.id,
      authorName: user.fullName,
      recipientId: other.user.id,
      body: text,
      source,
    });
    return { id: message.id, fromMe: true, body: message.body, status: message.status, source: message.source, createdAt: message.createdAt };
  }

  async markRead(user: User, conversationId: string) {
    const { participant } = await this.participation(user, conversationId);
    participant.lastReadAt = new Date();
    await this.participants.save(participant);
    return { success: true };
  }

  /** Message signalé par un participant : renvoie l'extrait copié dans le signalement. */
  async messageForReport(user: User, messageId: string) {
    const message = await this.messages.findOne({ where: { id: messageId }, relations: { conversation: true } });
    if (!message) throw new NotFoundException('Message introuvable.');
    await this.participation(user, message.conversation.id);
    if (message.author.id === user.id) throw new BadRequestException('Vous ne pouvez pas signaler votre propre message.');
    return message;
  }

  async removeMessage(messageId: string) {
    await this.messages.update(messageId, { status: 'removed' });
  }
}
