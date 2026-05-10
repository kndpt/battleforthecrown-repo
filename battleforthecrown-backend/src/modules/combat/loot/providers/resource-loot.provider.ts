import { Injectable, Logger } from '@nestjs/common';
import { LootResolver } from '../interfaces/loot-resolver.interface';
import { LootResult } from '../interfaces/loot-result.interface';
import { CombatContext } from '../../interfaces/combat-context.interface';

@Injectable()
export class ResourceLootProvider implements LootResolver {
  private readonly logger = new Logger(ResourceLootProvider.name);

  // eslint-disable-next-line @typescript-eslint/require-await
  async resolveLoot(
    context: CombatContext,
    remainingCapacity: number,
  ): Promise<Partial<LootResult>> {
    const { defender, config } = context;

    this.logger.debug(
      `Resolving loot - defender.resources: ${JSON.stringify(defender.resources)}, capacity: ${remainingCapacity}`,
    );

    if (!defender.resources) {
      this.logger.warn('No defender resources found - returning zero loot');
      return {
        resources: { wood: 0, stone: 0, iron: 0 },
        metadata: {
          totalCapacityUsed: 0,
          totalCapacityAvailable: remainingCapacity,
          cappedByCapacity: false,
        },
      };
    }

    // Facteur de pillage (% max des ressources volables)

    const lootFactor = config.combat.lootFactor;

    // Calcul du butin potentiel (sans limite de capacité)
    const potentialLoot = {
      wood: Math.floor(defender.resources.wood * lootFactor),
      stone: Math.floor(defender.resources.stone * lootFactor),
      iron: Math.floor(defender.resources.iron * lootFactor),
    };

    // Total de ressources volables
    const totalPotential =
      potentialLoot.wood + potentialLoot.stone + potentialLoot.iron;

    // Limiter par la capacité de transport
    let actualLoot = { ...potentialLoot };
    let cappedByCapacity = false;

    if (totalPotential > remainingCapacity) {
      // Répartir proportionnellement
      const ratio = remainingCapacity / totalPotential;
      actualLoot = {
        wood: Math.floor(potentialLoot.wood * ratio),
        stone: Math.floor(potentialLoot.stone * ratio),
        iron: Math.floor(potentialLoot.iron * ratio),
      };
      cappedByCapacity = true;
    }

    const totalCapacityUsed =
      actualLoot.wood + actualLoot.stone + actualLoot.iron;

    this.logger.log(
      `Loot calculated: ${JSON.stringify(actualLoot)}, lootFactor: ${lootFactor}, capped: ${cappedByCapacity}`,
    );

    // Calculate remaining resources after looting
    const remaining = {
      wood: defender.resources.wood - actualLoot.wood,
      stone: defender.resources.stone - actualLoot.stone,
      iron: defender.resources.iron - actualLoot.iron,
    };

    return {
      resources: actualLoot,
      remainingResources: remaining,
      metadata: {
        totalCapacityUsed,
        totalCapacityAvailable: remainingCapacity,
        cappedByCapacity,
      },
    };
  }
}
