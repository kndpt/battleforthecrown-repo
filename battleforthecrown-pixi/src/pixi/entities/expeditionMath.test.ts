import { describe, expect, it } from 'vitest';
import { computeProgress, pathControl, pathPointAt } from './expeditionMath';

const origin = { x: 0, y: 0 };
const target = { x: 100, y: 0 };

describe('pathControl', () => {
  it('lifts the control point off the midpoint by 25% of the distance', () => {
    const ctrl = pathControl(origin, target);
    expect(ctrl.x).toBeCloseTo(50);
    expect(Math.abs(ctrl.y)).toBeCloseTo(25);
  });

  it('returns the midpoint for a zero-length segment', () => {
    const ctrl = pathControl({ x: 10, y: 10 }, { x: 10, y: 10 });
    expect(ctrl).toEqual({ x: 10, y: 10 });
  });
});

describe('pathPointAt', () => {
  const ctrl = pathControl(origin, target);

  it('returns origin at t=0', () => {
    expect(pathPointAt(origin, ctrl, target, 0)).toEqual(origin);
  });

  it('returns target at t=1', () => {
    expect(pathPointAt(origin, ctrl, target, 1)).toEqual(target);
  });

  it('passes through the apex at t=0.5', () => {
    const apex = pathPointAt(origin, ctrl, target, 0.5);
    expect(apex.x).toBeCloseTo(50);
    expect(Math.abs(apex.y)).toBeGreaterThan(0);
  });
});

describe('computeProgress', () => {
  it('linearly interpolates EN_ROUTE between depart and arrival', () => {
    const result = computeProgress(
      { phase: 'EN_ROUTE', departAt: 0, arrivalAt: 1000 },
      400,
    );
    expect(result.t).toBeCloseTo(0.4);
    expect(result.moving).toBe(true);
    expect(result.returning).toBe(false);
  });

  it('clamps EN_ROUTE at t=1 once arrived', () => {
    const result = computeProgress({ phase: 'EN_ROUTE', departAt: 0, arrivalAt: 1000 }, 5000);
    expect(result.t).toBe(1);
    expect(result.moving).toBe(false);
  });

  it('keeps the unit on target for RESOLVED', () => {
    const result = computeProgress({ phase: 'RESOLVED', departAt: 0, arrivalAt: 1000 }, 1500);
    expect(result.t).toBe(1);
    expect(result.moving).toBe(false);
  });

  it('animates RETURNING from t=1 down to t=0', () => {
    const result = computeProgress(
      { phase: 'RETURNING', departAt: 0, arrivalAt: 1000, returnAt: 2000 },
      1500,
    );
    expect(result.t).toBeCloseTo(0.5);
    expect(result.returning).toBe(true);
    expect(result.moving).toBe(true);
  });

  it('hides the unit when RETURNED', () => {
    const result = computeProgress(
      { phase: 'RETURNED', departAt: 0, arrivalAt: 1000, returnAt: 2000 },
      3000,
    );
    expect(result.moving).toBe(false);
  });
});
