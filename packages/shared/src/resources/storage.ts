import type { StorageLimits } from './types';

export const WAREHOUSE_STORAGE_LIMITS: Readonly<
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
