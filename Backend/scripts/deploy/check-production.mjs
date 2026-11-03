// Contrôles d'une instance en mode production (en ligne ou locale). Lecture seule : ne crée ni compte ni donnée.
// Usage : node scripts/deploy/check-production.mjs https://qiao-xxxx.onrender.com
const ORIGIN = (process.argv[2] ?? process.env.SITE_URL ?? '').replace(/\/+$/, '');
if (!ORIGIN) throw new Error('Indiquez l\'adresse du site : node scripts/deploy/check-production.mjs https://…');

let failures = 0;
const check = (label, ok, extra = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK ' : 'ÉCHEC'} ${label}${extra ? ` — ${extra}` : ''}`);
};
const get = (path, headers = {}) => fetch(`${ORIGIN}${path}`, { headers, redirect: 'manual' });

// Santé et site
const health = await get('/api/health');
const healthBody = await health.json().catch(() => null);
check('API et base de données', health.status === 200 && healthBody?.database === 'up', JSON.stringify(healthBody));
const home = await get('/');
const html = await home.text();
check('page d\'accueil servie', home.status === 200 && html.includes('id="root"'));
check('aucun script en ligne dans la page', !/<script(?![^>]*\bsrc=)[^>]*>/.test(html));
const deep = await get('/?tab=academy');
check('adresse profonde du site', deep.status === 200);
const notFound = await get('/api/inexistant');
check('une route API inconnue répond 404 en JSON', notFound.status === 404 && (notFound.headers.get('content-type') ?? '').includes('json'));

// En-têtes de sécurité
const headers = home.headers;
const csp = headers.get('content-security-policy') ?? '';
check('Content-Security-Policy', csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'self'"));
check('X-Content-Type-Options', headers.get('x-content-type-options') === 'nosniff');
check('Referrer-Policy compatible YouTube', headers.get('referrer-policy') === 'strict-origin-when-cross-origin');
check('X-Powered-By masqué', !headers.get('x-powered-by'));
if (ORIGIN.startsWith('https://')) check('Strict-Transport-Security', Boolean(headers.get('strict-transport-security')));

// CORS : le site et l'API partagent la même adresse
const cors = await get('/api/health', { Origin: 'https://site-tiers.example' });
check('autre origine non autorisée', !cors.headers.get('access-control-allow-origin'));

// Fichiers compilés
const asset = html.match(/\/assets\/index-[^"']+\.js/)?.[0];
check('script compilé référencé', Boolean(asset), asset ?? '');
if (asset) {
  const js = await get(asset, { 'Accept-Encoding': 'gzip' });
  check('script compressé', ['gzip', 'br'].includes(js.headers.get('content-encoding') ?? ''), js.headers.get('content-encoding') ?? 'non compressé');
  check('cache long sur les fichiers compilés', (js.headers.get('cache-control') ?? '').includes('immutable'));
}
check('index.html revalidé à chaque visite', (headers.get('cache-control') ?? '').includes('max-age=0'));

// Simulateurs et comptes de démonstration
check('simulateur WeChat désactivé', (await get('/api/wechat/simulator')).status === 404);
check('simulateur de paiement désactivé', (await get('/api/payments/sandbox/checkout/test')).status === 404);
const oauth = await get('/api/auth/oauth/mock/wechat/authorize');
check('simulateur de connexion désactivé', oauth.status >= 400, String(oauth.status));
const demo = await fetch(`${ORIGIN}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'sami.benali@qiao.tn', password: 'Qiao2026!' }),
});
check('compte de démonstration inexistant', demo.status === 401, String(demo.status));

// Paiement
const policy = await (await get('/api/payments/policy')).json().catch(() => null);
console.log(`INFO paiement : ${policy?.paymentsEnabled ? `actif (${policy.provider})` : 'désactivé'}`);

console.log(failures === 0 ? 'Tous les contrôles sont passés.' : `${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
