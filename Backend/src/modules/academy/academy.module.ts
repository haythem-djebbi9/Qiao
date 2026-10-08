import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademyController } from './academy.controller';
import {
  CartItem,
  Course,
  CourseFavorite,
  Enrollment,
  LearningPath,
  Order,
  TrainingDomain,
} from './academy.entities';
import { AcademyService } from './academy.service';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingDomain, Course, LearningPath, CourseFavorite, CartItem, Order, Enrollment])],
  controllers: [AcademyController],
  providers: [AcademyService],
  exports: [AcademyService],
})
export class AcademyModule {}
