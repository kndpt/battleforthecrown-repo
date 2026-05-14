import { UNIT_TYPES } from '@battleforthecrown/shared/army';
import { trainUnitsSchema } from './train-units.dto';

describe('trainUnitsSchema', () => {
  it('accepts barracks units from the shared catalog', () => {
    expect(
      trainUnitsSchema.safeParse({
        unitType: UNIT_TYPES.WARRIOR,
        quantity: 43,
      }).success,
    ).toBe(true);
  });

  it('keeps noble recruitment out of the barracks endpoint', () => {
    expect(
      trainUnitsSchema.safeParse({
        unitType: UNIT_TYPES.NOBLE,
        quantity: 1,
      }).success,
    ).toBe(false);
  });
});
