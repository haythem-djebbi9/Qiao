import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { isAllFilter, matchesQuery, normalize } from '../../common/text';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { AcademyItemDto, CoursesQueryDto } from './academy.dto';
import {
  AcademyItemType,
  CartItem,
  Course,
  CourseFavorite,
  Enrollment,
  LearningPath,
  Order,
  OrderLine,
  TrainingDomain,
} from './academy.entities';

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
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  listDomains() {
    return this.domains.find({ order: { sortOrder: 'ASC' } });
  }

  async domainCourses(domainId: string) {
    const domain = await this.domains.findOne({ where: { id: domainId } });
    if (!domain) throw new NotFoundException('Parcours introuvable.');
    const courses = await this.courses.find({ where: { trainingDomainId: domainId }, order: { sortOrder: 'ASC' } });
    return { domain, courses };
  }

  async listCourses(query: CoursesQueryDto) {
    const all = await this.courses.find({ order: { sortOrder: 'ASC' } });
    return all.filter(
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
  }

  listPaths() {
    return this.paths.find({ order: { sortOrder: 'ASC' } });
  }

  // --- Favoris -------------------------------------------------------------

  async favoriteIds(user: User): Promise<string[]> {
    const rows = await this.favorites.find({ where: { user: { id: user.id } } });
    return rows.map((row) => row.course.id);
  }

  async toggleFavorite(user: User, courseId: string) {
    const course = await this.courses.findOne({ where: { id: courseId } });
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
    if (await this.isEnrolled(user, dto)) {
      throw new ConflictException(`Vous êtes déjà inscrit à « ${item.title} ».`);
    }
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

  async checkout(user: User) {
    const cart = await this.getCart(user);
    if (cart.count === 0) throw new BadRequestException('Votre panier est vide.');
    const order = await this.createOrder(user, cart.items);
    await this.cart.delete({ user: { id: user.id } });
    return { order, cart: await this.getCart(user) };
  }

  // --- Inscriptions --------------------------------------------------------

  async enroll(user: User, dto: AcademyItemDto) {
    const [item] = await this.resolveItems([dto]);
    if (!item) throw new NotFoundException('Formation introuvable.');
    if (await this.isEnrolled(user, dto)) {
      throw new ConflictException(`Vous êtes déjà inscrit à « ${item.title} ».`);
    }
    const order = await this.createOrder(user, [item]);
    await this.cart.delete({ user: { id: user.id }, itemType: dto.itemType, itemId: dto.itemId });
    return { order, cart: await this.getCart(user) };
  }

  listEnrollments(user: User) {
    return this.enrollments.find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } });
  }

  listOrders(user: User) {
    return this.orders.find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } });
  }

  async summary(user: User) {
    const [favorites, cart, enrollments] = await Promise.all([
      this.favoriteIds(user),
      this.getCart(user),
      this.enrollments.find({ where: { user: { id: user.id } } }),
    ]);
    return {
      favorites,
      cart,
      enrolled: enrollments.map((e) => `${e.itemType}:${e.itemId}`),
    };
  }

  private async createOrder(user: User, items: CatalogItem[]) {
    const lines: OrderLine[] = items.map(({ itemType, itemId, title, price }) => ({ itemType, itemId, title, price }));
    const total = lines.reduce((sum, line) => sum + line.price, 0);

    const order = await this.dataSource.transaction(async (manager) => {
      const count = await manager.count(Order);
      const saved = await manager.save(
        manager.create(Order, {
          reference: `ACAD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
          user: { id: user.id } as User,
          items: lines,
          total,
        }),
      );
      for (const item of items) {
        const already = await manager.exists(Enrollment, {
          where: { user: { id: user.id }, itemType: item.itemType, itemId: item.itemId },
        });
        if (!already) {
          await manager.save(
            manager.create(Enrollment, {
              user: { id: user.id } as User,
              itemType: item.itemType,
              itemId: item.itemId,
              title: item.title,
              image: item.image,
            }),
          );
        }
      }
      return saved;
    });

    await this.notifications.notify(
      user,
      `Inscription validée (${order.reference})`,
      `${lines.map((l) => l.title).join(', ')} — total ${total} TND. Votre accès est actif dans votre espace.`,
      'academy',
      'dashboard',
    );
    return order;
  }

  private async isEnrolled(user: User, dto: AcademyItemDto) {
    return this.enrollments.exist({ where: { user: { id: user.id }, itemType: dto.itemType, itemId: dto.itemId } });
  }

  private async resolveItems(refs: { itemType: AcademyItemType; itemId: string }[]): Promise<CatalogItem[]> {
    const courseIds = refs.filter((r) => r.itemType === 'course').map((r) => r.itemId);
    const pathIds = refs.filter((r) => r.itemType === 'path').map((r) => r.itemId);
    const [courses, paths] = await Promise.all([
      courseIds.length ? this.courses.find({ where: { id: In(courseIds) } }) : Promise.resolve([]),
      pathIds.length ? this.paths.find({ where: { id: In(pathIds) } }) : Promise.resolve([]),
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
