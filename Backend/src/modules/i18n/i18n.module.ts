import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeoModule } from '../seo/seo.module';
import { ContentTranslation } from './content-translation.entity';
import { I18nController } from './i18n.controller';
import { I18nService } from './i18n.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContentTranslation]), SeoModule],
  controllers: [I18nController],
  providers: [I18nService],
})
export class I18nModule {}
