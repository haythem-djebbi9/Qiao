// Faux serveur d'API Stripe (en mémoire) pour vérifier l'adaptateur StripePaymentGateway sans identifiants.
// Il reproduit le sous-ensemble utilisé par QIAO : Checkout, charges et écritures de solde, remboursements, comptes Express,
// transferts (source_transaction, contre-passations), virements des comptes connectés, idempotence (Idempotency-Key)
// et notifications signées comme Stripe (en-tête Stripe-Signature).
//
// Usage autonome : node scripts/stripe/fake-stripe.mjs   (variables FAKE_STRIPE_* ci-dessous)
// Pages de test (équivalents des cartes et comptes de test Stripe) : routes /__test/…
import http from 'node:http';
import { createHmac, randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const newId = (prefix) => `${prefix}_${randomBytes(12).toString('hex')}`;
const now = () => Math.floor(Date.now() / 1000);

/** a[b][0][c]=v → { a: { b: { 0: { c: 'v' } } } } (les tableaux restent des objets à clés numériques). */
function parseForm(text) {
  const out = {};
  for (const pair of (text || '').split('&').filter(Boolean)) {
    const [rawKey, rawValue = ''] = pair.split('=');
    const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    const value = decodeURIComponent(rawValue.replace(/\+/g, ' '));
    const path = key.replace(/\]/g, '').split('[');
    let node = out;
    path.forEach((segment, i) => {
      if (i === path.length - 1) node[segment] = value;
      else node = node[segment] ??= {};
    });
  }
  return out;
}

export function startFakeStripe(options = {}) {
  const port = Number(options.port ?? process.env.FAKE_STRIPE_PORT ?? 12111);
  const apiKey = options.apiKey ?? process.env.FAKE_STRIPE_KEY ?? 'sk_test_fake_e2e';
  const webhookUrl = options.webhookUrl === undefined ? (process.env.FAKE_STRIPE_WEBHOOK_URL ?? 'http://127.0.0.1:4100/api/payments/webhooks/stripe') : options.webhookUrl;
  const webhookSecret = options.webhookSecret ?? process.env.FAKE_STRIPE_WEBHOOK_SECRET ?? 'whsec_e2e_local';
  const payoutDelayMs = Number(options.payoutDelayMs ?? process.env.FAKE_STRIPE_PAYOUT_DELAY_MS ?? 1500);
  const log = options.quiet ? () => {} : (...args) => console.log('[fake-stripe]', ...args);

  const store = new Map(); // id → objet
  const idempotency = new Map(); // compte|clé → { params, status, body }
  const requests = [];
  const events = [];

  const put = (obj) => (store.set(obj.id, obj), obj);
  const get = (id) => store.get(id);
  const all = (object) => [...store.values()].filter((o) => o.object === object);
  const error = (status, message, code, type = 'invalid_request_error') => ({ status, body: { error: { type, code, message } } });
  const ok = (body) => ({ status: 200, body });
  const list = (data) => ok({ object: 'list', data, has_more: false });
  const publicView = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => !k.startsWith('_')));

  function expand(obj, paths) {
    const copy = publicView(obj);
    for (const path of paths) {
      const [head, ...rest] = path.split('.');
      const ref = copy[head];
      if (typeof ref === 'string' && get(ref)) copy[head] = rest.length ? expand(get(ref), [rest.join('.')]) : publicView(get(ref));
      else if (ref && typeof ref === 'object' && rest.length) copy[head] = expand(ref, [rest.join('.')]);
    }
    return copy;
  }

  async function sendEvent(type, object, account) {
    const event = { id: newId('evt'), object: 'event', type, created: now(), livemode: false, ...(account && { account }), data: { object: publicView(object) } };
    events.push(event);
    if (!webhookUrl) return event;
    const body = JSON.stringify(event);
    const t = now();
    const signature = createHmac('sha256', webhookSecret).update(`${t}.${body}`).digest('hex');
    try {
      const res = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Stripe-Signature': `t=${t},v1=${signature}` }, body });
      event._delivery = res.status;
      log(`webhook ${type} → ${res.status}`);
    } catch (err) {
      event._delivery = `error: ${err.message}`;
      log(`webhook ${type} non délivré : ${err.message}`);
    }
    return event;
  }

  /** Solde disponible d'un compte connecté (fonds transférés disponibles − contre-passations − virements). */
  function availableBalance(account, currency) {
    let total = 0;
    for (const transfer of all('transfer').filter((t) => t.destination === account && t.currency === currency)) {
      const payment = get(transfer.destination_payment);
      if (get(payment.balance_transaction).status === 'available') total += transfer.amount - transfer.amount_reversed;
    }
    for (const payout of all('payout').filter((p) => p._account === account && p.currency === currency)) {
      if (payout.status !== 'failed' && payout.status !== 'canceled') total -= payout.amount;
    }
    return total;
  }

  function settlePayout(payout) {
    setTimeout(() => {
      if (payout.status !== 'pending' || get(payout._account)._payoutMode === 'hold') return;
      const fail = get(payout._account)._payoutMode === 'fail';
      payout.status = fail ? 'failed' : 'paid';
      if (fail) Object.assign(payout, { failure_code: 'account_closed', failure_message: 'The bank account has been closed.' });
      void sendEvent(fail ? 'payout.failed' : 'payout.paid', payout, payout._account);
    }, payoutDelayMs).unref?.();
  }

  const routes = [
    // --- Checkout -----------------------------------------------------------------------------
    ['POST', /^\/v1\/checkout\/sessions$/, ({ params }) => {
      const item = params.line_items?.['0'];
      if (!item?.price_data?.unit_amount || !item.price_data.currency) return error(400, 'line_items requis.', 'parameter_missing');
      if (params.payment_intent_data?.capture_method !== 'automatic') return error(400, 'capture_method automatic attendu par QIAO.', 'parameter_invalid');
      const id = newId('cs_test');
      return ok(put({
        id, object: 'checkout.session', url: `http://127.0.0.1:${port}/__checkout/${id}`, status: 'open', payment_status: 'unpaid',
        amount_total: Number(item.price_data.unit_amount), currency: item.price_data.currency, payment_intent: null, livemode: false,
        metadata: params.metadata ?? {}, success_url: params.success_url, _intent: params.payment_intent_data ?? {},
      }));
    }],
    ['GET', /^\/v1\/checkout\/sessions\/([^/]+)$/, ({ match, params }) => {
      const session = get(match[1]);
      return session ? ok(expand(session, Object.values(params.expand ?? {}))) : error(404, 'No such checkout.session', 'resource_missing');
    }],
    ['POST', /^\/v1\/checkout\/sessions\/([^/]+)\/expire$/, ({ match }) => {
      const session = get(match[1]);
      if (!session) return error(404, 'No such checkout.session', 'resource_missing');
      if (session.status !== 'open') return error(400, `Only Checkout Sessions with a status of open can be expired.`);
      session.status = 'expired';
      return ok(publicView(session));
    }],
    ['GET', /^\/v1\/charges\/([^/]+)$/, ({ match, params, account }) => {
      const charge = get(match[1]);
      if (!charge || (charge._account ?? null) !== (account ?? null)) return error(404, 'No such charge', 'resource_missing');
      return ok(expand(charge, Object.values(params.expand ?? {})));
    }],

    // --- Remboursements -------------------------------------------------------------------------
    ['GET', /^\/v1\/refunds$/, ({ params }) => list(all('refund').filter((r) => !params.charge || r.charge === params.charge).map(publicView))],
    ['GET', /^\/v1\/refunds\/([^/]+)$/, ({ match }) => (get(match[1]) ? ok(publicView(get(match[1]))) : error(404, 'No such refund', 'resource_missing'))],
    ['POST', /^\/v1\/refunds$/, ({ params }) => {
      const charge = get(params.charge);
      if (!charge || charge._account) return error(404, `No such charge: '${params.charge}'`, 'resource_missing');
      const amount = Number(params.amount ?? charge.amount);
      if (amount > charge.amount - charge._refunded) return error(400, 'Refund amount is greater than unrefunded amount on charge.', 'amount_too_large');
      charge._refunded += amount;
      const refund = put({ id: newId('re'), object: 'refund', amount, currency: charge.currency, status: charge._refundMode === 'fail' ? 'pending' : 'succeeded', charge: charge.id, metadata: params.metadata ?? {} });
      if (charge._refundMode === 'fail') {
        setTimeout(() => {
          Object.assign(refund, { status: 'failed', failure_reason: 'expired_or_canceled_card' });
          charge._refunded -= amount;
          void sendEvent('refund.failed', refund);
        }, payoutDelayMs).unref?.();
      }
      void sendEvent('refund.created', refund);
      return ok(publicView(refund));
    }],

    // --- Comptes Express --------------------------------------------------------------------------
    ['POST', /^\/v1\/accounts$/, ({ params }) => ok(put({
      id: newId('acct'), object: 'account', type: params.type, country: params.country, details_submitted: false, payouts_enabled: false,
      capabilities: { transfers: params.capabilities?.transfers?.requested === 'true' ? 'inactive' : undefined },
      requirements: { currently_due: ['external_account', 'individual.verification.document'], past_due: [], disabled_reason: 'requirements.past_due' },
      settings: params.settings ?? {}, metadata: params.metadata ?? {},
    }))],
    // Accounts v2 : configuration « recipient », vue v1 identique (capacité transfers, payouts_enabled).
    ['POST', /^\/v2\/core\/accounts$/, ({ params }) => {
      if (params.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.requested !== true) return error(400, 'configuration.recipient requise');
      if (!params.contact_email) return error(400, "Some fields in the request were invalid: 'configuration.recipient: If configuration.recipient is supplied, the Account must have a contact email.'");
      if (params.dashboard === 'express' && (params.defaults?.responsibilities?.fees_collector !== 'application' || params.defaults?.responsibilities?.losses_collector !== 'application')) {
        return error(400, 'If `dashboard` is `express`, `fees_collector` must be `application` and `losses_collector` must be `application`.', 'account_controller_express_dash_without_application_losses_or_fees');
      }
      const account = put({
        id: newId('acct'), object: 'account', type: 'express', country: String(params.identity?.country ?? '').toUpperCase(), details_submitted: false, payouts_enabled: false,
        capabilities: { transfers: 'inactive' },
        requirements: { currently_due: ['external_account', 'individual.verification.document'], past_due: [], disabled_reason: 'requirements.past_due' },
        settings: {}, metadata: params.metadata ?? {},
      });
      return ok({ id: account.id, object: 'v2.core.account', dashboard: params.dashboard, applied_configurations: ['recipient'] });
    }],
    ['POST', /^\/v1\/accounts\/([^/]+)$/, ({ match, params }) => {
      const account = get(match[1]);
      if (!account) return error(404, 'No such account', 'resource_missing');
      if (params.settings) account.settings = { ...account.settings, ...params.settings };
      return ok(publicView(account));
    }],
    ['GET', /^\/v1\/accounts\/([^/]+)$/, ({ match }) => (get(match[1]) ? ok(publicView(get(match[1]))) : error(404, 'No such account', 'resource_missing'))],
    ['POST', /^\/v1\/account_links$/, ({ params }) => (get(params.account) ? ok({ object: 'account_link', url: `http://127.0.0.1:${port}/__onboarding/${params.account}`, expires_at: now() + 300 }) : error(404, 'No such account', 'resource_missing'))],
    ['POST', /^\/v1\/accounts\/([^/]+)\/login_links$/, ({ match }) => ok({ object: 'login_link', url: `http://127.0.0.1:${port}/__express/${match[1]}` })],

    // --- Transferts -------------------------------------------------------------------------------
    ['GET', /^\/v1\/transfers$/, ({ params }) => list(all('transfer').filter((t) => !params.transfer_group || t.transfer_group === params.transfer_group).map(publicView))],
    ['GET', /^\/v1\/transfers\/([^/]+)$/, ({ match }) => (get(match[1]) ? ok(publicView(get(match[1]))) : error(404, 'No such transfer', 'resource_missing'))],
    ['POST', /^\/v1\/transfers$/, ({ params }) => {
      const destination = get(params.destination);
      if (!destination || destination.capabilities?.transfers !== 'active') {
        return error(400, 'Your destination account needs to have at least one of the following capabilities enabled: transfers, crypto_transfers, legacy_payments');
      }
      const charge = get(params.source_transaction);
      if (!charge) return error(400, `No such charge: '${params.source_transaction}'`, 'resource_missing');
      const balance = get(charge.balance_transaction);
      if (balance.currency !== params.currency) return error(400, 'The currency of source_transaction’s balance transaction must match the transfer currency.');
      const amount = Number(params.amount);
      const already = all('transfer').filter((t) => t.source_transaction === charge.id).reduce((sum, t) => sum + t.amount - t.amount_reversed, 0);
      if (amount + already > charge.amount) return error(400, 'Transfers using this transaction as a source must not exceed the source amount.');
      const paymentBalance = put({ id: newId('txn'), object: 'balance_transaction', amount, net: amount, fee: 0, currency: params.currency, status: balance.status, _account: destination.id });
      const payment = put({ id: newId('py'), object: 'charge', amount, currency: params.currency, transfer_group: null, balance_transaction: paymentBalance.id, _account: destination.id, _refunded: 0 });
      return ok(publicView(put({
        id: newId('tr'), object: 'transfer', amount, amount_reversed: 0, currency: params.currency, created: now(), destination: destination.id,
        destination_payment: payment.id, reversed: false, source_transaction: charge.id, transfer_group: charge.transfer_group, metadata: params.metadata ?? {},
      })));
    }],
    ['POST', /^\/v1\/transfers\/([^/]+)$/, ({ match, params }) => {
      const transfer = get(match[1]);
      if (!transfer) return error(404, 'No such transfer', 'resource_missing');
      for (const [k, v] of Object.entries(params.metadata ?? {})) if (v === '') delete transfer.metadata[k]; else transfer.metadata[k] = v;
      return ok(publicView(transfer));
    }],
    ['POST', /^\/v1\/transfers\/([^/]+)\/reversals$/, ({ match, params }) => {
      const transfer = get(match[1]);
      if (!transfer) return error(404, 'No such transfer', 'resource_missing');
      const amount = Number(params.amount ?? transfer.amount - transfer.amount_reversed);
      if (amount > transfer.amount - transfer.amount_reversed) return error(400, 'Reversal amount exceeds the remaining transfer amount.');
      const paid = all('payout').filter((p) => p._account === transfer.destination && ['pending', 'in_transit', 'paid'].includes(p.status)).reduce((s, p) => s + p.amount, 0);
      const credited = all('transfer').filter((t) => t.destination === transfer.destination).reduce((s, t) => s + t.amount - t.amount_reversed, 0);
      if (credited - paid < amount) return error(400, 'Insufficient funds in the connected account to reverse this transfer.', 'balance_insufficient');
      transfer.amount_reversed += amount;
      transfer.reversed = transfer.amount_reversed === transfer.amount;
      return ok({ id: newId('trr'), object: 'transfer_reversal', amount, transfer: transfer.id });
    }],

    // --- Virements des comptes connectés --------------------------------------------------------------
    ['GET', /^\/v1\/payouts$/, ({ params, account }) => {
      const since = Number(params.created?.gte ?? 0);
      return list(all('payout').filter((p) => p._account === account && p.created >= since).map(publicView));
    }],
    ['GET', /^\/v1\/payouts\/([^/]+)$/, ({ match, account }) => {
      const payout = get(match[1]);
      return payout && payout._account === account ? ok(publicView(payout)) : error(404, 'No such payout', 'resource_missing');
    }],
    ['POST', /^\/v1\/payouts$/, ({ params, account }) => {
      const owner = get(account);
      if (!owner) return error(400, 'Stripe-Account requis.');
      if (owner.settings?.payouts?.schedule?.interval !== 'manual') return error(400, 'Ce compte doit être en versements manuels.');
      const amount = Number(params.amount);
      if (amount > availableBalance(account, params.currency)) return error(400, 'You have insufficient funds in your Stripe account for this transfer.', 'balance_insufficient');
      const payout = put({ id: newId('po'), object: 'payout', amount, currency: params.currency, status: 'pending', created: now(), metadata: params.metadata ?? {}, _account: account });
      settlePayout(payout);
      return ok(publicView(payout));
    }],
    ['POST', /^\/v1\/payouts\/([^/]+)\/cancel$/, ({ match, account }) => {
      const payout = get(match[1]);
      if (!payout || payout._account !== account) return error(404, 'No such payout', 'resource_missing');
      if (payout.status !== 'pending') return error(400, 'Payouts can only be canceled while they are pending.');
      payout.status = 'canceled';
      void sendEvent('payout.canceled', payout, account);
      return ok(publicView(payout));
    }],
  ];

  // --- Actions de test (équivalents des cartes / comptes de test de Stripe) ------------------------------
  const testRoutes = [
    // outcome : success (carte acceptée) | async_fail (paiement asynchrone refusé) ; funds : available (carte 4000…0077) | pending (4242…)
    ['POST', /^\/__test\/checkout\/([^/]+)\/pay$/, async ({ match, params }) => {
      const session = get(match[1]);
      if (!session || session.status !== 'open') return error(400, 'Session non ouverte.');
      const fee = Math.round(session.amount_total * 0.015) + 25;
      const balance = put({ id: newId('txn'), object: 'balance_transaction', amount: session.amount_total, net: session.amount_total - fee, fee, currency: session.currency, status: params.funds === 'pending' ? 'pending' : 'available' });
      const charge = put({ id: newId('ch'), object: 'charge', amount: session.amount_total, currency: session.currency, transfer_group: session._intent.transfer_group ?? null, balance_transaction: balance.id, _refunded: 0, _refundMode: params.refunds === 'fail' ? 'fail' : 'ok' });
      const failed = params.outcome === 'async_fail';
      const intent = put({ id: newId('pi'), object: 'payment_intent', status: failed ? 'requires_payment_method' : 'succeeded', latest_charge: failed ? null : charge.id, metadata: session._intent.metadata ?? {}, last_payment_error: failed ? { message: 'Your card was declined.' } : null });
      Object.assign(session, { status: 'complete', payment_status: failed ? 'unpaid' : 'paid', payment_intent: intent.id });
      await sendEvent('checkout.session.completed', session);
      if (failed) await sendEvent('checkout.session.async_payment_failed', session);
      return ok({ session: publicView(session), charge: charge.id });
    }],
    ['POST', /^\/__test\/charges\/([^/]+)\/available$/, ({ match }) => {
      const charge = get(match[1]);
      get(charge.balance_transaction).status = 'available';
      for (const t of all('transfer').filter((t) => t.source_transaction === charge.id)) get(get(t.destination_payment).balance_transaction).status = 'available';
      return ok({ ok: true });
    }],
    // payouts : paid (IBAN de test valide) | fail (IBAN de test rejeté) | hold (virement qui reste « pending »)
    ['POST', /^\/__test\/accounts\/([^/]+)\/onboard$/, async ({ match, params }) => {
      const account = get(match[1]);
      Object.assign(account, { details_submitted: true, payouts_enabled: true, capabilities: { transfers: 'active' }, requirements: { currently_due: [], past_due: [], disabled_reason: null }, _payoutMode: params.payouts ?? 'paid' });
      await sendEvent('account.updated', account, account.id);
      return ok(publicView(account));
    }],
    ['POST', /^\/__test\/accounts\/([^/]+)\/payouts$/, ({ match, params }) => {
      get(match[1])._payoutMode = params.mode;
      return ok({ ok: true });
    }],
    ['GET', /^\/__test\/state$/, () => ok({ objects: [...store.values()], events, requests })],
  ];

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const isTest = url.pathname.startsWith('/__test/');
    const json = String(req.headers['content-type'] ?? '').includes('application/json');
    const params = json ? JSON.parse(raw || '{}') : parseForm(req.method === 'GET' ? url.search.slice(1) : raw);
    const account = req.headers['stripe-account'] || null;
    const key = req.headers['idempotency-key'];
    const reply = ({ status, body }) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    if (!isTest) {
      requests.push({ method: req.method, path: url.pathname, account, idempotencyKey: key ?? null, params });
      if (req.headers.authorization !== `Bearer ${apiKey}`) return reply(error(401, 'Invalid API Key provided.', undefined, 'invalid_request_error'));
      if (!req.headers['stripe-version']) return reply(error(400, 'Stripe-Version manquant.'));
      if (key) {
        const cached = idempotency.get(`${account ?? 'platform'}|${key}`);
        if (cached) {
          if (cached.params !== JSON.stringify(params)) return reply(error(400, 'Keys for idempotent requests can only be used with the same parameters they were first used with.', undefined, 'idempotency_error'));
          return reply(cached.result);
        }
      }
    }
    const route = (isTest ? testRoutes : routes).find(([method, pattern]) => method === req.method && pattern.test(url.pathname));
    if (!route) return reply(error(404, `Unrecognized request URL (${req.method}: ${url.pathname}).`));
    const result = await route[2]({ match: url.pathname.match(route[1]), params, account });
    // Comme Stripe : un rejeu renvoie la réponse d'origine figée, pas l'état courant de l'objet.
    if (!isTest && key) idempotency.set(`${account ?? 'platform'}|${key}`, { params: JSON.stringify(params), result: JSON.parse(JSON.stringify(result)) });
    reply(result);
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      log(`API Stripe simulée sur http://127.0.0.1:${port}/v1 (webhooks → ${webhookUrl ?? 'désactivés'})`);
      resolve({ port, store, events, requests, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) void startFakeStripe();
