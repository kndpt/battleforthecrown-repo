import { describe, expect, it } from 'vitest';
import {
  BIOMES,
  buildTerrainChunks,
  biomeAt,
  decorationsForChunk,
  terrainSeed,
  terrainTintAt,
  type TerrainChunk,
} from './worldTerrain';

const CONFIG = { gridWidth: 500, gridHeight: 500, chunkTiles: 20 };

function chunksFor(seed: number): TerrainChunk[] {
  return buildTerrainChunks({ ...CONFIG, seed });
}

describe('worldTerrain', () => {
  it('tiles the whole grid with clamped edge chunks', () => {
    const chunks = buildTerrainChunks({ gridWidth: 50, gridHeight: 50, chunkTiles: 20, seed: 1 });
    // 50 / 20 → 3 cols × 3 rows = 9 chunks; last column/row clamped to 10 tiles.
    expect(chunks).toHaveLength(9);
    const last = chunks[chunks.length - 1];
    expect(last.widthTiles).toBe(10);
    expect(last.heightTiles).toBe(10);
    // Full coverage: max tile reach equals the grid size.
    const maxX = Math.max(...chunks.map((c) => c.tileX + c.widthTiles));
    const maxY = Math.max(...chunks.map((c) => c.tileY + c.heightTiles));
    expect(maxX).toBe(50);
    expect(maxY).toBe(50);
  });

  it('is deterministic for the same seed', () => {
    const seed = terrainSeed(500, 500);
    const a = chunksFor(seed).map((c) => c.biome);
    const b = chunksFor(seed).map((c) => c.biome);
    expect(a).toEqual(b);
  });

  it('produces a varied biome distribution (not a single flat biome)', () => {
    const biomes = new Set(chunksFor(terrainSeed(500, 500)).map((c) => c.biome));
    // At least 3 distinct biomes across a 25×25 chunk world.
    expect(biomes.size).toBeGreaterThanOrEqual(3);
    for (const b of biomes) expect(BIOMES).toContain(b);
  });

  it('only emits valid biomes per tile', () => {
    for (let tx = 0; tx < 60; tx += 2) {
      for (let ty = 0; ty < 60; ty += 2) {
        expect(BIOMES).toContain(biomeAt(tx, ty, 42));
      }
    }
  });

  it('produces deterministic tile tints inside the RGB range', () => {
    const seed = terrainSeed(500, 500);
    for (const [tx, ty] of [
      [0, 0],
      [123, 456],
      [499, 499],
    ]) {
      const a = terrainTintAt(tx, ty, seed);
      const b = terrainTintAt(tx, ty, seed);
      expect(a).toBe(b);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(0xffffff);
    }
  });

  it('varies tint across the map (not a single flat colour)', () => {
    const seed = terrainSeed(500, 500);
    const tints = new Set<number>();
    for (let tx = 0; tx < 200; tx += 10) {
      for (let ty = 0; ty < 200; ty += 10) tints.add(terrainTintAt(tx, ty, seed));
    }
    expect(tints.size).toBeGreaterThan(50);
  });

  it('places no decorations on water and some on forest', () => {
    const water: TerrainChunk = {
      cx: 0, cy: 0, tileX: 0, tileY: 0, widthTiles: 20, heightTiles: 20, biome: 'water',
    };
    const forest: TerrainChunk = { ...water, biome: 'forest' };
    expect(decorationsForChunk(water, 1)).toHaveLength(0);
    expect(decorationsForChunk(forest, 1).length).toBeGreaterThan(0);
  });

  it('keeps decorations within the chunk tile bounds and deterministic', () => {
    const chunk: TerrainChunk = {
      cx: 2, cy: 3, tileX: 40, tileY: 60, widthTiles: 20, heightTiles: 20, biome: 'grass',
    };
    const a = decorationsForChunk(chunk, 7);
    const b = decorationsForChunk(chunk, 7);
    expect(a).toEqual(b);
    for (const d of a) {
      expect(d.tileX).toBeGreaterThanOrEqual(40);
      expect(d.tileX).toBeLessThanOrEqual(60);
      expect(d.tileY).toBeGreaterThanOrEqual(60);
      expect(d.tileY).toBeLessThanOrEqual(80);
      expect(d.scale).toBeGreaterThanOrEqual(1);
      expect(d.scale).toBeLessThanOrEqual(1.8);
    }
  });
});
