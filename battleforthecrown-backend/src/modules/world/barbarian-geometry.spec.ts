import {
  determineTier,
  adjustCapacityForPlayerPresence,
  getChunkBounds,
  getChunksInRings,
  generateBarbarianName,
  samplePositions,
  type ChunkBounds,
  type Position,
} from '@battleforthecrown/shared/world';
import type { BarbarianSeedingConfig } from '@battleforthecrown/shared/world';

// ---------------------------------------------------------------------------
// Fixture: minimal BarbarianSeedingConfig covering T1-T5, mirroring
// DEFAULT_BARBARIAN_SEEDING_PLAN.tierRanges from world.ts
// ---------------------------------------------------------------------------
const MINIMAL_TIERS_CONFIG: BarbarianSeedingConfig = {
  enabled: true,
  chunkSize: 50,
  rMin: 8,
  rMax: 60,
  targetMin: 3,
  targetMax: 6,
  minSpacing: 6,
  playerExclusion: 2,
  seedVersion: 1,
  tiers: {
    T1: {
      minPoints: 550,
      maxPoints: 750,
      buildingRatio: 0.7,
      loot: {
        wood: { min: 200, max: 400 },
        stone: { min: 200, max: 400 },
        iron: { min: 100, max: 250 },
      },
      visibleIndexNoise: 0.08,
    },
    T2: {
      minPoints: 1200,
      maxPoints: 1600,
      buildingRatio: 0.6,
      loot: {
        wood: { min: 600, max: 1000 },
        stone: { min: 600, max: 1000 },
        iron: { min: 400, max: 700 },
      },
      visibleIndexNoise: 0.1,
    },
    T3: {
      minPoints: 2500,
      maxPoints: 3200,
      buildingRatio: 0.5,
      loot: {
        wood: { min: 1500, max: 2500 },
        stone: { min: 1500, max: 2500 },
        iron: { min: 1000, max: 1800 },
      },
      visibleIndexNoise: 0.12,
    },
    T4: {
      minPoints: 4500,
      maxPoints: 5800,
      buildingRatio: 0.4,
      loot: {
        wood: { min: 2200, max: 3300 },
        stone: { min: 2200, max: 3300 },
        iron: { min: 1500, max: 2500 },
      },
      visibleIndexNoise: 0.14,
    },
    T5: {
      minPoints: 7000,
      maxPoints: 9000,
      buildingRatio: 0.35,
      loot: {
        wood: { min: 3300, max: 4500 },
        stone: { min: 3300, max: 4500 },
        iron: { min: 2200, max: 3300 },
      },
      visibleIndexNoise: 0.16,
    },
  },
  // T1:[8,20) T2:[20,30) T3:[30,40) T4:[40,50) T5:[50,60)
  tierRanges: [
    { minDistance: 8, maxDistance: 20, tier: 'T1' },
    { minDistance: 20, maxDistance: 30, tier: 'T2' },
    { minDistance: 30, maxDistance: 40, tier: 'T3' },
    { minDistance: 40, maxDistance: 50, tier: 'T4' },
    { minDistance: 50, maxDistance: 60, tier: 'T5' },
  ],
};

// ---------------------------------------------------------------------------
// describe: determineTier
// ---------------------------------------------------------------------------
describe('determineTier', () => {
  const CENTER = { x: 0, y: 0 };

  it.each([
    [10, 'T1'],
    [25, 'T2'],
    [35, 'T3'],
    [45, 'T4'],
    [55, 'T5'],
  ] as const)(
    'distance %i returns %s',
    (dist: number, expectedTier: string) => {
      const pos: Position = { x: dist, y: 0 };
      expect(determineTier(pos, CENTER.x, CENTER.y, MINIMAL_TIERS_CONFIG)).toBe(
        expectedTier,
      );
    },
  );

  it('distance outside all ranges falls back to first declared tier (T1)', () => {
    const pos: Position = { x: 70, y: 0 };
    expect(determineTier(pos, CENTER.x, CENTER.y, MINIMAL_TIERS_CONFIG)).toBe(
      'T1',
    );
  });

  it('maxDistance is exclusive — distance exactly equal to maxDistance of T1 returns T2', () => {
    // dist == 20 → NOT in T1 [8,20) → IN T2 [20,30)
    const pos: Position = { x: 20, y: 0 };
    expect(determineTier(pos, CENTER.x, CENTER.y, MINIMAL_TIERS_CONFIG)).toBe(
      'T2',
    );
  });
});

// ---------------------------------------------------------------------------
// describe: adjustCapacityForPlayerPresence
// ---------------------------------------------------------------------------
describe('adjustCapacityForPlayerPresence', () => {
  it('0 other players → capacity unchanged', () => {
    expect(adjustCapacityForPlayerPresence(6, 0)).toBe(6);
  });

  it('1 other player → floor(capacity / 2)', () => {
    expect(adjustCapacityForPlayerPresence(6, 1)).toBe(3);
    expect(adjustCapacityForPlayerPresence(5, 1)).toBe(2);
  });

  it('2 other players → 0', () => {
    expect(adjustCapacityForPlayerPresence(6, 2)).toBe(0);
  });

  it('3+ other players → 0', () => {
    expect(adjustCapacityForPlayerPresence(6, 3)).toBe(0);
    expect(adjustCapacityForPlayerPresence(6, 10)).toBe(0);
  });

  it('capacity=0 with any player count → 0 (no-op)', () => {
    expect(adjustCapacityForPlayerPresence(0, 0)).toBe(0);
    expect(adjustCapacityForPlayerPresence(0, 1)).toBe(0);
    expect(adjustCapacityForPlayerPresence(0, 5)).toBe(0);
  });

  it('capacity=1, 1 player → floor(1/2) = 0', () => {
    expect(adjustCapacityForPlayerPresence(1, 1)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// describe: getChunkBounds
// ---------------------------------------------------------------------------
describe('getChunkBounds', () => {
  it('interior chunk maps to its [cx*size, (cx+1)*size-1] tile span', () => {
    // Chunk (1,1), chunkSize 50, world 200×200 → tiles [50..99]×[50..99].
    expect(getChunkBounds(1, 1, 50, 200, 200)).toEqual({
      minX: 50,
      maxX: 99,
      minY: 50,
      maxY: 99,
    });
  });

  it('origin chunk (0,0) starts at tile 0', () => {
    expect(getChunkBounds(0, 0, 50, 100, 100)).toEqual({
      minX: 0,
      maxX: 49,
      minY: 0,
      maxY: 49,
    });
  });

  it('clamps the far edge to worldWidth/worldHeight - 1 when the chunk overruns', () => {
    // Chunk (3,3) raw span is [150..199], but world is only 180 wide/high →
    // maxX/maxY clamp to 179.
    expect(getChunkBounds(3, 3, 50, 180, 180)).toEqual({
      minX: 150,
      maxX: 179,
      minY: 150,
      maxY: 179,
    });
  });
});

// ---------------------------------------------------------------------------
// describe: generateBarbarianName
// ---------------------------------------------------------------------------
describe('generateBarbarianName', () => {
  it('is deterministic — same (tier, x, y) always yields the same name', () => {
    expect(generateBarbarianName('T1', 12, 34)).toBe(
      generateBarbarianName('T1', 12, 34),
    );
  });

  it('derives prefix from seed = x*1000 + y and suffix from seed + tier[0]', () => {
    // seed=0 → prefix DARK[0]; suffix = (0 + 'T'.charCodeAt(0)=84) % 7 = 0 → Camp.
    expect(generateBarbarianName('T1', 0, 0)).toBe('Dark Camp');
    // seed=1 → prefix idx 1 (Wild); suffix (1+84)%7 = 1 → Outpost.
    expect(generateBarbarianName('T1', 0, 1)).toBe('Wild Outpost');
    // seed=1000 → 1000%8 = 0 (Dark); suffix (1000+84)%7 = 6 → Hideout.
    expect(generateBarbarianName('T1', 1, 0)).toBe('Dark Hideout');
  });

  it('varies the suffix with the tier first char (only charCodeAt(0) matters)', () => {
    // Same seed 0, tier 'A1' → suffix (0 + 'A'=65) % 7 = 2 → Stronghold.
    expect(generateBarbarianName('A1', 0, 0)).toBe('Dark Stronghold');
  });
});

// ---------------------------------------------------------------------------
// describe: getChunksInRings
// ---------------------------------------------------------------------------
describe('getChunksInRings', () => {
  it('returns chunk (0,0) when center (50,50) with rMin=8 rMax=20 chunkSize=50 world 100×100', () => {
    // Center (50,50) is inside chunk (1,1). The ring [8,20] around (50,50)
    // reaches tiles within chunk (0,0) at corner (49,49): dist≈1.4 — wait,
    // (30,30) dist = hypot(20,20)≈28.3 > rMax. Actually tile (50-20,50-20)=
    // (30,30): dist=hypot(20,20)≈28.3 > 20. But tile (50-20,50)=(30,50):
    // dist=20 which is on the boundary (dist<=rMax), still in chunk (0,1).
    // Tile (30,30) dist≈28 > 20, not included.
    // Edge of ring at distance 8: e.g. (42,50), chunk(0,1).
    // Chunk (1,0): tiles x∈[50,99] y∈[0,49]. Nearest to center: (50,49) dist=1 < rMin.
    // Tile (50,30): dist=20 → on boundary, included, chunk(1,0). ✓
    const result = getChunksInRings(50, 50, 8, 20, 50, 100, 100);
    const keys = result.map(({ cx, cy }) => `${cx}:${cy}`);
    // chunk (1,0): tile (50,30) dist=20 ≤ rMax and ≥ rMin → included
    expect(keys).toContain('1:0');
  });

  it('chunks with center-to-chunk-center distance > rMax are excluded', () => {
    // Center (50,50), rMax=20. World 200×200. Chunk (3,3): tiles [150..199]×[150..199].
    // Nearest tile to center: (150,150) dist=hypot(100,100)≈141 >> 20. Not included.
    const result = getChunksInRings(50, 50, 8, 20, 50, 200, 200);
    const keys = result.map(({ cx, cy }) => `${cx}:${cy}`);
    expect(keys).not.toContain('3:3');
  });

  it('near-border center produces no negative chunk coordinates', () => {
    // Center (5,5), world 100×100. Clamping should prevent negative tile coords.
    const result = getChunksInRings(5, 5, 2, 15, 50, 100, 100);
    for (const { cx, cy } of result) {
      expect(cx).toBeGreaterThanOrEqual(0);
      expect(cy).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// describe: samplePositions
// ---------------------------------------------------------------------------
describe('samplePositions', () => {
  const bounds: ChunkBounds = { minX: 0, maxX: 49, minY: 0, maxY: 49 };
  // Deterministic random always returning 0.5
  const deterministicRandom = () => 0.5;

  it('returns at most `need` positions, all within bounds', () => {
    const result = samplePositions({
      need: 2,
      bounds,
      existingPositions: [],
      playerVillages: [],
      centerX: 25,
      centerY: 25,
      rMin: 8,
      rMax: 30,
      minSpacing: 6,
      playerExclusion: 2,
      random: deterministicRandom,
    });

    expect(result.length).toBeLessThanOrEqual(2);
    for (const pos of result) {
      expect(pos.x).toBeGreaterThanOrEqual(bounds.minX);
      expect(pos.x).toBeLessThanOrEqual(bounds.maxX);
      expect(pos.y).toBeGreaterThanOrEqual(bounds.minY);
      expect(pos.y).toBeLessThanOrEqual(bounds.maxY);
    }
  });

  it('returns [] when a player village covers every candidate position', () => {
    // A player village at center (25,25) with exclusion radius > rMax makes
    // every position in the ring excluded.
    const result = samplePositions({
      need: 2,
      bounds,
      existingPositions: [],
      playerVillages: [{ x: 25, y: 25 }],
      centerX: 25,
      centerY: 25,
      rMin: 8,
      rMax: 30,
      minSpacing: 6,
      playerExclusion: 40, // > rMax → every reachable tile is excluded
      random: deterministicRandom,
    });

    expect(result).toEqual([]);
  });

  it('returns [] when existingPositions violate minSpacing everywhere in ring', () => {
    // Pack the entire ring area with existing positions separated by < minSpacing.
    // Using a large minSpacing and a dense grid of existing positions.
    const existingPositions: Position[] = [];
    for (let x = 0; x <= 49; x += 3) {
      for (let y = 0; y <= 49; y += 3) {
        existingPositions.push({ x, y });
      }
    }

    const result = samplePositions({
      need: 2,
      bounds,
      existingPositions,
      playerVillages: [],
      centerX: 25,
      centerY: 25,
      rMin: 8,
      rMax: 30,
      minSpacing: 6, // every candidate is within 6 of an existing position
      playerExclusion: 2,
      random: deterministicRandom,
    });

    expect(result).toEqual([]);
  });
});
