import { parseEventPayload, encodeEventPayload } from './payload.codec';

describe('payload.codec', () => {
  describe('parseEventPayload', () => {
    it('parses a valid building.completed payload', () => {
      const raw = {
        buildingId: 'b1',
        villageId: 'v1',
        buildingType: 'WOOD',
        level: 3,
        ownerId: 'u1',
        worldId: 'w1',
      };

      expect(parseEventPayload('building.completed', raw)).toEqual(raw);
    });

    it('parses a valid resources.changed payload', () => {
      const raw = {
        villageId: 'v1',
        wood: 100,
        stone: 200,
        iron: 50,
        maxPerType: 1000,
        lastUpdateTs: '2026-06-13T00:00:00.000Z',
        productionRates: { wood: 10, stone: 8, iron: 6 },
      };

      expect(parseEventPayload('resources.changed', raw)).toEqual(raw);
    });

    it('throws with event kind in message for missing required fields', () => {
      expect(() =>
        parseEventPayload('building.completed', { buildingId: 'b1' }),
      ).toThrow(/Invalid EventOutbox payload for kind "building.completed"/);
    });

    it('throws with event kind in message for wrong field types', () => {
      expect(() =>
        parseEventPayload('building.completed', {
          buildingId: 'b1',
          villageId: 'v1',
          buildingType: 'WOOD',
          level: 'three',
        }),
      ).toThrow(/Invalid EventOutbox payload for kind "building.completed"/);
    });
  });

  describe('encodeEventPayload', () => {
    it('passes through a typed payload for Prisma JSON write', () => {
      const payload = {
        buildingId: 'b1',
        villageId: 'v1',
        buildingType: 'WOOD',
        level: 3,
        ownerId: 'u1',
        worldId: 'w1',
      };

      expect(encodeEventPayload(payload)).toEqual(payload);
    });
  });
});
