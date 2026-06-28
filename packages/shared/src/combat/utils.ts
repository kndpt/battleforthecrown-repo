import type { UnitMap } from '../army/unit-map';
import { typedEntries } from '../utils/typed-record';

export interface CasualtyStats {
  total: number;
  losses: number;
  casualtyRate: number;
}

/**
 * Calculate casualty statistics for a unit collection.
 * Returns total / losses / casualty rate as a percentage (0..100).
 */
export function calculateCasualtyStats(
  original: UnitMap,
  losses: UnitMap,
): CasualtyStats {
  const total = Object.values(original).reduce<number>(
    (sum, qty) => sum + (qty ?? 0),
    0,
  );
  const lossesTotal = Object.values(losses).reduce<number>(
    (sum, qty) => sum + (qty ?? 0),
    0,
  );
  const casualtyRate = total > 0 ? Math.round((lossesTotal / total) * 100) : 0;
  return { total, losses: lossesTotal, casualtyRate };
}

/** True if at least one attacker unit survived. */
export function isVictoryForAttacker(
  losses: UnitMap,
  original: UnitMap,
): boolean {
  for (const [unitType, originalQty] of typedEntries(original)) {
    const lost = losses[unitType] ?? 0;
    if ((originalQty ?? 0) - lost > 0) {
      return true;
    }
  }
  return false;
}
