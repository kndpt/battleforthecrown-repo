import { describe, expect, it } from 'vitest';
import {
  formatTravelTime,
  calculateExpeditionTravelTime,
} from './combatHelpers';

describe('formatTravelTime', () => {
  it('formats zero as 0:00', () => {
    expect(formatTravelTime(0)).toBe('0:00');
  });

  it('formats exactly one minute', () => {
    expect(formatTravelTime(60_000)).toBe('1:00');
  });

  it('formats seconds without hours', () => {
    // 4 minutes 5 seconds (from jsdoc example: 245855 ms ≈ 4:05)
    expect(formatTravelTime(245_000)).toBe('4:05');
  });

  it('formats with hours when >= 3600 s', () => {
    // 3661000 ms = 1h 1m 1s (from jsdoc example)
    expect(formatTravelTime(3_661_000)).toBe('1:01:01');
  });

  it('zero-pads minutes and seconds below 10', () => {
    // 3605000 = 1h 0m 5s
    expect(formatTravelTime(3_605_000)).toBe('1:00:05');
  });

  it('formats exactly one hour', () => {
    expect(formatTravelTime(3_600_000)).toBe('1:00:00');
  });

  it('formats just below one hour', () => {
    expect(formatTravelTime(3_599_000)).toBe('59:59');
  });

  it('truncates sub-second precision (floor ms)', () => {
    // 61999 ms → 61 seconds → 1m 1s
    expect(formatTravelTime(61_999)).toBe('1:01');
  });
});

const UNIT_STATS = {
  MILITIA: { speed: 6 },
  ARCHER: { speed: 18 },
  SCOUT: { speed: 100 },
};

describe('calculateExpeditionTravelTime', () => {
  it('returns 0 when no units are selected', () => {
    expect(calculateExpeditionTravelTime(0, 0, 10, 0, {}, UNIT_STATS, 1)).toBe(0);
  });

  it('returns 0 when worldTravelSpeed is 0', () => {
    expect(
      calculateExpeditionTravelTime(0, 0, 10, 0, { MILITIA: 5 }, UNIT_STATS, 0),
    ).toBe(0);
  });

  it('returns 0 when no selected unit has a stat entry', () => {
    expect(
      calculateExpeditionTravelTime(0, 0, 10, 0, { UNKNOWN: 5 }, UNIT_STATS, 1),
    ).toBe(0);
  });

  it('computes travel time using the slowest unit', () => {
    // distance(0,0 → 3,4) = 5 tiles; slowest = MILITIA speed 6; multiplier 1
    // shared formula: minutes = (5 * 6) / (6 * 1) = 5 min → 300 000 ms
    expect(
      calculateExpeditionTravelTime(0, 0, 3, 4, { MILITIA: 10, ARCHER: 5 }, UNIT_STATS, 1),
    ).toBe(300_000);
  });

  it('uses the fastest-available unit when only scouts are sent', () => {
    // distance = 5; scout speed = 100; multiplier 1
    // minutes = (5 * 6) / (100 * 1) = 0.3 min → Math.round(18 000) = 18 000 ms
    expect(
      calculateExpeditionTravelTime(0, 0, 3, 4, { SCOUT: 1 }, UNIT_STATS, 1),
    ).toBe(18_000);
  });

  it('respects worldTravelSpeed multiplier', () => {
    // distance = 5; MILITIA speed 6; multiplier 2
    // minutes = (5 * 6) / (6 * 2) = 2.5 min → 150 000 ms
    expect(
      calculateExpeditionTravelTime(0, 0, 3, 4, { MILITIA: 1 }, UNIT_STATS, 2),
    ).toBe(150_000);
  });

  it('rounds to the nearest millisecond', () => {
    // distance(0,0 → 1,0) = 1; ARCHER speed 18; multiplier 1
    // minutes = (1 * 6) / (18 * 1) = 0.333… → Math.round(20 000) = 20 000 ms
    expect(
      calculateExpeditionTravelTime(0, 0, 1, 0, { ARCHER: 3 }, UNIT_STATS, 1),
    ).toBe(20_000);
  });
});
