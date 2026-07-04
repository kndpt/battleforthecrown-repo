import { describe, expect, it } from 'vitest';
import {
  getBarbarianCaptureDurationLabel,
  getBarbarianCaptureDurationMs,
} from './barbarianConquest';

describe('barbarian conquest durations', () => {
  it('maps barbarian tiers to the compressed capture window (spec 13, XhYY)', () => {
    expect(getBarbarianCaptureDurationLabel('T1')).toBe('0h30');
    expect(getBarbarianCaptureDurationLabel('T2')).toBe('1h');
    expect(getBarbarianCaptureDurationLabel('T3')).toBe('1h30');
    expect(getBarbarianCaptureDurationLabel('T4')).toBe('2h15');
    expect(getBarbarianCaptureDurationLabel('T5')).toBe('3h');
  });

  it('returns null when the tier is unknown', () => {
    expect(getBarbarianCaptureDurationMs(null)).toBeNull();
  });
});
