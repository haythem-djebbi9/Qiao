import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpertProfile } from '../community/community.entities';
import { DisputesService } from './disputes.service';
import { ExternalCheckouts } from './external-checkouts';
import { FinancialService } from './financial.service';
import { PAYMENT_GATEWAY } from './gateway/payment-gateway';
import { SandboxController } from './gateway/sandbox.controller';
import { SandboxRecord } from './gateway/sandbox.entity';
import { DisabledPaymentGateway, SandboxPaymentGateway } from './gateway/sandbox.gateway';
import { StripePaymentGateway } from './gateway/stripe.gateway';
import { PaymentsAdminService } from './payments-admin.service';
import { PaymentWebhooksController, PaymentsAdminController, PaymentsController } from './payments.controller';
import { PaymentsCore } from './payments.core';
import {
  CompletionDeclaration,
  DisputeEntry,
  LedgerEntry,
  PaymentWebhookEvent,
  PayoutAccount,
  ServiceAttachment,
  ServiceDispute,
  ServicePayout,
  ServiceRefund,
  ServiceTransaction,
  TransactionEvent,
} from './payments.entities';
import { PaymentsNotifier } from './payments.notifier';
import { PaymentsScheduler } from './payments.scheduler';
import { PaymentsViews } from './payments.views';
import { TransactionsService } from './transactions.service';

/**
 * Services & paiements sécurisés (spécification « Secure Payment & Dispute Management » v1.0).
 * PAYMENT_PROVIDER : « stripe » (Stripe Connect, charges et transferts séparés, versements manuels) ou « sandbox »
 * (simulateur, défaut hors production) ; sans prestataire agréé configuré en production, le paiement sécurisé est
 * désactivé plutôt que de laisser QIAO détenir des fonds sans autorisation (BR-02).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceTransaction,
      TransactionEvent,
      CompletionDeclaration,
      ServiceDispute,
      DisputeEntry,
      ServiceRefund,
      ServicePayout,
      LedgerEntry,
      PaymentWebhookEvent,
      PayoutAccount,
      ServiceAttachment,
      SandboxRecord,
      ExpertProfile,
    ]),
  ],
  controllers: [PaymentsController, PaymentWebhooksController, PaymentsAdminController, SandboxController],
  providers: [
    ExternalCheckouts,
    PaymentsCore,
    PaymentsViews,
    PaymentsNotifier,
    FinancialService,
    TransactionsService,
    DisputesService,
    PaymentsAdminService,
    PaymentsScheduler,
    SandboxPaymentGateway,
    StripePaymentGateway,
    {
      provide: PAYMENT_GATEWAY,
      inject: [ConfigService, SandboxPaymentGateway, StripePaymentGateway],
      useFactory: (config: ConfigService, sandbox: SandboxPaymentGateway, stripe: StripePaymentGateway) => {
        const logger = new Logger('Payments');
        const production = config.get<string>('NODE_ENV') === 'production';
        const provider = config.get<string>('PAYMENT_PROVIDER') || (production ? 'none' : 'sandbox');
        if (provider === 'sandbox' && sandbox.available) {
          logger.log('Prestataire de paiement : simulateur (sandbox) — aucune transaction réelle.');
          return sandbox;
        }
        if (provider === 'stripe' && stripe.available) {
          if (stripe.liveMode) logger.log('Prestataire de paiement : Stripe Connect (mode réel).');
          else logger.warn('Prestataire de paiement : Stripe Connect en mode TEST — aucune somme réelle n’est encaissée ni versée.');
          if (!config.get<string>('STRIPE_WEBHOOK_SECRET')) {
            logger.warn('STRIPE_WEBHOOK_SECRET absent : notifications Stripe refusées, suivi par rapprochement périodique uniquement.');
          }
          return stripe;
        }
        if (provider === 'stripe') logger.warn('PAYMENT_PROVIDER=stripe sans clé STRIPE_SECRET_KEY valide.');
        logger.warn('Aucun prestataire de paiement agréé configuré : le paiement sécurisé est désactivé.');
        return new DisabledPaymentGateway();
      },
    },
  ],
  // Passerelle et aiguillage réutilisés par QIAO Academy pour le paiement des formations.
  exports: [PAYMENT_GATEWAY, ExternalCheckouts],
})
export class PaymentsModule {}
