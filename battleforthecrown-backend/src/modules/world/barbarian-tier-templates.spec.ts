import { BUILDING_TYPES } from '@battleforthecrown/shared/village';
import {
  BARBARIAN_TIER_TEMPLATES,
  getBuildingTemplate,
  getPopulationMax,
  getUnits,
  getWarehouseLevel,
} from './barbarian-tier-templates';

describe('barbarian-tier-templates', () => {
  it('exposes exactly T1/T2/T3/T4/T5 tier templates', () => {
    expect(Object.keys(BARBARIAN_TIER_TEMPLATES)).toEqual([
      'T1',
      'T2',
      'T3',
      'T4',
      'T5',
    ]);
  });

  it('uses only buildings declared in BUILDING_TYPES (no phantom types)', () => {
    const validTypes = new Set<string>(Object.values(BUILDING_TYPES));
    for (const tier of ['T1', 'T2', 'T3', 'T4', 'T5'] as const) {
      for (const building of BARBARIAN_TIER_TEMPLATES[tier].buildings) {
        expect(validTypes.has(building.type)).toBe(true);
      }
    }
  });

  it.each([
    ['T1', 40],
    ['T2', 100],
    ['T3', 200],
    ['T4', 300],
    ['T5', 400],
  ] as const)('getPopulationMax(%s) === %i', (tier, expected) => {
    expect(getPopulationMax(tier)).toBe(expected);
  });

  it('getPopulationMax falls back to T1 on unknown tier', () => {
    expect(getPopulationMax('UNKNOWN')).toBe(BARBARIAN_TIER_TEMPLATES.T1.populationMax);
  });

  it.each([
    ['T1', 1],
    ['T2', 1],
    ['T3', 2],
    ['T4', 3],
    ['T5', 4],
  ] as const)('getWarehouseLevel(%s) === %i', (tier, expected) => {
    expect(getWarehouseLevel(tier)).toBe(expected);
  });

  it('getWarehouseLevel falls back to T1 warehouse level on unknown tier', () => {
    expect(getWarehouseLevel('UNKNOWN_TIER')).toBe(1);
  });

  it.each([
    ['T1', 15],
    ['T2', 35],
    ['T3', 70],
    ['T4', 110],
    ['T5', 150],
  ] as const)('getUnits(%s) total === %i', (tier, expectedTotal) => {
    const total = Object.values(getUnits(tier)).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(expectedTotal);
  });

  it.each([
    ['T1', { MILITIA: 15 }],
    ['T2', { MILITIA: 25, ARCHER: 10 }],
    ['T3', { MILITIA: 44, ARCHER: 18, SQUIRE: 8 }],
    ['T4', { MILITIA: 66, ARCHER: 28, SQUIRE: 11, TEMPLAR: 5 }],
    ['T5', { MILITIA: 90, ARCHER: 38, SQUIRE: 15, TEMPLAR: 7 }],
  ] as const)('getUnits(%s) exact composition', (tier, expected) => {
    expect(getUnits(tier)).toEqual(expected);
  });

  it('getUnits falls back to T1 units on unknown tier', () => {
    expect(getUnits('UNKNOWN')).toEqual(BARBARIAN_TIER_TEMPLATES.T1.units);
  });

  it('returns tier-specific building templates and falls back to T1', () => {
    expect(getBuildingTemplate('T3')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: BUILDING_TYPES.CASTLE, level: 10 }),
      ]),
    );
    expect(getBuildingTemplate('UNKNOWN')).toBe(
      BARBARIAN_TIER_TEMPLATES.T1.buildings,
    );
  });
});
