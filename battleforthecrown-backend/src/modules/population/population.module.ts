import { Module } from '@nestjs/common';
import { PopulationController } from './population.controller';
import { PopulationService } from './population.service';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { WorldModule } from '../world/world.module';
import { StrategyModule } from '../strategy/strategy.module';

@Module({
  imports: [PrismaModule, WorldModule, StrategyModule],
  controllers: [PopulationController],
  providers: [PopulationService],
  exports: [PopulationService],
})
export class PopulationModule {}
