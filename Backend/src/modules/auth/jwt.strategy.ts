import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { UserSession } from './auth.entities';

/** Fréquence maximale de mise à jour de « dernière activité » d'une session. */
const TOUCH_INTERVAL_MS = 5 * 60_000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(UserSession) private readonly sessions: Repository<UserSession>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'qiao-dev-secret'),
      passReqToCallback: true,
    });
  }

  /** Le jeton n'est accepté que si sa session existe, n'est ni révoquée ni expirée, et si le compte est actif. */
  async validate(request: Request & { sessionId?: string }, payload: { sub: string; sid?: string }): Promise<User> {
    if (!payload.sid) throw new UnauthorizedException('Session expirée. Veuillez vous reconnecter.');
    const session = await this.sessions.findOne({ where: { id: payload.sid }, relations: { user: true } });
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now() || session.user.id !== payload.sub) {
      throw new UnauthorizedException('Session expirée. Veuillez vous reconnecter.');
    }
    const user = await this.usersService.assertActive(session.user).catch((err) => {
      throw new UnauthorizedException(err.message);
    });
    if (Date.now() - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
      await this.sessions.update(session.id, { lastUsedAt: new Date() });
    }
    request.sessionId = session.id;
    return user;
  }
}
