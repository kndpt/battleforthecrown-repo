import { BUILDING_TYPES } from '@battleforthecrown/shared/village';
import {
  BARBARIAN_TIER_TEMPLATES,
  getBuildingTemplate,
  getPopulationMax,
  getWarehouseLevel,
} from './barbarian-tier-templates';

describe('barbarian-tier-templates', () => {
  it('exposes T1/T2/T3 tier templates', () => {
    expect(Object.keys(BARBARIAN_TIER_TEMPLATES)).toEqual(['T1', 'T2', 'T3']);
  });

  it('uses only buildings declared in BUILDING_TYPES (no phantom types)', () => {
    const validTypes = new Set<string>(Object.values(BUILDING_TYPES));
    for (const tier of ['T1', 'T2', 'T3'] as const) {
      for (const building of BARBARIAN_TIER_TEMPLATES[tier].buildings) {
        expect(validTypes.has(building.type)).toBe(true);
      }
    }
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

  it('returns tier-specific population max and falls back to T1', () => {
    expect(getPopulationMax('T3')).toBe(200);
    expect(getPopulationMax('UNKNOWN')).toBe(
      BARBARIAN_TIER_TEMPLATES.T1.populationMax,
    );
  });

  it('derives warehouse level from building template (default 3 when missing)', () => {
    expect(getWarehouseLevel('T2')).toBe(6);

    const original = BARBARIAN_TIER_TEMPLATES.T1.buildings;
    try {
      BARBARIAN_TIER_TEMPLATES.T1.buildings = original.filter(
        (b) => b.type !== BUILDING_TYPES.WAREHOUSE,
      );
      expect(getWarehouseLevel('T1')).toBe(3);
    } finally {
      BARBARIAN_TIER_TEMPLATES.T1.buildings = original;
    }
  });
});
