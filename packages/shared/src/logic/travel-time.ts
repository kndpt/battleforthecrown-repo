import {
  getStrategyBonusValue,
  VillageStrategyType,
} from "../village/strategy";
import type { UnitMap } from "../army/unit-map";

/**
 * Référence de vitesse : à `speed = REFERENCE_SPEED` (= 6), une unité parcourt
 * 1 tuile en 1 minute (au multiplicateur monde près). Une unité plus rapide,
 * comme le SPY à speed 100, parcourt donc 1 tuile en environ 3.6 secondes.
 */
export const REFERENCE_SPEED = 6;
export const CARAVAN_SPEED = 20;
export const CARRY_PER_PORTER = 500;
export const CARAVAN_CAPACITY_SHARE = 0.2;

export type CaravanResourceCapacity = {
  wood: number;
  stone: number;
  iron: number;
};

export function getCaravanResourceCapacity(
  storageLimits: CaravanResourceCapacity,
): CaravanResourceCapacity {
  return {
    wood: Math.floor(storageLimits.wood * CARAVAN_CAPACITY_SHARE),
    stone: Math.floor(storageLimits.stone * CARAVAN_CAPACITY_SHARE),
    iron: Math.floor(storageLimits.iron * CARAVAN_CAPACITY_SHARE),
  };
}

export function calculateTravelTime(
  distance: number,
  speedMultiplier: number,
  armySpeed: number,
  strategy?: VillageStrategyType,
): number {
  const strategyMultiplier = strategy
    ? (getStrategyBonusValue(strategy, "armySpeedBonus") as number)
    : 1.0;

  const finalSpeedMultiplier = speedMultiplier * strategyMultiplier;

  if (armySpeed === 0 || finalSpeedMultiplier === 0) return 0;

  // Échelle directe : higher speed = faster unit.
  // minutes = distance × REFERENCE_SPEED / (armySpeed × multiplier)
  const totalMinutes =
    (distance * REFERENCE_SPEED) / (armySpeed * finalSpeedMultiplier);
  return Math.round(totalMinutes * 60 * 1000);
}

export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Find the slowest unit's speed among a selection.
 * Convention: higher speed value = faster unit, so the slowest is the min
 * speed across positive-quantity units. Returns 0 when no such unit exists.
 */
export function findSlowestUnitSpeed(
  selectedUnits: UnitMap,
  unitStatsMap: Record<string, { speed: number }>,
): number {
  let slowestSpeed = Infinity;
  for (const [unitType, qty] of Object.entries(selectedUnits)) {
    if (qty && qty > 0) {
      const unitSpeed = unitStatsMap[unitType]?.speed;
      if (typeof unitSpeed === "number" && unitSpeed < slowestSpeed) {
        slowestSpeed = unitSpeed;
      }
    }
  }
  return slowestSpeed === Infinity ? 0 : slowestSpeed;
}
