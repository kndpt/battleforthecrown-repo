import { Test, TestingModule } from '@nestjs/testing';
import { LootManager } from './loot.manager';
import { ResourceLootProvider } from './providers/resource-loot.provider';
import { CombatContext } from '../interfaces/combat-context.interface';

describe('LootManager', () => {
  let lootManager: LootManager;
  let resourceLootProvider: ResourceLootProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LootManager, ResourceLootProvider],
    }).compile();

    module.useLogger(false);

    lootManager = module.get<LootManager>(LootManager);
    resourceLootProvider =
      module.get<ResourceLootProvider>(ResourceLootProvider);
  });

  describe('calculateLoot', () => {
    it('should calculate loot without capacity constraint', async () => {
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {} as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'V1',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: { MILITIA: 100 },
        },
        defender: {
          kind: 'BARBARIAN_VILLAGE',
          village: {
            id: 'barb-1',
            name: 'Barb',
            x: 10,
            y: 20,
            userId: null,
            isBarbarian: true,
          },
          units: {},
          resources: { wood: 1000, stone: 500, iron: 300 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.0, lootFactor: 0.5 },
          units: {
            stats: {
              MILITIA: { attack: 10, defenseInfantry: 5, carryCapacity: 50 },
            },
          },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      const result = await lootManager.calculateLoot(context);

      expect(result.resources).toEqual({ wood: 500, stone: 250, iron: 150 });
      expect(result.metadata.totalCapacityUsed).toBe(900);
      expect(result.metadata.totalCapacityAvailable).toBe(5000); // 100 * 50
      expect(result.metadata.cappedByCapacity).toBe(false);
    });

    it('should cap loot by carry capacity', async () => {
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {} as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'V1',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: { MILITIA: 10 }, // Only 10 units = 500 capacity
        },
        defender: {
          kind: 'BARBARIAN_VILLAGE',
          village: {
            id: 'barb-1',
            name: 'Barb',
            x: 10,
            y: 20,
            userId: null,
            isBarbarian: true,
          },
          units: {},
          resources: { wood: 1000, stone: 500, iron: 300 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.0, lootFactor: 0.5 },
          units: {
            stats: {
              MILITIA: { attack: 10, defenseInfantry: 5, carryCapacity: 50 },
            },
          },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      const result = await lootManager.calculateLoot(context);

      // Expected loot: 500 wood + 250 stone + 150 iron = 900 total
      // But capacity is only 500
      // So ratio = 500/900 = 0.556 (rounding may cause slight loss)
      expect(result.metadata.cappedByCapacity).toBe(true);
      expect(result.metadata.totalCapacityAvailable).toBe(500);
      const totalLooted = Object.values(result.resources || {}).reduce(
        (a: number, b: number) => a + b,
        0,
      );
      // Allow for rounding: should be close to 500 but not exceed it
      expect(totalLooted).toBeLessThanOrEqual(500);
      expect(totalLooted).toBeGreaterThan(490);
    });

    it('should handle multiple unit types with different carry capacities', async () => {
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {} as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'V1',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: { MILITIA: 100, CAVALRY: 50 },
        },
        defender: {
          kind: 'BARBARIAN_VILLAGE',
          village: {
            id: 'barb-1',
            name: 'Barb',
            x: 10,
            y: 20,
            userId: null,
            isBarbarian: true,
          },
          units: {},
          resources: { wood: 2000, stone: 1000, iron: 500 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.0, lootFactor: 0.5 },
          units: {
            stats: {
              MILITIA: { attack: 10, defenseInfantry: 5, carryCapacity: 30 },
              CAVALRY: { attack: 20, defenseInfantry: 8, carryCapacity: 80 },
            },
          },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      const result = await lootManager.calculateLoot(context);

      const totalCapacity = 100 * 30 + 50 * 80; // 3000 + 4000 = 7000
      expect(result.metadata.totalCapacityAvailable).toBe(7000);
      expect(result.metadata.cappedByCapacity).toBe(false);
    });

    it('should handle zero resources', async () => {
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {} as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'V1',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: { MILITIA: 100 },
        },
        defender: {
          kind: 'BARBARIAN_VILLAGE',
          village: {
            id: 'barb-1',
            name: 'Barb',
            x: 10,
            y: 20,
            userId: null,
            isBarbarian: true,
          },
          units: {},
          resources: { wood: 0, stone: 0, iron: 0 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.0, lootFactor: 0.5 },
          units: {
            stats: {
              MILITIA: { attack: 10, defenseInfantry: 5, carryCapacity: 50 },
            },
          },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      const result = await lootManager.calculateLoot(context);

      expect(result.resources).toEqual({ wood: 0, stone: 0, iron: 0 });
      expect(result.metadata.totalCapacityUsed).toBe(0);
      expect(result.metadata.cappedByCapacity).toBe(false);
    });

    it('should handle no units', async () => {
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {} as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'V1',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: {},
        },
        defender: {
          kind: 'BARBARIAN_VILLAGE',
          village: {
            id: 'barb-1',
            name: 'Barb',
            x: 10,
            y: 20,
            userId: null,
            isBarbarian: true,
          },
          units: {},
          resources: { wood: 1000, stone: 500, iron: 300 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.0, lootFactor: 0.5 },
          units: {
            stats: {
              MILITIA: { attack: 10, defenseInfantry: 5, carryCapacity: 50 },
            },
          },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      const result = await lootManager.calculateLoot(context);

      expect(result.metadata.totalCapacityAvailable).toBe(0);
      expect(result.resources).toEqual({ wood: 0, stone: 0, iron: 0 });
    });

    it('should calculate remaining resources after loot', async () => {
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {} as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'V1',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: { MILITIA: 100 },
        },
        defender: {
          kind: 'BARBARIAN_VILLAGE',
          village: {
            id: 'barb-1',
            name: 'Barb',
            x: 10,
            y: 20,
            userId: null,
            isBarbarian: true,
          },
          units: {},
          resources: { wood: 1000, stone: 500, iron: 300 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.0, lootFactor: 0.5 },
          units: {
            stats: {
              MILITIA: { attack: 10, defenseInfantry: 5, carryCapacity: 50 },
            },
          },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      const result = await lootManager.calculateLoot(context);

      expect(result.remainingResources).toEqual({
        wood: 500,
        stone: 250,
        iron: 150,
      });
    });

    it('should respect loot factor', async () => {
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {} as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'V1',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: { MILITIA: 100 },
        },
        defender: {
          kind: 'BARBARIAN_VILLAGE',
          village: {
            id: 'barb-1',
            name: 'Barb',
            x: 10,
            y: 20,
            userId: null,
            isBarbarian: true,
          },
          units: {},
          resources: { wood: 1000, stone: 1000, iron: 1000 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.0, lootFactor: 0.3 },
          units: {
            stats: {
              MILITIA: { attack: 10, defenseInfantry: 5, carryCapacity: 50 },
            },
          },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      const result = await lootManager.calculateLoot(context);

      // With lootFactor 0.3: 300 + 300 + 300 = 900
      expect(result.resources).toEqual({ wood: 300, stone: 300, iron: 300 });
    });
  });
});
