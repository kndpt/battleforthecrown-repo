import { Test, TestingModule } from '@nestjs/testing';
import { LootManager } from './loot.manager';
import { ResourceLootProvider } from './providers/resource-loot.provider';
import { CombatContext } from '../interfaces/combat-context.interface';
import type { UnitMap } from '@battleforthecrown/shared/army';
import { DEFAULT_COMBAT_RULES } from '@battleforthecrown/shared/combat';
import {
  makeExpeditionFixture,
  makeCombatConfigFixture,
} from '../combat-fixtures';

// Carry capacity is read from UNIT_STATS (shared) via getUnitStats().
// Reference values used by the tests below: MILITIA=25, CAVALRY=100.

const buildContext = (overrides: {
  units: UnitMap;
  resources: { wood: number; stone: number; iron: number };
  lootFactor?: number;
  distance?: number;
  isConquest?: boolean;
}): CombatContext => ({
  worldId: 'world-1',
  expedition: makeExpeditionFixture(),
  attacker: {
    village: {
      id: 'v1',
      name: 'V1',
      x: 0,
      y: 0,
      userId: 'u1',
      isBarbarian: false,
    },
    units: overrides.units,
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
    resources: overrides.resources,
    participants: [{ villageId: 'barb-1', units: {} }],
  },
  config: makeCombatConfigFixture({
    combat: {
      ...DEFAULT_COMBAT_RULES,
      lootFactor: overrides.lootFactor ?? DEFAULT_COMBAT_RULES.lootFactor,
    },
    ...(overrides.distance !== undefined
      ? { _distance: overrides.distance }
      : {}),
    ...(overrides.isConquest !== undefined
      ? { _isConquest: overrides.isConquest }
      : {}),
  }),
});

// Défauts alignés seed/DEFAULT_WORLD_CONFIG : radius 25, slope 0.01, floor 0.5.
// Plateau atteint à 75 tuiles.
const R = DEFAULT_COMBAT_RULES.lootDistance.radius;

describe('LootManager', () => {
  let lootManager: LootManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LootManager, ResourceLootProvider],
    }).compile();

    module.useLogger(false);
    lootManager = module.get<LootManager>(LootManager);
  });

  describe('calculateLoot', () => {
    it('should calculate loot without capacity constraint', async () => {
      const result = await lootManager.calculateLoot(
        buildContext({
          units: { MILITIA: 100 },
          resources: { wood: 1000, stone: 500, iron: 300 },
        }),
      );

      expect(result.resources).toEqual({ wood: 500, stone: 250, iron: 150 });
      expect(result.metadata.totalCapacityUsed).toBe(900);
      expect(result.metadata.totalCapacityAvailable).toBe(2500); // 100 × 25
      expect(result.metadata.cappedByCapacity).toBe(false);
    });

    it('should cap loot by carry capacity', async () => {
      // 10 MILITIA × 25 = 250 capacity
      // Wanted loot: 500 + 250 + 150 = 900 → ratio = 250/900 ≈ 0.278
      const result = await lootManager.calculateLoot(
        buildContext({
          units: { MILITIA: 10 },
          resources: { wood: 1000, stone: 500, iron: 300 },
        }),
      );

      expect(result.metadata.cappedByCapacity).toBe(true);
      expect(result.metadata.totalCapacityAvailable).toBe(250);
      const totalLooted = Object.values(result.resources || {}).reduce(
        (a: number, b: number) => a + b,
        0,
      );
      expect(totalLooted).toBeLessThanOrEqual(250);
      expect(totalLooted).toBeGreaterThan(240);
    });

    it('should handle multiple unit types with different carry capacities', async () => {
      // 100 MILITIA × 25 + 50 CAVALRY × 100 = 2500 + 5000 = 7500
      const result = await lootManager.calculateLoot(
        buildContext({
          units: { MILITIA: 100, CAVALRY: 50 },
          resources: { wood: 2000, stone: 1000, iron: 500 },
        }),
      );

      expect(result.metadata.totalCapacityAvailable).toBe(7500);
      expect(result.metadata.cappedByCapacity).toBe(false);
    });

    it('should handle zero resources', async () => {
      const result = await lootManager.calculateLoot(
        buildContext({
          units: { MILITIA: 100 },
          resources: { wood: 0, stone: 0, iron: 0 },
        }),
      );

      expect(result.resources).toEqual({ wood: 0, stone: 0, iron: 0 });
      expect(result.metadata.totalCapacityUsed).toBe(0);
      expect(result.metadata.cappedByCapacity).toBe(false);
    });

    it('should handle no units', async () => {
      const result = await lootManager.calculateLoot(
        buildContext({
          units: {},
          resources: { wood: 1000, stone: 500, iron: 300 },
        }),
      );

      expect(result.metadata.totalCapacityAvailable).toBe(0);
      expect(result.resources).toEqual({ wood: 0, stone: 0, iron: 0 });
    });

    it('should calculate remaining resources after loot', async () => {
      const result = await lootManager.calculateLoot(
        buildContext({
          units: { MILITIA: 100 },
          resources: { wood: 1000, stone: 500, iron: 300 },
        }),
      );

      expect(result.remainingResources).toEqual({
        wood: 500,
        stone: 250,
        iron: 150,
      });
    });

    it('should respect loot factor', async () => {
      const result = await lootManager.calculateLoot(
        buildContext({
          units: { MILITIA: 100 },
          resources: { wood: 1000, stone: 1000, iron: 1000 },
          lootFactor: 0.3,
        }),
      );

      expect(result.resources).toEqual({ wood: 300, stone: 300, iron: 300 });
    });
  });

  describe('distance loot friction (raid only)', () => {
    it('leaves capacity untouched at/under the radius (non-régression)', async () => {
      // 100 MILITIA × 25 = 2500 capacity, distance ≤ radius → facteur 1.
      // Potentiel (lootFactor 0.5) = 1500 < 2500 → pas de cap.
      const result = await lootManager.calculateLoot(
        buildContext({
          units: { MILITIA: 100 },
          resources: { wood: 1000, stone: 1000, iron: 1000 },
          distance: R,
        }),
      );

      expect(result.metadata.totalCapacityAvailable).toBe(2500);
      expect(result.metadata.cappedByCapacity).toBe(false);
    });

    it('reduces carry capacity beyond the radius', async () => {
      // distance 75 → plateau floor 0.5 → capacity = floor(2500 × 0.5) = 1250.
      // Potentiel 1500 > 1250 → capped par la friction distance.
      const result = await lootManager.calculateLoot(
        buildContext({
          units: { MILITIA: 100 },
          resources: { wood: 1000, stone: 1000, iron: 1000 },
          distance: 75,
        }),
      );

      expect(result.metadata.totalCapacityAvailable).toBe(1250);
      expect(result.metadata.cappedByCapacity).toBe(true);
      const totalLooted = Object.values(result.resources ?? {}).reduce(
        (a: number, b: number) => a + b,
        0,
      );
      expect(totalLooted).toBeLessThanOrEqual(1250);
    });

    it('never drops below the floor, even at extreme distance', async () => {
      // distance 100_000 → plancher 0.5 (jamais moins) → capacity = 1250.
      const result = await lootManager.calculateLoot(
        buildContext({
          units: { MILITIA: 100 },
          resources: { wood: 2000, stone: 2000, iron: 2000 },
          distance: 100_000,
        }),
      );

      expect(result.metadata.totalCapacityAvailable).toBe(1250);
    });

    it('exempts conquest (Noble) from the distance malus', async () => {
      // _isConquest = true → facteur 1 malgré une distance ≫ radius.
      const result = await lootManager.calculateLoot(
        buildContext({
          units: { MILITIA: 100 },
          resources: { wood: 2000, stone: 2000, iron: 2000 },
          distance: 1000,
          isConquest: true,
        }),
      );

      expect(result.metadata.totalCapacityAvailable).toBe(2500);
    });
  });
});
