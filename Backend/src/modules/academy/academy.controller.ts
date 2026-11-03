import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ClientContext, CurrentUser, JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { RenderedFile } from '../documents/document-renderer';
import { User } from '../users/user.entity';
import { AcademyItemDto, CheckoutDto, CoursesQueryDto, EnrollDto, QuizAnswersDto } from './academy.dto';
import { AcademyPaymentsService } from './academy-payments.service';
import { NoteDto, UpdateNoteDto } from './academy-admin.dto';
import { AcademyService } from './academy.service';
import { CertificatesService } from './certificates.service';
import { LearningService } from './learning.service';

export function sendPdf(res: Response, file: RenderedFile) {
  res.set({
    'Content-Type': file.contentType,
    'Content-Disposition': `attachment; filename="${file.filename}"`,
    'Content-Length': file.buffer.length,
    'Cache-Control': 'private, no-store',
  });
  res.send(file.buffer);
}

@Controller('academy')
export class AcademyController {
  constructor(
    private readonly academyService: AcademyService,
    private readonly learning: LearningService,
    private readonly certificates: CertificatesService,
    private readonly payments: AcademyPaymentsService,
  ) {}

  @Get('domains')
  domains() {
    return this.academyService.listDomains();
  }

  @Get('domains/:id/courses')
  domainCourses(@Param('id') id: string) {
    return this.academyService.domainCourses(id);
  }

  @Get('courses')
  courses(@Query() query: CoursesQueryDto) {
    return this.academyService.listCourses(query);
  }

  /** Fiche publique : programme (modules et titres des leçons). */
  @Get('courses/:id')
  @UseGuards(OptionalJwtAuthGuard)
  course(@Param('id') id: string, @CurrentUser() user: User | null) {
    return this.academyService.courseOutline(id, user);
  }

  @Get('paths')
  paths() {
    return this.academyService.listPaths();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  summary(@CurrentUser() user: User) {
    return this.academyService.summary(user);
  }

  @Post('favorites/:courseId')
  @UseGuards(JwtAuthGuard)
  toggleFavorite(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.academyService.toggleFavorite(user, courseId);
  }

  @Get('cart')
  @UseGuards(JwtAuthGuard)
  cart(@CurrentUser() user: User) {
    return this.academyService.getCart(user);
  }

  @Post('cart')
  @UseGuards(JwtAuthGuard)
  addToCart(@CurrentUser() user: User, @Body() dto: AcademyItemDto) {
    return this.academyService.addToCart(user, dto);
  }

  @Delete('cart/:id')
  @UseGuards(JwtAuthGuard)
  removeFromCart(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.academyService.removeFromCart(user, id);
  }

  @Post('cart/checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: User, @Body() dto: CheckoutDto) {
    return this.academyService.checkout(user, dto.method);
  }

  @Post('enroll')
  @UseGuards(JwtAuthGuard)
  enroll(@CurrentUser() user: User, @Body() dto: EnrollDto) {
    return this.academyService.enroll(user, dto, dto.method);
  }

  // --- Paiement des commandes (carte via le prestataire, ou virement validé par l'administration) ---

  /** Modes de paiement disponibles et taux appliqué au paiement par carte. */
  @Get('payment-options')
  paymentOptions() {
    return this.payments.options();
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  orders(@CurrentUser() user: User) {
    return this.payments.listForUser(user);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  order(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.detail(user, id);
  }

  @Post('orders/:id/pay')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  payOrder(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.pay(user, id);
  }

  @Post('orders/:id/cancel')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  cancelOrder(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.cancel(user, id);
  }

  @Get('enrollments')
  @UseGuards(JwtAuthGuard)
  enrollments(@CurrentUser() user: User) {
    return this.academyService.listEnrollments(user);
  }

  // --- Lecteur de formation (inscrits ; aperçu sans enregistrement pour les administrateurs) ---

  @Get('learn/:courseId')
  @UseGuards(JwtAuthGuard)
  learn(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.learning.learn(user, courseId);
  }

  @Post('learn/:courseId/lessons/:lessonId/view')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  view(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('lessonId', ParseUUIDPipe) lessonId: string) {
    return this.learning.view(user, courseId, lessonId);
  }

  @Post('learn/:courseId/lessons/:lessonId/complete')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  complete(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('lessonId', ParseUUIDPipe) lessonId: string) {
    return this.learning.complete(user, courseId, lessonId);
  }

  @Post('learn/:courseId/lessons/:lessonId/quiz')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  quiz(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: QuizAnswersDto,
  ) {
    return this.learning.submitQuiz(user, courseId, lessonId, dto.answers);
  }

  // --- Notes personnelles (horodatées sur les vidéos) ---

  @Get('learn/:courseId/notes')
  @UseGuards(JwtAuthGuard)
  notes(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.learning.listNotes(user, courseId);
  }

  @Post('learn/:courseId/lessons/:lessonId/notes')
  @UseGuards(JwtAuthGuard)
  addNote(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('lessonId', ParseUUIDPipe) lessonId: string, @Body() dto: NoteDto) {
    return this.learning.addNote(user, courseId, lessonId, dto);
  }

  @Patch('notes/:id')
  @UseGuards(JwtAuthGuard)
  updateNote(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNoteDto) {
    return this.learning.updateNote(user, id, dto);
  }

  @Delete('notes/:id')
  @UseGuards(JwtAuthGuard)
  deleteNote(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.learning.deleteNote(user, id);
  }

  // --- Certificats de réussite ---

  /** Certificat PDF du titulaire (formation terminée). */
  @Get('learn/:courseId/certificate')
  @UseGuards(JwtAuthGuard)
  async certificate(@CurrentUser() user: User, @Param('courseId') courseId: string, @Res() res: Response) {
    sendPdf(res, await this.learning.certificatePdf(user, courseId));
  }

  /** Vérification publique d'un certificat par son numéro (nom du titulaire, formation, dates). */
  @Get('certificates/verify/:number')
  verifyCertificate(@Param('number') number: string, @ClientContext() ctx: { ip: string | null }) {
    return this.certificates.verify(number.slice(0, 40), ctx.ip);
  }

  /** Couvertures (publiques) et supports de leçons (inscrits uniquement). */
  @Get('files/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async file(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User | null, @Res() res: Response) {
    const file = await this.learning.file(id, user);
    res.setHeader('Content-Type', file.mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.sendFile(file.path, (err) => {
      if (err && !res.headersSent) res.status(404).json({ statusCode: 404, message: 'Fichier introuvable.' });
    });
  }
}
