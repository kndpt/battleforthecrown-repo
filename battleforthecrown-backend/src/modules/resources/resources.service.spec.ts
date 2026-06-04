import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldConfigService } from '../world/world-config.service';
import { VillageStrategyService } from '../strategy/village-strategy.service';
import type { WorldConfig } from '@battleforthecrown/shared/world';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let mockWorldConfig: {
    getConfig: jest.Mock;
    computeProductionRate: jest.Mock;
  };

  const fakeConfig = {} as WorldConfig;
  const RATE_PER_MINUTE = 10;
  const sixtyMinutesAgo = () => new Date(Date.now() - 60 * 60 * 1000);

  beforeEach(async () => {
    mockWorldConfig = {
      getConfig: jest.fn().mockResolvedValue(fakeConfig),
      computeProductionRate: jest.fn().mockReturnValue(RATE_PER_MINUTE),
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
    it('returns 0 production gain for a missing building type', async () => {
      const result = await service.calculateCurrentResources({
        worldId: 'world-1',
        resourceStock: {
          wood: 100,
          stone: 200,
          iron: 150,
          maxPerType: 50_000,
          lastUpdateTs: sixtyMinutesAgo(),
        },
        buildings: [{ type: 'STONE', level: 3 }], // no WOOD, no IRON
      });

      // STONE present: 200 + floor(10 * 60) = 800
      expect(result.stone).toBe(800);
      // WOOD and IRON missing: rate=0, no gain
      expect(result.wood).toBe(100);
      expect(result.iron).toBe(150);
    });

    it('does not call computeProductionRate for absent building types', async () => {
      await service.calculateCurrentResources({
        worldId: 'world-1',
        resourceStock: {
          wood: 0,
          stone: 0,
          iron: 0,
          maxPerType: 50_000,
          lastUpdateTs: sixtyMinutesAgo(),
        },
        buildings: [{ type: 'IRON', level: 1 }],
      });

      expect(mockWorldConfig.computeProductionRate).toHaveBeenCalledTimes(1);
      expect(mockWorldConfig.computeProductionRate).toHaveBeenCalledWith(
        fakeConfig,
        'IRON',
        1,
        undefined,
      );
    });

    it('forwards strategy to computeProductionRate for all present buildings', async () => {
      await service.calculateCurrentResources({
        worldId: 'world-1',
        resourceStock: {
          wood: 0,
          stone: 0,
          iron: 0,
          maxPerType: 50_000,
          lastUpdateTs: sixtyMinutesAgo(),
        },
        buildings: [
          { type: 'WOOD', level: 2 },
          { type: 'STONE', level: 3 },
        ],
        strategy: 'ECONOMIC',
      });

      expect(mockWorldConfig.computeProductionRate).toHaveBeenCalledWith(
        fakeConfig,
        'WOOD',
        2,
        'ECONOMIC',
      );
      expect(mockWorldConfig.computeProductionRate).toHaveBeenCalledWith(
        fakeConfig,
        'STONE',
        3,
        'ECONOMIC',
      );
    });

    it('fetches world config exactly once regardless of building count', async () => {
      await service.calculateCurrentResources({
        worldId: 'world-1',
        resourceStock: {
          wood: 0,
          stone: 0,
          iron: 0,
          maxPerType: 50_000,
          lastUpdateTs: sixtyMinutesAgo(),
        },
        buildings: [
          { type: 'WOOD', level: 1 },
          { type: 'STONE', level: 1 },
          { type: 'IRON', level: 1 },
        ],
      });

      expect(mockWorldConfig.getConfig).toHaveBeenCalledTimes(1);
    });
  });
});
