import type { ResourceBuildingKey } from '@/features/design-system/components';
import {
  BUILDING_TYPES,
  type BuildingType,
} from '@battleforthecrown/shared/village/buildings';

const RESOURCE_BUILDING_KEYS: Partial<Record<BuildingType, ResourceBuildingKey>> = {
  [BUILDING_TYPES.QUARTER]: 'quarter',
  [BUILDING_TYPES.IRON]: 'iron',
  [BUILDING_TYPES.STONE]: 'stone',
  [BUILDING_TYPES.WOOD]: 'wood',
};

export function getResourceBuildingKey(buildingType: string): ResourceBuildingKey | null {
  return RESOURCE_BUILDING_KEYS[buildingType as BuildingType] ?? null;
}
