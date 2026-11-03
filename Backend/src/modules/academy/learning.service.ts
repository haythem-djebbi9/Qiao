import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { join } from 'path';
import { In, Repository } from 'typeorm';
import { uploadsPath } from '../../common/uploads';
import { NotificationsService } from '../notifications/notifications.service';
import { RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { AcademyFile, Course, CourseModule, Enrollment, LearningPath, Lesson, LessonNote, LessonProgress } from './academy.entities';
import { CertificatesService } from './certificates.service';

export const ACADEMY_FILES_DIR = uploadsPath('academy');

/** Accès au contenu : apprenant inscrit (progression enregistrée) ou aperçu administrateur (rien n'est enregistré). */
type Access = { mode: 'learner'; enrollment: Enrollment } | { mode: 'preview'; enrollment: null };

export interface ProgressSummary {
  progress: number;
  status: 'active' | 'completed';
  completedLessons: number;
  totalLessons: number;
}

const percent = (done: number, total: number) => (total > 0 ? Math.round((done * 100) / total) : 0);

/** Parcours apprenant : lecture des leçons, validation, quiz corrigés côté serveur et progression réelle. */
@Injectable()
export class LearningService {
  private readonly logger = new Logger('Learning');

  constructor(
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(LearningPath) private readonly paths: Repository<LearningPath>,
    @InjectRepository(CourseModule) private readonly modules: Repository<CourseModule>,
    @InjectRepository(Lesson) private readonly lessons: Repository<Lesson>,
    @InjectRepository(LessonProgress) private readonly progress: Repository<LessonProgress>,
    @InjectRepository(AcademyFile) private readonly files: Repository<AcademyFile>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(LessonNote) private readonly notes: Repository<LessonNote>,
    private readonly notifications: NotificationsService,
    private readonly rateLimiter: RateLimiter,
    private readonly certificates: CertificatesService,
  ) {}

  // --- Accès -----------------------------------------------------------------

  /**
   * Inscription directe, ou formation d'un parcours suivi (l'inscription à la formation est alors créée à la première
   * ouverture, pour enregistrer sa progression). Les inscrits gardent l'accès si la formation est archivée.
   */
  private async access(user: User, course: Course): Promise<Access> {
    const direct = await this.enrollments.findOne({ where: { user: { id: user.id }, itemType: 'course', itemId: course.id } });
    if (direct) return { mode: 'learner', enrollment: direct };

    const path = course.status === 'draft' ? null : await this.pathGranting(user.id, course.id);
    if (path) {
      try {
        const enrollment = await this.enrollments.save(
          this.enrollments.create({
            user: { id: user.id } as User,
            itemType: 'course',
            itemId: course.id,
            title: course.title,
            image: course.image,
            source: 'path',
            viaPathId: path.id,
          }),
        );
        return { mode: 'learner', enrollment };
      } catch {
        // Ouverture simultanée : l'inscription vient d'être créée par l'autre requête.
        const created = await this.enrollments.findOne({ where: { user: { id: user.id }, itemType: 'course', itemId: course.id } });
        if (created) return { mode: 'learner', enrollment: created };
      }
    }
    if (user.role === 'admin') return { mode: 'preview', enrollment: null };
    throw new ForbiddenException('Inscrivez-vous à cette formation pour accéder à son contenu.');
  }

  /** Parcours suivi par le membre qui contient la formation. */
  async pathGranting(userId: string, courseId: string): Promise<LearningPath | null> {
    const pathEnrollments = await this.enrollments.find({ where: { user: { id: userId }, itemType: 'path' } });
    if (pathEnrollments.length === 0) return null;
    const paths = await this.paths.find({ where: { id: In(pathEnrollments.map((e) => e.itemId)) } });
    return paths.find((p) => (p.courseIds ?? []).includes(courseId)) ?? null;
  }

  private async findCourse(id: string) {
    const course = await this.courses.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Formation introuvable.');
    return course;
  }

  private async lessonContext(user: User, courseId: string, lessonId: string) {
    const course = await this.findCourse(courseId);
    const access = await this.access(user, course);
    const lesson = await this.lessons.findOne({ where: { id: lessonId, courseId } });
    if (!lesson || (access.mode === 'learner' && !lesson.published)) throw new NotFoundException('Leçon introuvable.');
    return { course, lesson, access };
  }

  // --- Lecture ---------------------------------------------------------------

  /** Formation complète pour le lecteur : modules, leçons (sans les réponses des quiz) et progression du membre. */
  async learn(user: User, courseId: string) {
    const course = await this.findCourse(courseId);
    const access = await this.access(user, course);
    const preview = access.mode === 'preview';
    const [modules, lessons, rows] = await Promise.all([
      this.modules.find({ where: { courseId }, order: { sortOrder: 'ASC', createdAt: 'ASC' } }),
      this.lessons.find({ where: preview ? { courseId } : { courseId, published: true }, order: { sortOrder: 'ASC', createdAt: 'ASC' } }),
      preview ? Promise.resolve([] as LessonProgress[]) : this.progress.find({ where: { userId: user.id, courseId } }),
    ]);
    const files = await this.filesById(lessons.flatMap((l) => [l.fileId, ...(l.resources ?? []).map((r) => r.fileId ?? null)]));
    const byLesson = new Map(rows.map((row) => [row.lessonId, row]));

    const published = lessons.filter((l) => l.published);
    const completed = published.filter((l) => byLesson.get(l.id)?.completedAt).length;
    let enrollment = access.enrollment;
    if (enrollment) {
      // Le programme a pu changer depuis la dernière visite (leçons ajoutées ou retirées) : progression resynchronisée.
      const expected = percent(completed, published.length);
      if (enrollment.progress !== expected || (enrollment.status === 'completed') !== (published.length > 0 && completed >= published.length)) {
        enrollment = await this.applyProgress(user.id, course, enrollment, published.length, completed);
        await this.refreshPaths(user.id, course.id);
      }
    }
    // Formation terminée avant l'arrivée des certificats : le certificat est délivré à la première ouverture.
    const done = published.length > 0 && completed >= published.length;
    const certificate = !enrollment
      ? null
      : done
        ? await this.certificates.issue(user.id, course, enrollment.completedAt).catch((err) => {
            this.logger.warn(`Certificat non délivré : ${(err as Error).message}`);
            return null;
          })
        : await this.certificates.findForCourse(user.id, course.id);

    return {
      mode: access.mode,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        image: course.image,
        instructor: course.instructor,
        instructorRole: course.instructorRole,
        instructorImg: course.instructorImg,
        level: course.level,
        format: course.format,
        duration: course.duration,
        status: course.status,
      },
      enrollment: enrollment ? this.presentEnrollment(enrollment) : null,
      certificate: certificate ? this.certificates.present(certificate) : null,
      modules: modules
        .map((module) => ({
          id: module.id,
          title: module.title,
          description: module.description,
          lessons: lessons.filter((l) => l.moduleId === module.id).map((l) => this.presentLesson(l, files, byLesson.get(l.id))),
        }))
        .filter((module) => preview || module.lessons.length > 0),
      stats: { totalLessons: published.length, completedLessons: completed, progress: percent(completed, published.length) },
    };
  }

  /** Leçon ouverte : point de reprise de la formation. */
  async view(user: User, courseId: string, lessonId: string) {
    const { access } = await this.lessonContext(user, courseId, lessonId);
    if (access.mode === 'learner') {
      await this.enrollments.update(access.enrollment.id, { lastLessonId: lessonId, lastActivityAt: new Date() });
    }
    return { ok: true };
  }

  /** Leçon texte, vidéo ou PDF marquée comme terminée par l'apprenant. */
  async complete(user: User, courseId: string, lessonId: string) {
    const { course, lesson, access } = await this.lessonContext(user, courseId, lessonId);
    if (access.mode === 'preview') throw new BadRequestException("Aperçu administrateur : la progression n'est pas enregistrée.");
    if (lesson.type === 'quiz') throw new BadRequestException('Ce quiz se valide en obtenant le score minimal.');

    const row = (await this.progress.findOne({ where: { userId: user.id, lessonId } })) ?? this.progress.create({ userId: user.id, lessonId, courseId });
    if (!row.completedAt) {
      row.completedAt = new Date();
      await this.progress.save(row);
    }
    const summary = await this.recordActivity(user, course, access.enrollment, lessonId);
    return { lesson: { id: lesson.id, completed: true, completedAt: row.completedAt, bestScore: row.bestScore, attempts: row.attempts }, ...summary };
  }

  /** Correction du quiz côté serveur ; les bonnes réponses ne sont révélées qu'une fois le quiz réussi. */
  async submitQuiz(user: User, courseId: string, lessonId: string, answers: number[]) {
    const { course, lesson, access } = await this.lessonContext(user, courseId, lessonId);
    const questions = lesson.quiz?.questions ?? [];
    if (lesson.type !== 'quiz' || questions.length === 0) throw new BadRequestException('Cette leçon ne contient pas de quiz.');
    if (answers.length !== questions.length || answers.some((a) => a < 0)) {
      throw new BadRequestException('Répondez à toutes les questions avant de valider.');
    }
    this.rateLimiter.hit(`academy-quiz:${user.id}:${lessonId}`, 20, 10 * 60_000, 'Trop de tentatives sur ce quiz. Réessayez dans quelques minutes.');

    const correctCount = questions.filter((q, i) => answers[i] === q.answer).length;
    const score = percent(correctCount, questions.length);
    const passingScore = lesson.quiz!.passingScore;
    const passed = score >= passingScore;
    const result = {
      score,
      passed,
      passingScore,
      correctCount,
      total: questions.length,
      results: questions.map((q, i) => ({
        questionId: q.id,
        selected: answers[i],
        correct: answers[i] === q.answer,
        answer: passed ? q.answer : null,
        explanation: passed ? q.explanation : null,
      })),
    };
    if (access.mode === 'preview') return { ...result, recorded: false };

    const row = (await this.progress.findOne({ where: { userId: user.id, lessonId } })) ?? this.progress.create({ userId: user.id, lessonId, courseId, attempts: 0 });
    row.attempts += 1;
    row.bestScore = Math.max(row.bestScore ?? 0, score);
    if (passed && !row.completedAt) row.completedAt = new Date();
    await this.progress.save(row);
    const summary = await this.recordActivity(user, course, access.enrollment, lessonId);
    return {
      ...result,
      recorded: true,
      lesson: { id: lesson.id, completed: Boolean(row.completedAt), completedAt: row.completedAt, bestScore: row.bestScore, attempts: row.attempts },
      ...summary,
    };
  }

  // --- Fichiers --------------------------------------------------------------

  /** Couverture : publique. Support de leçon : réservé aux membres ayant accès à la formation (et aux administrateurs). */
  async file(id: string, viewer: User | null) {
    const file = await this.files.findOne({ where: { id } });
    if (!file) throw new NotFoundException('Fichier introuvable.');
    if (file.purpose === 'lesson' && viewer?.role !== 'admin') {
      if (!viewer) throw new UnauthorizedException('Veuillez vous connecter pour continuer.');
      const lessons = await this.lessons
        .createQueryBuilder('l')
        .where('l.published = true')
        .andWhere('(l.fileId = :id OR l.resources @> :support::jsonb)', { id, support: JSON.stringify([{ fileId: id }]) })
        .getMany();
      let allowed = false;
      for (const courseId of new Set(lessons.map((l) => l.courseId))) {
        const course = await this.courses.findOne({ where: { id: courseId } });
        if (course && (await this.access(viewer, course).then((a) => a.mode === 'learner').catch(() => false))) {
          allowed = true;
          break;
        }
      }
      if (!allowed) throw new NotFoundException('Fichier introuvable.');
    }
    return { path: join(ACADEMY_FILES_DIR, file.storagePath), mime: file.mime, name: file.originalName };
  }

  /** Supports présentés au lecteur : nom, taille et type des fichiers ; les fichiers disparus sont ignorés. */
  presentResources(lesson: Lesson, files: Map<string, AcademyFile>) {
    type Presented = { id: string; kind: 'file' | 'link'; title: string; url: string | null; file: { id: string; name: string; mime: string; size: number } | null };
    return (lesson.resources ?? []).flatMap((r): Presented[] => {
      if (r.kind === 'link') return [{ id: r.id, kind: 'link', title: r.title, url: r.url ?? null, file: null }];
      const file = r.fileId ? files.get(r.fileId) : undefined;
      return file ? [{ id: r.id, kind: 'file', title: r.title, url: null, file: { id: file.id, name: file.originalName, mime: file.mime, size: file.size } }] : [];
    });
  }

  // --- Notes personnelles ------------------------------------------------------

  /** Notes du membre sur une formation (toutes leçons), triées par leçon puis par instant de la vidéo. */
  async listNotes(user: User, courseId: string) {
    await this.access(user, await this.findCourse(courseId));
    const notes = await this.notes.find({ where: { userId: user.id, courseId }, order: { seconds: 'ASC', createdAt: 'ASC' } });
    return notes.map((n) => this.presentNote(n));
  }

  async addNote(user: User, courseId: string, lessonId: string, input: { seconds?: number | null; text: string }) {
    await this.lessonContext(user, courseId, lessonId);
    this.rateLimiter.hit(`academy-note:${user.id}`, 300, 60 * 60_000, 'Trop de notes en une heure : réessayez plus tard.');
    if ((await this.notes.count({ where: { userId: user.id, lessonId } })) >= 300) {
      throw new BadRequestException('300 notes maximum par leçon.');
    }
    const note = await this.notes.save(
      this.notes.create({ userId: user.id, courseId, lessonId, seconds: input.seconds ?? null, text: input.text.trim().slice(0, 2000) }),
    );
    return this.presentNote(note);
  }

  async updateNote(user: User, id: string, input: { seconds?: number | null; text?: string }) {
    const note = await this.notes.findOne({ where: { id, userId: user.id } });
    if (!note) throw new NotFoundException('Note introuvable.');
    if (input.text !== undefined) note.text = input.text.trim().slice(0, 2000);
    if (input.seconds !== undefined) note.seconds = input.seconds;
    return this.presentNote(await this.notes.save(note));
  }

  async deleteNote(user: User, id: string) {
    const result = await this.notes.delete({ id, userId: user.id });
    if (!result.affected) throw new NotFoundException('Note introuvable.');
    return { deleted: true };
  }

  private presentNote(note: LessonNote) {
    return { id: note.id, lessonId: note.lessonId, seconds: note.seconds, text: note.text, createdAt: note.createdAt, updatedAt: note.updatedAt };
  }

  async filesById(ids: (string | null)[]) {
    const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
    const rows = unique.length ? await this.files.find({ where: { id: In(unique) } }) : [];
    return new Map(rows.map((file) => [file.id, file]));
  }

  // --- Progression -----------------------------------------------------------

  private async recordActivity(user: User, course: Course, enrollment: Enrollment, lessonId: string) {
    enrollment.lastLessonId = lessonId;
    enrollment.lastActivityAt = new Date();
    const { total, completed } = await this.counts(user.id, course.id);
    const saved = await this.applyProgress(user.id, course, enrollment, total, completed);
    await this.refreshPaths(user.id, course.id);
    return { progress: saved.progress, status: saved.status, completedLessons: completed, totalLessons: total } satisfies ProgressSummary;
  }

  /** Leçons publiées de la formation et leçons publiées terminées par le membre. */
  private async counts(userId: string, courseId: string) {
    const [total, completed] = await Promise.all([
      this.lessons.count({ where: { courseId, published: true } }),
      this.progress
        .createQueryBuilder('progress')
        .innerJoin('progress.lesson', 'lesson')
        .where('progress.userId = :userId', { userId })
        .andWhere('progress.courseId = :courseId', { courseId })
        .andWhere('progress.completedAt IS NOT NULL')
        .andWhere('lesson.published = true')
        .getCount(),
    ]);
    return { total, completed };
  }

  private async applyProgress(userId: string, course: Course, enrollment: Enrollment, total: number, completed: number) {
    const done = total > 0 && completed >= total;
    const firstCompletion = done && !enrollment.completedAt;
    enrollment.progress = percent(completed, total);
    enrollment.status = done ? 'completed' : 'active';
    if (firstCompletion) enrollment.completedAt = new Date();
    const saved = await this.enrollments.save(enrollment);
    if (done) {
      // Un échec de délivrance ne bloque pas la progression : le certificat sera délivré à la prochaine ouverture.
      await this.certificates.issue(userId, course, saved.completedAt).catch((err) => this.logger.warn(`Certificat non délivré : ${(err as Error).message}`));
    }
    if (firstCompletion) {
      await this.notifications.notify(
        { id: userId } as User,
        'Formation terminée 🎓',
        `Félicitations : vous avez terminé « ${course.title} » (${total} leçon${total > 1 ? 's' : ''}). Votre certificat de réussite est disponible dans votre espace.`,
        'academy',
        `dashboard/academy/${course.id}`,
      );
    }
    return saved;
  }

  /** Certificat PDF du titulaire ; délivré a posteriori si toutes les leçons publiées sont terminées. */
  async certificatePdf(user: User, courseId: string) {
    let certificate = await this.certificates.findForCourse(user.id, courseId);
    if (!certificate) {
      const course = await this.findCourse(courseId);
      const enrollment = await this.enrollments.findOne({ where: { user: { id: user.id }, itemType: 'course', itemId: courseId } });
      const { total, completed } = await this.counts(user.id, courseId);
      if (!enrollment || total === 0 || completed < total) {
        throw new NotFoundException('Terminez toutes les leçons de la formation pour obtenir votre certificat.');
      }
      certificate = await this.certificates.issue(user.id, course, enrollment.completedAt);
    }
    if (certificate.status === 'revoked') throw new ForbiddenException("Ce certificat a été révoqué par l'équipe QIAO Academy.");
    return this.certificates.render(certificate);
  }

  /** Progression des parcours du membre qui contiennent la formation : moyenne de leurs formations. */
  private async refreshPaths(userId: string, courseId: string | null) {
    const pathEnrollments = await this.enrollments.find({ where: { user: { id: userId }, itemType: 'path' } });
    if (pathEnrollments.length === 0) return;
    const paths = await this.paths.find({ where: { id: In(pathEnrollments.map((e) => e.itemId)) } });
    for (const enrollment of pathEnrollments) {
      const path = paths.find((p) => p.id === enrollment.itemId);
      const courseIds = path?.courseIds ?? [];
      if (!path || courseIds.length === 0 || (courseId && !courseIds.includes(courseId))) continue;
      const courseEnrollments = await this.enrollments.find({ where: { user: { id: userId }, itemType: 'course', itemId: In(courseIds) } });
      const progress = Math.round(courseIds.reduce((sum, id) => sum + (courseEnrollments.find((e) => e.itemId === id)?.progress ?? 0), 0) / courseIds.length);
      const done = courseIds.every((id) => courseEnrollments.find((e) => e.itemId === id)?.status === 'completed');
      const firstCompletion = done && !enrollment.completedAt;
      if (enrollment.progress === progress && (enrollment.status === 'completed') === done) continue;
      enrollment.progress = progress;
      enrollment.status = done ? 'completed' : 'active';
      enrollment.lastActivityAt = new Date();
      if (firstCompletion) enrollment.completedAt = new Date();
      await this.enrollments.save(enrollment);
      if (firstCompletion) {
        await this.notifications.notify(
          { id: userId } as User,
          'Parcours terminé 🎓',
          `Félicitations : vous avez terminé les ${courseIds.length} formations du parcours « ${path.title} ».`,
          'academy',
          'dashboard/academy',
        );
      }
    }
  }

  /** Après une modification du programme : progression de tous les inscrits de la formation recalculée. */
  async recomputeCourse(courseId: string) {
    const course = await this.courses.findOne({ where: { id: courseId } });
    if (!course) return;
    const enrollments = await this.enrollments.find({ where: { itemType: 'course', itemId: courseId }, relations: { user: true } });
    if (enrollments.length === 0) return;
    const total = await this.lessons.count({ where: { courseId, published: true } });
    const rows: { userId: string; count: string }[] = await this.progress
      .createQueryBuilder('progress')
      .innerJoin('progress.lesson', 'lesson')
      .select('progress.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .where('progress.courseId = :courseId', { courseId })
      .andWhere('progress.completedAt IS NOT NULL')
      .andWhere('lesson.published = true')
      .groupBy('progress.userId')
      .getRawMany();
    for (const enrollment of enrollments) {
      if (!enrollment.user) continue;
      const completed = Number(rows.find((r) => r.userId === enrollment.user.id)?.count ?? 0);
      const done = total > 0 && completed >= total;
      if (enrollment.progress === percent(completed, total) && (enrollment.status === 'completed') === done) continue;
      await this.applyProgress(enrollment.user.id, course, enrollment, total, completed);
      await this.refreshPaths(enrollment.user.id, courseId);
    }
  }

  /** Progression des inscrits d'un parcours (après modification de ses formations). */
  async recomputePath(pathId: string) {
    const enrollments = await this.enrollments.find({ where: { itemType: 'path', itemId: pathId }, relations: { user: true } });
    for (const enrollment of enrollments) {
      if (enrollment.user) await this.refreshPaths(enrollment.user.id, null);
    }
  }

  // --- Suivi des inscrits (administration) -------------------------------------

  /** Inscrits d'une formation, avec leur progression leçon par leçon et leurs scores aux quiz. */
  async courseLearners(courseId: string) {
    const course = await this.findCourse(courseId);
    const [modules, lessons, enrollments, rows, paths, certificates] = await Promise.all([
      this.modules.find({ where: { courseId }, order: { sortOrder: 'ASC', createdAt: 'ASC' } }),
      this.lessons.find({ where: { courseId, published: true }, order: { sortOrder: 'ASC', createdAt: 'ASC' } }),
      this.enrollments.find({ where: { itemType: 'course', itemId: courseId }, relations: { user: true }, order: { createdAt: 'ASC' } }),
      this.progress.find({ where: { courseId } }),
      this.paths.find(),
      this.certificates.forCourse(courseId),
    ]);
    const containing = paths.filter((p) => (p.courseIds ?? []).includes(courseId));
    const pathEnrollments = containing.length
      ? await this.enrollments.find({ where: { itemType: 'path', itemId: In(containing.map((p) => p.id)) }, relations: { user: true } })
      : [];
    const ordered = modules.flatMap((module) =>
      lessons.filter((l) => l.moduleId === module.id).map((l) => ({ id: l.id, title: l.title, type: l.type, moduleTitle: module.title })),
    );
    const lessonIds = new Set(ordered.map((l) => l.id));
    const member = (user: User) => ({ id: user.id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl, company: user.company });
    const pathTitle = (id: string | null) => (id ? (paths.find((p) => p.id === id)?.title ?? null) : null);

    const learners = enrollments
      .filter((e) => e.user)
      .map((e) => {
        const mine = rows.filter((r) => r.userId === e.user.id && lessonIds.has(r.lessonId));
        return {
          enrollmentId: e.id,
          user: member(e.user),
          source: e.source,
          viaPath: pathTitle(e.viaPathId),
          started: true,
          enrolledAt: e.createdAt,
          progress: e.progress,
          status: e.status,
          lastActivityAt: e.lastActivityAt,
          completedAt: e.completedAt,
          completedLessons: mine.filter((r) => r.completedAt).length,
          lessons: Object.fromEntries(mine.map((r) => [r.lessonId, { completedAt: r.completedAt, bestScore: r.bestScore, attempts: r.attempts }])),
          certificate: certificates.get(e.user.id) ?? null,
        };
      });
    const known = new Set(learners.map((l) => l.user.id));
    for (const e of pathEnrollments) {
      if (!e.user || known.has(e.user.id)) continue;
      known.add(e.user.id);
      learners.push({
        enrollmentId: e.id,
        user: member(e.user),
        source: 'path',
        viaPath: pathTitle(e.itemId),
        started: false,
        enrolledAt: e.createdAt,
        progress: 0,
        status: 'active',
        lastActivityAt: null,
        completedAt: null,
        completedLessons: 0,
        lessons: {},
        certificate: certificates.get(e.user.id) ?? null,
      });
    }

    const started = learners.filter((l) => l.started);
    return {
      course: { id: course.id, title: course.title, status: course.status },
      lessons: ordered,
      learners,
      summary: {
        learners: learners.length,
        completions: learners.filter((l) => l.status === 'completed').length,
        averageProgress: learners.length ? Math.round(learners.reduce((sum, l) => sum + l.progress, 0) / learners.length) : 0,
        notStarted: learners.length - started.length,
      },
    };
  }

  // --- Présentation ------------------------------------------------------------

  presentEnrollment(e: Enrollment) {
    return {
      id: e.id,
      progress: e.progress,
      status: e.status,
      source: e.source,
      lastLessonId: e.lastLessonId,
      lastActivityAt: e.lastActivityAt,
      completedAt: e.completedAt,
      createdAt: e.createdAt,
    };
  }

  private presentLesson(lesson: Lesson, files: Map<string, AcademyFile>, row?: LessonProgress) {
    const file = lesson.fileId ? files.get(lesson.fileId) : undefined;
    return {
      id: lesson.id,
      moduleId: lesson.moduleId,
      title: lesson.title,
      type: lesson.type,
      durationMinutes: lesson.durationMinutes,
      published: lesson.published,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      file: file ? { id: file.id, name: file.originalName, mime: file.mime, size: file.size } : null,
      resources: this.presentResources(lesson, files),
      quiz: lesson.quiz
        ? { passingScore: lesson.quiz.passingScore, questions: lesson.quiz.questions.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options })) }
        : null,
      completed: Boolean(row?.completedAt),
      completedAt: row?.completedAt ?? null,
      bestScore: row?.bestScore ?? null,
      attempts: row?.attempts ?? 0,
    };
  }
}
