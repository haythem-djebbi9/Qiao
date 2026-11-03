import { Inject, Injectable, Logger, OnModuleInit, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { In, IsNull, Not, Repository } from 'typeorm';
import { MessagingService } from '../community/messaging.service';
import { PlatformEventMap, PlatformEvents, RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { WINDOW_MS, WechatApi, WechatApiError } from './wechat.api';
import { WechatBindCode, WechatInbound, WechatLink, WechatOutbox } from './wechat.entities';
import { WechatCipher, buildWechatXml, parseWechatXml, safeEqual, textReply, truncate, wechatSignature } from './wechat.protocol';

export const WECHAT_API = Symbol('WECHAT_API');

const BIND_TTL_S = 600;
const SIGNATURE_TOLERANCE_S = 300;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

const HELP = [
  'Messagerie QIAO sur WeChat',
  '',
  '• Répondez simplement : votre texte est envoyé dans la dernière conversation reçue.',
  '• « liste » : vos conversations récentes et leur code.',
  '• « #code votre message » : écrire dans une autre conversation (ex. #a1b2c3 Bonjour).',
  '• « stop » / « start » : suspendre ou reprendre la réception des messages ici.',
  '',
  'Seul le texte est transmis : pour les fichiers, utilisez QIAO.',
].join('\n');

export interface WechatLinkStatus {
  available: boolean;
  mode: 'live' | 'mock' | 'off';
  linked: boolean;
  link: {
    status: string;
    relayMessages: boolean;
    relayAlerts: boolean;
    linkedAt: Date;
    windowOpen: boolean;
    waiting: number;
  } | null;
}

/**
 * Messagerie QIAO via le compte officiel WeChat de QIAO (compte de service) :
 *  - liaison d'un compte QIAO par QR code à paramètre (jamais de fusion automatique) ;
 *  - chaque message privé QIAO est transmis au destinataire lié, dans WeChat ;
 *  - sa réponse tapée dans WeChat est publiée dans la conversation QIAO, avec les mêmes règles que sur le site
 *    (participation, blocages, suspension, limites de débit).
 * Hors de la fenêtre de 48 h imposée par WeChat, une notification modèle avertit le membre ; les messages en attente
 * lui sont transmis dès sa prochaine action.
 */
@Injectable()
export class WechatService implements OnModuleInit {
  private readonly logger = new Logger('Wechat');
  private readonly token: string;
  private readonly cipher: WechatCipher | null;
  private readonly publicUrl: string;

  constructor(
    @Inject(WECHAT_API) private readonly api: WechatApi | null,
    private readonly events: PlatformEvents,
    private readonly messaging: MessagingService,
    private readonly usersService: UsersService,
    private readonly rateLimiter: RateLimiter,
    @InjectRepository(WechatLink) private readonly links: Repository<WechatLink>,
    @InjectRepository(WechatBindCode) private readonly codes: Repository<WechatBindCode>,
    @InjectRepository(WechatInbound) private readonly inbound: Repository<WechatInbound>,
    @InjectRepository(WechatOutbox) private readonly outbox: Repository<WechatOutbox>,
    @InjectRepository(User) private readonly users: Repository<User>,
    config: ConfigService,
  ) {
    this.publicUrl = config.get<string>('PUBLIC_URL', 'http://localhost:3000').replace(/\/$/, '');
    this.token = api?.mode === 'live' ? config.get<string>('WECHAT_OA_TOKEN', '') : simulatorToken(config);
    const aesKey = config.get<string>('WECHAT_OA_ENCODING_AES_KEY');
    this.cipher = api?.mode === 'live' && aesKey ? new WechatCipher(aesKey, config.get<string>('WECHAT_OA_APP_ID', '')) : null;
  }

  onModuleInit() {
    this.events.on('message.sent', (payload) => this.relayMessage(payload));
    this.events.on('notification.created', (payload) => this.relayAlert(payload));
  }

  get mode(): 'live' | 'mock' | 'off' {
    return this.api?.mode ?? 'off';
  }

  private requireApi(): WechatApi {
    if (!this.api) throw new ServiceUnavailableException("La messagerie WeChat n'est pas encore activée sur QIAO (compte officiel non configuré).");
    return this.api;
  }

  private activeLink(where: { userId: string } | { openid: string }) {
    if (!this.api) return Promise.resolve(null);
    return this.links.findOne({ where: { ...where, status: 'active', mode: this.api.mode } });
  }

  /** Lien vers une page du site QIAO (ouvert dans le navigateur intégré de WeChat). */
  appUrl(link: string | null): string {
    if (!link) return `${this.publicUrl}/`;
    for (const [prefix, param] of [
      ['community', 'cv'],
      ['dashboard', 'dv'],
    ] as const) {
      if (link === prefix || link.startsWith(`${prefix}/`)) {
        const route = link.slice(prefix.length + 1);
        return `${this.publicUrl}/?tab=${prefix}${route ? `&${param}=${encodeURIComponent(route)}` : ''}`;
      }
    }
    return `${this.publicUrl}/?tab=${encodeURIComponent(link)}`;
  }

  // --- Liaison (espace membre) -------------------------------------------------------------------

  async status(user: User): Promise<WechatLinkStatus> {
    const link = await this.activeLink({ userId: user.id });
    const anyLink = link ?? (this.api ? await this.links.findOne({ where: { userId: user.id, mode: this.api.mode } }) : null);
    return {
      available: !!this.api,
      mode: this.mode,
      linked: !!link,
      link: anyLink
        ? {
            status: anyLink.status,
            relayMessages: anyLink.relayMessages,
            relayAlerts: anyLink.relayAlerts,
            linkedAt: anyLink.linkedAt,
            windowOpen: !!anyLink.lastInteractionAt && anyLink.lastInteractionAt.getTime() > Date.now() - WINDOW_MS,
            waiting: await this.outbox.count({ where: { userId: user.id, status: 'waiting' } }),
          }
        : null,
    };
  }

  /** QR code de liaison valable 10 minutes, à scanner avec WeChat. */
  async createBindCode(user: User) {
    const api = this.requireApi();
    await this.usersService.assertActive(user);
    this.rateLimiter.hit(`wechat:bind:${user.id}`, 10, 60 * 60_000, 'Trop de QR codes générés. Réessayez dans une heure.');
    const code = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + BIND_TTL_S * 1000);
    await this.codes.insert({ codeHash: hash(code), userId: user.id, expiresAt });
    const qr = await api.createBindQr(`bind_${code}`, BIND_TTL_S);
    return { ...qr, expiresAt, mode: api.mode };
  }

  async updateSettings(user: User, patch: { relayMessages?: boolean; relayAlerts?: boolean }) {
    const link = await this.activeLink({ userId: user.id });
    if (link) {
      if (patch.relayMessages !== undefined) link.relayMessages = patch.relayMessages;
      if (patch.relayAlerts !== undefined) link.relayAlerts = patch.relayAlerts;
      await this.links.save(link);
    }
    return this.status(user);
  }

  async unlink(user: User) {
    await this.links.delete({ userId: user.id });
    await this.outbox.update({ userId: user.id, status: In(['pending', 'waiting']) }, { status: 'failed', content: '', error: 'Compte WeChat délié.' });
    return this.status(user);
  }

  // --- Serveur de messages du compte officiel -------------------------------------------------------

  private verifySignature(query: Record<string, string>) {
    const { signature, timestamp, nonce } = query;
    if (!this.token || !signature || !timestamp || !nonce || !safeEqual(wechatSignature(this.token, timestamp, nonce), signature)) {
      throw new UnauthorizedException('Signature WeChat invalide.');
    }
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > SIGNATURE_TOLERANCE_S) throw new UnauthorizedException('Requête WeChat expirée.');
  }

  /** Validation de l'URL du serveur dans le back-office du compte officiel (GET avec echostr). */
  verifyEndpoint(query: Record<string, string>): string {
    this.requireApi();
    this.verifySignature(query);
    return query.echostr ?? '';
  }

  /** Message ou événement poussé par WeChat ; renvoie la réponse passive (XML) ou « success ». */
  async handleCallback(query: Record<string, string>, rawBody: string): Promise<string> {
    this.requireApi();
    this.verifySignature(query);
    const encrypted = query.encrypt_type === 'aes';
    let xml = rawBody;
    if (encrypted) {
      if (!this.cipher) throw new UnauthorizedException('Mode sécurisé non configuré (WECHAT_OA_ENCODING_AES_KEY).');
      const envelope = parseWechatXml(rawBody).Encrypt ?? '';
      if (!safeEqual(wechatSignature(this.token, query.timestamp, query.nonce, envelope), query.msg_signature ?? '')) {
        throw new UnauthorizedException('Signature du message chiffré invalide.');
      }
      xml = this.cipher.decrypt(envelope);
    }
    const msg = parseWechatXml(xml);
    const openid = msg.FromUserName;
    if (!openid) return 'success';

    const dedupeKey = msg.MsgId ? `msg:${msg.MsgId}` : `evt:${openid}:${msg.CreateTime}:${msg.Event ?? ''}:${msg.EventKey ?? ''}`;
    const inserted = await this.inbound
      .createQueryBuilder()
      .insert()
      .values({ dedupeKey: dedupeKey.slice(0, 160), openid, msgType: (msg.MsgType ?? '').slice(0, 20), event: msg.Event?.slice(0, 30) ?? null })
      .orIgnore()
      .returning(['id'])
      .execute();
    if (!inserted.raw.length) return 'success'; // Renvoi par WeChat d'un message déjà traité.

    // Toute action du membre ouvre la fenêtre de 48 h des messages de service.
    await this.links.update({ openid }, { lastInteractionAt: new Date() });

    let reply: string | null = null;
    try {
      reply = await this.dispatch(openid, msg);
    } catch (err) {
      this.logger.warn(`Message WeChat non traité : ${(err as Error).message}`);
      reply = '⚠️ Une erreur est survenue, votre message n’a pas été transmis. Réessayez ou utilisez QIAO.';
    }
    // Messages en attente (reçus hors fenêtre) : transmis maintenant que la fenêtre est ouverte.
    setTimeout(() => void this.flush(openid).catch((err) => this.logger.warn(`Envoi différé : ${(err as Error).message}`)), 200);

    if (!reply) return 'success';
    const replyXml = textReply(openid, msg.ToUserName ?? '', reply);
    if (!encrypted || !this.cipher) return replyXml;
    const encryptedReply = this.cipher.encrypt(replyXml);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = randomBytes(8).toString('hex');
    return buildWechatXml({
      Encrypt: encryptedReply,
      MsgSignature: wechatSignature(this.token, timestamp, nonce, encryptedReply),
      TimeStamp: Number(timestamp),
      Nonce: nonce,
    });
  }

  private async dispatch(openid: string, msg: Record<string, string>): Promise<string | null> {
    if (msg.MsgType === 'event') {
      const event = (msg.Event ?? '').toLowerCase();
      if (event === 'unsubscribe') {
        await this.links.update({ openid }, { status: 'unsubscribed' });
        return null;
      }
      if (event === 'subscribe' || event === 'scan') {
        if (event === 'subscribe') await this.links.update({ openid }, { status: 'active' });
        const scene = (msg.EventKey ?? '').replace(/^qrscene_/, '');
        if (scene.startsWith('bind_')) return this.bind(openid, scene.slice(5));
        return event === 'subscribe'
          ? 'Bienvenue sur le compte officiel QIAO.\n\nPour recevoir et envoyer vos messages QIAO ici, liez votre compte depuis QIAO : Community > Paramètres > WeChat.'
          : null;
      }
      return null;
    }
    if (msg.MsgType === 'text') return this.handleText(openid, msg.Content ?? '');
    return `Seuls les messages texte sont transmis à QIAO. Pour envoyer un fichier ou une image, utilisez le site : ${this.appUrl('community/messages')}`;
  }

  private async bind(openid: string, code: string): Promise<string> {
    const row = await this.codes.findOne({ where: { codeHash: hash(code) } });
    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      return 'Ce QR code de liaison a expiré ou a déjà servi. Générez-en un nouveau depuis QIAO (Community > Paramètres > WeChat).';
    }
    const user = await this.users.findOne({ where: { id: row.userId } });
    if (!user || user.status !== 'active') return 'Ce compte QIAO est indisponible pour le moment.';
    const taken = await this.links.findOne({ where: { openid } });
    if (taken && taken.userId !== user.id) {
      return 'Ce compte WeChat est déjà lié à un autre compte QIAO. Déliez-le depuis ce compte avant de le lier à nouveau.';
    }
    const claimed = await this.codes.update({ id: row.id, usedAt: IsNull() }, { usedAt: new Date() });
    if (!claimed.affected) return 'Ce QR code de liaison a déjà servi.';
    const previous = await this.links.findOne({ where: { userId: user.id } });
    await this.links.save(
      this.links.create({
        userId: user.id,
        openid,
        mode: this.api!.mode,
        status: 'active',
        relayMessages: previous?.relayMessages ?? true,
        relayAlerts: previous?.relayAlerts ?? true,
        lastInteractionAt: new Date(),
        replyConversationId: null,
        linkedAt: new Date(),
      }),
    );
    return `✅ WeChat lié au compte QIAO de ${user.fullName}.\n\nLes messages privés qui vous sont adressés sur QIAO arriveront ici : répondez simplement pour répondre à votre correspondant. Vos réponses sont enregistrées dans la conversation QIAO.\n\nTapez « aide » pour les commandes.`;
  }

  private async handleText(openid: string, raw: string): Promise<string> {
    const link = await this.activeLink({ openid });
    if (!link) return 'Ce compte WeChat n’est pas lié à QIAO. Liez-le depuis QIAO : Community > Paramètres > WeChat.';
    const user = await this.users.findOne({ where: { id: link.userId } });
    if (!user) return 'Compte QIAO introuvable.';
    const text = raw.trim();
    const command = text.toLowerCase();

    if (['aide', 'help', '?', '帮助'].includes(command)) return HELP;
    if (command === 'stop') {
      await this.links.update({ userId: user.id }, { relayMessages: false });
      return 'Réception des messages QIAO suspendue sur WeChat. Tapez « start » pour la reprendre.';
    }
    if (command === 'start') {
      await this.links.update({ userId: user.id }, { relayMessages: true });
      return 'Réception des messages QIAO réactivée sur WeChat.';
    }

    const { items } = await this.messaging.list(user);
    if (['liste', 'list', '列表'].includes(command)) {
      if (!items.length) return 'Aucune conversation QIAO pour le moment.';
      return [
        'Vos conversations récentes :',
        ...items.slice(0, 8).map((c) => `#${c.id.slice(0, 6)} · ${c.other?.fullName ?? 'Membre'}${c.unread ? ` (${c.unread} non lu${c.unread > 1 ? 's' : ''})` : ''}`),
        '',
        'Écrivez « #code votre message » pour répondre dans une conversation.',
      ].join('\n');
    }

    let conversationId = link.replyConversationId;
    let body = text;
    const targeted = /^#([0-9a-f]{4,8})\s+([\s\S]+)$/i.exec(text);
    if (targeted) {
      const match = items.find((c) => c.id.startsWith(targeted[1].toLowerCase()));
      if (!match) return `Conversation #${targeted[1]} introuvable. Tapez « liste » pour voir vos conversations.`;
      conversationId = match.id;
      body = targeted[2].trim();
    }
    if (!conversationId) return 'Aucune conversation en cours. Tapez « liste » pour choisir une conversation, puis « #code votre message ».';
    if (!body) return 'Votre message est vide.';
    if ([...body].length > 4000) return 'Message trop long (4000 caractères maximum).';

    try {
      await this.messaging.send(user, conversationId, body, 'wechat');
    } catch (err) {
      return `⚠️ Message non envoyé : ${(err as Error).message}`;
    }
    await this.links.update({ userId: user.id }, { replyConversationId: conversationId });
    const other = items.find((c) => c.id === conversationId)?.other?.fullName;
    return `✓ Envoyé${other ? ` à ${other}` : ''} sur QIAO.`;
  }

  // --- Relais sortant ------------------------------------------------------------------------------

  private async relayMessage(event: PlatformEventMap['message.sent']) {
    const link = await this.activeLink({ userId: event.recipientId });
    if (!link || !link.relayMessages) return;
    const code = event.conversationId.slice(0, 6);
    const row = await this.outbox.save(
      this.outbox.create({
        userId: link.userId,
        openid: link.openid,
        kind: 'message',
        conversationId: event.conversationId,
        content: `💬 ${event.authorName}\n${truncate(event.body, 1200)}\n\n↩️ Répondez ici pour lui répondre (conversation #${code}).`,
        title: truncate(`Message de ${event.authorName}`, 20),
        summary: truncate(event.body.replace(/\s+/g, ' '), 20),
        url: this.appUrl(`community/messages/${event.conversationId}`),
      }),
    );
    await this.deliver(row, link);
  }

  private async relayAlert(event: PlatformEventMap['notification.created']) {
    const link = await this.activeLink({ userId: event.userId });
    if (!link || !link.relayAlerts) return;
    // Le message privé lui-même est transmis : inutile d'envoyer aussi l'alerte « nouveau message ».
    if (event.kind === 'message' && link.relayMessages) return;
    const url = this.appUrl(event.link);
    const row = await this.outbox.save(
      this.outbox.create({
        userId: link.userId,
        openid: link.openid,
        kind: 'alert',
        conversationId: null,
        content: `🔔 ${event.title}\n${truncate(event.body, 600)}\n\n${url}`,
        title: truncate(event.title, 20),
        summary: truncate(event.body.replace(/\s+/g, ' '), 20),
        url,
      }),
    );
    await this.deliver(row, link);
  }

  private windowOpen(link: WechatLink) {
    return !!link.lastInteractionAt && link.lastInteractionAt.getTime() > Date.now() - WINDOW_MS + 60_000;
  }

  private async deliver(row: WechatOutbox, link: WechatLink) {
    const api = this.api;
    if (!api) return;
    if (this.windowOpen(link)) {
      try {
        await api.sendText(row.openid, row.content);
        await this.markSent(row);
        return;
      } catch (err) {
        if (!(err instanceof WechatApiError && err.outsideWindow)) {
          await this.outbox.update(row.id, { status: 'failed', attempts: row.attempts + 1, error: (err as Error).message.slice(0, 300) });
          this.logger.warn(`Message WeChat non transmis : ${(err as Error).message}`);
          return;
        }
      }
    }
    // Hors fenêtre de 48 h : en attente de la prochaine action du membre, annoncée par une notification modèle
    // (une seule par conversation tant que les messages précédents n'ont pas été transmis).
    await this.outbox.update(row.id, { status: 'waiting' });
    const alreadyAnnounced =
      row.kind === 'message' &&
      (await this.outbox.exists({
        where: { userId: row.userId, conversationId: row.conversationId!, status: 'waiting', templateSentAt: Not(IsNull()) },
      }));
    if (alreadyAnnounced) return;
    try {
      await api.sendTemplate(row.openid, { title: row.title, summary: row.summary, time: row.createdAt, url: row.url });
      await this.outbox.update(row.id, { templateSentAt: new Date() });
    } catch (err) {
      this.logger.warn(`Notification modèle WeChat non envoyée : ${(err as Error).message}`);
    }
  }

  private async markSent(row: WechatOutbox) {
    // Le contenu n'est conservé que le temps de la transmission.
    await this.outbox.update(row.id, { status: 'sent', sentAt: new Date(), content: '', attempts: row.attempts + 1, error: null });
    if (row.kind === 'message' && row.conversationId) {
      await this.links.update({ userId: row.userId }, { replyConversationId: row.conversationId });
    }
  }

  /** Transmet les messages en attente dès que le membre a agi (fenêtre de 48 h ouverte). */
  async flush(openid: string) {
    const link = await this.activeLink({ openid });
    if (!link || !this.api) return;
    const rows = await this.outbox.find({
      where: [
        { userId: link.userId, status: 'waiting' },
        { userId: link.userId, status: 'failed', attempts: In([0, 1, 2]) },
      ],
      order: { createdAt: 'ASC' },
      take: 20,
    });
    for (const row of rows) {
      if (!row.content) continue;
      if ((row.kind === 'message' && !link.relayMessages) || (row.kind === 'alert' && !link.relayAlerts)) continue;
      try {
        await this.api.sendText(row.openid, row.content);
        await this.markSent(row);
      } catch (err) {
        if (err instanceof WechatApiError && err.outsideWindow) break;
        await this.outbox.update(row.id, { status: 'failed', attempts: row.attempts + 1, error: (err as Error).message.slice(0, 300) });
      }
    }
  }
}

/** Jeton du serveur de messages du simulateur (dérivé du secret de l'application). */
export function simulatorToken(config: ConfigService) {
  return hash(`qiao-wechat-sim:${config.get<string>('JWT_SECRET', 'qiao-dev-secret')}`).slice(0, 32);
}
