import { describe, expect, it } from 'vitest';
import { computeConstructionProgress, formatRemaining } from './constructionProgress';

describe('computeConstructionProgress', () => {
  it('reports not in progress when start/end are missing', () => {
    expect(computeConstructionProgress({ startTime: null, endTime: null }, 0)).toEqual({
      inProgress: false,
      percent: 0,
      remainingMs: 0,
    });
  });

  it('reports 0% at startTime', () => {
    const start = new Date('2026-05-04T22:00:00Z');
    const end = new Date('2026-05-04T22:10:00Z');
    const progress = computeConstructionProgress(
      { startTime: start.toISOString(), endTime: end.toISOString() },
      start.getTime(),
    );
    expect(progress.inProgress).toBe(true);
    expect(progress.percent).toBe(0);
    expect(progress.remainingMs).toBe(10 * 60_000);
  });

  it('reports 50% halfway', () => {
    const start = new Date('2026-05-04T22:00:00Z');
    const end = new Date('2026-05-04T22:10:00Z');
    const progress = computeConstructionProgress(
      { startTime: start.toISOString(), endTime: end.toISOString() },
      start.getTime() + 5 * 60_000,
    );
    expect(progress.percent).toBeCloseTo(50);
    expect(progress.remainingMs).toBe(5 * 60_000);
  });

  it('clamps to 100% past endTime and reports not in progress', () => {
    const start = new Date('2026-05-04T22:00:00Z');
    const end = new Date('2026-05-04T22:10:00Z');
    const progress = computeConstructionProgress(
      { startTime: start.toISOString(), endTime: end.toISOString() },
      end.getTime() + 1_000,
    );
    expect(progress.inProgress).toBe(false);
    expect(progress.percent).toBe(100);
    expect(progress.remainingMs).toBe(0);
  });

  it('returns zero when end is before start (corrupt payload)', () => {
    const progress = computeConstructionProgress(
      { startTime: '2026-05-04T22:10:00Z', endTime: '2026-05-04T22:00:00Z' },
      Date.parse('2026-05-04T22:05:00Z'),
    );
    expect(progress.inProgress).toBe(false);
    expect(progress.percent).toBe(0);
  });
});

describe('formatRemaining', () => {
  it('formats seconds only', () => {
    expect(formatRemaining(45_000)).toBe('45s');
  });

  it('formats minutes + seconds with zero-pad', () => {
    expect(formatRemaining(125_000)).toBe('2m 05s');
  });

  it('formats hours + minutes', () => {
    expect(formatRemaining(3600_000 + 12 * 60_000)).toBe('1h 12m');
  });

  it('returns 0s for non-positive input', () => {
    expect(formatRemaining(-10)).toBe('0s');
    expect(formatRemaining(0)).toBe('0s');
  });
});
