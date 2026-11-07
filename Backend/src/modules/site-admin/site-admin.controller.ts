import { Body, Controller, Delete, Get, Header, NotFoundException, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminGuard, CurrentUser, JwtAuthGuard } from '../../common/auth.guards';
import { I18nService, SITE_LANGUAGES, SiteLanguage } from '../i18n/i18n.service';
import { User } from '../users/user.entity';
import { SiteAdminService } from './site-admin.service';

/** Contenus du site modifiés par l'administration, lus par toutes les pages. */
@Controller('site-content')
export class SiteContentController {
  constructor(private readonly site: SiteAdminService) {}

  @Get()
  @Header('Cache-Control', 'no-cache')
  all() {
    return this.site.allContents();
  }
}

const language = (value: string): SiteLanguage => {
  if (!SITE_LANGUAGES.includes(value as SiteLanguage)) throw new NotFoundException('Langue inconnue.');
  return value as SiteLanguage;
};

/** Administration des contenus du site : secteurs, services, opportunités, analyses, documents, entreprises, demandes, traductions. */
@Controller('site-admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SiteAdminController {
  constructor(
    private readonly site: SiteAdminService,
    private readonly i18n: I18nService,
  ) {}

  @Put('contents/:key')
  saveContent(@CurrentUser() user: User, @Param('key') key: string, @Body() body: { data?: unknown }) {
    return this.site.saveContent(user, key, body?.data);
  }

  @Delete('contents/:key')
  resetContent(@CurrentUser() user: User, @Param('key') key: string) {
    return this.site.resetContent(user, key);
  }

  @Get('collections/:name')
  list(@Param('name') name: string) {
    return this.site.list(name);
  }

  @Post('collections/:name')
  create(@CurrentUser() user: User, @Param('name') name: string, @Body() body: Record<string, unknown>) {
    return this.site.create(user, name, body ?? {});
  }

  @Patch('collections/:name/:id')
  update(@CurrentUser() user: User, @Param('name') name: string, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.site.update(user, name, id, body ?? {});
  }

  @Delete('collections/:name/:id')
  remove(@CurrentUser() user: User, @Param('name') name: string, @Param('id') id: string) {
    return this.site.remove(user, name, id);
  }

  @Get('inbox/:name')
  inbox(@Param('name') name: string) {
    return this.site.inbox(name);
  }

  @Patch('inbox/contact/:id')
  contactStatus(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { status?: string }) {
    return this.site.setContactStatus(user, id, String(body?.status ?? ''));
  }

  @Get('translations')
  translations(@Query('language') lang: string) {
    return this.i18n.adminTexts(language(lang));
  }

  @Put('translations')
  saveTranslation(@Body() body: { language?: string; source?: string; target?: string }) {
    return this.i18n.saveTranslation(language(String(body?.language ?? '')), String(body?.source ?? ''), String(body?.target ?? ''));
  }
}
