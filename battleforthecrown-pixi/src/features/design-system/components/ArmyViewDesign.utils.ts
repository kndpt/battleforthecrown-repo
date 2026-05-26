import type { ArmyRecruitStock, ArmyTroop } from './ArmyViewDesign';

export function parseArmyTrainingTimeSeconds(value: string): number {
  const hours = value.match(/(\d+)h/);
  const minutes = value.match(/(\d+)m/);
  const seconds = value.match(/(\d+)s/);
  return (hours ? Number(hours[1]) * 3600 : 0)
    + (minutes ? Number(minutes[1]) * 60 : 0)
    + (seconds ? Number(seconds[1]) : 0);
}

export function computeArmyRecruitMax(troop: ArmyTroop, stock: ArmyRecruitStock): number {
  const wood = troop.cost.wood ? Math.floor(stock.wood / troop.cost.wood) : Infinity;
  const stone = troop.cost.stone ? Math.floor(stock.stone / troop.cost.stone) : Infinity;
  const iron = troop.cost.iron ? Math.floor(stock.iron / troop.cost.iron) : Infinity;
  const population = troop.pop ? Math.floor((stock.popMax - stock.population) / troop.pop) : Infinity;
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
