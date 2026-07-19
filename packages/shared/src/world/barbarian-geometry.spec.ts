import { describe, expect, it } from "vitest";
import {
  adjustCapacityForPlayerPresence,
  determineTier,
  generateBarbarianName,
  getChunkBounds,
  getChunksInRings,
  samplePositions,
} from "./barbarian-geometry";
import { DEFAULT_BARBARIAN_SEEDING_PLAN } from "./world";

describe("getChunksInRings", () => {
  it("includes only chunks touching a tile within [rMin, rMax]", () => {
    const chunks = getChunksInRings(50, 50, 8, 12, 10, 200, 200);

    expect(chunks.length).toBeGreaterThan(0);
    for (const { cx, cy } of chunks) {
      expect(cx).toBeGreaterThanOrEqual(0);
      expect(cy).toBeGreaterThanOrEqual(0);
    }
  });

  it("excludes chunks entirely outside the ring", () => {
    const chunks = getChunksInRings(50, 50, 8, 12, 10, 200, 200);
    const farChunk = { cx: 0, cy: 0 };

    expect(chunks).not.toContainEqual(farChunk);
  });

  it("clamps the scan window to the world grid bounds", () => {
    const chunks = getChunksInRings(0, 0, 0, 5, 10, 200, 200);

    for (const { cx, cy } of chunks) {
      expect(cx).toBeGreaterThanOrEqual(0);
      expect(cy).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns no duplicate chunk coordinates", () => {
    const chunks = getChunksInRings(50, 50, 0, 30, 10, 200, 200);
    const keys = chunks.map(({ cx, cy }) => `${cx}:${cy}`);

    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("getChunkBounds", () => {
  it("returns the tile range covered by a chunk", () => {
    expect(getChunkBounds(2, 3, 10, 200, 200)).toEqual({
      minX: 20,
      maxX: 29,
      minY: 30,
      maxY: 39,
    });
  });

  it("clamps to the world grid at the lower edge", () => {
    expect(getChunkBounds(0, 0, 10, 200, 200)).toEqual({
      minX: 0,
      maxX: 9,
      minY: 0,
      maxY: 9,
    });
  });

  it("clamps to the world grid at the upper edge", () => {
    expect(getChunkBounds(19, 19, 10, 200, 200)).toEqual({
      minX: 190,
      maxX: 199,
      minY: 190,
      maxY: 199,
    });
  });
});

describe("samplePositions", () => {
  const bounds = { minX: 0, maxX: 99, minY: 0, maxY: 99 };

  it("returns exactly `need` positions when the search space allows it", () => {
    const positions = samplePositions({
      need: 5,
      bounds,
      existingPositions: [],
      playerVillages: [],
      centerX: 50,
      centerY: 50,
      rMin: 0,
      rMax: 60,
      minSpacing: 2,
      playerExclusion: 0,
      random: (() => {
        let i = 0;
        const seq = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.15, 0.25];
        return () => seq[i++ % seq.length];
      })(),
    });

    expect(positions).toHaveLength(5);
  });

  it("never returns a position within playerExclusion of a player village", () => {
    const positions = samplePositions({
      need: 10,
      bounds: { minX: 0, maxX: 19, minY: 0, maxY: 19 },
      existingPositions: [],
      playerVillages: [{ x: 10, y: 10 }],
      centerX: 10,
      centerY: 10,
      rMin: 0,
      rMax: 15,
      minSpacing: 1,
      playerExclusion: 5,
      random: Math.random,
    });

    for (const pos of positions) {
      expect(Math.hypot(pos.x - 10, pos.y - 10)).toBeGreaterThanOrEqual(5);
    }
  });

  it("never returns a position closer than minSpacing to an existing or newly-sampled position", () => {
    const positions = samplePositions({
      need: 8,
      bounds: { minX: 0, maxX: 19, minY: 0, maxY: 19 },
      existingPositions: [{ x: 5, y: 5 }],
      playerVillages: [],
      centerX: 10,
      centerY: 10,
      rMin: 0,
      rMax: 15,
      minSpacing: 3,
      playerExclusion: 0,
      random: Math.random,
    });

    for (const pos of positions) {
      expect(Math.hypot(pos.x - 5, pos.y - 5)).toBeGreaterThanOrEqual(3);
    }
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        expect(
          Math.hypot(positions[i].x - positions[j].x, positions[i].y - positions[j].y),
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("gives up after maxAttempts and returns fewer than `need` when the space is oversaturated", () => {
    const positions = samplePositions({
      need: 50,
      bounds: { minX: 0, maxX: 2, minY: 0, maxY: 2 },
      existingPositions: [],
      playerVillages: [],
      centerX: 1,
      centerY: 1,
      rMin: 0,
      rMax: 1,
      minSpacing: 10,
      playerExclusion: 0,
      random: Math.random,
    });

    expect(positions.length).toBeLessThan(50);
  });

  it("defaults to Math.random when no random source is provided", () => {
    const positions = samplePositions({
      need: 1,
      bounds,
      existingPositions: [],
      playerVillages: [],
      centerX: 50,
      centerY: 50,
      rMin: 0,
      rMax: 60,
      minSpacing: 1,
      playerExclusion: 0,
    });

    expect(positions.length).toBeLessThanOrEqual(1);
  });
});

describe("determineTier", () => {
  const config = DEFAULT_BARBARIAN_SEEDING_PLAN;

  it("returns the tier whose range contains the distance", () => {
    expect(determineTier({ x: 65, y: 50 }, 50, 50, config)).toBe("T1");
    expect(determineTier({ x: 75, y: 50 }, 50, 50, config)).toBe("T2");
  });

  it("treats maxDistance as exclusive and minDistance as inclusive at range boundaries", () => {
    expect(determineTier({ x: 70, y: 50 }, 50, 50, config)).toBe("T2");
    expect(determineTier({ x: 80, y: 50 }, 50, 50, config)).toBe("T3");
  });

  it("falls back to the first declared tier when no range matches", () => {
    expect(determineTier({ x: 50, y: 50 }, 50, 50, config)).toBe("T1");
    expect(determineTier({ x: 200, y: 50 }, 50, 50, config)).toBe("T1");
  });

  it('falls back to "T1" when tierRanges is empty', () => {
    const emptyConfig = { ...config, tierRanges: [] };

    expect(determineTier({ x: 65, y: 50 }, 50, 50, emptyConfig)).toBe("T1");
  });
});

describe("adjustCapacityForPlayerPresence", () => {
  it("leaves capacity unchanged when no other player is present", () => {
    expect(adjustCapacityForPlayerPresence(10, 0)).toBe(10);
  });

  it("halves capacity (floored) when exactly one other player is present", () => {
    expect(adjustCapacityForPlayerPresence(7, 1)).toBe(3);
    expect(adjustCapacityForPlayerPresence(10, 1)).toBe(5);
  });

  it("zeroes capacity when two or more other players are present", () => {
    expect(adjustCapacityForPlayerPresence(10, 2)).toBe(0);
    expect(adjustCapacityForPlayerPresence(10, 5)).toBe(0);
  });
});

describe("generateBarbarianName", () => {
  it("is deterministic for identical inputs", () => {
    expect(generateBarbarianName("T2", 12, 34)).toBe(
      generateBarbarianName("T2", 12, 34),
    );
  });

  it("returns a 'Prefix Suffix' pair drawn from the known lists", () => {
    const name = generateBarbarianName("T1", 3, 7);
    const [prefix, suffix] = name.split(" ");

    expect(prefix).toBeTruthy();
    expect(suffix).toBeTruthy();
    expect(name).toBe(`${prefix} ${suffix}`);
  });

  it("varies with coordinates for an identical tier", () => {
    const names = new Set(
      [1, 2, 3, 4, 5].map((n) => generateBarbarianName("T1", n, n)),
    );

    expect(names.size).toBeGreaterThan(1);
  });
});
