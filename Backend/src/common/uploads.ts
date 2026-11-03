import { join, resolve } from 'path';

/** Fichiers envoyés par les membres et l'administration : disque persistant en production (UPLOADS_DIR), sinon ./uploads. */
const UPLOADS_ROOT = process.env.UPLOADS_DIR ? resolve(process.env.UPLOADS_DIR) : join(process.cwd(), 'uploads');

export const uploadsPath = (...segments: string[]) => join(UPLOADS_ROOT, ...segments);
