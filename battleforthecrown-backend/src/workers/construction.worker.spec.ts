import { Test, TestingModule } from '@nestjs/testing';
import { ConstructionWorker } from './construction.worker';
import { PrismaService } from '../infra/prisma/prisma.service';
import { ResourcesService } from '../modules/resources/resources.service';
import { CrownsService } from '../modules/crowns/crowns.service';
import { OutboxPublisher } from '../modules/event/outbox-publisher.service';

interface ConstructionJob {
  buildingId: string;
  villageId: string;
  buildingType: string;
  targetLevel: number;
}

interface TransactionMock {
  building: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
}

describe('ConstructionWorker', () => {
  let worker: ConstructionWorker;
  let mockPgBoss: {
    createQueue: jest.Mock;
    work: jest.Mock;
  };
  let mockPrisma: {
    $transaction: jest.Mock;
  };
  let mockResourcesService: {
    updateStorageLimit: jest.Mock;
  };
  let mockOutbox: {
    buildingCompleted: jest.Mock;
    resourcesChanged: jest.Mock;
  };
  let mockCrownsService: {
    recalculateOnBuildingChange: jest.Mock;
  };
  type WorkHandler = (
    jobs: { data: ConstructionJob } | Array<{ data: ConstructionJob }>,
  ) => Promise<void>;
  let workHandler: WorkHandler | undefined;

  const createJob = (
    overrides: Partial<ConstructionJob> = {},
  ): ConstructionJob => ({
    buildingId: 'building-1',
    villageId: 'village-1',
    buildingType: 'WAREHOUSE',
    targetLevel: 2,
    ...overrides,
  });

  const createTransaction = (): TransactionMock => ({
    building: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  });

  const runHandler = async (job: ConstructionJob, tx: TransactionMock) => {
    if (!workHandler) {
      throw new Error('Work handler not registered');
    }

    mockPrisma.$transaction.mockImplementation(
      async (callback: (arg: TransactionMock) => Promise<void>) => {
        return callback(tx);
      },
    );

    await workHandler({ data: job });
  };

  beforeEach(async () => {
    workHandler = undefined;

    mockPgBoss = {
      createQueue: jest.fn().mockResolvedValue(undefined),
      work: jest
        .fn()
        .mockImplementation(
          (_queue: string, _options: unknown, handler: WorkHandler) => {
            workHandler = handler;
            return Promise.resolve('worker-id');
          },
        ),
    };

    mockPrisma = {
      $transaction: jest.fn(),
    };

    mockResourcesService = {
      updateStorageLimit: jest.fn().mockResolvedValue(undefined),
    };

    mockOutbox = {
      buildingCompleted: jest.fn().mockResolvedValue(undefined),
      resourcesChanged: jest.fn().mockResolvedValue(undefined),
    };

    mockCrownsService = {
      recalculateOnBuildingChange: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConstructionWorker,
        { provide: 'PG_BOSS', useValue: mockPgBoss },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ResourcesService, useValue: mockResourcesService },
        { provide: CrownsService, useValue: mockCrownsService },
        { provide: OutboxPublisher, useValue: mockOutbox },
      ],
    }).compile();

    module.useLogger(false);
    worker = module.get(ConstructionWorker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers pg-boss queue and worker on initialization', async () => {
    await worker.onModuleInit();

    expect(mockPgBoss.createQueue).toHaveBeenCalledWith('construction:end');
    expect(mockPgBoss.work).toHaveBeenCalledWith(
      'construction:end',
      { pollingIntervalSeconds: 1, batchSize: 1 },
      expect.any(Function),
    );
  });

  it('propagates pg-boss initialization errors', async () => {
    const error = new Error('queue failure');
    mockPgBoss.createQueue.mockRejectedValueOnce(error);

    await expect(worker.onModuleInit()).rejects.toThrow('queue failure');
    expect(mockPgBoss.work).not.toHaveBeenCalled();
  });

  it('processes only the first job when pg-boss provides a batch', async () => {
    await worker.onModuleInit();

    const tx = createTransaction();
    const firstJob = createJob({ buildingId: 'first-building' });
    tx.building.findUnique.mockResolvedValue({
      id: firstJob.buildingId,
      level: 1,
      endTime: new Date(),
    });

    await expect(
      (async () => {
        if (!workHandler) {
          throw new Error('Work handler not registered');
        }

        mockPrisma.$transaction.mockImplementation(
          async (callback: (arg: TransactionMock) => Promise<void>) => {
            return callback(tx);
          },
        );

        await workHandler([
          { data: firstJob },
          { data: createJob({ buildingId: 'ignored-building' }) },
        ]);
      })(),
    ).resolves.toBeUndefined();

    expect(tx.building.update).toHaveBeenCalledWith({
      where: { id: 'first-building' },
      data: { level: 2, startTime: null, endTime: null },
    });
  });

  it('skips processing when building is missing', async () => {
    await worker.onModuleInit();
    const tx = createTransaction();
    tx.building.findUnique.mockResolvedValue(null);

    await runHandler(createJob({ buildingType: 'BARRACKS' }), tx);

    expect(tx.building.update).not.toHaveBeenCalled();
    expect(mockOutbox.buildingCompleted).not.toHaveBeenCalled();
    expect(mockResourcesService.updateStorageLimit).not.toHaveBeenCalled();
    expect(mockOutbox.resourcesChanged).not.toHaveBeenCalled();
  });

  it('skips processing when construction was cancelled', async () => {
    await worker.onModuleInit();
    const tx = createTransaction();
    tx.building.findUnique.mockResolvedValue({
      id: 'building-1',
      level: 1,
      endTime: null,
    });

    await runHandler(createJob({ buildingType: 'BARRACKS' }), tx);

    expect(tx.building.update).not.toHaveBeenCalled();
    expect(mockOutbox.buildingCompleted).not.toHaveBeenCalled();
  });

  it('skips processing when building already reached target level', async () => {
    await worker.onModuleInit();
    const tx = createTransaction();
    tx.building.findUnique.mockResolvedValue({
      id: 'building-1',
      level: 5,
      endTime: new Date(),
    });

    await runHandler(createJob({ targetLevel: 3 }), tx);

    expect(tx.building.update).not.toHaveBeenCalled();
    expect(mockOutbox.buildingCompleted).not.toHaveBeenCalled();
  });

  it('upgrades building and emits events for warehouse completion', async () => {
    await worker.onModuleInit();
    const tx = createTransaction();
    const job = createJob({ targetLevel: 4 });
    const endTime = new Date();

    tx.building.findUnique.mockResolvedValue({
      id: job.buildingId,
      level: 3,
      endTime,
    });

    await runHandler(job, tx);

    expect(tx.building.update).toHaveBeenCalledWith({
      where: { id: job.buildingId },
      data: { level: 4, startTime: null, endTime: null },
    });

    expect(mockOutbox.buildingCompleted).toHaveBeenCalledWith(
      {
        buildingId: job.buildingId,
        villageId: job.villageId,
        buildingType: job.buildingType,
        level: 4,
      },
      tx,
    );

    expect(mockResourcesService.updateStorageLimit).toHaveBeenCalledWith(
      job.villageId,
      4,
    );
    expect(mockOutbox.resourcesChanged).toHaveBeenCalledWith(job.villageId);
    expect(mockCrownsService.recalculateOnBuildingChange).toHaveBeenCalledWith(
      job.villageId,
    );
  });

  it('emits resource change events for production buildings without updating storage limit', async () => {
    await worker.onModuleInit();
    const tx = createTransaction();
    const job = createJob({ buildingType: 'WOOD' });

    tx.building.findUnique.mockResolvedValue({
      id: job.buildingId,
      level: 1,
      endTime: new Date(),
    });

    await runHandler(job, tx);

    expect(mockResourcesService.updateStorageLimit).not.toHaveBeenCalled();
    expect(mockOutbox.resourcesChanged).toHaveBeenCalledWith(job.villageId);
  });

  it('does not emit resource change events for non-production buildings', async () => {
    await worker.onModuleInit();
    const tx = createTransaction();
    const job = createJob({ buildingType: 'BARRACKS' });

    tx.building.findUnique.mockResolvedValue({
      id: job.buildingId,
      level: 1,
      endTime: new Date(),
    });

    await runHandler(job, tx);

    expect(mockOutbox.resourcesChanged).not.toHaveBeenCalled();
  });

  it('continues processing when storage limit update fails', async () => {
    await worker.onModuleInit();
    const tx = createTransaction();
    const job = createJob({ buildingType: 'WAREHOUSE' });

    tx.building.findUnique.mockResolvedValue({
      id: job.buildingId,
      level: 1,
      endTime: new Date(),
    });

    mockResourcesService.updateStorageLimit.mockRejectedValueOnce(
      new Error('storage failure'),
    );

    await expect(runHandler(job, tx)).resolves.toBeUndefined();
    expect(mockResourcesService.updateStorageLimit).toHaveBeenCalled();
    expect(mockOutbox.resourcesChanged).toHaveBeenCalled();
  });

  it('continues processing when resource change event creation fails', async () => {
    await worker.onModuleInit();
    const tx = createTransaction();
    const job = createJob({ buildingType: 'WAREHOUSE' });

    tx.building.findUnique.mockResolvedValue({
      id: job.buildingId,
      level: 1,
      endTime: new Date(),
    });

    mockOutbox.resourcesChanged.mockRejectedValueOnce(
      new Error('event failure'),
    );

    await expect(runHandler(job, tx)).resolves.toBeUndefined();
    expect(mockResourcesService.updateStorageLimit).toHaveBeenCalled();
    expect(mockCrownsService.recalculateOnBuildingChange).toHaveBeenCalled();
  });

  it('continues processing when crown recalculation fails', async () => {
    await worker.onModuleInit();
    const tx = createTransaction();
    const job = createJob({ buildingType: 'WAREHOUSE' });

    tx.building.findUnique.mockResolvedValue({
      id: job.buildingId,
      level: 1,
      endTime: new Date(),
    });

    mockCrownsService.recalculateOnBuildingChange.mockRejectedValueOnce(
      new Error('crowns failure'),
    );

    await expect(runHandler(job, tx)).resolves.toBeUndefined();
    expect(mockCrownsService.recalculateOnBuildingChange).toHaveBeenCalledWith(
      job.villageId,
    );
  });

  it('rethrows errors bubbling from the transaction', async () => {
    const job = createJob();
    const error = new Error('transaction failed');
    mockPrisma.$transaction.mockRejectedValueOnce(error);

    await expect(worker['handleConstructionComplete'](job)).rejects.toThrow(
      'transaction failed',
    );
  });
});
