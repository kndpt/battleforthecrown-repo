import { Test, TestingModule } from '@nestjs/testing';
import { CrownProductionWorker } from './crown-production.worker';
import { PrismaService } from '../infra/prisma/prisma.service';
import { CrownsService } from '../modules/crowns/crowns.service';

describe('CrownProductionWorker', () => {
  let worker: CrownProductionWorker;
  let mockPgBoss: {
    createQueue: jest.Mock;
    work: jest.Mock;
    schedule: jest.Mock;
  };
  let mockPrisma: {
    worldMembership: {
      findMany: jest.Mock;
    };
  };
  let mockCrownsService: {
    updateProduction: jest.Mock;
  };
  let workHandler: (() => Promise<void>) | undefined;

  const invokeHandler = async () => {
    if (!workHandler) {
      throw new Error('Work handler not registered');
    }

    await workHandler();
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-08T00:00:00.000Z'));

    workHandler = undefined;

    mockPgBoss = {
      createQueue: jest.fn().mockResolvedValue(undefined),
      work: jest
        .fn()
        .mockImplementation((_queue: string, handler: () => Promise<void>) => {
          workHandler = handler;
          return Promise.resolve('worker-id');
        }),
      schedule: jest.fn().mockResolvedValue(undefined),
    };

    mockPrisma = {
      worldMembership: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    mockCrownsService = {
      updateProduction: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrownProductionWorker,
        { provide: 'PG_BOSS', useValue: mockPgBoss },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CrownsService, useValue: mockCrownsService },
      ],
    }).compile();

    module.useLogger(false);
    worker = module.get(CrownProductionWorker);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('initializes queue, worker and schedule with expected configuration', async () => {
    await worker.onModuleInit();

    expect(mockPgBoss.createQueue).toHaveBeenCalledWith('crowns:production');
    expect(mockPgBoss.work).toHaveBeenCalledWith(
      'crowns:production',
      expect.any(Function),
    );
    expect(mockPgBoss.schedule).toHaveBeenCalledWith(
      'crowns:production',
      '*/5 * * * *',
      {},
      { tz: 'UTC' },
    );
  });

  it('propagates errors when queue creation fails', async () => {
    const error = new Error('queue failure');
    mockPgBoss.createQueue.mockRejectedValueOnce(error);

    await expect(worker.onModuleInit()).rejects.toThrow('queue failure');
    expect(mockPgBoss.work).not.toHaveBeenCalled();
  });

  it('propagates errors when worker registration fails', async () => {
    const error = new Error('worker failure');
    mockPgBoss.work.mockRejectedValueOnce(error);

    await expect(worker.onModuleInit()).rejects.toThrow('worker failure');
    expect(mockPgBoss.schedule).not.toHaveBeenCalled();
  });

  it('propagates errors when scheduling fails', async () => {
    const error = new Error('schedule failure');
    mockPgBoss.schedule.mockRejectedValueOnce(error);

    await expect(worker.onModuleInit()).rejects.toThrow('schedule failure');
  });

  it('fetches active memberships and updates crown production for each', async () => {
    await worker.onModuleInit();
    const memberships = [
      { userId: 'user-1', worldId: 'world-1' },
      { userId: 'user-2', worldId: 'world-2' },
    ];
    mockPrisma.worldMembership.findMany.mockResolvedValueOnce(memberships);

    await invokeHandler();

    expect(mockPrisma.worldMembership.findMany).toHaveBeenCalledWith({
      where: {
        lastLoginAt: {
          gte: new Date('2024-01-01T00:00:00.000Z'),
        },
      },
      select: { userId: true, worldId: true },
    });
    expect(mockCrownsService.updateProduction).toHaveBeenCalledTimes(2);
    expect(mockCrownsService.updateProduction).toHaveBeenNthCalledWith(
      1,
      'user-1',
      'world-1',
      true,
    );
    expect(mockCrownsService.updateProduction).toHaveBeenNthCalledWith(
      2,
      'user-2',
      'world-2',
      true,
    );
  });

  it('handles cases with no active memberships gracefully', async () => {
    await worker.onModuleInit();
    mockPrisma.worldMembership.findMany.mockResolvedValueOnce([]);

    await invokeHandler();

    expect(mockCrownsService.updateProduction).not.toHaveBeenCalled();
  });

  it('continues processing when individual crown updates fail', async () => {
    await worker.onModuleInit();
    const memberships = [
      { userId: 'user-1', worldId: 'world-1' },
      { userId: 'user-2', worldId: 'world-2' },
    ];
    mockPrisma.worldMembership.findMany.mockResolvedValueOnce(memberships);
    mockCrownsService.updateProduction
      .mockRejectedValueOnce(new Error('first failure'))
      .mockResolvedValueOnce(undefined);

    await expect(invokeHandler()).resolves.toBeUndefined();
    expect(mockCrownsService.updateProduction).toHaveBeenCalledTimes(2);
  });

  it('rethrows errors when fetching memberships fails', async () => {
    const error = new Error('database failure');
    mockPrisma.worldMembership.findMany.mockRejectedValueOnce(error);

    await expect(worker['handleCrownProduction']()).rejects.toThrow(
      'database failure',
    );
  });

  it('uses the registered pg-boss handler to trigger production logic', async () => {
    await worker.onModuleInit();
    mockPrisma.worldMembership.findMany.mockResolvedValueOnce([
      { userId: 'user-1', worldId: 'world-1' },
    ]);

    await invokeHandler();

    expect(mockCrownsService.updateProduction).toHaveBeenCalledWith(
      'user-1',
      'world-1',
      true,
    );
  });
});
