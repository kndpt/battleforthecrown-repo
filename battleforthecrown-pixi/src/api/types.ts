export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

export interface AuthSession extends AuthTokens {
  user: AuthUser;
}

export function toAuthSession(payload: AuthSessionResponse): AuthSession {
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: { id: payload.userId, email: payload.email },
  };
}

export interface World {
  id: string;
  name: string;
  status?: string;
  gridWidth?: number;
  gridHeight?: number;
  description?: string;
  startedAt?: string;
}

export interface WorldMembership {
  worldId: string;
  worldName: string;
  role: string;
  joinedAt: string;
  lastLoginAt: string | null;
  villageCount: number;
}

export interface JoinedVillage {
  id: string;
  name: string;
  x: number;
  y: number;
  worldId: string;
  userId?: string;
  createdAt?: string;
  isBarbarian?: boolean;
  tier?: string | null;
  conqueredAt?: string | null;
}

export interface BuildingDto {
  id: string;
  type: string;
  level: number;
  maxLevel: number;
  populationCost: number;
  isUnderConstruction: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface QueueEntryDto {
  id: string;
  type: string;
  level: number;
  startTime: string;
  endTime: string;
}

export interface PopulationDto {
  used: number;
  max: number;
  available: number;
}

export interface UpgradeResponseDto {
  id: string;
  type: string;
  currentLevel: number;
  nextLevel: number;
  startTime: string;
  endTime: string;
  cost: { wood: number; stone: number; iron: number; population: number; time: number };
  populationCost: number;
}

export interface JoinWorldResult {
  membership: {
    userId: string;
    worldId: string;
    role: string;
    joinedAt: string;
  };
  village: JoinedVillage | null;
  existingVillages: number;
  worldStatus: string;
}
