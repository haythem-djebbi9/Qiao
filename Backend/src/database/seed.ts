import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

/** `npm run seed` : remplit les tables vides sans démarrer le serveur HTTP. */
async function main() {
  process.env.DB_SEED = 'false';
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.get(SeedService).run();
  await app.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
