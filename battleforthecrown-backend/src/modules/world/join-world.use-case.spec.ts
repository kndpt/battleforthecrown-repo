import {
  DEFAULT_STARTING_RESOURCE_AMOUNT,
  startingResourceAmount,
} from './join-world.use-case';

describe('startingResourceAmount', () => {
  const key = 'WOOD_STARTING_AMOUNT';
  const previous = process.env[key];

  afterEach(() => {
    if (previous === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
  });

  it('uses the default starting stock when the env var is absent', () => {
    delete process.env[key];

    expect(startingResourceAmount(key)).toBe(DEFAULT_STARTING_RESOURCE_AMOUNT);
  });

  it('keeps explicit env overrides', () => {
    process.env[key] = '750';

    expect(startingResourceAmount(key)).toBe(750);
  });

  it('rejects invalid env overrides', () => {
    process.env[key] = 'not-a-number';

    expect(() => startingResourceAmount(key)).toThrow(
      /Invalid WOOD_STARTING_AMOUNT/,
    );
  });
});
