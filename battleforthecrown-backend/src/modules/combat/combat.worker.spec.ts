import { Test, TestingModule } from '@nestjs/testing';
import { CombatWorker } from './combat.worker';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from '../world/world-config.service';
import { ResourcesService } from '../resources/resources.service';
import { BarbarianVillageStrategy } from './strategies/barbarian-village.strategy';
import { PlayerVillageStrategy } from './strategies/player-village.strategy';

/* eslint-disable @typescript-eslint/no-unsafe-call */

describe('CombatWorker', () => {
  let worker: CombatWorker;

  const mockPrismaService = {
    expedition: { findUnique: jest.fn(), update: jest.fn() },
    village: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    resourceStock: { update: jest.fn() },
    unitInventory: { update: jest.fn() },
    combatReport: { create: jest.fn() },
    eventOutbox: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockWorldConfigService = {
    calculateDistance: jest.fn().mockReturnValue(14),
    getTravelTimeForArmy: jest.fn().mockResolvedValue(14000),
    getTravelTime: jest.fn().mockResolvedValue(14000),
    getConfig: jest.fn().mockResolvedValue({
      combat: { attackBonus: 1.0, defenseBonus: 1.0, lootFactor: 0.5 },
      units: { stats: {} },
    }),
  };

  const mockResourcesService = {
    calculateCurrentResources: jest
      .fn()
      .mockResolvedValue({ wood: 100, stone: 50, iron: 30 }),
  };

  const mockBarbarianStrategy = { resolve: jest.fn() };
  const mockPlayerStrategy = { resolve: jest.fn() };
  const mockPgBoss = {
    createQueue: jest.fn(),
    work: jest.fn(),
    send: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CombatWorker,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WorldConfigService, useValue: mockWorldConfigService },
        { provide: ResourcesService, useValue: mockResourcesService },
        { provide: BarbarianVillageStrategy, useValue: mockBarbarianStrategy },
        { provide: PlayerVillageStrategy, useValue: mockPlayerStrategy },
        { provide: 'PG_BOSS', useValue: mockPgBoss },
      ],
    }).compile();

    module.useLogger(false);
    worker = module.get<CombatWorker>(CombatWorker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCombatResolution', () => {
    it('should resolve barbarian combat', async () => {
      const expedition = {
        id: 'exp-1',
        worldId: 'world-1',
        attackerVillageId: 'v1',
        targetRefId: 'barb-1',
        targetKind: 'BARBARIAN_VILLAGE',
        targetX: 10,
        targetY: 20,
        units: { MILITIA: 100 },
        status: 'EN_ROUTE',
      };

      const txMock = {
        expedition: {
          findUnique: jest.fn().mockResolvedValue(expedition),
          update: jest.fn(),
        },
        village: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
        resourceStock: { update: jest.fn() },
        unitInventory: { update: jest.fn() },
        combatReport: {
          create: jest.fn().mockResolvedValue({ id: 'report-1' }),
        },
        eventOutbox: { create: jest.fn() },
        villageStrategyConfig: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      mockPrismaService.$transaction.mockImplementation((cb) =>
        cb(txMock as never),
      );

      txMock.village.findUnique
        .mockResolvedValueOnce({ id: 'barb-1', isBarbarian: true })
        .mockResolvedValueOnce({
          id: 'v1',
          userId: 'u1',
          x: 0,
          y: 0,
          name: 'V1',
        })
        .mockResolvedValueOnce({ id: 'barb-1' })
        .mockResolvedValueOnce({ id: 'v1', name: 'V1', x: 0, y: 0 });

      txMock.village.findUniqueOrThrow
        .mockResolvedValueOnce({ resourceStock: { wood: 100 }, buildings: [] })
        .mockResolvedValueOnce({ unitInventory: [] });

      mockBarbarianStrategy.resolve.mockResolvedValue({
        loot: { resources: { wood: 50, stone: 25, iron: 15 } },
        lossesAttacker: {},
        lossesDefender: null,
        survivingUnits: { MILITIA: 100 },
      });

      await worker['handleCombatResolution']({ expeditionId: 'exp-1' });

      expect(txMock.combatReport.create).toHaveBeenCalled();
      expect(mockPgBoss.send).toHaveBeenCalledWith(
        'combat:return',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should skip if expedition not found', async () => {
      const txMock = {
        expedition: { findUnique: jest.fn().mockResolvedValue(null) },
      };
      mockPrismaService.$transaction.mockImplementation((cb) =>
        cb(txMock as never),
      );

      await worker['handleCombatResolution']({ expeditionId: 'non-existent' });

      expect(txMock.expedition.findUnique).toHaveBeenCalled();
    });

    it('should skip if expedition already resolved', async () => {
      const txMock = {
        expedition: {
          findUnique: jest.fn().mockResolvedValue({ status: 'RETURNING' }),
        },
      };
      mockPrismaService.$transaction.mockImplementation((cb) =>
        cb(txMock as never),
      );

      await worker['handleCombatResolution']({ expeditionId: 'exp-1' });

      expect(txMock.expedition.findUnique).toHaveBeenCalled();
    });

    it('should handle PvP combat with defender losses', async () => {
      const expedition = {
        id: 'exp-1',
        worldId: 'world-1',
        attackerVillageId: 'v1',
        targetRefId: 'v2',
        targetKind: 'PLAYER_VILLAGE',
        targetX: 10,
        targetY: 20,
        units: { MILITIA: 100 },
        status: 'EN_ROUTE',
      };

      const txMock = {
        expedition: {
          findUnique: jest.fn().mockResolvedValue(expedition),
          update: jest.fn(),
        },
        village: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
        resourceStock: { update: jest.fn() },
        unitInventory: { update: jest.fn() },
        combatReport: {
          create: jest.fn().mockResolvedValue({ id: 'report-1' }),
        },
        eventOutbox: { create: jest.fn() },
        villageStrategyConfig: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      mockPrismaService.$transaction.mockImplementation((cb) =>
        cb(txMock as never),
      );

      txMock.village.findUnique
        .mockResolvedValueOnce({ id: 'v2', userId: 'u2' })
        .mockResolvedValueOnce({
          id: 'v1',
          userId: 'u1',
          x: 0,
          y: 0,
          name: 'A',
        })
        .mockResolvedValueOnce({ id: 'v2', name: 'D' })
        .mockResolvedValueOnce({ id: 'v1', name: 'A', x: 0, y: 0 });

      txMock.village.findUniqueOrThrow
        .mockResolvedValueOnce({
          resourceStock: { wood: 500 },
          unitInventory: [{ unitType: 'MILITIA', quantity: 50 }],
        })
        .mockResolvedValueOnce({ unitInventory: [] });

      mockPlayerStrategy.resolve.mockResolvedValue({
        loot: { resources: { wood: 250, stone: 150, iron: 100 } },
        lossesAttacker: { MILITIA: 20 },
        lossesDefender: { MILITIA: 50 },
        survivingUnits: { MILITIA: 80 },
      });

      await worker['handleCombatResolution']({ expeditionId: 'exp-1' });

      expect(txMock.unitInventory.update).toHaveBeenCalled();
      expect(txMock.eventOutbox.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ kind: 'village.attacked' }),
        }),
      );
    });

    it('should throw if attacker village not found', async () => {
      const expedition = {
        id: 'exp-1',
        worldId: 'world-1',
        attackerVillageId: 'v1',
        targetRefId: 'barb-1',
        targetKind: 'BARBARIAN_VILLAGE',
        targetX: 10,
        targetY: 20,
        units: { MILITIA: 100 },
        status: 'EN_ROUTE',
      };

      const txMock = {
        expedition: { findUnique: jest.fn().mockResolvedValue(expedition) },
        village: {
          findUnique: jest.fn().mockResolvedValueOnce(null),
          findUniqueOrThrow: jest.fn(),
        },
        resourceStock: { update: jest.fn() },
        villageStrategyConfig: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      mockPrismaService.$transaction.mockImplementation((cb) =>
        cb(txMock as never),
      );

      txMock.village.findUniqueOrThrow.mockResolvedValueOnce({
        resourceStock: { wood: 100 },
        buildings: [],
      });
      mockBarbarianStrategy.resolve.mockResolvedValue({
        loot: { resources: { wood: 50, stone: 25, iron: 15 } },
        lossesAttacker: {},
        lossesDefender: null,
        survivingUnits: { MILITIA: 100 },
      });

      await expect(
        worker['handleCombatResolution']({ expeditionId: 'exp-1' }),
      ).rejects.toThrow('Attacker village not found');
    });

    it('should handle initialization errors', async () => {
      mockPgBoss.work.mockImplementationOnce(() => {
        throw new Error('Queue error');
      });

      await expect(worker.onModuleInit()).rejects.toThrow('Queue error');
    });
  });
});
