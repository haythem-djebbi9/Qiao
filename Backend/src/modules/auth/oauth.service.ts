import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { ActivityService } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { AuthIdentity } from './auth.entities';
import { OAuthCompleteDto, OAuthLinkExistingDto } from './auth.dto';
import { AuthService, RequestContext } from './auth.service';
import { TicketsService } from './tickets.service';

export type ExternalProvider = 'wechat' | 'facebook';
export const EXTERNAL_PROVIDERS: ExternalProvider[] = ['wechat', 'facebook'];

/** Profil renvoyé par le fournisseur après authentification. */
interface ExternalProfile {
  subject: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

const PROVIDER_LABELS: Record<ExternalProvider, string> = { wechat: 'WeChat', facebook: 'Facebook' };
// Sans numéro de version : Meta sert la version courante de l'application, qui ne périme jamais.
const FACEBOOK_GRAPH = 'https://graph.facebook.com';
const STATE_TTL_MS = 10 * 60_000;
const LOGIN_CODE_TTL_MS = 2 * 60_000;
const PENDING_TTL_MS = 30 * 60_000;
export const OAUTH_NONCE_COOKIE = 'qiao_oauth_nonce';

/**
 * Connexion via WeChat (QR Connect, Open Platform) et Facebook Login (OAuth 2.0).
 * Le fournisseur ne fait qu'authentifier : le compte, le profil et les droits restent ceux du compte QIAO.
 * Une identité inconnue n'est jamais fusionnée automatiquement avec un compte existant, même si l'e-mail correspond.
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger('OAuth');

  constructor(
    @InjectRepository(AuthIdentity) private readonly identities: Repository<AuthIdentity>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly tickets: TicketsService,
    private readonly authService: AuthService,
    private readonly activity: ActivityService,
  ) {}

  // --- Configuration ---------------------------------------------------------------

  private credentials(provider: ExternalProvider) {
    const prefix = provider === 'wechat' ? 'WECHAT' : 'FACEBOOK';
    const id = this.config.get<string>(`${prefix}_APP_ID`);
    const secret = this.config.get<string>(`${prefix}_APP_SECRET`);
    return id && secret ? { id, secret } : null;
  }

  /** Simulateur local des fournisseurs (OAUTH_MOCK=true), jamais actif en production. */
  get mockEnabled() {
    return this.config.get<string>('OAUTH_MOCK') === 'true' && process.env.NODE_ENV !== 'production';
  }

  providers() {
    return EXTERNAL_PROVIDERS.map((provider) => ({
      id: provider,
      name: PROVIDER_LABELS[provider],
      enabled: !!this.credentials(provider) || this.mockEnabled,
      mode: this.credentials(provider) ? 'live' : this.mockEnabled ? 'simulation' : 'disabled',
    }));
  }

  assertProvider(provider: string): ExternalProvider {
    if (!EXTERNAL_PROVIDERS.includes(provider as ExternalProvider)) throw new NotFoundException('Fournisseur inconnu.');
    const typed = provider as ExternalProvider;
    if (!this.credentials(typed) && !this.mockEnabled) {
      throw new BadRequestException(`La connexion ${PROVIDER_LABELS[typed]} n'est pas encore configurée sur cette plateforme.`);
    }
    return typed;
  }

  private callbackUrl(provider: ExternalProvider) {
    return `${this.authService.publicUrl}/api/auth/oauth/${provider}/callback`;
  }

  /** Destination de retour : chemin relatif uniquement (pas de redirection ouverte). */
  private safeReturnTo(returnTo?: string) {
    return returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/?tab=community';
  }

  redirectWith(returnTo: string, params: Record<string, string>) {
    const url = new URL(this.safeReturnTo(returnTo), this.authService.publicUrl);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
  }

  // --- Démarrage -----------------------------------------------------------------

  /** Autorise la liaison d'un fournisseur au compte connecté (le navigateur suit ensuite une redirection sans en-tête). */
  async createLinkTicket(user: User, provider: string) {
    this.assertProvider(provider);
    return { ticket: await this.tickets.issue('link', { userId: user.id, provider }, STATE_TTL_MS) };
  }

  /** Prépare la redirection vers le fournisseur. Renvoie l'URL et le nonce à poser en cookie. */
  async start(providerParam: string, options: { linkTicket?: string; returnTo?: string }) {
    const provider = this.assertProvider(providerParam);
    let userId: string | null = null;
    if (options.linkTicket) {
      const payload = await this.tickets.consume('link', options.linkTicket);
      if (payload.provider !== provider) throw new BadRequestException('Demande de liaison invalide.');
      userId = payload.userId;
    }
    const nonce = randomBytes(16).toString('hex');
    const state = await this.tickets.issue(
      'state',
      { provider, intent: userId ? 'link' : 'login', userId, returnTo: this.safeReturnTo(options.returnTo), nonce },
      STATE_TTL_MS,
    );
    return { url: this.authorizeUrl(provider, state), nonce };
  }

  private authorizeUrl(provider: ExternalProvider, state: string) {
    const credentials = this.credentials(provider);
    if (!credentials) {
      return `${this.authService.publicUrl}/api/auth/oauth/mock/${provider}/authorize?state=${state}`;
    }
    const redirectUri = encodeURIComponent(this.callbackUrl(provider));
    if (provider === 'wechat') {
      return (
        `https://open.weixin.qq.com/connect/qrconnect?appid=${credentials.id}&redirect_uri=${redirectUri}` +
        `&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`
      );
    }
    return (
      `https://www.facebook.com/dialog/oauth?client_id=${credentials.id}&redirect_uri=${redirectUri}` +
      `&state=${state}&response_type=code&scope=email,public_profile`
    );
  }

  // --- Retour du fournisseur -------------------------------------------------------

  /** Traite le retour du fournisseur et renvoie l'URL du site vers laquelle rediriger le navigateur. */
  async callback(providerParam: string, query: { code?: string; state?: string; error?: string }, nonceCookie: string | undefined) {
    let returnTo = '/?tab=community';
    try {
      const provider = this.assertProvider(providerParam);
      if (!query.state) throw new OAuthFlowError('state');
      const state = await this.tickets.consume('state', query.state).catch(() => {
        throw new OAuthFlowError('expired');
      });
      returnTo = state.returnTo;
      if (state.provider !== provider || !nonceCookie || nonceCookie !== state.nonce) throw new OAuthFlowError('state');
      if (query.error || !query.code) throw new OAuthFlowError('cancelled');

      const profile = await this.fetchProfile(provider, query.code);
      const identity = await this.identities.findOne({
        where: { provider, providerSubject: profile.subject, status: 'active' },
        relations: { user: true },
      });

      if (state.intent === 'link') {
        if (identity && identity.user.id !== state.userId) {
          await this.activity.record('link_error', state.userId, { type: 'provider', id: provider });
          throw new OAuthFlowError('link_conflict');
        }
        if (!identity) {
          await this.identities.save(
            this.identities.create({
              user: { id: state.userId } as User,
              provider,
              providerSubject: profile.subject,
              displayName: profile.name,
              providerEmail: profile.email,
            }),
          );
        }
        return this.redirectWith(returnTo, { oauth_linked: provider });
      }

      if (identity) {
        const code = await this.tickets.issue('login', { userId: identity.user.id, provider }, LOGIN_CODE_TTL_MS);
        return this.redirectWith(returnTo, { oauth_code: code });
      }

      // Identité inconnue : création d'un compte ou liaison sécurisée à un compte existant, au choix de l'utilisateur.
      const pending = await this.tickets.issue('pending', { provider, ...profile }, PENDING_TTL_MS);
      return this.redirectWith(returnTo, { oauth_pending: pending });
    } catch (err) {
      const code = err instanceof OAuthFlowError ? err.code : 'provider';
      if (!(err instanceof OAuthFlowError)) this.logger.warn(`Échec OAuth ${providerParam} : ${(err as Error).message}`);
      await this.activity.record('auth_failure', null, { type: 'provider', id: providerParam });
      return this.redirectWith(returnTo, { oauth_error: code });
    }
  }

  private async fetchProfile(provider: ExternalProvider, code: string): Promise<ExternalProfile> {
    if (code.startsWith('mock-')) {
      if (!this.mockEnabled) throw new OAuthFlowError('provider');
      const data = JSON.parse(Buffer.from(code.slice(5), 'base64url').toString('utf8'));
      return {
        subject: `mock-${String(data.subject).slice(0, 80)}`,
        name: String(data.name || `Utilisateur ${PROVIDER_LABELS[provider]}`).slice(0, 120),
        email: provider === 'facebook' && data.email ? String(data.email).slice(0, 160) : null,
        avatarUrl: null,
      };
    }
    const credentials = this.credentials(provider);
    if (!credentials) throw new OAuthFlowError('provider');

    if (provider === 'wechat') {
      const token = await getJson(
        `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${credentials.id}&secret=${credentials.secret}` +
          `&code=${encodeURIComponent(code)}&grant_type=authorization_code`,
      );
      if (!token.access_token || !token.openid) throw new Error(`WeChat token: ${token.errmsg ?? 'réponse invalide'}`);
      const info = await getJson(
        `https://api.weixin.qq.com/sns/userinfo?access_token=${token.access_token}&openid=${token.openid}`,
      );
      return {
        // unionid est stable pour toutes les applications de l'entreprise ; openid sinon.
        subject: String(info.unionid ?? token.unionid ?? token.openid),
        name: String(info.nickname ?? 'Utilisateur WeChat'),
        email: null,
        avatarUrl: typeof info.headimgurl === 'string' && info.headimgurl.startsWith('https://') ? info.headimgurl : null,
      };
    }

    const token = await getJson(
      `${FACEBOOK_GRAPH}/oauth/access_token?client_id=${credentials.id}&client_secret=${credentials.secret}` +
        `&redirect_uri=${encodeURIComponent(this.callbackUrl(provider))}&code=${encodeURIComponent(code)}`,
    );
    if (!token.access_token) throw new Error(`Facebook token: ${token.error?.message ?? 'réponse invalide'}`);
    const me = await getJson(
      `${FACEBOOK_GRAPH}/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(token.access_token)}`,
    );
    if (!me.id) throw new Error('Facebook: profil invalide');
    return {
      subject: String(me.id),
      name: String(me.name ?? 'Utilisateur Facebook'),
      email: typeof me.email === 'string' ? me.email.toLowerCase() : null,
      avatarUrl: me.picture?.data?.url ?? null,
    };
  }

  // --- Finalisation côté site ------------------------------------------------------

  async exchange(code: string, ctx: RequestContext) {
    const payload = await this.tickets.consume('login', code, 'Connexion expirée. Recommencez.');
    const user = await this.users.findOne({ where: { id: payload.userId } });
    if (!user) throw new BadRequestException('Compte introuvable.');
    return this.authService.createSession(user, payload.provider, ctx);
  }

  async pendingInfo(ticket: string) {
    const { payload } = await this.tickets.peek('pending', ticket, 'Connexion expirée. Recommencez depuis WeChat ou Facebook.');
    return {
      provider: payload.provider as ExternalProvider,
      providerName: PROVIDER_LABELS[payload.provider as ExternalProvider],
      name: payload.name as string,
      email: payload.email as string | null,
      avatarUrl: payload.avatarUrl as string | null,
    };
  }

  /** Nouveau compte QIAO créé à partir de l'identité externe. Refusé si l'e-mail appartient déjà à un compte. */
  async completeSignup(dto: OAuthCompleteDto, ctx: RequestContext) {
    const { payload } = await this.tickets.peek('pending', dto.ticket);
    const email = dto.email.trim().toLowerCase();
    if (await this.users.exist({ where: { email } })) {
      await this.activity.record('link_error', null, { type: 'provider', id: payload.provider });
      throw new ConflictException(
        `Un compte QIAO existe déjà avec cet e-mail. Choisissez « J'ai déjà un compte » et confirmez votre mot de passe pour y lier ${PROVIDER_LABELS[payload.provider as ExternalProvider]}.`,
      );
    }
    await this.assertSubjectFree(payload.provider, payload.subject);
    await this.tickets.consume('pending', dto.ticket);
    const user = await this.authService.createAccount({
      fullName: dto.fullName,
      email,
      passwordHash: null,
      company: dto.company,
      accountType: dto.accountType,
      origin: dto.origin,
      avatarUrl: payload.avatarUrl,
    });
    await this.identities.save(
      this.identities.create({
        user,
        provider: payload.provider,
        providerSubject: payload.subject,
        displayName: payload.name,
        providerEmail: payload.email,
      }),
    );
    return this.authService.createSession(user, payload.provider, ctx);
  }

  /** Liaison à un compte existant : uniquement après vérification du mot de passe de ce compte. */
  async linkExisting(dto: OAuthLinkExistingDto, ctx: RequestContext) {
    const { payload } = await this.tickets.peek('pending', dto.ticket);
    const user = await this.authService.verifyPassword(dto.email.trim().toLowerCase(), dto.password).catch(async (err) => {
      await this.activity.record('link_error', null, { type: 'provider', id: payload.provider });
      throw err;
    });
    await this.assertSubjectFree(payload.provider, payload.subject);
    await this.tickets.consume('pending', dto.ticket);
    await this.identities.save(
      this.identities.create({
        user: { id: user.id } as User,
        provider: payload.provider,
        providerSubject: payload.subject,
        displayName: payload.name,
        providerEmail: payload.email,
      }),
    );
    return this.authService.createSession(user, payload.provider, ctx);
  }

  private async assertSubjectFree(provider: ExternalProvider, subject: string) {
    if (await this.identities.exist({ where: { provider, providerSubject: subject } })) {
      throw new ConflictException('Cette identité est déjà liée à un compte QIAO. Connectez-vous directement.');
    }
  }

  // --- Simulateur (développement) ----------------------------------------------------

  mockPage(provider: string, state: string) {
    const typed = this.assertProvider(provider);
    if (!this.mockEnabled) throw new NotFoundException();
    const label = PROVIDER_LABELS[typed];
    const color = typed === 'wechat' ? '#07c160' : '#1877f2';
    const escape = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${label} — simulateur QIAO</title>
<style>body{font-family:system-ui,sans-serif;background:#f1f5f9;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px}
form{background:#fff;border-radius:20px;padding:28px;max-width:380px;width:100%;box-shadow:0 20px 50px rgba(15,23,42,.15)}
h1{font-size:18px;margin:0 0 4px;color:${color}}p{font-size:12px;color:#64748b;margin:0 0 18px;line-height:1.5}
label{display:block;font-size:12px;font-weight:600;color:#334155;margin:12px 0 4px}input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;font-size:14px}
button{margin-top:20px;width:100%;padding:12px;border:0;border-radius:10px;background:${color};color:#fff;font-weight:700;font-size:14px;cursor:pointer}
a{display:block;text-align:center;margin-top:12px;font-size:12px;color:#64748b}</style></head><body>
<form method="post" action="/api/auth/oauth/mock/${typed}/authorize">
<h1>Connexion ${label} (simulation)</h1>
<p>Environnement de développement : ce formulaire remplace la page officielle ${label}. Le même identifiant renvoie toujours la même identité ${label}.</p>
<input type="hidden" name="state" value="${escape(state)}">
<label>Identifiant ${label}</label><input name="subject" required value="${typed}-demo-001">
<label>Nom affiché</label><input name="name" required value="Utilisateur ${label}">
${typed === 'facebook' ? '<label>E-mail (fourni par Facebook)</label><input name="email" type="email" value="">' : ''}
<button type="submit">Autoriser QIAO</button>
<a href="/api/auth/oauth/${typed}/callback?state=${escape(state)}&error=access_denied">Annuler</a>
</form></body></html>`;
  }

  mockAuthorize(provider: string, body: { state?: string; subject?: string; name?: string; email?: string }) {
    const typed = this.assertProvider(provider);
    if (!this.mockEnabled || !body.state || !body.subject) throw new NotFoundException();
    const code = `mock-${Buffer.from(JSON.stringify({ subject: body.subject, name: body.name, email: body.email })).toString('base64url')}`;
    return `/api/auth/oauth/${typed}/callback?state=${encodeURIComponent(body.state)}&code=${encodeURIComponent(code)}`;
  }
}

class OAuthFlowError extends Error {
  constructor(public readonly code: 'state' | 'expired' | 'cancelled' | 'link_conflict' | 'provider') {
    super(code);
  }
}

async function getJson(url: string): Promise<any> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  return response.json();
}
