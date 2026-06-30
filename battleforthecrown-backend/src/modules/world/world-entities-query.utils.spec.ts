import {
  computeRadiusBounds,
  presentCaptureWindow,
} from './world-entities-query.utils';

describe('computeRadiusBounds', () => {
  const grid = { gridWidth: 500, gridHeight: 500 };

  it('returns the centred window when fully inside the grid', () => {
    expect(computeRadiusBounds(grid, 100, 200, 10)).toEqual({
      minX: 90,
      maxX: 110,
      minY: 190,
      maxY: 210,
    });
  });

  it('clamps the lower bounds to 0 near the top-left edge', () => {
    expect(computeRadiusBounds(grid, 3, 0, 10)).toEqual({
      minX: 0,
      maxX: 13,
      minY: 0,
      maxY: 10,
    });
  });

  it('clamps the upper bounds to grid - 1 near the bottom-right edge (regression: maxX/maxY used to be unbounded in getVillagesInRadius)', () => {
    expect(computeRadiusBounds(grid, 495, 499, 10)).toEqual({
      minX: 485,
      maxX: 499,
      minY: 489,
      maxY: 499,
    });
  });

  it('honours non-square grid dimensions instead of the legacy hard-coded 499', () => {
    expect(
      computeRadiusBounds({ gridWidth: 800, gridHeight: 200 }, 750, 195, 60),
    ).toEqual({
      minX: 690,
      maxX: 799,
      minY: 135,
      maxY: 199,
    });
  });

  it('returns an inverted (empty) window when the centre sits past the grid — Prisma yields zero rows', () => {
    const bounds = computeRadiusBounds(grid, 600, 600, 5);
    expect(bounds.minX).toBeGreaterThan(bounds.maxX);
    expect(bounds.minY).toBeGreaterThan(bounds.maxY);
    expect(bounds).toEqual({ minX: 595, maxX: 499, minY: 595, maxY: 499 });
  });
});

describe('presentCaptureWindow', () => {
  it('returns undefined when there is no pending conquest row', () => {
    expect(presentCaptureWindow(undefined)).toBeUndefined();
  });

  it('shapes the wire payload with ISO captureUntil', () => {
    const captureUntil = new Date('2026-06-30T12:00:00.000Z');
    expect(
      presentCaptureWindow({
        id: 'pc-1',
        attackerVillageId: 'attacker-village',
        captureUntil,
      }),
    ).toEqual({
      status: 'OPEN',
      pendingConquestId: 'pc-1',
      attackerVillageId: 'attacker-village',
      captureUntil: '2026-06-30T12:00:00.000Z',
    });
  });
});
