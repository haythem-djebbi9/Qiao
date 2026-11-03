import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { IsNull, LessThan, Repository } from 'typeorm';
import { AuthTicket } from './auth.entities';

export const hashSecret = (secret: string) => createHash('sha256').update(secret).digest('hex');

/** Jetons à usage unique : seul le hash du secret est conservé en base. */
@Injectable()
export class TicketsService {
  constructor(@InjectRepository(AuthTicket) private readonly tickets: Repository<AuthTicket>) {}

  async issue(kind: AuthTicket['kind'], payload: Record<string, any>, ttlMs: number): Promise<string> {
    const secret = randomBytes(24).toString('hex');
    await this.tickets.insert({
      kind,
      secretHash: hashSecret(secret),
      payload,
      expiresAt: new Date(Date.now() + ttlMs),
    });
    // Nettoyage opportuniste des jetons expirés.
    this.tickets.delete({ expiresAt: LessThan(new Date(Date.now() - 86_400_000)) }).catch(() => undefined);
    return secret;
  }

  /** Lit un jeton valide sans le consommer (ex. affichage d'une identité en attente). */
  async peek(kind: AuthTicket['kind'], secret: string, message = 'Lien expiré ou invalide. Recommencez.') {
    const ticket = await this.tickets.findOne({ where: { kind, secretHash: hashSecret(secret ?? '') } });
    if (!ticket || ticket.usedAt || ticket.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(message);
    }
    return ticket;
  }

  /** Consomme un jeton : il ne pourra plus jamais être réutilisé. */
  async consume(kind: AuthTicket['kind'], secret: string, message?: string) {
    const ticket = await this.peek(kind, secret, message);
    const result = await this.tickets.update({ id: ticket.id, usedAt: IsNull() }, { usedAt: new Date() });
    if (!result.affected) throw new BadRequestException(message ?? 'Lien déjà utilisé.');
    return ticket.payload;
  }
}
