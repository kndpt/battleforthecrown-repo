import { describe, expect, it } from 'vitest';
import { POWER_RATIO_DIVISOR, isAttackAllowedByPowerRatio } from './power-ratio';

describe('POWER_RATIO_DIVISOR', () => {
  it('is 3 (spec 14 §2)', () => {
    expect(POWER_RATIO_DIVISOR).toBe(3);
  });
});

describe('isAttackAllowedByPowerRatio', () => {
  it('allows at exactly 1/3 (defender = attacker / 3)', () => {
    expect(
      isAttackAllowedByPowerRatio({ attackerPower: 3000, defenderPower: 1000 }),
    ).toBe(true);
  });

  it('forbids just below the threshold', () => {
    expect(
      isAttackAllowedByPowerRatio({ attackerPower: 3000, defenderPower: 999 }),
    ).toBe(false);
  });

  it('allows above the threshold', () => {
    expect(
      isAttackAllowedByPowerRatio({ attackerPower: 3000, defenderPower: 1001 }),
    ).toBe(true);
  });

  it('allows the heroic asymmetry (small attacker, large defender)', () => {
    expect(
      isAttackAllowedByPowerRatio({ attackerPower: 200, defenderPower: 10000 }),
    ).toBe(true);
  });

  it('allows when attacker power is 0 (degenerate, deterministic)', () => {
    expect(
      isAttackAllowedByPowerRatio({ attackerPower: 0, defenderPower: 0 }),
    ).toBe(true);
  });

  it('avoids float rounding (non-divisible-by-3 attacker)', () => {
    // 3001 / 3 = 1000.33… ; defender 1000 is below → forbidden
    expect(
      isAttackAllowedByPowerRatio({ attackerPower: 3001, defenderPower: 1000 }),
    ).toBe(false);
    // defender 1001 → 3003 >= 3001 → allowed
    expect(
      isAttackAllowedByPowerRatio({ attackerPower: 3001, defenderPower: 1001 }),
    ).toBe(true);
  });
});
