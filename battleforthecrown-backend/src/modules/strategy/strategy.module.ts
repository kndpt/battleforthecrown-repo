import { Module } from '@nestjs/common';
import { VillageStrategyService } from './village-strategy.service';
import { CrownsModule } from '../crowns/crowns.module';
import { WorldModule } from '../world/world.module';

@Module({
  imports: [CrownsModule, WorldModule],
  providers: [VillageStrategyService],
  exports: [VillageStrategyService],
})
export class StrategyModule {}
