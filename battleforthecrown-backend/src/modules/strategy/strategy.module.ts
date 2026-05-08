import { Module } from '@nestjs/common';
import { VillageStrategyService } from './village-strategy.service';
import { CrownsModule } from '../crowns/crowns.module';

@Module({
  imports: [CrownsModule],
  providers: [VillageStrategyService],
  exports: [VillageStrategyService],
})
export class StrategyModule {}
