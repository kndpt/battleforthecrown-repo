import { getStrategyBonusValue, VillageStrategyType } from '../village/strategy';
import type { UnitMap } from '../army/unit-map';

export function calculateTravelTime(
  distance: number,
  speedMultiplier: number,
  slowestUnitSpeed: number,
  strategy?: VillageStrategyType
): number {
  const strategyMultiplier = strategy
    ? (getStrategyBonusValue(strategy, 'armySpeedBonus') as number)
    : 1.0;

  const finalSpeedMultiplier = speedMultiplier * strategyMultiplier;
  
  if (slowestUnitSpeed === 0 || finalSpeedMultiplier === 0) return 0;

  // Formula: (distance * minutesPerTile) / speedMultiplier
  // Result in milliseconds
  const totalMinutes = (distance * slowestUnitSpeed) / finalSpeedMultiplier;
  return Math.round(totalMinutes * 60 * 1000);
}

export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Find the slowest unit speed among a selection.
 * Convention: higher speed value = slower unit (so we take the max).
 * Returns 0 when no positive-quantity unit is found.
 */
export function findSlowestUnitSpeed(
  selectedUnits: UnitMap,
  unitStatsMap: Record<string, { speed: number }>,
): number {
  let slowestSpeed = 0;
  for (const [unitType, qty] of Object.entries(selectedUnits)) {
    if (qty && qty > 0) {
      const unitSpeed = unitStatsMap[unitType]?.speed ?? 0;
      if (unitSpeed > slowestSpeed) slowestSpeed = unitSpeed;
    }
  }
  return slowestSpeed;
}
