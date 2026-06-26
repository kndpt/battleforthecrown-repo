import { formatAnonymousPlayerName } from '@battleforthecrown/shared/auth';
import { WorldConfigSchema } from '@battleforthecrown/shared/world';
import type { PrismaClientOrTx } from './prisma.types';

/**
 * Batched lookup of `User.displayName` keyed by user id. Returns an empty map
 * for an empty input so callers can blindly `.get(userId) ?? fallback` without
 * a guard. Accepts any `PrismaClientOrTx` so it composes inside transactions
 * (final-ranking snapshot, cycle close) and out (live leaderboards).
 */
export async function loadUserDisplayNames(
  reader: PrismaClientOrTx,
  userIds: ReadonlyArray<string>,
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const users = await reader.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, displayName: true },
  });
  return new Map(users.map((user) => [user.id, user.displayName]));
}

/**
 * Public-facing player name: real `displayName` if known, anonymous
 * `Joueur XXXXXX` fallback otherwise (shared placeholder, single-sourced in
 * `@battleforthecrown/shared/auth`). Accepts a nullable `userId` so call sites
 * that may not have an owner (vacant village, deleted account) can stay branch-free.
 */
export function resolvePublicPlayerName(
  userId: string | null | undefined,
  displayNames: ReadonlyMap<string, string>,
): string {
  const real = userId ? displayNames.get(userId) : undefined;
  return real ?? formatAnonymousPlayerName(userId);
}

/**
 * World identity name surfaced on title labels (cosmetic awards, ranking-cycle
 * champions). Reads the world's parsed `identity.displayName`, gracefully
 * falling back to the raw `world.name` if the config is missing/invalid, then
 * to the world id as a last-resort placeholder.
 */
export async function resolveWorldDisplayName(
  reader: PrismaClientOrTx,
  worldId: string,
): Promise<string> {
  const world = await reader.world.findUnique({
    where: { id: worldId },
    select: { name: true, config: true },
  });
  if (!world) return worldId;
  const parsed = WorldConfigSchema.safeParse(world.config);
  return parsed.success ? parsed.data.identity.displayName : world.name;
}
