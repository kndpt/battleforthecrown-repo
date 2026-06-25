import { Test, TestingModule } from '@nestjs/testing';
import {
  DEFAULT_BARBARIAN_SEEDING_PLAN,
  DEFAULT_WORLD_IDENTITY_CONFIG,
  DEFAULT_WORLD_LIFECYCLE_CONFIG,
  DEFAULT_WORLD_OYEZ_CONFIG,
  DEFAULT_WORLD_RANKINGS_CONFIG,
  DEFAULT_PLAYER_VILLAGE_PLACEMENT_PLAN,
  TempoService,
  type WorldConfig,
} from '@battleforthecrown/shared/world';
import type { UnitType } from '@battleforthecrown/shared/army';
import {
  calculateTravelTime,
  REFERENCE_SPEED,
} from '@battleforthecrown/shared/logic';
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
    tempo: {
      global: 1,
      overrides: {
        constructionSpeed: 0.5,
        unitTrainingSpeed: 1 / 3,
        resourceProduction: 1 / 1.5,
      },
    },
    lifecycle: DEFAULT_WORLD_LIFECYCLE_CONFIG,
    identity: DEFAULT_WORLD_IDENTITY_CONFIG,
    combat: {
      attackBonus: 1.0,
      defenseBonus: 1.0,
      lootFactor: 0.5,
    },
    barbarianSeeding: DEFAULT_BARBARIAN_SEEDING_PLAN,
    playerVillagePlacement: DEFAULT_PLAYER_VILLAGE_PLACEMENT_PLAN,
    fogOfWar: { enabled: true },
    oyez: DEFAULT_WORLD_OYEZ_CONFIG,
    rankings: DEFAULT_WORLD_RANKINGS_CONFIG,
  };

  const mockWorld = (configOverride: Partial<WorldConfig> = {}) => {
    mockPrismaService.world.findUnique.mockResolvedValue({
      id: 'world-1',
      config: { ...mockWorldConfig, ...configOverride },
    });
  };

  const expectedTravelMs = (
    distance: number,
    armySpeed = REFERENCE_SPEED,
    speedMultiplier = 1,
  ) =>
    Math.round(
      (distance * 60_000 * REFERENCE_SPEED) / (armySpeed * speedMultiplier),
    );

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

      expect(result.tempo).toEqual({
        global: 1,
        overrides: {
          constructionSpeed: 0.5,
          unitTrainingSpeed: 1 / 3,
          resourceProduction: 1 / 1.5,
        },
      });
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
  });

  describe('getCost', () => {
    beforeEach(() => mockWorld());

    it('returns building cost with time calculation', async () => {
      const result = await service.getCost('world-1', 'CASTLE', 2, 1);

      expect(result).toEqual({
        wood: 190,
        stone: 340,
        iron: 190,
        population: 0,
        time: 7500, // 15s * 1.0 castle bonus * 0.5 world speed = 7.5s
      });
    });

    it('applies the castle bonus to construction time', async () => {
      const result = await service.getCost('world-1', 'CASTLE', 2, 2);

      expect(result.time).toBe(6450); // 15s * 0.86 castle bonus niv2 * 0.5 = 6.45s
    });

    it('enforces a minimum time of 1000ms', async () => {
      mockWorld({
        tempo: {
          global: 1,
          overrides: {
            constructionSpeed: 0.000001,
            unitTrainingSpeed: 1,
            resourceProduction: 1,
          },
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

      expect(result).toBeCloseTo(2.125, 5);
    });

    it('returns 0 when the level is not found', async () => {
      const result = await service.getProductionRate('world-1', 'WOOD', 99);

      expect(result).toBe(0);
    });

    it('respects a custom production multiplier', async () => {
      mockWorld({
        tempo: {
          global: 1,
          overrides: { resourceProduction: 0.5 },
        },
      });

      const result = await service.getProductionRate('world-1', 'WOOD', 1);

      expect(result).toBeCloseTo((60 / 60) * 2, 5);
    });
  });

  describe('computeProductionRate', () => {
    it('applies tempo to the base production rate', () => {
      const result = service.computeProductionRate(mockWorldConfig, 'WOOD', 2);

      // level 2 WOOD = 85/60 per min; resourceProduction=1/1.5 → 85/60/(1/1.5)=2.125
      expect(result).toBeCloseTo(2.125, 5);
    });

    it('returns 0 for an unknown level', () => {
      const result = service.computeProductionRate(mockWorldConfig, 'WOOD', 99);

      expect(result).toBe(0);
    });

    it('applies ECONOMIC strategy production bonus (+20%)', () => {
      const base = service.computeProductionRate(mockWorldConfig, 'WOOD', 1);
      const withEconomic = service.computeProductionRate(
        mockWorldConfig,
        'WOOD',
        1,
        'ECONOMIC',
      );

      expect(withEconomic).toBeCloseTo(base * 1.2, 5);
    });

    it('produces the same result as getProductionRate', async () => {
      mockWorld();

      const asyncResult = await service.getProductionRate('world-1', 'WOOD', 2);
      const syncResult = service.computeProductionRate(
        mockWorldConfig,
        'WOOD',
        2,
      );

      expect(syncResult).toBe(asyncResult);
    });
  });

  describe('getStorageLimit', () => {
    it('returns the storage limit for a warehouse level', () => {
      expect(service.getStorageLimit('world-1', 5)).toBe(12000);
    });

    it('falls back to level 1 when the level is not found', () => {
      expect(service.getStorageLimit('world-1', 99)).toBe(3000);
    });
  });

  describe('getPopulationLimit', () => {
    it('returns the population limit for a quarter level', () => {
      expect(service.getPopulationLimit('world-1', 2)).toBe(279);
    });

    it('covers all effective Quarter levels with a non-zero late-game delta', () => {
      expect(
        Array.from({ length: 10 }, (_, index) =>
          service.getPopulationLimit('world-1', index + 1),
        ),
      ).toEqual([250, 279, 310, 346, 385, 430, 480, 535, 595, 665]);
      expect(service.getPopulationLimit('world-1', 8)).toBeGreaterThan(
        service.getPopulationLimit('world-1', 7),
      );
    });

    it('clamps unknown levels to the nearest defined population limit', () => {
      expect(service.getPopulationLimit('world-1', 0)).toBe(250);
      expect(service.getPopulationLimit('world-1', 99)).toBe(665);
    });
  });

  describe('createInitialPopulation', () => {
    it('returns the initial population with used and max', () => {
      const result = service.createInitialPopulation('world-1', 1);

      expect(result).toEqual({ used: 17, max: 250 });
    });

    it('uses the provided quarter level', () => {
      const result = service.createInitialPopulation('world-1', 5);

      expect(result.max).toBe(385);
    });
  });

  describe('getTravelTime', () => {
    it('computes travel time based on distance', async () => {
      mockWorld();

      const result = await service.getTravelTime('world-1', 10);

      expect(result).toBe(expectedTravelMs(10));
    });

    it('applies the world travel speed multiplier', async () => {
      mockWorld({
        tempo: {
          global: 1,
          overrides: {
            constructionSpeed: 0.5,
            unitTrainingSpeed: 1 / 3,
            travelSpeed: 0.5,
            resourceProduction: 1 / 1.5,
          },
        },
      });

      const result = await service.getTravelTime('world-1', 10);

      // 10 × 100 / (100 × 2) = 5 minutes
      expect(result).toBe(expectedTravelMs(10) * 0.5);
    });

    it('applies an army speed bonus from a strategy', async () => {
      mockWorld();

      const ms = await service.getTravelTime('world-1', 10, 'RAIDERS');

      // 10 × 100 / (100 × 1.15) ≈ 8.696 minutes
      expect(ms).toBe(expectedTravelMs(10, REFERENCE_SPEED, 1.15));
    });
  });

  describe('getTravelTimeForArmy', () => {
    beforeEach(() => mockWorld());

    it('uses the slowest unit speed', async () => {
      // MILITIA speed=10, CAVALRY speed=35 → slowest = MILITIA (10)
      const units = { MILITIA: 10, CAVALRY: 5 };

      const result = await service.getTravelTimeForArmy('world-1', 10, units);

      // 10 × 100 / (10 × 1) = 100 minutes
      expect(result).toBe(expectedTravelMs(10, 10));
    });

    it('ignores units with zero quantity', async () => {
      const units = { MILITIA: 10, CAVALRY: 0 };

      const result = await service.getTravelTimeForArmy('world-1', 10, units);

      expect(result).toBe(expectedTravelMs(10, 10));
    });

    it('falls back to the default speed when no valid unit is given', async () => {
      const units = { INVALID_UNIT: 10 } as unknown as Partial<
        Record<UnitType, number>
      >;

      const result = await service.getTravelTimeForArmy('world-1', 10, units);

      expect(result).toBe(expectedTravelMs(10));
    });

    it('handles an empty units object', async () => {
      const result = await service.getTravelTimeForArmy('world-1', 10, {});

      expect(result).toBe(expectedTravelMs(10));
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
      expect(ms).toBe(expectedTravelMs(10, 10, 0.8));
    });
  });

  describe('getLootFactor', () => {
    it('returns the loot factor from config', async () => {
      mockWorld();

      const result = await service.getLootFactor('world-1');

      expect(result).toBe(0.5);
    });
  });

  describe('getTravelTimeForSpeed', () => {
    it('returns tempo-scaled travel time for a fixed distance and speed', async () => {
      mockWorld({
        tempo: {
          global: 1,
          overrides: { travelSpeed: 0.5 },
        },
      });

      const distance = 12;
      const speed = 20;

      await expect(
        service.getTravelTimeForSpeed('world-1', distance, speed),
      ).resolves.toBe(
        Math.round(
          TempoService.applyDuration(
            calculateTravelTime(distance, 1, speed),
            { global: 1, overrides: { travelSpeed: 0.5 } },
            'travelSpeed',
          ),
        ),
      );
    });

    it('returns 0 when speed is 0', async () => {
      mockWorld();

      await expect(
        service.getTravelTimeForSpeed('world-1', 12, 0),
      ).resolves.toBe(0);
    });
  });
});
