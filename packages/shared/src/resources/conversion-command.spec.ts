import { describe, expect, it } from 'vitest';
import { ConvertResourcesCommandSchema } from './conversion-command';

describe('ConvertResourcesCommandSchema', () => {
  const valid = {
    villageId: 'v1',
    sourceType: 'WOOD',
    destinationType: 'STONE',
    amount: 100,
  };

  it('accepts a well-formed intra-village conversion', () => {
    expect(ConvertResourcesCommandSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects identical source and destination', () => {
    const res = ConvertResourcesCommandSchema.safeParse({
      ...valid,
      destinationType: 'WOOD',
    });
    expect(res.success).toBe(false);
  });

  it('rejects non-positive, fractional, or non-integer amounts', () => {
    for (const amount of [0, -5, 10.5, Number.NaN]) {
      expect(
        ConvertResourcesCommandSchema.safeParse({ ...valid, amount }).success,
      ).toBe(false);
    }
  });

  it('whitelists WOOD/STONE/IRON only — never crowns', () => {
    expect(
      ConvertResourcesCommandSchema.safeParse({
        ...valid,
        sourceType: 'CROWN',
      }).success,
    ).toBe(false);
    expect(
      ConvertResourcesCommandSchema.safeParse({
        ...valid,
        destinationType: 'CROWNS',
      }).success,
    ).toBe(false);
  });

  it('has no destination village/player field — the exchange never transfers', () => {
    const parsed = ConvertResourcesCommandSchema.parse(valid);
    expect(Object.keys(parsed).sort()).toEqual([
      'amount',
      'destinationType',
      'sourceType',
      'villageId',
    ]);
  });
});
