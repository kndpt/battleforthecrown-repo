import { Test, TestingModule } from '@nestjs/testing';
import { EventOutboxService } from './event-outbox.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { GameGateway } from './game.gateway';
import type {
  OutboxEvent,
  BuildingCompletedPayload,
  UnitTrainingCompletedPayload,
  BattleSentPayload,
  BattleResolvedPayload,
  BattleReturnedPayload,
  VillageAttackedPayload,
  ResourcesChangedPayload,
} from './event-types';

/* eslint-disable @typescript-eslint/unbound-method */

describe('EventOutboxService', () => {
  let service: EventOutboxService;
  let prismaService: PrismaService;
  let gateway: GameGateway;

  const mockPrismaService = {
    eventOutbox: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    village: {
      findUnique: jest.fn(),
    },
  };

  const mockGateway = {
    notifyUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventOutboxService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GameGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    module.useLogger(false);

    service = module.get<EventOutboxService>(EventOutboxService);
    prismaService = module.get<PrismaService>(PrismaService);
    gateway = module.get<GameGateway>(GameGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('dispatchPendingEvents', () => {
    describe('Success cases', () => {
      it('should do nothing when no pending events', async () => {
        // Arrange
        mockPrismaService.eventOutbox.findMany.mockResolvedValue([]);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(prismaService.eventOutbox.findMany).toHaveBeenCalledWith({
          where: { dispatchedAt: null },
          orderBy: { createdAt: 'asc' },
          take: 100,
        });
        expect(prismaService.eventOutbox.update).not.toHaveBeenCalled();
        expect(gateway.notifyUser).not.toHaveBeenCalled();
      });

      it('should dispatch building.completed event', async () => {
        // Arrange
        const event: OutboxEvent = {
          id: 'event-1',
          kind: 'building.completed',
          aggregateId: 'village-1',
          payload: {
            buildingId: 'building-1',
            villageId: 'village-1',
            buildingType: 'MAIN_BUILDING',
            level: 5,
          } as BuildingCompletedPayload,
          createdAt: new Date(),
          dispatchedAt: null,
        };

        mockPrismaService.eventOutbox.findMany.mockResolvedValue([event]);
        mockPrismaService.village.findUnique.mockResolvedValue({
          userId: 'user-1',
        });
        mockPrismaService.eventOutbox.update.mockResolvedValue(event);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).toHaveBeenCalledWith(
          'user-1',
          'building.completed',
          {
            buildingId: 'building-1',
            villageId: 'village-1',
            buildingType: 'MAIN_BUILDING',
            level: 5,
          },
        );
        expect(prismaService.eventOutbox.update).toHaveBeenCalledWith({
          where: { id: 'event-1' },
          data: { dispatchedAt: expect.any(Date) },
        });
      });

      it('should dispatch unit.training.completed event', async () => {
        // Arrange
        const event: OutboxEvent = {
          id: 'event-3',
          kind: 'unit.training.completed',
          aggregateId: 'village-1',
          payload: {
            trainingId: 'training-1',
            villageId: 'village-1',
            unitType: 'SWORDSMAN',
            completedQty: 10,
            totalQty: 10,
          } as UnitTrainingCompletedPayload,
          createdAt: new Date(),
          dispatchedAt: null,
        };

        mockPrismaService.eventOutbox.findMany.mockResolvedValue([event]);
        mockPrismaService.village.findUnique.mockResolvedValue({
          userId: 'user-1',
        });
        mockPrismaService.eventOutbox.update.mockResolvedValue(event);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).toHaveBeenCalledWith(
          'user-1',
          'unit.training.completed',
          expect.objectContaining({
            trainingId: 'training-1',
            unitType: 'SWORDSMAN',
            completedQty: 10,
          }),
        );
      });

      it('should dispatch battle.sent event', async () => {
        // Arrange
        const event: OutboxEvent = {
          id: 'event-4',
          kind: 'battle.sent',
          aggregateId: 'village-1',
          payload: {
            expeditionId: 'expedition-1',
            villageId: 'village-1',
            targetX: 10,
            targetY: 20,
            targetKind: 'barbarian',
            arrivalAt: '2025-10-20T21:00:00Z',
          } as BattleSentPayload,
          createdAt: new Date(),
          dispatchedAt: null,
        };

        mockPrismaService.eventOutbox.findMany.mockResolvedValue([event]);
        mockPrismaService.village.findUnique.mockResolvedValue({
          userId: 'user-1',
        });
        mockPrismaService.eventOutbox.update.mockResolvedValue(event);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).toHaveBeenCalledWith(
          'user-1',
          'battle.sent',
          expect.objectContaining({
            expeditionId: 'expedition-1',
            targetX: 10,
            targetY: 20,
            targetKind: 'barbarian',
          }),
        );
      });

      it('should dispatch battle.resolved event', async () => {
        // Arrange
        const event: OutboxEvent = {
          id: 'event-5',
          kind: 'battle.resolved',
          aggregateId: 'village-1',
          payload: {
            expeditionId: 'expedition-1',
            reportId: 'report-1',
            villageId: 'village-1',
            villageName: 'My Village',
            targetKind: 'barbarian',
            targetName: 'Barbarian Village',
            targetX: 10,
            targetY: 20,
            isVictory: true,
            loot: { resources: { wood: 100, stone: 100, iron: 50 } },
            lossesAttacker: { MILITIA: 2 },
            casualtyRate: 0.2,
            survivingUnits: { MILITIA: 8 },
            returnAt: '2025-10-20T22:00:00Z',
          } as BattleResolvedPayload,
          createdAt: new Date(),
          dispatchedAt: null,
        };

        mockPrismaService.eventOutbox.findMany.mockResolvedValue([event]);
        mockPrismaService.village.findUnique.mockResolvedValue({
          userId: 'user-1',
        });
        mockPrismaService.eventOutbox.update.mockResolvedValue(event);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).toHaveBeenCalledWith(
          'user-1',
          'battle.resolved',
          expect.objectContaining({
            expeditionId: 'expedition-1',
            reportId: 'report-1',
            isVictory: true,
            casualtyRate: 0.2,
          }),
        );
      });

      it('should dispatch battle.returned event', async () => {
        // Arrange
        const event: OutboxEvent = {
          id: 'event-6',
          kind: 'battle.returned',
          aggregateId: 'village-1',
          payload: {
            expeditionId: 'expedition-1',
            reportId: 'report-1',
            villageId: 'village-1',
            survivingUnits: { MILITIA: 8 },
            loot: { resources: { wood: 100, stone: 100, iron: 50 } },
          } as BattleReturnedPayload,
          createdAt: new Date(),
          dispatchedAt: null,
        };

        mockPrismaService.eventOutbox.findMany.mockResolvedValue([event]);
        mockPrismaService.village.findUnique.mockResolvedValue({
          userId: 'user-1',
        });
        mockPrismaService.eventOutbox.update.mockResolvedValue(event);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).toHaveBeenCalledWith(
          'user-1',
          'battle.returned',
          expect.objectContaining({
            expeditionId: 'expedition-1',
            reportId: 'report-1',
            survivingUnits: { MILITIA: 8 },
          }),
        );
      });

      it('should dispatch village.attacked event', async () => {
        // Arrange
        const event: OutboxEvent = {
          id: 'event-7',
          kind: 'village.attacked',
          aggregateId: 'village-2',
          payload: {
            defenderVillageId: 'village-2',
            attackerVillageId: 'village-1',
            attackerVillageName: 'Attacker Village',
            attackerX: 5,
            attackerY: 5,
            defenderVillageName: 'Defender Village',
            isDefenseSuccessful: true,
            losses: { ARCHER: 3 },
            casualtyRate: 0.3,
            resourcesLost: { wood: 50, stone: 50, iron: 25 },
            timestamp: '2025-10-20T20:00:00Z',
          } as VillageAttackedPayload,
          createdAt: new Date(),
          dispatchedAt: null,
        };

        mockPrismaService.eventOutbox.findMany.mockResolvedValue([event]);
        mockPrismaService.village.findUnique.mockResolvedValue({
          userId: 'user-2',
        });
        mockPrismaService.eventOutbox.update.mockResolvedValue(event);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).toHaveBeenCalledWith(
          'user-2',
          'village.attacked',
          expect.objectContaining({
            defenderVillageId: 'village-2',
            attackerVillageId: 'village-1',
            isDefenseSuccessful: true,
            casualtyRate: 0.3,
          }),
        );
      });

      it('should dispatch resources.changed event', async () => {
        // Arrange
        const event: OutboxEvent = {
          id: 'event-8',
          kind: 'resources.changed',
          aggregateId: 'village-1',
          payload: {
            villageId: 'village-1',
            wood: 1000,
            stone: 1000,
            iron: 500,
            maxPerType: 5000,
            lastUpdateTs: '2025-10-20T20:00:00Z',
            productionRates: { wood: 30, stone: 30, iron: 30 },
          } as ResourcesChangedPayload,
          createdAt: new Date(),
          dispatchedAt: null,
        };

        mockPrismaService.eventOutbox.findMany.mockResolvedValue([event]);
        mockPrismaService.village.findUnique.mockResolvedValue({
          userId: 'user-1',
        });
        mockPrismaService.eventOutbox.update.mockResolvedValue(event);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).toHaveBeenCalledWith(
          'user-1',
          'resources.changed',
          expect.objectContaining({
            villageId: 'village-1',
            wood: 1000,
            stone: 1000,
            iron: 500,
          }),
        );
      });

      it('should dispatch multiple events in order', async () => {
        // Arrange
        const events: OutboxEvent[] = [
          {
            id: 'event-1',
            kind: 'building.completed',
            aggregateId: 'village-1',
            payload: {
              buildingId: 'building-1',
              villageId: 'village-1',
              buildingType: 'BARRACKS',
              level: 3,
            } as BuildingCompletedPayload,
            createdAt: new Date('2025-10-20T19:00:00Z'),
            dispatchedAt: null,
          },
          {
            id: 'event-2',
            kind: 'resources.changed',
            aggregateId: 'village-1',
            payload: {
              villageId: 'village-1',
              wood: 500,
              stone: 500,
              iron: 250,
              maxPerType: 5000,
              lastUpdateTs: '2025-10-20T20:00:00Z',
              productionRates: { wood: 30, stone: 30, iron: 30 },
            } as ResourcesChangedPayload,
            createdAt: new Date('2025-10-20T20:00:00Z'),
            dispatchedAt: null,
          },
        ];

        mockPrismaService.eventOutbox.findMany.mockResolvedValue(events);
        mockPrismaService.village.findUnique.mockResolvedValue({
          userId: 'user-1',
        });
        mockPrismaService.eventOutbox.update.mockResolvedValue({});

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).toHaveBeenCalledTimes(2);
        expect(gateway.notifyUser).toHaveBeenNthCalledWith(
          1,
          'user-1',
          'building.completed',
          expect.any(Object),
        );
        expect(gateway.notifyUser).toHaveBeenNthCalledWith(
          2,
          'user-1',
          'resources.changed',
          expect.any(Object),
        );
        expect(prismaService.eventOutbox.update).toHaveBeenCalledTimes(2);
      });

      it('should fetch maximum of 100 events', async () => {
        // Arrange
        mockPrismaService.eventOutbox.findMany.mockResolvedValue([]);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(prismaService.eventOutbox.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ take: 100 }),
        );
      });
    });

    describe('Error cases', () => {
      it('should skip event when village not found', async () => {
        // Arrange
        const event: OutboxEvent = {
          id: 'event-1',
          kind: 'building.completed',
          aggregateId: 'village-1',
          payload: {
            buildingId: 'building-1',
            villageId: 'village-1',
            buildingType: 'BARRACKS',
            level: 3,
          } as BuildingCompletedPayload,
          createdAt: new Date(),
          dispatchedAt: null,
        };

        mockPrismaService.eventOutbox.findMany.mockResolvedValue([event]);
        mockPrismaService.village.findUnique.mockResolvedValue(null);
        mockPrismaService.eventOutbox.update.mockResolvedValue(event);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).not.toHaveBeenCalled();
        expect(prismaService.eventOutbox.update).toHaveBeenCalledWith({
          where: { id: 'event-1' },
          data: { dispatchedAt: expect.any(Date) },
        });
      });

      it('should continue processing on dispatch error', async () => {
        // Arrange
        const events: OutboxEvent[] = [
          {
            id: 'event-1',
            kind: 'building.completed',
            aggregateId: 'village-1',
            payload: {
              buildingId: 'building-1',
              villageId: 'village-1',
              buildingType: 'BARRACKS',
              level: 3,
            } as BuildingCompletedPayload,
            createdAt: new Date(),
            dispatchedAt: null,
          },
          {
            id: 'event-2',
            kind: 'resources.changed',
            aggregateId: 'village-1',
            payload: {
              villageId: 'village-1',
              wood: 500,
              stone: 500,
              iron: 250,
              maxPerType: 5000,
              lastUpdateTs: '2025-10-20T20:00:00Z',
              productionRates: { wood: 30, stone: 30, iron: 30 },
            } as ResourcesChangedPayload,
            createdAt: new Date(),
            dispatchedAt: null,
          },
        ];

        mockPrismaService.eventOutbox.findMany.mockResolvedValue(events);
        mockPrismaService.village.findUnique.mockResolvedValue({
          userId: 'user-1',
        });
        mockPrismaService.eventOutbox.update
          .mockRejectedValueOnce(new Error('Database error'))
          .mockResolvedValueOnce({});

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).toHaveBeenCalledTimes(2);
        expect(prismaService.eventOutbox.update).toHaveBeenCalledTimes(2);
      });

      it('should handle database fetch error', async () => {
        // Arrange
        mockPrismaService.eventOutbox.findMany.mockRejectedValue(
          new Error('Database connection failed'),
        );

        // Act & Assert
        await expect(service.dispatchPendingEvents()).rejects.toThrow(
          'Database connection failed',
        );
      });
    });

    describe('Edge cases', () => {
      it('should handle event with no userId (skip notification)', async () => {
        // Arrange
        const event: OutboxEvent = {
          id: 'event-1',
          kind: 'building.completed',
          aggregateId: 'village-1',
          payload: {
            buildingId: 'building-1',
            villageId: 'village-1',
            buildingType: 'BARRACKS',
            level: 3,
          } as BuildingCompletedPayload,
          createdAt: new Date(),
          dispatchedAt: null,
        };

        mockPrismaService.eventOutbox.findMany.mockResolvedValue([event]);
        mockPrismaService.village.findUnique.mockResolvedValue({
          userId: null,
        });
        mockPrismaService.eventOutbox.update.mockResolvedValue(event);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).not.toHaveBeenCalled();
        expect(prismaService.eventOutbox.update).toHaveBeenCalled();
      });

      it('should handle village.attacked with no defenderVillageId', async () => {
        // Arrange
        const event: OutboxEvent = {
          id: 'event-1',
          kind: 'village.attacked',
          aggregateId: 'village-1',
          payload: {
            defenderVillageId: '',
            attackerVillageId: 'village-1',
            attackerVillageName: 'Attacker',
            attackerX: 5,
            attackerY: 5,
            defenderVillageName: 'Defender',
            isDefenseSuccessful: false,
            losses: {},
            casualtyRate: 0,
            resourcesLost: { wood: 0, stone: 0, iron: 0 },
            timestamp: '2025-10-20T20:00:00Z',
          } as VillageAttackedPayload,
          createdAt: new Date(),
          dispatchedAt: null,
        };

        mockPrismaService.eventOutbox.findMany.mockResolvedValue([event]);
        mockPrismaService.eventOutbox.update.mockResolvedValue(event);

        // Act
        await service.dispatchPendingEvents();

        // Assert
        expect(gateway.notifyUser).not.toHaveBeenCalled();
        expect(prismaService.village.findUnique).not.toHaveBeenCalled();
        expect(prismaService.eventOutbox.update).toHaveBeenCalled();
      });
    });
  });
});
