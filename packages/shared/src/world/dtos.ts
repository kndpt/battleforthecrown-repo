import type { VillageLabel } from '../village';

export interface JoinWorldRequest {
  villageName?: string;
}

export interface SeedWorldRequest {
  userId: string;
  worldId?: string;
  barbarians?: number;
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
  label?: VillageLabel | null;
  isCapital?: boolean;
}

export interface WorldMembershipResponse {
  worldId: string;
  worldName: string;
  role: string;
  joinedAt: string;
  lastLoginAt: string | null;
  villageCount: number;
}

export interface WorldSummary {
  id: string;
  name: string;
  status?: string;
  gridWidth?: number;
  gridHeight?: number;
  description?: string;
  startedAt?: string;
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
