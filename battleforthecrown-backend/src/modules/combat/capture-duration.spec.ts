import { describe, expect, it } from '@jest/globals';
import type { WorldTempo } from '@battleforthecrown/shared/world';
import {
  BARBARIAN_CAPTURE_DURATIONS_MS,
  getCaptureDurationMs,
  PVP_CAPTURE_DURATIONS_MS,
} from './capture-duration';

const HOUR_MS = 60 * 60 * 1000;

const tempo: WorldTempo = {
  global: 1,
  overrides: {},
};

describe('getCaptureDurationMs', () => {
  it('keeps barbarian capture durations based on tier', () => {
    expect(getCaptureDurationMs({ isBarbarian: true, tempo, tier: 'T1' })).toBe(
      0.5 * HOUR_MS,
    );
    expect(getCaptureDurationMs({ isBarbarian: true, tempo, tier: 'T3' })).toBe(
      1.5 * HOUR_MS,
    );
    expect(getCaptureDurationMs({ isBarbarian: true, tempo, tier: 'T5' })).toBe(
      3 * HOUR_MS,
    );
    expect(getCaptureDurationMs({ isBarbarian: true, tempo, tier: null })).toBe(
      BARBARIAN_CAPTURE_DURATIONS_MS.T1,
    );
  });

  it('uses the PvP capture curve from docs/gameplay/14-pvp-conquest.md', () => {
    expect(PVP_CAPTURE_DURATIONS_MS).toEqual([
      { minCastleLevel: 9, durationMs: 4.5 * HOUR_MS },
      { minCastleLevel: 7, durationMs: 3 * HOUR_MS },
      { minCastleLevel: 5, durationMs: 2.25 * HOUR_MS },
      { minCastleLevel: 3, durationMs: 1.5 * HOUR_MS },
      { minCastleLevel: 1, durationMs: 1 * HOUR_MS },
    ]);

    expect(
      getCaptureDurationMs({ castleLevel: 1, isBarbarian: false, tempo }),
    ).toBe(1 * HOUR_MS);
    expect(
      getCaptureDurationMs({ castleLevel: 4, isBarbarian: false, tempo }),
    ).toBe(1.5 * HOUR_MS);
    expect(
      getCaptureDurationMs({ castleLevel: 6, isBarbarian: false, tempo }),
    ).toBe(2.25 * HOUR_MS);
    expect(
      getCaptureDurationMs({ castleLevel: 8, isBarbarian: false, tempo }),
    ).toBe(3 * HOUR_MS);
    expect(
      getCaptureDurationMs({ castleLevel: 10, isBarbarian: false, tempo }),
    ).toBe(4.5 * HOUR_MS);
  });

  it('applies capture tempo and keeps a minimum duration', () => {
    expect(
      getCaptureDurationMs({
        castleLevel: 10,
        isBarbarian: false,
        tempo: { global: 1, overrides: { captureWindow: 0.1 } },
      }),
    ).toBe(27 * 60 * 1000);

    expect(
      getCaptureDurationMs({
        castleLevel: 10,
        isBarbarian: false,
        tempo: { global: 1, overrides: { captureWindow: 0.000001 } },
      }),
    ).toBe(1000);
  });
});
