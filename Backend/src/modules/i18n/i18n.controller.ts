import { Controller, Get, Header, NotFoundException, Param } from '@nestjs/common';
import { I18nService, SITE_LANGUAGES, SiteLanguage } from './i18n.service';

@Controller('i18n')
export class I18nController {
  constructor(private readonly i18n: I18nService) {}

  /** Traductions des contenus publiés par l'administration. */
  @Get(':language')
  @Header('Cache-Control', 'public, max-age=300')
  dictionary(@Param('language') language: string) {
    if (!SITE_LANGUAGES.includes(language as SiteLanguage)) throw new NotFoundException('Langue inconnue.');
    return this.i18n.dictionary(language as SiteLanguage);
  }
}
