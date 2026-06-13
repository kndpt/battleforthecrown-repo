import { calculateTrainingTime } from '@battleforthecrown/shared/logic';
import { MS_PER_SECOND } from '@battleforthecrown/shared/time';
import { getBarracksTrainingSpeedMultiplier } from '@battleforthecrown/shared/village/buildings';

describe('calculateTrainingTime', () => {
  it('converts base unit seconds to milliseconds when multipliers are neutral', () => {
    expect(calculateTrainingTime(100, 1, 1)).toBe(100_000);
  });

  it('divides duration by the speed multiplier', () => {
    expect(calculateTrainingTime(100, 2, 1)).toBe(50_000);
  });

  it('composes trainingSpeedBonus multiplicatively with speedMultiplier', () => {
    expect(calculateTrainingTime(100, 1, 1.36)).toBe(73_529);
    expect(calculateTrainingTime(100, 2, 1.36)).toBe(36_765);
  });

  it('defaults trainingSpeedBonus to 1 when omitted', () => {
    expect(calculateTrainingTime(60, 1)).toBe(60_000);
  });

  it('clamps the final duration to at least one second', () => {
    expect(calculateTrainingTime(1, 100, 1)).toBe(MS_PER_SECOND);
    expect(calculateTrainingTime(10, 10, 1.36)).toBe(MS_PER_SECOND);
  });

  it('shortens training when barracks level increases', () => {
    const levelOneDuration = calculateTrainingTime(
      100,
      1,
      getBarracksTrainingSpeedMultiplier(1),
    );
    const levelFiveDuration = calculateTrainingTime(
      100,
      1,
      getBarracksTrainingSpeedMultiplier(5),
    );

    expect(levelFiveDuration).toBeLessThan(levelOneDuration);
    expect(levelFiveDuration).toBe(86_207);
  });
});
