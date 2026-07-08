import type { ResourceAmounts, StorageLimits } from './types';

const WAREHOUSE_STORAGE_LIMITS: Readonly<
  Record<number, StorageLimits>
> = Object.freeze({
  1: { wood: 3000, stone: 3000, iron: 3000 },
  2: { wood: 4200, stone: 4200, iron: 4200 },
  3: { wood: 5900, stone: 5900, iron: 5900 },
  4: { wood: 8400, stone: 8400, iron: 8400 },
  5: { wood: 12000, stone: 12000, iron: 12000 },
  6: { wood: 17500, stone: 17500, iron: 17500 },
  7: { wood: 26000, stone: 26000, iron: 26000 },
  8: { wood: 39000, stone: 39000, iron: 39000 },
  9: { wood: 58000, stone: 58000, iron: 58000 },
  10: { wood: 87000, stone: 87000, iron: 87000 },
});

const definedLevels = Object.keys(WAREHOUSE_STORAGE_LIMITS).map(Number);
const minLevel = Math.min(...definedLevels);

export const getWarehouseStorageLimit = (level: number): StorageLimits => {
  return WAREHOUSE_STORAGE_LIMITS[level] ?? WAREHOUSE_STORAGE_LIMITS[minLevel];
};

/**
 * Credits `delta` onto `current` per resource, clamping each at the single
 * warehouse cap `maxPerType` (wood/stone/iron share one cap). Single source of
 * truth for every capped-reward/regen credit site (daily cards, onboarding
 * completion, barbarian regen): each resource becomes `min(current + delta, cap)`.
 *
 * Note: preserves the historical semantics where a stock already above the cap
 * (e.g. from an uncapped credit path) is pulled back down to `cap`. Callers
 * that must not shrink an over-cap stock (e.g. loot credited against remaining
 * headroom) compute their own clamp and must not use this helper.
 */
export const creditResourcesCapped = (
  current: ResourceAmounts,
  delta: ResourceAmounts,
  maxPerType: number,
): ResourceAmounts => ({
  wood: Math.min(current.wood + delta.wood, maxPerType),
  stone: Math.min(current.stone + delta.stone, maxPerType),
  iron: Math.min(current.iron + delta.iron, maxPerType),
});
