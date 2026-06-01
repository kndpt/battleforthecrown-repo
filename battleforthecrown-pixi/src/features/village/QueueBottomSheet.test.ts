import { describe, expect, it } from 'vitest';
import type { BuildingMeta } from './buildingMeta';
import { rawIconFor } from './queueIcons';

const baseMeta: BuildingMeta = {
  cardVariant: 'parchment',
  description: 'Test building',
  emoji: '*',
  iconPath: '/assets/test-building.png',
  label: 'Test',
  sortKey: 0,
};

describe('rawIconFor', () => {
  it('prefers the building metadata icon path', () => {
    expect(rawIconFor('CASTLE', baseMeta)).toBe('/assets/test-building.png');
  });

  it('falls back to the lock asset when metadata has no icon path', () => {
    expect(rawIconFor('UNKNOWN', { ...baseMeta, iconPath: null })).toBe('/assets/lock.png');
  });
});
