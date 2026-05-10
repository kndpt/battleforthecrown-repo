import { type UnitMap, type UnitType } from '@battleforthecrown/shared/army';

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
  for (const [unitType, totalLoss] of Object.entries(totalLosses)) {
    const type = unitType as UnitType;
    const totalQty = totalUnits[type] || 0;
    const partQty = participantUnits[type] || 0;

    if (totalQty > 0 && partQty > 0 && totalLoss) {
      result[type] = Math.floor((totalLoss * partQty) / totalQty);
    }
  }
  return result;
}
