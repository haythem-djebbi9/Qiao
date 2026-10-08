import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { ComputeSimulationDto, QuoteRequestDto } from './simulations.dto';
import { SimulationsService } from './simulations.service';

@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Get('rates')
  rates() {
    return this.simulationsService.rates();
  }

  @Post('compute')
  @HttpCode(200)
  compute(@Body() dto: ComputeSimulationDto) {
    return this.simulationsService.compute(dto);
  }

  @Post('quote')
  @UseGuards(OptionalJwtAuthGuard)
  quote(@Body() dto: QuoteRequestDto, @CurrentUser() user: User | null) {
    return this.simulationsService.requestQuote(dto, user);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: User) {
    return this.simulationsService.listForUser(user);
  }
}
