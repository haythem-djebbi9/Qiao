import '../runtime-env';
import { join } from 'path';
import { DataSource } from 'typeorm';

const toGlob = (path: string) => path.replace(/\\/g, '/');
const url = process.env.DATABASE_URL;

/** Source de données de la CLI TypeORM (migrations) ; à l'exécution, l'application utilise la configuration d'AppModule. */
export default new DataSource({
  type: 'postgres',
  ...(url
    ? { url }
    : {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? '5432'),
        username: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'qiao',
      }),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [toGlob(join(__dirname, '..', 'modules', '**', '*.entit{y,ies}.js'))],
  migrations: [toGlob(join(__dirname, 'migrations', '*.js'))],
});
