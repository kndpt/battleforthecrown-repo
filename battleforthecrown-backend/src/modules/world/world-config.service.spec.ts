import { Test, TestingModule } from '@nestjs/testing';
import {
  DEFAULT_BARBARIAN_SEEDING_PLAN,
  DEFAULT_PLAYER_VILLAGE_PLACEMENT_PLAN,
  type WorldConfig,
} from '@battleforthecrown/shared/world';
import type { UnitType } from '@battleforthecrown/shared/army';
import { WorldConfigService } from './world-config.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

describe('WorldConfigService', () => {
  let service: WorldConfigService;
  const mockPrismaService = {
    world: {
      findUnique: jest.fn(),
    },
  };

  const mockWorldConfig: WorldConfig = {
    gameSpeed: {
      construction: 2,
      training: 3,
      travel: 1,
      capture: 1,
    },
    economy: {
      productionRate: 1.5,
    },
    combat: {
      attackBonus: 1.0,
      defenseBonus: 1.0,
      lootFactor: 0.5,
    },
    barbarianSeeding: DEFAULT_BARBARIAN_SEEDING_PLAN,
    playerVillagePlacement: DEFAULT_PLAYER_VILLAGE_PLACEMENT_PLAN,
    fogOfWar: { enabled: true },
  };

  const mockWorld = (configOverride: Partial<WorldConfig> = {}) => {
    mockPrismaService.world.findUnique.mockResolvedValue({
      id: 'world-1',
      config: { ...mockWorldConfig, ...configOverride },
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorldConfigService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WorldConfigService>(WorldConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('returns the parsed config', async () => {
      mockWorld();

      const result = await service.getConfig('world-1');

      expect(result.gameSpeed).toEqual({
        construction: 2,
        training: 3,
        travel: 1,
        capture: 1,
      });
      expect(result.economy).toEqual({ productionRate: 1.5 });
      expect(result.fogOfWar.enabled).toBe(true);
    });

    it('throws when the world is not found', async () => {
      mockPrismaService.world.findUnique.mockResolvedValue(null);

      await expect(service.getConfig('non-existent')).rejects.toThrow(
        'World non-existent not found',
      );
    });

    it('throws when the config is null', async () => {
      mockPrismaService.world.findUnique.mockResolvedValue({
        id: 'world-1',
        config: null,
      });

      await expect(service.getConfig('world-1')).rejects.toThrow(
        /invalid config/,
      );
    });

    it('throws when a required section is missing', async () => {
      const incomplete = { ...mockWorldConfig };
      delete (incomplete as Partial<WorldConfig>).fogOfWar;
      mockPrismaService.world.findUnique.mockResolvedValue({
        id: 'world-1',
        config: incomplete,
      });

      await expect(service.getConfig('world-1')).rejects.toThrow(
        /invalid config/,
      );
    });

    it('throws on unknown extra keys (strict schema)', async () => {
      mockPrismaService.world.findUnique.mockResolvedValue({
        id: 'world-1',
        config: { ...mockWorldConfig, castle: { something: true } },
      });

      await expect(service.getConfig('world-1')).rejects.toThrow(
        /invalid config/,
      );
    });

    it('defaults capture speed for legacy configs', async () => {
      mockPrismaService.world.findUnique.mockResolvedValue({
        id: 'world-1',
        config: {
          ...mockWorldConfig,
          gameSpeed: {
            construction: 2,
            training: 3,
            travel: 1,
          },
        },
      });

      const result = await service.getConfig('world-1');

      expect(result.gameSpeed.capture).toBe(1);
    });
  });

  describe('getCost', () => {
    beforeEach(() => mockWorld());

    it('returns building cost with time calculation', async () => {
      const result = await service.getCost('world-1', 'CASTLE', 2, 1);

      expect(result).toEqual({
        wood: 75,
        stone: 145,
        iron: 75,
        population: 0,
        time: 180000, // 360s * 1.0 castle bonus / 2 speed = 180s
      });
    });

    it('applies the castle bonus to construction time', async () => {
      const result = await service.getCost('world-1', 'CASTLE', 2, 2);

      expect(result.time).toBe(172800); // 360s * 0.96 / 2 = 172.8s
    });

    it('enforces a minimum time of 1000ms', async () => {
      mockWorld({
        gameSpeed: {
          construction: 1000000,
          training: 1,
          travel: 1,
          capture: 1,
        },
      });

      const result = await service.getCost('world-1', 'WOOD', 1, 1);

      expect(result.time).toBe(1000);
    });

    it('throws when the cost is not found', async () => {
      await expect(
        service.getCost('world-1', 'INVALID_BUILDING', 1, 1),
      ).rejects.toThrow('Unknown building type INVALID_BUILDING');
    });
  });

  describe('getProductionRate', () => {
    beforeEach(() => mockWorld());

    it('returns the production rate with multiplier applied', async () => {
      const result = await service.getProductionRate('world-1', 'WOOD', 2);

      expect(result).toBeCloseTo(1.75, 5);
    });

    it('returns 0 when the level is not found', async () => {
      const result = await service.getProductionRate('world-1', 'WOOD', 99);

      expect(result).toBe(0);
    });

    it('respects a custom production multiplier', async () => {
      mockWorld({
        economy: { productionRate: 2 },
      });

      const result = await service.getProductionRate('world-1', 'WOOD', 1);

      expect(result).toBeCloseTo((50 / 60) * 2, 5);
    });
  });

  describe('getStorageLimit', () => {
    it('returns the storage limit for a warehouse level', () => {
      expect(service.getStorageLimit('world-1', 5)).toBe(5250);
    });

    it('falls back to level 1 when the level is not found', () => {
      expect(service.getStorageLimit('world-1', 99)).toBe(3000);
    });
  });

  describe('getPopulationLimit', () => {
    it('returns the population limit for a farm level', () => {
      expect(service.getPopulationLimit('world-1', 2)).toBe(279);
    });

    it('returns the default 250 when the level is not found', () => {
      expect(service.getPopulationLimit('world-1', 99)).toBe(250);
    });
  });

  describe('createInitialPopulation', () => {
    it('returns the initial population with used and max', () => {
      const result = service.createInitialPopulation('world-1', 1);

      expect(result).toEqual({ used: 17, max: 250 });
    });

    it('uses the provided farm level', () => {
      const result = service.createInitialPopulation('world-1', 5);

      expect(result.max).toBe(385);
    });
  });

  describe('getTravelTime', () => {
    it('computes travel time based on distance', async () => {
      mockWorld();

      const result = await service.getTravelTime('world-1', 10);

      // 10 tiles × REFERENCE_SPEED / (REFERENCE_SPEED × 1) = 10 minutes
      expect(result).toBe(600000);
    });

    it('applies the world travel speed multiplier', async () => {
      mockWorld({
        gameSpeed: {
          construction: 2,
          training: 3,
          travel: 2,
          capture: 1,
        },
      });

      const result = await service.getTravelTime('world-1', 10);

      // 10 × 100 / (100 × 2) = 5 minutes
      expect(result).toBe(300000);
    });

    it('applies an army speed bonus from a strategy', async () => {
      mockWorld();

      const ms = await service.getTravelTime('world-1', 10, 'RAIDERS');

      // 10 × 100 / (100 × 1.15) ≈ 8.696 minutes
      expect(ms).toBe(521739);
    });
  });

  describe('getTravelTimeForArmy', () => {
    beforeEach(() => mockWorld());

    it('uses the slowest unit speed', async () => {
      // MILITIA speed=10, CAVALRY speed=35 → slowest = MILITIA (10)
      const units = { MILITIA: 10, CAVALRY: 5 };

      const result = await service.getTravelTimeForArmy('world-1', 10, units);

      // 10 × 100 / (10 × 1) = 100 minutes
      expect(result).toBe(6000000);
    });

    it('ignores units with zero quantity', async () => {
      const units = { MILITIA: 10, CAVALRY: 0 };

      const result = await service.getTravelTimeForArmy('world-1', 10, units);

      expect(result).toBe(6000000);
    });

    it('falls back to the default speed when no valid unit is given', async () => {
      const units = { INVALID_UNIT: 10 } as unknown as Partial<
        Record<UnitType, number>
      >;

      const result = await service.getTravelTimeForArmy('world-1', 10, units);

      expect(result).toBe(600000);
    });

    it('handles an empty units object', async () => {
      const result = await service.getTravelTimeForArmy('world-1', 10, {});

      expect(result).toBe(600000);
    });

    it('applies a strategy army speed bonus', async () => {
      const units = { MILITIA: 10, CAVALRY: 5 };

      const ms = await service.getTravelTimeForArmy(
        'world-1',
        10,
        units,
        'FORTRESS',
      );

      // 10 × 100 / (10 × 0.8) = 125 minutes
      expect(ms).toBe(7500000);
    });
  });

  describe('getLootFactor', () => {
    it('returns the loot factor from config', async () => {
      mockWorld();

      const result = await service.getLootFactor('world-1');

      expect(result).toBe(0.5);
    });
  });
});
