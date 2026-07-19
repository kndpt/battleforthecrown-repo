import { applyPopulationBonus } from './population-capacity';

describe('applyPopulationBonus', () => {
  it('applies a positive strategy population multiplier', () => {
    expect(applyPopulationBonus(250, { populationBonus: 1.1 })).toBe(275);
  });

  it('falls back to the base max without a valid multiplier', () => {
    expect(applyPopulationBonus(250, null)).toBe(250);
    expect(applyPopulationBonus(250, { populationBonus: 0 })).toBe(250);
  });

  it('applies the FERTILE_SOIL trait multiplier flat over the base', () => {
    expect(applyPopulationBonus(250, null, 'FERTILE_SOIL')).toBe(275);
  });

  it('composes strategy and trait multipliers, flooring only once', () => {
    // 250 × 1.1 (strategy) × 1.1 (FERTILE_SOIL) = 302.5 → 302 (single floor).
    expect(
      applyPopulationBonus(250, { populationBonus: 1.1 }, 'FERTILE_SOIL'),
    ).toBe(302);
  });

  it('leaves non-FERTILE_SOIL traits population-neutral (regression)', () => {
    const neutralTraits = [
      'DENSE_FOREST',
      'RICH_QUARRY',
      'IRON_VEIN',
      'PLAINS',
      'HILL',
    ] as const;
    for (const trait of neutralTraits) {
      expect(applyPopulationBonus(250, null, trait)).toBe(250);
      expect(applyPopulationBonus(250, { populationBonus: 1.1 }, trait)).toBe(
        275,
      );
    }
  });

  it('treats a null/undefined trait as neutral', () => {
    expect(applyPopulationBonus(250, null, null)).toBe(250);
    expect(applyPopulationBonus(250, null, undefined)).toBe(250);
  });
});
