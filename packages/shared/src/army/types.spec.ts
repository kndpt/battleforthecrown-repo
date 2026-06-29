import { describe, expect, it } from 'vitest';
import { UNIT_TYPES, isUnitType } from './types';

describe('isUnitType', () => {
  it('returns true for every valid UnitType value', () => {
    for (const value of Object.values(UNIT_TYPES)) {
      expect(isUnitType(value)).toBe(true);
    }
  });

  it('returns false for invalid strings', () => {
    expect(isUnitType('')).toBe(false);
    expect(isUnitType('DRAGON')).toBe(false);
    expect(isUnitType('militia')).toBe(false);
    expect(isUnitType('Militia')).toBe(false);
  });
});
