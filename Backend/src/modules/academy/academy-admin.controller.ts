import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { AdminGuard, CurrentUser, JwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import {
  AcademyAuditQueryDto,
  AdminCoursesQueryDto,
  AdminOrdersQueryDto,
  CourseDto,
  DomainDto,
  GrantEnrollmentDto,
  LearnersQueryDto,
  LessonDto,
  ModuleDto,
  OrderDecisionDto,
  OrderDto,
  PathDto,
  PaymentSettingsDto,
  PricesDto,
  RevokeCertificateDto,
  StatusDto,
  UpdateCourseDto,
  UpdateDomainDto,
  UpdateLessonDto,
  UpdateModuleDto,
  UpdatePathDto,
  UploadQueryDto,
} from './academy-admin.dto';
import { AcademyAdminService, MAX_ACADEMY_UPLOAD } from './academy-admin.service';
import { AcademyPaymentsService } from './academy-payments.service';
import { sendPdf } from './academy.controller';
import { CertificatesService } from './certificates.service';

/** Administration de QIAO Academy (administrateurs QIAO uniquement ; actions journalisées par AuditService). */
@Controller('academy/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AcademyAdminController {
  constructor(
    private readonly admin: AcademyAdminService,
    private readonly certificates: CertificatesService,
    private readonly payments: AcademyPaymentsService,
  ) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  // --- Formations ---

  @Get('courses')
  courses(@Query() query: AdminCoursesQueryDto) {
    return this.admin.listCourses(query);
  }

  @Post('courses')
  createCourse(@CurrentUser() user: User, @Body() dto: CourseDto) {
    return this.admin.createCourse(user, dto);
  }

  @Get('courses/:id')
  course(@Param('id') id: string) {
    return this.admin.getCourse(id);
  }

  @Patch('courses/:id')
  updateCourse(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.admin.updateCourse(user, id, dto);
  }

  @Post('courses/:id/status')
  @HttpCode(200)
  courseStatus(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: StatusDto) {
    return this.admin.setCourseStatus(user, id, dto.status);
  }

  @Delete('courses/:id')
  deleteCourse(@CurrentUser() user: User, @Param('id') id: string) {
    return this.admin.deleteCourse(user, id);
  }

  @Post('courses/:id/import-syllabus')
  @HttpCode(200)
  importSyllabus(@CurrentUser() user: User, @Param('id') id: string) {
    return this.admin.importSyllabus(user, id);
  }

  @Get('courses/:id/learners')
  courseLearners(@Param('id') id: string) {
    return this.admin.courseLearners(id);
  }

  // --- Modules & leçons ---

  @Post('courses/:id/modules')
  addModule(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: ModuleDto) {
    return this.admin.addModule(user, id, dto);
  }

  @Put('courses/:id/modules/order')
  reorderModules(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: OrderDto) {
    return this.admin.reorderModules(user, id, dto.ids);
  }

  @Patch('modules/:id')
  updateModule(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateModuleDto) {
    return this.admin.updateModule(user, id, dto);
  }

  @Delete('modules/:id')
  deleteModule(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteModule(user, id);
  }

  @Post('modules/:id/lessons')
  addLesson(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: LessonDto) {
    return this.admin.addLesson(user, id, dto);
  }

  @Put('modules/:id/lessons/order')
  reorderLessons(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: OrderDto) {
    return this.admin.reorderLessons(user, id, dto.ids);
  }

  @Patch('lessons/:id')
  updateLesson(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLessonDto) {
    return this.admin.updateLesson(user, id, dto);
  }

  @Delete('lessons/:id')
  deleteLesson(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteLesson(user, id);
  }

  @Post('uploads')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_ACADEMY_UPLOAD, files: 1 } }))
  upload(@CurrentUser() user: User, @Query() query: UploadQueryDto, @UploadedFile() file: Express.Multer.File) {
    return this.admin.upload(user, query.purpose, file);
  }

  // --- Parcours ---

  @Get('paths')
  paths() {
    return this.admin.listPaths();
  }

  @Post('paths')
  createPath(@CurrentUser() user: User, @Body() dto: PathDto) {
    return this.admin.createPath(user, dto);
  }

  @Patch('paths/:id')
  updatePath(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdatePathDto) {
    return this.admin.updatePath(user, id, dto);
  }

  @Post('paths/:id/status')
  @HttpCode(200)
  pathStatus(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: StatusDto) {
    return this.admin.setPathStatus(user, id, dto.status);
  }

  @Delete('paths/:id')
  deletePath(@CurrentUser() user: User, @Param('id') id: string) {
    return this.admin.deletePath(user, id);
  }

  // --- Domaines ---

  @Get('domains')
  domains() {
    return this.admin.listDomains();
  }

  @Post('domains')
  createDomain(@CurrentUser() user: User, @Body() dto: DomainDto) {
    return this.admin.createDomain(user, dto);
  }

  @Patch('domains/:id')
  updateDomain(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateDomainDto) {
    return this.admin.updateDomain(user, id, dto);
  }

  @Post('domains/:id/status')
  @HttpCode(200)
  domainStatus(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: StatusDto) {
    return this.admin.setDomainStatus(user, id, dto.status);
  }

  @Delete('domains/:id')
  deleteDomain(@CurrentUser() user: User, @Param('id') id: string) {
    return this.admin.deleteDomain(user, id);
  }

  // --- Tarifs, inscrits, journal ---

  @Patch('prices')
  prices(@CurrentUser() user: User, @Body() dto: PricesDto) {
    return this.admin.updatePrices(user, dto);
  }

  @Get('learners')
  learners(@Query() query: LearnersQueryDto) {
    return this.admin.listLearners(query);
  }

  @Post('enrollments')
  grant(@CurrentUser() user: User, @Body() dto: GrantEnrollmentDto) {
    return this.admin.grantEnrollment(user, dto);
  }

  @Delete('enrollments/:id')
  revoke(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.revokeEnrollment(user, id);
  }

  // --- Certificats ---

  /** Copie du certificat (mention « RÉVOQUÉ » s'il a été révoqué). */
  @Get('certificates/:id/pdf')
  async certificatePdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    sendPdf(res, await this.certificates.render(await this.certificates.findById(id)));
  }

  @Post('certificates/:id/revoke')
  @HttpCode(200)
  revokeCertificate(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RevokeCertificateDto) {
    return this.certificates.revoke(user, id, dto.reason);
  }

  @Post('certificates/:id/restore')
  @HttpCode(200)
  restoreCertificate(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.certificates.restore(user, id);
  }

  // --- Commandes et paiement ---

  @Get('orders')
  orders(@Query() query: AdminOrdersQueryDto) {
    return this.payments.adminList(query);
  }

  /** Virement reçu : la commande est payée et l'accès ouvert. */
  @Post('orders/:id/validate')
  @HttpCode(200)
  validateOrder(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: OrderDecisionDto) {
    return this.payments.validateTransfer(user, id, dto.note);
  }

  @Post('orders/:id/cancel')
  @HttpCode(200)
  cancelOrder(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: OrderDecisionDto) {
    return this.payments.adminCancel(user, id, dto.note);
  }

  @Get('payment-settings')
  paymentSettings() {
    return this.payments.settings();
  }

  @Patch('payment-settings')
  updatePaymentSettings(@CurrentUser() user: User, @Body() dto: PaymentSettingsDto) {
    return this.payments.updateSettings(user, dto);
  }

  @Get('audit')
  audit(@Query() query: AcademyAuditQueryDto) {
    return this.admin.auditLog(query);
  }
}
