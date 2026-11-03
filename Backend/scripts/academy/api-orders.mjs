// Contrôles API du paiement des formations : carte (simulateur de paiement), virement validé par l'administrateur,
// annulation, formation gratuite, rapprochement et journal.
// Usage : API_URL=http://localhost:4000/api ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/academy/api-orders.mjs
// À lancer sur une base de test avec PAYMENT_PROVIDER=sandbox (le script règle les sessions sur la page du simulateur).
const API = process.env.API_URL ?? 'http://localhost:4000/api';
const ORIGIN = API.replace(/\/api$/, '');
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
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const admin = await login(ADMIN);
const member = await login(MEMBER);
const stamp = Date.now().toString(36);

// Formations de contrôle publiées (une payante par scénario, une gratuite)
async function makeCourse(title, price) {
  const course = (await call('POST', '/academy/admin/courses', admin, {
    title: `${title} ${stamp}`,
    description: 'Formation de contrôle du paiement.',
    instructor: 'Équipe QIAO',
    price,
    durationMinutes: 30,
    domain: 'commerce',
    level: 'Débutant',
    format: 'En ligne à son rythme',
  })).json;
  const moduleId = (await call('POST', `/academy/admin/courses/${course.id}/modules`, admin, { title: 'Introduction' })).json.curriculum[0].id;
  await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, { title: 'Leçon', type: 'text', content: 'Contenu de contrôle.', durationMinutes: 5 });
  await call('POST', `/academy/admin/courses/${course.id}/status`, admin, { status: 'published' });
  return course.id;
}
const cardCourse = await makeCourse('Paiement carte', 150);
const transferCourse = await makeCourse('Paiement virement', 90);
const cancelCourse = await makeCourse('Commande annulée', 40);
const freeCourse = await makeCourse('Formation gratuite', 0);

// Réglages : sans taux, la carte est indisponible
check('membre refusé sur les réglages (403)', (await call('GET', '/academy/admin/payment-settings', member)).status === 403);
await call('PATCH', '/academy/admin/payment-settings', admin, { eurPerTnd: null, bank: { beneficiary: '', rib: '', iban: '' } });
let options = (await call('GET', '/academy/payment-options')).json;
check('sans réglages : carte et virement indisponibles', options.card.available === false && options.transfer.available === false);
check('commande refusée sans moyen de paiement (503)', (await call('POST', '/academy/enroll', member, { itemType: 'course', itemId: cardCourse, method: 'card' })).status === 503);
const saved = await call('PATCH', '/academy/admin/payment-settings', admin, {
  eurPerTnd: 0.29,
  bank: { beneficiary: 'QIAO SARL', bankName: 'Banque de test', rib: '12345678901234567890', iban: 'TN5912345678901234567890', bic: 'TESTTNTT', instructions: 'Indiquez la référence.' },
});
check('réglages enregistrés', saved.json?.eurPerTnd === 0.29 && saved.json.bank.beneficiary === 'QIAO SARL');
options = (await call('GET', '/academy/payment-options')).json;
check('options publiques : carte (EUR) et virement', options.card.available && options.card.currency === 'EUR' && options.card.rate === 0.29 && options.transfer.available);
check('RIB non exposé dans les options publiques', !JSON.stringify(options).includes('12345678901234567890'));

// --- Carte ---
const card = await call('POST', '/academy/enroll', member, { itemType: 'course', itemId: cardCourse, method: 'card' });
const cardOrder = card.json?.order;
check('carte : session de paiement créée', card.status === 201 && card.json.checkoutUrl && cardOrder.status === 'pending', card.json?.message);
check('carte : montant converti (150 TND × 0,29 = 43,50 €)', cardOrder?.charged?.amount === 43.5 && cardOrder.charged.currency === 'EUR');
check('carte : accès fermé avant paiement (403)', (await call('GET', `/academy/learn/${cardCourse}`, member)).status === 403);
check('carte : seconde commande du même article refusée (409)', (await call('POST', '/academy/enroll', member, { itemType: 'course', itemId: cardCourse, method: 'transfer' })).status === 409);
const sessionRef = card.json.checkoutUrl.split('/').pop();
const declined = await fetch(`${ORIGIN}/api/payments/sandbox/checkout/${sessionRef}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outcome: 'decline' }), redirect: 'manual' });
check('carte refusée : retour sur QIAO', declined.status === 303 && (declined.headers.get('location') ?? '').includes('academy%2Fcommande%2F'));
await wait(500);
check('carte refusée : commande toujours en attente', (await call('GET', `/academy/orders/${cardOrder.id}`, member)).json?.status === 'pending');
const retry = await call('POST', `/academy/orders/${cardOrder.id}/pay`, member);
check('nouvelle tentative : nouvelle session', retry.status === 200 && retry.json.checkoutUrl && retry.json.checkoutUrl !== card.json.checkoutUrl);
const retryRef = retry.json.checkoutUrl.split('/').pop();
await fetch(`${ORIGIN}/api/payments/sandbox/checkout/${retryRef}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outcome: 'success' }), redirect: 'manual' });
let paid = null;
for (let i = 0; i < 10 && paid?.status !== 'paid'; i++) {
  await wait(400);
  paid = (await call('GET', `/academy/orders/${cardOrder.id}`, member)).json;
}
check('carte acceptée : commande payée', paid?.status === 'paid' && paid.paymentMethod === 'card' && paid.paidAt);
check('carte acceptée : accès ouvert', (await call('GET', `/academy/learn/${cardCourse}`, member)).json?.mode === 'learner');
check('commande payée : nouvelle tentative refusée (409)', (await call('POST', `/academy/orders/${cardOrder.id}/pay`, member)).status === 409);

// --- Virement ---
const transfer = await call('POST', '/academy/enroll', member, { itemType: 'course', itemId: transferCourse, method: 'transfer' });
const transferOrder = transfer.json?.order;
check('virement : commande en attente avec coordonnées', transferOrder?.status === 'pending' && transferOrder.transfer?.rib === '12345678901234567890' && transferOrder.transfer.reference === transferOrder.reference);
check('virement : accès fermé avant validation (403)', (await call('GET', `/academy/learn/${transferCourse}`, member)).status === 403);
const queue = (await call('GET', '/academy/admin/orders?status=pending&method=transfer', admin)).json;
check('admin : virement dans la file', queue.items.some((o) => o.id === transferOrder.id) && queue.pendingTransfers >= 1);
check('membre refusé sur la validation (403)', (await call('POST', `/academy/admin/orders/${transferOrder.id}/validate`, member, {})).status === 403);
const validated = await call('POST', `/academy/admin/orders/${transferOrder.id}/validate`, admin, { note: 'Reçu le 24/10' });
check('admin : virement validé', validated.json?.status === 'paid' && validated.json.paymentMethod === 'transfer');
check('virement validé : accès ouvert', (await call('GET', `/academy/learn/${transferCourse}`, member)).json?.mode === 'learner');
check('double validation refusée (409)', (await call('POST', `/academy/admin/orders/${transferOrder.id}/validate`, admin, {})).status === 409);

// --- Annulation ---
const toCancel = (await call('POST', '/academy/enroll', member, { itemType: 'course', itemId: cancelCourse, method: 'card' })).json.order;
const cancelled = await call('POST', `/academy/orders/${toCancel.id}/cancel`, member);
check('membre : commande annulée', cancelled.json?.status === 'cancelled');
check('commande annulée : paiement refusé (409)', (await call('POST', `/academy/orders/${toCancel.id}/pay`, member)).status === 409);
check('commande annulée : nouvelle commande possible', (await call('POST', '/academy/enroll', member, { itemType: 'course', itemId: cancelCourse, method: 'transfer' })).status === 201);
const adminCancel = (await call('GET', '/academy/admin/orders?status=pending', admin)).json.items.find((o) => o.items.some((i) => i.itemId === cancelCourse));
check('admin : annulation avec motif', (await call('POST', `/academy/admin/orders/${adminCancel.id}/cancel`, admin, { note: 'Doublon' })).json?.status === 'cancelled');
check('commande d’un autre membre introuvable (404)', (await call('GET', `/academy/orders/${toCancel.id}`, admin)).status === 404);

// --- Gratuite ---
const free = await call('POST', '/academy/enroll', member, { itemType: 'course', itemId: freeCourse, method: 'card' });
check('formation gratuite : accès immédiat', free.json?.order?.status === 'paid' && free.json.order.paymentMethod === 'free' && !free.json.checkoutUrl);

// --- Liste et journal ---
const mine = (await call('GET', '/academy/orders', member)).json;
check('Mes commandes : statuts', mine.some((o) => o.id === cardOrder.id && o.status === 'paid') && mine.some((o) => o.id === toCancel.id && o.status === 'cancelled'));
const audit = (await call('GET', '/academy/admin/audit?action=academy.order', admin)).json;
const actions = new Set(audit.items.map((a) => a.action));
for (const action of ['academy.order.create', 'academy.order.checkout', 'academy.order.paid', 'academy.order.cancel']) check(`journal : ${action}`, actions.has(action));
check('journal : réglages de paiement', (await call('GET', '/academy/admin/audit?action=academy.payment', admin)).json.items.length > 0);

console.log(failures === 0 ? '\nTous les contrôles sont passés.' : `\n${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
