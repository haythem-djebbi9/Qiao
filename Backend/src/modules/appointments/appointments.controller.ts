import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { AvailabilityQueryDto, CreateAppointmentDto } from './appointments.dto';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('availability')
  availability(@Query() query: AvailabilityQueryDto) {
    return this.appointmentsService.availability(query.date.slice(0, 10), query.specialty);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: User | null) {
    return this.appointmentsService.create(dto, user);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: User) {
    return this.appointmentsService.listForUser(user);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.cancel(user, id);
  }
}
