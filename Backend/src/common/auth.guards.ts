import { ExecutionContext, Injectable, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../modules/users/user.entity';

/** Route réservée aux membres connectés (401 sinon). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = User>(err: unknown, user: TUser | false): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Veuillez vous connecter pour continuer.');
    }
    return user;
  }
}

/** Route publique qui reconnaît le membre s'il envoie un jeton valide. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = User>(_err: unknown, user: TUser | false): TUser | null {
    return user || null;
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!request.headers?.authorization) {
      return true;
    }
    return super.canActivate(context);
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | null => {
    const request = context.switchToHttp().getRequest();
    return request.user ?? null;
  },
);
