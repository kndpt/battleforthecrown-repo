import { z } from 'zod';

import type { VillageLabel } from '../village';
import { WorldIdentitySchema } from './schemas';
import { InscriptionPhase } from './lifecycle';

export const PublicWorldStatusSchema = z.enum(['PLANNED', 'OPEN', 'LOCKED']);
export const WorldTempoProfileSchema = z.enum(['standard', 'custom']);

export const InscriptionPhaseSchema = z.enum([
  InscriptionPhase.MAIN,
  InscriptionPhase.LATE,
  InscriptionPhase.CLOSED,
]);

export const PublicWorldLifecycleSchema = z.strictObject({
  day: z.number().int().positive().nullable(),
  totalDays: z.number().int().positive(),
  inscriptionPhase: InscriptionPhaseSchema,
  startedAt: z.string().datetime().nullable(),
  endsAt: z.string().datetime().nullable(),
  plannedOpenAt: z.string().datetime().nullable(),
});

export const PublicWorldSchema = z.strictObject({
  id: z.string().min(1),
  status: PublicWorldStatusSchema,
  identity: WorldIdentitySchema,
  lifecycle: PublicWorldLifecycleSchema,
  tempoProfile: WorldTempoProfileSchema,
  joinedCount: z.number().int().nonnegative(),
});

export const PublicWorldsResponseSchema = z.array(PublicWorldSchema);

export type PublicWorldStatus = z.infer<typeof PublicWorldStatusSchema>;
export type WorldTempoProfile = z.infer<typeof WorldTempoProfileSchema>;
export type PublicWorldLifecycle = z.infer<typeof PublicWorldLifecycleSchema>;
export type PublicWorld = z.infer<typeof PublicWorldSchema>;
export type PublicWorldsResponse = z.infer<typeof PublicWorldsResponseSchema>;

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
  castleLevel?: number;
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
