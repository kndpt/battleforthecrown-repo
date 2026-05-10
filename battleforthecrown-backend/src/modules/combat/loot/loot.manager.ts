import { Injectable } from '@nestjs/common';
import { ResourceLootProvider } from './providers/resource-loot.provider';
import { CombatContext } from '../interfaces/combat-context.interface';
import { LootResult } from './interfaces/loot-result.interface';
import { LootResolver } from './interfaces/loot-resolver.interface';
import { getUnitStats, type UnitMap } from '@battleforthecrown/shared/army';
import { typedEntries } from '@battleforthecrown/shared/utils';

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
    // Calculate total carry capacity
    const totalCapacity = this.calculateTotalCarryCapacity(
      context.attacker.units,
    );

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

  /**
   * Calculate total carry capacity of units
   */
  private calculateTotalCarryCapacity(units: UnitMap): number {
    let total = 0;

    for (const [unitType, quantity] of typedEntries(units)) {
      const stats = getUnitStats(unitType);
      if (stats && stats.carryCapacity) {
        total += stats.carryCapacity * quantity;
      }
    }

    return total;
  }
}
