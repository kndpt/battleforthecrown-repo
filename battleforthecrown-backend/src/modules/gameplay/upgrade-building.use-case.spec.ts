import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UpgradeBuildingUseCase } from './upgrade-building.use-case';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldConfigService } from '../world/world-config.service';
import { OutboxPublisher } from '../event/outbox-publisher.service';

interface TxMock {
  village: { findUnique: jest.Mock };
  building: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  resourceStock: { findUnique: jest.Mock; update: jest.Mock };
  population: { findUnique: jest.Mock; update: jest.Mock };
  villageStrategyConfig: { findUnique: jest.Mock };
}

describe('UpgradeBuildingUseCase', () => {
  let useCase: UpgradeBuildingUseCase;
  let tx: TxMock;
  let mockPrisma: { $transaction: jest.Mock };
  let mockOwnership: { assertVillageOwnedBy: jest.Mock };
  let mockWorldConfig: { getCost: jest.Mock };
  let mockOutbox: { resourcesChanged: jest.Mock };
  let mockBoss: { send: jest.Mock };

  const villageId = 'village-1';
  const userId = 'user-1';
  const worldId = 'world-1';
  const buildingType = 'WOOD';

  const baseCost = {
    wood: 100,
    stone: 50,
    iron: 30,
    population: 10,
    time: 60_000,
  };

  beforeEach(async () => {
    tx = {
      village: { findUnique: jest.fn() },
      building: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      resourceStock: { findUnique: jest.fn(), update: jest.fn() },
      population: { findUnique: jest.fn(), update: jest.fn() },
      villageStrategyConfig: { findUnique: jest.fn() },
    };

    mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (cb) => cb(tx)),
    };
    mockOwnership = { assertVillageOwnedBy: jest.fn().mockResolvedValue(true) };
    mockWorldConfig = { getCost: jest.fn().mockResolvedValue(baseCost) };
    mockOutbox = { resourcesChanged: jest.fn().mockResolvedValue(undefined) };
    mockBoss = { send: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpgradeBuildingUseCase,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OwnershipService, useValue: mockOwnership },
        { provide: WorldConfigService, useValue: mockWorldConfig },
        { provide: OutboxPublisher, useValue: mockOutbox },
        { provide: 'PG_BOSS', useValue: mockBoss },
      ],
    }).compile();

    module.useLogger(false);
    useCase = module.get(UpgradeBuildingUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  const setupHappyPath = () => {
    tx.village.findUnique.mockResolvedValue({ id: villageId, worldId });
    tx.building.findFirst.mockResolvedValue(null); // first build
    tx.building.count.mockResolvedValue(0);
    tx.resourceStock.findUnique.mockResolvedValue({
      wood: 1000,
      stone: 1000,
      iron: 1000,
    });
    tx.population.findUnique.mockResolvedValue({ used: 0, max: 100 });
    tx.building.findMany.mockResolvedValue([{ type: 'CASTLE', level: 5 }]);
    tx.villageStrategyConfig.findUnique.mockResolvedValue(null);
    tx.building.create.mockImplementation(async ({ data }) => ({
      id: 'new-building',
      type: data.type,
      level: data.level,
      startTime: data.startTime,
      endTime: data.endTime,
    }));
  };

  it('debits resources, increments population, schedules pg-boss job, and publishes resources.changed in the same TX', async () => {
    setupHappyPath();

    const result = await useCase.execute(villageId, buildingType, userId);

    expect(mockOwnership.assertVillageOwnedBy).toHaveBeenCalledWith(
      villageId,
      userId,
    );
    expect(tx.resourceStock.update).toHaveBeenCalledWith({
      where: { villageId },
      data: { wood: 900, stone: 950, iron: 970 },
    });
    expect(tx.population.update).toHaveBeenCalledWith({
      where: { villageId },
      data: { used: 10 },
    });
    expect(tx.building.create).toHaveBeenCalledTimes(1);
    expect(mockBoss.send).toHaveBeenCalledWith(
      'construction:end',
      expect.objectContaining({
        buildingId: 'new-building',
        villageId,
        buildingType,
        targetLevel: 1,
      }),
      expect.objectContaining({
        singletonKey: 'construction:new-building',
      }),
    );
    expect(mockOutbox.resourcesChanged).toHaveBeenCalledWith(villageId, tx);
    expect(result).toMatchObject({
      currentLevel: 0,
      nextLevel: 1,
      cost: baseCost,
    });
  });

  it('rejects when village is missing', async () => {
    tx.village.findUnique.mockResolvedValue(null);
    tx.resourceStock.findUnique.mockResolvedValue(null);
    tx.population.findUnique.mockResolvedValue(null);
    tx.building.findFirst.mockResolvedValue(null);
    tx.building.count.mockResolvedValue(0);
    tx.building.findMany.mockResolvedValue([]);
    tx.villageStrategyConfig.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute(villageId, buildingType, userId),
    ).rejects.toThrow(NotFoundException);
    expect(mockOutbox.resourcesChanged).not.toHaveBeenCalled();
  });

  it('rejects when resources are insufficient', async () => {
    setupHappyPath();
    tx.resourceStock.findUnique.mockResolvedValue({
      wood: 10,
      stone: 10,
      iron: 10,
    });

    await expect(
      useCase.execute(villageId, buildingType, userId),
    ).rejects.toThrow(BadRequestException);
    expect(tx.resourceStock.update).not.toHaveBeenCalled();
    expect(mockOutbox.resourcesChanged).not.toHaveBeenCalled();
  });

  it('rejects when population is full', async () => {
    setupHappyPath();
    tx.population.findUnique.mockResolvedValue({ used: 95, max: 100 });

    await expect(
      useCase.execute(villageId, buildingType, userId),
    ).rejects.toThrow(BadRequestException);
    expect(mockOutbox.resourcesChanged).not.toHaveBeenCalled();
  });

  it('rejects when the construction queue is full', async () => {
    setupHappyPath();
    tx.building.count.mockResolvedValue(99);

    await expect(
      useCase.execute(villageId, buildingType, userId),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects when building is already under construction', async () => {
    setupHappyPath();
    tx.building.findFirst.mockResolvedValue({
      id: 'b-1',
      level: 1,
      version: 0,
      endTime: new Date(Date.now() + 60_000),
    });

    await expect(
      useCase.execute(villageId, buildingType, userId),
    ).rejects.toThrow(ConflictException);
  });
});
