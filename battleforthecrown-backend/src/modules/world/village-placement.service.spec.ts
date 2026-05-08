import { VillagePlacementService } from './village-placement.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import type { PlayerVillagePlacementPlan } from '@battleforthecrown/shared/world';

type PlayerVillagePlacementConfig = PlayerVillagePlacementPlan;

type PrismaMock = {
  zoneCapacity: {
    findUnique: jest.Mock<Promise<{ villageCount: number } | null>, [unknown]>;
    upsert: jest.Mock<Promise<unknown>, [unknown]>;
  };
  village: {
    findMany: jest.Mock<Promise<Array<{ x: number; y: number }>>, [unknown]>;
    findUnique: jest.Mock<Promise<{ id: string } | null>, [unknown]>;
  };
};

type WorldConfigMock = {
  getConfig: jest.Mock<
    Promise<{ playerVillagePlacement: PlayerVillagePlacementConfig }>,
    [unknown]
  >;
};

type Coordinates = { x: number; y: number };

interface VillagePlacementInternals {
  checkZoneCapacity(
    worldId: string,
    zoneIndex: number,
    maxVillages: number,
  ): Promise<boolean>;
  incrementZoneCount(worldId: string, zoneIndex: number): Promise<void>;
  findPositionInZone(params: {
    worldId: string;
    world: { gridWidth: number; gridHeight: number };
    centerX: number;
    centerY: number;
    zone: { minRadius: number; maxRadius: number };
    minSpacing: number;
  }): Promise<Coordinates | null>;
  findRandomPosition(params: {
    worldId: string;
    world: { gridWidth: number; gridHeight: number };
  }): Promise<Coordinates>;
}

describe('VillagePlacementService', () => {
  let service: VillagePlacementService;
  let prisma: PrismaMock;
  let worldConfig: WorldConfigMock;

  const placementConfig: PlayerVillagePlacementConfig = {
    enabled: true,
    minSpacing: 3,
    zones: [
      { minRadius: 0, maxRadius: 30, maxVillages: 2 },
      { minRadius: 30, maxRadius: 60, maxVillages: 4 },
    ],
  };

  const createService = () =>
    new VillagePlacementService(
      prisma as unknown as PrismaService,
      worldConfig as unknown as WorldConfigService,
    );

  beforeEach(() => {
    prisma = {
      zoneCapacity: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      village: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    worldConfig = {
      getConfig: jest.fn(),
    };

    service = createService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fallback to random placement when disabled', async () => {
    worldConfig.getConfig.mockResolvedValue({
      playerVillagePlacement: { ...placementConfig, enabled: false },
    });

    const internals = service as unknown as VillagePlacementInternals;
    const randomSpy = jest
      .spyOn(internals, 'findRandomPosition')
      .mockResolvedValue({ x: 5, y: 7 });

    const position = await service.findVillagePosition({
      worldId: 'world-1',
      world: { gridWidth: 100, gridHeight: 100 },
    });

    expect(position).toEqual({ x: 5, y: 7 });
    expect(randomSpy).toHaveBeenCalled();
  });

  it('should find a position in the first available zone', async () => {
    worldConfig.getConfig.mockResolvedValue({
      playerVillagePlacement: placementConfig,
    });

    const internals = service as unknown as VillagePlacementInternals;
    const capacitySpy = jest
      .spyOn(internals, 'checkZoneCapacity')
      .mockResolvedValue(true);
    const positionSpy = jest
      .spyOn(internals, 'findPositionInZone')
      .mockResolvedValue({ x: 40, y: 40 });
    const incrementSpy = jest
      .spyOn(internals, 'incrementZoneCount')
      .mockResolvedValue();

    const position = await service.findVillagePosition({
      worldId: 'world-1',
      world: { gridWidth: 120, gridHeight: 120 },
    });

    expect(position).toEqual({ x: 40, y: 40 });
    expect(capacitySpy).toHaveBeenCalled();
    expect(positionSpy).toHaveBeenCalled();
    expect(incrementSpy).toHaveBeenCalledWith('world-1', 0);
  });

  it('should throw when no zone can provide a position', async () => {
    worldConfig.getConfig.mockResolvedValue({
      playerVillagePlacement: placementConfig,
    });

    const internals = service as unknown as VillagePlacementInternals;
    jest.spyOn(internals, 'checkZoneCapacity').mockResolvedValue(true);
    jest.spyOn(internals, 'findPositionInZone').mockResolvedValue(null);

    await expect(
      service.findVillagePosition({
        worldId: 'world-1',
        world: { gridWidth: 120, gridHeight: 120 },
      }),
    ).rejects.toThrow('Could not find available position in any zone');
  });

  it('should report zone capacity correctly', async () => {
    worldConfig.getConfig.mockResolvedValue({
      playerVillagePlacement: placementConfig,
    });
    prisma.zoneCapacity.findUnique
      .mockResolvedValueOnce({ villageCount: 1 })
      .mockResolvedValueOnce(null);

    const stats = await service.getZoneStatistics('world-1');

    expect(stats).toEqual({
      enabled: true,
      zones: [
        expect.objectContaining({
          zoneIndex: 0,
          currentCount: 1,
          utilization: 50,
        }),
        expect.objectContaining({ zoneIndex: 1, currentCount: 0 }),
      ],
    });
  });

  it('should indicate disabled placement in statistics', async () => {
    worldConfig.getConfig.mockResolvedValue({
      playerVillagePlacement: { ...placementConfig, enabled: false },
    });

    const stats = await service.getZoneStatistics('world-1');

    expect(stats).toEqual({ enabled: false, zones: [] });
  });

  it('should check zone capacity using persisted counts', async () => {
    const internals = service as unknown as VillagePlacementInternals;

    const resultWithRoom = await internals.checkZoneCapacity('world-1', 0, 3);
    expect(resultWithRoom).toBe(true);

    prisma.zoneCapacity.findUnique.mockResolvedValue({ villageCount: 3 });

    const resultWithoutRoom = await internals.checkZoneCapacity(
      'world-1',
      0,
      3,
    );
    expect(resultWithoutRoom).toBe(false);
  });

  it('should increment zone count via upsert', async () => {
    const internals = service as unknown as VillagePlacementInternals;

    await internals.incrementZoneCount('world-1', 2);

    expect(prisma.zoneCapacity.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { worldId_zoneIndex: { worldId: 'world-1', zoneIndex: 2 } },
      }),
    );
  });

  it('should locate a position within a zone respecting spacing', async () => {
    prisma.village.findMany.mockResolvedValue([{ x: 10, y: 10 }]);
    prisma.village.findUnique.mockResolvedValue(null);

    const internals = service as unknown as VillagePlacementInternals;
    const randomValues = [0, 0];
    jest
      .spyOn(Math, 'random')
      .mockImplementation(() => randomValues.shift() ?? 0.25);

    const position = await internals.findPositionInZone({
      worldId: 'world-1',
      world: { gridWidth: 200, gridHeight: 200 },
      centerX: 100,
      centerY: 100,
      zone: { minRadius: 10, maxRadius: 20 },
      minSpacing: 5,
    });

    expect(position).toEqual({ x: 110, y: 100 });
  });

  it('should return null when zone attempts are exhausted', async () => {
    prisma.village.findMany.mockResolvedValue([]);
    prisma.village.findUnique.mockResolvedValue({ id: 'occupied' });

    const internals = service as unknown as VillagePlacementInternals;
    jest.spyOn(Math, 'random').mockReturnValue(0.1);

    const result = await internals.findPositionInZone({
      worldId: 'world-1',
      world: { gridWidth: 100, gridHeight: 100 },
      centerX: 50,
      centerY: 50,
      zone: { minRadius: 10, maxRadius: 20 },
      minSpacing: 3,
    });

    expect(result).toBeNull();
  });

  it('should find a random position when free tile exists', async () => {
    prisma.village.findUnique.mockResolvedValueOnce(null);
    jest.spyOn(Math, 'random').mockReturnValue(0.1);

    const internals = service as unknown as VillagePlacementInternals;

    const position = await internals.findRandomPosition({
      worldId: 'world-1',
      world: { gridWidth: 100, gridHeight: 100 },
    });

    expect(position).toEqual({ x: 10, y: 10 });
  });

  it('should throw when random search cannot find a free tile', async () => {
    prisma.village.findUnique.mockResolvedValue({ id: 'occupied' });
    jest.spyOn(Math, 'random').mockReturnValue(0.2);

    const internals = service as unknown as VillagePlacementInternals;

    await expect(
      internals.findRandomPosition({
        worldId: 'world-1',
        world: { gridWidth: 50, gridHeight: 50 },
      }),
    ).rejects.toThrow('Could not find available position');
  });
});
