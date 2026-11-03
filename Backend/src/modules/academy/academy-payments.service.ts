import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { ExternalCheckouts } from '../payments/external-checkouts';
import { GatewayOperation, PAYMENT_GATEWAY, PaymentGateway } from '../payments/gateway/payment-gateway';
import { AuditService } from '../platform/platform.services';
import { User } from '../users/user.entity';
import { AdminOrdersQueryDto, PaymentSettingsDto } from './academy-admin.dto';
import { AcademyItemType, AcademySettings, BankDetails, CartItem, Enrollment, Order, OrderLine, PaymentMethod } from './academy.entities';

type Admin = Pick<User, 'id' | 'fullName'>;

export interface PurchasableItem {
  itemType: AcademyItemType;
  itemId: string;
  title: string;
  price: number;
  image: string;
}

/** Référence des paiements Academy chez le prestataire (aiguillage des notifications, voir ExternalCheckouts). */
const ORDER_PREFIX = 'academy-order:';
/** Montant minimal d'un paiement par carte chez le prestataire (0,50 €). */
const MIN_CARD_CENTS = 50;
const EMPTY_BANK: BankDetails = { beneficiary: '', bankName: '', rib: '', iban: '', bic: '', instructions: '' };

const clean = (value: string | null | undefined) => (value ?? '').trim();

/**
 * Paiement des formations et parcours : carte bancaire via le prestataire de paiement de QIAO (montant converti en
 * euros au taux fixé par l'administration), ou virement validé par l'administration. L'accès n'est ouvert qu'une fois
 * le paiement confirmé (prestataire) ou reçu (virement) ; une formation gratuite est ouverte immédiatement.
 */
@Injectable()
export class AcademyPaymentsService implements OnModuleInit {
  private readonly logger = new Logger('AcademyPayments');

  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(AcademySettings) private readonly settingsRepo: Repository<AcademySettings>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    private readonly external: ExternalCheckouts,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    // Notifications du prestataire pour les commandes Academy (paiement confirmé ou refusé).
    this.external.register(ORDER_PREFIX, (orderId, op) => this.applyCheckout(orderId, op));
  }

  // ==========================================================================
  // Réglages
  // ==========================================================================

  async settings() {
    const row = await this.settingsRepo.findOne({ where: { id: 'default' } });
    return { eurPerTnd: row?.eurPerTnd ? Number(row.eurPerTnd) : null, bank: { ...EMPTY_BANK, ...(row?.bank ?? {}) } };
  }

  /** Modes de paiement proposés à l'apprenant (le RIB n'est communiqué qu'après la commande). */
  async options() {
    const s = await this.settings();
    return {
      currency: 'TND',
      card: { available: this.gateway.available && Boolean(s.eurPerTnd), currency: 'EUR', rate: s.eurPerTnd, provider: this.gateway.name },
      transfer: { available: this.bankConfigured(s.bank) },
    };
  }

  async updateSettings(admin: Admin, dto: PaymentSettingsDto) {
    const current = await this.settings();
    const eurPerTnd = dto.eurPerTnd === undefined ? current.eurPerTnd : dto.eurPerTnd;
    const bank = dto.bank ? { ...current.bank, ...Object.fromEntries(Object.entries(dto.bank).map(([k, v]) => [k, clean(v as string)])) } : current.bank;
    await this.settingsRepo.save({ id: 'default', eurPerTnd: eurPerTnd ? String(Math.round(eurPerTnd * 1_000_000) / 1_000_000) : null, bank: bank as BankDetails });
    await this.audit.log(
      admin,
      'academy.payment.settings',
      { type: 'academy_settings', id: 'default', label: 'Paiement des formations' },
      { eurPerTnd: { from: current.eurPerTnd, to: eurPerTnd ?? null }, bankChanged: JSON.stringify(bank) !== JSON.stringify(current.bank) },
    );
    return this.settings();
  }

  private bankConfigured(bank: BankDetails) {
    return Boolean(clean(bank.beneficiary) && (clean(bank.rib) || clean(bank.iban)));
  }

  // ==========================================================================
  // Commande
  // ==========================================================================

  /** Crée la commande : gratuite → accès immédiat ; carte → session de paiement ; virement → instructions. */
  async start(user: User, items: PurchasableItem[], method: 'card' | 'transfer' = 'card') {
    if (items.length === 0) throw new BadRequestException('Votre panier est vide.');
    const pending = await this.orders.find({ where: { user: { id: user.id }, status: 'pending' } });
    for (const item of items) {
      const order = pending.find((o) => o.items.some((l) => l.itemType === item.itemType && l.itemId === item.itemId));
      if (order) {
        throw new ConflictException(`« ${item.title} » fait déjà partie de la commande ${order.reference}, en attente de paiement : reprenez-la depuis Mon espace › Formations.`);
      }
    }
    const total = items.reduce((sum, item) => sum + item.price, 0);
    const options = await this.options();
    if (total > 0 && method === 'card' && !options.card.available) {
      throw new ServiceUnavailableException("Le paiement par carte n'est pas encore disponible : choisissez le virement ou réessayez plus tard.");
    }
    if (total > 0 && method === 'transfer' && !options.transfer.available) {
      throw new ServiceUnavailableException("Le paiement par virement n'est pas encore disponible : choisissez la carte bancaire.");
    }

    const order = await this.dataSource.transaction(async (m) => {
      const created = await m.save(
        m.create(Order, {
          reference: await this.nextReference(m),
          user: { id: user.id } as User,
          items: items.map(({ itemType, itemId, title, price }): OrderLine => ({ itemType, itemId, title, price })),
          total,
          currency: 'TND',
          status: 'pending',
          paymentMethod: total === 0 ? 'free' : method,
        }),
      );
      // Articles retirés du panier : ils sont désormais dans la commande.
      for (const item of items) await m.delete(CartItem, { user: { id: user.id }, itemType: item.itemType, itemId: item.itemId });
      return created;
    });
    await this.audit.log(user, 'academy.order.create', { type: 'academy_order', id: order.id, label: order.reference }, { total, method: order.paymentMethod });

    if (total === 0) {
      await this.markPaid(order.id, { method: 'free', paymentRef: null }, null);
      return { order: await this.present(order.id) };
    }
    if (method === 'card') return this.openCheckout(order.id, user);

    await this.notifications.notify(
      user,
      `Commande ${order.reference} : virement à effectuer`,
      `Virez ${formatTnd(total)} en indiquant la référence ${order.reference}. Votre accès s'ouvrira dès réception, après vérification par l'équipe QIAO.`,
      'academy',
      `dashboard/academy/commande/${order.id}`,
    );
    await this.notifyAdmins(`Virement attendu : ${order.reference}`, `${user.fullName} a choisi le virement (${formatTnd(total)}). Validez la commande à réception des fonds.`);
    return { order: await this.present(order.id) };
  }

  /** Numéro suivant de l'année, sous verrou : deux commandes simultanées ne peuvent pas obtenir la même référence. */
  private async nextReference(m: EntityManager) {
    await m.query(`SELECT pg_advisory_xact_lock(hashtext('academy_order_reference'))`);
    const prefix = `ACAD-${new Date().getFullYear()}-`;
    const [last]: { reference: string }[] = await m.query('SELECT reference FROM orders WHERE reference LIKE $1 ORDER BY LENGTH(reference) DESC, reference DESC LIMIT 1', [`${prefix}%`]);
    const next = last ? Number(last.reference.slice(prefix.length)) + 1 : 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  /** Nouvelle session de paiement par carte (première tentative, nouvelle tentative ou passage du virement à la carte). */
  async pay(user: User, orderId: string) {
    const order = await this.ownOrder(user, orderId);
    if (order.status !== 'pending') throw new ConflictException('Cette commande n’est plus en attente de paiement.');
    if (!(await this.options()).card.available) throw new ServiceUnavailableException("Le paiement par carte n'est pas disponible pour le moment.");
    return this.openCheckout(order.id, user);
  }

  async cancel(user: User, orderId: string) {
    const order = await this.ownOrder(user, orderId);
    if (order.status !== 'pending') throw new ConflictException('Seule une commande en attente de paiement peut être annulée.');
    await this.cancelOrder(order, null, null);
    return this.present(order.id);
  }

  /** Détail d'une commande du membre ; un paiement par carte en cours est vérifié auprès du prestataire. */
  async detail(user: User, orderId: string) {
    const order = await this.ownOrder(user, orderId);
    if (order.status === 'pending') await this.reconcile(order);
    return this.present(order.id);
  }

  async listForUser(user: User) {
    const rows = await this.orders.find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } });
    // Retour du paiement sans notification reçue (webhook non joignable en local, onglet fermé) : rapprochement.
    for (const row of rows.filter((o) => o.status === 'pending' && o.checkoutRef).slice(0, 5)) await this.reconcile(row);
    return Promise.all(rows.map((row) => this.present(row.id)));
  }

  private async openCheckout(orderId: string, user: User) {
    const order = await this.orders.findOneOrFail({ where: { id: orderId } });
    const { eurPerTnd } = await this.settings();
    if (!eurPerTnd) throw new ServiceUnavailableException("Taux de conversion non défini : le paiement par carte n'est pas disponible.");
    const cents = Math.round(order.total * eurPerTnd * 100);
    if (cents < MIN_CARD_CENTS) throw new BadRequestException('Montant trop faible pour un paiement par carte : choisissez le virement.');
    if (order.checkoutRef) await this.gateway.expireCheckout(order.checkoutRef).catch(() => undefined);

    const attempt = order.checkoutAttempts + 1;
    const publicUrl = (this.config.get<string>('PUBLIC_URL') || 'http://localhost:3000').replace(/\/$/, '');
    const session = await this.gateway.createCheckout({
      transactionId: `${ORDER_PREFIX}${order.id}`,
      reference: order.reference,
      description: order.items.map((l) => l.title).join(', ').slice(0, 480),
      amount: cents,
      currency: 'EUR',
      returnUrl: `${publicUrl}/?tab=dashboard&dv=${encodeURIComponent(`academy/commande/${order.id}`)}`,
      idempotencyKey: `${ORDER_PREFIX}${order.id}:${attempt}`,
      label: `QIAO Academy ${order.reference}`,
    });
    await this.orders.update(order.id, {
      paymentMethod: 'card',
      checkoutRef: session.ref,
      checkoutAttempts: attempt,
      chargedAmount: cents,
      chargedCurrency: 'EUR',
      exchangeRate: String(eurPerTnd),
    });
    await this.audit.log(user, 'academy.order.checkout', { type: 'academy_order', id: order.id, label: order.reference }, { attempt, amount: cents, currency: 'EUR', rate: eurPerTnd });
    return { order: await this.present(order.id), checkoutUrl: session.url };
  }

  /** Rapprochement d'une session de paiement par carte avec l'état réel chez le prestataire. */
  private async reconcile(order: Order) {
    if (!order.checkoutRef || order.paymentMethod !== 'card') return;
    try {
      const op = await this.gateway.retrieve('checkout', order.checkoutRef);
      if (op.status === 'succeeded') await this.applyCheckout(order.id, op);
    } catch (err) {
      this.logger.warn(`Rapprochement ${order.reference} impossible : ${(err as Error).message}`);
    }
  }

  /** Paiement confirmé par le prestataire (notification ou rapprochement) ; un échec laisse la commande en attente. */
  async applyCheckout(orderId: string, op: GatewayOperation): Promise<boolean> {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) return false;
    if (op.status !== 'succeeded') return true;
    const paymentRef = op.paymentRef ?? op.ref;
    if (order.status !== 'pending') {
      if (order.paymentRef !== paymentRef) {
        // Session ancienne réglée après une autre, ou commande annulée entre-temps : à rembourser manuellement.
        this.logger.error(`Paiement ${paymentRef} reçu pour ${order.reference} (statut ${order.status}) : vérification manuelle requise.`);
        await this.audit.log(null, 'academy.order.unexpected_payment', { type: 'academy_order', id: order.id, label: order.reference }, { paymentRef, status: order.status, amount: op.amount, currency: op.currency });
        await this.notifyAdmins(`Paiement à vérifier : ${order.reference}`, `Un paiement par carte a été reçu pour une commande ${order.status === 'cancelled' ? 'annulée' : 'déjà réglée'} : remboursez-le depuis le tableau de bord du prestataire.`);
      }
      return true;
    }
    await this.markPaid(order.id, { method: 'card', paymentRef, amount: op.amount ?? null, currency: op.currency ?? null }, null);
    return true;
  }

  /** Commande réglée : statut « payée » et inscriptions ouvertes, dans une même transaction (verrou sur la commande). */
  private async markPaid(orderId: string, info: { method: PaymentMethod; paymentRef: string | null; amount?: number | null; currency?: string | null }, admin: Admin | null, note?: string) {
    const result = await this.dataSource.transaction(async (m) => {
      const order = await m.findOne(Order, { where: { id: orderId }, lock: { mode: 'pessimistic_write' } });
      if (!order || order.status !== 'pending') return null;
      const withUser = await m.findOne(Order, { where: { id: orderId }, relations: { user: true } });
      order.status = 'paid';
      order.paymentMethod = info.method;
      order.paymentRef = info.paymentRef;
      order.paidAt = new Date();
      if (admin) order.handledById = admin.id;
      if (note !== undefined) order.adminNote = clean(note) || null;
      await m.save(order);
      const userId = withUser!.user.id;
      for (const line of order.items) {
        const exists = await m.exists(Enrollment, { where: { user: { id: userId }, itemType: line.itemType, itemId: line.itemId } });
        if (!exists) {
          const image = await this.itemImage(m, line.itemType, line.itemId);
          await m.save(m.create(Enrollment, { user: { id: userId } as User, itemType: line.itemType, itemId: line.itemId, title: line.title, image }));
        }
      }
      return { order, user: withUser!.user };
    });
    if (!result) return false;
    const { order, user } = result;
    if (info.amount != null && order.chargedAmount != null && info.amount !== order.chargedAmount) {
      this.logger.warn(`${order.reference} : montant confirmé ${info.amount} ≠ montant demandé ${order.chargedAmount}.`);
    }
    await this.notifications.notify(
      user,
      order.paymentMethod === 'free' ? `Inscription validée (${order.reference})` : `Paiement reçu (${order.reference})`,
      `${order.items.map((l) => l.title).join(', ')} — votre accès est ouvert dans votre espace.`,
      'academy',
      'dashboard/academy',
    );
    await this.audit.log(admin, 'academy.order.paid', { type: 'academy_order', id: order.id, label: order.reference }, { method: order.paymentMethod, paymentRef: order.paymentRef, total: order.total });
    return true;
  }

  private async itemImage(m: import('typeorm').EntityManager, itemType: AcademyItemType, itemId: string) {
    const table = itemType === 'course' ? 'courses' : 'learning_paths';
    const rows: { image: string }[] = await m.query(`SELECT image FROM ${table} WHERE id = $1`, [itemId]);
    return rows[0]?.image ?? '';
  }

  private async cancelOrder(order: Order, admin: Admin | null, note: string | null) {
    if (order.checkoutRef) await this.gateway.expireCheckout(order.checkoutRef).catch(() => undefined);
    await this.orders.update(order.id, { status: 'cancelled', cancelledAt: new Date(), ...(admin ? { handledById: admin.id, adminNote: note } : {}) });
    const withUser = await this.orders.findOne({ where: { id: order.id }, relations: { user: true } });
    await this.audit.log(admin ?? withUser?.user ?? null, 'academy.order.cancel', { type: 'academy_order', id: order.id, label: order.reference }, { by: admin ? 'admin' : 'member', note });
    if (admin && withUser?.user) {
      await this.notifications.notify(withUser.user, `Commande ${order.reference} annulée`, note ? `Motif : ${note}` : "Votre commande a été annulée par l'équipe QIAO.", 'academy', 'dashboard/academy');
    }
  }

  // ==========================================================================
  // Administration
  // ==========================================================================

  async adminList(query: AdminOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.orders.createQueryBuilder('o').innerJoinAndSelect('o.user', 'user').orderBy('o.createdAt', 'DESC').offset((page - 1) * limit).limit(limit);
    if (query.status === 'paid') qb.andWhere(`o.status IN ('paid', 'confirmed')`);
    else if (query.status && query.status !== 'all') qb.andWhere('o.status = :status', { status: query.status });
    if (query.method && query.method !== 'all') qb.andWhere('o.paymentMethod = :method', { method: query.method });
    if (query.q?.trim()) {
      const like = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(new Brackets((w) => w.where('LOWER(o.reference) LIKE :like', { like }).orWhere('LOWER(user.fullName) LIKE :like', { like }).orWhere('LOWER(user.email) LIKE :like', { like })));
    }
    const [rows, total] = await qb.getManyAndCount();
    for (const row of rows.filter((o) => o.status === 'pending' && o.checkoutRef)) await this.reconcile(row);
    const counts: { status: string; count: string }[] = await this.orders.createQueryBuilder('o').select('o.status', 'status').addSelect('COUNT(*)', 'count').groupBy('o.status').getRawMany();
    const pendingTransfers = await this.orders.count({ where: { status: 'pending', paymentMethod: 'transfer' } });
    return {
      total,
      counts: Object.fromEntries(counts.map((c) => [c.status, Number(c.count)])),
      pendingTransfers,
      items: await Promise.all(
        rows.map(async (row) => ({ ...(await this.present(row.id)), member: { id: row.user.id, fullName: row.user.fullName, email: row.user.email, avatarUrl: row.user.avatarUrl } })),
      ),
    };
  }

  /** Virement reçu : la commande est payée et l'accès ouvert. */
  async validateTransfer(admin: Admin, orderId: string, note?: string) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.status !== 'pending') throw new ConflictException('Cette commande n’est plus en attente de paiement.');
    if (order.checkoutRef) await this.gateway.expireCheckout(order.checkoutRef).catch(() => undefined);
    await this.markPaid(order.id, { method: 'transfer', paymentRef: `virement:${order.reference}` }, admin, note);
    return this.present(order.id);
  }

  async adminCancel(admin: Admin, orderId: string, note?: string) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.status !== 'pending') throw new ConflictException('Seule une commande en attente peut être annulée (un paiement reçu se rembourse chez le prestataire).');
    await this.cancelOrder(order, admin, clean(note) || null);
    return this.present(order.id);
  }

  // ==========================================================================

  private async ownOrder(user: User, orderId: string) {
    const order = await this.orders.findOne({ where: { id: orderId, user: { id: user.id } } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  private async notifyAdmins(title: string, body: string) {
    const admins = await this.users.find({ where: { role: 'admin' } as never });
    for (const admin of admins) await this.notifications.notify(admin, title, body, 'academy', 'dashboard/admin-academy/commandes');
  }

  async present(orderId: string) {
    const order = await this.orders.findOneOrFail({ where: { id: orderId } });
    const status = order.status === 'confirmed' ? 'paid' : order.status;
    const bank = order.status === 'pending' && order.paymentMethod === 'transfer' ? (await this.settings()).bank : null;
    return {
      id: order.id,
      reference: order.reference,
      items: order.items,
      total: order.total,
      currency: order.currency,
      status,
      paymentMethod: order.paymentMethod,
      charged: order.chargedAmount != null ? { amount: order.chargedAmount / 100, currency: order.chargedCurrency, rate: order.exchangeRate ? Number(order.exchangeRate) : null } : null,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      cancelledAt: order.cancelledAt,
      adminNote: order.adminNote,
      transfer: bank ? { ...bank, amount: order.total, currency: order.currency, reference: order.reference } : null,
    };
  }
}

export const formatTnd = (amount: number) => `${amount.toLocaleString('fr-FR')} TND`;
