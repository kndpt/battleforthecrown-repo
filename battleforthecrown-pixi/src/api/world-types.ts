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

/** Domain entity used by the WorldMap scene. Already normalized between
 *  the entities feed (barbarians, etc.) and the player villages feed. */
export interface MapEntity {
  id: string;
  kind: 'PLAYER_VILLAGE' | 'BARBARIAN_VILLAGE' | 'OTHER';
  ownerId?: string;
  isMine: boolean;
  x: number;
  y: number;
  name: string;
  tier: 'T1' | 'T2' | 'T3' | null;
}

export function entityFromWorldDto(dto: WorldEntityDto, myUserId: string | null): MapEntity {
  const kind: MapEntity['kind'] = dto.kind === 'PLAYER_VILLAGE'
    ? 'PLAYER_VILLAGE'
    : dto.kind === 'BARBARIAN_VILLAGE'
      ? 'BARBARIAN_VILLAGE'
      : 'OTHER';
  const ownerId = typeof dto.data.userId === 'string' ? dto.data.userId : undefined;
  return {
    id: dto.id,
    kind,
    ownerId,
    isMine: !!myUserId && ownerId === myUserId,
    x: dto.x,
    y: dto.y,
    name: typeof dto.data.name === 'string' ? dto.data.name : dto.id.slice(0, 6),
    tier: normalizeTier(dto.data.tier),
  };
}

export function entityFromMyVillage(dto: WorldVillageDto, myUserId: string | null): MapEntity {
  return {
    id: dto.id,
    kind: 'PLAYER_VILLAGE',
    ownerId: dto.userId ?? myUserId ?? undefined,
    isMine: true,
    x: dto.x,
    y: dto.y,
    name: dto.name,
    tier: null,
  };
}

function normalizeTier(value: unknown): MapEntity['tier'] {
  if (value === 'T1' || value === 'T2' || value === 'T3') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase().includes('1')) return 'T1';
    if (value.toLowerCase().includes('2')) return 'T2';
    if (value.toLowerCase().includes('3')) return 'T3';
  }
  return null;
}
