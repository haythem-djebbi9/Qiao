/** Identifiant stable dérivé d'un titre — même règle que le backend (Backend/src/common/text.ts). */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/** « Il y a 2 jours », « 3h », « À l'instant »... */
export function timeAgo(date: string | Date, style: 'short' | 'long' = 'short'): string {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (style === 'long') {
    if (days >= 1) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours >= 1) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    return minutes >= 1 ? `Il y a ${minutes} min` : "À l'instant";
  }
  if (days >= 1) return `${days}j`;
  if (hours >= 1) return `${hours}h`;
  return minutes >= 1 ? `${minutes}m` : "À l'instant";
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
