import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WorldService } from './world.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';

describe('WorldService', () => {
  let service: WorldService;

  const mockPrismaService = {
    world: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    worldMembership: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    village: {
      findUnique: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockWorldConfigService = {
    getConfig: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorldService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WorldConfigService, useValue: mockWorldConfigService },
      ],
    }).compile();

    module.useLogger(false);
    service = module.get<WorldService>(WorldService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorlds', () => {
    it('returns worlds with their player counts', async () => {
      const worlds = [
        { id: 'world-1', name: 'World 1', createdAt: new Date() },
        { id: 'world-2', name: 'World 2', createdAt: new Date() },
      ];
      mockPrismaService.world.findMany.mockResolvedValue(worlds);
      mockPrismaService.worldMembership.groupBy.mockResolvedValue([
        { worldId: 'world-1', _count: { _all: 10 } },
        { worldId: 'world-2', _count: { _all: 5 } },
      ]);

      const result = await service.getWorlds();

      expect(result).toEqual([
        { ...worlds[0], playerCount: 10 },
        { ...worlds[1], playerCount: 5 },
      ]);
    });

    it('returns 0 player count for worlds with no memberships', async () => {
      mockPrismaService.world.findMany.mockResolvedValue([
        { id: 'world-1', name: 'World 1', createdAt: new Date() },
      ]);
      mockPrismaService.worldMembership.groupBy.mockResolvedValue([]);

      const result = await service.getWorlds();

      expect(result[0].playerCount).toBe(0);
    });

    it('returns an empty array when no worlds exist', async () => {
      mockPrismaService.world.findMany.mockResolvedValue([]);
      mockPrismaService.worldMembership.groupBy.mockResolvedValue([]);

      expect(await service.getWorlds()).toEqual([]);
    });
  });

  describe('getWorldDetails', () => {
    it('returns the world details with player count and strips config', async () => {
      const world = {
        id: 'world-1',
        name: 'World 1',
        createdAt: new Date(),
        config: { secret: 'value' },
      };
      mockPrismaService.world.findUnique.mockResolvedValue(world);
      (mockPrismaService.worldMembership as { count?: jest.Mock }).count = jest
        .fn()
        .mockResolvedValue(10);

      const result = await service.getWorldDetails('world-1');

      expect(result).toEqual({
        id: 'world-1',
        name: 'World 1',
        createdAt: world.createdAt,
        playerCount: 10,
      });
      expect(result).not.toHaveProperty('config');
    });

    it('throws NotFoundException when the world does not exist', async () => {
      mockPrismaService.world.findUnique.mockResolvedValue(null);

      await expect(service.getWorldDetails('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getWorldConfig', () => {
    it('delegates to WorldConfigService.getConfig', async () => {
      const config = { multipliers: {} };
      mockWorldConfigService.getConfig.mockResolvedValue(config);

      const result = await service.getWorldConfig('world-1');

      expect(result).toBe(config);
      expect(mockWorldConfigService.getConfig).toHaveBeenCalledWith('world-1');
    });
  });

  describe('getWorldIdFromVillage', () => {
    it('returns the worldId for an existing village', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue({
        worldId: 'world-1',
      });

      const result = await service.getWorldIdFromVillage('village-1');

      expect(result).toBe('world-1');
      expect(mockPrismaService.village.findUnique).toHaveBeenCalledWith({
        where: { id: 'village-1' },
        select: { worldId: true },
      });
    });

    it('throws NotFoundException when the village does not exist', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue(null);

      await expect(service.getWorldIdFromVillage('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserMemberships', () => {
    it('returns memberships annotated with village counts', async () => {
      const memberships = [
        {
          worldId: 'world-1',
          role: 'PLAYER',
          joinedAt: new Date(),
          lastLoginAt: new Date(),
          world: { name: 'World 1' },
        },
        {
          worldId: 'world-2',
          role: 'PLAYER',
          joinedAt: new Date(),
          lastLoginAt: new Date(),
          world: { name: 'World 2' },
        },
      ];
      mockPrismaService.worldMembership.findMany.mockResolvedValue(memberships);
      mockPrismaService.village.groupBy.mockResolvedValue([
        { worldId: 'world-1', _count: { _all: 2 } },
        { worldId: 'world-2', _count: { _all: 1 } },
      ]);

      const result = await service.getUserMemberships('user-1');

      expect(result).toEqual([
        expect.objectContaining({
          worldId: 'world-1',
          worldName: 'World 1',
          villageCount: 2,
        }),
        expect.objectContaining({
          worldId: 'world-2',
          worldName: 'World 2',
          villageCount: 1,
        }),
      ]);
    });

    it('returns an empty array when the user has no memberships', async () => {
      mockPrismaService.worldMembership.findMany.mockResolvedValue([]);
      mockPrismaService.village.groupBy.mockResolvedValue([]);

      expect(await service.getUserMemberships('user-1')).toEqual([]);
    });
  });
});
