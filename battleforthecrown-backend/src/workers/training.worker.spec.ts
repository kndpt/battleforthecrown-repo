import { Test, TestingModule } from '@nestjs/testing';
import PgBoss from 'pg-boss';
import { TrainingWorker } from './training.worker';
import { PrismaService } from '../infra/prisma/prisma.service';
import { OutboxPublisher } from '../modules/event/outbox-publisher.service';

interface TrainingJob {
  trainingId: string;
  villageId: string;
  unitType: string;
}

type TxType = {
  unitTraining: {
    findUnique: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
  };
  unitInventory: {
    upsert: jest.Mock;
  };
};

describe('TrainingWorker', () => {
  let worker: TrainingWorker;
  let mockBoss: {
    createQueue: jest.Mock;
    work: jest.Mock;
    send: jest.Mock;
  };
  let mockPrisma: {
    $transaction: jest.Mock;
  };
  let mockOutbox: {
    unitTrainingCompleted: jest.Mock;
  };
  let tx: TxType;

  const setupWorker = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingWorker,
        { provide: 'PG_BOSS', useValue: mockBoss as unknown as PgBoss },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OutboxPublisher, useValue: mockOutbox },
      ],
    }).compile();

    module.useLogger(false);
    worker = module.get(TrainingWorker);
  };

  beforeEach(async () => {
    mockBoss = {
      createQueue: jest.fn().mockResolvedValue(undefined),
      work: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
    };

    tx = {
      unitTraining: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      unitInventory: {
        upsert: jest.fn(),
      },
    };

    mockPrisma = {
      $transaction: jest.fn(async (callback: (tx: TxType) => Promise<void>) => {
        await callback(tx);
      }),
    };

    mockOutbox = {
      unitTrainingCompleted: jest.fn().mockResolvedValue(undefined),
    };

    await setupWorker();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  describe('onModuleInit', () => {
    it('creates the queue and registers the worker', async () => {
      await worker.onModuleInit();

      expect(mockBoss.createQueue).toHaveBeenCalledWith('training:tick');
      expect(mockBoss.work).toHaveBeenCalledWith(
        'training:tick',
        expect.any(Function),
      );

      const [, workHandler] = mockBoss.work.mock.calls[0] as [
        string,
        (job: { data: TrainingJob }) => Promise<void>,
      ];
      await workHandler({
        data: { trainingId: 'id', villageId: 'v', unitType: 'bow' },
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('propagates errors when queue creation fails', async () => {
      const error = new Error('boom');
      mockBoss.createQueue.mockRejectedValue(error);

      await expect(worker.onModuleInit()).rejects.toThrow('boom');
      expect(mockBoss.work).not.toHaveBeenCalled();
    });
  });

  describe('handleTrainingTick', () => {
    const baseTraining = {
      id: 'train-1',
      totalQty: 3,
      completedQty: 0,
      timePerUnitMs: 1_000,
    };
    const defaultPayload: TrainingJob = {
      trainingId: 'train-1',
      villageId: 'village-1',
      unitType: 'spear',
    };
    let executeJob: (overrides?: Partial<TrainingJob>) => Promise<void>;

    beforeEach(async () => {
      mockBoss.work.mockClear();
      await worker.onModuleInit();
      const [, handler] = mockBoss.work.mock.calls[0] as [
        string,
        (job: { data: TrainingJob }) => Promise<void>,
      ];
      executeJob = async (overrides: Partial<TrainingJob> = {}) => {
        await handler({
          data: {
            ...defaultPayload,
            ...overrides,
          },
        });
      };
      mockBoss.work.mockClear();
    });

    it('skips when the training record is missing', async () => {
      tx.unitTraining.findUnique.mockResolvedValue(null);

      const warnSpy = jest.spyOn(worker['logger'], 'warn');

      await executeJob();

      expect(warnSpy).toHaveBeenCalledWith(
        'Training train-1 not found, skipping',
      );
      expect(tx.unitInventory.upsert).not.toHaveBeenCalled();
    });

    it('skips when the training already completed', async () => {
      tx.unitTraining.findUnique.mockResolvedValue({
        ...baseTraining,
        completedQty: 3,
      });

      const logSpy = jest.spyOn(worker['logger'], 'log');

      await executeJob();

      expect(logSpy).toHaveBeenCalledWith(
        'Training train-1 already completed, skipping',
      );
      expect(tx.unitInventory.upsert).not.toHaveBeenCalled();
    });

    it('completes the training and emits event', async () => {
      tx.unitTraining.findUnique.mockResolvedValue({
        ...baseTraining,
        completedQty: 2,
      });

      await executeJob();

      expect(tx.unitInventory.upsert).toHaveBeenCalledWith({
        where: {
          villageId_unitType: {
            villageId: 'village-1',
            unitType: 'spear',
          },
        },
        create: {
          villageId: 'village-1',
          unitType: 'spear',
          quantity: 1,
        },
        update: {
          quantity: { increment: 1 },
        },
      });
      expect(tx.unitTraining.delete).toHaveBeenCalledWith({
        where: { id: 'train-1' },
      });
      expect(mockOutbox.unitTrainingCompleted).toHaveBeenCalledWith(
        {
          trainingId: 'train-1',
          villageId: 'village-1',
          unitType: 'spear',
          completedQty: 3,
          totalQty: 3,
        },
        tx,
      );
      expect(mockBoss.send).not.toHaveBeenCalled();
    });

    it('schedules the next tick when still training', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
      tx.unitTraining.findUnique.mockResolvedValue(baseTraining);

      await executeJob();

      expect(tx.unitTraining.update).toHaveBeenCalledWith({
        where: { id: 'train-1' },
        data: {
          completedQty: 1,
          nextUnitEta: new Date('2024-01-01T00:00:01.000Z'),
        },
      });
      expect(mockBoss.send).toHaveBeenCalledWith(
        'training:tick',
        {
          trainingId: 'train-1',
          villageId: 'village-1',
          unitType: 'spear',
        },
        {
          startAfter: new Date('2024-01-01T00:00:01.000Z'),
          singletonKey: 'training:train-1',
        },
      );
    });

    it('logs and rethrows when processing fails', async () => {
      const error = new Error('tx failed');
      mockPrisma.$transaction.mockRejectedValue(error);

      const errorSpy = jest.spyOn(worker['logger'], 'error');

      await expect(executeJob()).rejects.toThrow('tx failed');
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to process training tick for train-1:',
        error,
      );
    });
  });
});
