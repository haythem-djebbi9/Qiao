// Contrôles API de l'assistant SEO / GEO (Gemini) : droits admin, analyse structurée, conversation.
// Usage : API_URL=http://localhost:4000/api ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/seo/api-smoke.mjs
// Consomme quelques requêtes Gemini (clé GEMINI_API_KEY de l'API testée).
const API = process.env.API_URL ?? 'http://localhost:4000/api';
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
if (!ADMIN.email || !ADMIN.password) throw new Error('Définissez ADMIN_EMAIL et ADMIN_PASSWORD (administrateur de la base de test).');
const MEMBER = { email: 'sami.benali@qiao.tn', password: 'Qiao2026!' };

let failures = 0;
const check = (label, ok, extra = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK ' : 'ÉCHEC'} ${label}${extra ? ` — ${extra}` : ''}`);
};
async function call(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}
const login = async (creds) => (await call('POST', '/auth/login', null, creds)).json?.token;

const admin = await login(ADMIN);
const member = await login(MEMBER);
const fields = {
  Titre: 'Forum Chine Tunisie',
  Description: 'Un forum pour rencontrer des entreprises chinoises.',
  'Date de début': '2026-12-15',
  Ville: 'Tunis',
  Pays: 'Tunisie',
  Format: 'Hybride',
};

check('membre refusé (403)', (await call('POST', '/seo/analyze', member, { kind: 'event', fields })).status === 403);
check('type de contenu invalide (400)', (await call('POST', '/seo/analyze', admin, { kind: 'article', fields })).status === 400);
const status = await call('GET', '/seo/status', admin);
check('assistant configuré', status.json?.configured === true, JSON.stringify(status.json?.models));

let t0 = Date.now();
const analysis = await call('POST', '/seo/analyze', admin, { kind: 'event', fields });
const a = analysis.json;
check(
  'analyse structurée',
  analysis.status === 200 && Number.isInteger(a.seoScore) && Number.isInteger(a.geoScore) && a.checks.length > 0 && a.suggestions.title && a.suggestions.description,
  `${analysis.status} en ${Date.now() - t0} ms, modèle ${a?.model}, SEO ${a?.seoScore} / GEO ${a?.geoScore}`,
);
check('titre proposé ≤ 200 caractères', (a?.suggestions?.title ?? '').length <= 200, a?.suggestions?.title);
check('mots-clés et FAQ proposés', a?.suggestions?.keywords?.length > 0 && a?.suggestions?.faq?.length > 0);

t0 = Date.now();
const chat = await call('POST', '/seo/chat', admin, { kind: 'event', fields, messages: [{ role: 'user', text: 'Propose 2 titres plus accrocheurs.' }] });
check('conversation', chat.status === 200 && chat.json.reply.length > 10, `${chat.status} en ${Date.now() - t0} ms, modèle ${chat.json?.model}`);
check('historique trop long refusé (400)', (await call('POST', '/seo/chat', admin, { kind: 'event', fields, messages: Array(21).fill({ role: 'user', text: 'x' }) })).status === 400);

console.log(failures === 0 ? '\nTous les contrôles sont passés.' : `\n${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
