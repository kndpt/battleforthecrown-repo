import { describe, expect, it } from 'vitest';
import { isFoggedEntity, normalizeTier } from '@battleforthecrown/shared/world';
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

describe('isFoggedEntity — fogged-path dispatch', () => {
  const foggedDto = { kind: 'fogged' as const, id: 'fog-7', x: 33, y: 44 };

  it('narrows a fogged response to WorldEntityFogged', () => {
    expect(isFoggedEntity(foggedDto)).toBe(true);
  });

  it.each(['PLAYER_VILLAGE', 'BARBARIAN_VILLAGE', 'RESOURCE_EXTRACTION_SITE'])(
    'rejects the non-fogged kind %s',
    (kind) => {
      expect(
        isFoggedEntity({ id: 'e-1', worldId: 'w-1', kind, x: 0, y: 0, data: {} }),
      ).toBe(false);
    },
  );

  it('maps a fogged dto to a position-only MapEntity via entityFromWorldDto', () => {
    const entity = entityFromWorldDto(foggedDto, 'user-42');
    expect(entity).toEqual({
      id: 'fog-7',
      kind: 'fogged',
      isMine: false,
      x: 33,
      y: 44,
      name: '',
      tier: null,
      castleLevel: null,
    });
  });

  it('keeps fogged entities un-owned even when a userId is present', () => {
    // Fogged entities expose no owner data, so isMine must stay false
    // regardless of the current player id.
    expect(entityFromWorldDto(foggedDto, 'user-42').isMine).toBe(false);
    expect(entityFromWorldDto(foggedDto, null).isMine).toBe(false);
  });
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

// normalizeResourceType / normalizeSiteActivity aren't exported directly;
// they're exercised through entityFromWorldDto (their only call site), which
// mirrors the actual contract observed in the implementation: a strict
// whitelist that falls back to `undefined` for anything else.
describe('entityFromWorldDto — resourceType/siteActivity normalization', () => {
  function makeSiteDto(dataOverrides: Record<string, unknown> = {}) {
    return {
      id: 'site-test',
      worldId: 'world-1',
      kind: 'RESOURCE_EXTRACTION_SITE' as const,
      x: 1,
      y: 2,
      data: { ...dataOverrides },
    };
  }

  it.each(['WOOD', 'STONE', 'IRON'] as const)(
    'keeps valid resourceType %s',
    (resourceType) => {
      const entity = entityFromWorldDto(
        makeSiteDto({ resourceType }),
        null,
      );
      expect(entity.resourceType).toBe(resourceType);
    },
  );

  it.each([undefined, null, 'GOLD', 42, ''])(
    'falls back to undefined for invalid resourceType %j',
    (resourceType) => {
      const entity = entityFromWorldDto(
        makeSiteDto({ resourceType }),
        null,
      );
      expect(entity.resourceType).toBeUndefined();
    },
  );

  it.each(['IDLE', 'EXPLOITING'] as const)(
    'keeps valid siteActivity %s',
    (activity) => {
      const entity = entityFromWorldDto(makeSiteDto({ activity }), null);
      expect(entity.siteActivity).toBe(activity);
    },
  );

  it.each([undefined, null, 'DEPLETED', 1, ''])(
    'falls back to undefined for invalid siteActivity %j',
    (activity) => {
      const entity = entityFromWorldDto(makeSiteDto({ activity }), null);
      expect(entity.siteActivity).toBeUndefined();
    },
  );
});
