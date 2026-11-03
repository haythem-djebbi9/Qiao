import { Body, Controller, Get, Inject, NotFoundException, Param, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsIn } from 'class-validator';
import { Response } from 'express';
import { formatMoney } from '../payments.policy';
import { PAYMENT_GATEWAY, PaymentGateway } from './payment-gateway';
import { SandboxPaymentGateway } from './sandbox.gateway';

class CheckoutOutcomeDto {
  @IsIn(['success', 'decline', 'success_refund_fail'])
  outcome: 'success' | 'decline' | 'success_refund_fail';
}

class OnboardingOutcomeDto {
  @IsIn(['valid', 'payout_fail'])
  outcome: 'valid' | 'payout_fail';
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

function page(res: Response, title: string, body: string, publicOrigin: string) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${publicOrigin}; frame-ancestors 'none'; base-uri 'none'`,
  );
  res.send(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f9;color:#0f172a;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:24px;max-width:440px;width:100%;padding:28px;box-shadow:0 20px 40px -20px rgba(15,23,42,.25)}
.badge{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:999px;padding:3px 10px}
h1{font-size:20px;margin:14px 0 4px}p{font-size:13px;color:#475569;line-height:1.5;margin:6px 0}
.amount{font-size:30px;font-weight:800;margin:14px 0 2px}.muted{font-size:12px;color:#64748b}
button{width:100%;border:0;border-radius:14px;padding:12px 14px;font-size:14px;font-weight:700;cursor:pointer;margin-top:10px}
.primary{background:#dc2626;color:#fff}.secondary{background:#fff;color:#0f172a;border:1px solid #cbd5e1}.ghost{background:#f8fafc;color:#475569;border:1px dashed #cbd5e1;font-weight:600;font-size:13px}
a{color:#dc2626;font-weight:700;font-size:13px}
</style></head><body><div class="card"><span class="badge">Prestataire de paiement — simulation</span>${body}
<p class="muted" style="margin-top:18px">Environnement de test QIAO : aucune donnée bancaire n'est saisie ni débitée. En production, cette page est remplacée par celle du prestataire de paiement agréé.</p>
</div></body></html>`);
}

/** Pages de test du simulateur de prestataire de paiement (désactivées en production). */
@Controller('payments/sandbox')
export class SandboxController {
  private readonly publicOrigin: string;

  constructor(
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    config: ConfigService,
  ) {
    this.publicOrigin = new URL(config.get<string>('PUBLIC_URL', 'http://localhost:3000')).origin;
  }

  private get sandbox(): SandboxPaymentGateway {
    if (!(this.gateway instanceof SandboxPaymentGateway) || !this.gateway.available) throw new NotFoundException();
    return this.gateway;
  }

  @Get('checkout/:ref')
  async checkout(@Param('ref') ref: string, @Res() res: Response) {
    const record = await this.sandbox.findRecord(ref, 'checkout');
    if (!record) throw new NotFoundException('Session de paiement introuvable.');
    const meta = record.metadata;
    const back = `<p style="margin-top:16px"><a href="${escapeHtml(meta.returnUrl ?? '/')}">Retourner sur QIAO</a></p>`;
    if (record.status !== 'pending') {
      const label = { succeeded: 'Cette session a déjà été réglée.', failed: 'Ce paiement a été refusé.', cancelled: 'Cette session de paiement a expiré.' }[record.status] ?? '';
      return page(res, 'Paiement', `<h1>Session de paiement</h1><p>${label}</p>${back}`, this.publicOrigin);
    }
    page(
      res,
      'Paiement sécurisé QIAO',
      `<h1>Paiement sécurisé QIAO</h1>
<p>${escapeHtml(meta.description ?? '')}</p>
<div class="amount">${escapeHtml(formatMoney(record.amount, record.currency ?? 'EUR'))}</div>
<div class="muted">Référence ${escapeHtml(meta.reference ?? '')} · fonds retenus jusqu'à la libération prévue par la politique QIAO</div>
<form method="post" action="/api/payments/sandbox/checkout/${escapeHtml(record.id)}">
<button class="primary" name="outcome" value="success">Payer avec la carte de test (acceptée)</button>
<button class="secondary" name="outcome" value="decline">Simuler un refus de la banque</button>
<button class="ghost" name="outcome" value="success_refund_fail">Carte acceptée, mais remboursements refusés (test)</button>
</form>${back}`,
      this.publicOrigin,
    );
  }

  @Post('checkout/:ref')
  async completeCheckout(@Param('ref') ref: string, @Body() dto: CheckoutOutcomeDto, @Res() res: Response) {
    const record = await this.sandbox.completeCheckout(ref, dto.outcome);
    if (!record) throw new NotFoundException('Session de paiement introuvable.');
    res.redirect(303, record.metadata.returnUrl ?? this.publicOrigin);
  }

  @Get('onboarding/:ref')
  async onboarding(@Param('ref') ref: string, @Res() res: Response) {
    const record = await this.sandbox.findRecord(ref, 'account');
    if (!record) throw new NotFoundException('Compte introuvable.');
    page(
      res,
      'Compte de versement',
      `<h1>Compte de versement du prestataire</h1>
<p>Chez un prestataire réel, cette étape vérifie l'identité du prestataire (KYC) et ses coordonnées bancaires. QIAO n'enregistre aucune coordonnée bancaire.</p>
<form method="post" action="/api/payments/sandbox/onboarding/${escapeHtml(record.id)}">
<button class="primary" name="outcome" value="valid">Valider le compte de test</button>
<button class="ghost" name="outcome" value="payout_fail">Valider un compte dont les virements échoueront (test)</button>
</form>
<p style="margin-top:16px"><a href="${escapeHtml(record.metadata.returnUrl ?? '/')}">Retourner sur QIAO</a></p>`,
      this.publicOrigin,
    );
  }

  @Post('onboarding/:ref')
  async completeOnboarding(@Param('ref') ref: string, @Body() dto: OnboardingOutcomeDto, @Res() res: Response) {
    const record = await this.sandbox.completeOnboarding(ref, dto.outcome);
    if (!record) throw new NotFoundException('Compte introuvable.');
    res.redirect(303, record.metadata.returnUrl ?? this.publicOrigin);
  }
}
