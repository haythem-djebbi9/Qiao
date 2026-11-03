import './runtime-env';
import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationError } from 'class-validator';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { checkProductionEnv } from './common/production-check';

const production = process.env.NODE_ENV === 'production';

/** En-têtes de sécurité de production : le site est servi par l'API, sur la même adresse. */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      // Lecteur YouTube pilotable (horodatage des notes de cours).
      'script-src': ["'self'", 'https://www.youtube.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'media-src': ["'self'", 'blob:', 'https:'],
      'connect-src': ["'self'"],
      // Vidéos hébergées des leçons et aperçu des PDF protégés (blob:).
      'frame-src': [
        "'self'",
        'blob:',
        'https://www.youtube-nocookie.com',
        'https://www.youtube.com',
        'https://player.vimeo.com',
        'https://www.dailymotion.com',
        'https://geo.dailymotion.com',
        'https://drive.google.com',
        'https://www.loom.com',
      ],
      'object-src': ["'self'", 'blob:'],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'self'"],
      'upgrade-insecure-requests': null,
    },
  },
  crossOriginEmbedderPolicy: false,
  // YouTube refuse la lecture intégrée sans en-tête Referer.
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  strictTransportSecurity: { maxAge: 15_552_000, includeSubDomains: false },
});

function flattenErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...flattenErrors(error.children ?? []),
  ]);
}

async function bootstrap() {
  if (production) checkProductionEnv();

  // Corps brut conservé pour vérifier la signature des notifications du prestataire de paiement.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // Derrière un hébergeur (Render), l'IP réelle du client est transmise par le proxy.
  app.set('trust proxy', 1);
  // Messages du compte officiel WeChat : XML (corps brut conservé pour le mode sécurisé).
  app.useBodyParser('text', { type: ['text/xml', 'application/xml'], limit: '1mb' });
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.use(compression());
  if (production) app.use(securityHeaders);
  app.enableCors({
    // En production, le site et l'API partagent la même adresse : aucune autre origine sans CORS_ORIGIN explicite.
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : !production,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => new BadRequestException(flattenErrors(errors)),
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`QIAO API prête sur http://localhost:${port}/api`);
}

bootstrap();
