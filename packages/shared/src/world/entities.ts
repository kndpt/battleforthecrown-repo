export type WorldEntityKind =
  | 'BARBARIAN_VILLAGE'
  | 'PLAYER_VILLAGE'
  | 'BARBARIAN_CASTLE'
  | string;

export interface WorldEntityDto {
  id: string;
  worldId: string;
  kind: WorldEntityKind;
  x: number;
  y: number;
  data: Record<string, unknown> & {
    tier?: 'T1' | 'T2' | 'T3' | string;
    name?: string;
    villageId?: string;
    userId?: string;
  };
}

export interface WorldEntityFogged {
  kind: 'fogged';
  id: string;
  x: number;
  y: number;
}

export type WorldEntityResponse = WorldEntityDto | WorldEntityFogged;

export function isFoggedEntity(
  entity: WorldEntityResponse,
): entity is WorldEntityFogged {
  return entity.kind === 'fogged';
}

export interface WorldVillageDto {
  id: string;
  name: string;
  worldId: string;
  userId?: string;
  x: number;
  y: number;
  isBarbarian?: boolean;
  tier?: string | null;
  createdAt?: string;
}

export type WorldTier = 'T1' | 'T2' | 'T3';

export function normalizeTier(value: unknown): WorldTier | null {
  if (value === 'T1' || value === 'T2' || value === 'T3') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase().includes('1')) return 'T1';
    if (value.toLowerCase().includes('2')) return 'T2';
    if (value.toLowerCase().includes('3')) return 'T3';
  }
  return null;
}
