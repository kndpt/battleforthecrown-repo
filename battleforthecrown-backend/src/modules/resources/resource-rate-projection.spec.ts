import {
  applyResourceCatchup,
  projectResourceRates,
} from './resource-rate-projection';

describe('projectResourceRates', () => {
  it('returns 0 for resource types whose building is absent', () => {
    const result = projectResourceRates(
      [{ type: 'STONE', level: 3 }],
      () => 10,
    );
    expect(result).toEqual({ wood: 0, stone: 10, iron: 0 });
  });

  it('invokes the rate callback only for present buildings, with the matching type and level', () => {
    const calls: Array<[string, number]> = [];
    const result = projectResourceRates(
      [
        { type: 'WOOD', level: 2 },
        { type: 'IRON', level: 5 },
        { type: 'CASTLE', level: 9 },
      ],
      (type, level) => {
        calls.push([type, level]);
        return level * 100;
      },
    );

    expect(calls).toEqual([
      ['WOOD', 2],
      ['IRON', 5],
    ]);
    expect(result).toEqual({ wood: 200, stone: 0, iron: 500 });
  });

  it('returns 0 for all when no resource building is present', () => {
    const result = projectResourceRates(
      [{ type: 'WAREHOUSE', level: 1 }],
      () => 999,
    );
    expect(result).toEqual({ wood: 0, stone: 0, iron: 0 });
  });
});

describe('applyResourceCatchup', () => {
  const stock = { wood: 100, stone: 200, iron: 50 };

  it('adds floor(rate * minutes) to each resource', () => {
    const result = applyResourceCatchup(
      stock,
      { wood: 10, stone: 5.5, iron: 1 },
      4,
      10_000,
    );
    // floor(10*4)=40, floor(5.5*4)=22, floor(1*4)=4
    expect(result).toEqual({ wood: 140, stone: 222, iron: 54 });
  });

  it('caps each resource at the storage limit', () => {
    const result = applyResourceCatchup(
      stock,
      { wood: 1000, stone: 1000, iron: 1000 },
      60,
      500,
    );
    expect(result).toEqual({ wood: 500, stone: 500, iron: 500 });
  });

  it('returns the stock unchanged when elapsed minutes is 0', () => {
    const result = applyResourceCatchup(
      stock,
      { wood: 10, stone: 10, iron: 10 },
      0,
      10_000,
    );
    expect(result).toEqual(stock);
  });

  it('clamps negative elapsed minutes to 0 so the stock is never decremented', () => {
    const result = applyResourceCatchup(
      stock,
      { wood: 10, stone: 10, iron: 10 },
      -5,
      10_000,
    );
    expect(result).toEqual(stock);
  });
});
