import { describe, expect, it } from 'vitest';
import { calculateCasualtyStats, isVictoryForAttacker } from './utils';

describe('calculateCasualtyStats', () => {
  it('returns zero stats when army has no units', () => {
    expect(calculateCasualtyStats({}, {})).toEqual({
      total: 0,
      losses: 0,
      casualtyRate: 0,
    });
  });

  it('returns 0% rate when no losses', () => {
    expect(
      calculateCasualtyStats({ MILITIA: 100, ARCHER: 50 }, { MILITIA: 0, ARCHER: 0 }),
    ).toEqual({ total: 150, losses: 0, casualtyRate: 0 });
  });

  it('rounds casualty rate to nearest integer', () => {
    const result = calculateCasualtyStats(
      { MILITIA: 100, ARCHER: 50 },
      { MILITIA: 30, ARCHER: 10 },
    );
    expect(result.losses).toBe(40);
    expect(result.casualtyRate).toBe(27); // 40/150 = 26.67 → 27
  });

  it('returns 100% when all units are lost', () => {
    expect(
      calculateCasualtyStats({ MILITIA: 50, ARCHER: 30 }, { MILITIA: 50, ARCHER: 30 }),
    ).toEqual({ total: 80, losses: 80, casualtyRate: 100 });
  });

  it('floors sub-1% rates to 0', () => {
    const result = calculateCasualtyStats({ MILITIA: 1000 }, { MILITIA: 1 });
    expect(result.casualtyRate).toBe(0);
  });

  it('counts losses for unit types absent from original', () => {
    const result = calculateCasualtyStats({ MILITIA: 100 }, { MILITIA: 50, ARCHER: 10 });
    expect(result.total).toBe(100);
    expect(result.losses).toBe(60);
    expect(result.casualtyRate).toBe(60);
  });
});

describe('isVictoryForAttacker', () => {
  it('returns true when at least one unit survives', () => {
    expect(isVictoryForAttacker({ MILITIA: 50 }, { MILITIA: 100 })).toBe(true);
  });

  it('returns false when all units are wiped', () => {
    expect(isVictoryForAttacker({ MILITIA: 100, ARCHER: 30 }, { MILITIA: 100, ARCHER: 30 })).toBe(
      false,
    );
  });

  it('returns false when no original units', () => {
    expect(isVictoryForAttacker({}, {})).toBe(false);
  });

  it('counts a unit type absent from losses as surviving', () => {
    expect(isVictoryForAttacker({ MILITIA: 50 }, { MILITIA: 100, ARCHER: 50 })).toBe(true);
  });

  it('returns false when losses exceed original (defensive cap)', () => {
    expect(isVictoryForAttacker({ MILITIA: 150 }, { MILITIA: 100 })).toBe(false);
  });

  it('returns true for zero losses', () => {
    expect(isVictoryForAttacker({ MILITIA: 0 }, { MILITIA: 50 })).toBe(true);
  });
});
