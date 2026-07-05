export const BUILDING_TYPES = {
  CASTLE: "CASTLE",
  WOOD: "WOOD",
  STONE: "STONE",
  IRON: "IRON",
  WAREHOUSE: "WAREHOUSE",
  HIDEOUT: "HIDEOUT",
  QUARTER: "QUARTER",
  BARRACKS: "BARRACKS",
  WATCHTOWER: "WATCHTOWER",
  COUNCIL_HALL: "COUNCIL_HALL",
  THRONE_HALL: "THRONE_HALL",
  WALL: "WALL",
} as const;

export type BuildingType = (typeof BUILDING_TYPES)[keyof typeof BUILDING_TYPES];

export interface BuildingLevelDefinition {
  wood: number;
  stone: number;
  iron: number;
  population: number;
  timeSeconds: number;
}

export interface BuildingDefinition {
  enabled: boolean;
  unlockCastleLevel?: number;
  levels: Record<number, BuildingLevelDefinition>;
}
