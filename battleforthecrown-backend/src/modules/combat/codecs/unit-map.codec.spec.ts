import { parseUnitMap, encodeUnitMap } from './unit-map.codec';

describe('unit-map.codec', () => {
  const fieldName = 'expedition.units';

  it('parses a valid unit map from Prisma JSON', () => {
    expect(parseUnitMap({ MILITIA: 10, ARCHER: 3 }, fieldName)).toEqual({
      MILITIA: 10,
      ARCHER: 3,
    });
  });

  it('accepts an empty object as an empty unit map', () => {
    expect(parseUnitMap({}, fieldName)).toEqual({});
  });

  it('encodeUnitMap returns the value for Prisma JSON columns', () => {
    const units = { MILITIA: 5, SPY: 1 };
    expect(encodeUnitMap(units)).toBe(units);
  });

  it('throws when a unit key is invalid', () => {
    expect(() => parseUnitMap({ INVALID_UNIT: 1 }, fieldName)).toThrow(
      `Invalid ${fieldName} JSON shape:`,
    );
  });

  it('throws when a quantity is negative', () => {
    expect(() => parseUnitMap({ MILITIA: -1 }, fieldName)).toThrow(
      `Invalid ${fieldName} JSON shape:`,
    );
  });

  it('throws when a quantity is not an integer', () => {
    expect(() => parseUnitMap({ MILITIA: 1.5 }, fieldName)).toThrow(
      `Invalid ${fieldName} JSON shape:`,
    );
  });
});
