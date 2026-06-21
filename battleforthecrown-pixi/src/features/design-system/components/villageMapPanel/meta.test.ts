import { describe, expect, it } from 'vitest';
import { frShort, unitCategoryFor } from './meta';

describe('unitCategoryFor', () => {
  it('mappe les types connus sur leur catégorie visuelle', () => {
    expect(unitCategoryFor('MILITIA')).toBe('inf');
    expect(unitCategoryFor('SQUIRE')).toBe('inf');
    expect(unitCategoryFor('ARCHER')).toBe('tir');
    expect(unitCategoryFor('SPY')).toBe('tir');
    expect(unitCategoryFor('WARRIOR')).toBe('spe');
    expect(unitCategoryFor('CAVALRY')).toBe('spe');
    expect(unitCategoryFor('TEMPLAR')).toBe('eli');
    expect(unitCategoryFor('NOBLE')).toBe('eli');
  });

  it('retombe sur "inf" pour un type inconnu', () => {
    expect(unitCategoryFor('UNKNOWN')).toBe('inf');
    expect(unitCategoryFor('')).toBe('inf');
  });
});

describe('frShort', () => {
  it('rend les valeurs < 1000 sans abréviation', () => {
    expect(frShort(0)).toBe('0');
    expect(frShort(42)).toBe('42');
    expect(frShort(999)).toBe('999');
  });

  it('abrège les milliers en K', () => {
    expect(frShort(1000)).toBe('1K');
    expect(frShort(1240)).toBe('1,2K');
    expect(frShort(1500)).toBe('1,5K');
    expect(frShort(8300)).toBe('8,3K');
  });

  it('abrège les millions en M', () => {
    expect(frShort(1_000_000)).toBe('1M');
    expect(frShort(3_400_000)).toBe('3,4M');
  });

  it('gère les seuils exacts', () => {
    expect(frShort(999)).toBe('999');
    expect(frShort(1000)).toBe('1K');
    expect(frShort(999_999)).toBe('1000K');
    expect(frShort(1_000_000)).toBe('1M');
  });
});
