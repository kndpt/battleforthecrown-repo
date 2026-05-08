import { Module } from '@nestjs/common';
import { WorldModule } from '../world/world.module';
import { StrategyModule } from '../strategy/strategy.module';
import { GameplayModule } from '../gameplay/gameplay.module';
import { VillageService } from './village.service';
import { VillageController } from './village.controller';

@Module({
  imports: [WorldModule, StrategyModule, GameplayModule],
  providers: [VillageService],
  controllers: [VillageController],
  exports: [VillageService],
})
export class VillageModule {}
