import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { AdminGuard, ClientContext, CurrentUser, JwtAuthGuard } from '../../common/auth.guards';
import { MAX_ATTACHMENT_SIZE } from '../community/posts.service';
import { User } from '../users/user.entity';
import { DisputesService } from './disputes.service';
import { FinancialService } from './financial.service';
import { PaymentsAdminService } from './payments-admin.service';
import {
  AcceptTransactionDto,
  AdjustmentDto,
  AdminNoteDto,
  AdminQueueQuery,
  CreateTransactionDto,
  DeclareCompletionDto,
  DisputeDecisionDto,
  DisputeEntryDto,
  HoldDto,
  ListTransactionsQuery,
  OpenDisputeDto,
  ReasonDto,
  RequestEvidenceDto,
  ResolveInterventionDto,
  SettlementDto,
} from './payments.dto';
import { CANCELLATION_RULES, CURRENCIES, DEADLINE_POLICY, DISPUTE_REASONS, EXPECTED_RESOLUTIONS, commissionRateBps } from './payments.policy';
import { PaymentsViews } from './payments.views';
import { TransactionsService } from './transactions.service';

/** Services & paiements sécurisés : actions du client et du prestataire. */
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly transactions: TransactionsService,
    private readonly disputes: DisputesService,
    private readonly views: PaymentsViews,
    private readonly financial: FinancialService,
  ) {}

  /** Politique publiée : délai de protection, annulations, motifs de litige, devises. */
  @Get('policy')
  policy() {
    return {
      paymentsEnabled: this.financial.gateway.available,
      provider: this.financial.gateway.name,
      deadline: DEADLINE_POLICY,
      cancellation: CANCELLATION_RULES,
      disputeReasons: DISPUTE_REASONS,
      expectedResolutions: EXPECTED_RESOLUTIONS,
      currencies: CURRENCIES,
      commissionPercent: commissionRateBps() / 100,
    };
  }

  @Get('providers/:handle')
  provider(@Param('handle') handle: string) {
    return this.transactions.providerEligibility(handle);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: User, @Query() query: ListTransactionsQuery) {
    return this.views.listForUser(user, query.role);
  }

  @Post('transactions')
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(user, dto);
  }

  @Get('transactions/:id')
  @UseGuards(JwtAuthGuard)
  detail(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.views.forParty(id, user);
  }

  @Post('transactions/:id/accept')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  accept(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AcceptTransactionDto) {
    return this.transactions.accept(user, id, dto);
  }

  @Post('transactions/:id/decline')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  decline(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReasonDto) {
    return this.transactions.decline(user, id, dto.reason);
  }

  @Post('transactions/:id/cancel')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReasonDto) {
    return this.transactions.cancel(user, id, dto.reason);
  }

  @Post('transactions/:id/checkout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactions.checkout(user, id);
  }

  @Post('transactions/:id/start')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  start(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactions.start(user, id);
  }

  @Post('transactions/:id/declare-completion')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  declare(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeclareCompletionDto,
    @ClientContext() client: { ip: string | null },
  ) {
    return this.transactions.declareCompletion(user, id, dto, client.ip);
  }

  @Post('transactions/:id/confirm')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  confirm(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactions.confirm(user, id);
  }

  @Post('transactions/:id/dispute')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  dispute(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: OpenDisputeDto) {
    return this.disputes.open(user, id, dto);
  }

  @Post('transactions/:id/dispute/entries')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  disputeEntry(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: DisputeEntryDto) {
    return this.disputes.addEntry(user, id, dto);
  }

  @Post('transactions/:id/settlement')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  proposeSettlement(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SettlementDto) {
    return this.transactions.proposeSettlement(user, id, dto);
  }

  @Post('transactions/:id/settlement/accept')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  acceptSettlement(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactions.respondSettlement(user, id, true);
  }

  @Post('transactions/:id/settlement/decline')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  declineSettlement(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactions.respondSettlement(user, id, false);
  }

  @Post('transactions/:id/settlement/withdraw')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  withdrawSettlement(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactions.withdrawSettlement(user, id);
  }

  @Get('payout-account')
  @UseGuards(JwtAuthGuard)
  payoutAccount(@CurrentUser() user: User) {
    return this.transactions.payoutAccount(user);
  }

  @Post('payout-account/link')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  payoutAccountLink(@CurrentUser() user: User) {
    return this.transactions.payoutAccountLink(user);
  }

  @Post('uploads')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_ATTACHMENT_SIZE, files: 1 } }))
  upload(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    return this.transactions.upload(user, file);
  }

  @Get('attachments/:id')
  @UseGuards(JwtAuthGuard)
  async attachment(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const file = await this.transactions.attachmentFile(user, id);
    res.setHeader('Content-Type', file.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(file.path, (err) => {
      if (err && !res.headersSent) res.status(404).json({ statusCode: 404, message: 'Fichier introuvable.' });
    });
  }
}

/** Notifications du prestataire de paiement : authentifiées par signature, sans session utilisateur. */
@Controller('payments/webhooks')
export class PaymentWebhooksController {
  constructor(private readonly financial: FinancialService) {}

  @Post(':provider')
  @HttpCode(200)
  receive(@Param('provider') provider: string, @Req() req: RawBodyRequest<Request>) {
    return this.financial.handleWebhook(provider, req.rawBody, req.headers);
  }
}

/** Tableau de bord QIAO des paiements et litiges (§9) : réservé aux administrateurs, actions journalisées. */
@Controller('payments/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PaymentsAdminController {
  constructor(
    private readonly admin: PaymentsAdminService,
    private readonly disputes: DisputesService,
  ) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('transactions')
  list(@Query() query: AdminQueueQuery) {
    return this.admin.list(query);
  }

  @Get('transactions/:id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.detail(id);
  }

  @Post('disputes/:id/take')
  @HttpCode(200)
  async take(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    const view = await this.disputes.take(user, id);
    return this.admin.detail(view.id);
  }

  @Post('disputes/:id/request-evidence')
  @HttpCode(200)
  async requestEvidence(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RequestEvidenceDto) {
    const view = await this.disputes.requestEvidence(user, id, dto);
    return this.admin.detail(view.id);
  }

  @Post('disputes/:id/notes')
  @HttpCode(200)
  async note(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminNoteDto) {
    const view = await this.disputes.addNote(user, id, dto.message);
    return this.admin.detail(view.id);
  }

  @Post('disputes/:id/decide')
  @HttpCode(200)
  async decide(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: DisputeDecisionDto) {
    const view = await this.disputes.decide(user, id, dto);
    return this.admin.detail(view.id);
  }

  @Post('transactions/:id/hold')
  @HttpCode(200)
  hold(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: HoldDto) {
    return this.admin.hold(user, id, dto.reason);
  }

  @Post('transactions/:id/release-hold')
  @HttpCode(200)
  releaseHold(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.releaseHold(user, id);
  }

  @Post('transactions/:id/retry')
  @HttpCode(200)
  retry(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveInterventionDto) {
    return this.admin.retry(user, id, dto.note);
  }

  @Post('transactions/:id/resolve-intervention')
  @HttpCode(200)
  resolve(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveInterventionDto) {
    return this.admin.resolveIntervention(user, id, dto.note);
  }

  @Post('transactions/:id/adjustments')
  @HttpCode(200)
  adjustment(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AdjustmentDto) {
    return this.admin.adjustment(user, id, dto);
  }
}
