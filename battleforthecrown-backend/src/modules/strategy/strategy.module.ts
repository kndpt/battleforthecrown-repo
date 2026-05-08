import { Module } from '@nestjs/common';
import { VillageStrategyService } from './village-strategy.service';

@Module({
  providers: [VillageStrategyService],
  exports: [VillageStrategyService],
})
export class StrategyModule {}
