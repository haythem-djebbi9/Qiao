import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { existsSync } from 'fs';
import PDFDocument from 'pdfkit';
import { In, Repository } from 'typeorm';
import { pdfSafe, RenderedFile } from '../documents/document-renderer';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService, RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { AcademyCertificate, Course, Lesson, LessonProgress } from './academy.entities';

type Admin = Pick<User, 'id' | 'fullName'>;

const RED = '#dc2626';
const NAVY = '#07152b';
const SLATE = '#475569';

/** Alphabet des numéros : sans 0/O ni 1/I pour une saisie sans ambiguïté ; 32 symboles, donc un tirage sans biais. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateNumber(year: number) {
  const chars = [...randomBytes(8)].map((byte) => ALPHABET[byte % ALPHABET.length]).join('');
  return `QA-${year}-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

/** Numéro saisi librement (minuscules, espaces, sans tirets) ramené à sa forme canonique ; null s'il est mal formé. */
export function normalizeCertificateNumber(raw: string): string | null {
  const match = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .match(/^QA(\d{4})([A-HJ-NP-Z2-9]{8})$/);
  return match ? `QA-${match[1]}-${match[2].slice(0, 4)}-${match[2].slice(4)}` : null;
}

const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === '23505';

const longDate = (date: Date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Certificats de réussite QIAO Academy : délivrance, PDF, vérification publique et révocation par l'administration. */
@Injectable()
export class CertificatesService {
  private readonly logger = new Logger('Certificates');
  private readonly publicUrl: string;
  /** Police TTF/OTF facultative pour les noms hors alphabet latin (chinois...), absents des polices PDF standard. */
  private readonly holderFont: string | null;

  constructor(
    @InjectRepository(AcademyCertificate) private readonly certificates: Repository<AcademyCertificate>,
    @InjectRepository(Lesson) private readonly lessons: Repository<Lesson>,
    @InjectRepository(LessonProgress) private readonly progress: Repository<LessonProgress>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly rateLimiter: RateLimiter,
    config: ConfigService,
  ) {
    this.publicUrl = config.get<string>('PUBLIC_URL', 'http://localhost:3000').replace(/\/+$/, '');
    const font = config.get<string>('ACADEMY_CERTIFICATE_FONT')?.trim();
    this.holderFont = font && existsSync(font) ? font : null;
  }

  // --- Délivrance --------------------------------------------------------------

  /**
   * Certificat du membre pour la formation, créé s'il n'existe pas encore (l'appelant a vérifié que toutes les leçons
   * publiées sont terminées). Nom, intitulé et score moyen aux quiz sont figés à cet instant.
   */
  async issue(userId: string, course: Course, completedAt?: Date | null): Promise<AcademyCertificate> {
    const existing = await this.findForCourse(userId, course.id);
    if (existing) return existing;

    const [user, lessonsCount, quizzes] = await Promise.all([
      this.users.findOne({ where: { id: userId }, select: { id: true, fullName: true } }),
      this.lessons.count({ where: { courseId: course.id, published: true } }),
      this.lessons.find({ where: { courseId: course.id, published: true, type: 'quiz' }, select: { id: true } }),
    ]);
    const rows = quizzes.length ? await this.progress.find({ where: { userId, lessonId: In(quizzes.map((q) => q.id)) } }) : [];
    const averageScore = quizzes.length
      ? Math.round(quizzes.reduce((sum, quiz) => sum + (rows.find((r) => r.lessonId === quiz.id)?.bestScore ?? 0), 0) / quizzes.length)
      : null;
    const issuedAt = completedAt ?? new Date();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.certificates.save(
          this.certificates.create({
            number: generateNumber(issuedAt.getFullYear()),
            userId,
            courseId: course.id,
            holderName: (user?.fullName ?? 'Membre QIAO').slice(0, 120),
            courseTitle: course.title.slice(0, 200),
            instructor: course.instructor.slice(0, 120),
            lessonsCount,
            quizzesCount: quizzes.length,
            averageScore,
            issuedAt,
          }),
        );
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        // Délivrance simultanée par une autre requête ; sinon collision de numéro : nouveau tirage.
        const created = await this.findForCourse(userId, course.id);
        if (created) return created;
      }
    }
    throw new Error('Aucun numéro de certificat disponible après 5 tirages.');
  }

  findForCourse(userId: string, courseId: string) {
    return this.certificates.findOne({ where: { userId, courseId } });
  }

  /** Certificats du membre, par formation. */
  async forUser(userId: string) {
    const rows = await this.certificates.find({ where: { userId } });
    return new Map(rows.map((c) => [c.courseId, this.present(c)]));
  }

  /** Certificats délivrés pour une formation, par membre (suivi des inscrits). */
  async forCourse(courseId: string) {
    const rows = await this.certificates.find({ where: { courseId } });
    return new Map(rows.map((c) => [c.userId, this.presentAdmin(c)]));
  }

  // --- Vérification publique ---------------------------------------------------

  /** Vérification par numéro : uniquement le nom du titulaire, la formation et les dates (ni score, ni motif). */
  async verify(raw: string, ip: string | null) {
    this.rateLimiter.hit(`academy-certificate-verify:${ip ?? 'inconnue'}`, 30, 10 * 60_000, 'Trop de vérifications. Réessayez dans quelques minutes.');
    const number = normalizeCertificateNumber(raw);
    const certificate = number ? await this.certificates.findOne({ where: { number } }) : null;
    if (!certificate) throw new NotFoundException('Aucun certificat QIAO Academy ne correspond à ce numéro.');
    return {
      number: certificate.number,
      status: certificate.status,
      holderName: certificate.holderName,
      courseTitle: certificate.courseTitle,
      issuedAt: certificate.issuedAt,
      revokedAt: certificate.revokedAt,
    };
  }

  verificationUrl(number: string) {
    return `${this.publicUrl}/?tab=certificat&numero=${encodeURIComponent(number)}`;
  }

  // --- Administration ----------------------------------------------------------

  async revoke(admin: Admin, id: string, reason: string) {
    const certificate = await this.findById(id);
    if (certificate.status === 'revoked') throw new BadRequestException('Ce certificat est déjà révoqué.');
    const motive = reason.trim();
    certificate.status = 'revoked';
    certificate.revokedAt = new Date();
    certificate.revokedReason = motive;
    certificate.revokedById = admin.id;
    await this.certificates.save(certificate);
    await this.notifications.notify(
      { id: certificate.userId } as User,
      'Certificat révoqué',
      `Votre certificat « ${certificate.courseTitle} » (n° ${certificate.number}) a été révoqué par l'équipe QIAO Academy. Motif : ${motive}`,
      'academy',
      'dashboard/academy',
    );
    await this.audit.log(
      admin,
      'academy.certificate.revoke',
      { type: 'academy_certificate', id, label: `${certificate.holderName} → ${certificate.courseTitle}` },
      { number: certificate.number, courseId: certificate.courseId, reason: motive },
    );
    return this.presentAdmin(certificate);
  }

  async restore(admin: Admin, id: string) {
    const certificate = await this.findById(id);
    if (certificate.status === 'valid') throw new BadRequestException("Ce certificat n'est pas révoqué.");
    const previousReason = certificate.revokedReason;
    certificate.status = 'valid';
    certificate.revokedAt = null;
    certificate.revokedReason = null;
    certificate.revokedById = null;
    await this.certificates.save(certificate);
    await this.notifications.notify(
      { id: certificate.userId } as User,
      'Certificat rétabli',
      `Votre certificat « ${certificate.courseTitle} » (n° ${certificate.number}) est de nouveau valide.`,
      'academy',
      'dashboard/academy',
    );
    await this.audit.log(
      admin,
      'academy.certificate.restore',
      { type: 'academy_certificate', id, label: `${certificate.holderName} → ${certificate.courseTitle}` },
      { number: certificate.number, courseId: certificate.courseId, previousReason },
    );
    return this.presentAdmin(certificate);
  }

  async findById(id: string) {
    const certificate = await this.certificates.findOne({ where: { id } });
    if (!certificate) throw new NotFoundException('Certificat introuvable.');
    return certificate;
  }

  // --- Présentation ------------------------------------------------------------

  present(c: AcademyCertificate) {
    return {
      id: c.id,
      number: c.number,
      status: c.status,
      issuedAt: c.issuedAt,
      averageScore: c.averageScore,
      lessonsCount: c.lessonsCount,
      quizzesCount: c.quizzesCount,
      revokedAt: c.revokedAt,
    };
  }

  presentAdmin(c: AcademyCertificate) {
    return { ...this.present(c), revokedReason: c.revokedReason };
  }

  // --- PDF -----------------------------------------------------------------------

  /** Certificat A4 paysage aux couleurs QIAO ; la copie d'un certificat révoqué (administration) porte la mention RÉVOQUÉ. */
  render(certificate: AcademyCertificate): Promise<RenderedFile> {
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 0,
        info: {
          Title: pdfSafe(`Certificat QIAO Academy — ${certificate.courseTitle}`),
          Author: 'QIAO Academy',
          Subject: `Certificat n° ${certificate.number}`,
        },
      });
      const chunks: Buffer[] = [];
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () =>
        resolve({ buffer: Buffer.concat(chunks), filename: `certificat-qiao-academy-${certificate.number}.pdf`, contentType: 'application/pdf' }),
      );
      pdf.on('error', reject);

      const W = pdf.page.width;
      const H = pdf.page.height;
      const centered = (text: string, y: number, options: PDFKit.Mixins.TextOptions = {}) =>
        pdf.text(pdfSafe(text), 0, y, { width: W, align: 'center', lineBreak: false, ...options });

      // Cadre
      pdf.rect(0, 0, W, 10).fill(NAVY);
      pdf.rect(0, H - 10, W, 10).fill(NAVY);
      pdf.lineWidth(2.5).strokeColor(NAVY).rect(22, 26, W - 44, H - 52).stroke();
      pdf.lineWidth(0.75).strokeColor(RED).rect(30, 34, W - 60, H - 68).stroke();

      // En-tête
      pdf.fillColor(NAVY).font('Helvetica-Bold').fontSize(28);
      centered('QIAO', 62);
      pdf.fillColor(RED).fontSize(10);
      centered('ACADEMY', 94, { characterSpacing: 4 });
      pdf.fillColor(SLATE).font('Helvetica').fontSize(9);
      centered('Le pont entre la Chine et l’Afrique du Nord', 110);

      pdf.fillColor(NAVY).font('Helvetica-Bold').fontSize(30);
      centered('CERTIFICAT DE RÉUSSITE', 146, { characterSpacing: 1.5 });
      pdf.lineWidth(2).strokeColor(RED).moveTo(W / 2 - 40, 190).lineTo(W / 2 + 40, 190).stroke();

      pdf.fillColor(SLATE).font('Helvetica').fontSize(12);
      centered('Ce certificat est décerné à', 208);

      // Titulaire : police dédiée si le nom sort de l'alphabet latin et qu'une police est configurée.
      const latinName = pdfSafe(certificate.holderName).trim();
      const needsFont = latinName !== certificate.holderName.trim();
      if (needsFont && this.holderFont) pdf.font(this.holderFont);
      else {
        if (needsFont) this.logger.warn(`Nom hors alphabet latin sur le certificat ${certificate.number} : définissez ACADEMY_CERTIFICATE_FONT.`);
        pdf.font('Helvetica-Bold');
      }
      const name = needsFont && this.holderFont ? certificate.holderName.trim() : latinName || 'Membre QIAO Academy';
      let size = 32;
      while (size > 18 && pdf.fontSize(size).widthOfString(name) > W - 200) size -= 1;
      pdf.fillColor(NAVY).fontSize(size).text(name, 0, 230 + (32 - size) / 2, { width: W, align: 'center', lineBreak: false });

      pdf.fillColor(SLATE).font('Helvetica').fontSize(12);
      centered('pour avoir suivi et validé l’ensemble de la formation', 280);
      // Intitulé sur deux lignes au plus : la taille diminue pour les titres longs.
      const title = pdfSafe(certificate.courseTitle);
      const titleOptions = { width: W - 220, align: 'center' as const, lineGap: 2 };
      let titleSize = 18;
      pdf.font('Helvetica-Bold');
      while (titleSize > 11 && pdf.fontSize(titleSize).heightOfString(title, titleOptions) > 48) titleSize -= 1;
      pdf.fillColor(RED).fontSize(titleSize).text(title, 110, 302, titleOptions);

      const details = [`${certificate.lessonsCount} leçon${certificate.lessonsCount > 1 ? 's' : ''} validée${certificate.lessonsCount > 1 ? 's' : ''}`];
      if (certificate.averageScore !== null) {
        details.push(`Score moyen aux quiz : ${certificate.averageScore} % (${certificate.quizzesCount} quiz)`);
      }
      pdf.fillColor(SLATE).font('Helvetica').fontSize(10);
      centered(details.join('   ·   '), Math.min(pdf.y + 14, 372));

      // Date, sceau, formateur
      const column = (x: number, value: string, label: string) => {
        pdf.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text(pdfSafe(value), x, 440, { width: 230, align: 'center', lineBreak: false });
        pdf.lineWidth(0.75).strokeColor('#cbd5e1').moveTo(x + 15, 460).lineTo(x + 215, 460).stroke();
        pdf.fillColor(SLATE).font('Helvetica').fontSize(9).text(pdfSafe(label), x, 466, { width: 230, align: 'center', lineBreak: false });
      };
      column(90, longDate(certificate.issuedAt), 'Date de délivrance');
      column(W - 320, certificate.instructor, 'Formateur · QIAO Academy');

      const cx = W / 2;
      const cy = 452;
      pdf.circle(cx, cy, 44).fill(RED);
      pdf.lineWidth(1).strokeColor('#ffffff').circle(cx, cy, 38).stroke();
      pdf.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15).text('QIAO', cx - 40, cy - 16, { width: 80, align: 'center', lineBreak: false });
      pdf.fontSize(6.5).text('ACADEMY', cx - 40, cy + 1, { width: 80, align: 'center', characterSpacing: 1.5, lineBreak: false });
      pdf.font('Helvetica').fontSize(6.5).text(String(new Date(certificate.issuedAt).getFullYear()), cx - 40, cy + 11, { width: 80, align: 'center', lineBreak: false });

      // Numéro et vérification
      const url = this.verificationUrl(certificate.number);
      pdf.fillColor(NAVY).font('Helvetica-Bold').fontSize(9);
      centered(`Certificat n° ${certificate.number}`, 520);
      pdf.fillColor(SLATE).font('Helvetica').fontSize(8);
      centered(`Authenticité vérifiable sur ${url}`, 534, { link: url });

      if (certificate.status === 'revoked') {
        pdf.save();
        pdf.rotate(-18, { origin: [W / 2, H / 2] });
        pdf.fillColor(RED).fillOpacity(0.18).font('Helvetica-Bold').fontSize(96);
        centered('RÉVOQUÉ', H / 2 - 48);
        pdf.restore();
      }
      pdf.end();
    });
  }
}
