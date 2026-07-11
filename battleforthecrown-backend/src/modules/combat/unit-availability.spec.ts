import { BadRequestException } from '@nestjs/common';
import { assertUnitsAvailable, toUnitQuantityMap } from './unit-availability';

describe('toUnitQuantityMap', () => {
  it('maps Prisma-style rows to a unitType → quantity record', () => {
    expect(
      toUnitQuantityMap([
        { unitType: 'SWORDSMAN', quantity: 3 },
        { unitType: 'ARCHER', quantity: 0 },
      ]),
    ).toEqual({ SWORDSMAN: 3, ARCHER: 0 });
  });

  it('returns an empty record for no rows', () => {
    expect(toUnitQuantityMap([])).toEqual({});
  });

  it('keeps the last value on duplicate unit types', () => {
    expect(
      toUnitQuantityMap([
        { unitType: 'SWORDSMAN', quantity: 1 },
        { unitType: 'SWORDSMAN', quantity: 5 },
      ]),
    ).toEqual({ SWORDSMAN: 5 });
  });
});

describe('assertUnitsAvailable', () => {
  it('passes when every requested unit is on hand', () => {
    expect(() =>
      assertUnitsAvailable(
        { SWORDSMAN: 5, ARCHER: 2 },
        { SWORDSMAN: 5, ARCHER: 1 },
      ),
    ).not.toThrow();
  });

  it('throws on the first shortfall with have/need in the message', () => {
    expect(() =>
      assertUnitsAvailable({ SWORDSMAN: 2 }, { SWORDSMAN: 5 }),
    ).toThrow(
      new BadRequestException('Insufficient SWORDSMAN: have 2, need 5'),
    );
  });

  it('treats a missing available entry as zero on hand', () => {
    expect(() => assertUnitsAvailable({}, { ARCHER: 1 })).toThrow(
      new BadRequestException('Insufficient ARCHER: have 0, need 1'),
    );
  });

  it('appends the location label to the message', () => {
    expect(() =>
      assertUnitsAvailable({ ARCHER: 0 }, { ARCHER: 3 }, ' in garrison'),
    ).toThrow(
      new BadRequestException(
        'Insufficient ARCHER in garrison: have 0, need 3',
      ),
    );
  });

  it('skips requested entries that are zero, negative or undefined', () => {
    expect(() =>
      assertUnitsAvailable(
        { SWORDSMAN: 1 },
        { SWORDSMAN: 0, ARCHER: -4, SPY: undefined },
      ),
    ).not.toThrow();
  });

  it('does not throw for an empty request', () => {
    expect(() => assertUnitsAvailable({}, {})).not.toThrow();
  });
});
