export interface Resource {
  id: string;
  name: string;
  amount: number;
  maxAmount: number;
  productionRate: number;
}

export interface CrownBalance {
  userId: string;
  worldId: string;
  balance: number;
  productionRate: number;
  lastUpdateTs: string;
}

export interface Population {
  used: number;
  max: number;
  available: number;
}

export type ResourceCost = {
  wood: number;
  stone: number;
  iron: number;
};

export type FullCost = ResourceCost & {
  population: number;
};

export type BuildingLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const BuildingType = {
  CASTLE: 'CASTLE',
  WOOD: 'WOOD',
  STONE: 'STONE',
  IRON: 'IRON',
  WAREHOUSE: 'WAREHOUSE',
  HIDEOUT: 'HIDEOUT',
  FARM: 'FARM',
  BARRACKS: 'BARRACKS',
  WATCHTOWER: 'WATCHTOWER',
  WALL: 'WALL',
} as const;
export type BuildingType = (typeof BuildingType)[keyof typeof BuildingType];

export interface Building {
  id: string;
  name?: string;
  type: BuildingType;
  level: number;
  maxLevel: number;
  position?: { x: number; y: number };
  populationCost?: number;
  isUnderConstruction?: boolean;
  constructionStartTime?: number;
  constructionEndTime?: number;
}

export const UnitType = {
  MILITIA: 'MILITIA',
  SQUIRE: 'SQUIRE',
  ARCHER: 'ARCHER',
  CAVALRY: 'CAVALRY',
  TEMPLAR: 'TEMPLAR',
  CATAPULT: 'CATAPULT',
  SPY: 'SPY',
  NOBLE: 'NOBLE',
} as const;
export type UnitType = (typeof UnitType)[keyof typeof UnitType];

export interface Unit {
  id: string;
  type: UnitType;
  quantity: number;
  populationCost: number;
}

export interface WorldMap {
  gridSize: { width: number; height: number };
  continents: Continent[];
}

export interface Continent {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  villages: VillagePosition[];
}

export interface VillagePosition {
  id: string;
  ownerId?: string;
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  status: 'active' | 'inactive' | 'protected';
}

export interface Village {
  id: string;
  name: string;
  buildings: Building[];
  units: Unit[];
  buildingQueue: BuildingQueue[];
}

export interface BuildingQueue {
  buildingId: string;
  buildingType: BuildingType;
  startTime: number;
  endTime: number;
  cost: Record<string, number>;
}

export interface Player {
  id: string;
  name: string;
  village: Village;
  resources: Resource[];
  population: Population;
  level: number;
  experience: number;
}

export interface GameState {
  player: Player;
  lastUpdate: number;
}

export const ExpeditionStatus = {
  EN_ROUTE: 'EN_ROUTE',
  RESOLVED: 'RESOLVED',
  RETURNING: 'RETURNING',
} as const;
export type ExpeditionStatus = (typeof ExpeditionStatus)[keyof typeof ExpeditionStatus];

export const TargetKind = {
  PLAYER_VILLAGE: 'PLAYER_VILLAGE',
  BARBARIAN_VILLAGE: 'BARBARIAN_VILLAGE',
} as const;
export type TargetKind = (typeof TargetKind)[keyof typeof TargetKind];

export interface Expedition {
  id: string;
  worldId: string;
  attackerVillageId: string;
  targetKind: TargetKind;
  targetRefId: string;
  targetX: number;
  targetY: number;
  units: Record<string, number>;
  status: ExpeditionStatus;
  departAt: Date | string;
  arrivalAt: Date | string;
  returnAt?: Date | string;
  reportId?: string;
  createdAt: Date | string;
}

export interface LootResources {
  wood: number;
  stone: number;
  iron: number;
}

export interface CombatLoot {
  resources?: LootResources;
  remainingResources?: LootResources;
  artifacts?: unknown[];
  honor?: number;
  items?: unknown[];
}

export interface CombatReport {
  id: string;
  worldId: string;
  attackerVillageId: string;
  attackerUserId: string;
  defenderVillageId?: string;
  defenderUserId?: string;
  targetKind: TargetKind;
  targetX: number;
  targetY: number;
  loot: CombatLoot;
  totalUnitsAttacker: Record<string, number>;
  totalUnitsDefender: Record<string, number>;
  lossesAttacker: Record<string, number>;
  lossesDefender: Record<string, number>;
  isRead: boolean;
  isAttacker: boolean;
  timestamp: Date | string;
  createdAt: Date | string;
  details?: {
    expeditionId: string;
    distance?: number;
    travelTime?: number;
  };
}

export interface CombatTarget {
  kind: TargetKind;
  refId: string;
  x: number;
  y: number;
  name?: string;
  tier?: BarbarianVillageTier;
}

export type BarbarianVillageTier = 'tier1' | 'tier2' | 'tier3';

export interface AttackPayload {
  villageId: string;
  targetX: number;
  targetY: number;
  targetKind: TargetKind;
  targetRefId: string;
  units: Record<string, number>;
}

export interface CombatUIState {
  selectedVillageForAttack?: string;
  selectedTarget?: CombatTarget;
  selectedUnits: Record<string, number>;
  isAttackPending: boolean;
  lastAttackError?: string;
  activeExpeditionsVillageId?: string;
  expandedExpeditionId?: string;
  selectedReportId?: string;
  isAttackPanelOpen: boolean;
  isReportsModalOpen: boolean;
}
