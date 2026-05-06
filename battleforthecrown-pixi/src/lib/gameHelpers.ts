import {
  canAffordCost as sharedCanAffordCost,
  type AffordabilityCheck as SharedAffordabilityCheck,
  type Cost,
  type PlayerResources,
} from '@battleforthecrown/shared/resources';
import type { Resource } from './types';

export type { Cost, PlayerResources } from '@battleforthecrown/shared/resources';
export {
  costIncludesPopulation,
  getResourceCostsOnly,
  getPopulationCostOnly,
} from '@battleforthecrown/shared/resources';

export interface AffordabilityCheck extends SharedAffordabilityCheck {
  reason?: string;
}

type LegacyResourcesShape = {
  wood?: number;
  stone?: number;
  iron?: number;
};

export function getAllPlayerResources(
  resources: Resource[] | LegacyResourcesShape | null | undefined,
  populationAvailable: number,
): PlayerResources {
  const playerResources: PlayerResources = {
    wood: 0,
    stone: 0,
    iron: 0,
    population: populationAvailable,
  };

  if (Array.isArray(resources)) {
    resources.forEach((resource) => {
      const key = resource.id as keyof PlayerResources;
      if (key in playerResources) {
        playerResources[key] = resource.amount;
      }
    });
    return playerResources;
  }

  if (resources && typeof resources === 'object') {
    playerResources.wood = resources.wood ?? 0;
    playerResources.stone = resources.stone ?? 0;
    playerResources.iron = resources.iron ?? 0;
  }

  return playerResources;
}

export function canAffordCost(cost: Cost, playerResources: PlayerResources): AffordabilityCheck {
  const result = sharedCanAffordCost(cost, playerResources);
  let reason: string | undefined;
  if (!result.canAfford) {
    const missingKeys = Object.keys(result.missingResources);
    if (missingKeys.length === 1 && missingKeys[0] === 'population') {
      reason = 'Population insuffisante';
    } else if (missingKeys.includes('population')) {
      reason = 'Ressources et population insuffisantes';
    } else {
      reason = 'Ressources insuffisantes';
    }
  }
  return { ...result, reason };
}

export function formatMissingResources(missing: Partial<PlayerResources>): string {
  const labels: Record<keyof PlayerResources, string> = {
    wood: 'Bois',
    stone: 'Pierre',
    iron: 'Fer',
    population: 'Population',
    gold: 'Or',
    food: 'Nourriture',
  };

  return Object.entries(missing)
    .map(([key, amount]) => `${labels[key as keyof PlayerResources]}: ${amount}`)
    .join(', ');
}
