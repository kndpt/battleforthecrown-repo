import type { StorageLimits } from './types';

export const WAREHOUSE_STORAGE_LIMITS: Readonly<
  Record<number, StorageLimits>
> = Object.freeze({
  1: { wood: 1000, stone: 1000, iron: 1000 },
  2: { wood: 1150, stone: 1150, iron: 1150 },
  3: { wood: 1323, stone: 1323, iron: 1323 },
  4: { wood: 1522, stone: 1522, iron: 1522 },
  5: { wood: 1750, stone: 1750, iron: 1750 },
});

const definedLevels = Object.keys(WAREHOUSE_STORAGE_LIMITS).map(Number);
const minLevel = Math.min(...definedLevels);

export const getWarehouseStorageLimit = (level: number): StorageLimits => {
  return WAREHOUSE_STORAGE_LIMITS[level] ?? WAREHOUSE_STORAGE_LIMITS[minLevel];
};
