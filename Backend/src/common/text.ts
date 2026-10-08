/** Identifiant stable dérivé d'un titre (partagé avec le frontend). */
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

/** Comparaison insensible à la casse et aux accents. */
export function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesQuery(query: string | undefined, ...fields: (string | string[] | null | undefined)[]): boolean {
  const q = normalize(query);
  if (!q) return true;
  return fields.some((field) => {
    if (Array.isArray(field)) return field.some((item) => normalize(item).includes(q));
    return normalize(field).includes(q);
  });
}

/** Valeur d'un filtre « Tous / Toutes ... » considérée comme vide. */
export function isAllFilter(value: string | undefined): boolean {
  if (!value) return true;
  const v = normalize(value);
  return v === '' || v === 'all' || v.startsWith('tous') || v.startsWith('toutes');
}
