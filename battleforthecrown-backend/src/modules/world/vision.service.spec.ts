import { Test, TestingModule } from '@nestjs/testing';
import { VisionService, VisionDisk } from './vision.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

describe('VisionService', () => {
  let service: VisionService;
  const mockPrismaService = {
    village: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<VisionService>(VisionService);
    jest.clearAllMocks();
  });

  describe('getVisionDisks', () => {
    it('returns one disk per village with a watchtower', async () => {
      mockPrismaService.village.findMany.mockResolvedValueOnce([
        { x: 10, y: 20, buildings: [{ level: 3 }] },
        { x: 50, y: 60, buildings: [{ level: 5 }] },
      ]);

      const disks = await service.getVisionDisks('user-1', 'world-1');

      expect(disks).toEqual([
        { x: 10, y: 20, radius: 15 },
        { x: 50, y: 60, radius: 25 },
      ]);
    });

    it('skips villages without a watchtower', async () => {
      mockPrismaService.village.findMany.mockResolvedValueOnce([
        { x: 10, y: 20, buildings: [{ level: 3 }] },
        { x: 30, y: 40, buildings: [] },
      ]);

      const disks = await service.getVisionDisks('user-1', 'world-1');

      expect(disks).toHaveLength(1);
      expect(disks[0]).toEqual({ x: 10, y: 20, radius: 15 });
    });

    it('returns radius=null for watchtower level 10 (unlimited)', async () => {
      mockPrismaService.village.findMany.mockResolvedValueOnce([
        { x: 0, y: 0, buildings: [{ level: 10 }] },
      ]);

      const disks = await service.getVisionDisks('user-1', 'world-1');

      expect(disks).toEqual([{ x: 0, y: 0, radius: null }]);
    });

    it('skips watchtower level 0 (world locked)', async () => {
      mockPrismaService.village.findMany.mockResolvedValueOnce([
        { x: 10, y: 20, buildings: [{ level: 0 }] },
      ]);

      const disks = await service.getVisionDisks('user-1', 'world-1');

      expect(disks).toEqual([]);
    });

    it('returns empty array when user has no villages', async () => {
      mockPrismaService.village.findMany.mockResolvedValueOnce([]);

      const disks = await service.getVisionDisks('user-1', 'world-1');

      expect(disks).toEqual([]);
    });
  });

  describe('isInVision', () => {
    it('returns true when point is inside a disk', () => {
      const disks: VisionDisk[] = [{ x: 0, y: 0, radius: 10 }];
      expect(service.isInVision({ x: 5, y: 5 }, disks)).toBe(true);
    });

    it('returns true on the disk boundary', () => {
      const disks: VisionDisk[] = [{ x: 0, y: 0, radius: 5 }];
      expect(service.isInVision({ x: 3, y: 4 }, disks)).toBe(true);
    });

    it('returns false when point is outside all disks', () => {
      const disks: VisionDisk[] = [{ x: 0, y: 0, radius: 5 }];
      expect(service.isInVision({ x: 10, y: 10 }, disks)).toBe(false);
    });

    it('returns true when any disk has radius=null (unlimited)', () => {
      const disks: VisionDisk[] = [
        { x: 0, y: 0, radius: 5 },
        { x: 100, y: 100, radius: null },
      ];
      expect(service.isInVision({ x: 9999, y: 9999 }, disks)).toBe(true);
    });

    it('returns false on empty disks list', () => {
      expect(service.isInVision({ x: 0, y: 0 }, [])).toBe(false);
    });

    it('union: point covered by second disk passes', () => {
      const disks: VisionDisk[] = [
        { x: 0, y: 0, radius: 5 },
        { x: 50, y: 50, radius: 10 },
      ];
      expect(service.isInVision({ x: 45, y: 50 }, disks)).toBe(true);
    });
  });

  describe('applyFogOfWar', () => {
    const entities = [
      { id: 'e1', x: 5, y: 5, kind: 'BARBARIAN_VILLAGE', data: { tier: 'T1' } },
      { id: 'e2', x: 50, y: 50, kind: 'PLAYER_VILLAGE', data: { name: 'B' } },
      { id: 'e3', x: 100, y: 100, kind: 'BARBARIAN_VILLAGE', data: {} },
    ];

    it('reveals entities inside vision and fogs the rest', () => {
      const disks: VisionDisk[] = [{ x: 0, y: 0, radius: 10 }];
      const result = service.applyFogOfWar(entities, disks);

      expect(result[0]).toEqual(entities[0]);
      expect(result[1]).toEqual({ kind: 'fogged', id: 'e2', x: 50, y: 50 });
      expect(result[2]).toEqual({ kind: 'fogged', id: 'e3', x: 100, y: 100 });
    });

    it('reveals everything when a disk has radius=null', () => {
      const disks: VisionDisk[] = [{ x: 0, y: 0, radius: null }];
      const result = service.applyFogOfWar(entities, disks);

      expect(result).toEqual(entities);
    });

    it('fogs everything when disks list is empty', () => {
      const result = service.applyFogOfWar(entities, []);

      expect(result).toEqual([
        { kind: 'fogged', id: 'e1', x: 5, y: 5 },
        { kind: 'fogged', id: 'e2', x: 50, y: 50 },
        { kind: 'fogged', id: 'e3', x: 100, y: 100 },
      ]);
    });

    it('fogged payload exposes only id/x/y/kind (no leakage)', () => {
      const result = service.applyFogOfWar(entities, []);
      const fogged = result[0];

      expect(Object.keys(fogged).sort()).toEqual(['id', 'kind', 'x', 'y']);
    });
  });
});
