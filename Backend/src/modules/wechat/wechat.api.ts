import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { WechatMode, WechatSimMessage } from './wechat.entities';
import { truncate } from './wechat.protocol';

/** Erreur renvoyée par l'API du compte officiel (errcode WeChat). */
export class WechatApiError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(`WeChat ${code} : ${message}`);
  }

  /** Hors de la fenêtre de 48 h ou quota de messages de service atteint : il faut attendre une action du membre. */
  get outsideWindow() {
    return this.code === 45015 || this.code === 45047;
  }
}

export interface TemplateContent {
  title: string;
  summary: string;
  time: Date;
  url: string | null;
}

export interface WechatApi {
  readonly mode: WechatMode;
  /** QR code temporaire à paramètre (liaison d'un compte QIAO). */
  createBindQr(scene: string, ttlSeconds: number): Promise<{ imageUrl: string | null; simulatorUrl: string | null }>;
  /** Message de service (客服消息), possible dans les 48 h suivant une action du membre. */
  sendText(openid: string, content: string): Promise<void>;
  /** Notification modèle (模板消息), possible hors fenêtre de 48 h, contenu limité aux champs du modèle. */
  sendTemplate(openid: string, content: TemplateContent): Promise<void>;
}

const API = 'https://api.weixin.qq.com/cgi-bin';
export const WINDOW_MS = 48 * 60 * 60 * 1000;

/** Valeur d'un champ de notification modèle (20 caractères au plus pour les champs « thing »). */
function templateValue(source: 'title' | 'summary' | 'time', content: TemplateContent): string {
  if (source === 'time') {
    return content.time.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }).replace(/\//g, '-');
  }
  return truncate(source === 'title' ? content.title : content.summary, 20);
}

/** API réelle du compte officiel (compte de service vérifié). */
@Injectable()
export class LiveWechatApi implements WechatApi {
  readonly mode = 'live' as const;
  private readonly logger = new Logger('WechatApi');
  private token: { value: string; expiresAt: number } | null = null;
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly templateId: string | null;
  private readonly templateFields: [string, 'title' | 'summary' | 'time'][];

  constructor(config: ConfigService) {
    this.appId = config.get<string>('WECHAT_OA_APP_ID', '');
    this.appSecret = config.get<string>('WECHAT_OA_APP_SECRET', '');
    this.templateId = config.get<string>('WECHAT_OA_TEMPLATE_ID') || null;
    // Ex. « thing1:title,thing2:summary,time3:time » : champs du modèle choisi dans le back-office du compte officiel.
    this.templateFields = (config.get<string>('WECHAT_OA_TEMPLATE_FIELDS') || 'thing1:title,thing2:summary,time3:time')
      .split(',')
      .map((pair) => pair.trim().split(':') as [string, 'title' | 'summary' | 'time'])
      .filter(([key, source]) => key && ['title', 'summary', 'time'].includes(source));
  }

  /** Jeton d'accès stable (stable_token) : partagé sans s'invalider entre plusieurs instances. */
  private async accessToken(force = false): Promise<string> {
    if (!force && this.token && this.token.expiresAt > Date.now()) return this.token.value;
    const res = await fetch(`${API}/stable_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'client_credential', appid: this.appId, secret: this.appSecret, force_refresh: force }),
    });
    const json = (await res.json()) as { access_token?: string; expires_in?: number; errcode?: number; errmsg?: string };
    if (!json.access_token) throw new WechatApiError(json.errcode ?? -1, json.errmsg ?? 'jeton indisponible');
    this.token = { value: json.access_token, expiresAt: Date.now() + ((json.expires_in ?? 7200) - 300) * 1000 };
    return this.token.value;
  }

  private async call<T>(path: string, body: unknown, retry = true): Promise<T> {
    const token = await this.accessToken();
    const res = await fetch(`${API}/${path}?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as T & { errcode?: number; errmsg?: string };
    if (json.errcode && [40001, 40014, 42001].includes(json.errcode) && retry) {
      await this.accessToken(true);
      return this.call(path, body, false);
    }
    if (json.errcode) throw new WechatApiError(json.errcode, json.errmsg ?? 'erreur');
    return json;
  }

  async createBindQr(scene: string, ttlSeconds: number) {
    const result = await this.call<{ ticket: string }>('qrcode/create', {
      expire_seconds: ttlSeconds,
      action_name: 'QR_STR_SCENE',
      action_info: { scene: { scene_str: scene } },
    });
    return { imageUrl: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(result.ticket)}`, simulatorUrl: null };
  }

  async sendText(openid: string, content: string) {
    await this.call('message/custom/send', { touser: openid, msgtype: 'text', text: { content } });
  }

  async sendTemplate(openid: string, content: TemplateContent) {
    if (!this.templateId) throw new WechatApiError(-2, 'aucun modèle de notification configuré (WECHAT_OA_TEMPLATE_ID)');
    const data = Object.fromEntries(this.templateFields.map(([key, source]) => [key, { value: templateValue(source, content) }]));
    await this.call('message/template/send', { touser: openid, template_id: this.templateId, ...(content.url ? { url: content.url } : {}), data });
    this.logger.debug(`Notification modèle envoyée à ${openid.slice(0, 6)}…`);
  }
}

/**
 * Simulateur du compte officiel (développement) : les messages « envoyés » sont conservés pour la page de simulation,
 * avec la même règle de fenêtre de 48 h que WeChat (erreur 45015 hors fenêtre).
 */
@Injectable()
export class MockWechatApi implements WechatApi {
  readonly mode = 'mock' as const;

  constructor(@InjectRepository(WechatSimMessage) private readonly sim: Repository<WechatSimMessage>) {}

  async createBindQr(scene: string) {
    return { imageUrl: null, simulatorUrl: `/api/wechat/simulator?scene=${encodeURIComponent(scene)}` };
  }

  async sendText(openid: string, content: string) {
    const recent = await this.sim.exists({ where: { openid, direction: 'in', createdAt: MoreThan(new Date(Date.now() - WINDOW_MS)) } });
    if (!recent) throw new WechatApiError(45015, 'response out of time limit or subscription is canceled');
    await this.sim.insert({ openid, direction: 'out', kind: 'custom', content });
  }

  async sendTemplate(openid: string, content: TemplateContent) {
    await this.sim.insert({
      openid,
      direction: 'out',
      kind: 'template',
      content: `${templateValue('title', content)}\n${templateValue('summary', content)}\n${templateValue('time', content)}`,
      url: content.url,
    });
  }
}
