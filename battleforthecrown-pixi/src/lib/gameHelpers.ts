import type { Resource } from './types';

export interface PlayerResources {
  wood: number;
  stone: number;
  iron: number;
  population: number;
  gold?: number;
  food?: number;
}

export type Cost = Partial<PlayerResources>;

export interface AffordabilityCheck {
  canAfford: boolean;
  missingResources: Partial<PlayerResources>;
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
  const missingResources: Partial<PlayerResources> = {};
  let canAfford = true;

  for (const [resourceKey, requiredAmount] of Object.entries(cost)) {
    const key = resourceKey as keyof PlayerResources;
    const available = playerResources[key] ?? 0;
    const required = requiredAmount ?? 0;

    if (available < required) {
      canAfford = false;
      missingResources[key] = required - available;
    }
  }

  let reason: string | undefined;
  if (!canAfford) {
    const missingKeys = Object.keys(missingResources);
    if (missingKeys.length === 1 && missingKeys[0] === 'population') {
      reason = 'Population insuffisante';
    } else if (missingKeys.includes('population')) {
      reason = 'Ressources et population insuffisantes';
    } else {
      reason = 'Ressources insuffisantes';
    }
  }

  return {
    canAfford,
    missingResources,
    reason,
  };
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

export function costIncludesPopulation(cost: Cost): boolean {
  return cost.population !== undefined && cost.population > 0;
}

export function getResourceCostsOnly(cost: Cost): Omit<Cost, 'population'> {
  return Object.fromEntries(
    Object.entries(cost).filter(([key]) => key !== 'population'),
  ) as Omit<Cost, 'population'>;
}

export function getPopulationCostOnly(cost: Cost): number {
  return cost.population ?? 0;
}
