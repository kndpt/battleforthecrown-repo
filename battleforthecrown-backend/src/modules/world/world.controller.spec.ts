import { Test, TestingModule } from '@nestjs/testing';
import { WorldController } from './world.controller';
import { WorldService } from './world.service';
import { WorldConfigService } from './world-config.service';
import { WorldEntitiesQueryService } from './world-entities-query.service';
import { JoinWorldUseCase } from './join-world.use-case';
import { VisionService } from './vision.service';
import type { AuthenticatedUser } from '../../common/auth';

const REVEALED_ENTITIES = [
  {
    id: 'e1',
    worldId: 'w1',
    kind: 'BARBARIAN_VILLAGE',
    x: 5,
    y: 5,
    data: { tier: 'T1', name: 'Barb-A' },
  },
  {
    id: 'e2',
    worldId: 'w1',
    kind: 'PLAYER_VILLAGE',
    x: 50,
    y: 50,
    data: { name: 'Player-B', userId: 'user-B' },
  },
];

const USER_A: AuthenticatedUser = { id: 'user-A' };

describe('WorldController — fog of war', () => {
  let controller: WorldController;
  const mockWorldService = {};
  const mockWorldConfigService = {
    getConfig: jest.fn(),
  };
  const mockWorldEntitiesQueryService = {
    getEntitiesInRadius: jest.fn(),
    getAllEntities: jest.fn(),
    getVillagesInRadius: jest.fn(),
    getAllVillages: jest.fn(),
  };
  const mockJoinWorldUseCase = { execute: jest.fn() };
  const mockVisionService = {
    getVisionDisks: jest.fn(),
    applyFogOfWar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorldController],
      providers: [
        { provide: WorldService, useValue: mockWorldService },
        { provide: WorldConfigService, useValue: mockWorldConfigService },
        {
          provide: WorldEntitiesQueryService,
          useValue: mockWorldEntitiesQueryService,
        },
        { provide: JoinWorldUseCase, useValue: mockJoinWorldUseCase },
        { provide: VisionService, useValue: mockVisionService },
      ],
    }).compile();

    controller = module.get<WorldController>(WorldController);
    jest.clearAllMocks();
    mockWorldEntitiesQueryService.getAllEntities.mockResolvedValue(
      REVEALED_ENTITIES,
    );
    mockVisionService.getVisionDisks.mockResolvedValue([
      { x: 0, y: 0, radius: 10 },
    ]);
    mockVisionService.applyFogOfWar.mockImplementation(
      (
        entities: typeof REVEALED_ENTITIES,
        disks: { radius: number | null }[],
      ) => {
        if (disks.some((d) => d.radius === null)) return entities;
        return entities.map((e) => {
          const d = e.x * e.x + e.y * e.y;
          return d <= 100 ? e : { kind: 'fogged', id: e.id, x: e.x, y: e.y };
        });
      },
    );
  });

  it('returns full payload when fog feature is disabled', async () => {
    mockWorldConfigService.getConfig.mockResolvedValueOnce({
      multipliers: { construction: 1, production: 1, training: 1 },
      combat: {},
      fogOfWar: { enabled: false },
    });

    const result = await controller.getWorldEntities(USER_A, 'w1');

    expect(result).toEqual(REVEALED_ENTITIES);
    expect(mockVisionService.getVisionDisks).not.toHaveBeenCalled();
  });

  it('returns full payload when fogOfWar config is missing', async () => {
    mockWorldConfigService.getConfig.mockResolvedValueOnce({
      multipliers: { construction: 1, production: 1, training: 1 },
      combat: {},
    });

    const result = await controller.getWorldEntities(USER_A, 'w1');

    expect(result).toEqual(REVEALED_ENTITIES);
    expect(mockVisionService.getVisionDisks).not.toHaveBeenCalled();
  });

  it('fogs out-of-vision entities when fog is enabled', async () => {
    mockWorldConfigService.getConfig.mockResolvedValueOnce({
      multipliers: { construction: 1, production: 1, training: 1 },
      combat: {},
      fogOfWar: { enabled: true },
    });

    const result = await controller.getWorldEntities(USER_A, 'w1');

    expect(mockVisionService.getVisionDisks).toHaveBeenCalledWith(
      'user-A',
      'w1',
    );
    expect(result).toEqual([
      REVEALED_ENTITIES[0],
      { kind: 'fogged', id: 'e2', x: 50, y: 50 },
    ]);
  });
});
