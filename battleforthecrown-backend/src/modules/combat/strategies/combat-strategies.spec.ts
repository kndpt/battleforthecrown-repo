import { Test, TestingModule } from '@nestjs/testing';
import { BarbarianVillageStrategy } from './barbarian-village.strategy';
import { PlayerVillageStrategy } from './player-village.strategy';
import { LootManager } from '../loot/loot.manager';
import { CombatContext } from '../interfaces/combat-context.interface';

describe('Combat Strategies', () => {
  let barbarianStrategy: BarbarianVillageStrategy;
  let playerStrategy: PlayerVillageStrategy;
  let lootManager: LootManager;

  const mockLootManager = {
    calculateLoot: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BarbarianVillageStrategy,
        PlayerVillageStrategy,
        {
          provide: LootManager,
          useValue: mockLootManager,
        },
      ],
    }).compile();

    module.useLogger(false);

    barbarianStrategy = module.get<BarbarianVillageStrategy>(
      BarbarianVillageStrategy,
    );
    playerStrategy = module.get<PlayerVillageStrategy>(PlayerVillageStrategy);
    lootManager = module.get<LootManager>(LootManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BarbarianVillageStrategy', () => {
    it('should resolve barbarian attack with no attacker losses', async () => {
      // Arrange
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {
          id: 'exp-1',
          attackerVillageId: 'v1',
          targetKind: 'BARBARIAN_VILLAGE',
          targetRefId: 'barb-1',
          targetX: 10,
          targetY: 20,
          units: { MILITIA: 50 },
          status: 'EN_ROUTE',
          departAt: new Date(),
          arrivalAt: new Date(),
          returnAt: null,
          reportId: null,
          worldId: 'world-1',
        } as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'My Village',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: { MILITIA: 50 },
        },
        defender: {
          kind: 'BARBARIAN_VILLAGE',
          village: {
            id: 'barb-1',
            name: 'Barbarian',
            x: 10,
            y: 20,
            userId: null,
            isBarbarian: true,
          },
          units: {},
          resources: { wood: 100, stone: 50, iron: 30 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.0, lootFactor: 0.5 },
          units: { stats: {} },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      mockLootManager.calculateLoot.mockResolvedValue({
        resources: { wood: 50, stone: 25, iron: 15 },
      });

      // Act
      const result = await barbarianStrategy.resolve(context);

      // Assert
      expect(result.lossesAttacker).toEqual({});
      expect(result.lossesDefender).toBeNull();
      expect(result.survivingUnits).toEqual({ MILITIA: 50 });
      expect(result.loot.resources).toEqual({ wood: 50, stone: 25, iron: 15 });
    });

    it('should call loot manager', async () => {
      // Arrange
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {
          id: 'exp-1',
          attackerVillageId: 'v1',
          targetKind: 'BARBARIAN_VILLAGE',
          targetRefId: 'barb-1',
          targetX: 10,
          targetY: 20,
          units: { MILITIA: 30 },
          status: 'EN_ROUTE',
          departAt: new Date(),
          arrivalAt: new Date(),
          returnAt: null,
          reportId: null,
          worldId: 'world-1',
        } as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'Village',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: { MILITIA: 30 },
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
          resources: { wood: 200, stone: 100, iron: 50 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.0, lootFactor: 0.5 },
          units: { stats: {} },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      mockLootManager.calculateLoot.mockResolvedValue({
        resources: { wood: 100, stone: 50, iron: 25 },
      });

      // Act
      await barbarianStrategy.resolve(context);

      // Assert
      expect(mockLootManager.calculateLoot).toHaveBeenCalledWith(context);
    });
  });

  describe('PlayerVillageStrategy', () => {
    it('should resolve PvP combat with attacker victory', async () => {
      // Arrange
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {
          id: 'exp-1',
          attackerVillageId: 'v1',
          targetKind: 'PLAYER_VILLAGE',
          targetRefId: 'v2',
          targetX: 10,
          targetY: 20,
          units: { MILITIA: 100, ARCHER: 50 },
          status: 'EN_ROUTE',
          departAt: new Date(),
          arrivalAt: new Date(),
          returnAt: null,
          reportId: null,
          worldId: 'world-1',
        } as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'Strong Village',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: { MILITIA: 100, ARCHER: 50 },
        },
        defender: {
          kind: 'PLAYER_VILLAGE',
          village: {
            id: 'v2',
            name: 'Weak Village',
            x: 10,
            y: 20,
            userId: 'u2',
            isBarbarian: false,
          },
          units: { MILITIA: 30, ARCHER: 10 },
          resources: { wood: 500, stone: 300, iron: 200 },
        },
        config: {
          combat: { attackBonus: 1.5, defenseBonus: 1.0, lootFactor: 0.5 },
          units: {
            stats: {
              MILITIA: { attack: 10, defenseInfantry: 5, carryCapacity: 10 },
              ARCHER: { attack: 15, defenseInfantry: 3, carryCapacity: 5 },
            },
          },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      mockLootManager.calculateLoot.mockResolvedValue({
        resources: { wood: 250, stone: 150, iron: 100 },
      });

      // Act
      const result = await playerStrategy.resolve(context);

      // Assert
      expect(result.lossesAttacker).toBeDefined();
      expect(result.lossesDefender).toBeDefined();
      expect(result.lossesDefender).not.toBeNull();
      expect(result.survivingUnits).toBeDefined();
      // Attacker should win (much stronger)
      const totalAttackerLosses = Object.values(result.lossesAttacker).reduce(
        (a: number, b: number) => a + b,
        0,
      );
      const totalAttackerOriginal = 150;
      expect(totalAttackerLosses).toBeLessThan(totalAttackerOriginal * 0.8); // Less than 80% losses
    });

    it('should resolve PvP combat with defender victory', async () => {
      // Arrange
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {
          id: 'exp-1',
          attackerVillageId: 'v1',
          targetKind: 'PLAYER_VILLAGE',
          targetRefId: 'v2',
          targetX: 10,
          targetY: 20,
          units: { MILITIA: 20, ARCHER: 10 },
          status: 'EN_ROUTE',
          departAt: new Date(),
          arrivalAt: new Date(),
          returnAt: null,
          reportId: null,
          worldId: 'world-1',
        } as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'Weak Village',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: { MILITIA: 20, ARCHER: 10 },
        },
        defender: {
          kind: 'PLAYER_VILLAGE',
          village: {
            id: 'v2',
            name: 'Strong Village',
            x: 10,
            y: 20,
            userId: 'u2',
            isBarbarian: false,
          },
          units: { MILITIA: 100, ARCHER: 50 },
          resources: { wood: 500, stone: 300, iron: 200 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.5, lootFactor: 0.5 },
          units: {
            stats: {
              MILITIA: { attack: 10, defenseInfantry: 5, carryCapacity: 10 },
              ARCHER: { attack: 15, defenseInfantry: 3, carryCapacity: 5 },
            },
          },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      mockLootManager.calculateLoot.mockResolvedValue({
        resources: { wood: 0, stone: 0, iron: 0 },
      });

      // Act
      const result = await playerStrategy.resolve(context);

      // Assert
      // Attacker should lose most/all units
      const totalAttackerLosses = Object.values(result.lossesAttacker).reduce(
        (a: number, b: number) => a + b,
        0,
      );
      expect(totalAttackerLosses).toBeGreaterThan(25); // At least 25 losses (most of 30)
    });

    it('should apply bonuses to combat calculation', async () => {
      // Arrange - equal strength armies, but defender has +50% defense bonus
      // With equal power: attack = 50*10*1.0 = 500; defense = 50*5*1.5 = 375
      // Attacker wins but with losses
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {
          id: 'exp-1',
          attackerVillageId: 'v1',
          targetKind: 'PLAYER_VILLAGE',
          targetRefId: 'v2',
          targetX: 10,
          targetY: 20,
          units: { MILITIA: 50 },
          status: 'EN_ROUTE',
          departAt: new Date(),
          arrivalAt: new Date(),
          returnAt: null,
          reportId: null,
          worldId: 'world-1',
        } as any,
        attacker: {
          village: {
            id: 'v1',
            name: 'V1',
            x: 0,
            y: 0,
            userId: 'u1',
            isBarbarian: false,
          },
          units: { MILITIA: 50 },
        },
        defender: {
          kind: 'PLAYER_VILLAGE',
          village: {
            id: 'v2',
            name: 'V2',
            x: 10,
            y: 20,
            userId: 'u2',
            isBarbarian: false,
          },
          units: { MILITIA: 50 },
          resources: { wood: 100, stone: 50, iron: 30 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.5, lootFactor: 0.5 },
          units: {
            stats: {
              MILITIA: { attack: 10, defenseInfantry: 5, carryCapacity: 10 },
            },
          },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      mockLootManager.calculateLoot.mockResolvedValue({
        resources: { wood: 50, stone: 25, iron: 15 },
      });

      // Act
      const result = await playerStrategy.resolve(context);

      // Assert - Attacker still wins but with higher losses due to defense bonus
      // Attack power (500) > Defense power (375), so attacker wins
      const defenseSucceeded =
        Object.values(result.lossesDefender || {}).reduce(
          (a: number, b: number) => a + b,
          0,
        ) > 0;
      expect(defenseSucceeded).toBe(true); // Defender has casualties
      expect(result.survivingUnits).toBeDefined();
    });

    it('should calculate casualty rates correctly', async () => {
      // Arrange
      const context: CombatContext = {
        worldId: 'world-1',
        expedition: {
          id: 'exp-1',
          attackerVillageId: 'v1',
          targetKind: 'PLAYER_VILLAGE',
          targetRefId: 'v2',
          targetX: 10,
          targetY: 20,
          units: { MILITIA: 100 },
          status: 'EN_ROUTE',
          departAt: new Date(),
          arrivalAt: new Date(),
          returnAt: null,
          reportId: null,
          worldId: 'world-1',
        } as any,
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
          kind: 'PLAYER_VILLAGE',
          village: {
            id: 'v2',
            name: 'V2',
            x: 10,
            y: 20,
            userId: 'u2',
            isBarbarian: false,
          },
          units: { MILITIA: 100 },
          resources: { wood: 100, stone: 50, iron: 30 },
        },
        config: {
          combat: { attackBonus: 1.0, defenseBonus: 1.0, lootFactor: 0.5 },
          units: {
            stats: {
              MILITIA: { attack: 10, defenseInfantry: 5, carryCapacity: 10 },
            },
          },
          _distance: 14,
          _travelTime: 14000,
        } as any,
      };

      mockLootManager.calculateLoot.mockResolvedValue({
        resources: { wood: 50, stone: 25, iron: 15 },
      });

      // Act
      const result = await playerStrategy.resolve(context);

      // Assert
      expect(result.survivingUnits).toBeDefined();
      Object.entries(result.survivingUnits).forEach(([unitType, survivors]) => {
        const original = context.attacker.units[unitType];
        const losses = result.lossesAttacker[unitType] || 0;
        expect(survivors).toBe(original - losses);
      });
    });
  });
});
