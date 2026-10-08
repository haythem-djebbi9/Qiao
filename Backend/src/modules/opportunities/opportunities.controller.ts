import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { ApplyOpportunityDto, OpportunitiesQueryDto } from './opportunities.dto';
import { OpportunitiesService } from './opportunities.service';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() query: OpportunitiesQueryDto, @CurrentUser() user: User | null) {
    return this.opportunitiesService.list(query, user);
  }

  @Get('applications/mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: User) {
    return this.opportunitiesService.listForUser(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.opportunitiesService.findOne(id);
  }

  @Post(':id/apply')
  @UseGuards(OptionalJwtAuthGuard)
  apply(@Param('id') id: string, @Body() dto: ApplyOpportunityDto, @CurrentUser() user: User | null) {
    return this.opportunitiesService.apply(id, dto, user);
  }
}
