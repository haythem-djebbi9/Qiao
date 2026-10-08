import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HsCode, RegulationProfile } from './regulation.entities';
import { RegulationsController } from './regulations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HsCode, RegulationProfile])],
  controllers: [RegulationsController],
})
export class RegulationsModule {}
