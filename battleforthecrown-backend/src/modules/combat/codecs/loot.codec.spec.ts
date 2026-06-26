import {
  encodeCombatLoot,
  encodeLootResult,
  parseCombatLoot,
  parseLootResources,
  parseLootResult,
} from './loot.codec';

describe('loot.codec', () => {
  const validLootResult = {
    resources: { wood: 500, stone: 250, iron: 150 },
    remainingResources: { wood: 500, stone: 250, iron: 150 },
    metadata: {
      totalCapacityUsed: 900,
      totalCapacityAvailable: 2500,
      cappedByCapacity: false,
    },
  };

  const validCombatLoot = {
    resources: { wood: 100, stone: 50, iron: 25 },
    remainingResources: { wood: 900, stone: 450, iron: 275 },
  };

  describe('parseLootResult', () => {
    it('parses a valid LootResult from Prisma JSON', () => {
      expect(parseLootResult(validLootResult)).toEqual(validLootResult);
    });

    it('accepts metadata-only LootResult without resources', () => {
      const metadataOnly = {
        metadata: {
          totalCapacityUsed: 0,
          totalCapacityAvailable: 1000,
          cappedByCapacity: false,
        },
      };

      expect(parseLootResult(metadataOnly)).toEqual(metadataOnly);
    });

    it('throws when metadata is missing', () => {
      expect(() =>
        parseLootResult({ resources: { wood: 1, stone: 0, iron: 0 } }),
      ).toThrow(/Invalid combatReport\.loot JSON shape:/);
    });

    it('throws when a resource amount is negative', () => {
      expect(() =>
        parseLootResult({
          ...validLootResult,
          resources: { wood: -1, stone: 0, iron: 0 },
        }),
      ).toThrow(/Invalid combatReport\.loot JSON shape:/);
    });
  });

  describe('parseCombatLoot', () => {
    it('parses a valid CombatLoot from Prisma JSON', () => {
      expect(parseCombatLoot(validCombatLoot)).toEqual(validCombatLoot);
    });

    it('accepts an empty object as empty combat loot', () => {
      expect(parseCombatLoot({})).toEqual({});
    });

    it('throws when a resource amount is negative', () => {
      expect(() =>
        parseCombatLoot({
          resources: { wood: 0, stone: -5, iron: 0 },
        }),
      ).toThrow(/Invalid combat loot JSON shape:/);
    });
  });

  describe('parseLootResources', () => {
    const field = 'test.resources';

    it('parses valid resources', () => {
      expect(parseLootResources({ wood: 100, stone: 50, iron: 25 }, field)).toEqual({
        wood: 100,
        stone: 50,
        iron: 25,
      });
    });

    it('throws on missing key', () => {
      expect(() => parseLootResources({ wood: 10, stone: 5 }, field)).toThrow(
        /Invalid test\.resources JSON shape:/,
      );
    });

    it('throws on negative value', () => {
      expect(() =>
        parseLootResources({ wood: -1, stone: 0, iron: 0 }, field),
      ).toThrow(/Invalid test\.resources JSON shape:/);
    });

    it('throws on non-object input', () => {
      expect(() => parseLootResources('bad', field)).toThrow(
        /Invalid test\.resources JSON shape:/,
      );
    });
  });

  describe('encodeLootResult', () => {
    it('passes through a typed LootResult for Prisma JSON write', () => {
      expect(encodeLootResult(validLootResult)).toEqual(validLootResult);
    });
  });

  describe('encodeCombatLoot', () => {
    it('passes through a typed CombatLoot for Prisma JSON write', () => {
      expect(encodeCombatLoot(validCombatLoot)).toEqual(validCombatLoot);
    });
  });
});
