import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { CURRENCIES } from '../payments.policy';
import { GatewayEvent, GatewayOperation, PaymentGateway } from './payment-gateway';
import { SandboxRecord } from './sandbox.entity';

export const SIGNATURE_HEADER = 'qiao-signature';
const SIGNATURE_TOLERANCE_S = 300;

/** Signature HMAC-SHA256 horodatée (« t=<unix>,v1=<hex> »), sur le modèle des prestataires de paiement du marché. */
export function signWebhook(secret: string, body: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

export function verifyWebhookSignature(secret: string, header: string | undefined, rawBody: Buffer): void {
  const parts = Object.fromEntries((header ?? '').split(',').map((part) => part.trim().split('=') as [string, string]));
  const timestamp = Number(parts.t);
  if (!parts.v1 || !Number.isFinite(timestamp)) throw new UnauthorizedException('Signature de notification absente.');
  if (Math.abs(Date.now() / 1000 - timestamp) > SIGNATURE_TOLERANCE_S) throw new UnauthorizedException('Notification expirée.');
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest();
  const received = Buffer.from(parts.v1, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new UnauthorizedException('Signature de notification invalide.');
  }
}

const newRef = (prefix: string) => `${prefix}_${randomBytes(12).toString('hex')}`;

/**
 * Simulateur de prestataire de paiement (développement et démonstration).
 * Pages de test : paiement (accepté, refusé, accepté mais remboursements refusés) et ouverture de compte de versement
 * (valide, ou refusant les virements). Les résultats sont notifiés par webhooks signés, après un court délai,
 * exactement comme le ferait un prestataire réel. Jamais actif en production.
 */
@Injectable()
export class SandboxPaymentGateway implements PaymentGateway {
  readonly name = 'sandbox';
  readonly available: boolean;
  private readonly logger = new Logger('PaymentSandbox');
  private readonly delayMs: number;

  constructor(
    @InjectRepository(SandboxRecord) private readonly records: Repository<SandboxRecord>,
    private readonly config: ConfigService,
  ) {
    this.available = config.get<string>('NODE_ENV') !== 'production';
    this.delayMs = Number(config.get<string>('PAYMENT_SANDBOX_DELAY_MS', '4000'));
  }

  /** Secret de signature des notifications (PAYMENT_WEBHOOK_SECRET, sinon dérivé du secret de l'application). */
  get webhookSecret(): string {
    return (
      this.config.get<string>('PAYMENT_WEBHOOK_SECRET') ||
      createHash('sha256').update(`qiao-sandbox:${this.config.get<string>('JWT_SECRET', 'qiao-dev-secret')}`).digest('hex')
    );
  }

  private assertAvailable() {
    if (!this.available) throw new ServiceUnavailableException("Le simulateur de paiement n'est pas disponible en production.");
  }

  async createCheckout(input: Parameters<PaymentGateway['createCheckout']>[0]) {
    this.assertAvailable();
    const existing = await this.records.findOne({ where: { kind: 'checkout', idempotencyKey: input.idempotencyKey } });
    if (existing) return { ref: existing.id, url: this.checkoutUrl(existing.id) };
    const record = await this.records.save(
      this.records.create({
        id: newRef('sbx_cs'),
        kind: 'checkout',
        idempotencyKey: input.idempotencyKey,
        amount: input.amount,
        currency: input.currency,
        metadata: {
          transactionId: input.transactionId,
          reference: input.reference,
          description: input.description.slice(0, 160),
          returnUrl: input.returnUrl,
        },
      }),
    );
    return { ref: record.id, url: this.checkoutUrl(record.id) };
  }

  async expireCheckout(ref: string) {
    await this.records.update({ id: ref, kind: 'checkout', status: 'pending' }, { status: 'cancelled', settledAt: new Date() });
  }

  async createAccountLink(input: { userId: string; accountRef: string | null; returnUrl: string }) {
    this.assertAvailable();
    let record = input.accountRef ? await this.records.findOne({ where: { id: input.accountRef, kind: 'account' } }) : null;
    if (!record) {
      record = await this.records.save(
        this.records.create({ id: newRef('sbx_acct'), kind: 'account', idempotencyKey: `account:${input.userId}:${Date.now()}`, metadata: { userId: input.userId } }),
      );
    }
    record.metadata = { ...record.metadata, returnUrl: input.returnUrl };
    await this.records.save(record);
    return { accountRef: record.id, url: `/api/payments/sandbox/onboarding/${record.id}` };
  }

  async refund(input: Parameters<PaymentGateway['refund']>[0]): Promise<GatewayOperation> {
    this.assertAvailable();
    const existing = await this.records.findOne({ where: { kind: 'refund', idempotencyKey: input.idempotencyKey } });
    if (existing) return this.toOperation(existing);
    const payment = await this.records.findOne({ where: { id: input.paymentRef, kind: 'checkout' } });
    const record = await this.records.save(
      this.records.create({
        id: newRef('sbx_re'),
        kind: 'refund',
        idempotencyKey: input.idempotencyKey,
        amount: input.amount,
        currency: input.currency,
        linkedRef: input.paymentRef,
        behavior: payment?.behavior === 'refund_fail' ? 'refund_fail' : 'normal',
        metadata: input.metadata,
      }),
    );
    this.scheduleSettlement(record.id);
    return this.toOperation(record);
  }

  async payout(input: Parameters<PaymentGateway['payout']>[0]): Promise<GatewayOperation> {
    this.assertAvailable();
    const existing = await this.records.findOne({ where: { kind: 'payout', idempotencyKey: input.idempotencyKey } });
    if (existing) return this.toOperation(existing);
    const account = await this.records.findOne({ where: { id: input.accountRef, kind: 'account' } });
    const record = await this.records.save(
      this.records.create({
        id: newRef('sbx_po'),
        kind: 'payout',
        idempotencyKey: input.idempotencyKey,
        amount: input.amount,
        currency: input.currency,
        linkedRef: input.accountRef,
        behavior: !account || account.status !== 'succeeded' || account.behavior === 'payout_fail' ? 'payout_fail' : 'normal',
        metadata: input.metadata,
      }),
    );
    this.scheduleSettlement(record.id);
    return this.toOperation(record);
  }

  async cancelPayout(ref: string): Promise<boolean> {
    const result = await this.records.update({ id: ref, kind: 'payout', status: 'pending' }, { status: 'cancelled', settledAt: new Date() });
    return (result.affected ?? 0) > 0;
  }

  async retrieve(kind: 'checkout' | 'refund' | 'payout', ref: string): Promise<GatewayOperation> {
    let record = await this.records.findOne({ where: { id: ref, kind } });
    if (!record) return { ref, status: 'failed', failureReason: 'Opération inconnue du prestataire de paiement.' };
    // Notification perdue (redémarrage du serveur) : l'opération est réglée à la consultation.
    if (record.status === 'pending' && kind !== 'checkout' && Date.now() - record.createdAt.getTime() >= this.delayMs) {
      record = (await this.settle(record.id, false)) ?? record;
    }
    return this.toOperation(record);
  }

  verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): GatewayEvent {
    const header = headers[SIGNATURE_HEADER];
    verifyWebhookSignature(this.webhookSecret, Array.isArray(header) ? header[0] : header, rawBody);
    return JSON.parse(rawBody.toString('utf8')) as GatewayEvent;
  }

  // --- Pages de test (appelées par SandboxController) -----------------------------------------

  findRecord(id: string, kind: SandboxRecord['kind']) {
    return this.records.findOne({ where: { id, kind } });
  }

  /** Règlement d'une session de paiement depuis la page de test. */
  async completeCheckout(id: string, outcome: 'success' | 'decline' | 'success_refund_fail'): Promise<SandboxRecord | null> {
    this.assertAvailable();
    const record = await this.records.findOne({ where: { id, kind: 'checkout' } });
    if (!record || record.status !== 'pending') return record;
    const decimals = CURRENCIES[record.currency ?? 'EUR']?.decimals ?? 2;
    record.status = outcome === 'decline' ? 'failed' : 'succeeded';
    record.behavior = outcome === 'success_refund_fail' ? 'refund_fail' : 'normal';
    record.fee = record.status === 'succeeded' ? Math.round(record.amount * 0.029) + 30 * 10 ** (decimals - 2) : 0;
    record.failureReason = record.status === 'failed' ? 'Carte refusée par la banque émettrice (simulation).' : null;
    record.settledAt = new Date();
    await this.records.save(record);
    this.emit(record);
    return record;
  }

  async completeOnboarding(id: string, outcome: 'valid' | 'payout_fail'): Promise<SandboxRecord | null> {
    this.assertAvailable();
    const record = await this.records.findOne({ where: { id, kind: 'account' } });
    if (!record) return null;
    record.status = 'succeeded';
    record.behavior = outcome === 'payout_fail' ? 'payout_fail' : 'normal';
    record.settledAt = new Date();
    await this.records.save(record);
    this.emit(record);
    return record;
  }

  // --- Interne ---------------------------------------------------------------------------------

  private checkoutUrl(ref: string) {
    return `/api/payments/sandbox/checkout/${ref}`;
  }

  private scheduleSettlement(id: string) {
    setTimeout(() => {
      this.settle(id, true).catch((err) => this.logger.warn(`Règlement simulé ${id} : ${(err as Error).message}`));
    }, this.delayMs).unref?.();
  }

  private async settle(id: string, notify: boolean): Promise<SandboxRecord | null> {
    const record = await this.records.findOne({ where: { id } });
    if (!record || record.status !== 'pending') return record;
    const fails = record.behavior === 'refund_fail' || record.behavior === 'payout_fail';
    record.status = fails ? 'failed' : 'succeeded';
    record.failureReason = fails
      ? record.kind === 'refund'
        ? 'Remboursement refusé : la carte du client est clôturée (simulation).'
        : 'Virement rejeté : compte bancaire du prestataire invalide (simulation).'
      : null;
    record.settledAt = new Date();
    await this.records.save(record);
    if (notify) this.emit(record);
    return record;
  }

  private toOperation(record: SandboxRecord): GatewayOperation {
    return {
      ref: record.id,
      status: record.status,
      failureReason: record.failureReason,
      amount: record.amount,
      currency: record.currency ?? undefined,
      fee: record.fee,
      paymentRef: record.kind === 'checkout' && record.status === 'succeeded' ? record.id : null,
    };
  }

  private toEvent(record: SandboxRecord): GatewayEvent | null {
    const ok = record.status === 'succeeded';
    const type =
      record.kind === 'checkout'
        ? ok
          ? 'checkout.succeeded'
          : 'checkout.failed'
        : record.kind === 'refund'
          ? ok
            ? 'refund.succeeded'
            : 'refund.failed'
          : record.kind === 'payout'
            ? ok
              ? 'payout.paid'
              : 'payout.failed'
            : 'account.updated';
    if (record.status === 'pending' || record.status === 'cancelled') return null;
    return {
      id: `evt_${record.id}_${record.status}`,
      type,
      objectRef: record.id,
      amount: record.amount,
      currency: record.currency ?? undefined,
      fee: record.fee,
      paymentRef: record.kind === 'checkout' && ok ? record.id : undefined,
      accountStatus: record.kind === 'account' ? 'active' : undefined,
      failureReason: record.failureReason ?? undefined,
      metadata: record.metadata,
      createdAt: new Date().toISOString(),
    };
  }

  /** Envoie la notification signée au point d'entrée webhook de l'API, comme le ferait le prestataire. */
  private emit(record: SandboxRecord) {
    const event = this.toEvent(record);
    if (!event) return;
    const body = JSON.stringify(event);
    const port = Number(this.config.get<string>('PORT', '4000'));
    fetch(`http://127.0.0.1:${port}/api/payments/webhooks/sandbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [SIGNATURE_HEADER]: signWebhook(this.webhookSecret, body) },
      body,
    })
      .then((res) => {
        if (!res.ok) this.logger.warn(`Notification ${event.type} refusée (${res.status}).`);
      })
      .catch((err) => this.logger.warn(`Notification ${event.type} non délivrée : ${(err as Error).message}`));
  }
}

/** Aucun prestataire de paiement configuré (production sans contrat) : le paiement sécurisé est désactivé. */
export class DisabledPaymentGateway implements PaymentGateway {
  readonly name = 'disabled';
  readonly available = false;
  private fail(): never {
    throw new ServiceUnavailableException(
      "Le paiement sécurisé n'est pas encore activé sur QIAO (prestataire de paiement non configuré).",
    );
  }
  createCheckout(): Promise<never> {
    this.fail();
  }
  expireCheckout(): Promise<void> {
    return Promise.resolve();
  }
  createAccountLink(): Promise<never> {
    this.fail();
  }
  refund(): Promise<never> {
    this.fail();
  }
  payout(): Promise<never> {
    this.fail();
  }
  cancelPayout(): Promise<boolean> {
    return Promise.resolve(false);
  }
  retrieve(): Promise<never> {
    this.fail();
  }
  verifyWebhook(): never {
    throw new UnauthorizedException('Aucun prestataire de paiement configuré.');
  }
}
