import type { ArmyRecruitStock, ArmyTroop } from './ArmyViewDesign';

export function computeArmyRecruitMax(troop: ArmyTroop, stock: ArmyRecruitStock): number {
  const wood = troop.cost.wood ? Math.floor(stock.wood / troop.cost.wood) : Infinity;
  const stone = troop.cost.stone ? Math.floor(stock.stone / troop.cost.stone) : Infinity;
  const iron = troop.cost.iron ? Math.floor(stock.iron / troop.cost.iron) : Infinity;
  const population = troop.pop ? Math.floor(stock.populationAvailable / troop.pop) : Infinity;
  return Math.max(0, Math.min(wood, stone, iron, population));
}
