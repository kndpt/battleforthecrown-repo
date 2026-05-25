import type { BarbarianSeedingConfig } from "./schemas";

export interface ChunkCoord {
  cx: number;
  cy: number;
}

export interface ChunkBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface Position {
  x: number;
  y: number;
}

/**
 * Returns every chunk that intersects the ring [rMin, rMax] around (centerX, centerY),
 * clamped to the world grid. A chunk is included as soon as one of its tiles falls
 * within the ring.
 */
export function getChunksInRings(
  centerX: number,
  centerY: number,
  rMin: number,
  rMax: number,
  chunkSize: number,
  worldWidth: number,
  worldHeight: number,
): ChunkCoord[] {
  const chunks = new Set<string>();

  const minX = Math.max(0, centerX - rMax);
  const maxX = Math.min(worldWidth - 1, centerX + rMax);
  const minY = Math.max(0, centerY - rMax);
  const maxY = Math.min(worldHeight - 1, centerY + rMax);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const dist = Math.hypot(x - centerX, y - centerY);
      if (dist >= rMin && dist <= rMax) {
        const cx = Math.floor(x / chunkSize);
        const cy = Math.floor(y / chunkSize);
        chunks.add(`${cx}:${cy}`);
      }
    }
  }

  return Array.from(chunks).map((key) => {
    const [cx, cy] = key.split(":").map(Number);
    return { cx, cy };
  });
}

export function getChunkBounds(
  cx: number,
  cy: number,
  chunkSize: number,
  worldWidth: number,
  worldHeight: number,
): ChunkBounds {
  return {
    minX: Math.max(0, cx * chunkSize),
    maxX: Math.min(worldWidth - 1, (cx + 1) * chunkSize - 1),
    minY: Math.max(0, cy * chunkSize),
    maxY: Math.min(worldHeight - 1, (cy + 1) * chunkSize - 1),
  };
}

/**
 * Picks `need` positions inside `bounds` using a Poisson-disk sampler that
 * respects the ring constraint, the player exclusion radius, and the minimum
 * spacing from existing villages and other newly-sampled positions.
 *
 * Pure modulo `Math.random` — pass the random source via the closure when you
 * need determinism.
 */
export function samplePositions(params: {
  need: number;
  bounds: ChunkBounds;
  existingPositions: Position[];
  playerVillages: Position[];
  centerX: number;
  centerY: number;
  rMin: number;
  rMax: number;
  minSpacing: number;
  playerExclusion: number;
  random?: () => number;
}): Position[] {
  const {
    need,
    bounds,
    existingPositions,
    playerVillages,
    centerX,
    centerY,
    rMin,
    rMax,
    minSpacing,
    playerExclusion,
    random = Math.random,
  } = params;

  const positions: Position[] = [];
  const maxAttempts = need * 20;
  let attempts = 0;

  while (positions.length < need && attempts < maxAttempts) {
    attempts++;

    const x = Math.floor(random() * (bounds.maxX - bounds.minX + 1) + bounds.minX);
    const y = Math.floor(random() * (bounds.maxY - bounds.minY + 1) + bounds.minY);

    const distFromCenter = Math.hypot(x - centerX, y - centerY);
    if (distFromCenter < rMin || distFromCenter > rMax) continue;

    if (
      playerVillages.some(
        (v) => Math.hypot(x - v.x, y - v.y) < playerExclusion,
      )
    ) {
      continue;
    }

    const tooClose =
      existingPositions.some(
        (e) => Math.hypot(x - e.x, y - e.y) < minSpacing,
      ) ||
      positions.some((p) => Math.hypot(x - p.x, y - p.y) < minSpacing);
    if (tooClose) continue;

    positions.push({ x, y });
  }

  return positions;
}

export function findReachableBarbarianSeedPosition(params: {
  centerX: number;
  centerY: number;
  worldWidth: number;
  worldHeight: number;
  minDistance: number;
  maxDistance: number;
  minSpacing: number;
  playerExclusion: number;
  existingPositions: Position[];
  playerVillages: Position[];
}): Position | null {
  const {
    centerX,
    centerY,
    worldWidth,
    worldHeight,
    minDistance,
    maxDistance,
    minSpacing,
    playerExclusion,
    existingPositions,
    playerVillages,
  } = params;

  const candidates: Position[] = [];
  const minX = Math.max(0, Math.floor(centerX - maxDistance));
  const maxX = Math.min(worldWidth - 1, Math.ceil(centerX + maxDistance));
  const minY = Math.max(0, Math.floor(centerY - maxDistance));
  const maxY = Math.min(worldHeight - 1, Math.ceil(centerY + maxDistance));

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const distance = Math.hypot(x - centerX, y - centerY);
      if (distance < minDistance || distance > maxDistance) continue;
      if (
        playerVillages.some(
          (village) =>
            Math.hypot(x - village.x, y - village.y) < playerExclusion,
        )
      ) {
        continue;
      }
      if (
        existingPositions.some(
          (position) => Math.hypot(x - position.x, y - position.y) < minSpacing,
        )
      ) {
        continue;
      }
      candidates.push({ x, y });
    }
  }

  candidates.sort((left, right) => {
    const leftDistance = Math.hypot(left.x - centerX, left.y - centerY);
    const rightDistance = Math.hypot(right.x - centerX, right.y - centerY);
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    if (left.y !== right.y) return left.y - right.y;
    return left.x - right.x;
  });

  return candidates[0] ?? null;
}

/**
 * Returns the tier whose distance range contains the given position. Falls back
 * to the first declared tier (or "T1") when no range matches.
 */
export function determineTier(
  pos: Position,
  centerX: number,
  centerY: number,
  config: BarbarianSeedingConfig,
): string {
  const dist = Math.hypot(pos.x - centerX, pos.y - centerY);

  for (const range of config.tierRanges) {
    if (dist >= range.minDistance && dist < range.maxDistance) {
      return range.tier;
    }
  }

  return config.tierRanges[0]?.tier || "T1";
}

const BARBARIAN_NAME_PREFIXES = [
  "Dark",
  "Wild",
  "Savage",
  "Lost",
  "Ruined",
  "Forsaken",
  "Ancient",
  "Cursed",
];

const BARBARIAN_NAME_SUFFIXES = [
  "Camp",
  "Outpost",
  "Stronghold",
  "Fort",
  "Village",
  "Settlement",
  "Hideout",
];

/**
 * Anti-submersion: when other players already have villages in the chunk halo,
 * the per-chunk barbarian capacity is throttled. Spec: docs/gameplay/07-barbarian-spawning.md
 * § Anti-submersion (par présence joueur).
 *
 * - 0 other players → capacity unchanged
 * - 1 other player  → capacity halved (floor)
 * - 2+ other players → capacity = 0 (chunk skipped)
 */
export function adjustCapacityForPlayerPresence(
  baseCapacity: number,
  distinctOtherPlayerCount: number,
): number {
  if (distinctOtherPlayerCount <= 0) return baseCapacity;
  if (distinctOtherPlayerCount === 1) return Math.floor(baseCapacity / 2);
  return 0;
}

/**
 * Deterministic name from (x, y) and tier. Same inputs always yield the same
 * name — useful for idempotent seeding.
 */
export function generateBarbarianName(
  tier: string,
  x: number,
  y: number,
): string {
  const seed = x * 1000 + y;
  const prefix = BARBARIAN_NAME_PREFIXES[seed % BARBARIAN_NAME_PREFIXES.length];
  const suffix =
    BARBARIAN_NAME_SUFFIXES[
      (seed + tier.charCodeAt(0)) % BARBARIAN_NAME_SUFFIXES.length
    ];
  return `${prefix} ${suffix}`;
}
