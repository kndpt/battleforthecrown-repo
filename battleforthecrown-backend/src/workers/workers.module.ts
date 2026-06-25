import { Module } from '@nestjs/common';
import { PgBossModule } from '../infra/pg-boss/pg-boss.module';
import { EventModule } from '../modules/event/event.module';
import { ResourcesModule } from '../modules/resources/resources.module';
import { CrownsModule } from '../modules/crowns/crowns.module';
import { RetentionModule } from '../modules/retention/retention.module';
import { RankingsModule } from '../modules/rankings/rankings.module';
import { RenownModule } from '../modules/renown/renown.module';
import { CosmeticModule } from '../modules/cosmetic/cosmetic.module';
import { ConstructionWorker } from './construction.worker';
import { TrainingWorker } from './training.worker';
import { OutboxWorker } from './outbox.worker';
import { ProductionWorker } from './production.worker';
import { CrownProductionWorker } from './crown-production.worker';
import { WorldLifecycleWorker } from './world-lifecycle.worker';
import { OyezWorker } from './oyez.worker';
import { RankingsCycleWorker } from './rankings-cycle.worker';

@Module({
  imports: [
    PgBossModule,
    EventModule,
    ResourcesModule, // ✅ Provides ResourcesService for ConstructionWorker & ProductionWorker
    CrownsModule, // ✅ Provides CrownsService for CrownProductionWorker & ConstructionWorker
    RetentionModule, // ✅ Provides OyezProducerService for OyezWorker
    RankingsModule, // ✅ Provides RankingsService + RankingsCycleService for WorldLifecycleWorker & RankingsCycleWorker
    RenownModule, // ✅ Provides RenownService for WorldLifecycleWorker (creditRankingBonuses at ENDED)
    CosmeticModule, // ✅ Provides CosmeticAwardService for WorldLifecycleWorker (permanent titles at ENDED)
  ],
  providers: [
    ConstructionWorker,
    TrainingWorker,
    OutboxWorker,
    ProductionWorker,
    CrownProductionWorker,
    WorldLifecycleWorker,
    OyezWorker,
    RankingsCycleWorker,
  ],
  exports: [
    ConstructionWorker,
    TrainingWorker,
    OutboxWorker,
    ProductionWorker,
    CrownProductionWorker,
    WorldLifecycleWorker,
    OyezWorker,
    RankingsCycleWorker,
  ],
})
export class WorkersModule {}
