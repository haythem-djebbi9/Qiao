import { BadRequestException, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { GatewayEvent, GatewayOperation, PaymentGateway, PayoutAccountState } from './payment-gateway';

export const STRIPE_SIGNATURE_HEADER = 'stripe-signature';
const SIGNATURE_TOLERANCE_S = 300;
const DEFAULT_API_VERSION = '2024-06-20';
/** Version des API v2 (Accounts v2 : création des comptes connectés). */
const DEFAULT_API_V2_VERSION = '2026-09-30.endive';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

// --- Objets Stripe utilisés (sous-ensemble stable entre versions d'API) ------------------------------

type Metadata = Record<string, string>;

interface StripeBalanceTransaction {
  id: string;
  amount: number;
  net: number;
  fee: number;
  currency: string;
  status: 'available' | 'pending';
}

interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  transfer_group: string | null;
  balance_transaction: string | StripeBalanceTransaction | null;
}

interface StripePaymentIntent {
  id: string;
  status: string;
  latest_charge: string | StripeCharge | null;
  last_payment_error?: { message?: string } | null;
}

interface StripeCheckoutSession {
  id: string;
  url: string | null;
  status: 'open' | 'complete' | 'expired';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  amount_total: number | null;
  currency: string | null;
  payment_intent: string | StripePaymentIntent | null;
  metadata: Metadata | null;
}

interface StripeRefund {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'canceled';
  failure_reason?: string | null;
  metadata: Metadata | null;
}

interface StripeTransfer {
  id: string;
  amount: number;
  amount_reversed: number;
  currency: string;
  created: number;
  destination: string;
  destination_payment: string | null;
  reversed: boolean;
  metadata: Metadata;
}

interface StripePayout {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
  failure_code?: string | null;
  failure_message?: string | null;
  metadata: Metadata | null;
}

interface StripeAccount {
  id: string;
  details_submitted: boolean;
  payouts_enabled: boolean;
  capabilities?: { transfers?: string };
  requirements?: { currently_due?: string[] | null; past_due?: string[] | null; disabled_reason?: string | null } | null;
  metadata: Metadata | null;
}

interface StripeList<T> {
  data: T[];
  has_more: boolean;
}

interface StripeEvent {
  id: string;
  type: string;
  created: number;
  livemode: boolean;
  account?: string;
  data: { object: Record<string, unknown> };
}

/** Erreur renvoyée par l'API Stripe (corps JSON « error »). */
export class StripeApiError extends Error {
  constructor(
    readonly status: number,
    readonly type: string | undefined,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
  }

  /** Refus définitif de l'opération (et non un incident technique au résultat inconnu). */
  get definitive(): boolean {
    return [400, 402, 404].includes(this.status) && this.type !== 'idempotency_error';
  }
}

/** Encodage « application/x-www-form-urlencoded » imbriqué attendu par l'API Stripe (a[b][0][c]=v). */
function encodeParams(params: Record<string, unknown>, prefix?: string): string[] {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item !== null && typeof item === 'object') parts.push(...encodeParams(item as Record<string, unknown>, `${name}[${index}]`));
        else parts.push(`${encodeURIComponent(`${name}[${index}]`)}=${encodeURIComponent(String(item))}`);
      });
    } else if (typeof value === 'object') {
      parts.push(...encodeParams(value as Record<string, unknown>, name));
    } else {
      parts.push(`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts;
}

/** Vérification de l'en-tête « Stripe-Signature » (t=<unix>,v1=<hex>[,v1=…]) : HMAC-SHA256 de « t.corps ». */
export function verifyStripeSignature(secrets: string[], header: string | undefined, rawBody: Buffer, toleranceS = SIGNATURE_TOLERANCE_S): void {
  const items = (header ?? '').split(',').map((part) => part.trim().split('='));
  const timestamp = Number(items.find(([k]) => k === 't')?.[1]);
  const signatures = items.filter(([k, v]) => k === 'v1' && v).map(([, v]) => Buffer.from(v, 'hex'));
  if (!signatures.length || !Number.isFinite(timestamp)) throw new UnauthorizedException('Signature de notification absente.');
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceS) throw new UnauthorizedException('Notification expirée.');
  const payload = `${timestamp}.${rawBody.toString('utf8')}`;
  const valid = secrets.some((secret) => {
    const expected = createHmac('sha256', secret).update(payload).digest();
    return signatures.some((received) => received.length === expected.length && timingSafeEqual(received, expected));
  });
  if (!valid) throw new UnauthorizedException('Signature de notification invalide.');
}

/** Signe une notification comme Stripe (tests et vérification locale). */
export function signStripePayload(secret: string, body: string, timestamp = Math.floor(Date.now() / 1000)): string {
  return `t=${timestamp},v1=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
}

const transferGroup = (transactionId: string) => `qiao_tx_${transactionId}`;
const shortHash = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 24);
const isExpanded = <T extends { id: string }>(value: string | T | null | undefined): value is T => !!value && typeof value === 'object';

function accountState(account: StripeAccount): PayoutAccountState {
  if (account.capabilities?.transfers === 'active' && account.payouts_enabled) return 'active';
  return account.details_submitted ? 'restricted' : 'pending';
}

/**
 * Stripe Connect, charges et transferts séparés, versements manuels (BR-02 : Stripe, établissement agréé, détient les fonds).
 *
 *  - Paiement : session Stripe Checkout encaissée sur le compte de la plateforme ; les fonds y restent tant que QIAO
 *    n'a pas autorisé le versement (aucun transfert automatique, aucun « destination charge »).
 *  - Versement : transfert rattaché au paiement (source_transaction) vers le compte Express du prestataire, puis virement
 *    bancaire déclenché par QIAO sur ce compte (calendrier de versement « manual »). Référence QIAO = identifiant du transfert.
 *    Tant que les fonds transférés ne sont pas disponibles chez Stripe, le versement reste « pending » ; la consultation
 *    (rapprochement périodique) déclenche le virement dès qu'ils le sont.
 *  - Annulation : virement encore « pending » annulé, transfert contre-passé (les fonds reviennent à la plateforme).
 *  - Remboursement : sur le paiement d'origine, dans sa devise.
 *  - Idempotence : clé QIAO transmise en en-tête Idempotency-Key, et recopiée en métadonnée (qiao_key) pour retrouver
 *    l'opération au-delà des 24 h de rétention des clés par Stripe.
 */
@Injectable()
export class StripePaymentGateway implements PaymentGateway {
  readonly name = 'stripe';
  readonly available: boolean;
  readonly liveMode: boolean;
  private readonly logger = new Logger('PaymentStripe');
  private readonly secretKey: string;
  private readonly webhookSecrets: string[];
  private readonly apiBase: string;
  private readonly apiV2Base: string;
  private readonly apiVersion: string;
  private readonly apiV2Version: string;
  private readonly connectCountry: string;
  private readonly serviceAgreement: 'full' | 'recipient';
  private readonly paymentMethodTypes: string[];

  constructor(config: ConfigService) {
    this.secretKey = (config.get<string>('STRIPE_SECRET_KEY') ?? '').trim();
    this.available = /^(sk|rk)_(test|live)_/.test(this.secretKey);
    this.liveMode = /^(sk|rk)_live_/.test(this.secretKey);
    this.webhookSecrets = (config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const production = config.get<string>('NODE_ENV') === 'production';
    // Serveur d'API de substitution : vérification locale uniquement, jamais en production.
    const base = !production && config.get<string>('STRIPE_API_BASE') ? config.get<string>('STRIPE_API_BASE')! : 'https://api.stripe.com';
    this.apiBase = `${base.replace(/\/$/, '')}/v1`;
    this.apiV2Base = `${base.replace(/\/$/, '')}/v2`;
    this.apiVersion = config.get<string>('STRIPE_API_VERSION') || DEFAULT_API_VERSION;
    this.apiV2Version = config.get<string>('STRIPE_API_V2_VERSION') || DEFAULT_API_V2_VERSION;
    this.connectCountry = (config.get<string>('STRIPE_CONNECT_COUNTRY') || 'FR').toUpperCase();
    this.serviceAgreement = config.get<string>('STRIPE_CONNECT_SERVICE_AGREEMENT') === 'recipient' ? 'recipient' : 'full';
    this.paymentMethodTypes = (config.get<string>('STRIPE_PAYMENT_METHOD_TYPES') || 'card')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /** Appris à la première session refusée : le compte Stripe active « Managed Payments » par défaut. */
  private managedPaymentsOff = false;

  private assertAvailable() {
    if (!this.available) throw new ServiceUnavailableException("Stripe n'est pas configuré (STRIPE_SECRET_KEY).");
  }

  // --- Paiement -------------------------------------------------------------------------------

  async createCheckout(input: Parameters<PaymentGateway['createCheckout']>[0]) {
    this.assertAvailable();
    const metadata = { transactionId: input.transactionId, reference: input.reference };
    const buildParams = () => ({
      mode: 'payment',
      client_reference_id: input.transactionId,
      success_url: input.returnUrl,
      cancel_url: input.returnUrl,
      payment_method_types: this.paymentMethodTypes,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amount,
            product_data: { name: input.label ?? `Prestation QIAO ${input.reference}`, description: input.description.slice(0, 500) || undefined },
          },
        },
      ],
      metadata,
      payment_intent_data: {
        // Capture synchrone : l'écriture de solde (frais réels) existe dès la confirmation du paiement.
        capture_method: 'automatic',
        transfer_group: transferGroup(input.transactionId),
        description: `QIAO ${input.reference}`,
        metadata,
      },
      // « Managed Payments » (Stripe vendeur officiel) est incompatible avec la retenue des fonds par la plateforme
      // puis le transfert au prestataire : désactivé pour ces paiements sur les comptes où il est actif par défaut.
      ...(this.managedPaymentsOff ? { managed_payments: { enabled: false } } : {}),
    });
    let params = buildParams();
    // La clé dépend aussi des paramètres : un libellé modifié ouvre une nouvelle session au lieu d'une erreur d'idempotence.
    let key = `${input.idempotencyKey}:${shortHash(JSON.stringify(params))}`;
    // Un rejeu idempotent renvoie la réponse d'origine (session « open ») : l'état réel est relu.
    const open = async () => {
      const created = await this.call<StripeCheckoutSession>('POST', '/checkout/sessions', { params, idempotencyKey: key });
      return this.call<StripeCheckoutSession>('GET', `/checkout/sessions/${created.id}`);
    };
    const openOnce = async () => {
      try {
        return await open();
      } catch (err) {
        if (this.managedPaymentsOff || !(err instanceof StripeApiError) || !/managed payments/i.test(err.message)) throw err;
        this.managedPaymentsOff = true;
        this.logger.warn('Managed Payments actif par défaut sur le compte Stripe : désactivé pour les paiements QIAO.');
        params = buildParams();
        key = `${input.idempotencyKey}:${shortHash(JSON.stringify(params))}`;
        return open();
      }
    };
    return this.clientFacing(async () => {
      let session = await openOnce();
      // Session expirée rejouée par la clé : nouvelle session, clé dérivée de l'ancienne (double clic ⇒ même session).
      for (let i = 0; i < 3 && session.status === 'expired'; i++) {
        key = `${input.idempotencyKey}:renew:${session.id}`;
        session = await open();
      }
      if (session.status === 'complete' || !session.url) return { ref: session.id, url: input.returnUrl };
      return { ref: session.id, url: session.url };
    });
  }

  async expireCheckout(ref: string) {
    if (!this.available || !ref.startsWith('cs_')) return;
    try {
      await this.call('POST', `/checkout/sessions/${ref}/expire`, { retryable: true });
    } catch (err) {
      // Déjà expirée ou réglée : rien à invalider (un paiement réglé entre-temps est traité comme paiement inattendu).
      if (err instanceof StripeApiError && err.status === 400) return;
      throw err;
    }
  }

  private async checkoutOperation(session: StripeCheckoutSession): Promise<GatewayOperation> {
    const base = { ref: session.id, amount: session.amount_total ?? undefined, currency: session.currency?.toUpperCase() };
    if (session.status === 'expired') return { ...base, status: 'cancelled' };
    const intent = isExpanded(session.payment_intent) ? session.payment_intent : null;
    if (session.status === 'complete' && session.payment_status === 'paid') {
      const latest = intent?.latest_charge;
      const charge = isExpanded(latest) ? latest : null;
      const transaction = charge?.balance_transaction;
      const balance = isExpanded(transaction) ? transaction : null;
      if (!charge || !balance) throw new Error(`Paiement ${session.id} confirmé sans écriture de solde Stripe : nouvel essai au prochain rapprochement.`);
      return { ...base, status: 'succeeded', paymentRef: charge.id, fee: this.feeInChargeCurrency(charge, balance) };
    }
    if (session.status === 'complete' && intent && (intent.status === 'requires_payment_method' || intent.status === 'canceled')) {
      return { ...base, status: 'failed', failureReason: intent.last_payment_error?.message ?? 'Paiement refusé.' };
    }
    return { ...base, status: 'pending' };
  }

  private retrieveSession(ref: string) {
    return this.call<StripeCheckoutSession>('GET', `/checkout/sessions/${ref}`, { params: { expand: ['payment_intent.latest_charge.balance_transaction'] } });
  }

  /** Frais Stripe exprimés dans la devise du paiement (conversion au taux du paiement si la plateforme règle dans une autre devise). */
  private feeInChargeCurrency(charge: StripeCharge, balance: StripeBalanceTransaction): number {
    if (balance.currency === charge.currency || !balance.amount) return balance.fee;
    return Math.round((balance.fee * charge.amount) / balance.amount);
  }

  // --- Compte de versement (KYC hébergé par Stripe) ---------------------------------------------------

  async createAccountLink(input: { userId: string; accountRef: string | null; returnUrl: string; email?: string | null; displayName?: string | null }) {
    this.assertAvailable();
    return this.clientFacing(async () => {
      let account = input.accountRef?.startsWith('acct_') ? await this.call<StripeAccount>('GET', `/accounts/${input.accountRef}`) : null;
      if (!account) account = await this.createConnectedAccount(input.userId, input.email ?? null, input.displayName ?? null);
      const due = [...(account.requirements?.currently_due ?? []), ...(account.requirements?.past_due ?? [])];
      if (account.details_submitted && !due.length) {
        // Compte déjà vérifié : accès au tableau de bord Express (coordonnées bancaires, virements).
        const login = await this.call<{ url: string }>('POST', `/accounts/${account.id}/login_links`);
        return { accountRef: account.id, url: login.url };
      }
      const link = await this.call<{ url: string }>('POST', '/account_links', {
        params: {
          account: account.id,
          type: 'account_onboarding',
          return_url: input.returnUrl,
          refresh_url: input.returnUrl,
          collection_options: { fields: 'eventually_due' },
        },
      });
      return { accountRef: account.id, url: link.url };
    });
  }

  /**
   * Compte connecté du prestataire. Stripe impose désormais Accounts v2 aux nouvelles intégrations Connect :
   * configuration « recipient » (reçoit des transferts, QIAO reste vendeur), tableau de bord Express, pertes et frais
   * à la charge de la plateforme (obligatoire avec Express). Les API v1 acceptent ensuite l'identifiant du compte v2 :
   * liens d'ouverture, accès Express, transferts et virements sont inchangés.
   * Exception : le contrat de service « recipient » n'existe qu'en Accounts v1.
   */
  private async createConnectedAccount(userId: string, email: string | null, displayName: string | null): Promise<StripeAccount> {
    const idempotencyKey = `account:${userId}:${this.connectCountry}:${this.serviceAgreement}`;
    const manualPayouts = { payouts: { schedule: { interval: 'manual' } } };
    if (this.serviceAgreement === 'recipient') {
      return this.call<StripeAccount>('POST', '/accounts', {
        idempotencyKey,
        params: {
          type: 'express',
          country: this.connectCountry,
          capabilities: { transfers: { requested: true } },
          tos_acceptance: { service_agreement: 'recipient' },
          settings: manualPayouts,
          metadata: { qiaoUserId: userId },
        },
      });
    }
    const created = await this.callV2<{ id: string }>('POST', '/core/accounts', {
      idempotencyKey: `${idempotencyKey}:v2`,
      body: {
        // Adresse de contact obligatoire pour la configuration « recipient ».
        ...(email ? { contact_email: email } : {}),
        ...(displayName ? { display_name: displayName.slice(0, 100) } : {}),
        dashboard: 'express',
        identity: { country: this.connectCountry.toLowerCase() },
        configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } } },
        defaults: { responsibilities: { fees_collector: 'application', losses_collector: 'application' } },
        metadata: { qiaoUserId: userId },
      },
    });
    // Versements manuels : seul QIAO déclenche le virement vers la banque du prestataire (réglage v1 appliqué au compte v2).
    try {
      await this.call('POST', `/accounts/${created.id}`, { params: { settings: manualPayouts }, retryable: true });
    } catch (err) {
      this.logger.warn(`Calendrier de virement manuel non appliqué au compte ${created.id} : ${(err as Error).message}`);
    }
    return this.call<StripeAccount>('GET', `/accounts/${created.id}`);
  }

  async retrieveAccount(accountRef: string): Promise<PayoutAccountState> {
    this.assertAvailable();
    return accountState(await this.call<StripeAccount>('GET', `/accounts/${accountRef}`));
  }

  // --- Remboursement --------------------------------------------------------------------------

  async refund(input: Parameters<PaymentGateway['refund']>[0]): Promise<GatewayOperation> {
    this.assertAvailable();
    const existing = await this.findByKey<StripeRefund>('/refunds', { charge: input.paymentRef }, input.idempotencyKey);
    if (existing) return this.refundOperation(existing);
    // Fonds d'un versement annulé encore chez le prestataire : rapatriés avant de rembourser le client.
    await this.reclaimTransfers(input.paymentRef).catch((err) => this.logger.warn(`Rapatriement avant remboursement : ${(err as Error).message}`));
    try {
      const refund = await this.call<StripeRefund>('POST', '/refunds', {
        idempotencyKey: input.idempotencyKey,
        params: { charge: input.paymentRef, amount: input.amount, metadata: { ...input.metadata, qiao_key: input.idempotencyKey } },
      });
      return this.refundOperation(refund);
    } catch (err) {
      if (err instanceof StripeApiError && err.definitive) {
        return { ref: `failed_${shortHash(input.idempotencyKey)}`, status: 'failed', failureReason: `Remboursement refusé par Stripe : ${err.message}` };
      }
      throw err;
    }
  }

  private refundOperation(refund: StripeRefund): GatewayOperation {
    const status = refund.status === 'succeeded' ? 'succeeded' : refund.status === 'failed' || refund.status === 'canceled' ? 'failed' : 'pending';
    return {
      ref: refund.id,
      status,
      amount: refund.amount,
      currency: refund.currency.toUpperCase(),
      failureReason: status === 'failed' ? `Remboursement refusé par Stripe (${refund.failure_reason ?? refund.status}).` : null,
    };
  }

  // --- Versement ------------------------------------------------------------------------------

  async payout(input: Parameters<PaymentGateway['payout']>[0]): Promise<GatewayOperation> {
    this.assertAvailable();
    if (!input.paymentRef) throw new Error('Versement Stripe impossible : paiement d’origine inconnu.');
    const charge = await this.call<StripeCharge>('GET', `/charges/${input.paymentRef}`, { params: { expand: ['balance_transaction'] } });
    const transfers = charge.transfer_group ? await this.listTransfers(charge.transfer_group) : [];
    const existing = transfers.find((t) => t.metadata?.qiao_key === input.idempotencyKey);
    if (existing) return this.advancePayout(existing);
    await this.reclaimTransfers(transfers);

    const balance = isExpanded(charge.balance_transaction) ? charge.balance_transaction : null;
    if (!balance) throw new Error(`Paiement ${charge.id} sans écriture de solde Stripe.`);
    if (charge.currency !== input.currency.toLowerCase()) throw new Error(`Devise du versement (${input.currency}) différente de celle du paiement.`);
    // Le transfert se fait dans la devise de règlement du paiement (exigence Stripe), au taux du paiement.
    const amount = balance.currency === charge.currency ? input.amount : Math.min(balance.amount, Math.round((input.amount * balance.amount) / charge.amount));
    try {
      const transfer = await this.call<StripeTransfer>('POST', '/transfers', {
        idempotencyKey: input.idempotencyKey,
        params: {
          amount,
          currency: balance.currency,
          destination: input.accountRef,
          source_transaction: charge.id,
          description: `QIAO ${input.metadata.transactionId ?? ''}`.trim(),
          metadata: { ...input.metadata, qiao_key: input.idempotencyKey },
        },
      });
      return await this.advancePayout(transfer);
    } catch (err) {
      if (err instanceof StripeApiError && err.definitive) {
        return { ref: `failed_${shortHash(input.idempotencyKey)}`, status: 'failed', failureReason: `Versement refusé par Stripe : ${err.message}` };
      }
      throw err;
    }
  }

  /** Fait progresser un versement : virement bancaire déclenché dès que les fonds transférés sont disponibles. */
  private async advancePayout(transfer: StripeTransfer): Promise<GatewayOperation> {
    const base = { ref: transfer.id, amount: transfer.amount, currency: transfer.currency.toUpperCase() };
    let bank = await this.findBankPayout(transfer);
    if (!bank) {
      if (transfer.metadata?.qiao_cancelled || transfer.amount_reversed > 0) return { ...base, status: 'cancelled' };
      if (!transfer.destination_payment) return { ...base, status: 'pending' };
      const payment = await this.call<StripeCharge>('GET', `/charges/${transfer.destination_payment}`, {
        account: transfer.destination,
        params: { expand: ['balance_transaction'] },
      });
      const funds = isExpanded(payment.balance_transaction) ? payment.balance_transaction : null;
      if (!funds || funds.status !== 'available') return { ...base, status: 'pending' };
      try {
        bank = await this.call<StripePayout>('POST', '/payouts', {
          account: transfer.destination,
          idempotencyKey: `${transfer.metadata?.qiao_key ?? transfer.id}:bank`,
          params: {
            amount: funds.net,
            currency: funds.currency,
            description: `QIAO ${transfer.metadata?.transactionId ?? transfer.id}`,
            metadata: { ...this.qiaoMetadata(transfer.metadata), qiao_transfer: transfer.id },
          },
        });
      } catch (err) {
        if (err instanceof StripeApiError && err.code === 'balance_insufficient') return { ...base, status: 'pending' };
        if (err instanceof StripeApiError && err.definitive) {
          await this.reclaim(transfer);
          return { ...base, status: 'failed', failureReason: `Virement refusé par Stripe : ${err.message}` };
        }
        throw err;
      }
      await this.call('POST', `/transfers/${transfer.id}`, { params: { metadata: { qiao_bank_payout: bank.id } }, retryable: true }).catch((err) =>
        this.logger.warn(`Transfert ${transfer.id} : ${(err as Error).message}`),
      );
    }
    switch (bank.status) {
      case 'paid':
        return { ...base, status: 'succeeded' };
      case 'failed':
        await this.reclaim(transfer);
        return { ...base, status: 'failed', failureReason: `Virement rejeté par la banque du prestataire (${bank.failure_message ?? bank.failure_code ?? 'motif non communiqué'}).` };
      case 'canceled':
        await this.reclaim(transfer);
        return { ...base, status: 'cancelled' };
      default:
        return { ...base, status: 'pending' };
    }
  }

  async cancelPayout(ref: string): Promise<boolean> {
    if (!this.available || !ref.startsWith('tr_')) return false;
    try {
      let transfer = await this.call<StripeTransfer>('GET', `/transfers/${ref}`);
      let bank = await this.findBankPayout(transfer);
      if (!bank) {
        // Aucun virement encore : on interdit d'en créer un, puis on revérifie (virement déclenché entre-temps).
        transfer = await this.call<StripeTransfer>('POST', `/transfers/${ref}`, { params: { metadata: { qiao_cancelled: '1' } }, retryable: true });
        bank = await this.findBankPayout(transfer);
      }
      if (bank && bank.status === 'pending') {
        await this.call('POST', `/payouts/${bank.id}/cancel`, { account: transfer.destination, retryable: true });
      } else if (bank && bank.status !== 'failed' && bank.status !== 'canceled') {
        return false; // En transit ou payé : irrévocable.
      }
      await this.reclaim(transfer);
      return true;
    } catch (err) {
      this.logger.warn(`Annulation du versement ${ref} : ${(err as Error).message}`);
      return false;
    }
  }

  private async findBankPayout(transfer: StripeTransfer): Promise<StripePayout | null> {
    const known = transfer.metadata?.qiao_bank_payout;
    if (known) return this.call<StripePayout>('GET', `/payouts/${known}`, { account: transfer.destination });
    const list = await this.call<StripeList<StripePayout>>('GET', '/payouts', {
      account: transfer.destination,
      params: { limit: 100, created: { gte: transfer.created } },
    });
    return list.data.find((p) => p.metadata?.qiao_transfer === transfer.id) ?? null;
  }

  private listTransfers(group: string) {
    return this.call<StripeList<StripeTransfer>>('GET', '/transfers', { params: { transfer_group: group, limit: 100 } }).then((list) => list.data);
  }

  /**
   * Rapatrie vers la plateforme les fonds de transferts dont le virement n'aura pas lieu (annulé, rejeté) :
   * avant une nouvelle tentative de versement ou un remboursement.
   */
  private async reclaimTransfers(source: string | StripeTransfer[]) {
    let transfers = source;
    if (typeof transfers === 'string') {
      const charge = await this.call<StripeCharge>('GET', `/charges/${transfers}`);
      transfers = charge.transfer_group ? await this.listTransfers(charge.transfer_group) : [];
    }
    for (const transfer of transfers) {
      if (transfer.amount - transfer.amount_reversed <= 0) continue;
      const bank = await this.findBankPayout(transfer);
      const abandoned = bank ? bank.status === 'failed' || bank.status === 'canceled' : !!transfer.metadata?.qiao_cancelled;
      if (abandoned) await this.reclaim(transfer);
    }
  }

  private async reclaim(transfer: StripeTransfer): Promise<boolean> {
    const remaining = transfer.amount - transfer.amount_reversed;
    if (remaining <= 0) return true;
    try {
      await this.call('POST', `/transfers/${transfer.id}/reversals`, {
        idempotencyKey: `reversal:${transfer.id}:${transfer.amount_reversed}`,
        params: { amount: remaining, metadata: { reason: 'qiao_payout_not_executed' } },
      });
      return true;
    } catch (err) {
      this.logger.warn(`Contre-passation du transfert ${transfer.id} à reprendre : ${(err as Error).message}`);
      return false;
    }
  }

  private qiaoMetadata(metadata: Metadata | null | undefined): Metadata {
    const { transactionId, payoutId, attempt } = metadata ?? {};
    return Object.fromEntries(Object.entries({ transactionId, payoutId, attempt }).filter(([, v]) => v)) as Metadata;
  }

  // --- Consultation (rapprochement) ------------------------------------------------------------

  async retrieve(kind: 'checkout' | 'refund' | 'payout', ref: string): Promise<GatewayOperation> {
    this.assertAvailable();
    if (ref.startsWith('failed_')) return { ref, status: 'failed', failureReason: 'Opération refusée par Stripe.' };
    if (kind === 'checkout') return this.checkoutOperation(await this.retrieveSession(ref));
    if (kind === 'refund') return this.refundOperation(await this.call<StripeRefund>('GET', `/refunds/${ref}`));
    return this.advancePayout(await this.call<StripeTransfer>('GET', `/transfers/${ref}`));
  }

  /** Opération déjà créée avec cette clé QIAO (au-delà des 24 h de rétention des clés d'idempotence Stripe). */
  private async findByKey<T extends { metadata: Metadata | null }>(path: string, filter: Record<string, unknown>, key: string): Promise<T | null> {
    const list = await this.call<StripeList<T>>('GET', path, { params: { ...filter, limit: 100 } });
    return list.data.find((item) => item.metadata?.qiao_key === key) ?? null;
  }

  // --- Notifications (webhooks) ----------------------------------------------------------------

  async verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<GatewayEvent | null> {
    if (!this.webhookSecrets.length) throw new UnauthorizedException('Secret de signature des notifications Stripe non configuré (STRIPE_WEBHOOK_SECRET).');
    const header = headers[STRIPE_SIGNATURE_HEADER];
    verifyStripeSignature(this.webhookSecrets, Array.isArray(header) ? header[0] : header, rawBody);
    const event = JSON.parse(rawBody.toString('utf8')) as StripeEvent;
    if (event.livemode !== this.liveMode) {
      this.logger.warn(`Notification ${event.id} ignorée : mode ${event.livemode ? 'réel' : 'test'} différent de la clé configurée.`);
      return null;
    }
    return this.toGatewayEvent(event);
  }

  private async toGatewayEvent(event: StripeEvent): Promise<GatewayEvent | null> {
    const base = { id: event.id, createdAt: new Date(event.created * 1000).toISOString() };
    const object = event.data.object;
    const metadata = (object.metadata ?? {}) as Metadata;
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.async_payment_failed': {
        if (!metadata.transactionId) return null;
        // État relu chez Stripe : paiement, frais réels et référence du paiement.
        const op = await this.checkoutOperation(await this.retrieveSession(String(object.id)));
        if (op.status !== 'succeeded' && op.status !== 'failed') return null;
        return {
          ...base,
          type: op.status === 'succeeded' ? 'checkout.succeeded' : 'checkout.failed',
          objectRef: op.ref,
          amount: op.amount,
          currency: op.currency,
          fee: op.fee,
          paymentRef: op.paymentRef ?? undefined,
          failureReason: op.failureReason ?? undefined,
          metadata,
        };
      }
      case 'refund.created':
      case 'refund.updated':
      case 'refund.failed':
      case 'charge.refund.updated': {
        if (!metadata.refundId) return null;
        const op = this.refundOperation(object as unknown as StripeRefund);
        if (op.status === 'pending') return null;
        return {
          ...base,
          type: op.status === 'succeeded' ? 'refund.succeeded' : 'refund.failed',
          objectRef: op.ref,
          amount: op.amount,
          currency: op.currency,
          failureReason: op.failureReason ?? undefined,
          metadata,
        };
      }
      case 'payout.paid':
      case 'payout.failed':
      case 'payout.canceled': {
        const payout = object as unknown as StripePayout;
        if (!metadata.qiao_transfer || !event.account) return null;
        if (event.type !== 'payout.paid') {
          // Les fonds du virement rejeté reviennent sur le compte du prestataire : rapatriés vers la plateforme.
          const transfer = await this.call<StripeTransfer>('GET', `/transfers/${metadata.qiao_transfer}`);
          await this.reclaim(transfer);
        }
        return {
          ...base,
          type: event.type === 'payout.paid' ? 'payout.paid' : 'payout.failed',
          objectRef: metadata.qiao_transfer,
          amount: payout.amount,
          currency: payout.currency.toUpperCase(),
          failureReason:
            event.type === 'payout.paid'
              ? undefined
              : event.type === 'payout.canceled'
                ? 'Virement annulé chez Stripe.'
                : `Virement rejeté par la banque du prestataire (${payout.failure_message ?? payout.failure_code ?? 'motif non communiqué'}).`,
          metadata,
        };
      }
      case 'account.updated':
        return { ...base, type: 'account.updated', objectRef: String(object.id), accountStatus: accountState(object as unknown as StripeAccount), metadata };
      default:
        return null;
    }
  }

  // --- Client HTTP -----------------------------------------------------------------------------

  /** Erreurs présentées au client ou au prestataire (session de paiement, compte de versement). */
  private async clientFacing<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof StripeApiError && err.definitive) throw new BadRequestException(`Le prestataire de paiement a refusé la demande : ${err.message}`);
      this.logger.error(`Stripe : ${(err as Error).message}`);
      throw new ServiceUnavailableException('Le prestataire de paiement est momentanément indisponible. Réessayez dans quelques instants.');
    }
  }

  /**
   * Appel à l'API Stripe. Rejoué (2 fois au plus) en cas d'incident réseau, 429 ou 5xx, seulement si la requête est
   * sans effet de bord ou porte une clé d'idempotence — un rejeu ne peut donc jamais dupliquer une opération.
   */
  private async call<T = unknown>(
    method: 'GET' | 'POST',
    path: string,
    options: { params?: Record<string, unknown>; idempotencyKey?: string; account?: string; retryable?: boolean } = {},
  ): Promise<T> {
    const encoded = encodeParams(options.params ?? {}).join('&');
    const url = method === 'GET' && encoded ? `${this.apiBase}${path}?${encoded}` : `${this.apiBase}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      'Stripe-Version': this.apiVersion,
    };
    if (method === 'POST') headers['Content-Type'] = 'application/x-www-form-urlencoded';
    if (options.idempotencyKey) headers['Idempotency-Key'] = `qiao:${options.idempotencyKey}`.slice(0, 255);
    if (options.account) headers['Stripe-Account'] = options.account;
    const retryable = method === 'GET' || !!options.idempotencyKey || !!options.retryable;
    return this.send<T>(method, url, path, headers, method === 'POST' ? encoded : undefined, retryable);
  }

  /** API v2 de Stripe (corps JSON, version d'API v2). */
  private async callV2<T = unknown>(method: 'GET' | 'POST', path: string, options: { body?: unknown; idempotencyKey?: string } = {}): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      'Stripe-Version': this.apiV2Version,
    };
    if (method === 'POST') headers['Content-Type'] = 'application/json';
    if (options.idempotencyKey) headers['Idempotency-Key'] = `qiao:${options.idempotencyKey}`.slice(0, 255);
    const body = method === 'POST' ? JSON.stringify(options.body ?? {}) : undefined;
    return this.send<T>(method, `${this.apiV2Base}${path}`, `/v2${path}`, headers, body, method === 'GET' || !!options.idempotencyKey);
  }

  private async send<T>(method: 'GET' | 'POST', url: string, path: string, headers: Record<string, string>, payload: string | undefined, retryable: boolean): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        response = await fetch(url, { method, headers, body: payload, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      } catch (err) {
        if (retryable && attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
          continue;
        }
        throw new Error(`Stripe injoignable (${method} ${path}) : ${(err as Error).message}`);
      }
      const body = (await response.json().catch(() => ({}))) as { error?: { type?: string; code?: string; message?: string } } & T;
      if (response.ok) return body;
      const shouldRetry = response.headers.get('stripe-should-retry');
      if (retryable && attempt < MAX_RETRIES && shouldRetry !== 'false' && (shouldRetry === 'true' || response.status === 429 || response.status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        continue;
      }
      throw new StripeApiError(response.status, body.error?.type, body.error?.code, body.error?.message ?? `Erreur Stripe ${response.status}`);
    }
  }
}
