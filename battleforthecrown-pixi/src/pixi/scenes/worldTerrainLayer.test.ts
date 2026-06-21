import { describe, expect, it } from 'vitest';
import { chunkRangeForTileBox } from './worldTerrainLayer';
import type { TileBox } from './isoProjection';

// World: 500×500 tiles, 20 tiles/chunk → 25×25 chunks (indices 0..24).
const CHUNK = 20;
const COLS = 25;
const ROWS = 25;

describe('chunkRangeForTileBox', () => {
  it('maps a central tile box to the covering chunks plus the margin ring', () => {
    const box: TileBox = { minX: 200, minY: 200, maxX: 260, maxY: 260 };
    // tiles 200..260 → chunks 10..13, expanded by 1 → 9..14.
    expect(chunkRangeForTileBox(box, CHUNK, COLS, ROWS, 1)).toEqual({
      minCx: 9,
      maxCx: 14,
      minCy: 9,
      maxCy: 14,
    });
  });

  it('clamps to the world edges (no negative or out-of-range chunks)', () => {
    const box: TileBox = { minX: -50, minY: 480, maxX: 10, maxY: 520 };
    const range = chunkRangeForTileBox(box, CHUNK, COLS, ROWS, 1);
    expect(range.minCx).toBe(0);
    expect(range.minCy).toBeGreaterThanOrEqual(0);
    expect(range.maxCx).toBeLessThanOrEqual(COLS - 1);
    expect(range.maxCy).toBe(ROWS - 1);
  });

  it('keeps the mounted set bounded at a tight zoom', () => {
    const box: TileBox = { minX: 248, minY: 248, maxX: 252, maxY: 252 };
    const r = chunkRangeForTileBox(box, CHUNK, COLS, ROWS, 1);
    const count = (r.maxCx - r.minCx + 1) * (r.maxCy - r.minCy + 1);
    // 1 covering chunk + 1-ring margin → at most 3×3 = 9 chunks.
    expect(count).toBeLessThanOrEqual(9);
  });
});
