// Parcours complet via l'API QIAO avec PAYMENT_PROVIDER=stripe : paiement → démarrage → déclaration → échéance → versement,
// puis annulation avant démarrage → remboursement intégral, et refus des notifications non signées.
//
//   Faux serveur Stripe : FAKE_STRIPE_URL=http://127.0.0.1:12111 node scripts/stripe/e2e-flow.mjs
//   Mode test Stripe réel : node scripts/stripe/e2e-flow.mjs   (ouvrir les liens affichés : carte 4000 0000 0000 0077,
//                           compte Express de test ; le script attend que chaque étape soit confirmée)
//
// Seule entorse au fonctionnement réel, propre au test : l'échéance de la période de protection (5 jours) est avancée
// directement en base pour la transaction de test, au lieu d'attendre 120 h. La règle elle-même n'est pas modifiée :
// le script vérifie au contraire que l'échéance calculée est bien déclaration + 120 h.
//
// Variables : QIAO_API (défaut http://127.0.0.1:4100/api), E2E_DB_NAME (défaut DB_NAME de .env), identifiants DB_* de .env.
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const dotenv = Object.fromEntries(
  readFileSync(path.join(here, '../../.env'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);
const env = (key, fallback) => process.env[key] ?? dotenv[key] ?? fallback;
const API = env('QIAO_API', 'http://127.0.0.1:4100/api');
const FAKE = process.env.FAKE_STRIPE_URL ?? null;
const WAIT_MS = Number(env('E2E_WAIT_MS', FAKE ? 90_000 : 15 * 60_000));
const db = new pg.Client({
  host: env('DB_HOST', 'localhost'),
  port: Number(env('DB_PORT', '5432')),
  user: env('DB_USER', 'postgres'),
  password: env('DB_PASSWORD', 'postgres'),
  database: env('E2E_DB_NAME', env('DB_NAME', 'qiao')),
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const step = (text) => console.log(`\n▶ ${text}`);
const info = (text) => console.log(`  ${text}`);
function assert(condition, message) {
  if (!condition) throw new Error(`Échec : ${message}`);
  console.log(`  ✓ ${message}`);
}

async function api(method, route, token, body) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${route} → ${res.status} ${JSON.stringify(data.message ?? data)}`);
  return data;
}

async function waitFor(label, fn, timeout = WAIT_MS) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeout) {
    last = await fn();
    if (last) return last;
    await sleep(2000);
  }
  throw new Error(`Délai dépassé : ${label}`);
}

const fakeHelper = (route, body) =>
  fetch(`${FAKE}${route}`, { method: 'POST', body: new URLSearchParams(body).toString() }).then((r) => r.json());

async function register(fullName, accountType) {
  // Domaine accepté par Stripe pour l'adresse de contact des comptes connectés (les domaines .test sont refusés).
  const email = `e2e.${randomBytes(4).toString('hex')}@example.com`;
  const session = await api('POST', '/auth/register', null, {
    fullName,
    email,
    password: `Qiao-${randomBytes(9).toString('base64url')}`,
    accountType,
    origin: 'north-africa',
    acceptTerms: true,
  });
  return { token: session.token, handle: session.user.handle, id: session.user.id };
}

async function status(token, id) {
  return (await api('GET', `/payments/transactions/${id}`, token)).status;
}

async function payCheckout(client, txId) {
  const { url } = await api('POST', `/payments/transactions/${txId}/checkout`, client.token);
  if (FAKE) {
    const ref = url.split('/').pop();
    await fakeHelper(`/__test/checkout/${ref}/pay`, { outcome: 'success', funds: 'available' });
  } else {
    info(`Ouvrez la page de paiement Stripe (mode test) et payez avec la carte 4000 0000 0000 0077 :\n  ${url}`);
  }
  await waitFor('paiement confirmé (PAID_HELD)', async () => (await status(client.token, txId)) === 'PAID_HELD');
}

async function newTransaction(client, provider, amount) {
  const tx = await api('POST', '/payments/transactions', client.token, {
    providerHandle: provider.handle,
    title: 'Audit qualité usine (test Stripe)',
    description: "Audit qualité d'une ligne de production avant expédition — transaction de test du parcours Stripe.",
    amount,
    currency: 'EUR',
  });
  await api('POST', `/payments/transactions/${tx.id}/accept`, provider.token, {});
  return tx.id;
}

async function main() {
  await db.connect();
  info(`API QIAO : ${API} — Stripe : ${FAKE ? `faux serveur ${FAKE}` : 'mode test réel'}`);
  const policy = await api('GET', '/payments/policy');
  assert(policy.provider === 'stripe' && policy.paymentsEnabled, 'prestataire de paiement actif : stripe');
  assert(policy.deadline.periodDays === 5 && policy.commissionPercent === 10, 'règles inchangées : 5 jours, commission 10 %');

  step('Comptes de test : client et prestataire (profil professionnel)');
  const client = await register('Client E2E Stripe', 'enterprise');
  const provider = await register('Prestataire E2E Stripe', 'expert');
  const { professionalCategories } = await api('GET', '/community/categories');
  await api('PUT', '/community/me/expert', provider.token, { headline: 'Auditeur qualité industrielle', categories: [professionalCategories[0].id] });
  info(`client @${client.handle}, prestataire @${provider.handle}`);

  step('Scénario 1 — paiement → déclaration → versement');
  const txId = await newTransaction(client, provider, '150.00');
  await payCheckout(client, txId);
  const paid = await db.query('SELECT "paymentRef", "checkoutRef", "processingFeeAmount", "amount", "commissionRateBps" FROM service_transactions WHERE id = $1', [txId]);
  const tx = paid.rows[0];
  assert(/^(ch|py)_/.test(tx.paymentRef) && /^cs_/.test(tx.checkoutRef), `paiement Stripe enregistré (${tx.paymentRef})`);
  assert(tx.processingFeeAmount > 0, `frais Stripe réels enregistrés : ${tx.processingFeeAmount} centimes`);

  const { url: onboarding } = await api('POST', '/payments/payout-account/link', provider.token);
  if (FAKE) await fakeHelper(`/__test/accounts/${onboarding.split('/').pop()}/onboard`, { payouts: 'paid' });
  else info(`Ouvrez le lien d'ouverture du compte de versement Stripe (test) et complétez-le avec les données de test Stripe :\n  ${onboarding}`);
  await waitFor('compte de versement actif', async () => (await db.query('SELECT status FROM payout_accounts WHERE "userId" = $1', [provider.id])).rows[0]?.status === 'active');
  assert(true, 'compte de versement Stripe vérifié et actif');

  await api('POST', `/payments/transactions/${txId}/start`, provider.token);
  const declaredAt = Date.now();
  const declared = await api('POST', `/payments/transactions/${txId}/declare-completion`, provider.token, { details: 'Audit réalisé, rapport remis au client.' });
  assert(declared.status === 'PROTECTION_PERIOD', 'déclaration de fin : période de protection ouverte');
  const deadline = new Date(declared.protectionDeadlineAt).getTime();
  assert(Math.abs(deadline - declaredAt - 120 * 3_600_000) < 60_000, `échéance = déclaration + 120 h (${new Date(deadline).toISOString()})`);
  await sleep(4000);
  assert((await status(client.token, txId)) === 'PROTECTION_PERIOD', 'aucun versement avant l’échéance');

  info("Test uniquement : échéance de la période de protection avancée en base pour cette transaction.");
  await db.query(`UPDATE service_transactions SET "protectionDeadlineAt" = now() - interval '1 second' WHERE id = $1`, [txId]);
  const final = await waitFor('versement confirmé (PAID_OUT)', async () => {
    const current = await status(client.token, txId);
    if (current === 'PAYOUT_FAILED') throw new Error('versement en échec');
    return current === 'PAID_OUT' ? current : null;
  });
  assert(final === 'PAID_OUT', 'versement confirmé par Stripe : transaction PAID_OUT');
  const payout = (await db.query('SELECT amount, "commissionAmount", "processingFeeAmount", "providerRef", status FROM service_payouts WHERE "transactionId" = $1', [txId])).rows[0];
  const expectedCommission = Math.round((tx.amount * tx.commissionRateBps) / 10_000);
  assert(payout.commissionAmount === expectedCommission, `commission 10 % du montant libéré : ${payout.commissionAmount}`);
  assert(payout.amount === tx.amount - expectedCommission - tx.processingFeeAmount, `montant versé = brut − commission − frais : ${payout.amount}`);
  assert(/^tr_/.test(payout.providerRef) && payout.status === 'completed', `versement Stripe ${payout.providerRef}`);
  const ledger = (await db.query('SELECT "eventType" AS type FROM service_ledger_entries WHERE "transactionId" = $1', [txId])).rows.map((r) => r.type);
  for (const type of ['PAYMENT_CAPTURED', 'PAYOUT_AUTHORIZED', 'PAYOUT_SUBMITTED', 'PAYOUT_COMPLETED', 'COMMISSION_EARNED']) assert(ledger.includes(type), `grand livre : ${type}`);
  if (FAKE) {
    const state = await fetch(`${FAKE}/__test/state`).then((r) => r.json());
    const transfer = state.objects.find((o) => o.id === payout.providerRef);
    const bank = state.objects.find((o) => o.object === 'payout' && o.metadata?.qiao_transfer === payout.providerRef);
    assert(transfer.amount === payout.amount && transfer.source_transaction === tx.paymentRef, 'transfert rattaché au paiement, du montant versé');
    assert(bank?.status === 'paid' && bank.amount === payout.amount, 'virement bancaire du compte Express payé');
  }

  step('Scénario 2 — annulation avant démarrage → remboursement intégral');
  const tx2 = await newTransaction(client, provider, '80.00');
  await payCheckout(client, tx2);
  await api('POST', `/payments/transactions/${tx2}/cancel`, client.token, { reason: 'Besoin annulé avant démarrage (test).' });
  await waitFor('remboursement confirmé (REFUNDED)', async () => (await status(client.token, tx2)) === 'REFUNDED');
  const refund = (await db.query('SELECT amount, "providerRef", status FROM service_refunds WHERE "transactionId" = $1', [tx2])).rows[0];
  assert(refund.amount === 8000 && /^re_/.test(refund.providerRef) && refund.status === 'completed', `remboursement intégral Stripe ${refund.providerRef}`);

  step('Notifications non authentiques refusées');
  const forged = await fetch(`${API}/payments/webhooks/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}` },
    body: JSON.stringify({ id: 'evt_forged', type: 'payout.paid', livemode: false, created: 1, data: { object: {} } }),
  });
  assert(forged.status === 401, 'signature invalide → 401');
  const unsigned = await fetch(`${API}/payments/webhooks/stripe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert(unsigned.status === 401, 'signature absente → 401');
  const events = (await db.query(`SELECT type, status FROM payment_webhook_events WHERE provider = 'stripe'`)).rows;
  info(`notifications Stripe enregistrées : ${events.length} (${[...new Set(events.map((e) => `${e.type}:${e.status}`))].join(', ') || 'aucune — suivi par rapprochement'})`);

  console.log('\nParcours Stripe vérifié de bout en bout.');
}

main()
  .catch((err) => {
    console.error(`\n✗ ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.end());
