import type { ArmyRecruitStock, ArmyTroop } from './ArmyViewDesign';

export function computeArmyRecruitMax(troop: ArmyTroop, stock: ArmyRecruitStock): number {
  const wood = troop.cost.wood ? Math.floor(stock.wood / troop.cost.wood) : Infinity;
  const stone = troop.cost.stone ? Math.floor(stock.stone / troop.cost.stone) : Infinity;
  const iron = troop.cost.iron ? Math.floor(stock.iron / troop.cost.iron) : Infinity;
  const population = troop.pop ? Math.floor(stock.populationAvailable / troop.pop) : Infinity;
  return Math.max(0, Math.min(wood, stone, iron, population));
}

export function formatArmyTrainingDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = Math.floor(seconds % 60);
  if (hours) return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  if (minutes) return `${minutes}m ${rest.toString().padStart(2, '0')}s`;
  return `${rest}s`;
}
