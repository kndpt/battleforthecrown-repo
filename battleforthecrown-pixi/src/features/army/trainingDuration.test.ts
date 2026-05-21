import { describe, expect, it } from 'vitest';
import { getEffectiveUnitTrainingDurationSeconds } from './trainingDuration';

describe('getEffectiveUnitTrainingDurationSeconds', () => {
  it('returns a shorter display duration for a higher barracks level', () => {
    const levelOneDuration = getEffectiveUnitTrainingDurationSeconds({
      unitTimeSeconds: 100,
      barracksLevel: 1,
    });
    const levelFiveDuration = getEffectiveUnitTrainingDurationSeconds({
      unitTimeSeconds: 100,
      barracksLevel: 5,
    });

    expect(levelFiveDuration).toBeLessThan(levelOneDuration);
  });

  it('composes the barracks multiplier with world tempo', () => {
    const duration = getEffectiveUnitTrainingDurationSeconds({
      unitTimeSeconds: 100,
      barracksLevel: 5,
      worldTempo: {
        global: 1,
        overrides: { unitTrainingSpeed: 0.5 },
      },
    });

    expect(duration).toBeCloseTo(43.104, 3);
  });

  it('aligns with backend rounding and minimum final duration', () => {
    const duration = getEffectiveUnitTrainingDurationSeconds({
      unitTimeSeconds: 10,
      barracksLevel: 10,
      worldTempo: {
        global: 1,
        overrides: { unitTrainingSpeed: 0.01 },
      },
    });

    expect(duration).toBe(1);
  });
});
