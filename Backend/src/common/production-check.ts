import { Logger } from '@nestjs/common';

/** En production : refuse de démarrer avec une configuration dangereuse et signale ce qui reste à configurer. */
export function checkProductionEnv(env: NodeJS.ProcessEnv = process.env) {
  const errors: string[] = [];
  const secret = env.JWT_SECRET ?? '';
  if (secret.length < 32 || secret === 'qiao-dev-secret') errors.push('JWT_SECRET : valeur aléatoire de 32 caractères minimum requise.');
  if (!env.PUBLIC_URL) errors.push('PUBLIC_URL : adresse publique du site requise (liens des e-mails, retours de paiement, certificats).');
  if (!env.DATABASE_URL && !env.DB_HOST) errors.push('DATABASE_URL : connexion à la base de données requise.');
  if (errors.length > 0) throw new Error(`Configuration de production invalide :\n- ${errors.join('\n- ')}`);

  const logger = new Logger('Production');
  if (!env.PUBLIC_URL!.startsWith('https://')) logger.warn(`PUBLIC_URL n'est pas en https : ${env.PUBLIC_URL}`);
  if (!env.UPLOADS_DIR) logger.warn('UPLOADS_DIR absent : les fichiers téléversés (supports de formation, pièces jointes) sont perdus à chaque redéploiement.');
  if (!env.SMTP_HOST) logger.warn('SMTP_HOST absent : aucun e-mail envoyé, les liens de réinitialisation de mot de passe sont écrits dans les journaux.');
  if (!env.ADMIN_EMAIL) logger.warn('ADMIN_EMAIL absent : aucun compte administrateur créé au démarrage.');
  if (env.DB_SYNC === 'true') logger.warn('DB_SYNC=true : le schéma est modifié sans migration, avec un risque de perte de données.');
}
