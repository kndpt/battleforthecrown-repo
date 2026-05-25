import { describe, expect, it } from 'vitest';
import { BUILDING_TYPES } from '@battleforthecrown/shared/village/buildings';
import {
  formatConstructionSpeed,
  formatSpeedBonus,
  getBarracksTrainingSpeedComparison,
  getBarracksUnlockGroups,
  getCastleUnlockGroups,
  getWarehouseStorageComparison,
  getWatchtowerVisionComparison,
} from './buildingModalContent';

describe('building modal content helpers', () => {
  it('groups active barracks unit unlocks by barracks level', () => {
    expect(getBarracksUnlockGroups()).toEqual([
      { level: 1, units: ['MILITIA'] },
      { level: 2, units: ['SQUIRE'] },
      { level: 3, units: ['WARRIOR', 'ARCHER', 'SPY'] },
      { level: 4, units: ['TEMPLAR'] },
      { level: 5, units: ['CAVALRY'] },
    ]);
  });

  it('exposes barracks speed, storage, and watchtower current/next values', () => {
    expect(getBarracksTrainingSpeedComparison(3)).toEqual({ current: 1.08, next: 1.12 });
    expect(getWarehouseStorageComparison(2)).toEqual({ current: 4200, next: 5900 });
    expect(getWarehouseStorageComparison(10)).toEqual({ current: 87000, next: null });
    expect(getWatchtowerVisionComparison(4)).toEqual({ current: 25, next: 30 });
    expect(getWatchtowerVisionComparison(10)).toEqual({ current: 55, next: null });
  });

  it('groups future castle unlocks without disabled placeholder buildings', () => {
    const groups = getCastleUnlockGroups(3);
    expect(groups).toContainEqual({ level: 4, buildings: [BUILDING_TYPES.COUNCIL_HALL] });
    expect(groups).toContainEqual({ level: 6, buildings: [BUILDING_TYPES.THRONE_HALL] });
    expect(groups).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ buildings: expect.arrayContaining([BUILDING_TYPES.HIDEOUT]) }),
        expect.objectContaining({ buildings: expect.arrayContaining([BUILDING_TYPES.WALL]) }),
      ]),
    );
  });

  it('formats speed labels for the modal copy', () => {
    expect(formatSpeedBonus(1)).toBe('Neutre');
    expect(formatSpeedBonus(1.16)).toBe('+16 %');
    expect(formatConstructionSpeed(0.8)).toBe('×1.25');
  });
});
