import {
  BUILDING_TYPES,
  type BuildingType,
} from '@battleforthecrown/shared/village';

export type BarbarianConquestBuildingPolicy = 'tier-level' | 'unbuilt';

export interface PlayerVillageBuildingLifecycle {
  type: BuildingType;
  initialPlayerLevel: number;
  barbarianConquest: BarbarianConquestBuildingPolicy;
}

export const PLAYER_VILLAGE_BUILDING_LIFECYCLE = [
  {
    type: BUILDING_TYPES.CASTLE,
    initialPlayerLevel: 1,
    barbarianConquest: 'tier-level',
  },
  {
    type: BUILDING_TYPES.WOOD,
    initialPlayerLevel: 1,
    barbarianConquest: 'tier-level',
  },
  {
    type: BUILDING_TYPES.STONE,
    initialPlayerLevel: 1,
    barbarianConquest: 'tier-level',
  },
  {
    type: BUILDING_TYPES.IRON,
    initialPlayerLevel: 1,
    barbarianConquest: 'tier-level',
  },
  {
    type: BUILDING_TYPES.WAREHOUSE,
    initialPlayerLevel: 1,
    barbarianConquest: 'tier-level',
  },
  {
    type: BUILDING_TYPES.QUARTER,
    initialPlayerLevel: 0,
    barbarianConquest: 'tier-level',
  },
  {
    type: BUILDING_TYPES.BARRACKS,
    initialPlayerLevel: 0,
    barbarianConquest: 'tier-level',
  },
  {
    type: BUILDING_TYPES.WATCHTOWER,
    initialPlayerLevel: 0,
    barbarianConquest: 'unbuilt',
  },
  {
    type: BUILDING_TYPES.COUNCIL_HALL,
    initialPlayerLevel: 0,
    barbarianConquest: 'unbuilt',
  },
  {
    type: BUILDING_TYPES.THRONE_HALL,
    initialPlayerLevel: 0,
    barbarianConquest: 'unbuilt',
  },
] as const satisfies readonly PlayerVillageBuildingLifecycle[];

export const getInitialPlayerVillageBuildings = (): Array<{
  type: BuildingType;
  level: number;
}> =>
  PLAYER_VILLAGE_BUILDING_LIFECYCLE.map((building) => ({
    type: building.type,
    level: building.initialPlayerLevel,
  }));

export const getBarbarianConquestVillageBuildings = (
  materializedLevel: number,
): Array<{ type: BuildingType; level: number }> =>
  PLAYER_VILLAGE_BUILDING_LIFECYCLE.map((building) => ({
    type: building.type,
    level: building.barbarianConquest === 'tier-level' ? materializedLevel : 0,
  }));
