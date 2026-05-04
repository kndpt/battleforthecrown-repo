import { describe, expect, it } from 'vitest';
import { VILLAGE_BOUNDS, VILLAGE_LAYOUT, placementFor } from './villageLayout';

describe('villageLayout', () => {
  it('places the castle in the center column', () => {
    const castle = VILLAGE_LAYOUT.find((p) => p.type === 'CASTLE');
    expect(castle).toBeDefined();
    expect(castle!.x).toBeCloseTo(VILLAGE_BOUNDS.width / 2);
  });

  it('keeps every placement inside the bounds', () => {
    for (const placement of VILLAGE_LAYOUT) {
      expect(placement.x).toBeGreaterThanOrEqual(0);
      expect(placement.x).toBeLessThanOrEqual(VILLAGE_BOUNDS.width);
      expect(placement.y).toBeGreaterThanOrEqual(0);
      expect(placement.y).toBeLessThanOrEqual(VILLAGE_BOUNDS.height);
    }
  });

  it('has a placement for each documented building type', () => {
    const expectedTypes = [
      'CASTLE',
      'WOOD',
      'STONE',
      'IRON',
      'WAREHOUSE',
      'FARM',
      'BARRACKS',
      'WATCHTOWER',
      'WALL',
      'HIDEOUT',
    ];
    for (const type of expectedTypes) {
      expect(VILLAGE_LAYOUT.find((p) => p.type === type)).toBeDefined();
    }
  });

  it('returns a fallback placement for unknown types', () => {
    const placement = placementFor('UNKNOWN_TYPE');
    expect(placement.type).toBe('UNKNOWN_TYPE');
    expect(placement.x).toBeGreaterThanOrEqual(0);
    expect(placement.x).toBeLessThanOrEqual(VILLAGE_BOUNDS.width);
    expect(placement.y).toBeGreaterThanOrEqual(0);
    expect(placement.y).toBeLessThanOrEqual(VILLAGE_BOUNDS.height);
  });

  it('orders zIndex so the castle floats above outlying buildings', () => {
    const castle = placementFor('CASTLE');
    const wood = placementFor('WOOD');
    expect(castle.zIndex).toBeGreaterThan(wood.zIndex);
  });
});
