/** Assistant SEO / GEO des formulaires d'administration : types de l'analyse Gemini et score instantané local. */

export type SeoKind = 'course' | 'path' | 'event';
export type SeoFields = Record<string, string | number | string[] | null | undefined>;
export type CheckStatus = 'ok' | 'warning' | 'problem';

export interface SeoCheck {
  area: 'seo' | 'geo';
  status: CheckStatus;
  label: string;
  advice: string;
}

export interface SeoAnalysis {
  seoScore: number;
  geoScore: number;
  summary: string;
  checks: SeoCheck[];
  suggestions: { title: string; description: string; metaDescription: string; keywords: string[]; faq: { question: string; answer: string }[] };
  model: string;
}

/** Faits attendus par type de contenu (qui, quand, où…) : ce qui rend un contenu citable par les moteurs IA. */
const FACTS: Record<SeoKind, string[]> = {
  event: ['Date de début', 'Ville', 'Pays', 'Organisateur', 'Horaires'],
  course: ['Formateur', 'Durée (minutes)', 'Niveau', 'Format'],
  path: ['Formations du parcours', 'Durée', 'Prix (TND)'],
};

const GEO_TERMS = /(chin|tunisi|alg[ée]ri|maroc|marocain|afrique|maghreb|libye|mauritan|guangzhou|shanghai|p[ée]kin|shenzhen|tunis|alger|casablanca)/i;
const CHINA = /(chin|guangzhou|shanghai|p[ée]kin|shenzhen|canton)/i;
const NORTH_AFRICA = /(tunisi|alg[ée]ri|maroc|afrique|maghreb|libye|mauritan|tunis|alger|casablanca|sfax|oran)/i;
const AUDIENCE = /(pour les|destin[ée]|importateur|exportateur|entrepreneur|pme|d[ée]cideur|dirigeant|acheteur|professionnel|entreprise)/i;
const BENEFITS = /(apprendre|apprenez|ma[iî]trise|rencontr|d[ée]couvr|comprendre|obten|r[ée]ussi|s[ée]curis|n[ée]goci|b2b|matchmaking|r[ée]seau|certifi)/i;
const STOP = new Set(['les', 'des', 'une', 'pour', 'avec', 'dans', 'sur', 'aux', 'entre', 'votre', 'vos', 'son', 'ses', 'et', 'de', 'du', 'la', 'le']);

const text = (value: SeoFields[string]) => (Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value)).trim();

/** Score instantané (sans IA) recalculé à chaque frappe ; l'analyse Gemini l'affine à la demande. */
export function localSeoScore(kind: SeoKind, fields: SeoFields) {
  const title = text(fields['Titre']);
  const description = text(fields['Description']);
  const all = `${title} ${description}`;
  const checks: SeoCheck[] = [];
  let seo = 0;
  let geo = 0;

  // --- SEO ---
  if (title.length >= 30 && title.length <= 65) {
    seo += 25;
    checks.push({ area: 'seo', status: 'ok', label: `Titre de ${title.length} caractères`, advice: 'Longueur idéale pour Google (30 à 65).' });
  } else if (title.length >= 15 && title.length <= 90) {
    seo += 12;
    checks.push({ area: 'seo', status: 'warning', label: `Titre de ${title.length} caractères`, advice: title.length < 30 ? 'Ajoutez le bénéfice, le lieu ou l’année (30 à 65 caractères).' : 'Raccourcissez : Google coupe au-delà de ~65 caractères.' });
  } else {
    checks.push({ area: 'seo', status: 'problem', label: title ? `Titre de ${title.length} caractères` : 'Titre manquant', advice: 'Un titre de 30 à 65 caractères commençant par le mot-clé principal.' });
  }

  if (description.length >= 300) {
    seo += 20;
  } else if (description.length >= 120) {
    seo += 10;
    checks.push({ area: 'seo', status: 'warning', label: `Description de ${description.length} caractères`, advice: 'Visez au moins 300 caractères : programme, public, bénéfices.' });
  } else {
    checks.push({ area: 'seo', status: 'problem', label: description ? `Description de ${description.length} caractères` : 'Description manquante', advice: 'Trop courte pour être bien référencée (300 caractères conseillés).' });
  }

  const keyword = title
    .toLowerCase()
    .split(/[^a-zà-ÿ0-9]+/i)
    .find((word) => word.length > 3 && !STOP.has(word));
  if (keyword && description.toLowerCase().includes(keyword)) seo += 15;
  else if (keyword) checks.push({ area: 'seo', status: 'warning', label: `Mot-clé « ${keyword} » absent de la description`, advice: 'Reprenez le mot-clé principal du titre dans la description.' });

  if (CHINA.test(all) && NORTH_AFRICA.test(all)) seo += 20;
  else if (GEO_TERMS.test(all)) {
    seo += 10;
    checks.push({ area: 'seo', status: 'warning', label: 'Corridor Chine ↔ Afrique du Nord partiel', advice: 'Citez les deux côtés (ex. Chine et Tunisie) : ce sont les recherches de votre public.' });
  } else checks.push({ area: 'seo', status: 'problem', label: 'Aucun pays ni ville cité', advice: 'Mentionnez la Chine et le pays d’Afrique du Nord visé.' });

  if (title && title !== title.toUpperCase() && !/[!?]{2,}/.test(title)) seo += 20;
  else if (title) checks.push({ area: 'seo', status: 'warning', label: 'Titre en majuscules ou ponctuation excessive', advice: 'Écrivez le titre en casse normale, sans « !! ».' });

  // --- GEO ---
  if (/\d/.test(description)) geo += 20;
  else checks.push({ area: 'geo', status: 'warning', label: 'Aucun chiffre concret', advice: 'Ajoutez des faits chiffrés (participants, heures, modules, années…) : les IA les citent.' });

  const facts = FACTS[kind];
  const present = facts.filter((key) => text(fields[key]));
  geo += Math.round((present.length / facts.length) * 25);
  if (present.length < facts.length) {
    checks.push({ area: 'geo', status: present.length === 0 ? 'problem' : 'warning', label: `Faits manquants : ${facts.filter((key) => !present.includes(key)).join(', ')}`, advice: 'Qui, quand, où : les moteurs IA ne citent que des faits explicites.' });
  }

  if (AUDIENCE.test(description)) geo += 15;
  else checks.push({ area: 'geo', status: 'warning', label: 'Public cible non précisé', advice: 'Dites pour qui (importateurs, PME, décideurs…).' });

  if (BENEFITS.test(description)) geo += 15;
  else checks.push({ area: 'geo', status: 'warning', label: 'Bénéfices peu explicites', advice: 'Énoncez ce que l’on obtient : apprendre, rencontrer, sécuriser…' });

  const sentences = description.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean);
  const words = description.split(/\s+/).filter(Boolean).length;
  if (sentences.length > 0 && words / sentences.length <= 22) geo += 15;
  else if (description) checks.push({ area: 'geo', status: 'warning', label: 'Phrases longues', advice: 'Des phrases courtes et autonomes sont plus faciles à citer.' });

  if (/\?/.test(description) || /\n\s*[-•]/.test(description)) geo += 10;

  return { seo: Math.min(100, seo), geo: Math.min(100, geo), checks };
}

export const scoreTone = (score: number) => (score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600');
export const scoreBar = (score: number) => (score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-600');
