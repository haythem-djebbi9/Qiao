import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { Brackets, In, Repository } from 'typeorm';
import { normalize, slugify } from '../../common/text';
import { ALLOWED_FILES } from '../community/posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService, RateLimiter } from '../platform/platform.services';
import { User } from '../users/user.entity';
import {
  AcademyAuditQueryDto,
  AdminCoursesQueryDto,
  CourseDto,
  DomainDto,
  GrantEnrollmentDto,
  LearnersQueryDto,
  LessonDto,
  ModuleDto,
  PathDto,
  PricesDto,
  UpdateCourseDto,
  UpdateDomainDto,
  UpdateLessonDto,
  UpdateModuleDto,
  UpdatePathDto,
} from './academy-admin.dto';
import {
  AcademyFile,
  CartItem,
  Course,
  CourseModule,
  Enrollment,
  LearningPath,
  Lesson,
  LessonQuiz,
  LessonResource,
  LessonType,
  Order,
  PublicationStatus,
  TrainingDomain,
} from './academy.entities';
import { ACADEMY_FILES_DIR, LearningService } from './learning.service';

type Admin = Pick<User, 'id' | 'fullName'>;

const IMG = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const DEFAULT_COURSE_IMAGE = IMG('photo-1503676260728-1c00da094a0b');
/** Sans photo : les initiales du formateur sont affichées. */
const DEFAULT_INSTRUCTOR_IMAGE = '';

export const MAX_ACADEMY_UPLOAD = 60 * 1024 * 1024;
const MAX_COVER_SIZE = 5 * 1024 * 1024;
const MAX_PDF_SIZE = 20 * 1024 * 1024;

/** Vidéos de leçons acceptées, vérifiées par leur signature binaire (« ftyp » à l'octet 4 pour le MP4). */
const VIDEO_FILES: Record<string, { ext: string[]; offset: number; magic: number[] }> = {
  'video/mp4': { ext: ['.mp4', '.m4v'], offset: 4, magic: [0x66, 0x74, 0x79, 0x70] },
  'video/webm': { ext: ['.webm'], offset: 0, magic: [0x1a, 0x45, 0xdf, 0xa3] },
};
const COVER_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
/** Supports téléchargeables d'une leçon (vérifiés par extension et signature binaire). */
const RESOURCE_FILES: Record<string, { ext: string[]; magic?: number[][] }> = {
  ...Object.fromEntries(Object.entries(ALLOWED_FILES).map(([mime, rule]) => [mime, { ext: rule.ext, magic: rule.magic }])),
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: ['.pptx'], magic: [[0x50, 0x4b, 0x03, 0x04]] },
};
const MAX_RESOURCE_SIZE = 25 * 1024 * 1024;

const STATUS_ACTIONS: Record<PublicationStatus, string> = { published: 'publish', draft: 'unpublish', archived: 'archive' };

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const clean = (value: string | null | undefined) => (value ?? '').trim() || null;

/** Administration de QIAO Academy : catalogue, contenu pédagogique, tarifs et inscrits. Chaque action est journalisée. */
@Injectable()
export class AcademyAdminService {
  constructor(
    @InjectRepository(TrainingDomain) private readonly domains: Repository<TrainingDomain>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(LearningPath) private readonly paths: Repository<LearningPath>,
    @InjectRepository(CourseModule) private readonly modules: Repository<CourseModule>,
    @InjectRepository(Lesson) private readonly lessons: Repository<Lesson>,
    @InjectRepository(AcademyFile) private readonly files: Repository<AcademyFile>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(CartItem) private readonly cart: Repository<CartItem>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly learning: LearningService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly rateLimiter: RateLimiter,
  ) {}

  // ==========================================================================
  // Vue d'ensemble
  // ==========================================================================

  async overview() {
    const byStatus = async (repo: Repository<Course> | Repository<LearningPath> | Repository<TrainingDomain>) => {
      const rows: { status: PublicationStatus; count: string }[] = await (repo as Repository<Course>)
        .createQueryBuilder('item')
        .select('item.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('item.status')
        .getRawMany();
      const counts = { draft: 0, published: 0, archived: 0, total: 0 };
      for (const row of rows) {
        counts[row.status] = Number(row.count);
        counts.total += Number(row.count);
      }
      return counts;
    };
    const [courses, paths, domains, totals, lessons] = await Promise.all([
      byStatus(this.courses),
      byStatus(this.paths),
      byStatus(this.domains),
      this.enrollments
        .createQueryBuilder('e')
        .select('COUNT(*)', 'enrollments')
        .addSelect('COUNT(DISTINCT "e"."userId")', 'learners')
        .addSelect(`SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END)`, 'completions')
        .addSelect('COALESCE(ROUND(AVG(e.progress)), 0)', 'averageProgress')
        .where(`e.itemType = 'course'`)
        .getRawOne<{ enrollments: string; learners: string; completions: string | null; averageProgress: string }>(),
      this.lessons.count(),
    ]);
    return {
      courses,
      paths,
      domains,
      lessons,
      enrollments: Number(totals?.enrollments ?? 0),
      learners: Number(totals?.learners ?? 0),
      completions: Number(totals?.completions ?? 0),
      averageProgress: Number(totals?.averageProgress ?? 0),
    };
  }

  // ==========================================================================
  // Formations
  // ==========================================================================

  async listCourses(query: AdminCoursesQueryDto) {
    const all = await this.courses.find({ order: { updatedAt: 'DESC' } });
    const items = all.filter(
      (c) =>
        (!query.status || query.status === 'all' || c.status === query.status) &&
        (!query.q || normalize(`${c.title} ${c.instructor} ${c.id}`).includes(normalize(query.q))),
    );
    const stats = await this.courseStats(items.map((c) => c.id));
    const domains = await this.domains.find();
    return items.map((course) => ({
      ...course,
      trainingDomainTitle: domains.find((d) => d.id === course.trainingDomainId)?.title ?? null,
      stats: stats.get(course.id) ?? { modules: 0, lessons: 0, publishedLessons: 0, learners: 0, completions: 0, averageProgress: 0 },
    }));
  }

  private async courseStats(ids: string[]) {
    const stats = new Map<string, { modules: number; lessons: number; publishedLessons: number; learners: number; completions: number; averageProgress: number }>();
    if (ids.length === 0) return stats;
    const [modules, lessons, enrollments] = await Promise.all([
      this.modules
        .createQueryBuilder('m')
        .select('m.courseId', 'courseId')
        .addSelect('COUNT(*)', 'count')
        .where('m.courseId IN (:...ids)', { ids })
        .groupBy('m.courseId')
        .getRawMany<{ courseId: string; count: string }>(),
      this.lessons
        .createQueryBuilder('l')
        .select('l.courseId', 'courseId')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(CASE WHEN l.published THEN 1 ELSE 0 END)', 'published')
        .where('l.courseId IN (:...ids)', { ids })
        .groupBy('l.courseId')
        .getRawMany<{ courseId: string; count: string; published: string }>(),
      this.enrollments
        .createQueryBuilder('e')
        .select('e.itemId', 'courseId')
        .addSelect('COUNT(*)', 'count')
        .addSelect(`SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END)`, 'completions')
        .addSelect('ROUND(AVG(e.progress))', 'average')
        .where(`e.itemType = 'course'`)
        .andWhere('e.itemId IN (:...ids)', { ids })
        .groupBy('e.itemId')
        .getRawMany<{ courseId: string; count: string; completions: string; average: string }>(),
    ]);
    for (const id of ids) {
      const l = lessons.find((row) => row.courseId === id);
      const e = enrollments.find((row) => row.courseId === id);
      stats.set(id, {
        modules: Number(modules.find((row) => row.courseId === id)?.count ?? 0),
        lessons: Number(l?.count ?? 0),
        publishedLessons: Number(l?.published ?? 0),
        learners: Number(e?.count ?? 0),
        completions: Number(e?.completions ?? 0),
        averageProgress: Number(e?.average ?? 0),
      });
    }
    return stats;
  }

  /** Formation et programme complet (réponses des quiz comprises) pour l'éditeur. */
  async getCourse(id: string) {
    const course = await this.findCourse(id);
    const [modules, lessons, stats, paths] = await Promise.all([
      this.modules.find({ where: { courseId: id }, order: { sortOrder: 'ASC', createdAt: 'ASC' } }),
      this.lessons.find({ where: { courseId: id }, order: { sortOrder: 'ASC', createdAt: 'ASC' } }),
      this.courseStats([id]),
      this.paths.find(),
    ]);
    const files = await this.learning.filesById(lessons.flatMap((l) => [l.fileId, ...(l.resources ?? []).map((r) => r.fileId ?? null)]));
    return {
      ...course,
      stats: stats.get(id),
      paths: paths.filter((p) => (p.courseIds ?? []).includes(id)).map((p) => ({ id: p.id, title: p.title })),
      curriculum: modules.map((module) => ({
        ...module,
        lessons: lessons
          .filter((l) => l.moduleId === module.id)
          .map((l) => {
            const file = l.fileId ? files.get(l.fileId) : undefined;
            return { ...l, file: file ? { id: file.id, name: file.originalName, mime: file.mime, size: file.size } : null, resources: this.learning.presentResources(l, files) };
          }),
      })),
    };
  }

  async createCourse(admin: Admin, dto: CourseDto) {
    await this.assertDomain(dto.trainingDomainId);
    const id = await this.uniqueId(this.courses, slugify(dto.title).slice(0, 70) || 'formation');
    const last = await this.courses.createQueryBuilder('c').select('MAX(c.sortOrder)', 'max').getRawOne<{ max: number | null }>();
    const course = await this.courses.save(
      this.courses.create({
        id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        instructor: dto.instructor.trim(),
        instructorRole: clean(dto.instructorRole),
        instructorImg: clean(dto.instructorImg) ?? DEFAULT_INSTRUCTOR_IMAGE,
        image: clean(dto.image) ?? DEFAULT_COURSE_IMAGE,
        price: dto.price,
        durationMinutes: dto.durationMinutes,
        duration: clean(dto.duration) ?? formatMinutes(dto.durationMinutes),
        domain: dto.domain,
        level: dto.level,
        format: dto.format,
        badge: clean(dto.badge),
        badgeColor: clean(dto.badge) ? (dto.badgeColor ?? 'bg-red-600') : null,
        sections: dto.sections?.length ? dto.sections : null,
        trainingDomainId: clean(dto.trainingDomainId),
        sortOrder: dto.sortOrder ?? Number(last?.max ?? 0) + 1,
        rating: 0,
        reviewsCount: 0,
        modules: [],
        status: 'draft',
        publishedAt: null,
      }),
    );
    await this.audit.log(admin, 'academy.course.create', { type: 'academy_course', id: course.id, label: course.title }, { price: course.price });
    return this.getCourse(course.id);
  }

  async updateCourse(admin: Admin, id: string, dto: UpdateCourseDto) {
    const course = await this.findCourse(id);
    if (dto.trainingDomainId !== undefined) await this.assertDomain(dto.trainingDomainId);
    const before = { ...course };
    const patch: Partial<Course> = {};
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.description !== undefined) patch.description = dto.description.trim();
    if (dto.instructor !== undefined) patch.instructor = dto.instructor.trim();
    if (dto.instructorRole !== undefined) patch.instructorRole = clean(dto.instructorRole);
    if (dto.instructorImg !== undefined) patch.instructorImg = clean(dto.instructorImg) ?? DEFAULT_INSTRUCTOR_IMAGE;
    if (dto.image !== undefined) patch.image = clean(dto.image) ?? DEFAULT_COURSE_IMAGE;
    if (dto.price !== undefined) patch.price = dto.price;
    if (dto.durationMinutes !== undefined) patch.durationMinutes = dto.durationMinutes;
    if (dto.duration !== undefined || dto.durationMinutes !== undefined) {
      // Libellé vide : calculé depuis la durée en minutes.
      const label = dto.duration !== undefined ? clean(dto.duration) : course.duration;
      patch.duration = label ?? formatMinutes(dto.durationMinutes ?? course.durationMinutes);
    }
    if (dto.domain !== undefined) patch.domain = dto.domain;
    if (dto.level !== undefined) patch.level = dto.level;
    if (dto.format !== undefined) patch.format = dto.format;
    if (dto.badge !== undefined) {
      patch.badge = clean(dto.badge);
      patch.badgeColor = patch.badge ? (dto.badgeColor ?? course.badgeColor ?? 'bg-red-600') : null;
    } else if (dto.badgeColor !== undefined && course.badge) {
      patch.badgeColor = dto.badgeColor;
    }
    if (dto.sections !== undefined) patch.sections = dto.sections.length ? dto.sections : null;
    if (dto.trainingDomainId !== undefined) patch.trainingDomainId = clean(dto.trainingDomainId);
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;

    const fields = Object.keys(patch).filter((key) => JSON.stringify(patch[key as keyof Course]) !== JSON.stringify(before[key as keyof Course]));
    if (fields.length === 0) return this.getCourse(id);
    await this.courses.update(id, patch);
    if (patch.title || patch.image) {
      await this.enrollments.update({ itemType: 'course', itemId: id }, { title: patch.title ?? course.title, image: patch.image ?? course.image });
    }
    await this.audit.log(
      admin,
      'academy.course.update',
      { type: 'academy_course', id, label: patch.title ?? course.title },
      { fields, ...(fields.includes('price') ? { price: { from: before.price, to: patch.price } } : {}) },
    );
    return this.getCourse(id);
  }

  async setCourseStatus(admin: Admin, id: string, status: PublicationStatus) {
    const course = await this.findCourse(id);
    if (course.status === status) return this.getCourse(id);
    if (status === 'published') {
      const published = await this.lessons.count({ where: { courseId: id, published: true } });
      if (published === 0) throw new BadRequestException('Ajoutez au moins une leçon publiée avant de publier la formation.');
      if (course.trainingDomainId) {
        const domain = await this.domains.findOne({ where: { id: course.trainingDomainId } });
        if (domain && domain.status !== 'published') {
          throw new BadRequestException(`Le domaine « ${domain.title} » n'est pas publié : la formation n'y serait pas visible.`);
        }
      }
    }
    await this.courses.update(id, { status, ...(status === 'published' && !course.publishedAt ? { publishedAt: new Date() } : {}) });
    await this.audit.log(admin, `academy.course.${STATUS_ACTIONS[status]}`, { type: 'academy_course', id, label: course.title }, { from: course.status, to: status });
    return this.getCourse(id);
  }

  async deleteCourse(admin: Admin, id: string) {
    const course = await this.findCourse(id);
    if (await this.enrollments.exist({ where: { itemType: 'course', itemId: id } })) {
      throw new ConflictException('Des membres sont inscrits à cette formation : archivez-la plutôt que de la supprimer.');
    }
    await this.assertNoPendingOrder('course', id);
    const path = (await this.paths.find()).find((p) => (p.courseIds ?? []).includes(id));
    if (path) throw new ConflictException(`Cette formation fait partie du parcours « ${path.title} » : retirez-la du parcours d'abord.`);
    await this.cart.delete({ itemType: 'course', itemId: id });
    await this.courses.delete(id);
    await this.audit.log(admin, 'academy.course.delete', { type: 'academy_course', id, label: course.title });
    return { deleted: true };
  }

  /** Transforme l'ancien programme (liste de titres) en modules à compléter de leçons. */
  async importSyllabus(admin: Admin, id: string) {
    const course = await this.findCourse(id);
    if (await this.modules.exist({ where: { courseId: id } })) throw new BadRequestException('Le programme contient déjà des modules.');
    const titles = (course.modules ?? []).map((t) => t.trim()).filter(Boolean);
    if (titles.length === 0) throw new BadRequestException("Cette formation n'a pas de programme à importer.");
    await this.modules.save(titles.map((title, index) => this.modules.create({ courseId: id, title: title.slice(0, 200), sortOrder: index })));
    await this.audit.log(admin, 'academy.module.import', { type: 'academy_course', id, label: course.title }, { modules: titles.length });
    return this.getCourse(id);
  }

  // ==========================================================================
  // Modules et leçons
  // ==========================================================================

  async addModule(admin: Admin, courseId: string, dto: ModuleDto) {
    const course = await this.findCourse(courseId);
    const count = await this.modules.count({ where: { courseId } });
    const module = await this.modules.save(
      this.modules.create({ courseId, title: dto.title.trim(), description: clean(dto.description), sortOrder: count }),
    );
    await this.syncSyllabus(courseId);
    await this.audit.log(admin, 'academy.module.create', { type: 'academy_module', id: module.id, label: module.title }, { courseId: course.id });
    return this.getCourse(courseId);
  }

  async updateModule(admin: Admin, id: string, dto: UpdateModuleDto) {
    const module = await this.findModule(id);
    if (dto.title !== undefined) module.title = dto.title.trim();
    if (dto.description !== undefined) module.description = clean(dto.description);
    await this.modules.save(module);
    await this.syncSyllabus(module.courseId);
    await this.audit.log(admin, 'academy.module.update', { type: 'academy_module', id, label: module.title }, { courseId: module.courseId });
    return this.getCourse(module.courseId);
  }

  async deleteModule(admin: Admin, id: string) {
    const module = await this.findModule(id);
    const lessons = await this.lessons.count({ where: { moduleId: id } });
    await this.modules.delete(id);
    await this.syncSyllabus(module.courseId);
    await this.learning.recomputeCourse(module.courseId);
    await this.audit.log(admin, 'academy.module.delete', { type: 'academy_module', id, label: module.title }, { courseId: module.courseId, lessons });
    return this.getCourse(module.courseId);
  }

  async reorderModules(admin: Admin, courseId: string, ids: string[]) {
    await this.findCourse(courseId);
    const modules = await this.modules.find({ where: { courseId } });
    this.assertSameSet(modules.map((m) => m.id), ids);
    await Promise.all(ids.map((id, index) => this.modules.update(id, { sortOrder: index })));
    await this.syncSyllabus(courseId);
    await this.audit.log(admin, 'academy.module.reorder', { type: 'academy_course', id: courseId });
    return this.getCourse(courseId);
  }

  async addLesson(admin: Admin, moduleId: string, dto: LessonDto) {
    const module = await this.findModule(moduleId);
    const fields = await this.lessonFields(dto.type, dto);
    const count = await this.lessons.count({ where: { moduleId } });
    const lesson = await this.lessons.save(
      this.lessons.create({
        moduleId,
        courseId: module.courseId,
        title: dto.title.trim(),
        type: dto.type,
        ...fields,
        durationMinutes: dto.durationMinutes,
        published: dto.published ?? true,
        sortOrder: count,
        resources: await this.resourceFields(dto.resources),
      }),
    );
    if (lesson.published) await this.learning.recomputeCourse(module.courseId);
    await this.audit.log(admin, 'academy.lesson.create', { type: 'academy_lesson', id: lesson.id, label: lesson.title }, { courseId: module.courseId, lessonType: lesson.type });
    return this.getCourse(module.courseId);
  }

  async updateLesson(admin: Admin, id: string, dto: UpdateLessonDto) {
    const lesson = await this.lessons.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Leçon introuvable.');
    const before = { ...lesson };
    if (dto.moduleId && dto.moduleId !== lesson.moduleId) {
      const target = await this.findModule(dto.moduleId);
      if (target.courseId !== lesson.courseId) throw new BadRequestException("Le module choisi n'appartient pas à cette formation.");
      lesson.moduleId = target.id;
      lesson.sortOrder = await this.lessons.count({ where: { moduleId: target.id } });
    }
    const type = dto.type ?? lesson.type;
    const fields = await this.lessonFields(type, {
      content: dto.content !== undefined ? dto.content : lesson.content,
      videoUrl: dto.videoUrl !== undefined ? dto.videoUrl : lesson.videoUrl,
      fileId: dto.fileId !== undefined ? dto.fileId : lesson.fileId,
      quiz: dto.quiz !== undefined ? dto.quiz : lesson.quiz,
    });
    Object.assign(lesson, fields, { type });
    if (dto.title !== undefined) lesson.title = dto.title.trim();
    if (dto.durationMinutes !== undefined) lesson.durationMinutes = dto.durationMinutes;
    if (dto.published !== undefined) lesson.published = dto.published;
    if (dto.resources !== undefined) lesson.resources = await this.resourceFields(dto.resources);
    await this.lessons.save(lesson);
    const changed = (['title', 'type', 'content', 'videoUrl', 'fileId', 'durationMinutes', 'published', 'quiz', 'moduleId', 'resources'] as const).filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(lesson[key]),
    );
    if (changed.includes('published') || changed.includes('type') || changed.includes('quiz')) await this.learning.recomputeCourse(lesson.courseId);
    await this.audit.log(admin, 'academy.lesson.update', { type: 'academy_lesson', id, label: lesson.title }, { courseId: lesson.courseId, fields: changed });
    return this.getCourse(lesson.courseId);
  }

  async deleteLesson(admin: Admin, id: string) {
    const lesson = await this.lessons.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Leçon introuvable.');
    await this.lessons.delete(id);
    await this.enrollments.update({ itemType: 'course', itemId: lesson.courseId, lastLessonId: id }, { lastLessonId: null });
    await this.learning.recomputeCourse(lesson.courseId);
    await this.audit.log(admin, 'academy.lesson.delete', { type: 'academy_lesson', id, label: lesson.title }, { courseId: lesson.courseId });
    return this.getCourse(lesson.courseId);
  }

  async reorderLessons(admin: Admin, moduleId: string, ids: string[]) {
    const module = await this.findModule(moduleId);
    const lessons = await this.lessons.find({ where: { moduleId } });
    this.assertSameSet(lessons.map((l) => l.id), ids);
    await Promise.all(ids.map((id, index) => this.lessons.update(id, { sortOrder: index })));
    await this.audit.log(admin, 'academy.lesson.reorder', { type: 'academy_module', id: moduleId, label: module.title }, { courseId: module.courseId });
    return this.getCourse(module.courseId);
  }

  /** Champs propres au type de leçon ; les autres sont vidés pour ne rien laisser d'incohérent. */
  private async lessonFields(
    type: LessonType,
    input: { content?: string | null; videoUrl?: string | null; fileId?: string | null; quiz?: LessonDto['quiz'] | LessonQuiz | null },
  ): Promise<Pick<Lesson, 'content' | 'videoUrl' | 'fileId' | 'quiz'>> {
    const content = clean(input.content);
    const videoUrl = clean(input.videoUrl);
    const fileId = clean(input.fileId);
    const file = fileId ? await this.files.findOne({ where: { id: fileId } }) : null;
    if (fileId && (!file || file.purpose !== 'lesson')) throw new BadRequestException('Fichier de leçon introuvable : téléversez-le à nouveau.');

    if (type === 'text') {
      if (!content) throw new BadRequestException('Rédigez le contenu de la leçon.');
      return { content, videoUrl: null, fileId: null, quiz: null };
    }
    if (type === 'video') {
      if (videoUrl && !/^https:\/\/\S+$/i.test(videoUrl)) throw new BadRequestException('Le lien de la vidéo doit commencer par https://.');
      if (file && !VIDEO_FILES[file.mime]) throw new BadRequestException('Le fichier joint doit être une vidéo MP4 ou WebM.');
      if (!videoUrl && !file) throw new BadRequestException('Indiquez le lien de la vidéo ou téléversez un fichier vidéo.');
      return { content, videoUrl: file ? null : videoUrl, fileId: file?.id ?? null, quiz: null };
    }
    if (type === 'pdf') {
      if (!file || file.mime !== 'application/pdf') throw new BadRequestException('Téléversez le document PDF de la leçon.');
      return { content, videoUrl: null, fileId: file.id, quiz: null };
    }
    const quiz = input.quiz;
    if (!quiz || quiz.questions.length === 0) throw new BadRequestException('Ajoutez au moins une question au quiz.');
    const questions = quiz.questions.map((q, index) => {
      const options = q.options.map((o) => o.trim()).filter(Boolean);
      if (options.length < 2) throw new BadRequestException(`La question ${index + 1} doit proposer au moins 2 réponses.`);
      if (q.answer < 0 || q.answer >= options.length) throw new BadRequestException(`Indiquez la bonne réponse de la question ${index + 1}.`);
      return { id: clean(q.id) ?? randomUUID().slice(0, 8), prompt: q.prompt.trim(), options, answer: q.answer, explanation: clean(q.explanation) };
    });
    return { content, videoUrl: null, fileId: null, quiz: { passingScore: quiz.passingScore, questions } };
  }

  /** Supports d'une leçon : fichiers de leçon existants ou liens https ; identifiants stables pour l'affichage. */
  private async resourceFields(input: LessonDto['resources']): Promise<LessonResource[] | null> {
    if (!input?.length) return null;
    const fileIds = input.filter((r) => r.kind === 'file').map((r) => r.fileId).filter((id): id is string => Boolean(id));
    const files = fileIds.length ? await this.files.find({ where: { id: In(fileIds) } }) : [];
    return input.map((r, index) => {
      const title = r.title.trim().slice(0, 200);
      const id = clean(r.id) ?? randomUUID().slice(0, 8);
      if (r.kind === 'file') {
        const file = files.find((f) => f.id === r.fileId);
        if (!file || file.purpose !== 'lesson') throw new BadRequestException(`Support ${index + 1} : fichier introuvable, téléversez-le à nouveau.`);
        return { id, kind: 'file' as const, title, fileId: file.id };
      }
      if (!r.url) throw new BadRequestException(`Support ${index + 1} : indiquez le lien.`);
      return { id, kind: 'link' as const, title, url: r.url.trim() };
    });
  }

  private async syncSyllabus(courseId: string) {
    const modules = await this.modules.find({ where: { courseId }, order: { sortOrder: 'ASC', createdAt: 'ASC' } });
    await this.courses.update(courseId, { modules: modules.map((m) => m.title) });
  }

  // ==========================================================================
  // Fichiers
  // ==========================================================================

  async upload(admin: Admin, requested: 'cover' | 'lesson' | 'resource', file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    this.rateLimiter.hit(`academy-upload:${admin.id}`, 60, 60 * 60_000);
    const ext = extname(file.originalname).toLowerCase();
    // Les supports sont des fichiers de leçon (protégés) : seul le contrôle du format diffère.
    const purpose: 'cover' | 'lesson' = requested === 'cover' ? 'cover' : 'lesson';
    const resource = requested === 'resource' ? RESOURCE_FILES[file.mimetype] : undefined;
    const image = COVER_MIMES.includes(file.mimetype) ? ALLOWED_FILES[file.mimetype] : undefined;
    const pdf = file.mimetype === 'application/pdf' ? ALLOWED_FILES[file.mimetype] : undefined;
    const video = VIDEO_FILES[file.mimetype];

    let kind: 'image' | 'pdf' | 'video' | 'file';
    if (requested === 'resource') {
      if (!resource || !resource.ext.includes(ext)) throw new BadRequestException('Format non accepté : PDF, Word, Excel, PowerPoint ou image.');
      if (file.size > MAX_RESOURCE_SIZE) throw new BadRequestException('Support trop volumineux (25 Mo maximum).');
      if (resource.magic && !resource.magic.some((sig) => sig.every((byte, i) => file.buffer[i] === byte))) {
        throw new BadRequestException('Le contenu du fichier ne correspond pas à son format.');
      }
      kind = file.mimetype === 'application/pdf' ? 'pdf' : 'file';
    } else if (purpose === 'cover') {
      if (!image || !image.ext.includes(ext)) throw new BadRequestException('Format non accepté : image JPG, PNG ou WEBP.');
      if (file.size > MAX_COVER_SIZE) throw new BadRequestException('Image trop volumineuse (5 Mo maximum).');
      if (image.magic && !image.magic.some((sig) => sig.every((byte, i) => file.buffer[i] === byte))) {
        throw new BadRequestException('Le contenu du fichier ne correspond pas à son format.');
      }
      kind = 'image';
    } else if (pdf && pdf.ext.includes(ext)) {
      if (file.size > MAX_PDF_SIZE) throw new BadRequestException('Document trop volumineux (20 Mo maximum).');
      if (pdf.magic && !pdf.magic.some((sig) => sig.every((byte, i) => file.buffer[i] === byte))) {
        throw new BadRequestException('Le contenu du fichier ne correspond pas à son format.');
      }
      kind = 'pdf';
    } else if (video && video.ext.includes(ext)) {
      if (!video.magic.every((byte, i) => file.buffer[video.offset + i] === byte)) {
        throw new BadRequestException('Le contenu du fichier ne correspond pas à son format.');
      }
      kind = 'video';
    } else {
      throw new BadRequestException('Format non accepté : document PDF ou vidéo MP4 / WebM.');
    }

    await fs.mkdir(ACADEMY_FILES_DIR, { recursive: true });
    const storageName = `${randomUUID()}${ext}`;
    await fs.writeFile(join(ACADEMY_FILES_DIR, storageName), file.buffer);
    const saved = await this.files.save(
      this.files.create({
        purpose,
        originalName: file.originalname.slice(0, 200),
        mime: file.mimetype,
        size: file.size,
        storagePath: storageName,
        uploadedById: admin.id,
      }),
    );
    await this.audit.log(admin, 'academy.file.upload', { type: 'academy_file', id: saved.id, label: saved.originalName }, { purpose: requested, mime: saved.mime, size: saved.size });
    return { id: saved.id, name: saved.originalName, mime: saved.mime, size: saved.size, kind, ref: purpose === 'cover' ? `academy-file:${saved.id}` : null };
  }

  // ==========================================================================
  // Parcours
  // ==========================================================================

  async listPaths() {
    const [paths, courses, counts] = await Promise.all([
      this.paths.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } }),
      this.courses.find({ select: { id: true, title: true, status: true, price: true } }),
      this.enrollments
        .createQueryBuilder('e')
        .select('e.itemId', 'pathId')
        .addSelect('COUNT(*)', 'count')
        .addSelect('ROUND(AVG(e.progress))', 'average')
        .where(`e.itemType = 'path'`)
        .groupBy('e.itemId')
        .getRawMany<{ pathId: string; count: string; average: string }>(),
    ]);
    return paths.map((path) => {
      const row = counts.find((c) => c.pathId === path.id);
      return {
        ...path,
        courses: (path.courseIds ?? []).map((id) => {
          const course = courses.find((c) => c.id === id);
          return { id, title: course?.title ?? 'Formation supprimée', status: course?.status ?? 'archived', price: course?.price ?? 0 };
        }),
        stats: { learners: Number(row?.count ?? 0), averageProgress: Number(row?.average ?? 0) },
      };
    });
  }

  async createPath(admin: Admin, dto: PathDto) {
    const courseIds = await this.assertCourses(dto.courseIds);
    const id = await this.uniqueId(this.paths, slugify(dto.title).slice(0, 70) || 'parcours');
    const last = await this.paths.createQueryBuilder('p').select('MAX(p.sortOrder)', 'max').getRawOne<{ max: number | null }>();
    const path = await this.paths.save(
      this.paths.create({
        id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        image: clean(dto.image) ?? DEFAULT_COURSE_IMAGE,
        price: dto.price,
        duration: dto.duration.trim(),
        courseIds,
        coursesCount: courseIds.length,
        sortOrder: dto.sortOrder ?? Number(last?.max ?? 0) + 1,
        status: 'draft',
      }),
    );
    await this.audit.log(admin, 'academy.path.create', { type: 'academy_path', id, label: path.title }, { price: path.price, courses: courseIds.length });
    return this.findPathView(id);
  }

  async updatePath(admin: Admin, id: string, dto: UpdatePathDto) {
    const path = await this.findPath(id);
    const before = { ...path };
    if (dto.title !== undefined) path.title = dto.title.trim();
    if (dto.description !== undefined) path.description = dto.description.trim();
    if (dto.image !== undefined) path.image = clean(dto.image) ?? DEFAULT_COURSE_IMAGE;
    if (dto.price !== undefined) path.price = dto.price;
    if (dto.duration !== undefined) path.duration = dto.duration.trim();
    if (dto.sortOrder !== undefined) path.sortOrder = dto.sortOrder;
    let coursesChanged = false;
    if (dto.courseIds !== undefined) {
      const courseIds = await this.assertCourses(dto.courseIds);
      coursesChanged = JSON.stringify(courseIds) !== JSON.stringify(path.courseIds ?? []);
      if (coursesChanged) {
        if (path.status === 'published') await this.assertPublishable(courseIds);
        path.courseIds = courseIds;
        path.coursesCount = courseIds.length;
      }
    }
    const fields = (['title', 'description', 'image', 'price', 'duration', 'sortOrder', 'courseIds'] as const).filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(path[key]),
    );
    if (fields.length === 0) return this.findPathView(id);
    await this.paths.save(path);
    if (fields.includes('title') || fields.includes('image')) {
      await this.enrollments.update({ itemType: 'path', itemId: id }, { title: path.title, image: path.image });
    }
    if (coursesChanged) await this.learning.recomputePath(id);
    await this.audit.log(
      admin,
      'academy.path.update',
      { type: 'academy_path', id, label: path.title },
      { fields, ...(fields.includes('price') ? { price: { from: before.price, to: path.price } } : {}) },
    );
    return this.findPathView(id);
  }

  async setPathStatus(admin: Admin, id: string, status: PublicationStatus) {
    const path = await this.findPath(id);
    if (path.status === status) return this.findPathView(id);
    if (status === 'published') await this.assertPublishable(path.courseIds ?? []);
    await this.paths.update(id, { status });
    await this.audit.log(admin, `academy.path.${STATUS_ACTIONS[status]}`, { type: 'academy_path', id, label: path.title }, { from: path.status, to: status });
    return this.findPathView(id);
  }

  async deletePath(admin: Admin, id: string) {
    const path = await this.findPath(id);
    if (await this.enrollments.exist({ where: { itemType: 'path', itemId: id } })) {
      throw new ConflictException('Des membres suivent ce parcours : archivez-le plutôt que de le supprimer.');
    }
    await this.assertNoPendingOrder('path', id);
    await this.cart.delete({ itemType: 'path', itemId: id });
    await this.paths.delete(id);
    await this.audit.log(admin, 'academy.path.delete', { type: 'academy_path', id, label: path.title });
    return { deleted: true };
  }

  /** Une commande en attente peut encore être réglée : l'élément doit continuer d'exister pour ouvrir l'accès. */
  private async assertNoPendingOrder(itemType: 'course' | 'path', itemId: string) {
    const pending = await this.orders
      .createQueryBuilder('o')
      .where(`o.status = 'pending'`)
      .andWhere('o.items @> :line::jsonb', { line: JSON.stringify([{ itemType, itemId }]) })
      .getExists();
    if (pending) throw new ConflictException("Une commande en attente de paiement contient cet élément : annulez-la d'abord, ou archivez-le plutôt que de le supprimer.");
  }

  private async assertPublishable(courseIds: string[]) {
    if (courseIds.length === 0) throw new BadRequestException('Ajoutez au moins une formation au parcours avant de le publier.');
    const courses = await this.courses.find({ where: { id: In(courseIds) } });
    const unpublished = courses.find((c) => c.status !== 'published');
    if (unpublished) throw new BadRequestException(`Toutes les formations du parcours doivent être publiées : « ${unpublished.title} » ne l'est pas.`);
  }

  private async assertCourses(ids: string[]) {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    const found = await this.courses.find({ where: { id: In(unique) }, select: { id: true } });
    if (found.length !== unique.length) throw new BadRequestException('Une formation sélectionnée est introuvable.');
    return unique;
  }

  private async findPathView(id: string) {
    const all = await this.listPaths();
    return all.find((p) => p.id === id)!;
  }

  // ==========================================================================
  // Domaines
  // ==========================================================================

  async listDomains() {
    const [domains, counts] = await Promise.all([
      this.domains.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } }),
      this.courses
        .createQueryBuilder('c')
        .select('c.trainingDomainId', 'domainId')
        .addSelect('COUNT(*)', 'count')
        .addSelect(`SUM(CASE WHEN c.status = 'published' THEN 1 ELSE 0 END)`, 'published')
        .where('c.trainingDomainId IS NOT NULL')
        .groupBy('c.trainingDomainId')
        .getRawMany<{ domainId: string; count: string; published: string }>(),
    ]);
    return domains.map((domain) => {
      const row = counts.find((c) => c.domainId === domain.id);
      return { ...domain, linkedCourses: Number(row?.count ?? 0), publishedCourses: Number(row?.published ?? 0) };
    });
  }

  async createDomain(admin: Admin, dto: DomainDto) {
    const id = await this.uniqueId(this.domains, slugify(dto.title).slice(0, 50) || 'domaine');
    const last = await this.domains.createQueryBuilder('d').select('MAX(d.sortOrder)', 'max').getRawOne<{ max: number | null }>();
    const domain = await this.domains.save(
      this.domains.create({
        id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        iconName: dto.iconName,
        featuredCourse: dto.featuredCourse.trim(),
        duration: dto.duration.trim(),
        accentColor: dto.accentColor,
        coursesCount: dto.coursesCount,
        sortOrder: dto.sortOrder ?? Number(last?.max ?? 0) + 1,
        status: 'draft',
      }),
    );
    await this.audit.log(admin, 'academy.domain.create', { type: 'academy_domain', id, label: domain.title });
    return (await this.listDomains()).find((d) => d.id === id);
  }

  async updateDomain(admin: Admin, id: string, dto: UpdateDomainDto) {
    const domain = await this.findDomain(id);
    const before = { ...domain };
    for (const key of ['title', 'description', 'featuredCourse', 'duration'] as const) {
      if (dto[key] !== undefined) domain[key] = dto[key]!.trim();
    }
    if (dto.iconName !== undefined) domain.iconName = dto.iconName;
    if (dto.accentColor !== undefined) domain.accentColor = dto.accentColor;
    if (dto.coursesCount !== undefined) domain.coursesCount = dto.coursesCount;
    if (dto.sortOrder !== undefined) domain.sortOrder = dto.sortOrder;
    const fields = (['title', 'description', 'featuredCourse', 'duration', 'iconName', 'accentColor', 'coursesCount', 'sortOrder'] as const).filter(
      (key) => before[key] !== domain[key],
    );
    if (fields.length) {
      await this.domains.save(domain);
      await this.audit.log(admin, 'academy.domain.update', { type: 'academy_domain', id, label: domain.title }, { fields });
    }
    return (await this.listDomains()).find((d) => d.id === id);
  }

  async setDomainStatus(admin: Admin, id: string, status: PublicationStatus) {
    const domain = await this.findDomain(id);
    if (domain.status !== status) {
      await this.domains.update(id, { status });
      await this.audit.log(admin, `academy.domain.${STATUS_ACTIONS[status]}`, { type: 'academy_domain', id, label: domain.title }, { from: domain.status, to: status });
    }
    return (await this.listDomains()).find((d) => d.id === id);
  }

  async deleteDomain(admin: Admin, id: string) {
    const domain = await this.findDomain(id);
    if (await this.courses.exist({ where: { trainingDomainId: id } })) {
      throw new ConflictException('Des formations sont rattachées à ce domaine : rattachez-les ailleurs ou archivez le domaine.');
    }
    await this.domains.delete(id);
    await this.audit.log(admin, 'academy.domain.delete', { type: 'academy_domain', id, label: domain.title });
    return { deleted: true };
  }

  // ==========================================================================
  // Tarifs
  // ==========================================================================

  async updatePrices(admin: Admin, dto: PricesDto) {
    let updated = 0;
    for (const change of dto.changes) {
      const repo = (change.itemType === 'course' ? this.courses : this.paths) as Repository<Course | LearningPath>;
      const item = await repo.findOne({ where: { id: change.itemId } });
      if (!item) throw new NotFoundException(change.itemType === 'course' ? 'Formation introuvable.' : 'Parcours introuvable.');
      if (item.price === change.price) continue;
      await repo.update(change.itemId, { price: change.price });
      await this.audit.log(
        admin,
        'academy.price.update',
        { type: change.itemType === 'course' ? 'academy_course' : 'academy_path', id: item.id, label: item.title },
        { from: item.price, to: change.price, currency: 'TND' },
      );
      updated += 1;
    }
    return { updated };
  }

  // ==========================================================================
  // Inscrits
  // ==========================================================================

  courseLearners(courseId: string) {
    return this.learning.courseLearners(courseId);
  }

  async listLearners(query: LearnersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.enrollments
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.user', 'user')
      .orderBy('COALESCE("e"."lastActivityAt", "e"."createdAt")', 'DESC')
      // Jointure n-à-1 : pas de doublons, offset / limit suffisent (pas de sous-requête de pagination).
      .offset((page - 1) * limit)
      .limit(limit);
    if (query.itemType) qb.andWhere('e.itemType = :itemType', { itemType: query.itemType });
    if (query.itemId) qb.andWhere('e.itemId = :itemId', { itemId: query.itemId });
    if (query.status) qb.andWhere('e.status = :status', { status: query.status });
    if (query.q?.trim()) {
      const like = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((w) => w.where('LOWER(user.fullName) LIKE :like', { like }).orWhere('LOWER(user.email) LIKE :like', { like }).orWhere('LOWER(e.title) LIKE :like', { like })),
      );
    }
    const [rows, total] = await qb.getManyAndCount();
    const paths = await this.paths.find({ select: { id: true, title: true } });
    return {
      total,
      items: rows.map((e) => ({
        id: e.id,
        itemType: e.itemType,
        itemId: e.itemId,
        title: e.title,
        progress: e.progress,
        status: e.status,
        source: e.source,
        viaPath: e.viaPathId ? (paths.find((p) => p.id === e.viaPathId)?.title ?? null) : null,
        lastActivityAt: e.lastActivityAt,
        completedAt: e.completedAt,
        createdAt: e.createdAt,
        user: { id: e.user.id, fullName: e.user.fullName, email: e.user.email, avatarUrl: e.user.avatarUrl, company: e.user.company },
      })),
    };
  }

  /** Accès offert par l'administration (sans commande), notifié au membre. */
  async grantEnrollment(admin: Admin, dto: GrantEnrollmentDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Aucun compte QIAO avec cette adresse e-mail.');
    const item = dto.itemType === 'course' ? await this.findCourse(dto.itemId) : await this.findPath(dto.itemId);
    if (await this.enrollments.exist({ where: { user: { id: user.id }, itemType: dto.itemType, itemId: dto.itemId } })) {
      throw new ConflictException(`${user.fullName} est déjà inscrit à « ${item.title} ».`);
    }
    const enrollment = await this.enrollments.save(
      this.enrollments.create({ user: { id: user.id } as User, itemType: dto.itemType, itemId: item.id, title: item.title, image: item.image, source: 'admin' }),
    );
    if (dto.itemType === 'path') await this.learning.recomputePath(item.id);
    await this.notifications.notify(
      user,
      'Nouvel accès QIAO Academy',
      `L'équipe QIAO vous a inscrit ${dto.itemType === 'path' ? 'au parcours' : 'à la formation'} « ${item.title} ». Elle vous attend dans votre espace.`,
      'academy',
      dto.itemType === 'course' ? `dashboard/academy/${item.id}` : 'dashboard/academy',
    );
    await this.audit.log(admin, 'academy.enrollment.grant', { type: 'academy_enrollment', id: enrollment.id, label: `${user.fullName} → ${item.title}` }, { email, itemType: dto.itemType, itemId: item.id });
    return { id: enrollment.id };
  }

  async revokeEnrollment(admin: Admin, id: string) {
    const enrollment = await this.enrollments.findOne({ where: { id }, relations: { user: true } });
    if (!enrollment) throw new NotFoundException('Inscription introuvable.');
    await this.enrollments.delete(id);
    if (enrollment.itemType === 'path' && enrollment.user) {
      await this.enrollments.delete({ user: { id: enrollment.user.id }, itemType: 'course', source: 'path', viaPathId: enrollment.itemId });
    }
    await this.audit.log(
      admin,
      'academy.enrollment.revoke',
      { type: 'academy_enrollment', id, label: `${enrollment.user?.fullName ?? 'Membre'} → ${enrollment.title}` },
      { itemType: enrollment.itemType, itemId: enrollment.itemId, progress: enrollment.progress },
    );
    return { deleted: true };
  }

  auditLog(query: AcademyAuditQueryDto) {
    const action = query.action?.startsWith('academy.') ? query.action : 'academy.';
    return this.audit.list({ page: query.page ?? 1, limit: query.limit ?? 50, action });
  }

  // ==========================================================================
  // Utilitaires
  // ==========================================================================

  private async findCourse(id: string) {
    const course = await this.courses.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Formation introuvable.');
    return course;
  }

  private async findPath(id: string) {
    const path = await this.paths.findOne({ where: { id } });
    if (!path) throw new NotFoundException('Parcours introuvable.');
    return path;
  }

  private async findDomain(id: string) {
    const domain = await this.domains.findOne({ where: { id } });
    if (!domain) throw new NotFoundException('Domaine introuvable.');
    return domain;
  }

  private async findModule(id: string) {
    const module = await this.modules.findOne({ where: { id } });
    if (!module) throw new NotFoundException('Module introuvable.');
    return module;
  }

  private async assertDomain(id: string | null | undefined) {
    if (clean(id) && !(await this.domains.exist({ where: { id: id! } }))) throw new BadRequestException('Domaine de formation introuvable.');
  }

  private assertSameSet(existing: string[], ids: string[]) {
    if (existing.length !== ids.length || new Set(ids).size !== ids.length || ids.some((id) => !existing.includes(id))) {
      throw new BadRequestException("L'ordre envoyé ne correspond pas au programme actuel. Rechargez la page.");
    }
  }

  private async uniqueId(repo: Repository<Course> | Repository<LearningPath> | Repository<TrainingDomain>, base: string) {
    let id = base;
    while (await (repo as Repository<Course>).exist({ where: { id } })) {
      id = `${base}-${randomBytes(2).toString('hex')}`;
    }
    return id;
  }
}
