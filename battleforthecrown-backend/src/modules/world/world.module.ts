import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { AuthContextModule } from '../../common/auth';
import { WorldController } from './world.controller';
import { PublicWorldsController } from './public-worlds.controller';
import { WorldService } from './world.service';
import { WorldConfigService } from './world-config.service';
import { WorldEntitiesQueryService } from './world-entities-query.service';
import { JoinWorldUseCase } from './join-world.use-case';
import { ResetWorldUseCase } from './reset-world.use-case';
import { BarbarianSeedingService } from './barbarian-seeding.service';
import { BarbarianRuntimeService } from './barbarian-runtime.service';
import { BarbarianVillageFactory } from './barbarian-village.factory';
import { BarbarianSeedingCatchupWorker } from './barbarian-seeding-catchup.worker';
import { OnboardingNarrativeTargetService } from './onboarding-narrative-target.service';
import { VillagePlacementService } from './village-placement.service';
import { VisionService } from './vision.service';
import { NewbieShieldService } from './newbie-shield.service';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    AuthContextModule,
    OnboardingModule,
  ],
  controllers: [WorldController, PublicWorldsController],
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
    OnboardingNarrativeTargetService,
    VillagePlacementService,
    VisionService,
    NewbieShieldService,
  ],
  exports: [
    WorldService,
    WorldConfigService,
    WorldEntitiesQueryService,
    BarbarianSeedingService,
    BarbarianRuntimeService,
    OnboardingNarrativeTargetService,
    VillagePlacementService,
    VisionService,
    NewbieShieldService,
  ],
})
export class WorldModule {}
