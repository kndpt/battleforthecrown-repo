import { getStrategyBonusValue, VillageStrategyType } from '../village/strategy';

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
