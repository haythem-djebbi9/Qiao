import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityEvent, AuditLog } from './platform.entities';
import { ActivityService, AuditService, MailService, PlatformEvents, RateLimiter } from './platform.services';

/** Services transverses : analytique, journal d'audit, limitation de débit, e-mails, événements internes. */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ActivityEvent, AuditLog])],
  providers: [ActivityService, AuditService, RateLimiter, MailService, PlatformEvents],
  exports: [ActivityService, AuditService, RateLimiter, MailService, PlatformEvents, TypeOrmModule],
})
export class PlatformModule {}
