import type { StorageLimits } from './types';

export const WAREHOUSE_STORAGE_LIMITS: Readonly<
  Record<number, StorageLimits>
> = Object.freeze({
  1: { wood: 3000, stone: 3000, iron: 3000 },
  2: { wood: 3450, stone: 3450, iron: 3450 },
  3: { wood: 3970, stone: 3970, iron: 3970 },
  4: { wood: 4565, stone: 4565, iron: 4565 },
  5: { wood: 5250, stone: 5250, iron: 5250 },
  6: { wood: 6040, stone: 6040, iron: 6040 },
  7: { wood: 6945, stone: 6945, iron: 6945 },
  8: { wood: 7990, stone: 7990, iron: 7990 },
  9: { wood: 9190, stone: 9190, iron: 9190 },
  10: { wood: 10570, stone: 10570, iron: 10570 },
});

const definedLevels = Object.keys(WAREHOUSE_STORAGE_LIMITS).map(Number);
const minLevel = Math.min(...definedLevels);

export const getWarehouseStorageLimit = (level: number): StorageLimits => {
  return WAREHOUSE_STORAGE_LIMITS[level] ?? WAREHOUSE_STORAGE_LIMITS[minLevel];
};
