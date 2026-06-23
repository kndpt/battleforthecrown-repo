import type { PublicWorldStatus } from "@battleforthecrown/shared/world";

/**
 * A world is read-only once it has ENDED: players may still consult their
 * kingdom and the final leaderboard, but every mutating action is refused
 * server-side (`assertWorldWritable` → 403 WORLD_READ_ONLY, run 061). The HUD
 * uses this to grey out mutating CTAs without waiting for the 403 round-trip.
 *
 * Single source of truth for the front read-only decision — keep it aligned
 * with the backend guard (both keyed on `world.status`).
 */
export function isWorldReadOnly(
  status: PublicWorldStatus | null | undefined,
): boolean {
  return status === "ENDED";
}
