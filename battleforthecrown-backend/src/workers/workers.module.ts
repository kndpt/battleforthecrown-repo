import { Module } from '@nestjs/common';
import { PgBossModule } from '../infra/pg-boss/pg-boss.module';
import { EventModule } from '../modules/event/event.module';
import { ResourcesModule } from '../modules/resources/resources.module';
import { CrownsModule } from '../modules/crowns/crowns.module';
import { ConstructionWorker } from './construction.worker';
import { TrainingWorker } from './training.worker';
import { OutboxWorker } from './outbox.worker';
import { ProductionWorker } from './production.worker';
import { CrownProductionWorker } from './crown-production.worker';
import { WorldLifecycleWorker } from './world-lifecycle.worker';

@Module({
  imports: [
    PgBossModule,
    EventModule,
    ResourcesModule, // ✅ Provides ResourcesService for ConstructionWorker & ProductionWorker
    CrownsModule, // ✅ Provides CrownsService for CrownProductionWorker & ConstructionWorker
  ],
  providers: [
    ConstructionWorker,
    TrainingWorker,
    OutboxWorker,
    ProductionWorker,
    CrownProductionWorker,
    WorldLifecycleWorker,
  ],
  exports: [
    ConstructionWorker,
    TrainingWorker,
    OutboxWorker,
    ProductionWorker,
    CrownProductionWorker,
    WorldLifecycleWorker,
  ],
})
export class WorkersModule {}
