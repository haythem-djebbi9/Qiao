import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { isAllFilter, matchesQuery, normalize } from '../../common/text';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { AcademyItemDto, CoursesQueryDto } from './academy.dto';
import { AcademyPaymentsService } from './academy-payments.service';
import { CertificatesService } from './certificates.service';
import {
  AcademyItemType,
  CartItem,
  Course,
  CourseFavorite,
  CourseModule,
  Enrollment,
  LearningPath,
  Lesson,
  Order,
  OrderLine,
  TrainingDomain,
} from './academy.entities';

const PUBLISHED = 'published' as const;

interface CatalogItem {
  itemType: AcademyItemType;
  itemId: string;
  title: string;
  price: number;
  image: string;
  subtitle: string;
}

function matchesDuration(minutes: number, filter?: string): boolean {
  if (isAllFilter(filter)) return true;
  const f = normalize(filter);
  if (f.startsWith('moins')) return minutes < 5 * 60;
  if (f.startsWith('plus')) return minutes > 15 * 60;
  return minutes >= 5 * 60 && minutes <= 15 * 60;
}

function matchesLevel(level: string, filter?: string): boolean {
  if (isAllFilter(filter)) return true;
  return normalize(level) === normalize(filter) || normalize(level) === 'tous niveaux';
}

@Injectable()
export class AcademyService {
  constructor(
    @InjectRepository(TrainingDomain) private readonly domains: Repository<TrainingDomain>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(LearningPath) private readonly paths: Repository<LearningPath>,
    @InjectRepository(CourseFavorite) private readonly favorites: Repository<CourseFavorite>,
    @InjectRepository(CartItem) private readonly cart: Repository<CartItem>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(CourseModule) private readonly modules: Repository<CourseModule>,
    @InjectRepository(Lesson) private readonly lessons: Repository<Lesson>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
    private readonly certificates: CertificatesService,
    private readonly payments: AcademyPaymentsService,
  ) {}

  listDomains() {
    return this.domains.find({ where: { status: PUBLISHED }, order: { sortOrder: 'ASC' } });
  }

  async domainCourses(domainId: string) {
    const domain = await this.domains.findOne({ where: { id: domainId, status: PUBLISHED } });
    if (!domain) throw new NotFoundException('Parcours introuvable.');
    const courses = await this.courses.find({ where: { trainingDomainId: domainId, status: PUBLISHED }, order: { sortOrder: 'ASC' } });
    return { domain, courses: await this.withLessonCounts(courses) };
  }

  async listCourses(query: CoursesQueryDto) {
    const all = await this.courses.find({ where: { status: PUBLISHED }, order: { sortOrder: 'ASC' } });
    const matching = all.filter(
      (course) =>
        // Les formations des domaines de l'accueil sont servies par /academy/domains/:id/courses.
        !course.trainingDomainId &&
        (!query.section || (course.sections ?? []).includes(query.section)) &&
        (isAllFilter(query.domain) || course.domain === query.domain) &&
        matchesLevel(course.level, query.level) &&
        matchesDuration(course.durationMinutes, query.duration) &&
        (isAllFilter(query.format) || normalize(course.format) === normalize(query.format)) &&
        matchesQuery(query.q, course.title, course.instructor, course.description, course.modules),
    );
    return this.withLessonCounts(matching);
  }

  /** Nombre de leçons publiées de chaque formation : à 0, la fiche reste visible mais annonce « Bientôt disponible ». */
  private async withLessonCounts(courses: Course[]) {
    const counts = await this.publishedLessonCounts(courses.map((course) => course.id));
    return courses.map((course) => ({ ...course, lessonsCount: counts.get(course.id) ?? 0 }));
  }

  private async publishedLessonCounts(courseIds: string[]) {
    if (courseIds.length === 0) return new Map<string, number>();
    const rows: { courseId: string; count: string }[] = await this.lessons
      .createQueryBuilder('lesson')
      .select('lesson.courseId', 'courseId')
      .addSelect('COUNT(*)', 'count')
      .where('lesson.courseId IN (:...courseIds)', { courseIds })
      .andWhere('lesson.published = true')
      .groupBy('lesson.courseId')
      .getRawMany();
    return new Map(rows.map((row) => [row.courseId, Number(row.count)]));
  }

  /** Rien n'est vendu avant la mise en ligne du contenu : formation sans leçon publiée, parcours sans formation prête. */
  private async assertContentAvailable(items: { itemType: AcademyItemType; itemId: string; title: string }[]) {
    const pathIds = items.filter((item) => item.itemType === 'path').map((item) => item.itemId);
    const paths = pathIds.length ? await this.paths.find({ where: { id: In(pathIds) } }) : [];
    const courseIdsOf = (item: { itemType: AcademyItemType; itemId: string }) =>
      item.itemType === 'course' ? [item.itemId] : (paths.find((path) => path.id === item.itemId)?.courseIds ?? []);
    const counts = await this.publishedLessonCounts([...new Set(items.flatMap(courseIdsOf))]);
    const unavailable = items.find((item) => !courseIdsOf(item).some((id) => (counts.get(id) ?? 0) > 0));
    if (unavailable) {
      throw new ConflictException(`« ${unavailable.title} » sera bientôt disponible : son contenu n'est pas encore en ligne.`);
    }
  }

  /** Parcours publiés, avec la liste de leurs formations (fenêtre « Ce pack inclut »). */
  async listPaths() {
    const paths = await this.paths.find({ where: { status: PUBLISHED }, order: { sortOrder: 'ASC' } });
    const ids = [...new Set(paths.flatMap((p) => p.courseIds ?? []))];
    const courses = ids.length ? await this.courses.find({ where: { id: In(ids), status: PUBLISHED } }) : [];
    const counts = await this.publishedLessonCounts(courses.map((course) => course.id));
    return paths.map((path) => ({
      ...path,
      available: (path.courseIds ?? []).some((id) => (counts.get(id) ?? 0) > 0),
      courses: (path.courseIds ?? [])
        .map((id) => courses.find((c) => c.id === id))
        .filter((c): c is Course => Boolean(c))
        .map((c) => ({ id: c.id, title: c.title, duration: c.duration, level: c.level })),
    }));
  }

  /** Programme public d'une formation publiée : modules et titres des leçons (le contenu reste réservé aux inscrits). */
  async courseOutline(courseId: string, viewer: User | null) {
    const course = await this.courses.findOne({ where: { id: courseId } });
    if (!course || (course.status !== PUBLISHED && viewer?.role !== 'admin')) throw new NotFoundException('Formation introuvable.');
    const [modules, lessons] = await Promise.all([
      this.modules.find({ where: { courseId }, order: { sortOrder: 'ASC', createdAt: 'ASC' } }),
      this.lessons.find({ where: { courseId, published: true }, order: { sortOrder: 'ASC', createdAt: 'ASC' } }),
    ]);
    const outline = modules
      .map((module) => ({
        id: module.id,
        title: module.title,
        lessons: lessons
          .filter((l) => l.moduleId === module.id)
          .map((l) => ({ id: l.id, title: l.title, type: l.type, durationMinutes: l.durationMinutes })),
      }))
      .filter((module) => module.lessons.length > 0);
    return {
      course,
      modules: outline,
      lessonsCount: lessons.length,
      totalMinutes: lessons.reduce((sum, l) => sum + l.durationMinutes, 0),
    };
  }

  // --- Favoris -------------------------------------------------------------

  async favoriteIds(user: User): Promise<string[]> {
    const rows = await this.favorites.find({ where: { user: { id: user.id } } });
    return rows.map((row) => row.course.id);
  }

  async toggleFavorite(user: User, courseId: string) {
    const course = await this.courses.findOne({ where: { id: courseId, status: PUBLISHED } });
    if (!course) throw new NotFoundException('Formation introuvable.');

    const existing = await this.favorites.findOne({ where: { user: { id: user.id }, course: { id: courseId } } });
    if (existing) {
      await this.favorites.remove(existing);
    } else {
      await this.favorites.save(this.favorites.create({ user: { id: user.id } as User, course }));
    }
    return { favorite: !existing, favorites: await this.favoriteIds(user) };
  }

  // --- Panier --------------------------------------------------------------

  async getCart(user: User) {
    const rows = await this.cart.find({ where: { user: { id: user.id } }, order: { createdAt: 'ASC' } });
    const items = await this.resolveItems(rows.map((row) => ({ itemType: row.itemType, itemId: row.itemId })));
    const lines = rows
      .map((row) => {
        const item = items.find((i) => i.itemType === row.itemType && i.itemId === row.itemId);
        return item ? { id: row.id, ...item } : null;
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
    return { items: lines, count: lines.length, total: lines.reduce((sum, line) => sum + line.price, 0), currency: 'TND' };
  }

  async addToCart(user: User, dto: AcademyItemDto) {
    const [item] = await this.resolveItems([dto]);
    if (!item) throw new NotFoundException('Formation introuvable.');
    await this.assertNotEnrolled(user, dto, item.title);
    await this.assertContentAvailable([item]);
    const exists = await this.cart.exist({ where: { user: { id: user.id }, itemType: dto.itemType, itemId: dto.itemId } });
    if (!exists) {
      await this.cart.save(this.cart.create({ user: { id: user.id } as User, itemType: dto.itemType, itemId: dto.itemId }));
    }
    return { ...(await this.getCart(user)), alreadyInCart: exists };
  }

  async removeFromCart(user: User, cartItemId: string) {
    await this.cart.delete({ id: cartItemId, user: { id: user.id } });
    return this.getCart(user);
  }

  /** Panier réglé par carte (session de paiement) ou par virement ; l'accès s'ouvre une fois le paiement confirmé. */
  async checkout(user: User, method?: 'card' | 'transfer') {
    const cart = await this.getCart(user);
    if (cart.count === 0) throw new BadRequestException('Votre panier est vide.');
    for (const item of cart.items) await this.assertNotEnrolled(user, item, item.title);
    await this.assertContentAvailable(cart.items);
    const result = await this.payments.start(user, cart.items, method);
    return { ...result, cart: await this.getCart(user) };
  }

  // --- Inscriptions --------------------------------------------------------

  async enroll(user: User, dto: AcademyItemDto, method?: 'card' | 'transfer') {
    const [item] = await this.resolveItems([dto]);
    if (!item) throw new NotFoundException('Formation introuvable.');
    await this.assertNotEnrolled(user, dto, item.title);
    await this.assertContentAvailable([item]);
    const result = await this.payments.start(user, [item], method);
    return { ...result, cart: await this.getCart(user) };
  }

  /** Inscriptions du membre ; un parcours liste ses formations avec la progression de chacune. */
  async listEnrollments(user: User) {
    const [rows, certificates] = await Promise.all([
      this.enrollments.find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } }),
      this.certificates.forUser(user.id),
    ]);
    const certificate = (courseId: string) => certificates.get(courseId) ?? null;
    const pathRows = rows.filter((e) => e.itemType === 'path');
    const paths = pathRows.length ? await this.paths.find({ where: { id: In(pathRows.map((e) => e.itemId)) } }) : [];
    const courseIds = [...new Set(paths.flatMap((p) => p.courseIds ?? []))];
    const courses = courseIds.length ? await this.courses.find({ where: { id: In(courseIds) } }) : [];
    return rows.map((e) => {
      if (e.itemType !== 'path') return { ...e, courses: null, certificate: certificate(e.itemId) };
      const path = paths.find((p) => p.id === e.itemId);
      return {
        ...e,
        certificate: null,
        courses: (path?.courseIds ?? [])
          .map((id) => courses.find((c) => c.id === id))
          .filter((c): c is Course => Boolean(c) && c!.status !== 'draft')
          .map((c) => {
            const own = rows.find((r) => r.itemType === 'course' && r.itemId === c.id);
            return {
              id: c.id,
              title: c.title,
              image: c.image,
              duration: c.duration,
              progress: own?.progress ?? 0,
              status: own?.status ?? null,
              certificate: certificate(c.id),
            };
          }),
      };
    });
  }

  listOrders(user: User) {
    return this.payments.listForUser(user);
  }

  async summary(user: User) {
    const [favorites, cart, enrollments] = await Promise.all([
      this.favoriteIds(user),
      this.getCart(user),
      this.enrollments.find({ where: { user: { id: user.id } } }),
    ]);
    const viaPaths = (await this.pathCourseIds(user)).map((id) => `course:${id}`);
    return {
      favorites,
      cart,
      enrolled: [...new Set([...enrollments.map((e) => `${e.itemType}:${e.itemId}`), ...viaPaths])],
    };
  }

  /** Déjà inscrit, directement ou par un parcours qui contient la formation. */
  private async assertNotEnrolled(user: User, dto: AcademyItemDto, title: string) {
    if (await this.enrollments.exist({ where: { user: { id: user.id }, itemType: dto.itemType, itemId: dto.itemId } })) {
      throw new ConflictException(`Vous êtes déjà inscrit à « ${title} ».`);
    }
    if (dto.itemType === 'course' && (await this.pathCourseIds(user)).includes(dto.itemId)) {
      throw new ConflictException(`« ${title} » est incluse dans un parcours que vous suivez déjà.`);
    }
  }

  /** Formations accessibles par les parcours suivis par le membre. */
  private async pathCourseIds(user: User): Promise<string[]> {
    const pathEnrollments = await this.enrollments.find({ where: { user: { id: user.id }, itemType: 'path' } });
    if (pathEnrollments.length === 0) return [];
    const paths = await this.paths.find({ where: { id: In(pathEnrollments.map((e) => e.itemId)) } });
    return [...new Set(paths.flatMap((p) => p.courseIds ?? []))];
  }

  private async resolveItems(refs: { itemType: AcademyItemType; itemId: string }[]): Promise<CatalogItem[]> {
    const courseIds = refs.filter((r) => r.itemType === 'course').map((r) => r.itemId);
    const pathIds = refs.filter((r) => r.itemType === 'path').map((r) => r.itemId);
    const [courses, paths] = await Promise.all([
      // Seuls les éléments publiés peuvent être commandés : un élément dépublié ou archivé disparaît du panier.
      courseIds.length ? this.courses.find({ where: { id: In(courseIds), status: PUBLISHED } }) : Promise.resolve([]),
      pathIds.length ? this.paths.find({ where: { id: In(pathIds), status: PUBLISHED } }) : Promise.resolve([]),
    ]);
    return refs
      .map((ref): CatalogItem | null => {
        if (ref.itemType === 'course') {
          const course = courses.find((c) => c.id === ref.itemId);
          return course
            ? { itemType: 'course', itemId: course.id, title: course.title, price: course.price, image: course.image, subtitle: `${course.instructor} · ${course.duration}` }
            : null;
        }
        const path = paths.find((p) => p.id === ref.itemId);
        return path
          ? { itemType: 'path', itemId: path.id, title: path.title, price: path.price, image: path.image, subtitle: `${path.coursesCount} formations · ${path.duration}` }
          : null;
      })
      .filter((item): item is CatalogItem => item !== null);
  }
}
