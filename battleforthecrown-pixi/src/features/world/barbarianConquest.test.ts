import { describe, expect, it } from 'vitest';
import {
  getBarbarianCaptureDurationLabel,
  getBarbarianCaptureDurationMs,
} from './barbarianConquest';

describe('barbarian conquest durations', () => {
  it('maps barbarian tiers to the canonical capture window duration', () => {
    expect(getBarbarianCaptureDurationLabel('T1')).toBe('2h');
    expect(getBarbarianCaptureDurationLabel('T2')).toBe('4h');
    expect(getBarbarianCaptureDurationLabel('T3')).toBe('6h');
    expect(getBarbarianCaptureDurationLabel('T4')).toBe('9h');
    expect(getBarbarianCaptureDurationLabel('T5')).toBe('12h');
  });

  it('returns null when the tier is unknown', () => {
    expect(getBarbarianCaptureDurationMs(null)).toBeNull();
  });
});
