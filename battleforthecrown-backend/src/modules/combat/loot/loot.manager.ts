import { Injectable } from '@nestjs/common';
import { ResourceLootProvider } from './providers/resource-loot.provider';
import { CombatContext } from '../interfaces/combat-context.interface';
import { LootResult } from './interfaces/loot-result.interface';
import { LootResolver } from './interfaces/loot-resolver.interface';
import { sumCarryCapacity } from '../combat.utils';
import { lootDistanceFactor } from '@battleforthecrown/shared/logic';

@Injectable()
export class LootManager {
  // List of providers (extensible)
  private readonly providers: LootResolver[];

  constructor(private readonly resourceLoot: ResourceLootProvider) {
    // Order of execution for providers
    this.providers = [
      this.resourceLoot,
      // Future: artifactLoot, honorLoot, etc.
    ];
  }

  /**
   * Calculate total loot by aggregating all providers
   */
  async calculateLoot(context: CombatContext): Promise<LootResult> {
    // Capacité de transport brute des survivants.
    const rawCapacity = sumCarryCapacity(context.attacker.units);

    // Friction logistique par distance (raid only). La conquête (Noble) et — par
    // construction — le renfort (qui ne loote pas) n'appliquent jamais le malus.
    // Arrondi `Math.floor`, aligné sur `getCaravanResourceCapacity`.
    const distanceFactor = context.config._isConquest
      ? 1
      : lootDistanceFactor(
          context.config._distance,
          context.config.combat.lootDistance,
        );
    const totalCapacity = Math.floor(rawCapacity * distanceFactor);

    let remainingCapacity = totalCapacity;
    const aggregatedLoot: LootResult = {
      metadata: {
        totalCapacityUsed: 0,
        totalCapacityAvailable: totalCapacity,
        cappedByCapacity: false,
      },
    };

    // Execute providers sequentially
    for (const provider of this.providers) {
      const partial = await provider.resolveLoot(context, remainingCapacity);

      // Merge results
      if (partial.resources) {
        aggregatedLoot.resources = partial.resources;
      }
      if (partial.remainingResources) {
        aggregatedLoot.remainingResources = partial.remainingResources;
      }
      if (partial.artifacts) {
        aggregatedLoot.artifacts = partial.artifacts;
      }
      if (partial.honor !== undefined) {
        aggregatedLoot.honor = partial.honor;
      }

      // Update remaining capacity
      if (partial.metadata) {
        remainingCapacity -= partial.metadata.totalCapacityUsed;
        aggregatedLoot.metadata.totalCapacityUsed +=
          partial.metadata.totalCapacityUsed;
        aggregatedLoot.metadata.cappedByCapacity =
          aggregatedLoot.metadata.cappedByCapacity ||
          partial.metadata.cappedByCapacity;
      }
    }

    return aggregatedLoot;
  }
}
