import { BUILDING_DEFINITIONS } from './building-costs';
import { BuildingDefinition, BuildingLevelDefinition, BuildingType } from './building-types';

const BUILDING_DEFINITION_ENTRIES = Object.entries(BUILDING_DEFINITIONS) as Array<
  [BuildingType, BuildingDefinition]
>;

export const BUILDING_UNLOCK_REQUIREMENTS: Partial<Record<BuildingType, number>> =
  Object.fromEntries(
    BUILDING_DEFINITION_ENTRIES.flatMap(([type, definition]) => {
      if (definition.unlockCastleLevel === undefined) return [];
      return [[type, definition.unlockCastleLevel]];
    })
  );

export const getBuildingUnlockRequirement = (type: string): number | null =>
  BUILDING_UNLOCK_REQUIREMENTS[type as BuildingType] ?? null;

export const getBuildingDefinition = (
  buildingType: string
): BuildingDefinition => {
  const type = buildingType as BuildingType;
  const definition = BUILDING_DEFINITIONS[type];
  if (!definition) {
    throw new Error(`Unknown building type ${buildingType}`);
  }
  return definition;
};

export const getBuildingLevelValues = (
  buildingType: string,
  level: number
): BuildingLevelDefinition | null => {
  if (level < 1) return null;
  const definition = getBuildingDefinition(buildingType);
  return definition.levels[level] ?? null;
};

export const getBuildingMaxLevel = (buildingType: string): number => {
  const definition = getBuildingDefinition(buildingType);
  return Math.max(...Object.keys(definition.levels).map((lvl) => Number(lvl)));
};

export const isBuildingEnabled = (buildingType: string): boolean => {
  const definition = BUILDING_DEFINITIONS[buildingType as BuildingType];
  return definition?.enabled === true;
};

export const findBuildingByType = <T extends { type: string }>(
  buildings: ReadonlyArray<T>,
  buildingType: string
): T | undefined => buildings.find((building) => building.type === buildingType);

export const getBuildingLevel = (
  buildings: ReadonlyArray<{ type: string; level: number }>,
  buildingType: string
): number => findBuildingByType(buildings, buildingType)?.level ?? 0;
