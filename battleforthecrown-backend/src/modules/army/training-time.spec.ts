import { calculateTrainingTime } from '@battleforthecrown/shared/logic';
import { MS_PER_SECOND } from '@battleforthecrown/shared/time';
import { getBarracksTrainingSpeedMultiplier } from '@battleforthecrown/shared/village/buildings';

describe('calculateTrainingTime', () => {
  it('converts base unit seconds to milliseconds at neutral multipliers', () => {
    expect(calculateTrainingTime(60, 1)).toBe(60_000);
  });

  it('halves duration when speedMultiplier doubles', () => {
    const base = calculateTrainingTime(120, 1);
    expect(calculateTrainingTime(120, 2)).toBe(base / 2);
  });

  it('composes trainingSpeedBonus with speedMultiplier (>1 = faster)', () => {
    const barracksBonus = getBarracksTrainingSpeedMultiplier(10);
    const withBarracksOnly = calculateTrainingTime(60, 1, barracksBonus);
    const neutral = calculateTrainingTime(60, 1, 1);

    expect(withBarracksOnly).toBeLessThan(neutral);
    expect(withBarracksOnly).toBe(
      Math.round((60 / barracksBonus) * MS_PER_SECOND),
    );
  });

  it('clamps duration to one second when raw time rounds below the floor', () => {
    expect(calculateTrainingTime(0.0001, 1)).toBe(MS_PER_SECOND);
  });

  it('returns an integer millisecond value', () => {
    const result = calculateTrainingTime(10, 3, 1.36);
    expect(result).toBe(Math.round(result));
  });
});
