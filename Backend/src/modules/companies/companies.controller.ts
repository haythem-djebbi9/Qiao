import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { CompaniesQueryDto, ContactCompanyDto } from './companies.dto';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  list(@Query() query: CompaniesQueryDto) {
    return this.companiesService.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Post(':id/contact')
  @UseGuards(OptionalJwtAuthGuard)
  contact(@Param('id') id: string, @Body() dto: ContactCompanyDto, @CurrentUser() user: User | null) {
    return this.companiesService.contact(id, dto, user);
  }
}
