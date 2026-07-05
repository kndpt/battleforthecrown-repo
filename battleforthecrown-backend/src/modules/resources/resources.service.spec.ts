import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldConfigService } from '../world/world-config.service';
import { VillageStrategyService } from '../strategy/village-strategy.service';
import { MS_PER_HOUR } from '@battleforthecrown/shared/time';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let mockWorldConfig: {
    projectVillageRatesPerMinute: jest.Mock;
  };

  const sixtyMinutesAgo = () => new Date(Date.now() - MS_PER_HOUR);

  beforeEach(async () => {
    mockWorldConfig = {
      projectVillageRatesPerMinute: jest
        .fn()
        .mockResolvedValue({ wood: 0, stone: 0, iron: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: PrismaService, useValue: {} },
        { provide: OwnershipService, useValue: {} },
        { provide: WorldConfigService, useValue: mockWorldConfig },
        { provide: VillageStrategyService, useValue: {} },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateCurrentResources', () => {
    it('accrues each stock from its per-minute rate over the elapsed time', async () => {
      mockWorldConfig.projectVillageRatesPerMinute.mockResolvedValue({
        wood: 0,
        stone: 10,
        iron: 0,
      });

      const result = await service.calculateCurrentResources({
        worldId: 'world-1',
        resourceStock: {
          wood: 100,
          stone: 200,
          iron: 150,
          maxPerType: 50_000,
          lastUpdateTs: sixtyMinutesAgo(),
        },
        buildings: [{ type: 'STONE', level: 3 }],
      });

      // STONE: 200 + floor(10 * 60) = 800; wood/iron have rate 0 → unchanged
      expect(result.stone).toBe(800);
      expect(result.wood).toBe(100);
      expect(result.iron).toBe(150);
    });

    it('caps the accrual at maxPerType', async () => {
      mockWorldConfig.projectVillageRatesPerMinute.mockResolvedValue({
        wood: 1000,
        stone: 0,
        iron: 0,
      });

      const result = await service.calculateCurrentResources({
        worldId: 'world-1',
        resourceStock: {
          wood: 0,
          stone: 0,
          iron: 0,
          maxPerType: 500,
          lastUpdateTs: sixtyMinutesAgo(),
        },
        buildings: [{ type: 'WOOD', level: 1 }],
      });

      expect(result.wood).toBe(500);
    });

    it('forwards worldId, buildings, strategy and naturalTrait to the projection', async () => {
      const buildings = [{ type: 'WOOD', level: 2 }];

      await service.calculateCurrentResources({
        worldId: 'world-1',
        resourceStock: {
          wood: 0,
          stone: 0,
          iron: 0,
          maxPerType: 50_000,
          lastUpdateTs: sixtyMinutesAgo(),
        },
        buildings,
        strategy: 'ECONOMIC',
        naturalTrait: 'DENSE_FOREST',
      });

      expect(mockWorldConfig.projectVillageRatesPerMinute).toHaveBeenCalledWith(
        'world-1',
        buildings,
        'ECONOMIC',
        'DENSE_FOREST',
      );
    });
  });
});
