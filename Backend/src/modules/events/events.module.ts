import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { EventRegistration, QiaoEvent } from './event.entity';
import { EventsAdminController } from './events-admin.controller';
import { EventsAdminService } from './events-admin.service';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [TypeOrmModule.forFeature([QiaoEvent, EventRegistration, User])],
  controllers: [EventsController, EventsAdminController],
  providers: [EventsService, EventsAdminService],
  exports: [EventsService],
})
export class EventsModule {}
