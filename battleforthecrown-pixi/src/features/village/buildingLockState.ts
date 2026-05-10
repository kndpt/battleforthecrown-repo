import type { BuildingDto } from '@/api';
import {
  BUILDING_UNLOCK_REQUIREMENTS,
  type BuildingType,
} from '@battleforthecrown/shared/village/buildings';

export type BuildingLockStateKind =
  | 'unbuilt-locked'
  | 'unbuilt-available'
  | 'in-progress'
  | 'available'
  | 'max';

export interface BuildingLockState {
  state: BuildingLockStateKind;
  castleLevel: number;
  requiredCastleLevel: number | null;
}

export function getBuildingLockState(
  building: BuildingDto,
  castleLevel: number,
): BuildingLockState {
  const requiredCastleLevel =
    BUILDING_UNLOCK_REQUIREMENTS[building.type as BuildingType] ?? null;

  if (
    building.isUnderConstruction ||
    (building.startTime !== null && building.endTime !== null)
  ) {
    return { state: 'in-progress', castleLevel, requiredCastleLevel };
  }

  if (building.level >= building.maxLevel) {
    return { state: 'max', castleLevel, requiredCastleLevel };
  }

  if (building.level === 0) {
    if (requiredCastleLevel !== null && castleLevel < requiredCastleLevel) {
      return { state: 'unbuilt-locked', castleLevel, requiredCastleLevel };
    }
    return { state: 'unbuilt-available', castleLevel, requiredCastleLevel };
  }

  return { state: 'available', castleLevel, requiredCastleLevel };
}
