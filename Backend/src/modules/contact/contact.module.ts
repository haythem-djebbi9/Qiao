import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { ContactMessage } from './contact-message.entity';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactMessage])],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule implements OnModuleInit {
  onModuleInit() {
    mkdirSync(join(process.cwd(), 'uploads', 'contact'), { recursive: true });
  }
}
