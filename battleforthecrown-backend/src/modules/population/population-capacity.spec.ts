import { applyPopulationBonus } from './population-capacity';

describe('applyPopulationBonus', () => {
  it('applies a positive strategy population multiplier', () => {
    expect(applyPopulationBonus(250, { populationBonus: 1.1 })).toBe(275);
  });

  it('falls back to the base max without a valid multiplier', () => {
    expect(applyPopulationBonus(250, null)).toBe(250);
    expect(applyPopulationBonus(250, { populationBonus: 0 })).toBe(250);
  });
});
