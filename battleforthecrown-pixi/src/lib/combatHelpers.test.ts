import { describe, expect, it } from 'vitest';
import { formatTravelTime } from './combatHelpers';

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
