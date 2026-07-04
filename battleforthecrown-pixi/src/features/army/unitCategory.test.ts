import { describe, expect, it } from 'vitest';
import { CATEGORY_THEME, unitCategoryFor } from './unitCategory';

describe('unitCategoryFor', () => {
  it('mappe les types connus sur leur catégorie visuelle', () => {
    expect(unitCategoryFor('MILITIA')).toBe('Infanterie');
    expect(unitCategoryFor('SQUIRE')).toBe('Infanterie');
    expect(unitCategoryFor('WARRIOR')).toBe('Infanterie');
    expect(unitCategoryFor('ARCHER')).toBe('Tireur');
    expect(unitCategoryFor('CAVALRY')).toBe('Cavalerie');
    expect(unitCategoryFor('TEMPLAR')).toBe('Élite');
    expect(unitCategoryFor('NOBLE')).toBe('Élite');
    expect(unitCategoryFor('SPY')).toBe('Spécial');
    expect(unitCategoryFor('CATAPULT')).toBe('Siège');
    expect(unitCategoryFor('RAM')).toBe('Siège');
  });

  it('retombe sur "Infanterie" pour un type inconnu', () => {
    expect(unitCategoryFor('UNKNOWN')).toBe('Infanterie');
    expect(unitCategoryFor('')).toBe('Infanterie');
  });

  it("donne à l'espion le même gris que les unités de siège", () => {
    expect(CATEGORY_THEME.Spécial).toEqual(CATEGORY_THEME.Siège);
  });
});
