import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { EventsQueryDto, RegisterEventDto } from './events.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() query: EventsQueryDto, @CurrentUser() user: User | null) {
    return this.eventsService.list(query, user);
  }

  @Get('registrations/mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: User) {
    return this.eventsService.listForUser(user);
  }

  @Post('registrations/:id/cancel')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.cancelMine(user, id);
  }

  @Post(':id/register')
  @UseGuards(OptionalJwtAuthGuard)
  register(@Param('id') id: string, @Body() dto: RegisterEventDto, @CurrentUser() user: User | null) {
    return this.eventsService.register(id, dto, user);
  }
}
