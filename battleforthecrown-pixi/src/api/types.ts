export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Backend `auth.service.ts` returns the user inline (not nested under `user`).
 * Snapshot in `docs/migration/06-api-contract-snapshot.md` is out of date.
 */
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
