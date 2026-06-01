import type { BuildingMeta } from './buildingMeta';

export function rawIconFor(_type: string, meta: BuildingMeta): string {
  return meta.iconPath ?? '/assets/lock.png';
}
