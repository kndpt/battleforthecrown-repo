import { describe, expect, it } from 'vitest';
import {
  isoBoundsToTileBox,
  isoEllipseRadii,
  isoToTile,
  isoWorldSize,
  makeIsoConfig,
  tileToIso,
} from './isoProjection';

const cfg = makeIsoConfig(500, 500, 32);

describe('isoProjection', () => {
  it('uses a 2:1 diamond and offsets the map fully into positive x', () => {
    expect(cfg.halfW).toBe(32);
    expect(cfg.halfH).toBe(16);
    // Leftmost tile (0, gridHeight) lands at x = 0.
    expect(tileToIso(0, 500, cfg).x).toBe(0);
    // Top tile (0,0) sits at y = 0.
    expect(tileToIso(0, 0, cfg)).toEqual({ x: 500 * 32, y: 0 });
  });

  it('round-trips tile → iso → tile', () => {
    for (const [tx, ty] of [
      [0, 0],
      [250, 250],
      [499, 1],
      [37, 412],
    ]) {
      const iso = tileToIso(tx, ty, cfg);
      const back = isoToTile(iso.x, iso.y, cfg);
      expect(back.x).toBeCloseTo(tx, 6);
      expect(back.y).toBeCloseTo(ty, 6);
    }
  });

  it('sizes the world bounding box to the diamond extent', () => {
    expect(isoWorldSize(500, 500, cfg)).toEqual({ width: 1000 * 32, height: 1000 * 16 });
  });

  it('projects a tile-space circle to a 2:1 ellipse', () => {
    const { rx, ry } = isoEllipseRadii(10, cfg);
    expect(rx / ry).toBeCloseTo(2, 6);
    expect(rx).toBeCloseTo(Math.SQRT2 * 10 * 32, 6);
  });

  it('covers the projected tile bbox of a scene rectangle', () => {
    // A scene rect centred on tile (250,250) must yield a tile box that
    // actually contains that tile, and whose corners round-trip.
    const center = tileToIso(250, 250, cfg);
    const box = isoBoundsToTileBox(
      center.x - 320,
      center.y - 160,
      center.x + 320,
      center.y + 160,
      cfg,
    );
    expect(box.minX).toBeLessThanOrEqual(250);
    expect(box.maxX).toBeGreaterThanOrEqual(250);
    expect(box.minY).toBeLessThanOrEqual(250);
    expect(box.maxY).toBeGreaterThanOrEqual(250);
    // The diamond bbox is wider in tiles than the screen rect is in pixels.
    expect(box.maxX - box.minX).toBeGreaterThan(0);
  });
});
