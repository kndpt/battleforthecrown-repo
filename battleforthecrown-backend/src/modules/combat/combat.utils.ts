import { type UnitMap } from '@battleforthecrown/shared/army';
import { typedEntries } from '@battleforthecrown/shared/utils';

export {
  calculateCasualtyStats,
  isVictoryForAttacker,
  type CasualtyStats,
} from '@battleforthecrown/shared/combat';

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
