import { describe, expect, it } from 'vitest';
import type { BuildingDto } from '@/api';
import type { DisplayResources } from '@/lib/interpolation';
import { formatCompactNumber } from '@/lib/resourceConfig';
import { BUILDING_TYPES } from '@battleforthecrown/shared/village/buildings';
import {
  canAffordNextBuildingLevel,
  computeQueueProgress,
  computeResourceRatios,
  formatQueueTime,
} from './VillageViewSectionHelpers';

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

const fullResources: DisplayResources = {
  iron: 100_000,
  maxPerType: 100_000,
  stone: 100_000,
  wood: 100_000,
};

describe('VillageViewSections helpers', () => {
  it('formats queue durations for sub-hour and hour values', () => {
    expect(formatQueueTime(65_000)).toBe('1:05');
    expect(formatQueueTime(3_665_000)).toBe('1:01');
    expect(formatQueueTime(-1_000)).toBe('0:00');
  });

  it('formats compact resource values', () => {
    expect(formatCompactNumber(999.9)).toBe('999');
    expect(formatCompactNumber(1_200)).toBe('1.2K');
    expect(formatCompactNumber(10_499)).toBe('10K');
    expect(formatCompactNumber(10_500)).toBe('11K');
  });

  it('computes queue progress with clamped duration and remaining time', () => {
    const startTime = '2026-06-01T10:00:00.000Z';
    const endTime = '2026-06-01T10:10:00.000Z';
    const now = Date.parse('2026-06-01T10:05:00.000Z');

    expect(computeQueueProgress({ startTime, endTime }, now)).toEqual({
      progress: 50,
      timeRemaining: 300_000,
      totalTime: 600_000,
    });
    expect(computeQueueProgress({ startTime, endTime }, Date.parse('2026-06-01T10:12:00.000Z')).progress).toBe(100);
  });

  it('computes resource ratios with zero-capacity and overflow guards', () => {
    expect(computeResourceRatios(null)).toEqual({ iron: 0, stone: 0, wood: 0 });
    expect(computeResourceRatios({ iron: 2, maxPerType: 0, stone: 2, wood: 2 })).toEqual({
      iron: 0,
      stone: 0,
      wood: 0,
    });
    expect(computeResourceRatios({ iron: 125, maxPerType: 100, stone: 50.9, wood: 25.8 })).toEqual({
      iron: 100,
      stone: 50,
      wood: 25,
    });
  });

  it('checks next-level affordability with resources and available population', () => {
    const castle = building({ type: BUILDING_TYPES.CASTLE, level: 1 });
    const lumbermillWithPopulationCost = building({ type: BUILDING_TYPES.WOOD, level: 2 });

    expect(canAffordNextBuildingLevel(castle, fullResources, 100_000)).toBe(true);
    expect(canAffordNextBuildingLevel(castle, { ...fullResources, wood: 0 }, 100_000)).toBe(false);
    expect(canAffordNextBuildingLevel(lumbermillWithPopulationCost, fullResources, 0)).toBe(false);
    expect(canAffordNextBuildingLevel(building({ level: 10 }), fullResources, 100_000)).toBe(false);
    expect(canAffordNextBuildingLevel(castle, null, 100_000)).toBe(false);
  });
});
