import { UNIT_COSTS, type UnitMap } from '@battleforthecrown/shared/army';
import { typedEntries } from '@battleforthecrown/shared/utils';

export {
  calculateCasualtyStats,
  isVictoryForAttacker,
  type CasualtyStats,
} from '@battleforthecrown/shared/combat';

/**
 * Total population freed by a set of unit losses. The pop of a dead unit is
 * released back to the village's pool — see `docs/gameplay/02-economy-and-progression.md` § Population.
 * Lives here (not in combat.worker) so ExtractionLifecycleService can import
 * it without creating a worker↔service import cycle.
 */
export function sumPopulationCost(losses: UnitMap): number {
  let total = 0;
  for (const [unitType, lossCount] of typedEntries(losses)) {
    const popCost = UNIT_COSTS[unitType]?.population;
    if (popCost && lossCount) total += popCost * lossCount;
  }
  return total;
}

/**
 * Distributes total losses proportionally to a participant's units.
 * Uses floor to round in favor of the defender.
 */
export function distributeLossesProportionally(
  totalLosses: UnitMap,
  totalUnits: UnitMap,
  participantUnits: UnitMap,
): UnitMap {
  const result: UnitMap = {};
  for (const [unitType, totalLoss] of typedEntries(totalLosses)) {
    const totalQty = totalUnits[unitType] || 0;
    const partQty = participantUnits[unitType] || 0;

    if (totalQty > 0 && partQty > 0 && totalLoss) {
      result[unitType] = Math.floor((totalLoss * partQty) / totalQty);
    }
  }
  return result;
}
