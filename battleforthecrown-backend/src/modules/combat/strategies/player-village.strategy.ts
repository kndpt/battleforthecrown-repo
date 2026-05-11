import { Injectable, Logger } from '@nestjs/common';
import { CombatStrategy, CombatResolution } from './combat-strategy.interface';
import { CombatContext } from '../interfaces/combat-context.interface';
import { LootManager } from '../loot/loot.manager';
import { calculateCombatOutcome } from '../combat-resolution';

@Injectable()
export class PlayerVillageStrategy implements CombatStrategy {
  private readonly logger = new Logger(PlayerVillageStrategy.name);

  constructor(private readonly lootManager: LootManager) {}

  async resolve(context: CombatContext): Promise<CombatResolution> {
    this.logger.log(
      `Resolving PvP attack: expedition ${context.expedition.id}`,
    );

    const combatOutcome = calculateCombatOutcome(context);

    const lootContext = {
      ...context,
      attacker: {
        ...context.attacker,
        units: combatOutcome.survivingAttacker,
      },
    };
    const loot = await this.lootManager.calculateLoot(lootContext);

    this.logger.log(
      `PvP combat resolved: attacker losses ${JSON.stringify(combatOutcome.lossesAttacker)}, ` +
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
