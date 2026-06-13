import { calculateTrainingTime } from '@battleforthecrown/shared/logic';
import { MS_PER_SECOND } from '@battleforthecrown/shared/time';

describe('calculateTrainingTime', () => {
  it('converts base seconds to milliseconds at multiplier 1', () => {
    expect(calculateTrainingTime(60, 1)).toBe(60_000);
  });

  it('enforces a minimum of one second', () => {
    expect(calculateTrainingTime(0, 1)).toBe(MS_PER_SECOND);
    expect(calculateTrainingTime(0.5, 10)).toBe(MS_PER_SECOND);
  });

  it('halves duration when speedMultiplier doubles', () => {
    const base = calculateTrainingTime(120, 1);
    expect(calculateTrainingTime(120, 2)).toBe(base / 2);
  });

  it('composes speedMultiplier and trainingSpeedBonus multiplicatively', () => {
    expect(calculateTrainingTime(60, 2, 2)).toBe(
      calculateTrainingTime(60, 4, 1),
    );
  });

  it('rounds to the nearest millisecond', () => {
    const result = calculateTrainingTime(7, 3);
    expect(result).toBe(Math.round(result));
  });
});
