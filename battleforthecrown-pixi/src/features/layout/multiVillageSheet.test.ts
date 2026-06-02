import { describe, expect, it } from 'vitest';
import type { JoinedVillage } from '@/api';
import { buildSortedMultiVillageSheetItems } from './multiVillageSheet';

function village(id: string, name: string): JoinedVillage {
  return { id, name, x: 0, y: 0, worldId: 'world-1' };
}

describe('buildSortedMultiVillageSheetItems', () => {
  // Names chosen to exercise French collation (accents, case-insensitivity).
  const villages = [village('a', 'Élan'), village('b', 'azur'), village('c', 'Bois')];

  it('sorts by name ascending using French locale (accent/case insensitive)', () => {
    const items = buildSortedMultiVillageSheetItems(villages, 'a', {}, true);
    expect(items.map((item) => item.name)).toEqual(['azur', 'Bois', 'Élan']);
  });

  it('sorts by name descending when sortAscending is false', () => {
    const items = buildSortedMultiVillageSheetItems(villages, 'a', {}, false);
    expect(items.map((item) => item.name)).toEqual(['Élan', 'Bois', 'azur']);
  });

  it('flags the active village and is non-mutating', () => {
    const input = [...villages];
    const items = buildSortedMultiVillageSheetItems(input, 'c', {}, true);
    expect(items.find((item) => item.id === 'c')?.active).toBe(true);
    expect(items.filter((item) => item.active)).toHaveLength(1);
    // original order preserved (toSorted does not mutate the source array)
    expect(input.map((v) => v.id)).toEqual(['a', 'b', 'c']);
  });
});
