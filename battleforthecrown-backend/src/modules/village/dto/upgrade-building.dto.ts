import { z } from 'zod';
import {
  BUILDING_TYPES,
  type BuildingType,
  type UpgradeBuildingRequest,
} from '@battleforthecrown/shared/village';

export const upgradeBuildingSchema = z.object({
  buildingType: z.enum(
    Object.keys(BUILDING_TYPES) as [BuildingType, ...BuildingType[]],
  ),
}) satisfies z.ZodType<UpgradeBuildingRequest>;

export type UpgradeBuildingDto = UpgradeBuildingRequest;
