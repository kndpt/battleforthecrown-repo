import { Test, TestingModule } from '@nestjs/testing';
import { ProductionWorker } from './production.worker';
import { PrismaService } from '../infra/prisma/prisma.service';
import { ResourcesService } from '../modules/resources/resources.service';
import { ConfigService } from '@nestjs/config';
import * as PgBoss from 'pg-boss';

/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

describe('ProductionWorker', () => {
  let worker: ProductionWorker;
  let mockPgBoss: any;
  let mockPrisma: any;
  let mockResourcesService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockPgBoss = {
      createQueue: jest.fn().mockResolvedValue(undefined),
      work: jest.fn().mockResolvedValue(undefined),
      schedule: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PgBoss>;

    mockPrisma = {
      village: {
        findMany: jest.fn(),
      },
    } as any;

    mockResourcesService = {
      updateProduction: jest.fn().mockResolvedValue({
        villageId: 'test-village',
        wood: 100,
        stone: 100,
        iron: 100,
        maxPerType: 1000,
        lastUpdateTs: new Date(),
      }),
    } as any;

    mockConfigService = {
      get: jest.fn(),
    } as any;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionWorker,
        { provide: 'PG_BOSS', useValue: mockPgBoss },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ResourcesService, useValue: mockResourcesService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    module.useLogger(false);
    worker = module.get<ProductionWorker>(ProductionWorker);
  });

  describe('onModuleInit', () => {
    it('should initialize with default interval (60 minutes)', async () => {
      mockConfigService.get.mockReturnValue(60);

      await worker.onModuleInit();

      expect(mockPgBoss.createQueue).toHaveBeenCalledWith('production:tick');
      expect(mockPgBoss.work).toHaveBeenCalledWith(
        'production:tick',
        expect.any(Function),
      );
      expect(mockPgBoss.schedule).toHaveBeenCalledWith(
        'production:tick',
        '*/60 * * * *',
        {},
        { tz: 'UTC' },
      );
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'PRODUCTION_TICK_INTERVAL_MINUTES',
        60,
      );
    });

    it('should initialize with custom interval from environment', async () => {
      mockConfigService.get.mockReturnValue(30);

      await worker.onModuleInit();

      expect(mockPgBoss.schedule).toHaveBeenCalledWith(
        'production:tick',
        '*/30 * * * *',
        {},
        { tz: 'UTC' },
      );
    });

    it('should handle pg-boss errors during initialization', async () => {
      const error = new Error('pg-boss connection failed');
      mockPgBoss.createQueue.mockRejectedValue(error);

      await expect(worker.onModuleInit()).rejects.toThrow(
        'pg-boss connection failed',
      );
      expect(mockPgBoss.createQueue).toHaveBeenCalled();
      expect(mockPgBoss.work).not.toHaveBeenCalled();
      expect(mockPgBoss.schedule).not.toHaveBeenCalled();
    });

    it('should handle worker registration errors', async () => {
      const error = new Error('Worker registration failed');
      mockPgBoss.work.mockRejectedValue(error);

      await expect(worker.onModuleInit()).rejects.toThrow(
        'Worker registration failed',
      );
      expect(mockPgBoss.createQueue).toHaveBeenCalled();
      expect(mockPgBoss.work).toHaveBeenCalled();
      expect(mockPgBoss.schedule).not.toHaveBeenCalled();
    });

    it('should handle scheduling errors', async () => {
      const error = new Error('Scheduling failed');
      mockPgBoss.schedule.mockRejectedValue(error);

      await expect(worker.onModuleInit()).rejects.toThrow('Scheduling failed');
      expect(mockPgBoss.createQueue).toHaveBeenCalled();
      expect(mockPgBoss.work).toHaveBeenCalled();
      expect(mockPgBoss.schedule).toHaveBeenCalled();
    });

    it('should initialize with zero interval', async () => {
      mockConfigService.get.mockReturnValue(0);

      await worker.onModuleInit();

      expect(mockPgBoss.schedule).toHaveBeenCalledWith(
        'production:tick',
        '*/0 * * * *',
        {},
        { tz: 'UTC' },
      );
    });

    it('should initialize with negative interval', async () => {
      mockConfigService.get.mockReturnValue(-10);

      await worker.onModuleInit();

      expect(mockPgBoss.schedule).toHaveBeenCalledWith(
        'production:tick',
        '*/-10 * * * *',
        {},
        { tz: 'UTC' },
      );
    });

    it('should initialize with very large interval', async () => {
      mockConfigService.get.mockReturnValue(1440); // 24 hours

      await worker.onModuleInit();

      expect(mockPgBoss.schedule).toHaveBeenCalledWith(
        'production:tick',
        '*/1440 * * * *',
        {},
        { tz: 'UTC' },
      );
    });
  });

  describe('handleProductionTick', () => {
    let workCallback: () => Promise<void>;

    beforeEach(async () => {
      mockConfigService.get.mockReturnValue(60);
      mockPrisma.village.findMany.mockResolvedValue([
        { id: 'village1', name: 'Village 1' },
        { id: 'village2', name: 'Village 2' },
      ]);

      await worker.onModuleInit();

      // Extract the work callback from the mock
      workCallback = mockPgBoss.work.mock.calls[0][1];
    });

    it('should process production for all villages successfully', async () => {
      await workCallback();

      expect(mockPrisma.village.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true },
      });
      expect(mockResourcesService.updateProduction).toHaveBeenCalledTimes(2);
      expect(mockResourcesService.updateProduction).toHaveBeenCalledWith(
        'village1',
        false,
      );
      expect(mockResourcesService.updateProduction).toHaveBeenCalledWith(
        'village2',
        false,
      );
    });

    it('should handle no villages case', async () => {
      mockPrisma.village.findMany.mockResolvedValue([]);

      await workCallback();

      expect(mockPrisma.village.findMany).toHaveBeenCalled();
      expect(mockResourcesService.updateProduction).not.toHaveBeenCalled();
    });

    it('should handle village production errors individually', async () => {
      mockResourcesService.updateProduction
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Production update failed'));

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalledTimes(2);
      // Should not throw error, continue processing other villages
    });

    it('should handle all villages failing production updates', async () => {
      mockResourcesService.updateProduction.mockRejectedValue(
        new Error('All failed'),
      );

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalledTimes(2);
      // Should not throw error, just log errors
    });

    it('should handle database errors during village fetch', async () => {
      const error = new Error('Database connection failed');
      mockPrisma.village.findMany.mockRejectedValue(error);

      await expect(workCallback()).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockResourcesService.updateProduction).not.toHaveBeenCalled();
    });

    it('should handle mixed success and failure scenarios', async () => {
      mockPrisma.village.findMany.mockResolvedValue([
        { id: 'village1', name: 'Village 1' },
        { id: 'village2', name: 'Village 2' },
        { id: 'village3', name: 'Village 3' },
      ]);

      mockResourcesService.updateProduction
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Village 2 failed'))
        .mockResolvedValueOnce(undefined);

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalledTimes(3);
      expect(mockResourcesService.updateProduction).toHaveBeenNthCalledWith(
        1,
        'village1',
        false,
      );
      expect(mockResourcesService.updateProduction).toHaveBeenNthCalledWith(
        2,
        'village2',
        false,
      );
      expect(mockResourcesService.updateProduction).toHaveBeenNthCalledWith(
        3,
        'village3',
        false,
      );
    });

    it('should handle single village case', async () => {
      mockPrisma.village.findMany.mockResolvedValue([
        { id: 'village1', name: 'Village 1' },
      ]);

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalledTimes(1);
      expect(mockResourcesService.updateProduction).toHaveBeenCalledWith(
        'village1',
        false,
      );
    });

    it('should handle large number of villages', async () => {
      const villages = Array.from({ length: 1000 }, (_, i) => ({
        id: `village${i}`,
        name: `Village ${i}`,
      }));
      mockPrisma.village.findMany.mockResolvedValue(villages);

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalledTimes(1000);
      villages.forEach((village) => {
        expect(mockResourcesService.updateProduction).toHaveBeenCalledWith(
          village.id,
          false,
        );
      });
    });

    it('should handle ResourceService throwing NotFoundException', async () => {
      mockResourcesService.updateProduction.mockRejectedValue(
        new Error('Village not found'),
      );

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalled();
      // Should not throw, continue processing
    });

    it('should handle ResourceService throwing other exceptions', async () => {
      mockResourcesService.updateProduction.mockRejectedValue(
        new Error('World config invalid'),
      );

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalled();
      // Should not throw, continue processing
    });

    it('should handle ResourceService timeout errors', async () => {
      mockResourcesService.updateProduction.mockRejectedValue(
        new Error('Request timeout'),
      );

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalled();
      // Should not throw, continue processing
    });
  });

  describe('performance and logging', () => {
    let workCallback: () => Promise<void>;

    beforeEach(async () => {
      mockConfigService.get.mockReturnValue(60);
      mockPrisma.village.findMany.mockResolvedValue([
        { id: 'village1', name: 'Village 1' },
        { id: 'village2', name: 'Village 2' },
      ]);

      await worker.onModuleInit();
      workCallback = mockPgBoss.work.mock.calls[0][1];
    });

    it('should complete processing within reasonable time', async () => {
      mockResourcesService.updateProduction.mockImplementation(async () => {
        // Simulate some processing time
        await new Promise((resolve) => setTimeout(resolve, 1));
      });

      const startTime = Date.now();
      await workCallback();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle ResourceService taking too long', async () => {
      mockResourcesService.updateProduction.mockImplementation(async () => {
        // Simulate long processing time
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Should not timeout, let it complete
      await expect(workCallback()).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    let workCallback: () => Promise<void>;

    beforeEach(async () => {
      mockConfigService.get.mockReturnValue(60);
      await worker.onModuleInit();
      workCallback = mockPgBoss.work.mock.calls[0][1];
    });

    it('should handle villages with null or undefined names', async () => {
      mockPrisma.village.findMany.mockResolvedValue([
        { id: 'village1', name: null },
        { id: 'village2', name: undefined },
        { id: 'village3', name: 'Village 3' },
      ]);

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalledTimes(3);
    });

    it('should handle villages with empty string names', async () => {
      mockPrisma.village.findMany.mockResolvedValue([
        { id: 'village1', name: '' },
        { id: 'village2', name: '   ' },
      ]);

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalledTimes(2);
    });

    it('should handle ResourceService returning unexpected values', async () => {
      mockPrisma.village.findMany.mockResolvedValue([
        { id: 'village1', name: 'Village 1' },
      ]);
      mockResourcesService.updateProduction.mockResolvedValue(
        'unexpected' as any,
      );

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalled();
      // Should handle unexpected return types gracefully
    });

    it('should handle ResourceService throwing non-Error objects', async () => {
      mockPrisma.village.findMany.mockResolvedValue([
        { id: 'village1', name: 'Village 1' },
      ]);
      mockResourcesService.updateProduction.mockRejectedValue(
        'String error' as any,
      );

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalled();
      // Should handle non-Error throwables
    });

    it('should handle ResourceService throwing null', async () => {
      mockPrisma.village.findMany.mockResolvedValue([
        { id: 'village1', name: 'Village 1' },
      ]);
      mockResourcesService.updateProduction.mockRejectedValue(null);

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalled();
      // Should handle null throws
    });

    it('should handle ResourceService throwing undefined', async () => {
      mockPrisma.village.findMany.mockResolvedValue([
        { id: 'village1', name: 'Village 1' },
      ]);
      mockResourcesService.updateProduction.mockRejectedValue(undefined);

      await workCallback();

      expect(mockResourcesService.updateProduction).toHaveBeenCalled();
      // Should handle undefined throws
    });
  });

  describe('integration with pg-boss', () => {
    it('should pass correct queue name to pg-boss', async () => {
      mockConfigService.get.mockReturnValue(60);

      await worker.onModuleInit();

      expect(mockPgBoss.createQueue).toHaveBeenCalledWith('production:tick');
      expect(mockPgBoss.work).toHaveBeenCalledWith(
        'production:tick',
        expect.any(Function),
      );
      expect(mockPgBoss.schedule).toHaveBeenCalledWith(
        'production:tick',
        '*/60 * * * *',
        {},
        { tz: 'UTC' },
      );
    });

    it('should use UTC timezone for scheduling', async () => {
      mockConfigService.get.mockReturnValue(60);

      await worker.onModuleInit();

      expect(mockPgBoss.schedule).toHaveBeenCalledWith(
        'production:tick',
        expect.any(String),
        {},
        { tz: 'UTC' },
      );
    });

    it('should pass empty options object to schedule', async () => {
      mockConfigService.get.mockReturnValue(60);

      await worker.onModuleInit();

      expect(mockPgBoss.schedule).toHaveBeenCalledWith(
        'production:tick',
        expect.any(String),
        {}, // Empty options object
        { tz: 'UTC' },
      );
    });
  });
});
