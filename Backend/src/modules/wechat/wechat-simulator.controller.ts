import { Body, Controller, Get, Inject, NotFoundException, Post, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { WechatApi } from './wechat.api';
import { WechatLink, WechatSimMessage } from './wechat.entities';
import { buildWechatXml, parseWechatXml, wechatSignature } from './wechat.protocol';
import { WECHAT_API, simulatorToken } from './wechat.service';

class SimulatorInputDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  scene?: string;
}

const COOKIE = 'qiao_wx_sim';
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/**
 * Simulateur du compte officiel WeChat QIAO (développement uniquement, sans compte de service) :
 * un « téléphone WeChat » par navigateur, qui scanne le QR code de liaison et converse avec le compte officiel.
 * Les messages sont signés et envoyés au vrai point d'entrée /api/wechat/oa/callback, comme le ferait WeChat.
 */
@Controller('wechat/simulator')
export class WechatSimulatorController {
  private readonly token: string;
  private readonly port: number;

  constructor(
    @Inject(WECHAT_API) private readonly api: WechatApi | null,
    @InjectRepository(WechatSimMessage) private readonly sim: Repository<WechatSimMessage>,
    @InjectRepository(WechatLink) private readonly links: Repository<WechatLink>,
    @InjectRepository(User) private readonly users: Repository<User>,
    config: ConfigService,
  ) {
    this.token = simulatorToken(config);
    this.port = Number(config.get<string>('PORT', '4000'));
  }

  private assertMock() {
    if (this.api?.mode !== 'mock') throw new NotFoundException();
  }

  /** Identité WeChat simulée de ce navigateur (openid du compte officiel). */
  private identity(req: Request, res: Response, renew = false): string {
    const cookies = Object.fromEntries((req.headers.cookie ?? '').split(';').map((c) => c.trim().split('=') as [string, string]));
    let openid = renew ? '' : cookies[COOKIE] ?? '';
    if (!/^sim_[0-9a-f]{20}$/.test(openid)) {
      openid = `sim_${randomBytes(10).toString('hex')}`;
      res.cookie(COOKIE, openid, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 30 * 86_400_000 });
    }
    return openid;
  }

  /** Envoie un message ou événement signé au serveur de messages QIAO et enregistre la réponse passive. */
  private async push(openid: string, fields: Record<string, string | number>) {
    const now = Math.floor(Date.now() / 1000);
    const xml = buildWechatXml({ ToUserName: 'gh_qiao_simulateur', FromUserName: openid, CreateTime: now, ...fields });
    const nonce = randomBytes(6).toString('hex');
    const query = new URLSearchParams({ signature: wechatSignature(this.token, String(now), nonce), timestamp: String(now), nonce, openid });
    const res = await fetch(`http://127.0.0.1:${this.port}/api/wechat/oa/callback?${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: xml,
    });
    const text = await res.text();
    const content = !res.ok ? `[Erreur ${res.status}] ${text.slice(0, 200)}` : text === 'success' ? null : parseWechatXml(text).Content ?? null;
    if (content) await this.sim.insert({ openid, direction: 'out', kind: 'reply', content });
  }

  private async feed(openid: string) {
    const [messages, link] = await Promise.all([
      this.sim.find({ where: { openid }, order: { createdAt: 'ASC' }, take: 200 }),
      this.links.findOne({ where: { openid, mode: 'mock' } }),
    ]);
    const user = link ? await this.users.findOne({ where: { id: link.userId }, select: { id: true, fullName: true } }) : null;
    return {
      openid,
      linkedTo: user && link?.status === 'active' ? user.fullName : null,
      messages: messages.map((m) => ({ id: m.id, direction: m.direction, kind: m.kind, content: m.content, url: m.url, createdAt: m.createdAt })),
    };
  }

  @Get('feed')
  async feedJson(@Req() req: Request, @Res() res: Response) {
    this.assertMock();
    res.setHeader('Cache-Control', 'no-store');
    res.json(await this.feed(this.identity(req, res)));
  }

  @Post('send')
  async send(@Body() dto: SimulatorInputDto, @Req() req: Request, @Res() res: Response) {
    this.assertMock();
    const openid = this.identity(req, res);
    const content = dto.content?.trim();
    if (content) {
      await this.sim.insert({ openid, direction: 'in', kind: 'text', content });
      await this.push(openid, { MsgType: 'text', Content: content, MsgId: Date.now() * 1000 + Math.floor(Math.random() * 1000) });
    }
    res.redirect(303, '/api/wechat/simulator');
  }

  @Post('scan')
  async scan(@Body() dto: SimulatorInputDto, @Req() req: Request, @Res() res: Response) {
    this.assertMock();
    const openid = this.identity(req, res);
    const scene = dto.scene ?? '';
    // Premier contact : abonnement au compte officiel ; sinon simple scan.
    const following = await this.sim.exists({ where: { openid, direction: 'in' } });
    await this.sim.insert({ openid, direction: 'in', kind: 'event', content: following ? 'QR code scanné' : 'Abonnement au compte officiel QIAO (scan)' });
    await this.push(openid, following ? { MsgType: 'event', Event: 'SCAN', EventKey: scene } : { MsgType: 'event', Event: 'subscribe', EventKey: `qrscene_${scene}` });
    res.redirect(303, '/api/wechat/simulator');
  }

  @Post('reset')
  reset(@Req() req: Request, @Res() res: Response) {
    this.assertMock();
    this.identity(req, res, true);
    res.redirect(303, '/api/wechat/simulator');
  }

  @Get()
  async page(@Query('scene') scene: string | undefined, @Req() req: Request, @Res() res: Response) {
    this.assertMock();
    const openid = this.identity(req, res);
    const data = await this.feed(openid);
    const nonce = randomBytes(12).toString('base64');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; base-uri 'none'`);
    const sceneValid = scene && /^bind_[0-9a-f]{32}$/.test(scene);
    res.send(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WeChat — simulation QIAO</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"PingFang SC",sans-serif;background:#e2e8f0;display:flex;justify-content:center;padding:16px}
.phone{width:100%;max-width:420px;background:#ededed;border-radius:28px;overflow:hidden;box-shadow:0 20px 50px -20px rgba(15,23,42,.45);display:flex;flex-direction:column;height:calc(100vh - 32px);min-height:560px}
.top{background:#ededed;padding:14px 16px;border-bottom:1px solid #d6d6d6;text-align:center}
.top b{font-size:15px}.top small{display:block;color:#64748b;font-size:11px;margin-top:2px}
.badge{display:inline-block;font-size:10px;font-weight:700;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:999px;padding:2px 8px;margin-top:6px}
.scan{margin:12px;background:#fff;border-radius:14px;padding:12px;font-size:13px;border:1px solid #07c160}
.scan button{width:100%;margin-top:8px;background:#07c160;color:#fff;border:0;border-radius:10px;padding:10px;font-weight:700;cursor:pointer}
#feed{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
.row{display:flex}.row.in{justify-content:flex-end}
.bubble{max-width:80%;padding:9px 12px;border-radius:10px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word;background:#fff}
.row.in .bubble{background:#95ec69}
.event{align-self:center;font-size:11px;color:#64748b;background:#dcdcdc;border-radius:6px;padding:3px 8px}
.card{background:#fff;border-radius:10px;padding:10px 12px;max-width:85%;font-size:13px;border-left:4px solid #07c160}
.card span{display:block;font-size:10px;color:#64748b;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em}
.card a{display:block;margin-top:6px;color:#576b95;font-size:12px}
form.send{display:flex;gap:8px;padding:10px;background:#f7f7f7;border-top:1px solid #d6d6d6}
form.send input{flex:1;border:0;border-radius:8px;padding:10px;font-size:14px}
form.send button{background:#07c160;color:#fff;border:0;border-radius:8px;padding:0 14px;font-weight:700;cursor:pointer}
.foot{display:flex;justify-content:space-between;align-items:center;padding:6px 12px 10px;background:#f7f7f7;font-size:10px;color:#94a3b8}
.foot button{background:none;border:0;color:#64748b;text-decoration:underline;cursor:pointer;font-size:10px}
</style></head><body><div class="phone">
<div class="top"><b>QIAO 桥 · compte officiel</b><small id="who">${escapeHtml(data.linkedTo ? `Lié au compte QIAO de ${data.linkedTo}` : 'WeChat non lié à un compte QIAO')}</small><span class="badge">Simulation WeChat — développement</span></div>
${sceneValid ? `<form class="scan" method="post" action="/api/wechat/simulator/scan"><input type="hidden" name="scene" value="${escapeHtml(scene!)}"><b>QR code de liaison QIAO</b><br>Scannez-le avec ce téléphone simulé pour lier le compte WeChat à votre compte QIAO.<button>Scanner le QR code</button></form>` : ''}
<div id="feed"></div>
<form class="send" method="post" action="/api/wechat/simulator/send"><input name="content" placeholder="Message au compte officiel QIAO…" autocomplete="off" autofocus><button>Envoyer</button></form>
<div class="foot"><span>openid simulé : ${escapeHtml(openid)}</span><form method="post" action="/api/wechat/simulator/reset"><button>Autre téléphone</button></form></div>
</div>
<script nonce="${nonce}">
const feed=document.getElementById('feed');const who=document.getElementById('who');let last='';
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function render(data){const key=JSON.stringify(data.messages.map(m=>m.id));if(key===last)return;last=key;feed.replaceChildren();
for(const m of data.messages){if(m.kind==='event'){feed.append(el('div','event',m.content));continue}
if(m.kind==='template'){const c=el('div','card');c.append(el('span','', 'Notification de service'));c.append(document.createTextNode(m.content));if(m.url){const a=el('a','', 'Voir sur QIAO ›');a.href=m.url;a.target='_blank';c.append(a)}const r=el('div','row out');r.append(c);feed.append(r);continue}
const r=el('div','row '+m.direction);r.append(el('div','bubble',m.content));feed.append(r)}
feed.scrollTop=feed.scrollHeight;who.textContent=data.linkedTo?'Lié au compte QIAO de '+data.linkedTo:'WeChat non lié à un compte QIAO'}
render(${JSON.stringify(data).replace(/</g, '\\u003c')});
setInterval(()=>fetch('/api/wechat/simulator/feed',{credentials:'same-origin'}).then(r=>r.json()).then(render).catch(()=>{}),2500);
</script></body></html>`);
  }
}
