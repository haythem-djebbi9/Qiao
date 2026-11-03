import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsNull, Not, Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService, MailService, RateLimiter } from '../platform/platform.services';
import { toPublicUser, User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthIdentity, AuthProvider, UserSession } from './auth.entities';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './auth.dto';
import { TicketsService } from './tickets.service';

export const PROFILE_TITLES: Record<RegisterDto['accountType'], string> = {
  enterprise: 'Entreprise membre',
  expert: 'Professionnel',
  individual: 'Membre QIAO',
};

/** Contexte de la requête (journalisé dans la session, sans donnée sensible). */
export interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
}

/** Durée de vie glissante d'une session (renouvelée à chaque rafraîchissement du jeton). */
const SESSION_TTL_MS = 30 * 86_400_000;
const RESET_TTL_MS = 60 * 60_000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuthIdentity) private readonly identities: Repository<AuthIdentity>,
    @InjectRepository(UserSession) private readonly sessions: Repository<UserSession>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly usersService: UsersService,
    private readonly tickets: TicketsService,
    private readonly activity: ActivityService,
    private readonly rateLimiter: RateLimiter,
    private readonly mail: MailService,
  ) {}

  // --- Inscription / connexion ------------------------------------------------

  async register(dto: RegisterDto, ctx: RequestContext) {
    this.rateLimiter.hit(`register:${ctx.ip}`, 10, 60 * 60_000);
    const email = dto.email.trim().toLowerCase();
    if (await this.users.exist({ where: { email } })) {
      throw new ConflictException('Un compte existe déjà avec cette adresse e-mail.');
    }
    const user = await this.createAccount({
      fullName: dto.fullName,
      email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      company: dto.company,
      accountType: dto.accountType,
      origin: dto.origin,
    });
    await this.identities.save(
      this.identities.create({ user, provider: 'email', providerSubject: email, providerEmail: email, displayName: user.fullName }),
    );
    return this.createSession(user, 'email', ctx);
  }

  /** Crée le compte QIAO (identité unique) et ses notifications de bienvenue. */
  async createAccount(data: {
    fullName: string;
    email: string;
    passwordHash: string | null;
    company?: string | null;
    accountType: User['accountType'];
    origin: User['origin'];
    avatarUrl?: string | null;
  }) {
    const fullName = data.fullName.trim();
    const user = await this.users.save(
      this.users.create({
        fullName,
        email: data.email,
        passwordHash: data.passwordHash,
        handle: await this.usersService.generateHandle(fullName),
        company: data.company?.trim() || null,
        accountType: data.accountType,
        origin: data.origin,
        title: PROFILE_TITLES[data.accountType],
        location: data.origin === 'china' ? 'Chine' : 'Afrique du Nord',
        avatarUrl: data.avatarUrl ?? null,
        language: 'FR',
        termsAcceptedAt: new Date(),
      }),
    );
    await this.notifications.notify(
      user,
      'Bienvenue sur QIAO !',
      'Votre compte vous donne accès à QIAO Community : rejoignez des communautés, posez vos questions et trouvez des experts, sans inscription à une formation.',
      'welcome',
      'community',
    );
    await this.notifications.notify(
      user,
      'Complétez votre profil',
      'Ajoutez votre fonction, vos langues et vos secteurs pour être recommandé aux bons membres.',
      'info',
      'community/settings',
    );
    return user;
  }

  async login(dto: LoginDto, ctx: RequestContext) {
    const email = dto.email.trim().toLowerCase();
    this.rateLimiter.hit(`login:${ctx.ip}:${email}`, 8, 15 * 60_000, 'Trop de tentatives de connexion. Réessayez dans 15 minutes.');
    const user = await this.verifyPassword(email, dto.password);
    this.rateLimiter.reset(`login:${ctx.ip}:${email}`);
    return this.createSession(user, 'email', ctx);
  }

  /** Vérifie e-mail + mot de passe (connexion ou preuve de propriété avant liaison d'un compte). */
  async verifyPassword(email: string, password: string) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      await this.activity.record('auth_failure', user?.id ?? null, { type: 'provider', id: 'email' });
      throw new UnauthorizedException('E-mail ou mot de passe incorrect.');
    }
    await this.usersService.assertActive(user);
    return user;
  }

  // --- Sessions ------------------------------------------------------------------

  async createSession(user: User, provider: AuthProvider, ctx: RequestContext) {
    await this.usersService.assertActive(user);
    const now = new Date();
    const session = await this.sessions.save(
      this.sessions.create({
        user: { id: user.id } as User,
        provider,
        ip: ctx.ip?.slice(0, 60) ?? null,
        userAgent: ctx.userAgent?.slice(0, 200) ?? null,
        lastUsedAt: now,
        expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
      }),
    );
    await this.users.update(user.id, { lastLoginAt: now });
    return this.buildSession(user, session.id);
  }

  /** Renouvelle le jeton d'une session encore valide (expiration glissante). */
  async refresh(user: User, sessionId: string) {
    const session = await this.sessions.findOne({ where: { id: sessionId, revokedAt: IsNull() } });
    if (!session || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Session expirée. Veuillez vous reconnecter.');
    }
    session.expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    session.lastUsedAt = new Date();
    await this.sessions.save(session);
    return this.buildSession(user, session.id);
  }

  async logout(sessionId: string) {
    await this.sessions.update({ id: sessionId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { success: true };
  }

  async listSessions(user: User, currentSessionId: string) {
    const rows = await this.sessions.find({
      where: { user: { id: user.id }, revokedAt: IsNull() },
      order: { lastUsedAt: 'DESC' },
    });
    return rows
      .filter((session) => session.expiresAt.getTime() > Date.now())
      .map((session) => ({
        id: session.id,
        provider: session.provider,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        current: session.id === currentSessionId,
      }));
  }

  async revokeSession(user: User, sessionId: string) {
    const result = await this.sessions.update(
      { id: sessionId, user: { id: user.id }, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    if (!result.affected) throw new NotFoundException('Session introuvable.');
    return { success: true };
  }

  async revokeOtherSessions(user: User, currentSessionId: string | null) {
    await this.sessions.update(
      {
        user: { id: user.id },
        revokedAt: IsNull(),
        ...(currentSessionId ? { id: Not(currentSessionId) } : {}),
      },
      { revokedAt: new Date() },
    );
    return { success: true };
  }

  // --- Profil & sécurité ------------------------------------------------------------

  async me(user: User) {
    const [withHash, identities] = await Promise.all([
      this.users.createQueryBuilder('user').addSelect('user.passwordHash').where('user.id = :id', { id: user.id }).getOneOrFail(),
      this.listIdentities(user),
    ]);
    return { ...toPublicUser(user), hasPassword: !!withHash.passwordHash, identities };
  }

  async updateProfile(user: User, dto: UpdateProfileDto) {
    Object.assign(user, {
      ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
      ...(dto.company !== undefined && { company: dto.company.trim() || null }),
      ...(dto.title !== undefined && { title: dto.title.trim() || null }),
      ...(dto.location !== undefined && { location: dto.location.trim() || null }),
      ...(dto.language !== undefined && { language: dto.language }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl.trim() || null }),
    });
    await this.users.save(user);
    return this.me(user);
  }

  async changePassword(user: User, dto: ChangePasswordDto, sessionId: string | null) {
    const withHash = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: user.id })
      .getOneOrFail();
    if (withHash.passwordHash) {
      if (!dto.currentPassword || !(await bcrypt.compare(dto.currentPassword, withHash.passwordHash))) {
        throw new UnauthorizedException('Le mot de passe actuel est incorrect.');
      }
    }
    withHash.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.users.save(withHash);
    await this.ensureEmailIdentity(withHash);
    // Les autres appareils doivent se reconnecter avec le nouveau mot de passe.
    await this.revokeOtherSessions(user, sessionId);
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto, ctx: RequestContext) {
    const email = dto.email.trim().toLowerCase();
    this.rateLimiter.hit(`forgot:${ctx.ip}`, 5, 60 * 60_000);
    const user = await this.users.findOne({ where: { email } });
    if (user && user.status === 'active') {
      const secret = await this.tickets.issue('reset', { userId: user.id }, RESET_TTL_MS);
      const link = `${this.publicUrl}/?reset=${secret}`;
      await this.mail.send(
        user.email,
        'QIAO — Réinitialisation de votre mot de passe',
        `Bonjour ${user.fullName},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\nL'équipe QIAO`,
      );
    }
    // Réponse identique que le compte existe ou non (pas d'énumération des comptes).
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const payload = await this.tickets.consume('reset', dto.token, 'Lien de réinitialisation expiré ou déjà utilisé.');
    const user = await this.users.findOne({ where: { id: payload.userId } });
    if (!user) throw new BadRequestException('Compte introuvable.');
    await this.users
      .createQueryBuilder()
      .update(User)
      .set({ passwordHash: await bcrypt.hash(dto.password, 10) })
      .where('id = :id', { id: user.id })
      .execute();
    await this.ensureEmailIdentity(user);
    await this.revokeOtherSessions(user, null);
    await this.notifications.notify(user, 'Mot de passe modifié', 'Votre mot de passe a été réinitialisé. Toutes vos sessions ont été fermées.', 'info', null);
    return { success: true };
  }

  async acceptTerms(user: User) {
    user.termsAcceptedAt = new Date();
    await this.users.save(user);
    return this.me(user);
  }

  // --- Identités liées ------------------------------------------------------------

  async listIdentities(user: User) {
    const rows = await this.identities.find({ where: { user: { id: user.id }, status: 'active' }, order: { linkedAt: 'ASC' } });
    return rows.map((identity) => ({
      id: identity.id,
      provider: identity.provider,
      displayName: identity.displayName,
      linkedAt: identity.linkedAt,
    }));
  }

  async unlinkIdentity(user: User, identityId: string) {
    const identity = await this.identities.findOne({ where: { id: identityId, user: { id: user.id }, status: 'active' } });
    if (!identity) throw new NotFoundException('Méthode de connexion introuvable.');
    if (identity.provider === 'email') {
      throw new BadRequestException("La connexion par e-mail ne peut pas être retirée : changez plutôt votre mot de passe.");
    }
    const others = await this.identities.count({ where: { user: { id: user.id }, status: 'active', id: Not(identityId) } });
    if (others === 0) {
      throw new BadRequestException('Définissez un mot de passe avant de retirer votre dernière méthode de connexion.');
    }
    await this.identities.remove(identity);
    return this.listIdentities(user);
  }

  private async ensureEmailIdentity(user: User) {
    const exists = await this.identities.exist({ where: { user: { id: user.id }, provider: 'email' } });
    if (!exists) {
      await this.identities.save(
        this.identities.create({ user: { id: user.id } as User, provider: 'email', providerSubject: user.email, providerEmail: user.email, displayName: user.fullName }),
      );
    }
  }

  get publicUrl() {
    // PUBLIC_URL explicite, sinon l'adresse fournie automatiquement par Render.
    return (this.config.get<string>('PUBLIC_URL') || this.config.get<string>('RENDER_EXTERNAL_URL') || 'http://localhost:3000').replace(/\/+$/, '');
  }

  private buildSession(user: User, sessionId: string) {
    const token = this.jwt.sign({ sub: user.id, sid: sessionId });
    return { token, user: toPublicUser(user) };
  }
}
