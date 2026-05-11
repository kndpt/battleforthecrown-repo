import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { AuthContextModule } from '../../common/auth';
import { WorldController } from './world.controller';
import { WorldService } from './world.service';
import { WorldConfigService } from './world-config.service';
import { WorldEntitiesQueryService } from './world-entities-query.service';
import { JoinWorldUseCase } from './join-world.use-case';
import { ResetWorldUseCase } from './reset-world.use-case';
import { BarbarianSeedingService } from './barbarian-seeding.service';
import { BarbarianRuntimeService } from './barbarian-runtime.service';
import { BarbarianVillageFactory } from './barbarian-village.factory';
import { BarbarianSeedingCatchupWorker } from './barbarian-seeding-catchup.worker';
import { VillagePlacementService } from './village-placement.service';
import { VisionService } from './vision.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), AuthContextModule],
  controllers: [WorldController],
  providers: [
    WorldService,
    WorldConfigService,
    WorldEntitiesQueryService,
    JoinWorldUseCase,
    ResetWorldUseCase,
    BarbarianSeedingService,
    BarbarianRuntimeService,
    BarbarianVillageFactory,
    BarbarianSeedingCatchupWorker,
    VillagePlacementService,
    VisionService,
  ],
  exports: [
    WorldService,
    WorldConfigService,
    WorldEntitiesQueryService,
    BarbarianSeedingService,
    BarbarianRuntimeService,
    VillagePlacementService,
    VisionService,
  ],
})
export class WorldModule {}
