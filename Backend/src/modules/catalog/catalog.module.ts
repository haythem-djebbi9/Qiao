import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './catalog.controller';
import { ServiceOffering } from './service-offering.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOffering])],
  controllers: [CatalogController],
})
export class CatalogModule {}
