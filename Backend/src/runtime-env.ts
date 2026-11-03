import { config } from 'dotenv';

// Premier module chargé : certaines valeurs (dossier des fichiers, adresse publique) sont lues dès l'import des autres modules.
config();

// PUBLIC_URL explicite, sinon l'adresse fournie automatiquement par l'hébergeur (Render).
if (!process.env.PUBLIC_URL && process.env.RENDER_EXTERNAL_URL) {
  process.env.PUBLIC_URL = process.env.RENDER_EXTERNAL_URL;
}
