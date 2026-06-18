import { describe, expect, it } from 'vitest';
import { getOnboardingNarrativeLoot } from './narrative-loot';

describe('getOnboardingNarrativeLoot', () => {
  it('returns the fixed T1 narrative loot preview amounts', () => {
    expect(getOnboardingNarrativeLoot('T1')).toEqual({
      wood: 1200,
      stone: 1200,
      iron: 840,
    });
  });
});
