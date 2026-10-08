import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { toPublicUser, User } from '../users/user.entity';
import { ChangePasswordDto, LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';

const PROFILE_TITLES: Record<RegisterDto['accountType'], string> = {
  enterprise: 'Entreprise membre',
  expert: 'Expert vérifié',
  individual: 'Apprenant QIAO Academy',
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.users.exist({ where: { email } });
    if (exists) {
      throw new ConflictException('Un compte existe déjà avec cette adresse e-mail.');
    }

    const user = await this.users.save(
      this.users.create({
        fullName: dto.fullName.trim(),
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        company: dto.company?.trim() || null,
        accountType: dto.accountType,
        origin: dto.origin,
        title: PROFILE_TITLES[dto.accountType],
        location: dto.origin === 'china' ? 'Chine' : 'Afrique du Nord',
        language: 'FR',
      }),
    );

    await this.notifications.notify(
      user,
      'Bienvenue sur QIAO !',
      'Votre espace est prêt : explorez les opportunités, les formations QIAO Academy et la communauté.',
      'welcome',
      'dashboard',
    );
    await this.notifications.notify(
      user,
      'Complétez votre profil',
      'Ajoutez votre fonction et votre ville pour être recommandé aux bons partenaires.',
      'info',
      'dashboard',
    );

    return this.buildSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email.trim().toLowerCase() })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou mot de passe incorrect.');
    }
    return this.buildSession(user);
  }

  async updateProfile(user: User, dto: UpdateProfileDto) {
    Object.assign(user, {
      ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
      ...(dto.company !== undefined && { company: dto.company.trim() || null }),
      ...(dto.title !== undefined && { title: dto.title.trim() || null }),
      ...(dto.location !== undefined && { location: dto.location.trim() || null }),
      ...(dto.language !== undefined && { language: dto.language }),
    });
    return toPublicUser(await this.users.save(user));
  }

  async changePassword(user: User, dto: ChangePasswordDto) {
    const withHash = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: user.id })
      .getOneOrFail();
    if (!(await bcrypt.compare(dto.currentPassword, withHash.passwordHash))) {
      throw new UnauthorizedException('Le mot de passe actuel est incorrect.');
    }
    withHash.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.users.save(withHash);
    return { success: true };
  }

  private buildSession(user: User) {
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user: toPublicUser(user) };
  }
}
