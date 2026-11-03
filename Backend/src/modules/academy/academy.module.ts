import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from '../payments/payments.module';
import { User } from '../users/user.entity';
import { AcademyAdminController } from './academy-admin.controller';
import { AcademyAdminService } from './academy-admin.service';
import { AcademyController } from './academy.controller';
import {
  AcademyCertificate,
  AcademyFile,
  AcademySettings,
  CartItem,
  Course,
  CourseFavorite,
  CourseModule,
  Enrollment,
  LearningPath,
  Lesson,
  LessonNote,
  LessonProgress,
  Order,
  TrainingDomain,
} from './academy.entities';
import { AcademyPaymentsService } from './academy-payments.service';
import { AcademyService } from './academy.service';
import { CertificatesService } from './certificates.service';
import { LearningService } from './learning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingDomain,
      Course,
      LearningPath,
      CourseModule,
      Lesson,
      LessonNote,
      LessonProgress,
      AcademyFile,
      AcademyCertificate,
      CourseFavorite,
      CartItem,
      Order,
      Enrollment,
      AcademySettings,
      User,
    ]),
    PaymentsModule,
  ],
  controllers: [AcademyController, AcademyAdminController],
  providers: [AcademyService, LearningService, AcademyAdminService, CertificatesService, AcademyPaymentsService],
  exports: [AcademyService],
})
export class AcademyModule {}
