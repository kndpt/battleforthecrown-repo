import { Module } from '@nestjs/common';
import { WorldModule } from '../world/world.module';
import { StrategyModule } from '../strategy/strategy.module';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';

@Module({
  imports: [WorldModule, StrategyModule],
  providers: [ResourcesService],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}
