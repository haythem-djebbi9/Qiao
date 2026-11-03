// Contrôles de l'adaptateur StripePaymentGateway contre le faux serveur Stripe (aucun identifiant requis).
// Usage : node scripts/stripe/adapter-checks.cjs
/* eslint-disable @typescript-eslint/no-require-imports */
require('reflect-metadata');
require('ts-node').register({ transpileOnly: true, project: require('path').join(__dirname, '../../tsconfig.json') });
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { StripePaymentGateway, verifyStripeSignature, signStripePayload } = require('../../src/modules/payments/gateway/stripe.gateway');

const PORT = 12199;
const SECRET = 'whsec_checks';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.stack ?? err}`);
    process.exitCode = 1;
  }
}

(async () => {
  const { startFakeStripe } = await import(pathToFileURL(path.join(__dirname, 'fake-stripe.mjs')).href);
  const fake = await startFakeStripe({ port: PORT, apiKey: 'sk_test_checks', webhookUrl: null, payoutDelayMs: 300, quiet: true });
  const env = {
    STRIPE_SECRET_KEY: 'sk_test_checks',
    STRIPE_WEBHOOK_SECRET: `whsec_other,${SECRET}`,
    STRIPE_API_BASE: `http://127.0.0.1:${PORT}`,
    STRIPE_CONNECT_COUNTRY: 'FR',
    NODE_ENV: 'development',
  };
  const gateway = new StripePaymentGateway({ get: (key, fallback) => env[key] ?? fallback });
  const helper = (p, body = {}) =>
    fetch(`http://127.0.0.1:${PORT}${p}`, { method: 'POST', body: new URLSearchParams(body).toString() }).then((r) => r.json());
  const objects = (type) => [...fake.store.values()].filter((o) => o.object === type);
  const signed = (event) => {
    const body = JSON.stringify(event);
    return [Buffer.from(body), { 'stripe-signature': signStripePayload(SECRET, body) }];
  };
  let n = 0;
  const checkoutInput = (amount = 15000) => ({
    transactionId: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`,
    reference: `QIAO-TEST-${n}`,
    description: 'Audit qualité usine — prestataire : Test',
    amount,
    currency: 'EUR',
    returnUrl: 'http://localhost:3000/?tab=dashboard&payment=return',
    idempotencyKey: `checkout:tx${n}:1`,
  });
  async function paidCheckout(funds = 'available', amount) {
    const input = checkoutInput(amount);
    const session = await gateway.createCheckout(input);
    const paid = await helper(`/__test/checkout/${session.ref}/pay`, { outcome: 'success', funds });
    return { input, session, charge: paid.charge };
  }

  console.log('Signature des notifications');
  await check('signature valide acceptée (deux secrets, plusieurs v1)', () => {
    const body = Buffer.from('{"id":"evt_1"}');
    const t = Math.floor(Date.now() / 1000);
    const good = signStripePayload(SECRET, body.toString(), t).split(',')[1];
    verifyStripeSignature(['whsec_other', SECRET], `t=${t},v1=${'0'.repeat(64)},${good}`, body);
  });
  await check('corps modifié refusé', () => assert.throws(() => verifyStripeSignature([SECRET], signStripePayload(SECRET, '{"a":1}'), Buffer.from('{"a":2}')), /invalide/));
  await check('mauvais secret refusé', () => assert.throws(() => verifyStripeSignature([SECRET], signStripePayload('whsec_x', '{}'), Buffer.from('{}')), /invalide/));
  await check('horodatage hors tolérance (5 min) refusé', () =>
    assert.throws(() => verifyStripeSignature([SECRET], signStripePayload(SECRET, '{}', Math.floor(Date.now() / 1000) - 600), Buffer.from('{}')), /expirée/));
  await check('en-tête absent refusé', () => assert.throws(() => verifyStripeSignature([SECRET], undefined, Buffer.from('{}')), /absente/));
  await check('événement réel reçu avec une clé de test : ignoré', async () => {
    const [raw, headers] = signed({ id: 'evt_live', type: 'account.updated', created: 1, livemode: true, data: { object: { id: 'acct_x' } } });
    assert.equal(await gateway.verifyWebhook(raw, headers), null);
  });
  await check('type d’événement non suivi : ignoré', async () => {
    const [raw, headers] = signed({ id: 'evt_x', type: 'customer.created', created: 1, livemode: false, data: { object: { id: 'cus_x' } } });
    assert.equal(await gateway.verifyWebhook(raw, headers), null);
  });

  console.log('Session de paiement');
  await check('même clé ⇒ même session (idempotence), fonds retenus sur la plateforme', async () => {
    const input = checkoutInput();
    const a = await gateway.createCheckout(input);
    const b = await gateway.createCheckout(input);
    assert.equal(a.ref, b.ref);
    assert.match(a.url, /__checkout/);
    const session = fake.store.get(a.ref);
    assert.equal(session._intent.capture_method, 'automatic');
    assert.equal(session._intent.transfer_group, `qiao_tx_${input.transactionId}`);
    assert.equal(session._intent.transfer_data, undefined, 'aucun transfert automatique (destination charge)');
    assert.equal(session.metadata.transactionId, input.transactionId);
    assert.equal((await gateway.retrieve('checkout', a.ref)).status, 'pending');
  });
  await check('paiement confirmé : référence du paiement, montant, frais réels', async () => {
    const { session, charge } = await paidCheckout();
    const op = await gateway.retrieve('checkout', session.ref);
    assert.deepEqual([op.status, op.paymentRef, op.amount, op.currency, op.fee], ['succeeded', charge, 15000, 'EUR', Math.round(15000 * 0.015) + 25]);
  });
  await check('webhook checkout.session.completed ⇒ checkout.succeeded (relu chez Stripe)', async () => {
    const { input, session, charge } = await paidCheckout();
    const object = { ...fake.store.get(session.ref) };
    const [raw, headers] = signed({ id: 'evt_cs', type: 'checkout.session.completed', created: 1, livemode: false, data: { object } });
    const event = await gateway.verifyWebhook(raw, headers);
    assert.equal(event.type, 'checkout.succeeded');
    assert.equal(event.paymentRef, charge);
    assert.equal(event.metadata.transactionId, input.transactionId);
    assert.equal(event.fee, Math.round(15000 * 0.015) + 25);
  });
  await check('paiement asynchrone refusé ⇒ checkout.failed', async () => {
    const input = checkoutInput();
    const session = await gateway.createCheckout(input);
    await helper(`/__test/checkout/${session.ref}/pay`, { outcome: 'async_fail' });
    const op = await gateway.retrieve('checkout', session.ref);
    assert.equal(op.status, 'failed');
  });
  await check('expiration d’une session ouverte, puis nouvelle session pour la même tentative', async () => {
    const input = checkoutInput();
    const first = await gateway.createCheckout(input);
    await gateway.expireCheckout(first.ref);
    await gateway.expireCheckout(first.ref); // déjà expirée : sans erreur
    assert.equal((await gateway.retrieve('checkout', first.ref)).status, 'cancelled');
    const second = await gateway.createCheckout(input);
    assert.notEqual(second.ref, first.ref);
    assert.equal(fake.store.get(second.ref).status, 'open');
  });

  console.log('Compte de versement (KYC Stripe)');
  let accountRef;
  await check('ouverture d’un compte Express en versements manuels + lien de vérification', async () => {
    const link = await gateway.createAccountLink({ userId: 'user-1', accountRef: null, email: 'prestataire@example.com', displayName: 'Prestataire Test', returnUrl: 'http://localhost:3000/?payout=return' });
    accountRef = link.accountRef;
    assert.match(link.url, /__onboarding/);
    const account = fake.store.get(accountRef);
    assert.equal(account.type, 'express');
    assert.equal(account.settings.payouts.schedule.interval, 'manual');
    assert.equal(await gateway.retrieveAccount(accountRef), 'pending');
    const again = await gateway.createAccountLink({ userId: 'user-1', accountRef, returnUrl: 'http://localhost:3000/' });
    assert.equal(again.accountRef, accountRef);
    assert.equal(objects('account').length, 1);
  });
  await check('compte vérifié ⇒ actif, webhook account.updated, lien vers le tableau de bord Express', async () => {
    await helper(`/__test/accounts/${accountRef}/onboard`, { payouts: 'paid' });
    assert.equal(await gateway.retrieveAccount(accountRef), 'active');
    const [raw, headers] = signed({ id: 'evt_acct', type: 'account.updated', created: 1, livemode: false, account: accountRef, data: { object: { ...fake.store.get(accountRef) } } });
    const event = await gateway.verifyWebhook(raw, headers);
    assert.deepEqual([event.type, event.objectRef, event.accountStatus], ['account.updated', accountRef, 'active']);
    const link = await gateway.createAccountLink({ userId: 'user-1', accountRef, returnUrl: 'http://localhost:3000/' });
    assert.match(link.url, /__express/);
  });

  console.log('Versement');
  const payoutInput = (paymentRef, amount, key, transactionId = 'tx') => ({
    accountRef,
    paymentRef,
    amount,
    currency: 'EUR',
    idempotencyKey: key,
    metadata: { transactionId, payoutId: `po-${key}`, attempt: '0' },
  });
  await check('fonds pas encore disponibles : transfert rattaché au paiement, virement en attente, aucun doublon', async () => {
    const { input, charge } = await paidCheckout('pending');
    const op = await gateway.payout(payoutInput(charge, 13000, 'payout:p1:0', input.transactionId));
    assert.equal(op.status, 'pending');
    assert.match(op.ref, /^tr_/);
    const again = await gateway.payout(payoutInput(charge, 13000, 'payout:p1:0', input.transactionId));
    assert.equal(again.ref, op.ref);
    const transfers = objects('transfer').filter((t) => t.source_transaction === charge);
    assert.equal(transfers.length, 1);
    assert.equal(transfers[0].amount, 13000);
    assert.equal(objects('payout').filter((p) => p.metadata.qiao_transfer === op.ref).length, 0);
    assert.equal((await gateway.retrieve('payout', op.ref)).status, 'pending');
    // Les fonds deviennent disponibles : la consultation déclenche le virement (une seule fois).
    await helper(`/__test/charges/${charge}/available`);
    assert.equal((await gateway.retrieve('payout', op.ref)).status, 'pending');
    assert.equal((await gateway.retrieve('payout', op.ref)).status, 'pending');
    const bank = objects('payout').filter((p) => p.metadata.qiao_transfer === op.ref);
    assert.equal(bank.length, 1);
    assert.equal(bank[0].amount, 13000);
    assert.equal(bank[0].metadata.payoutId, 'po-payout:p1:0');
    await sleep(500);
    assert.equal((await gateway.retrieve('payout', op.ref)).status, 'succeeded');
    assert.equal(await gateway.cancelPayout(op.ref), false, 'virement payé : irrévocable');
  });
  await check('webhook payout.paid (compte connecté) ⇒ payout.paid sur la référence du transfert', async () => {
    const bank = objects('payout').find((p) => p.status === 'paid');
    const [raw, headers] = signed({ id: 'evt_po', type: 'payout.paid', created: 1, livemode: false, account: accountRef, data: { object: { ...bank, _account: undefined } } });
    const event = await gateway.verifyWebhook(raw, headers);
    assert.deepEqual([event.type, event.objectRef, event.metadata.payoutId], ['payout.paid', bank.metadata.qiao_transfer, 'po-payout:p1:0']);
  });
  await check('annulation d’un virement non exécuté : virement annulé, transfert contre-passé', async () => {
    await helper(`/__test/accounts/${accountRef}/payouts`, { mode: 'hold' });
    const { input, charge } = await paidCheckout('available');
    const op = await gateway.payout(payoutInput(charge, 13000, 'payout:p2:0', input.transactionId));
    assert.equal(op.status, 'pending');
    assert.equal(await gateway.cancelPayout(op.ref), true);
    const transfer = fake.store.get(op.ref);
    assert.equal(transfer.reversed, true);
    assert.equal(objects('payout').find((p) => p.metadata.qiao_transfer === op.ref).status, 'canceled');
    assert.equal((await gateway.retrieve('payout', op.ref)).status, 'cancelled');
  });
  await check('annulation avant tout virement (fonds en attente) : aucun virement ne sera créé', async () => {
    const { input, charge } = await paidCheckout('pending');
    const op = await gateway.payout(payoutInput(charge, 13000, 'payout:p3:0', input.transactionId));
    assert.equal(await gateway.cancelPayout(op.ref), true);
    await helper(`/__test/charges/${charge}/available`);
    assert.equal((await gateway.retrieve('payout', op.ref)).status, 'cancelled');
    assert.equal(objects('payout').filter((p) => p.metadata.qiao_transfer === op.ref).length, 0);
  });
  await check('virement rejeté par la banque : échec signalé, fonds rapatriés, nouvelle tentative possible', async () => {
    await helper(`/__test/accounts/${accountRef}/payouts`, { mode: 'fail' });
    const { input, charge } = await paidCheckout('available');
    const first = await gateway.payout(payoutInput(charge, 13000, 'payout:p4:0', input.transactionId));
    await sleep(500);
    const failed = await gateway.retrieve('payout', first.ref);
    assert.equal(failed.status, 'failed');
    assert.match(failed.failureReason, /banque/);
    assert.equal(fake.store.get(first.ref).reversed, true);
    await helper(`/__test/accounts/${accountRef}/payouts`, { mode: 'paid' });
    const retry = await gateway.payout(payoutInput(charge, 13000, 'payout:p4:1', input.transactionId));
    assert.notEqual(retry.ref, first.ref);
    await sleep(500);
    assert.equal((await gateway.retrieve('payout', retry.ref)).status, 'succeeded');
  });
  await check('compte sans capacité de transfert : refus définitif (pas de rejeu infini)', async () => {
    const link = await gateway.createAccountLink({ userId: 'user-2', accountRef: null, email: 'prestataire2@example.com', returnUrl: 'http://localhost:3000/' });
    const { charge } = await paidCheckout('available');
    const op = await gateway.payout({ ...payoutInput(charge, 1000, 'payout:p5:0'), accountRef: link.accountRef });
    assert.equal(op.status, 'failed');
    assert.match(op.failureReason, /refusé par Stripe/);
  });
  await check('versement sans paiement d’origine : erreur (résultat inconnu, rejoué)', async () => {
    await assert.rejects(gateway.payout({ ...payoutInput(null, 1000, 'payout:p6:0') }), /paiement d’origine/);
  });

  console.log('Remboursement');
  await check('remboursement idempotent (même clé ⇒ un seul remboursement)', async () => {
    const { charge } = await paidCheckout();
    const input = { paymentRef: charge, amount: 5000, currency: 'EUR', idempotencyKey: 'refund:r1:0', metadata: { transactionId: 'tx', refundId: 'r1', attempt: '0' } };
    const a = await gateway.refund(input);
    const b = await gateway.refund(input);
    assert.equal(a.status, 'succeeded');
    assert.equal(a.ref, b.ref);
    assert.equal(objects('refund').filter((r) => r.charge === charge).length, 1);
    const over = await gateway.refund({ ...input, amount: 20000, idempotencyKey: 'refund:r1:1' });
    assert.equal(over.status, 'failed');
    assert.match(over.ref, /^failed_/);
  });
  await check('remboursement refusé ensuite par la banque ⇒ refund.failed (webhook)', async () => {
    const input = checkoutInput();
    const session = await gateway.createCheckout(input);
    const paid = await helper(`/__test/checkout/${session.ref}/pay`, { outcome: 'success', refunds: 'fail' });
    const op = await gateway.refund({ paymentRef: paid.charge, amount: 15000, currency: 'EUR', idempotencyKey: 'refund:r2:0', metadata: { refundId: 'r2', attempt: '0' } });
    assert.equal(op.status, 'pending');
    await sleep(500);
    assert.equal((await gateway.retrieve('refund', op.ref)).status, 'failed');
    const [raw, headers] = signed({ id: 'evt_re', type: 'refund.failed', created: 1, livemode: false, data: { object: { ...fake.store.get(op.ref) } } });
    const event = await gateway.verifyWebhook(raw, headers);
    assert.deepEqual([event.type, event.objectRef, event.metadata.refundId], ['refund.failed', op.ref, 'r2']);
  });
  await check('remboursement après annulation d’un versement : fonds restés chez le prestataire rapatriés d’abord', async () => {
    await helper(`/__test/accounts/${accountRef}/payouts`, { mode: 'hold' });
    const { input, charge } = await paidCheckout('available');
    const op = await gateway.payout(payoutInput(charge, 13000, 'payout:p7:0', input.transactionId));
    const transfer = fake.store.get(op.ref);
    transfer.metadata.qiao_cancelled = '1'; // annulation dont la contre-passation avait échoué
    const bank = objects('payout').find((p) => p.metadata.qiao_transfer === op.ref);
    bank.status = 'canceled';
    const refund = await gateway.refund({ paymentRef: charge, amount: 15000, currency: 'EUR', idempotencyKey: 'refund:r3:0', metadata: { refundId: 'r3', attempt: '0' } });
    assert.equal(refund.status, 'succeeded');
    assert.equal(fake.store.get(op.ref).reversed, true);
  });

  console.log('Clés d’idempotence transmises à Stripe');
  await check('chaque création (session, compte, transfert, virement, remboursement, contre-passation) porte une clé', () => {
    const creations = fake.requests.filter((r) => r.method === 'POST' && /\/(checkout\/sessions|accounts|transfers|payouts|refunds|reversals)$/.test(r.path));
    const missing = creations.filter((r) => !r.idempotencyKey);
    assert.deepEqual(missing.map((r) => r.path), []);
    assert.ok(creations.some((r) => r.path === '/v1/transfers' && r.idempotencyKey === 'qiao:payout:p1:0'));
    assert.ok(creations.some((r) => r.path === '/v1/payouts' && r.idempotencyKey === 'qiao:payout:p1:0:bank'));
  });

  await fake.close();
  console.log(`\n${passed} contrôle(s) réussi(s)${process.exitCode ? ', des échecs ci-dessus' : ''}.`);
})();
