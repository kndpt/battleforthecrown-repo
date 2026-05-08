import { Injectable, Logger } from '@nestjs/common';
import { CombatStrategy, CombatResolution } from './combat-strategy.interface';
import { CombatContext } from '../interfaces/combat-context.interface';
import { LootManager } from '../loot/loot.manager';
import type { UnitMap } from '@battleforthecrown/shared/army';

@Injectable()
export class BarbarianVillageStrategy implements CombatStrategy {
  private readonly logger = new Logger(BarbarianVillageStrategy.name);

  constructor(private readonly lootManager: LootManager) {}

  async resolve(context: CombatContext): Promise<CombatResolution> {
    this.logger.log(
      `Resolving barbarian attack: expedition ${context.expedition.id}`,
    );

    // MVP: No losses for attacker
    const lossesAttacker: UnitMap = {};
    const lossesDefender: UnitMap | null = null; // Barbarians have no troops
    const survivingUnits = { ...context.attacker.units };

    // Calculate loot via LootManager
    const loot = await this.lootManager.calculateLoot(context);

    this.logger.log(
      `Barbarian attack resolved: looted ${JSON.stringify(loot.resources)}`,
    );

    return {
      loot,
      lossesAttacker,
      lossesDefender,
      survivingUnits,
    };
  }
}
