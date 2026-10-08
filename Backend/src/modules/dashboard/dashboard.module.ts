import { Module } from '@nestjs/common';
import { AcademyModule } from '../academy/academy.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { CommunityModule } from '../community/community.module';
import { CompaniesModule } from '../companies/companies.module';
import { ContactModule } from '../contact/contact.module';
import { DocumentsModule } from '../documents/documents.module';
import { EventsModule } from '../events/events.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { SimulationsModule } from '../simulations/simulations.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    AppointmentsModule,
    EventsModule,
    AcademyModule,
    CommunityModule,
    DocumentsModule,
    OpportunitiesModule,
    CompaniesModule,
    SimulationsModule,
    ContactModule,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
