import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nModule } from '../i18n/i18n.module';
import { SiteAdminController, SiteContentController } from './site-admin.controller';
import { SiteAdminService } from './site-admin.service';
import { SiteContent } from './site-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SiteContent]), I18nModule],
  controllers: [SiteContentController, SiteAdminController],
  providers: [SiteAdminService],
})
export class SiteAdminModule {}
