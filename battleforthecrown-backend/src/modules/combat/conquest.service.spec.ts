import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConquestService } from './conquest.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PowerService } from '../power/power.service';
import { Prisma } from '@prisma/client';

// Types for test mocks
type MockVillage = {
  id: string;
  isBarbarian: boolean;
  tier?: string | null;
  name: string;
  x: number;
  y: number;
  buildings: Array<{ id: string }>;
  resourceStock: {
    wood: number;
    stone: number;
    iron: number;
  } | null;
  unitInventory: unknown[];
  userId?: string | null;
};

type MockTransaction = {
  village: {
    findUnique: jest.MockedFunction<
      (params: Prisma.VillageFindUniqueArgs) => Promise<MockVillage | null>
    >;
    update: jest.MockedFunction<
      (params: Prisma.VillageUpdateArgs) => Promise<MockVillage>
    >;
  };
  unitInventory: {
    deleteMany: jest.MockedFunction<
      (
        params: Prisma.UnitInventoryDeleteManyArgs,
      ) => Promise<Prisma.BatchPayload>
    >;
  };
  resourceStock: {
    update: jest.MockedFunction<
      (params: Prisma.ResourceStockUpdateArgs) => Promise<unknown>
    >;
  };
  eventOutbox: {
    create: jest.MockedFunction<
      (params: Prisma.EventOutboxCreateArgs) => Promise<unknown>
    >;
  };
};

describe('ConquestService', () => {
  let service: ConquestService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    village: {
      findUnique: jest.fn() as jest.MockedFunction<
        (params: Prisma.VillageFindUniqueArgs) => Promise<MockVillage | null>
      >,
      findFirst: jest.fn(),
      update: jest.fn() as jest.MockedFunction<
        (params: Prisma.VillageUpdateArgs) => Promise<MockVillage>
      >,
    },
    unitInventory: {
      deleteMany: jest.fn() as jest.MockedFunction<
        (
          params: Prisma.UnitInventoryDeleteManyArgs,
        ) => Promise<Prisma.BatchPayload>
      >,
    },
    resourceStock: {
      update: jest.fn() as jest.MockedFunction<
        (params: Prisma.ResourceStockUpdateArgs) => Promise<unknown>
      >,
    },
    eventOutbox: {
      create: jest.fn() as jest.MockedFunction<
        (params: Prisma.EventOutboxCreateArgs) => Promise<unknown>
      >,
    },
    $transaction: jest.fn() as jest.MockedFunction<
      (callback: (tx: MockTransaction) => Promise<unknown>) => Promise<unknown>
    >,
  };

  const mockPowerService = {
    calculateAndSave: jest.fn() as jest.MockedFunction<
      (villageId: string) => Promise<unknown>
    >,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConquestService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PowerService,
          useValue: mockPowerService,
        },
      ],
    }).compile();

    module.useLogger(false);

    service = module.get<ConquestService>(ConquestService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('conquerVillage', () => {
    describe('Success cases - Barbarian villages', () => {
      it('should conquer a barbarian village', async () => {
        // Arrange
        const attackerVillageId = 'attacker-1';
        const targetVillageId = 'barbarian-1';
        const attackerUserId = 'user-1';

        const mockBarbarian: MockVillage = {
          id: targetVillageId,
          isBarbarian: true,
          tier: 'T1',
          name: 'Barbarian Camp',
          x: 10,
          y: 20,
          buildings: [{ id: 'building-1' }, { id: 'building-2' }],
          resourceStock: { wood: 100, stone: 50, iron: 30 },
          unitInventory: [],
        };

        const txMock = {
          village: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockBarbarian)
              .mockResolvedValueOnce({ userId: attackerUserId }),
            update: jest.fn().mockResolvedValue(mockBarbarian),
          },
          unitInventory: {
            deleteMany: jest
              .fn()
              .mockResolvedValue({ count: 0 } as Prisma.BatchPayload),
          },
          resourceStock: {
            update: jest.fn().mockResolvedValue({}),
          },
          eventOutbox: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        mockPrismaService.$transaction.mockImplementation((callback) =>
          callback(txMock),
        );
        mockPowerService.calculateAndSave.mockResolvedValue({});

        // Act
        const result = await service.conquerVillage({
          attackerVillageId,
          targetVillageId,
          attackerUserId,
        });

        // Assert
        expect(result).toEqual({
          success: true,
          villageId: targetVillageId,
          name: 'Barbarian Camp',
          buildings: 2,
          tier: 'T1',
        });

        expect(txMock.village.update).toHaveBeenCalledWith({
          where: { id: targetVillageId },
          data: {
            userId: attackerUserId,
            isBarbarian: false,
            tier: null,
            conqueredAt: expect.any(Date) as Date,
          },
        });
      });

      it('should preserve buildings during conquest', async () => {
        // Arrange
        const attackerVillageId = 'attacker-1';
        const targetVillageId = 'barbarian-1';
        const attackerUserId = 'user-1';

        const mockBarbarian: MockVillage = {
          id: targetVillageId,
          isBarbarian: true,
          tier: null,
          name: 'Wild Camp',
          x: 5,
          y: 5,
          buildings: Array(10)
            .fill(null)
            .map((_, index) => ({ id: `building-${index}` })),
          resourceStock: { wood: 500, stone: 300, iron: 200 },
          unitInventory: [],
        };

        const txMock = {
          village: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockBarbarian)
              .mockResolvedValueOnce({ userId: attackerUserId }),
            update: jest.fn().mockResolvedValue(mockBarbarian),
          },
          unitInventory: {
            deleteMany: jest
              .fn()
              .mockResolvedValue({ count: 0 } as Prisma.BatchPayload),
          },
          resourceStock: {
            update: jest.fn().mockResolvedValue({}),
          },
          eventOutbox: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        mockPrismaService.$transaction.mockImplementation((callback) =>
          callback(txMock),
        );
        mockPowerService.calculateAndSave.mockResolvedValue({});

        // Act
        const result = await service.conquerVillage({
          attackerVillageId,
          targetVillageId,
          attackerUserId,
        });

        // Assert
        expect(result.buildings).toBe(10);
        // Verify unit inventory was cleared
        expect(txMock.unitInventory.deleteMany).toHaveBeenCalledWith({
          where: { villageId: targetVillageId },
        });
      });

      it('should reduce conquered village resources by 50%', async () => {
        // Arrange
        const attackerVillageId = 'attacker-1';
        const targetVillageId = 'barbarian-1';
        const attackerUserId = 'user-1';

        const mockBarbarian = {
          id: targetVillageId,
          isBarbarian: true,
          tier: 'T2',
          name: 'Weak Camp',
          x: 15,
          y: 25,
          buildings: [],
          resourceStock: { wood: 1000, stone: 800, iron: 600 },
          unitInventory: [],
        };

        const txMock = {
          village: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockBarbarian)
              .mockResolvedValueOnce({ userId: attackerUserId }),
            update: jest.fn().mockResolvedValue(mockBarbarian),
          },
          unitInventory: {
            deleteMany: jest
              .fn()
              .mockResolvedValue({ count: 0 } as Prisma.BatchPayload),
          },
          resourceStock: {
            update: jest.fn().mockResolvedValue({}),
          },
          eventOutbox: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        mockPrismaService.$transaction.mockImplementation((callback) =>
          callback(txMock),
        );
        mockPowerService.calculateAndSave.mockResolvedValue({});

        // Act
        await service.conquerVillage({
          attackerVillageId,
          targetVillageId,
          attackerUserId,
        });

        // Assert
        expect(txMock.resourceStock.update).toHaveBeenCalledWith({
          where: { villageId: targetVillageId },
          data: {
            wood: 500,
            stone: 400,
            iron: 300,
          },
        });
      });

      it('should create conquest event', async () => {
        // Arrange
        const attackerVillageId = 'attacker-1';
        const targetVillageId = 'barbarian-1';
        const attackerUserId = 'user-1';

        const mockBarbarian = {
          id: targetVillageId,
          isBarbarian: true,
          tier: 'T1',
          name: 'Event Test Camp',
          x: 30,
          y: 40,
          buildings: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }],
          resourceStock: { wood: 100, stone: 50, iron: 30 },
          unitInventory: [],
        };

        const txMock = {
          village: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockBarbarian)
              .mockResolvedValueOnce({ userId: attackerUserId }),
            update: jest.fn().mockResolvedValue(mockBarbarian),
          },
          unitInventory: {
            deleteMany: jest
              .fn()
              .mockResolvedValue({ count: 0 } as Prisma.BatchPayload),
          },
          resourceStock: {
            update: jest.fn().mockResolvedValue({}),
          },
          eventOutbox: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        mockPrismaService.$transaction.mockImplementation((callback) =>
          callback(txMock),
        );
        mockPowerService.calculateAndSave.mockResolvedValue({});

        // Act
        await service.conquerVillage({
          attackerVillageId,
          targetVillageId,
          attackerUserId,
        });

        // Assert
        expect(txMock.eventOutbox.create).toHaveBeenCalledWith({
          data: {
            kind: 'village.conquered',
            aggregateId: targetVillageId,
            payload: {
              villageId: targetVillageId,
              newOwnerId: attackerUserId,
              previousTier: 'T1',
              x: 30,
              y: 40,
              buildingsKept: 3,
            },
          },
        });
      });
    });

    describe('Error cases', () => {
      it('should throw NotFoundException if target village not found', async () => {
        // Arrange
        const txMock: MockTransaction = {
          village: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn().mockResolvedValue({} as MockVillage),
          },
          unitInventory: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          resourceStock: {
            update: jest.fn().mockResolvedValue({}),
          },
          eventOutbox: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        mockPrismaService.$transaction.mockImplementation((callback) =>
          callback(txMock),
        );

        // Act & Assert
        await expect(
          service.conquerVillage({
            attackerVillageId: 'attacker-1',
            targetVillageId: 'non-existent',
            attackerUserId: 'user-1',
          }),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.conquerVillage({
            attackerVillageId: 'attacker-1',
            targetVillageId: 'non-existent',
            attackerUserId: 'user-1',
          }),
        ).rejects.toThrow('Target village not found');
      });

      it('should throw ForbiddenException for player village conquest', async () => {
        // Arrange
        const mockPlayerVillage: MockVillage = {
          id: 'player-village-1',
          isBarbarian: false,
          name: 'Protected Village',
          x: 50,
          y: 60,
          buildings: [],
          resourceStock: null,
          unitInventory: [],
        };

        const txMock: MockTransaction = {
          village: {
            findUnique: jest.fn().mockResolvedValue(mockPlayerVillage),
            update: jest.fn().mockResolvedValue({} as MockVillage),
          },
          unitInventory: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          resourceStock: {
            update: jest.fn().mockResolvedValue({}),
          },
          eventOutbox: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        mockPrismaService.$transaction.mockImplementation((callback) =>
          callback(txMock),
        );

        // Act & Assert
        await expect(
          service.conquerVillage({
            attackerVillageId: 'attacker-1',
            targetVillageId: 'player-village-1',
            attackerUserId: 'user-1',
          }),
        ).rejects.toThrow(ForbiddenException);
        await expect(
          service.conquerVillage({
            attackerVillageId: 'attacker-1',
            targetVillageId: 'player-village-1',
            attackerUserId: 'user-1',
          }),
        ).rejects.toThrow('loyalty system');
      });

      it('should throw NotFoundException if attacker village not found', async () => {
        // Arrange
        const mockBarbarian: MockVillage = {
          id: 'barbarian-1',
          isBarbarian: true,
          name: 'Test Camp',
          x: 10,
          y: 20,
          buildings: [],
          resourceStock: null,
          unitInventory: [],
        };

        const txMock: MockTransaction = {
          village: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockBarbarian)
              .mockResolvedValueOnce(null),
            update: jest.fn().mockResolvedValue({} as MockVillage),
          },
          unitInventory: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          resourceStock: {
            update: jest.fn().mockResolvedValue({}),
          },
          eventOutbox: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        mockPrismaService.$transaction.mockImplementation((callback) =>
          callback(txMock),
        );

        // Act & Assert
        await expect(
          service.conquerVillage({
            attackerVillageId: 'non-existent-attacker',
            targetVillageId: 'barbarian-1',
            attackerUserId: 'user-1',
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if attacker village does not belong to user', async () => {
        // Arrange
        const mockBarbarian: MockVillage = {
          id: 'barbarian-1',
          isBarbarian: true,
          name: 'Test Camp',
          x: 10,
          y: 20,
          buildings: [],
          resourceStock: { wood: 100, stone: 50, iron: 30 },
          unitInventory: [],
        };

        const txMock: MockTransaction = {
          village: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockBarbarian)
              .mockResolvedValueOnce({ userId: 'different-user' }),
            update: jest.fn().mockResolvedValue({} as MockVillage),
          },
          unitInventory: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          resourceStock: {
            update: jest.fn().mockResolvedValue({}),
          },
          eventOutbox: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        mockPrismaService.$transaction.mockImplementation((callback) =>
          callback(txMock),
        );

        // Act & Assert
        await expect(
          service.conquerVillage({
            attackerVillageId: 'attacker-1',
            targetVillageId: 'barbarian-1',
            attackerUserId: 'user-1',
          }),
        ).rejects.toThrow('does not belong to user');
      });
    });
  });

  describe('canConquer', () => {
    it('should return true for barbarian villages', async () => {
      // Arrange
      prismaService.village.findUnique = jest.fn().mockResolvedValue({
        isBarbarian: true,
        userId: null,
      });

      // Act
      const result = await service.canConquer('barbarian-1');

      // Assert
      expect(result).toEqual({ canConquer: true });
    });

    it('should return false for player villages', async () => {
      // Arrange
      prismaService.village.findUnique = jest.fn().mockResolvedValue({
        isBarbarian: false,
        userId: 'user-1',
      });

      // Act
      const result = await service.canConquer('player-village-1');

      // Assert
      expect(result).toEqual({
        canConquer: false,
        reason: 'Player village conquest not implemented',
      });
    });

    it('should return false for non-existent villages', async () => {
      // Arrange
      prismaService.village.findUnique = jest.fn().mockResolvedValue(null);

      // Act
      const result = await service.canConquer('non-existent');

      // Assert
      expect(result).toEqual({
        canConquer: false,
        reason: 'Village not found',
      });
    });
  });
});
