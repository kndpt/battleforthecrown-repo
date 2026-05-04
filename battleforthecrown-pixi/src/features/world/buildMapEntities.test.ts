import { describe, expect, it } from 'vitest';
import { buildMapEntities } from './buildMapEntities';
import type { WorldEntityDto, WorldVillageDto } from '@/api/world-types';

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
  data: { name: 'Other Player', userId: 'other-user', villageId: 'p1' },
};

const myVillage: WorldVillageDto = {
  id: 'mv1',
  name: 'Royaume de Kelvin',
  worldId: 'default',
  userId: 'me',
  x: 233,
  y: 247,
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
  });

  it('returns empty when both feeds are empty', () => {
    expect(buildMapEntities([], [], null)).toEqual([]);
  });
});
