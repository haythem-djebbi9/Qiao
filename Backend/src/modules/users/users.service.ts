import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { slugify } from '../../common/text';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  /** @handle unique dérivé du nom (ex. « sami-benali », « sami-benali-2 »). */
  async generateHandle(fullName: string): Promise<string> {
    const base = slugify(fullName).slice(0, 40) || 'membre';
    for (let suffix = 1; suffix < 1000; suffix++) {
      const candidate = suffix === 1 ? base : `${base}-${suffix}`;
      if (!(await this.users.exist({ where: { handle: candidate } }))) return candidate;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  /** Attribue un @handle aux comptes créés avant l'existence des profils Community. */
  async backfillHandles() {
    const missing = await this.users.find({ where: { handle: IsNull() } });
    for (const user of missing) {
      user.handle = await this.generateHandle(user.fullName);
      await this.users.save(user);
    }
    return missing.length;
  }

  /**
   * Vérifie qu'un compte peut agir. Une suspension arrivée à échéance est levée automatiquement.
   * Lève 403 si le compte est toujours suspendu.
   */
  async assertActive(user: User): Promise<User> {
    if (user.status !== 'suspended') return user;
    if (user.suspendedUntil && user.suspendedUntil.getTime() <= Date.now()) {
      user.status = 'active';
      user.suspendedUntil = null;
      user.suspensionReason = null;
      return this.users.save(user);
    }
    const until = user.suspendedUntil
      ? ` jusqu'au ${user.suspendedUntil.toLocaleDateString('fr-FR')}`
      : '';
    const reason = user.suspensionReason ? ` Motif : ${user.suspensionReason}` : '';
    throw new ForbiddenException(`Votre compte est suspendu${until}.${reason}`);
  }
}
