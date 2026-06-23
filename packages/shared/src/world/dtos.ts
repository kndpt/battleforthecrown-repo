import { z } from "zod";

import type { VillageLabel } from "../village";
import type { UnitMap } from "../army/unit-map";
import { UnitMapSchema } from "../army/unit-map";
import type { VillageStrategyType } from "../village/strategy";
import { WorldIdentitySchema } from "./schemas";
import { InscriptionPhase } from "./lifecycle";

export type IntelSourceKind = "SCOUT" | "COMBAT_WIN";

export interface VillageIntelDto {
  targetVillageId: string;
  worldId: string;
  sourceKind: IntelSourceKind;
  sourceReportId: string;
  units: UnitMap;
  resources: { wood: number; stone: number; iron: number };
  wallLevel: number | null;
  strategy: VillageStrategyType | null;
  targetName: string | null;
  targetX: number;
  targetY: number;
  targetTier: string | null;
  seenAt: string;
}

/** Runtime validation of the intel endpoint response at the client boundary. */
export const VillageIntelDtoSchema = z.object({
  targetVillageId: z.string(),
  worldId: z.string(),
  sourceKind: z.enum(["SCOUT", "COMBAT_WIN"]),
  sourceReportId: z.string(),
  units: UnitMapSchema,
  resources: z.object({
    wood: z.number(),
    stone: z.number(),
    iron: z.number(),
  }),
  wallLevel: z.number().nullable(),
  strategy: z.enum(["FORTRESS", "RAIDERS", "ECONOMIC", "BALANCED"]).nullable(),
  targetName: z.string().nullable(),
  targetX: z.number(),
  targetY: z.number(),
  targetTier: z.string().nullable(),
  seenAt: z.string(),
}) satisfies z.ZodType<VillageIntelDto>;

export const PublicWorldStatusSchema = z.enum([
  "PLANNED",
  "OPEN",
  "LOCKED",
  "ENDED",
]);
export const WorldTempoProfileSchema = z.enum(["standard", "custom"]);

export const InscriptionPhaseSchema = z.enum([
  InscriptionPhase.MAIN,
  InscriptionPhase.LATE,
  InscriptionPhase.CLOSED,
]);

export const PublicWorldLifecycleSchema = z.strictObject({
  day: z.number().int().positive().nullable(),
  totalDays: z.number().int().positive(),
  inscriptionMainDays: z.number().int().positive(),
  inscriptionLateDays: z.number().int().nonnegative(),
  newbieShieldHours: z.number().int().positive(),
  inscriptionPhase: InscriptionPhaseSchema,
  startedAt: z.string().datetime().nullable(),
  endsAt: z.string().datetime().nullable(),
  plannedOpenAt: z.string().datetime().nullable(),
  /**
   * Derived archive deadline for an ENDED world (= endsAt + archiveAfterDays).
   * Null while the world has no endsAt or is not yet ENDED. Read-only UI uses
   * it to render the « archivé dans {M}j » countdown. Run 065 wires the actual
   * ENDED → ARCHIVED transition at this instant.
   */
  archiveAt: z.string().datetime().nullable(),
});

export const PublicWorldMapSchema = z.strictObject({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const PublicWorldSchema = z.strictObject({
  id: z.string().min(1),
  status: PublicWorldStatusSchema,
  identity: WorldIdentitySchema,
  lifecycle: PublicWorldLifecycleSchema,
  map: PublicWorldMapSchema,
  tempoProfile: WorldTempoProfileSchema,
  joinedCount: z.number().int().nonnegative(),
});

export const PublicWorldsResponseSchema = z.array(PublicWorldSchema);

export type PublicWorldStatus = z.infer<typeof PublicWorldStatusSchema>;
export type WorldTempoProfile = z.infer<typeof WorldTempoProfileSchema>;
export type PublicWorldLifecycle = z.infer<typeof PublicWorldLifecycleSchema>;
export type PublicWorldMap = z.infer<typeof PublicWorldMapSchema>;
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
  /** Highest watchtower level in this village (0 = none). Drives world-map unlock. */
  watchtowerLevel?: number;
}

export interface NewbieShieldState {
  endsAt: string;
  brokenAt: string | null;
  active: boolean;
}

export interface WorldMembershipResponse {
  worldId: string;
  worldName: string;
  /** Current world status. Drives read-only routing in WorldSessionGate. */
  status: PublicWorldStatus;
  role: string;
  joinedAt: string;
  lastLoginAt: string | null;
  villageCount: number;
  newbieShield?: NewbieShieldState;
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
