import { describe, expect, it } from 'vitest';
import { calculateTrainingTime } from './training-time';
import { MS_PER_SECOND } from '../time';

describe('calculateTrainingTime', () => {
  it('converts unit base seconds to milliseconds at multiplier 1', () => {
    expect(calculateTrainingTime(60, 1)).toBe(60 * MS_PER_SECOND);
  });

  it('halves duration when speedMultiplier is 2', () => {
    expect(calculateTrainingTime(60, 2)).toBe(30 * MS_PER_SECOND);
  });

  it('compounds trainingSpeedBonus with speedMultiplier', () => {
    expect(calculateTrainingTime(60, 1, 1.36)).toBe(44_118);
  });

  it('rounds result to nearest millisecond', () => {
    expect(calculateTrainingTime(10, 3)).toBe(3_333);
  });

  it('clamps result at MS_PER_SECOND (1 s minimum)', () => {
    expect(calculateTrainingTime(0.5, 1)).toBe(MS_PER_SECOND);
    expect(calculateTrainingTime(1, 100)).toBe(MS_PER_SECOND);
  });
});
