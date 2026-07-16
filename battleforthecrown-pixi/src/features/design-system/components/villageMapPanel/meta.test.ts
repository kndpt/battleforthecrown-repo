import { describe, expect, it } from 'vitest';
import { frShort } from './meta';

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
    expect(frShort(999_999)).toBe('1M');
    expect(frShort(1_000_000)).toBe('1M');
  });
});
