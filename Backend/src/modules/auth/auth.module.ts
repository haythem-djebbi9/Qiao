import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthIdentity, AuthTicket, UserSession } from './auth.entities';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { OAuthService } from './oauth.service';
import { TicketsService } from './tickets.service';

@Global()
@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([AuthIdentity, UserSession, AuthTicket]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'qiao-dev-secret'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OAuthService, TicketsService, JwtStrategy],
  exports: [PassportModule, AuthService, TypeOrmModule],
})
export class AuthModule {}
