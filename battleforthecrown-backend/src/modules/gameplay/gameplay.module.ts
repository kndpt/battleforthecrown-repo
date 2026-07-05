import { Module } from '@nestjs/common';
import { PgBossModule } from '../../infra/pg-boss/pg-boss.module';
import { WorldModule } from '../world/world.module';
import { EventModule } from '../event/event.module';
import { StrategyModule } from '../strategy/strategy.module';
import { CrownsModule } from '../crowns/crowns.module';
import { UpgradeBuildingUseCase } from './upgrade-building.use-case';
import { CancelConstructionUseCase } from './cancel-construction.use-case';
import { RecruitTroopsUseCase } from './recruit-troops.use-case';
import { RecruitNobleUseCase } from './recruit-noble.use-case';
import { CancelRecruitmentUseCase } from './cancel-recruitment.use-case';
import { InitiateExtractionUseCase } from './initiate-extraction.use-case';
import { ExtractionLifecycleService } from './extraction-lifecycle.service';

@Module({
  imports: [
    PgBossModule,
    WorldModule,
    EventModule,
    StrategyModule,
    CrownsModule,
  ],
  providers: [
    UpgradeBuildingUseCase,
    CancelConstructionUseCase,
    RecruitTroopsUseCase,
    RecruitNobleUseCase,
    CancelRecruitmentUseCase,
    InitiateExtractionUseCase,
    ExtractionLifecycleService,
  ],
  exports: [
    UpgradeBuildingUseCase,
    CancelConstructionUseCase,
    RecruitTroopsUseCase,
    RecruitNobleUseCase,
    CancelRecruitmentUseCase,
    InitiateExtractionUseCase,
    ExtractionLifecycleService,
  ],
})
export class GameplayModule {}
