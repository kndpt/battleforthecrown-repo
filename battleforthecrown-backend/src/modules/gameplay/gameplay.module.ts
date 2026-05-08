import { Module } from '@nestjs/common';
import { PgBossModule } from '../../infra/pg-boss/pg-boss.module';
import { WorldModule } from '../world/world.module';
import { EventModule } from '../event/event.module';
import { StrategyModule } from '../strategy/strategy.module';
import { UpgradeBuildingUseCase } from './upgrade-building.use-case';
import { CancelConstructionUseCase } from './cancel-construction.use-case';
import { RecruitTroopsUseCase } from './recruit-troops.use-case';
import { CancelRecruitmentUseCase } from './cancel-recruitment.use-case';

@Module({
  imports: [PgBossModule, WorldModule, EventModule, StrategyModule],
  providers: [
    UpgradeBuildingUseCase,
    CancelConstructionUseCase,
    RecruitTroopsUseCase,
    CancelRecruitmentUseCase,
  ],
  exports: [
    UpgradeBuildingUseCase,
    CancelConstructionUseCase,
    RecruitTroopsUseCase,
    CancelRecruitmentUseCase,
  ],
})
export class GameplayModule {}
