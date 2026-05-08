import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CombatService } from './combat.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from '../world/world-config.service';

/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/unbound-method */

describe('CombatService', () => {
  let service: CombatService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    village: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    unitInventory: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    expedition: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    combatReport: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    eventOutbox: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockWorldConfigService = {
    calculateDistance: jest.fn(),
    getTravelTimeForArmy: jest.fn(),
  };

  const mockPgBoss = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CombatService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WorldConfigService,
          useValue: mockWorldConfigService,
        },
        {
          provide: 'PG_BOSS',
          useValue: mockPgBoss,
        },
      ],
    }).compile();

    module.useLogger(false);

    service = module.get<CombatService>(CombatService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateAttack', () => {
    describe('Success cases', () => {
      it('should initiate attack against barbarian village', async () => {
        // Arrange
        const userId = 'user-1';
        const dto = {
          villageId: 'village-1',
          targetX: 5,
          targetY: 5,
          targetRefId: 'barbarian-1',
          targetKind: 'BARBARIAN_VILLAGE' as const,
          units: { MILITIA: 10 },
        };

        const mockVillage = {
          id: 'village-1',
          userId,
          worldId: 'world-1',
          x: 0,
          y: 0,
        };

        const mockBarbarian = {
          id: 'barbarian-1',
          isBarbarian: true,
          x: 5,
          y: 5,
        };

        const mockExpedition = {
          id: 'expedition-1',
          attackerVillageId: 'village-1',
          status: 'EN_ROUTE',
          arrivalAt: new Date(),
        };

        const txMock = {
          village: {
            findFirst: jest.fn().mockResolvedValue(mockVillage),
            findUnique: jest.fn().mockResolvedValue(mockBarbarian),
          },
          villageStrategyConfig: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          unitInventory: {
            findMany: jest
              .fn()
              .mockResolvedValue([{ unitType: 'MILITIA', quantity: 20 }]),
            update: jest.fn().mockResolvedValue({}),
          },
          expedition: {
            create: jest.fn().mockResolvedValue(mockExpedition),
          },
          eventOutbox: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        mockWorldConfigService.calculateDistance.mockReturnValue(7);
        mockWorldConfigService.getTravelTimeForArmy.mockResolvedValue(7000);
        mockPrismaService.$transaction.mockImplementation(
          (callback) => callback(txMock) as Promise<typeof mockExpedition>,
        );
        mockPgBoss.send.mockResolvedValue({});

        // Act
        const result = await service.initiateAttack(userId, dto);

        // Assert
        expect(result).toEqual(mockExpedition);
        expect(txMock.unitInventory.update).toHaveBeenCalledWith({
          where: {
            villageId_unitType: {
              villageId: 'village-1',
              unitType: 'MILITIA',
            },
          },
          data: { quantity: { decrement: 10 } },
        });
        expect(mockPgBoss.send).toHaveBeenCalledWith(
          'combat:resolve',
          { expeditionId: 'expedition-1' },
          expect.objectContaining({
            startAfter: expect.any(Date),
            singletonKey: 'combat:expedition-1',
          }),
        );
      });

      it('should initiate attack against player village', async () => {
        // Arrange
        const userId = 'user-1';
        const dto = {
          villageId: 'village-1',
          targetX: 10,
          targetY: 10,
          targetRefId: 'village-2',
          targetKind: 'PLAYER_VILLAGE' as const,
          units: { CAVALRY: 5, ARCHER: 3 },
        };

        const mockVillage = {
          id: 'village-1',
          userId,
          worldId: 'world-1',
          x: 0,
          y: 0,
        };

        const mockTargetVillage = {
          id: 'village-2',
          worldId: 'world-1',
          x: 10,
          y: 10,
        };

        const mockExpedition = {
          id: 'expedition-1',
          status: 'EN_ROUTE',
          arrivalAt: new Date(),
        };

        const txMock = {
          village: {
            findFirst: jest.fn().mockResolvedValue(mockVillage),
            findUnique: jest.fn().mockResolvedValue(mockTargetVillage),
          },
          villageStrategyConfig: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          unitInventory: {
            findMany: jest.fn().mockResolvedValue([
              { unitType: 'CAVALRY', quantity: 10 },
              { unitType: 'ARCHER', quantity: 10 },
            ]),
            update: jest.fn().mockResolvedValue({}),
          },
          expedition: {
            create: jest.fn().mockResolvedValue(mockExpedition),
          },
          eventOutbox: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        mockWorldConfigService.calculateDistance.mockReturnValue(14);
        mockWorldConfigService.getTravelTimeForArmy.mockResolvedValue(14000);
        mockPrismaService.$transaction.mockImplementation(
          (callback) => callback(txMock) as Promise<any>,
        );
        mockPgBoss.send.mockResolvedValue({});

        // Act
        const result = await service.initiateAttack(userId, dto);

        // Assert
        expect(result).toEqual(mockExpedition);
        expect(txMock.unitInventory.update).toHaveBeenCalledTimes(2);
      });

      it('should handle single unit type attack', async () => {
        // Arrange
        const userId = 'user-1';
        const dto = {
          villageId: 'village-1',
          targetX: 5,
          targetY: 5,
          targetRefId: 'barbarian-1',
          targetKind: 'BARBARIAN_VILLAGE' as const,
          units: { MILITIA: 1 },
        };

        const mockVillage = {
          id: 'village-1',
          userId,
          worldId: 'world-1',
          x: 0,
          y: 0,
        };
        const mockBarbarian = {
          id: 'barbarian-1',
          isBarbarian: true,
          x: 5,
          y: 5,
        };
        const mockExpedition = { id: 'expedition-1', status: 'EN_ROUTE' };

        const txMock = {
          village: {
            findFirst: jest.fn().mockResolvedValue(mockVillage),
            findUnique: jest.fn().mockResolvedValue(mockBarbarian),
          },
          villageStrategyConfig: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          unitInventory: {
            findMany: jest
              .fn()
              .mockResolvedValue([{ unitType: 'MILITIA', quantity: 1 }]),
            update: jest.fn().mockResolvedValue({}),
          },
          expedition: { create: jest.fn().mockResolvedValue(mockExpedition) },
          eventOutbox: { create: jest.fn().mockResolvedValue({}) },
        };

        mockWorldConfigService.calculateDistance.mockReturnValue(7);
        mockWorldConfigService.getTravelTimeForArmy.mockResolvedValue(7000);
        mockPrismaService.$transaction.mockImplementation(
          (callback) => callback(txMock) as Promise<any>,
        );

        // Act
        const result = await service.initiateAttack(userId, dto);

        // Assert
        expect(result.id).toBe('expedition-1');
      });
    });

    describe('Error cases - Ownership', () => {
      it('should throw NotFoundException when village not found', async () => {
        // Arrange
        const userId = 'user-1';
        const dto = {
          villageId: 'non-existent',
          targetX: 5,
          targetY: 5,
          targetRefId: 'barbarian-1',
          targetKind: 'BARBARIAN_VILLAGE' as const,
          units: { MILITIA: 10 },
        };

        const txMock = {
          village: { findFirst: jest.fn().mockResolvedValue(null) },
        };

        mockPrismaService.$transaction.mockImplementation(
          (callback) => callback(txMock) as Promise<any>,
        );

        // Act & Assert
        await expect(service.initiateAttack(userId, dto)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.initiateAttack(userId, dto)).rejects.toThrow(
          'Village not found or not owned',
        );
      });

      it('should throw NotFoundException when village belongs to different user', async () => {
        // Arrange
        const userId = 'user-1';
        const dto = {
          villageId: 'village-1',
          targetX: 5,
          targetY: 5,
          targetRefId: 'barbarian-1',
          targetKind: 'BARBARIAN_VILLAGE' as const,
          units: { MILITIA: 10 },
        };

        const txMock = {
          village: { findFirst: jest.fn().mockResolvedValue(null) },
        };

        mockPrismaService.$transaction.mockImplementation(
          (callback) => callback(txMock) as Promise<any>,
        );

        // Act & Assert
        await expect(service.initiateAttack(userId, dto)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('Error cases - Target validation', () => {
      it('should throw BadRequestException when barbarian village not found', async () => {
        // Arrange
        const userId = 'user-1';
        const dto = {
          villageId: 'village-1',
          targetX: 5,
          targetY: 5,
          targetRefId: 'non-existent-barbarian',
          targetKind: 'BARBARIAN_VILLAGE' as const,
          units: { MILITIA: 10 },
        };

        const mockVillage = { id: 'village-1', userId, worldId: 'world-1' };

        const txMock = {
          village: {
            findFirst: jest.fn().mockResolvedValue(mockVillage),
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };

        mockPrismaService.$transaction.mockImplementation(
          (callback) => callback(txMock) as Promise<any>,
        );

        // Act & Assert
        await expect(service.initiateAttack(userId, dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.initiateAttack(userId, dto)).rejects.toThrow(
          'Barbarian village not found',
        );
      });

      it('should throw BadRequestException when target village in different world', async () => {
        // Arrange
        const userId = 'user-1';
        const dto = {
          villageId: 'village-1',
          targetX: 10,
          targetY: 10,
          targetRefId: 'village-2',
          targetKind: 'PLAYER_VILLAGE' as const,
          units: { MILITIA: 10 },
        };

        const mockVillage = { id: 'village-1', userId, worldId: 'world-1' };
        const mockTargetVillage = { id: 'village-2', worldId: 'world-2' };

        const txMock = {
          village: {
            findFirst: jest.fn().mockResolvedValue(mockVillage),
            findUnique: jest.fn().mockResolvedValue(mockTargetVillage),
          },
        };

        mockPrismaService.$transaction.mockImplementation(
          (callback) => callback(txMock) as Promise<any>,
        );

        // Act & Assert
        await expect(service.initiateAttack(userId, dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.initiateAttack(userId, dto)).rejects.toThrow(
          'Target village not found',
        );
      });
    });

    describe('Error cases - Unit availability', () => {
      it('should throw BadRequestException for insufficient units', async () => {
        // Arrange
        const userId = 'user-1';
        const dto = {
          villageId: 'village-1',
          targetX: 5,
          targetY: 5,
          targetRefId: 'barbarian-1',
          targetKind: 'BARBARIAN_VILLAGE' as const,
          units: { MILITIA: 20 },
        };

        const mockVillage = { id: 'village-1', userId, worldId: 'world-1' };
        const mockBarbarian = { id: 'barbarian-1', isBarbarian: true };

        const txMock = {
          village: {
            findFirst: jest.fn().mockResolvedValue(mockVillage),
            findUnique: jest.fn().mockResolvedValue(mockBarbarian),
          },
          unitInventory: {
            findMany: jest
              .fn()
              .mockResolvedValue([{ unitType: 'MILITIA', quantity: 10 }]),
          },
        };

        mockPrismaService.$transaction.mockImplementation(
          (callback) => callback(txMock) as Promise<any>,
        );

        // Act & Assert
        await expect(service.initiateAttack(userId, dto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.initiateAttack(userId, dto)).rejects.toThrow(
          'Insufficient MILITIA',
        );
      });

      it('should throw BadRequestException when unit type not in inventory', async () => {
        // Arrange
        const userId = 'user-1';
        const dto = {
          villageId: 'village-1',
          targetX: 5,
          targetY: 5,
          targetRefId: 'barbarian-1',
          targetKind: 'BARBARIAN_VILLAGE' as const,
          units: { CAVALRY: 5 },
        };

        const mockVillage = { id: 'village-1', userId, worldId: 'world-1' };
        const mockBarbarian = { id: 'barbarian-1', isBarbarian: true };

        const txMock = {
          village: {
            findFirst: jest.fn().mockResolvedValue(mockVillage),
            findUnique: jest.fn().mockResolvedValue(mockBarbarian),
          },
          unitInventory: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        };

        mockPrismaService.$transaction.mockImplementation(
          (callback) => callback(txMock) as Promise<any>,
        );

        // Act & Assert
        await expect(service.initiateAttack(userId, dto)).rejects.toThrow(
          BadRequestException,
        );
      });
    });
  });

  describe('getActiveExpeditions', () => {
    describe('Success cases', () => {
      it('should return active expeditions for village', async () => {
        // Arrange
        const userId = 'user-1';
        const villageId = 'village-1';
        const mockExpeditions = [
          {
            id: 'expedition-1',
            status: 'EN_ROUTE',
            departAt: new Date(),
          },
          {
            id: 'expedition-2',
            status: 'RETURNING',
            departAt: new Date(),
          },
        ];

        mockPrismaService.village.findFirst.mockResolvedValue({
          id: villageId,
          userId,
        });
        mockPrismaService.expedition.findMany.mockResolvedValue(
          mockExpeditions,
        );

        // Act
        const result = await service.getActiveExpeditions(userId, villageId);

        // Assert
        expect(result).toEqual(mockExpeditions);
        expect(prismaService.expedition.findMany).toHaveBeenCalledWith({
          where: {
            attackerVillageId: villageId,
            status: { in: ['EN_ROUTE', 'RETURNING'] },
          },
          orderBy: { departAt: 'desc' },
        });
        expect(prismaService.expedition.findMany).toHaveReturned();
      });

      it('should return empty array when no expeditions', async () => {
        // Arrange
        const userId = 'user-1';
        const villageId = 'village-1';

        mockPrismaService.village.findFirst.mockResolvedValue({
          id: villageId,
          userId,
        });
        mockPrismaService.expedition.findMany.mockResolvedValue([]);

        // Act
        const result = await service.getActiveExpeditions(userId, villageId);

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('Error cases', () => {
      it('should throw NotFoundException when village not found', async () => {
        // Arrange
        mockPrismaService.village.findFirst.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.getActiveExpeditions('user-1', 'non-existent'),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.getActiveExpeditions('user-1', 'non-existent'),
        ).rejects.toThrow('Village not found');
      });
    });
  });

  describe('getAllReports', () => {
    describe('Success cases', () => {
      it('should return all reports for user', async () => {
        // Arrange
        const userId = 'user-1';
        const mockReports = [
          {
            id: 'report-1',
            attackerUserId: userId,
            defenderUserId: 'user-2',
            timestamp: new Date(),
          },
          {
            id: 'report-2',
            attackerUserId: 'user-2',
            defenderUserId: userId,
            timestamp: new Date(),
          },
        ];

        mockPrismaService.combatReport.findMany.mockResolvedValue(mockReports);

        // Act
        const result = await service.getAllReports(userId);

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('isAttacker', true);
        expect(result[1]).toHaveProperty('isAttacker', false);
      });

      it('should return empty array when no reports', async () => {
        // Arrange
        mockPrismaService.combatReport.findMany.mockResolvedValue([]);

        // Act
        const result = await service.getAllReports('user-1');

        // Assert
        expect(result).toEqual([]);
      });
    });
  });

  describe('getReport', () => {
    describe('Success cases', () => {
      it('should return report for attacker', async () => {
        // Arrange
        const userId = 'user-1';
        const reportId = 'report-1';
        const mockReport = {
          id: reportId,
          attackerUserId: userId,
          defenderUserId: 'user-2',
        };

        mockPrismaService.combatReport.findUnique.mockResolvedValue(mockReport);

        // Act
        const result = await service.getReport(userId, reportId);

        // Assert
        expect(result).toMatchObject(mockReport);
        expect(result.isAttacker).toBe(true);
      });

      it('should return report for defender', async () => {
        // Arrange
        const userId = 'user-1';
        const reportId = 'report-1';
        const mockReport = {
          id: reportId,
          attackerUserId: 'user-2',
          defenderUserId: userId,
        };

        mockPrismaService.combatReport.findUnique.mockResolvedValue(mockReport);

        // Act
        const result = await service.getReport(userId, reportId);

        // Assert
        expect(result.isAttacker).toBe(false);
      });
    });

    describe('Error cases', () => {
      it('should throw NotFoundException when report not found', async () => {
        // Arrange
        mockPrismaService.combatReport.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.getReport('user-1', 'non-existent'),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.getReport('user-1', 'non-existent'),
        ).rejects.toThrow('Report not found');
      });

      it('should throw BadRequestException when user not authorized', async () => {
        // Arrange
        const userId = 'user-1';
        const reportId = 'report-1';
        const mockReport = {
          id: reportId,
          attackerUserId: 'user-2',
          defenderUserId: 'user-3',
        };

        mockPrismaService.combatReport.findUnique.mockResolvedValue(mockReport);

        // Act & Assert
        await expect(service.getReport(userId, reportId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.getReport(userId, reportId)).rejects.toThrow(
          'Not authorized to view this report',
        );
      });
    });
  });

  describe('markReportAsRead', () => {
    describe('Success cases', () => {
      it('should mark report as read for attacker', async () => {
        // Arrange
        const userId = 'user-1';
        const reportId = 'report-1';
        const mockReport = {
          id: reportId,
          attackerUserId: userId,
          defenderUserId: 'user-2',
          isRead: false,
        };
        const mockUpdated = { ...mockReport, isRead: true };

        mockPrismaService.combatReport.findUnique.mockResolvedValue(mockReport);
        mockPrismaService.combatReport.update.mockResolvedValue(mockUpdated);

        // Act
        const result = await service.markReportAsRead(userId, reportId);

        // Assert
        expect(result.isRead).toBe(true);
        expect(result.isAttacker).toBe(true);
        expect(prismaService.combatReport.update).toHaveBeenCalledWith({
          where: { id: reportId },
          data: { isRead: true },
        });
        expect(prismaService.combatReport.update).toHaveReturned();
      });

      it('should mark report as read for defender', async () => {
        // Arrange
        const userId = 'user-1';
        const reportId = 'report-1';
        const mockReport = {
          id: reportId,
          attackerUserId: 'user-2',
          defenderUserId: userId,
          isRead: false,
        };
        const mockUpdated = { ...mockReport, isRead: true };

        mockPrismaService.combatReport.findUnique.mockResolvedValue(mockReport);
        mockPrismaService.combatReport.update.mockResolvedValue(mockUpdated);

        // Act
        const result = await service.markReportAsRead(userId, reportId);

        // Assert
        expect(result.isAttacker).toBe(false);
      });
    });

    describe('Error cases', () => {
      it('should throw NotFoundException when report not found', async () => {
        // Arrange
        mockPrismaService.combatReport.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.markReportAsRead('user-1', 'non-existent'),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.markReportAsRead('user-1', 'non-existent'),
        ).rejects.toThrow('Report not found');
      });

      it('should throw BadRequestException when user not authorized', async () => {
        // Arrange
        const userId = 'user-1';
        const reportId = 'report-1';
        const mockReport = {
          id: reportId,
          attackerUserId: 'user-2',
          defenderUserId: 'user-3',
        };

        mockPrismaService.combatReport.findUnique.mockResolvedValue(mockReport);

        // Act & Assert
        await expect(
          service.markReportAsRead(userId, reportId),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.markReportAsRead(userId, reportId),
        ).rejects.toThrow('Not authorized to modify this report');
      });
    });
  });
});
