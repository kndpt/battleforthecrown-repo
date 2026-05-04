import type { BuildingType } from "../village/buildings";

export const RESOURCE_BUILDING_TYPES = ["WOOD", "STONE", "IRON"] as const;
export type ResourceBuildingType = (typeof RESOURCE_BUILDING_TYPES)[number];

export const RESOURCE_PRODUCTION_PER_HOUR: Readonly<Record<number, number>> =
  Object.freeze({
    1: 50,
    2: 70,
    3: 100,
    4: 135,
    5: 190,
    6: 265,
    7: 375,
    8: 525,
    9: 735,
    10: 1030,
  });

/**
 * Converti en production par minute pour les calculs serveur/clients.
 */
export const RESOURCE_PRODUCTION_PER_MINUTE: Readonly<Record<number, number>> =
  Object.freeze(
    Object.entries(RESOURCE_PRODUCTION_PER_HOUR).reduce(
      (acc, [level, hourly]) => {
        acc[Number(level)] = hourly / 60;
        return acc;
      },
      {} as Record<number, number>
    )
  );

export const RESOURCE_BUILDING_PRODUCTION_RATES: Readonly<
  Record<ResourceBuildingType, Readonly<Record<number, number>>>
> = Object.freeze({
  WOOD: RESOURCE_PRODUCTION_PER_MINUTE,
  STONE: RESOURCE_PRODUCTION_PER_MINUTE,
  IRON: RESOURCE_PRODUCTION_PER_MINUTE,
});

export const isResourceBuildingType = (
  buildingType: BuildingType | string
): buildingType is ResourceBuildingType => {
  return (RESOURCE_BUILDING_TYPES as readonly string[]).includes(
    buildingType
  );
};

/**
 * Retourne la production de base (par minute) pour un bâtiment de ressource.
 * Aucun multiplicateur (monde, stratégie, bonus) n'est appliqué ici.
 */
export function getResourceBuildingProduction(
  buildingType: ResourceBuildingType,
  level: number
): number | null {
  const table = RESOURCE_BUILDING_PRODUCTION_RATES[buildingType];
  return table[level] ?? null;
}

export function getBuildingProduction(
  buildingType: BuildingType,
  level: number
): number | null {
  if (!isResourceBuildingType(buildingType)) {
    return null;
  }
  return getResourceBuildingProduction(buildingType, level);
}
