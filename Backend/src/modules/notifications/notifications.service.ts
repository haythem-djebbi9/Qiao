import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
  ) {}

  async notify(
    user: User | null | undefined,
    title: string,
    body: string,
    type: NotificationType = 'info',
    link: string | null = null,
  ): Promise<void> {
    if (!user) return;
    await this.notifications.save(this.notifications.create({ user: { id: user.id } as User, title, body, type, link }));
  }

  async list(user: User) {
    const [items, unreadCount] = await Promise.all([
      this.notifications.find({
        where: { user: { id: user.id } },
        order: { createdAt: 'DESC' },
        take: 30,
      }),
      this.notifications.count({ where: { user: { id: user.id }, read: false } }),
    ]);
    return { items, unreadCount };
  }

  async markAllRead(user: User) {
    await this.notifications.update({ user: { id: user.id }, read: false }, { read: true });
    return this.list(user);
  }

  async markRead(user: User, id: string) {
    const notification = await this.notifications.findOne({ where: { id, user: { id: user.id } } });
    if (!notification) throw new NotFoundException('Notification introuvable.');
    notification.read = true;
    await this.notifications.save(notification);
    return this.list(user);
  }

  async remove(user: User, id: string) {
    await this.notifications.delete({ id, user: { id: user.id } });
    return this.list(user);
  }
}
