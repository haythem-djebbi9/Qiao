import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../academy/academy.entities';
import { Article } from '../articles/article.entity';
import { ServiceOffering } from '../catalog/service-offering.entity';
import { Company } from '../companies/company.entities';
import { QiaoDocument } from '../documents/document.entities';
import { QiaoEvent } from '../events/event.entity';
import { Opportunity } from '../opportunities/opportunity.entities';
import { SearchController } from './search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOffering, Opportunity, QiaoDocument, QiaoEvent, Course, Company, Article])],
  controllers: [SearchController],
})
export class SearchModule {}
