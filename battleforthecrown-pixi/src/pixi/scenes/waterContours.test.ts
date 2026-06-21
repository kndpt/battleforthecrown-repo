import { describe, expect, it } from 'vitest';
import {
  extractWaterContours,
  loopArea,
  pointInLoop,
  smoothLoops,
  type Field,
} from './waterContours';

const GRID = 40;

/** Water disc centred in the grid (negative inside). */
const disc =
  (cx: number, cy: number, r: number): Field =>
  (x, y) =>
    Math.hypot(x - cx, y - cy) - r;

describe('waterContours', () => {
  it('extracts a single closed loop for a water disc', () => {
    const loops = extractWaterContours(GRID, GRID, disc(20, 20, 8));
    expect(loops).toHaveLength(1);
    const loop = loops[0];
    expect(loop.length).toBeGreaterThan(8);
    // Closed loop encloses the centre.
    expect(pointInLoop({ x: 20, y: 20 }, loop)).toBe(true);
    // A point well outside the disc is not enclosed.
    expect(pointInLoop({ x: 2, y: 2 }, loop)).toBe(false);
  });

  it('keeps loop vertices near the disc radius', () => {
    const loops = extractWaterContours(GRID, GRID, disc(20, 20, 8));
    for (const p of loops[0]) {
      const d = Math.hypot(p.x - 20, p.y - 20);
      expect(d).toBeGreaterThan(7);
      expect(d).toBeLessThan(9);
    }
  });

  it('extracts two loops for an annulus (water ring with a land island)', () => {
    // Water where 5 < r < 12 → outer + inner (island) boundaries.
    const annulus: Field = (x, y) => {
      const r = Math.hypot(x - 20, y - 20);
      return r > 5 && r < 12 ? -1 : 1;
    };
    const loops = extractWaterContours(GRID, GRID, annulus);
    expect(loops.length).toBe(2);
    // The island centre is land (inside the inner loop, but that loop is a hole).
    const inner = loops.reduce((a, b) => (Math.abs(loopArea(a)) < Math.abs(loopArea(b)) ? a : b));
    expect(pointInLoop({ x: 20, y: 20 }, inner)).toBe(true);
  });

  it('returns no loops for an all-land field', () => {
    expect(extractWaterContours(GRID, GRID, () => 1)).toHaveLength(0);
  });

  it('smoothing increases vertex count and stays near the circle', () => {
    const loops = extractWaterContours(GRID, GRID, disc(20, 20, 8));
    const smooth = smoothLoops(loops, 2);
    expect(smooth[0].length).toBeGreaterThan(loops[0].length);
    for (const p of smooth[0]) {
      expect(Math.hypot(p.x - 20, p.y - 20)).toBeLessThan(9);
    }
  });
});
