import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { SubscribeDto } from './newsletter.dto';
import { NewsletterService } from './newsletter.service';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @UseGuards(OptionalJwtAuthGuard)
  subscribe(@Body() dto: SubscribeDto, @CurrentUser() user: User | null) {
    return this.newsletterService.subscribe(dto, user);
  }
}
