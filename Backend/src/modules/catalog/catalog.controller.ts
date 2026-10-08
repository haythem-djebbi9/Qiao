import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isAllFilter, matchesQuery, normalize } from '../../common/text';
import { ServiceOffering } from './service-offering.entity';

@Controller('services')
export class CatalogController {
  constructor(@InjectRepository(ServiceOffering) private readonly services: Repository<ServiceOffering>) {}

  @Get()
  async list(@Query('q') q?: string, @Query('category') category?: string) {
    const all = await this.services.find({ order: { sortOrder: 'ASC' } });
    return all.filter(
      (service) =>
        (isAllFilter(category) || normalize(service.category).includes(normalize(category))) &&
        matchesQuery(q, service.title, service.description, service.category, service.details),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const service = await this.services.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service introuvable.');
    return service;
  }
}
