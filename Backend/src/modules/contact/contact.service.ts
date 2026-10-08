import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { ContactMessage } from './contact-message.entity';
import { CreateContactDto } from './contact.dto';

const SOURCE_LABELS: Record<CreateContactDto['source'], string> = {
  home: 'Demande de devis',
  'contact-page': 'Message',
  quote: 'Demande de devis',
  simulator: 'Demande de cotation',
  sector: 'Demande sectorielle',
  company: 'Demande de mise en relation',
  consultation: 'Demande de consultation',
};

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage) private readonly messages: Repository<ContactMessage>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateContactDto, user: User | null, file?: Express.Multer.File) {
    if (!dto.consent) {
      throw new BadRequestException('Veuillez accepter le traitement de vos données pour envoyer votre demande.');
    }

    const message = await this.messages.save(
      this.messages.create({
        source: dto.source,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        company: dto.company?.trim() || null,
        role: dto.role?.trim() || null,
        country: dto.country || null,
        sector: dto.sector || null,
        subject: dto.subject || null,
        message: dto.message.trim(),
        context: dto.context ?? null,
        attachmentName: file?.originalname ?? null,
        attachmentPath: file?.path ?? null,
        reference: await this.nextReference(),
        user: user ? ({ id: user.id } as User) : null,
      }),
    );

    await this.notifications.notify(
      user,
      `${SOURCE_LABELS[dto.source]} reçue (${message.reference})`,
      'Un conseiller QIAO vous répondra sous 24 heures ouvrées.',
      'info',
      'dashboard',
    );

    return {
      id: message.id,
      reference: message.reference,
      attachmentName: message.attachmentName,
      createdAt: message.createdAt,
    };
  }

  listForUser(user: User) {
    return this.messages.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  private async nextReference(): Promise<string> {
    const count = await this.messages.count();
    const year = new Date().getFullYear().toString().slice(-2);
    return `QIAO-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
