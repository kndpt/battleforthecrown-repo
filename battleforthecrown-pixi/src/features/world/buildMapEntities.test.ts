import { describe, expect, it } from 'vitest';
import {
  buildMapEntities,
  filterEntitiesByVision,
  filterEntitiesForNarrativeTarget,
} from './buildMapEntities';
import type { MapEntity, WorldEntityDto, WorldVillageDto } from '@/api/world-types';

const barbarian: WorldEntityDto = {
  id: 'b1',
  worldId: 'default',
  kind: 'BARBARIAN_VILLAGE',
  x: 100,
  y: 200,
  data: { tier: 'T2', name: 'Lost Outpost', villageId: 'b1' },
};

const playerEntity: WorldEntityDto = {
  id: 'p1',
  worldId: 'default',
  kind: 'PLAYER_VILLAGE',
  x: 240,
  y: 250,
  data: {
    name: 'Other Player',
    userId: 'other-user',
    ownerDisplayName: 'Foreign Lord',
    villageId: 'p1',
    castleLevel: 8,
  },
};

const myVillage: WorldVillageDto = {
  id: 'mv1',
  name: 'Royaume de Kelvin',
  worldId: 'default',
  userId: 'me',
  x: 233,
  y: 247,
  castleLevel: 10,
};

describe('buildMapEntities', () => {
  it('maps barbarians and players from the world feed', () => {
    const result = buildMapEntities([barbarian, playerEntity], [], null);
    expect(result).toHaveLength(2);
    const barb = result.find((e) => e.id === 'b1');
    expect(barb?.kind).toBe('BARBARIAN_VILLAGE');
    expect(barb?.tier).toBe('T2');
    expect(barb?.isMine).toBe(false);

    const other = result.find((e) => e.id === 'p1');
    expect(other?.kind).toBe('PLAYER_VILLAGE');
    expect(other?.isMine).toBe(false);
    expect(other?.ownerId).toBe('other-user');
    expect(other?.castleLevel).toBe(8);
  });

  it('maps an open capture window from public entity data', () => {
    const result = buildMapEntities(
      [
        {
          ...barbarian,
          data: {
            ...barbarian.data,
            captureWindow: {
              status: 'OPEN',
              pendingConquestId: 'pc1',
              attackerVillageId: 'attacker-village',
              captureUntil: '2026-05-13T22:00:00.000Z',
            },
          },
        },
      ],
      [],
      null,
    );

    expect(result[0].captureWindow).toEqual({
      status: 'OPEN',
      pendingConquestId: 'pc1',
      attackerVillageId: 'attacker-village',
      captureUntil: '2026-05-13T22:00:00.000Z',
    });
  });

  it('flags entities owned by myUserId as `isMine`', () => {
    const mineFromFeed: WorldEntityDto = {
      ...playerEntity,
      id: 'mine',
      data: { ...playerEntity.data, userId: 'me' },
    };
    const result = buildMapEntities([mineFromFeed], [], 'me');
    expect(result[0].isMine).toBe(true);
  });

  it('overrides feed entries with my villages list (canonical source)', () => {
    const sameIdInFeed: WorldEntityDto = {
      ...playerEntity,
      id: 'mv1',
      data: { ...playerEntity.data, userId: 'someone-else' },
    };
    const result = buildMapEntities([sameIdInFeed], [myVillage], 'me');
    const entry = result.find((e) => e.id === 'mv1');
    expect(entry?.isMine).toBe(true);
    expect(entry?.name).toBe('Royaume de Kelvin');
    expect(entry?.x).toBe(233);
    expect(entry?.y).toBe(247);
    expect(entry?.castleLevel).toBe(10);
  });

  it('preserves capture state when my villages override the world feed', () => {
    const sameIdInFeed: WorldEntityDto = {
      ...playerEntity,
      id: 'mv1',
      data: {
        ...playerEntity.data,
        userId: 'me',
        captureWindow: {
          status: 'OPEN',
          pendingConquestId: 'pc-owned',
          attackerVillageId: 'attacker-village',
          captureUntil: '2026-05-13T22:00:00.000Z',
        },
      },
    };

    const result = buildMapEntities([sameIdInFeed], [myVillage], 'me');
    const entry = result.find((e) => e.id === 'mv1');

    expect(entry?.isMine).toBe(true);
    expect(entry?.captureWindow).toEqual({
      status: 'OPEN',
      pendingConquestId: 'pc-owned',
      attackerVillageId: 'attacker-village',
      captureUntil: '2026-05-13T22:00:00.000Z',
    });
  });

  it('returns empty when both feeds are empty', () => {
    expect(buildMapEntities([], [], null)).toEqual([]);
  });
});

describe('filterEntitiesByVision', () => {
  const mine: MapEntity = {
    id: 'mine',
    kind: 'PLAYER_VILLAGE',
    x: 0,
    y: 0,
    isMine: true,
    ownerId: 'me',
    name: 'Mine',
    tier: null,
  };
  const inside: MapEntity = {
    id: 'inside',
    kind: 'BARBARIAN_VILLAGE',
    x: 50,
    y: 0,
    isMine: false,
    tier: 'T1',
    name: 'Inside',
  };
  const outside: MapEntity = {
    id: 'outside',
    kind: 'BARBARIAN_VILLAGE',
    x: 51,
    y: 0,
    isMine: false,
    tier: 'T1',
    name: 'Outside',
  };

  it('uses backend-provided vision disks instead of one selected village level', () => {
    const secondVillage: MapEntity = {
      ...mine,
      id: 'mine-2',
      x: 100,
      y: 100,
      name: 'Mine 2',
    };
    const insideSecondDisk: MapEntity = {
      ...inside,
      id: 'inside-second',
      x: 110,
      y: 100,
      name: 'Inside second',
    };

    expect(
      filterEntitiesByVision([mine, secondVillage, inside, insideSecondDisk, outside], [
        { x: 0, y: 0, radius: 50 },
        { x: 100, y: 100, radius: 10 },
      ]),
    ).toEqual([mine, secondVillage, inside, insideSecondDisk]);
  });

  it('keeps only own villages when watchtower vision is locked', () => {
    expect(filterEntitiesByVision([mine, inside], [])).toEqual([mine]);
  });

  it('does not locally filter entities when server fog is disabled', () => {
    expect(filterEntitiesByVision([mine, inside], [], false)).toEqual([mine, inside]);
  });

  it('keeps only own entities and the narrative target during onboarding step 6', () => {
    expect(filterEntitiesForNarrativeTarget([mine, inside, outside], 'inside')).toEqual([
      mine,
      inside,
    ]);
  });
});
