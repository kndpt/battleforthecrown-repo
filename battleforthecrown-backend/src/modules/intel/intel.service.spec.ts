import { Test, TestingModule } from '@nestjs/testing';
import { IntelService } from './intel.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { OwnershipService } from '../../common/auth/ownership.service';

describe('IntelService', () => {
  let service: IntelService;
  const mockPrismaService = {
    villageIntel: {
      findUnique: jest.fn(),
    },
    village: {
      findUnique: jest.fn(),
    },
  };
  const mockOwnership = {
    assertWorldMember: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OutboxPublisher, useValue: {} },
        { provide: OwnershipService, useValue: mockOwnership },
      ],
    }).compile();

    service = module.get<IntelService>(IntelService);
    jest.clearAllMocks();
  });

  describe('getIntel', () => {
    const row = {
      targetVillageId: 'village-2',
      worldId: 'world-1',
      sourceKind: 'SCOUT' as const,
      sourceReportId: 'report-1',
      units: {},
      resources: { wood: 0, stone: 0, iron: 0 },
      wallLevel: 2,
      strategy: null,
      targetName: 'Target',
      targetX: 5,
      targetY: 5,
      targetTier: null,
      seenAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('projects the target village natural trait when an intel row exists (scouted)', async () => {
      mockOwnership.assertWorldMember.mockResolvedValueOnce(undefined);
      mockPrismaService.villageIntel.findUnique.mockResolvedValueOnce(row);
      mockPrismaService.village.findUnique.mockResolvedValueOnce({
        naturalTrait: 'IRON_VEIN',
      });

      const dto = await service.getIntel('user-1', 'world-1', 'village-2');

      expect(dto?.naturalTrait).toBe('IRON_VEIN');
      expect(mockPrismaService.village.findUnique).toHaveBeenCalledWith({
        where: { id: 'village-2' },
        select: { naturalTrait: true },
      });
    });

    it('never exposes the natural trait when no intel row exists (anti-leak, no scout)', async () => {
      mockOwnership.assertWorldMember.mockResolvedValueOnce(undefined);
      mockPrismaService.villageIntel.findUnique.mockResolvedValueOnce(null);

      const dto = await service.getIntel('user-1', 'world-1', 'village-2');

      expect(dto).toBeNull();
      expect(mockPrismaService.village.findUnique).not.toHaveBeenCalled();
    });
  });
});
