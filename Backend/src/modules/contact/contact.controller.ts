import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CurrentUser, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { CreateContactDto } from './contact.dto';
import { ContactService } from './contact.service';

const ALLOWED_EXTENSIONS = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('attachment', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'contact'),
        filename: (_req, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowed = ALLOWED_EXTENSIONS.includes(extname(file.originalname).toLowerCase());
        callback(allowed ? null : new BadRequestException('Format de fichier non accepté (PDF, PPT, DOC, JPG ou PNG).'), allowed);
      },
    }),
  )
  create(
    @Body() dto: CreateContactDto,
    @CurrentUser() user: User | null,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.contactService.create(dto, user, file);
  }
}
