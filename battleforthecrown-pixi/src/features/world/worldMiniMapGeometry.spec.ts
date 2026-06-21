import { describe, expect, it } from 'vitest';
import { fitGeometry, screenToTile } from './worldMiniMapGeometry';

describe('fitGeometry', () => {
  it('centres the square plate on the short axis (wide panel)', () => {
    expect(fitGeometry(200, 100)).toEqual({ drawSize: 100, offX: 50, offY: 0 });
  });

  it('centres the square plate on the short axis (tall panel)', () => {
    expect(fitGeometry(100, 200)).toEqual({ drawSize: 100, offX: 0, offY: 50 });
  });

  it('has no letterbox when the panel is square', () => {
    expect(fitGeometry(120, 120)).toEqual({ drawSize: 120, offX: 0, offY: 0 });
  });
});

describe('screenToTile', () => {
  const grid = { width: 500, height: 500 };

  it('maps the panel centre to the grid centre (square panel)', () => {
    expect(screenToTile(50, 50, { w: 100, h: 100 }, grid)).toEqual({
      tileX: 250,
      tileY: 250,
    });
  });

  it('maps the top-left corner to tile (0, 0)', () => {
    expect(screenToTile(0, 0, { w: 100, h: 100 }, grid)).toEqual({ tileX: 0, tileY: 0 });
  });

  it('accounts for the letterbox offset (wide panel)', () => {
    // drawSize=100, offX=50, offY=0 → centre of the plate is at localX=100.
    expect(screenToTile(100, 50, { w: 200, h: 100 }, grid)).toEqual({
      tileX: 250,
      tileY: 250,
    });
  });

  it('clamps positions outside the world plate to the grid bounds', () => {
    expect(screenToTile(-40, -40, { w: 100, h: 100 }, grid)).toEqual({ tileX: 0, tileY: 0 });
    expect(screenToTile(300, 300, { w: 100, h: 100 }, grid)).toEqual({
      tileX: 500,
      tileY: 500,
    });
  });
});
