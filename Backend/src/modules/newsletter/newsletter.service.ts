import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { NewsletterSubscription } from './newsletter-subscription.entity';
import { NewsletterTopic, SubscribeDto } from './newsletter.dto';

const TOPIC_LABELS: Record<NewsletterTopic, string> = {
  general: 'la newsletter QIAO',
  events: 'les invitations aux événements',
  reports: 'les alertes nouvelles publications',
  resources: 'les nouvelles ressources',
  analyses: 'les analyses QIAO Intelligence',
};

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscription)
    private readonly subscriptions: Repository<NewsletterSubscription>,
    private readonly notifications: NotificationsService,
  ) {}

  async subscribe(dto: SubscribeDto, user: User | null) {
    const email = dto.email.trim().toLowerCase();
    const topic: NewsletterTopic = dto.topic ?? 'general';
    const existing = await this.subscriptions.findOne({ where: { email } });

    if (existing?.active && existing.topics.includes(topic)) {
      return { subscribed: true, alreadySubscribed: true, topic };
    }

    const subscription = existing ?? this.subscriptions.create({ email, topics: [], source: dto.source ?? null });
    subscription.active = true;
    subscription.topics = Array.from(new Set([...subscription.topics, topic]));
    await this.subscriptions.save(subscription);

    await this.notifications.notify(
      user,
      'Abonnement confirmé',
      `Vous recevrez désormais ${TOPIC_LABELS[topic]} à l'adresse ${email}.`,
      topic === 'events' ? 'event' : 'resource',
    );
    return { subscribed: true, alreadySubscribed: false, topic };
  }
}
