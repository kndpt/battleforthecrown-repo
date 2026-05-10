import { describe, expect, it } from 'vitest';
import type { BuildingDto } from '@/api';
import { getBuildingLockState } from './buildingLockState';

function building(overrides: Partial<BuildingDto>): BuildingDto {
  return {
    id: 'building-1',
    type: 'WATCHTOWER',
    level: 1,
    maxLevel: 10,
    populationCost: 0,
    isUnderConstruction: false,
    startTime: null,
    endTime: null,
    ...overrides,
  };
}

describe('getBuildingLockState', () => {
  it('reports unbuilt-locked when castle is below the requirement', () => {
    expect(
      getBuildingLockState(building({ type: 'WATCHTOWER', level: 0 }), 2),
    ).toEqual({
      state: 'unbuilt-locked',
      castleLevel: 2,
      requiredCastleLevel: 3,
    });
  });

  it('reports unbuilt-available when castle meets the requirement', () => {
    expect(
      getBuildingLockState(building({ type: 'WATCHTOWER', level: 0 }), 3).state,
    ).toBe('unbuilt-available');
  });

  it('reports in-progress for a building under construction', () => {
    expect(
      getBuildingLockState(
        building({
          isUnderConstruction: true,
          startTime: '2026-05-10T10:00:00.000Z',
          endTime: '2026-05-10T10:10:00.000Z',
        }),
        3,
      ).state,
    ).toBe('in-progress');
  });

  it('reports available for a built non-max building', () => {
    expect(getBuildingLockState(building({ level: 2 }), 3).state).toBe('available');
  });

  it('reports max when level reaches maxLevel', () => {
    expect(getBuildingLockState(building({ level: 10, maxLevel: 10 }), 3).state).toBe(
      'max',
    );
  });
});
