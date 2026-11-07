import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { existsSync } from 'fs';
import { join } from 'path';
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
import { SeoModule } from './modules/seo/seo.module';
import { HealthController } from './modules/health/health.controller';
import { I18nModule } from './modules/i18n/i18n.module';
import { SiteAdminModule } from './modules/site-admin/site-admin.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PlatformModule } from './modules/platform/platform.module';
import { RegulationsModule } from './modules/regulations/regulations.module';
import { SearchModule } from './modules/search/search.module';
import { SimulationsModule } from './modules/simulations/simulations.module';
import { UsersModule } from './modules/users/users.module';
import { WechatModule } from './modules/wechat/wechat.module';

/** Site React compilé (Frontend/dist), servi par l'API en production. */
const FRONTEND_DIST = process.env.FRONTEND_DIST ?? join(__dirname, '..', '..', 'Frontend', 'dist');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // DATABASE_URL (hébergeur) ou paramètres séparés (poste local).
        const url = config.get<string>('DATABASE_URL');
        const production = config.get<string>('NODE_ENV') === 'production';
        return {
          type: 'postgres' as const,
          ...(url
            ? { url }
            : {
                host: config.get<string>('DB_HOST', 'localhost'),
                port: Number(config.get<string>('DB_PORT', '5432')),
                username: config.get<string>('DB_USER', 'postgres'),
                password: config.get<string>('DB_PASSWORD', 'postgres'),
                database: config.get<string>('DB_NAME', 'qiao'),
              }),
          ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          // Poste local : schéma synchronisé. Production : migrations versionnées (src/database/migrations).
          synchronize: config.get<string>('DB_SYNC', production ? 'false' : 'true') === 'true',
          migrations: [join(__dirname, 'database', 'migrations', '*.js')],
          migrationsRun: config.get<string>('DB_MIGRATE', production ? 'true' : 'false') === 'true',
        };
      },
    }),
    ...(existsSync(FRONTEND_DIST)
      ? [
          ServeStaticModule.forRoot({
            rootPath: FRONTEND_DIST,
            exclude: ['/api/(.*)'],
            serveStaticOptions: {
              // Fichiers compilés (nom haché) : cache long ; le reste, dont index.html, est revalidé à chaque visite.
              setHeaders: (res: { setHeader: (name: string, value: string) => void }, path: string) =>
                res.setHeader('Cache-Control', /[\\/]assets[\\/]/.test(path) ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate'),
            },
          }),
        ]
      : []),
    PlatformModule,
    UsersModule,
    NotificationsModule,
    AuthModule,
    ContactModule,
    NewsletterModule,
    AppointmentsModule,
    CatalogModule,
    EventsModule,
    SeoModule,
    I18nModule,
    SiteAdminModule,
    AcademyModule,
    CommunityModule,
    PaymentsModule,
    WechatModule,
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
