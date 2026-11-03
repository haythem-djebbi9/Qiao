// Contrôles API : rien n'est vendu sans contenu en ligne, suppression protégée par les commandes en attente, références uniques.
// Usage : API_URL=http://localhost:4000/api ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/academy/api-availability.mjs
// À lancer sur une base de test contenant le catalogue de départ : le script crée des formations, des comptes et des commandes.
import { ensureTransfer } from './pay-helpers.mjs';

const API = process.env.API_URL ?? 'http://localhost:4000/api';
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
if (!ADMIN.email || !ADMIN.password) throw new Error('Définissez ADMIN_EMAIL et ADMIN_PASSWORD (administrateur de la base de test).');

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
const stamp = Date.now();
const member = async (name) => {
  const res = await call('POST', '/auth/register', null, {
    fullName: `Membre ${name}`,
    email: `dispo-${name}-${stamp}@example.com`,
    password: 'Disponibilite-Test-2026',
    accountType: 'individual',
    origin: 'north-africa',
    acceptTerms: true,
  });
  if (!res.json?.token) throw new Error(`Inscription impossible : ${res.status} ${JSON.stringify(res.json)}`);
  return res.json.token;
};

const admin = (await call('POST', '/auth/login', null, ADMIN)).json?.token;
if (!admin) throw new Error('Connexion administrateur impossible.');
const alice = await member('alice');
const bob = await member('bob');
await ensureTransfer(call, admin);

// Formation sans contenu
const catalog = (await call('GET', '/academy/courses')).json;
const empty = catalog.find((course) => course.lessonsCount === 0 && course.price > 0);
check('le catalogue indique le nombre de leçons', catalog.every((course) => typeof course.lessonsCount === 'number'));
check('une formation sans leçon existe dans le catalogue', Boolean(empty), empty?.id);
check('ajout au panier refusé (409)', (await call('POST', '/academy/cart', alice, { itemType: 'course', itemId: empty.id })).status === 409);
const refused = await call('POST', '/academy/enroll', alice, { itemType: 'course', itemId: empty.id, method: 'transfer' });
check('achat direct refusé (409)', refused.status === 409, refused.json?.message);

// Parcours sans formation prête
const paths = (await call('GET', '/academy/paths')).json;
const emptyPath = paths.find((path) => path.available === false);
check('le catalogue signale les parcours non disponibles', paths.every((path) => typeof path.available === 'boolean'));
if (emptyPath) {
  check('achat d\'un parcours sans contenu refusé (409)', (await call('POST', '/academy/enroll', alice, { itemType: 'path', itemId: emptyPath.id, method: 'transfer' })).status === 409);
}

// Formation avec contenu
const created = await call('POST', '/academy/admin/courses', admin, {
  title: `Formation disponibilité ${stamp}`,
  instructor: 'Formateur de test',
  duration: '1h',
  durationMinutes: 60,
  price: 100,
  domain: 'business',
  level: 'Tous niveaux',
  format: 'En ligne à son rythme',
  description: 'Formation créée par le script de contrôle de disponibilité.',
});
const courseId = created.json?.id;
check('formation créée', created.status === 201, courseId);
const detail = (await call('POST', `/academy/admin/courses/${courseId}/modules`, admin, { title: 'Module 1' })).json;
const moduleId = detail?.curriculum?.[0]?.id;
const lesson = await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, { title: 'Leçon 1', type: 'text', content: 'Contenu de la leçon.', durationMinutes: 5 });
check('leçon ajoutée', lesson.status === 201);
check('formation publiée', (await call('POST', `/academy/admin/courses/${courseId}/status`, admin, { status: 'published' })).status === 200);
const listed = (await call('GET', '/academy/courses')).json.find((course) => course.id === courseId);
check('le catalogue compte sa leçon', listed?.lessonsCount === 1);

// Références uniques, même pour des commandes simultanées
const [first, second] = await Promise.all([
  call('POST', '/academy/enroll', alice, { itemType: 'course', itemId: courseId, method: 'transfer' }),
  call('POST', '/academy/enroll', bob, { itemType: 'course', itemId: courseId, method: 'transfer' }),
]);
check('deux commandes simultanées acceptées', first.status === 201 && second.status === 201, `${first.status} / ${second.status}`);
check('références différentes', first.json?.order?.reference !== second.json?.order?.reference, `${first.json?.order?.reference} / ${second.json?.order?.reference}`);

// Suppression protégée par les commandes en attente
const blocked = await call('DELETE', `/academy/admin/courses/${courseId}`, admin);
check('suppression refusée avec une commande en attente (409)', blocked.status === 409, blocked.json?.message);
check('annulation de la 1re commande', (await call('POST', `/academy/orders/${first.json.order.id}/cancel`, alice)).status === 200);
check('annulation de la 2e commande', (await call('POST', `/academy/orders/${second.json.order.id}/cancel`, bob)).status === 200);
const deleted = await call('DELETE', `/academy/admin/courses/${courseId}`, admin);
check('suppression acceptée une fois les commandes annulées', deleted.status === 200, String(deleted.status));

console.log(failures === 0 ? 'Tous les contrôles sont passés.' : `${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
