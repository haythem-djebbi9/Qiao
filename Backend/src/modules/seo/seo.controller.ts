import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AdminGuard, CurrentUser, JwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { SeoAnalyzeDto, SeoChatDto } from './seo.dto';
import { SeoService } from './seo.service';

/** Assistant SEO / GEO des formulaires d'ajout (administrateurs uniquement). */
@Controller('seo')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get('status')
  status() {
    return this.seo.status();
  }

  @Post('analyze')
  @HttpCode(200)
  analyze(@CurrentUser() user: User, @Body() dto: SeoAnalyzeDto) {
    return this.seo.analyze(user, dto.kind, dto.fields);
  }

  @Post('chat')
  @HttpCode(200)
  chat(@CurrentUser() user: User, @Body() dto: SeoChatDto) {
    return this.seo.chat(user, dto.kind, dto.fields, dto.messages);
  }
}
