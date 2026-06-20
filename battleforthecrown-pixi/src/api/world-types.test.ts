import { describe, expect, it } from 'vitest';
import { normalizeTier } from '@battleforthecrown/shared/world';
import { entityFromWorldDto } from './world-types';

describe('normalizeTier', () => {
  it.each(['T1', 'T2', 'T3', 'T4', 'T5'] as const)(
    'returns exact tier literal %s',
    (tier) => {
      expect(normalizeTier(tier)).toBe(tier);
    },
  );

  it.each([
    ['tier-1', 'T1'],
    ['Level 2', 'T2'],
    ['barbarian_t3', 'T3'],
    ['T4-extra', 'T4'],
    ['phase-5', 'T5'],
  ] as const)('maps fuzzy string %s to %s', (input, expected) => {
    expect(normalizeTier(input)).toBe(expected);
  });

  it.each([null, undefined, 42, 'T6', '', 'tier-6'])(
    'returns null for unsupported value %j',
    (value) => {
      expect(normalizeTier(value)).toBeNull();
    },
  );
});

function makeVillageDto(dataOverrides: Record<string, unknown> = {}) {
  return {
    id: 'v-test',
    worldId: 'world-1',
    kind: 'PLAYER_VILLAGE' as const,
    x: 10,
    y: 20,
    data: {
      name: 'Test Village',
      userId: 'user-42',
      ...dataOverrides,
    },
  };
}

describe('entityFromWorldDto — newbieShield mapping', () => {
  it('maps an active shield with endsAt to entity.newbieShield', () => {
    const dto = makeVillageDto({
        newbieShield: { active: true, endsAt: '2026-06-22T00:00:00.000Z', brokenAt: null },
    });
    const entity = entityFromWorldDto(dto, null);
    expect(entity.newbieShield).toEqual({
      active: true,
      endsAt: '2026-06-22T00:00:00.000Z',
      brokenAt: null,
    });
  });

  it('returns undefined when active is false', () => {
    const dto = makeVillageDto({
      newbieShield: { active: false, endsAt: '2026-06-22T00:00:00.000Z', brokenAt: null },
    });
    const entity = entityFromWorldDto(dto, null);
    expect(entity.newbieShield).toBeUndefined();
  });

  it('returns undefined when newbieShield is absent', () => {
    const dto = makeVillageDto();
    const entity = entityFromWorldDto(dto, null);
    expect(entity.newbieShield).toBeUndefined();
  });
});
