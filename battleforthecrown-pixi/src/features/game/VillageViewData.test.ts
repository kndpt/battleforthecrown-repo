import { describe, expect, it } from 'vitest';
import type { BuildingDto } from '@/api';
import { BUILDING_TYPES } from '@battleforthecrown/shared/village/buildings';
import { categorizeVillageBuildings } from './VillageViewData';

function building(overrides: Partial<BuildingDto>): BuildingDto {
  return {
    id: 'building-1',
    type: BUILDING_TYPES.CASTLE,
    level: 1,
    maxLevel: 10,
    populationCost: 0,
    isUnderConstruction: false,
    startTime: null,
    endTime: null,
    ...overrides,
  };
}

describe('categorizeVillageBuildings', () => {
  it('separates locked unbuilt buildings from visible categories', () => {
    const watchtower = building({
      id: 'watchtower',
      type: BUILDING_TYPES.WATCHTOWER,
      level: 0,
    });
    const castle = building({
      id: 'castle',
      type: BUILDING_TYPES.CASTLE,
      level: 2,
    });

    const result = categorizeVillageBuildings([watchtower, castle], 2);

    expect(result.lockedBuildings).toEqual([watchtower]);
    expect(result.byCategory.centre).toEqual([castle]);
    expect(result.byCategory.military).toEqual([]);
  });

  it('maps known building types to their village categories', () => {
    const castle = building({ id: 'castle', type: BUILDING_TYPES.CASTLE });
    const barracks = building({ id: 'barracks', type: BUILDING_TYPES.BARRACKS });
    const lumbermill = building({ id: 'wood', type: BUILDING_TYPES.WOOD });
    const councilHall = building({ id: 'council', type: BUILDING_TYPES.COUNCIL_HALL });

    const result = categorizeVillageBuildings(
      [castle, barracks, lumbermill, councilHall],
      10,
    );

    expect(result.byCategory.centre).toEqual([castle]);
    expect(result.byCategory.military).toEqual([barracks]);
    expect(result.byCategory.resources).toEqual([lumbermill]);
    expect(result.byCategory.governance).toEqual([councilHall]);
    expect(result.lockedBuildings).toEqual([]);
  });

  it('falls back to governance for unknown building types', () => {
    const customBuilding = building({
      id: 'custom',
      type: 'CUSTOM_BUILDING' as BuildingDto['type'],
    });

    const result = categorizeVillageBuildings([customBuilding], 10);

    expect(result.byCategory.governance).toEqual([customBuilding]);
  });
});
