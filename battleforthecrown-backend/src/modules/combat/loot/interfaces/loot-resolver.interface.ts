import { CombatContext } from '../../interfaces/combat-context.interface';
import { LootResult } from './loot-result.interface';

export interface LootResolver {
  /**
   * Calculates loot for a combat context
   * @param context Combat context with attacker and defender info
   * @param remainingCapacity Remaining carry capacity after previous providers
   * @returns Partial loot result from this provider
   */
  resolveLoot(
    context: CombatContext,
    remainingCapacity: number,
  ): Promise<Partial<LootResult>>;
}
