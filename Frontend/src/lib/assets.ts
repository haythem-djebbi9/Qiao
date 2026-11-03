import { apiUrl } from './api';

/** Les images locales référencées en base sont stockées sous la forme « asset:nom-du-fichier.jpg ». */
const localImages = import.meta.glob('../assets/images/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byName = Object.fromEntries(
  Object.entries(localImages).map(([path, url]) => [path.split('/').pop() as string, url]),
);

export function resolveImage(src: string | null | undefined, fallback = ''): string {
  if (!src) return fallback;
  if (src.startsWith('asset:')) return byName[src.slice('asset:'.length)] ?? fallback;
  // Couverture téléversée depuis l'administration de QIAO Academy (servie publiquement par l'API).
  if (src.startsWith('academy-file:')) return apiUrl(`/academy/files/${src.slice('academy-file:'.length)}`);
  return src;
}
