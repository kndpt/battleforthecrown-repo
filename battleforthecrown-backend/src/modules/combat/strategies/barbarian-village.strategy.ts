import { Injectable, Logger } from '@nestjs/common';
import { CombatStrategy, CombatResolution } from './combat-strategy.interface';
import { CombatContext } from '../interfaces/combat-context.interface';
import { LootManager } from '../loot/loot.manager';
import { calculateCombatOutcome } from '../combat-resolution';

@Injectable()
export class BarbarianVillageStrategy implements CombatStrategy {
  private readonly logger = new Logger(BarbarianVillageStrategy.name);

  constructor(private readonly lootManager: LootManager) {}

  async resolve(context: CombatContext): Promise<CombatResolution> {
    this.logger.log(
      `Resolving barbarian attack: expedition ${context.expedition.id}`,
    );

    const combatOutcome = calculateCombatOutcome(context);

    const loot = await this.lootManager.calculateLoot({
      ...context,
      attacker: {
        ...context.attacker,
        units: combatOutcome.survivingAttacker,
      },
    });

    this.logger.log(
      `Barbarian attack resolved: attacker losses ${JSON.stringify(combatOutcome.lossesAttacker)}, ` +
        `defender losses ${JSON.stringify(combatOutcome.lossesDefender)}, ` +
        `loot ${JSON.stringify(loot.resources)}`,
    );

    return {
      loot,
      lossesAttacker: combatOutcome.lossesAttacker,
      lossesDefender: combatOutcome.lossesDefender,
      survivingUnits: combatOutcome.survivingAttacker,
    };
  }
}
