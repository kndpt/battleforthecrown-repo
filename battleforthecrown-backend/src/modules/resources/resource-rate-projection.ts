import {
  RESOURCE_BUILDING_TYPES,
  type ResourceBuildingType,
} from '@battleforthecrown/shared/resources';
import { findBuildingByType } from '@battleforthecrown/shared/village';

export interface ResourceTriple {
  wood: number;
  stone: number;
  iron: number;
}

const TRIPLE_KEY_BY_BUILDING_TYPE: Readonly<
  Record<ResourceBuildingType, keyof ResourceTriple>
> = {
  WOOD: 'wood',
  STONE: 'stone',
  IRON: 'iron',
};

export function projectResourceRates(
  buildings: ReadonlyArray<{ type: string; level: number }>,
  getRate: (type: ResourceBuildingType, level: number) => number,
): ResourceTriple {
  const rates: ResourceTriple = { wood: 0, stone: 0, iron: 0 };
  for (const type of RESOURCE_BUILDING_TYPES) {
    const building = findBuildingByType(buildings, type);
    if (building) {
      rates[TRIPLE_KEY_BY_BUILDING_TYPE[type]] = getRate(type, building.level);
    }
  }
  return rates;
}

export function applyResourceCatchup(
  stock: ResourceTriple,
  ratesPerMinute: ResourceTriple,
  elapsedMinutes: number,
  cap: number,
): ResourceTriple {
  // Clamp negative elapsed time (clock skew / DB-vs-app drift) to 0 so the
  // catch-up never silently decrements stocks below their persisted value.
  const safeElapsedMinutes = Math.max(0, elapsedMinutes);
  return {
    wood: Math.min(
      stock.wood + Math.floor(ratesPerMinute.wood * safeElapsedMinutes),
      cap,
    ),
    stone: Math.min(
      stock.stone + Math.floor(ratesPerMinute.stone * safeElapsedMinutes),
      cap,
    ),
    iron: Math.min(
      stock.iron + Math.floor(ratesPerMinute.iron * safeElapsedMinutes),
      cap,
    ),
  };
}
