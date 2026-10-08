import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './database/seed.service';
import { AcademyModule } from './modules/academy/academy.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CommunityModule } from './modules/community/community.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ContactModule } from './modules/contact/contact.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EventsModule } from './modules/events/events.module';
import { HealthController } from './modules/health/health.controller';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { RegulationsModule } from './modules/regulations/regulations.module';
import { SearchModule } from './modules/search/search.module';
import { SimulationsModule } from './modules/simulations/simulations.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'qiao'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNC', 'true') === 'true',
      }),
    }),
    UsersModule,
    NotificationsModule,
    AuthModule,
    ContactModule,
    NewsletterModule,
    AppointmentsModule,
    CatalogModule,
    EventsModule,
    AcademyModule,
    CommunityModule,
    DocumentsModule,
    ArticlesModule,
    OpportunitiesModule,
    CompaniesModule,
    SimulationsModule,
    RegulationsModule,
    SearchModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [SeedService],
})
export class AppModule {}
