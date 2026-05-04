import type { ResourceType } from "../resources/types";

export type VillageStrategyType =
  | "FORTRESS"
  | "RAIDERS"
  | "ECONOMIC"
  | "BALANCED";

export interface StrategyBonus {
  defenseBonus?: number;
  attackBonus?: number;
  lootBonus?: number;
  productionBonus?: Record<ResourceType, number>;
  constructionSpeedBonus?: number;
  trainingSpeedBonus?: number;
  armySpeedBonus?: number;
  unitCostReduction?: number;
  buildingCostReduction?: number;
  storageBonus?: number;
  populationBonus?: number;
}

export interface VillageStrategyDefinition {
  strategy: VillageStrategyType;
  bonuses: StrategyBonus;
  description: string;
  displayName: string;
}

export interface VillageStrategyPlan {
  baseChangeCost: number;
  cooldownDuration: number;
  strategies: Record<VillageStrategyType, VillageStrategyDefinition>;
}

export const BASE_VILLAGE_STRATEGY_BONUS: Required<StrategyBonus> = {
  attackBonus: 1,
  defenseBonus: 1,
  lootBonus: 1,
  productionBonus: { WOOD: 1, STONE: 1, IRON: 1 },
  constructionSpeedBonus: 1,
  trainingSpeedBonus: 1,
  armySpeedBonus: 1,
  unitCostReduction: 1,
  buildingCostReduction: 1,
  storageBonus: 1,
  populationBonus: 1,
};

export const DEFAULT_VILLAGE_STRATEGY: VillageStrategyPlan = {
  baseChangeCost: 100,
  cooldownDuration: 24,
  strategies: {
    FORTRESS: {
      strategy: "FORTRESS",
      displayName: "Forteresse",
      description:
        "Un village défensif avec des bonus de défense et de construction",
      bonuses: {
        armySpeedBonus: 0.8,
        defenseBonus: 1.25,
        storageBonus: 1.1,
      },
    },
    RAIDERS: {
      strategy: "RAIDERS",
      displayName: "Raiders",
      description:
        "Un village offensif spécialisé dans les raids et le pillage",
      bonuses: {
        defenseBonus: 0.9,
        lootBonus: 1.1,
        armySpeedBonus: 1.15,
      },
    },
    ECONOMIC: {
      strategy: "ECONOMIC",
      displayName: "Économique",
      description:
        "Un village axé sur la production de ressources et la croissance économique",
      bonuses: {
        defenseBonus: 0.9,
        attackBonus: 0.9,
        productionBonus: { WOOD: 1.2, STONE: 1.2, IRON: 1.2 },
        populationBonus: 1.1,
      },
    },
    BALANCED: {
      strategy: "BALANCED",
      displayName: "Équilibré",
      description: "Un village équilibré sans bonus ni malus significatifs",
      bonuses: {},
    },
  },
};

const fallbackStrategy = DEFAULT_VILLAGE_STRATEGY.strategies.BALANCED;

const mergeProductionBonus = (
  bonus?: Record<ResourceType, number>
): Record<ResourceType, number> => {
  const base = BASE_VILLAGE_STRATEGY_BONUS.productionBonus;
  return {
    WOOD: bonus?.WOOD ?? base.WOOD,
    STONE: bonus?.STONE ?? base.STONE,
    IRON: bonus?.IRON ?? base.IRON,
  };
};

const mergeBonus = (bonus: StrategyBonus): StrategyBonus => ({
  attackBonus: bonus.attackBonus ?? BASE_VILLAGE_STRATEGY_BONUS.attackBonus,
  defenseBonus: bonus.defenseBonus ?? BASE_VILLAGE_STRATEGY_BONUS.defenseBonus,
  lootBonus: bonus.lootBonus ?? BASE_VILLAGE_STRATEGY_BONUS.lootBonus,
  productionBonus: mergeProductionBonus(bonus.productionBonus),
  constructionSpeedBonus:
    bonus.constructionSpeedBonus ??
    BASE_VILLAGE_STRATEGY_BONUS.constructionSpeedBonus,
  trainingSpeedBonus:
    bonus.trainingSpeedBonus ?? BASE_VILLAGE_STRATEGY_BONUS.trainingSpeedBonus,
  armySpeedBonus:
    bonus.armySpeedBonus ?? BASE_VILLAGE_STRATEGY_BONUS.armySpeedBonus,
  unitCostReduction:
    bonus.unitCostReduction ?? BASE_VILLAGE_STRATEGY_BONUS.unitCostReduction,
  buildingCostReduction:
    bonus.buildingCostReduction ??
    BASE_VILLAGE_STRATEGY_BONUS.buildingCostReduction,
  storageBonus: bonus.storageBonus ?? BASE_VILLAGE_STRATEGY_BONUS.storageBonus,
  populationBonus:
    bonus.populationBonus ?? BASE_VILLAGE_STRATEGY_BONUS.populationBonus,
});

export const getVillageStrategyPlan = (): VillageStrategyPlan =>
  DEFAULT_VILLAGE_STRATEGY;

export const getStrategyDefinition = (
  strategy: VillageStrategyType
): VillageStrategyDefinition => {
  return DEFAULT_VILLAGE_STRATEGY.strategies[strategy] ?? fallbackStrategy;
};

export const getStrategyBonuses = (
  strategy: VillageStrategyType
): StrategyBonus => {
  const definition = getStrategyDefinition(strategy);
  return mergeBonus(definition.bonuses ?? {});
};

export const getStrategyBonusValue = (
  strategy: VillageStrategyType,
  bonus: keyof StrategyBonus
): number | Record<ResourceType, number> => {
  const bonuses = getStrategyBonuses(strategy);
  if (bonus === "productionBonus") {
    return (
      bonuses.productionBonus ?? BASE_VILLAGE_STRATEGY_BONUS.productionBonus
    );
  }
  const value = bonuses[bonus];
  return typeof value === "number" ? value : 1;
};
