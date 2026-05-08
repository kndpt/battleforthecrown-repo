import { BarbarianBackfillWorker } from './barbarian-backfill.worker';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import { BarbarianSeedingService } from './barbarian-seeding.service';
import type { BarbarianSeedingPlan } from '@battleforthecrown/shared/world';
type BarbarianSeedingConfig = BarbarianSeedingPlan;

type PrismaMock = {
  world: { findMany: jest.Mock<Promise<Array<{ id: string }>>, [unknown]> };
  village: {
    findMany: jest.Mock<Promise<Array<{ x: number; y: number }>>, [unknown]>;
  };
};

type WorldConfigMock = {
  getConfig: jest.Mock<
    Promise<{ barbarianSeeding?: BarbarianSeedingConfig }>,
    [string]
  >;
};

type SeedingMock = {
  seedAroundVillage: jest.Mock<
    Promise<{ created: number; chunksProcessed?: number }>,
    [unknown]
  >;
};

interface BarbarianBackfillInternals {
  backfillWorld(worldId: string): Promise<void>;
  isRunning: boolean;
}

describe('BarbarianBackfillWorker', () => {
  let worker: BarbarianBackfillWorker;
  let prisma: PrismaMock;
  let worldConfig: WorldConfigMock;
  let seeding: SeedingMock;

  const seedingConfig: BarbarianSeedingConfig = {
    enabled: true,
    chunkSize: 10,
    rMin: 5,
    rMax: 20,
    targetMin: 1,
    targetMax: 2,
    minSpacing: 2,
    playerExclusion: 2,
    seedVersion: 1,
    tiers: {
      T1: {
        minPoints: 0,
        maxPoints: 0,
        buildingRatio: 0.5,
        loot: {
          wood: { min: 100, max: 200 },
          stone: { min: 100, max: 200 },
          iron: { min: 50, max: 100 },
        },
        visibleIndexNoise: 0,
      },
    },
    tierRanges: [{ minDistance: 0, maxDistance: 10, tier: 'T1' }],
  };

  const createWorker = () =>
    new BarbarianBackfillWorker(
      prisma as unknown as PrismaService,
      worldConfig as unknown as WorldConfigService,
      seeding as unknown as BarbarianSeedingService,
    );

  beforeEach(() => {
    prisma = {
      world: { findMany: jest.fn() },
      village: { findMany: jest.fn() },
    };

    worldConfig = {
      getConfig: jest.fn(),
    };

    seeding = {
      seedAroundVillage: jest.fn(),
    };

    worker = createWorker();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should avoid running concurrently', async () => {
    const internals = worker as unknown as BarbarianBackfillInternals;
    internals.isRunning = true;

    await worker.handleBackfill();

    expect(prisma.world.findMany).not.toHaveBeenCalled();
  });

  it('should process open worlds via backfillWorld', async () => {
    prisma.world.findMany.mockResolvedValue([
      { id: 'world-1' },
      { id: 'world-2' },
    ]);
    const internals = worker as unknown as BarbarianBackfillInternals;
    const backfillSpy = jest
      .spyOn(internals, 'backfillWorld')
      .mockResolvedValue();

    await worker.handleBackfill();

    expect(prisma.world.findMany).toHaveBeenCalledWith({
      where: { status: 'OPEN' },
    });
    expect(backfillSpy).toHaveBeenCalledTimes(2);
    expect(backfillSpy).toHaveBeenNthCalledWith(1, 'world-1');
    expect(backfillSpy).toHaveBeenNthCalledWith(2, 'world-2');
  });

  it('should continue when backfillWorld throws for a world', async () => {
    prisma.world.findMany.mockResolvedValue([
      { id: 'world-1' },
      { id: 'world-2' },
    ]);
    const internals = worker as unknown as BarbarianBackfillInternals;
    const backfillSpy = jest
      .spyOn(internals, 'backfillWorld')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce();

    await worker.handleBackfill();

    expect(backfillSpy).toHaveBeenCalledTimes(2);
  });

  it('should skip worlds where seeding disabled', async () => {
    const internals = worker as unknown as BarbarianBackfillInternals;
    worldConfig.getConfig.mockResolvedValue({
      barbarianSeeding: { ...seedingConfig, enabled: false },
    });

    await internals.backfillWorld('world-1');

    expect(prisma.village.findMany).not.toHaveBeenCalled();
    expect(seeding.seedAroundVillage).not.toHaveBeenCalled();
  });

  it('should skip when no recent villages found', async () => {
    const internals = worker as unknown as BarbarianBackfillInternals;
    worldConfig.getConfig.mockResolvedValue({
      barbarianSeeding: seedingConfig,
    });
    prisma.village.findMany.mockResolvedValue([]);

    await internals.backfillWorld('world-1');

    expect(seeding.seedAroundVillage).not.toHaveBeenCalled();
  });

  it('should seed around up to three villages and log results', async () => {
    const internals = worker as unknown as BarbarianBackfillInternals;
    worldConfig.getConfig.mockResolvedValue({
      barbarianSeeding: seedingConfig,
    });
    prisma.village.findMany.mockResolvedValue([
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
      { x: 40, y: 40 },
    ]);
    seeding.seedAroundVillage.mockResolvedValue({
      created: 2,
      chunksProcessed: 1,
    });

    await internals.backfillWorld('world-1');

    expect(seeding.seedAroundVillage).toHaveBeenCalledTimes(3);
    expect(seeding.seedAroundVillage).toHaveBeenCalledWith({
      worldId: 'world-1',
      villageX: 10,
      villageY: 10,
    });
    expect(seeding.seedAroundVillage).toHaveBeenNthCalledWith(3, {
      worldId: 'world-1',
      villageX: 30,
      villageY: 30,
    });
  });

  it('should handle seeding errors per village without aborting', async () => {
    const internals = worker as unknown as BarbarianBackfillInternals;
    worldConfig.getConfig.mockResolvedValue({
      barbarianSeeding: seedingConfig,
    });
    prisma.village.findMany.mockResolvedValue([
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ]);
    seeding.seedAroundVillage
      .mockRejectedValueOnce(new Error('seed failed'))
      .mockResolvedValueOnce({ created: 1 });

    await internals.backfillWorld('world-1');

    expect(seeding.seedAroundVillage).toHaveBeenCalledTimes(2);
  });
});
