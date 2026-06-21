import { describe, expect, it } from 'vitest';
import { MS_PER_HOUR } from '../time';
import {
  formatCaptureDuration,
  getPvpCaptureDurationLabel,
  getPvpCaptureDurationMs,
  PVP_CAPTURE_DURATIONS_MS,
} from './capture-duration';

describe('getPvpCaptureDurationMs', () => {
  it('maps every castle-level palier to docs/gameplay/14-pvp-conquest.md', () => {
    expect(getPvpCaptureDurationMs(1)).toBe(1 * MS_PER_HOUR);
    expect(getPvpCaptureDurationMs(2)).toBe(1 * MS_PER_HOUR);
    expect(getPvpCaptureDurationMs(3)).toBe(1.5 * MS_PER_HOUR);
    expect(getPvpCaptureDurationMs(4)).toBe(1.5 * MS_PER_HOUR);
    expect(getPvpCaptureDurationMs(5)).toBe(2.25 * MS_PER_HOUR);
    expect(getPvpCaptureDurationMs(6)).toBe(2.25 * MS_PER_HOUR);
    expect(getPvpCaptureDurationMs(7)).toBe(3 * MS_PER_HOUR);
    expect(getPvpCaptureDurationMs(8)).toBe(3 * MS_PER_HOUR);
    expect(getPvpCaptureDurationMs(9)).toBe(4.5 * MS_PER_HOUR);
    expect(getPvpCaptureDurationMs(10)).toBe(4.5 * MS_PER_HOUR);
  });

  it('falls back to the lowest palier below castle level 1', () => {
    expect(getPvpCaptureDurationMs(0)).toBe(1 * MS_PER_HOUR);
  });

  it('throws when castle level is unknown', () => {
    expect(() => getPvpCaptureDurationMs(null)).toThrow(
      'castleLevel is required for player-village capture duration',
    );
    expect(() => getPvpCaptureDurationMs(undefined)).toThrow();
  });

  it('keeps the curve frozen (descending thresholds, no tempo)', () => {
    expect(PVP_CAPTURE_DURATIONS_MS).toEqual([
      { minCastleLevel: 9, durationMs: 4.5 * MS_PER_HOUR },
      { minCastleLevel: 7, durationMs: 3 * MS_PER_HOUR },
      { minCastleLevel: 5, durationMs: 2.25 * MS_PER_HOUR },
      { minCastleLevel: 3, durationMs: 1.5 * MS_PER_HOUR },
      { minCastleLevel: 1, durationMs: 1 * MS_PER_HOUR },
    ]);
  });
});

describe('formatCaptureDuration', () => {
  it('formats whole and fractional hours as XhYY', () => {
    expect(formatCaptureDuration(1 * MS_PER_HOUR)).toBe('1h');
    expect(formatCaptureDuration(1.5 * MS_PER_HOUR)).toBe('1h30');
    expect(formatCaptureDuration(2.25 * MS_PER_HOUR)).toBe('2h15');
    expect(formatCaptureDuration(3 * MS_PER_HOUR)).toBe('3h');
    expect(formatCaptureDuration(4.5 * MS_PER_HOUR)).toBe('4h30');
  });
});

describe('getPvpCaptureDurationLabel', () => {
  it('returns the short label for known castle levels', () => {
    expect(getPvpCaptureDurationLabel(2)).toBe('1h');
    expect(getPvpCaptureDurationLabel(6)).toBe('2h15');
    expect(getPvpCaptureDurationLabel(10)).toBe('4h30');
  });

  it('returns null when the castle level is unknown (UI shows "Inconnue")', () => {
    expect(getPvpCaptureDurationLabel(null)).toBeNull();
    expect(getPvpCaptureDurationLabel(undefined)).toBeNull();
  });
});
