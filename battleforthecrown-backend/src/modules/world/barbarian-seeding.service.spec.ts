import { BarbarianSeedingService } from './barbarian-seeding.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import { BarbarianVillageFactory } from './barbarian-village.factory';

type WorldConfig = {
  barbarianSeeding: { enabled: boolean };
};

const buildSeedingConfig = (
  enabled: boolean,
  overrides: Partial<{
    enabled: boolean;
    rMin: number;
    rMax: number;
    chunkSize: number;
    seedVersion: number;
  }> = {},
): WorldConfig => ({
  barbarianSeeding: {
    enabled,
    ...overrides,
  },
});

describe('BarbarianSeedingService', () => {
  let service: BarbarianSeedingService;
  let prisma: { world: { findUnique: jest.Mock }; $transaction: jest.Mock };
  let worldConfig: { getConfig: jest.Mock };
  let factory: { create: jest.Mock };

  beforeEach(() => {
    prisma = {
      world: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    worldConfig = { getConfig: jest.fn() };
    factory = { create: jest.fn() };
    service = new BarbarianSeedingService(
      prisma as unknown as PrismaService,
      worldConfig as unknown as WorldConfigService,
      factory as unknown as BarbarianVillageFactory,
    );
  });

  describe('seedAroundVillage', () => {
    it('returns 0 when seeding is disabled for the world', async () => {
      worldConfig.getConfig.mockResolvedValue(buildSeedingConfig(false));

      const result = await service.seedAroundVillage({
        worldId: 'world-1',
        villageX: 100,
        villageY: 100,
      });

      expect(result).toEqual({ created: 0, chunksProcessed: 0 });
      expect(prisma.world.findUnique).not.toHaveBeenCalled();
    });

    it('throws when the world does not exist', async () => {
      worldConfig.getConfig.mockResolvedValue(
        buildSeedingConfig(true, { rMin: 0, rMax: 10, chunkSize: 50 }),
      );
      prisma.world.findUnique.mockResolvedValue(null);

      await expect(
        service.seedAroundVillage({
          worldId: 'missing',
          villageX: 50,
          villageY: 50,
        }),
      ).rejects.toThrow('World missing not found');
    });
  });
});
