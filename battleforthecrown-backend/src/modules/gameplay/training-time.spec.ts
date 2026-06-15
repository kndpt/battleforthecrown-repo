import { calculateTrainingTime } from '@battleforthecrown/shared/logic';
import { MS_PER_SECOND } from '@battleforthecrown/shared/time';

describe('calculateTrainingTime', () => {
  it('converts unit seconds to milliseconds at multiplier 1', () => {
    expect(calculateTrainingTime(60, 1)).toBe(60 * MS_PER_SECOND);
  });

  it('divides duration when speedMultiplier is greater than 1', () => {
    expect(calculateTrainingTime(60, 2)).toBe(30 * MS_PER_SECOND);
  });

  it('composes trainingSpeedBonus with speedMultiplier', () => {
    expect(calculateTrainingTime(60, 1, 1.36)).toBe(44_118);
  });

  it('floors the result at one second', () => {
    expect(calculateTrainingTime(0.5, 1)).toBe(MS_PER_SECOND);
    expect(calculateTrainingTime(1, 100)).toBe(MS_PER_SECOND);
  });

  it('rounds the computed duration to the nearest millisecond', () => {
    expect(calculateTrainingTime(10, 3)).toBe(3_333);
  });
});
