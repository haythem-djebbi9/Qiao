import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AdminGuard, CurrentUser, JwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import {
  AdminEventsQueryDto,
  AdminRegistrationDto,
  CheckInDto,
  EventDto,
  EventStatusDto,
  EventsAuditQueryDto,
  RegistrationsQueryDto,
  UpdateEventDto,
  UpdateRegistrationDto,
} from './events.dto';
import { EventsAdminService } from './events-admin.service';

/** Administration des événements QIAO (administrateurs uniquement ; actions journalisées par AuditService). */
@Controller('events/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class EventsAdminController {
  constructor(private readonly admin: EventsAdminService) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  // --- Événements ---

  @Get('events')
  list(@Query() query: AdminEventsQueryDto) {
    return this.admin.listEvents(query);
  }

  @Post('events')
  create(@CurrentUser() user: User, @Body() dto: EventDto) {
    return this.admin.createEvent(user, dto);
  }

  @Get('events/:id')
  get(@Param('id') id: string) {
    return this.admin.getEvent(id);
  }

  @Patch('events/:id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.admin.updateEvent(user, id, dto);
  }

  @Post('events/:id/status')
  @HttpCode(200)
  status(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: EventStatusDto) {
    return this.admin.setStatus(user, id, dto.status);
  }

  @Post('events/:id/duplicate')
  duplicate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.admin.duplicateEvent(user, id);
  }

  @Delete('events/:id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.admin.deleteEvent(user, id);
  }

  // --- Inscrits & places ---

  @Get('events/:id/registrations')
  registrations(@Param('id') id: string, @Query() query: RegistrationsQueryDto) {
    return this.admin.listRegistrations(id, query);
  }

  @Post('events/:id/registrations')
  addRegistration(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: AdminRegistrationDto) {
    return this.admin.addRegistration(user, id, dto);
  }

  @Get('events/:id/registrations.csv')
  async exportCsv(@CurrentUser() user: User, @Param('id') id: string, @Res() res: Response) {
    const file = await this.admin.exportCsv(user, id);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Cache-Control': 'private, no-store',
    });
    res.send(file.content);
  }

  @Patch('registrations/:id')
  updateRegistration(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRegistrationDto) {
    return this.admin.updateRegistration(user, id, dto);
  }

  @Post('registrations/:id/check-in')
  @HttpCode(200)
  checkIn(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CheckInDto) {
    return this.admin.checkIn(user, id, dto.present);
  }

  @Get('audit')
  audit(@Query() query: EventsAuditQueryDto) {
    return this.admin.auditLog(query);
  }
}
