import type { StrategyBonus } from '@battleforthecrown/shared/village';

export function applyPopulationBonus(
  baseMax: number,
  strategyBonus: Pick<StrategyBonus, 'populationBonus'> | null | undefined,
): number {
  const multiplier =
    typeof strategyBonus?.populationBonus === 'number' &&
    strategyBonus.populationBonus > 0
      ? strategyBonus.populationBonus
      : 1;
  return Math.floor(baseMax * multiplier);
}
