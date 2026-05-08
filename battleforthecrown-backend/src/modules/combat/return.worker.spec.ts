import { Test, TestingModule } from '@nestjs/testing';
import { ReturnWorker } from './return.worker';
import { PrismaService } from '../../infra/prisma/prisma.service';
import PgBoss from 'pg-boss';

describe('ReturnWorker', () => {
  let worker: ReturnWorker;

  const mockPrismaService = {
    expedition: { findUnique: jest.fn(), delete: jest.fn() },
    unitInventory: { upsert: jest.fn() },
    resourceStock: { update: jest.fn() },
    eventOutbox: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockPgBoss = {
    createQueue: jest.fn(),
    work: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnWorker,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'PG_BOSS', useValue: mockPgBoss },
      ],
    }).compile();

    module.useLogger(false);
    worker = module.get<ReturnWorker>(ReturnWorker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleReturn', () => {
    it('should return surviving units to attacker', async () => {
      const expedition = {
        id: 'exp-1',
        attackerVillageId: 'v1',
        status: 'RETURNING',
        units: { MILITIA: 100, ARCHER: 50 },
        report: {
          lossesAttacker: { MILITIA: 20, ARCHER: 10 },
          loot: { resources: { wood: 100, stone: 50, iron: 30 } },
        },
      };

      const txMock = {
        expedition: {
          findUnique: jest.fn().mockResolvedValue(expedition),
          delete: jest.fn(),
        },
        unitInventory: { upsert: jest.fn() },
        resourceStock: { update: jest.fn() },
        eventOutbox: { create: jest.fn() },
      };

      mockPrismaService.$transaction.mockImplementation((cb) => cb(txMock));

      await worker['handleReturn']({ expeditionId: 'exp-1' });

      // Verify units were returned: 80 MILITIA, 40 ARCHER
      expect(txMock.unitInventory.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            villageId_unitType: { villageId: 'v1', unitType: 'MILITIA' },
          }),
          update: expect.objectContaining({ quantity: { increment: 80 } }),
        }),
      );

      expect(txMock.unitInventory.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            villageId_unitType: { villageId: 'v1', unitType: 'ARCHER' },
          }),
          update: expect.objectContaining({ quantity: { increment: 40 } }),
        }),
      );
    });

    it('should add looted resources to attacker', async () => {
      const expedition = {
        id: 'exp-1',
        attackerVillageId: 'v1',
        status: 'RETURNING',
        units: { MILITIA: 100 },
        report: {
          lossesAttacker: { MILITIA: 30 },
          loot: { resources: { wood: 500, stone: 300, iron: 200 } },
        },
      };

      const txMock = {
        expedition: {
          findUnique: jest.fn().mockResolvedValue(expedition),
          delete: jest.fn(),
        },
        unitInventory: { upsert: jest.fn() },
        resourceStock: { update: jest.fn() },
        eventOutbox: { create: jest.fn() },
      };

      mockPrismaService.$transaction.mockImplementation((cb) => cb(txMock));

      await worker['handleReturn']({ expeditionId: 'exp-1' });

      expect(txMock.resourceStock.update).toHaveBeenCalledWith({
        where: { villageId: 'v1' },
        data: {
          wood: { increment: 500 },
          stone: { increment: 300 },
          iron: { increment: 200 },
        },
      });
    });

    it('should skip if expedition not found', async () => {
      const txMock = {
        expedition: { findUnique: jest.fn().mockResolvedValue(null) },
      };
      mockPrismaService.$transaction.mockImplementation((cb) => cb(txMock));

      await worker['handleReturn']({ expeditionId: 'non-existent' });

      expect(txMock.expedition.findUnique).toHaveBeenCalled();
    });

    it('should skip if expedition not returning', async () => {
      const txMock = {
        expedition: {
          findUnique: jest.fn().mockResolvedValue({ status: 'EN_ROUTE' }),
        },
      };
      mockPrismaService.$transaction.mockImplementation((cb) => cb(txMock));

      await worker['handleReturn']({ expeditionId: 'exp-1' });

      expect(txMock.expedition.findUnique).toHaveBeenCalled();
    });

    it('should delete expedition after return', async () => {
      const expedition = {
        id: 'exp-1',
        attackerVillageId: 'v1',
        status: 'RETURNING',
        units: { MILITIA: 100 },
        report: {
          id: 'report-1',
          lossesAttacker: { MILITIA: 20 },
          loot: { resources: { wood: 100, stone: 50, iron: 30 } },
        },
      };

      const txMock = {
        expedition: {
          findUnique: jest.fn().mockResolvedValue(expedition),
          delete: jest.fn(),
        },
        unitInventory: { upsert: jest.fn() },
        resourceStock: { update: jest.fn() },
        eventOutbox: { create: jest.fn() },
      };

      mockPrismaService.$transaction.mockImplementation((cb) => cb(txMock));

      await worker['handleReturn']({ expeditionId: 'exp-1' });

      expect(txMock.expedition.delete).toHaveBeenCalledWith({
        where: { id: 'exp-1' },
      });
    });

    it('should create return event', async () => {
      const expedition = {
        id: 'exp-1',
        attackerVillageId: 'v1',
        status: 'RETURNING',
        units: { MILITIA: 100 },
        report: {
          id: 'report-1',
          lossesAttacker: { MILITIA: 25 },
          loot: { resources: { wood: 200, stone: 100, iron: 50 } },
        },
      };

      const txMock = {
        expedition: {
          findUnique: jest.fn().mockResolvedValue(expedition),
          delete: jest.fn(),
        },
        unitInventory: { upsert: jest.fn() },
        resourceStock: { update: jest.fn() },
        eventOutbox: { create: jest.fn() },
      };

      mockPrismaService.$transaction.mockImplementation((cb) => cb(txMock));

      await worker['handleReturn']({ expeditionId: 'exp-1' });

      expect(txMock.eventOutbox.create).toHaveBeenCalledWith({
        data: {
          kind: 'battle.returned',
          aggregateId: 'v1',
          payload: {
            expeditionId: 'exp-1',
            reportId: 'report-1',
            villageId: 'v1',
            survivingUnits: { MILITIA: 75 },
            loot: { resources: { wood: 200, stone: 100, iron: 50 } },
          },
        },
      });
    });

    it('should handle no casualties', async () => {
      const expedition = {
        id: 'exp-1',
        attackerVillageId: 'v1',
        status: 'RETURNING',
        units: { MILITIA: 100 },
        report: {
          id: 'report-1',
          lossesAttacker: { MILITIA: 0 },
          loot: { resources: { wood: 0, stone: 0, iron: 0 } },
        },
      };

      const txMock = {
        expedition: {
          findUnique: jest.fn().mockResolvedValue(expedition),
          delete: jest.fn(),
        },
        unitInventory: { upsert: jest.fn() },
        resourceStock: { update: jest.fn() },
        eventOutbox: { create: jest.fn() },
      };

      mockPrismaService.$transaction.mockImplementation((cb) => cb(txMock));

      await worker['handleReturn']({ expeditionId: 'exp-1' });

      expect(txMock.unitInventory.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            villageId_unitType: { villageId: 'v1', unitType: 'MILITIA' },
          }),
          update: expect.objectContaining({ quantity: { increment: 100 } }),
        }),
      );
    });
  });
});
