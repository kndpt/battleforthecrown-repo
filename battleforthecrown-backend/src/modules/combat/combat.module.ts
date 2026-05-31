import { Module } from '@nestjs/common';
import { CombatController } from './combat.controller';
import { CombatService } from './combat.service';
import { CombatReportService } from './combat-report.service';
import { ReinforcementReportService } from './reinforcement-report.service';
import { CombatWorker } from './combat.worker';
import { ConquestFinalizeWorker } from './conquest-finalize.worker';
import { ReturnWorker } from './return.worker';
import { ConquestService } from './conquest.service';
import { LootManager } from './loot/loot.manager';
import { ResourceLootProvider } from './loot/providers/resource-loot.provider';
import { BarbarianVillageStrategy } from './strategies/barbarian-village.strategy';
import { PlayerVillageStrategy } from './strategies/player-village.strategy';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { WorldModule } from '../world/world.module';
import { ArmyModule } from '../army/army.module';
import { ResourcesModule } from '../resources/resources.module';
import { PgBossModule } from '../../infra/pg-boss/pg-boss.module';
import { EventModule } from '../event/event.module';

@Module({
  imports: [
    PrismaModule,
    WorldModule,
    ArmyModule,
    ResourcesModule,
    PgBossModule,
    EventModule,
  ],
  controllers: [CombatController],
  providers: [
    CombatService,
    CombatReportService,
    ReinforcementReportService,
    CombatWorker,
    ConquestFinalizeWorker,
    ReturnWorker,
    ConquestService,
    LootManager,
    ResourceLootProvider,
    BarbarianVillageStrategy,
    PlayerVillageStrategy,
  ],
  exports: [
    CombatService,
    ConquestService,
    LootManager,
    BarbarianVillageStrategy,
  ],
})
export class CombatModule {}
