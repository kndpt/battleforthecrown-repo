import { describe, expect, it } from 'vitest';
import type { UnitMap } from '../army/unit-map';
import type { LootResources } from './loot';
import {
  blurScoutResources,
  blurScoutUnits,
  deriveScoutPrecision,
  isIntelCompositionRevealed,
  isStrategyRevealed,
  representativeIntelResources,
  representativeIntelUnits,
  scoutSpyCount,
  SCOUT_PRECISION_THRESHOLDS,
} from './scout-precision';

const ARMY: UnitMap = { WARRIOR: 42, ARCHER: 7 };
const STOCK: LootResources = { wood: 1234, stone: 88, iron: 4560 };

describe('deriveScoutPrecision', () => {
  it('maps 1 spy to VAGUE', () => {
    expect(deriveScoutPrecision(1)).toBe('VAGUE');
    expect(deriveScoutPrecision(2)).toBe('VAGUE');
  });

  it('maps the RANGED threshold (3) to RANGED', () => {
    expect(deriveScoutPrecision(SCOUT_PRECISION_THRESHOLDS.ranged)).toBe(
      'RANGED',
    );
    expect(deriveScoutPrecision(9)).toBe('RANGED');
  });

  it('maps the PRECISE threshold (10) to PRECISE', () => {
    expect(deriveScoutPrecision(SCOUT_PRECISION_THRESHOLDS.precise)).toBe(
      'PRECISE',
    );
    expect(deriveScoutPrecision(50)).toBe('PRECISE');
  });

  it('never crashes on 0 / negative / non-finite (falls back to VAGUE)', () => {
    expect(deriveScoutPrecision(0)).toBe('VAGUE');
    expect(deriveScoutPrecision(-5)).toBe('VAGUE');
    expect(deriveScoutPrecision(Number.NaN)).toBe('VAGUE');
    expect(deriveScoutPrecision(2.9)).toBe('VAGUE');
  });
});

describe('scoutSpyCount', () => {
  it('reads the SPY key', () => {
    expect(scoutSpyCount({ SPY: 7 })).toBe(7);
  });

  it('falls back to the sum for a legacy payload without SPY key', () => {
    expect(scoutSpyCount({ WARRIOR: 3, ARCHER: 2 })).toBe(5);
  });

  it('returns 0 on null/undefined', () => {
    expect(scoutSpyCount(null)).toBe(0);
    expect(scoutSpyCount(undefined)).toBe(0);
  });
});

describe('blurScoutUnits', () => {
  it('PRECISE returns the exact composition', () => {
    const out = blurScoutUnits(ARMY, 'PRECISE');
    expect(out.units).toEqual(ARMY);
    expect(out.unitRanges).toBeNull();
    expect(out.armyBand).toBeNull();
  });

  it('RANGED hides exact counts behind deterministic buckets that bracket the value', () => {
    const out = blurScoutUnits(ARMY, 'RANGED');
    expect(out.units).toBeNull();
    expect(out.armyBand).toBeNull();
    // 42 -> bucket step 10 -> [40, 50], never centered on 42.
    expect(out.unitRanges?.WARRIOR).toEqual({ min: 40, max: 50 });
    // 7 -> bucket step 5 -> [5, 10].
    expect(out.unitRanges?.ARCHER).toEqual({ min: 5, max: 10 });
    expect(out.unitRanges?.WARRIOR?.min).toBeLessThanOrEqual(42);
    expect(out.unitRanges?.WARRIOR?.max).toBeGreaterThanOrEqual(42);
  });

  it('VAGUE exposes only a magnitude band, no composition', () => {
    const out = blurScoutUnits(ARMY, 'VAGUE');
    expect(out.units).toBeNull();
    expect(out.unitRanges).toBeNull();
    // total 49 -> MEDIUM (20..99).
    expect(out.armyBand).toBe('MEDIUM');
  });

  it('VAGUE reports NONE for an empty army', () => {
    expect(blurScoutUnits({}, 'VAGUE').armyBand).toBe('NONE');
  });
});

describe('blurScoutResources', () => {
  it('PRECISE returns the exact stock', () => {
    const out = blurScoutResources(STOCK, 'PRECISE');
    expect(out.resources).toEqual(STOCK);
    expect(out.resourceRanges).toBeNull();
    expect(out.resourceBand).toBeNull();
  });

  it('RANGED brackets each resource deterministically', () => {
    const out = blurScoutResources(STOCK, 'RANGED');
    expect(out.resources).toBeNull();
    // 1234 -> step 1000 -> [1000, 2000].
    expect(out.resourceRanges?.wood).toEqual({ min: 1000, max: 2000 });
    // 88 -> step 50 -> [50, 100].
    expect(out.resourceRanges?.stone).toEqual({ min: 50, max: 100 });
    // 4560 -> step 1000 -> [4000, 5000].
    expect(out.resourceRanges?.iron).toEqual({ min: 4000, max: 5000 });
  });

  it('VAGUE exposes only a magnitude band', () => {
    const out = blurScoutResources(STOCK, 'VAGUE');
    expect(out.resources).toBeNull();
    expect(out.resourceRanges).toBeNull();
    // total 5882 -> MEDIUM (1000..9999).
    expect(out.resourceBand).toBe('MEDIUM');
  });
});

describe('strategy & intel revelation gates', () => {
  it('reveals strategy only from RANGED upward', () => {
    expect(isStrategyRevealed('VAGUE')).toBe(false);
    expect(isStrategyRevealed('RANGED')).toBe(true);
    expect(isStrategyRevealed('PRECISE')).toBe(true);
  });

  it('reveals intel composition only from RANGED upward', () => {
    expect(isIntelCompositionRevealed('VAGUE')).toBe(false);
    expect(isIntelCompositionRevealed('RANGED')).toBe(true);
    expect(isIntelCompositionRevealed('PRECISE')).toBe(true);
  });
});

describe('representative intel values', () => {
  it('PRECISE keeps exact values', () => {
    expect(representativeIntelUnits(ARMY, 'PRECISE')).toEqual(ARMY);
    expect(representativeIntelResources(STOCK, 'PRECISE')).toEqual(STOCK);
  });

  it('RANGED coarsens to bucket midpoints', () => {
    // WARRIOR 42 -> [40,50] -> 45 ; ARCHER 7 -> [5,10] -> 8 (rounded).
    expect(representativeIntelUnits(ARMY, 'RANGED')).toEqual({
      WARRIOR: 45,
      ARCHER: 8,
    });
    // wood [1000,2000]->1500, stone [50,100]->75, iron [4000,5000]->4500.
    expect(representativeIntelResources(STOCK, 'RANGED')).toEqual({
      wood: 1500,
      stone: 75,
      iron: 4500,
    });
  });

  it('VAGUE erases composition and stock', () => {
    expect(representativeIntelUnits(ARMY, 'VAGUE')).toEqual({});
    expect(representativeIntelResources(STOCK, 'VAGUE')).toEqual({
      wood: 0,
      stone: 0,
      iron: 0,
    });
  });
});
