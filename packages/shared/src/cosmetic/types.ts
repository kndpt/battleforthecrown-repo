/** The three permanent championship titles a world can hand out at ENDED. */
export const COSMETIC_AWARD_KINDS = [
  "POWER_CHAMPION_TITLE",
  "ASSAULT_CHAMPION_TITLE",
  "RAMPART_CHAMPION_TITLE",
] as const;

export type CosmeticAwardKind = (typeof COSMETIC_AWARD_KINDS)[number];

/**
 * The final-ranking signals that can yield a cosmetic championship title.
 * Mirrors the backend `FinalRankingSignal` Prisma enum by value (string-equal),
 * kept decoupled here so the shared package never imports `@prisma/client`.
 */
export type CosmeticSourceSignal = "POWER" | "ASSAULT_GLORY" | "RAMPART_GLORY";

/** Account-global cosmetic award as exposed by `GET /users/me/cosmetic-awards`. */
export interface CosmeticAwardResponse {
  kind: CosmeticAwardKind;
  /** Snapshot of the world display name at award time (immutable, never re-read). */
  worldDisplayName: string;
  /** ISO-8601 timestamp. */
  awardedAt: string;
}
