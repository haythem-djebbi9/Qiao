import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../modules/users/user.entity';

/** Route réservée aux membres connectés (401 sinon). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = User>(err: unknown, user: TUser | false): TUser {
    if (err instanceof HttpException) throw err;
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

/** Réservé aux administrateurs QIAO (à placer après JwtAuthGuard). */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user: User | undefined = context.switchToHttp().getRequest().user;
    if (user?.role !== 'admin') {
      throw new ForbiddenException('Action réservée aux administrateurs QIAO.');
    }
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | null => {
    const request = context.switchToHttp().getRequest();
    return request.user ?? null;
  },
);

/** Identifiant de la session portée par le jeton de la requête. */
export const SessionId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | null => context.switchToHttp().getRequest().sessionId ?? null,
);

/** IP et navigateur du client (enregistrés dans la session, à des fins de sécurité). */
export const ClientContext = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  return { ip: request.ip ?? null, userAgent: (request.headers?.['user-agent'] as string | undefined) ?? null };
});
