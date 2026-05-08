import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { ResourcesService } from '../modules/resources/resources.service';
import { CrownsService } from '../modules/crowns/crowns.service';
import { OutboxPublisher } from '../modules/event/outbox-publisher.service';
import PgBoss from 'pg-boss';

interface ConstructionJob {
  buildingId: string;
  villageId: string;
  buildingType: string;
  targetLevel: number;
}

@Injectable()
export class ConstructionWorker implements OnModuleInit {
  private readonly logger = new Logger(ConstructionWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly prisma: PrismaService,
    private readonly resourcesService: ResourcesService,
    private readonly crownsService: CrownsService,
    private readonly outbox: OutboxPublisher,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('🔧 [ConstructionWorker] Initializing...');

      // Create the queue first if it doesn't exist
      await this.boss.createQueue('construction:end');
      this.logger.log('✅ [ConstructionWorker] Queue created/verified');

      // Then register the worker with aggressive polling
      const workerId = await this.boss.work(
        'construction:end',
        {
          pollingIntervalSeconds: 1, // Poll for jobs every 1 second
          batchSize: 1, // Process one job at a time
        },
        async (jobs) => {
          this.logger.log('🎯 [ConstructionWorker] Handler called with jobs:', {
            isArray: Array.isArray(jobs),
            count: Array.isArray(jobs) ? jobs.length : 1,
          });

          const job = Array.isArray(jobs) ? jobs[0] : jobs;
          return this.handleConstructionComplete(job.data as ConstructionJob);
        },
      );

      this.logger.log(
        '✅ [ConstructionWorker] Worker registered successfully',
        {
          workerId,
          queueName: 'construction:end',
        },
      );

      this.logger.log('🎉 [ConstructionWorker] Initialization complete');
    } catch (error) {
      this.logger.error('❌ [ConstructionWorker] Failed to initialize:', error);
      throw error;
    }
  }

  private async handleConstructionComplete(data: ConstructionJob) {
    const receivedAt = Date.now();
    this.logger.log(`🔨 [Worker] Job reçu pour: ${data.buildingId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Get building and verify it exists
        const building = await tx.building.findUnique({
          where: { id: data.buildingId },
        });

        if (!building) {
          this.logger.warn(`Building ${data.buildingId} not found, skipping`);
          return;
        }

        const now = Date.now();
        const expectedEndTime = building.endTime?.getTime() || 0;
        const delta = now - expectedEndTime;

        this.logger.log(`⏰ [Worker] Timing analysis:`, {
          buildingId: data.buildingId,
          buildingType: data.buildingType,
          expectedEndTime: building.endTime?.toISOString(),
          expectedEndTimestamp: expectedEndTime,
          receivedAt,
          processedAt: now,
          deltaFromExpected: delta,
          wasEarly: delta < 0,
          wasLate: delta > 0,
        });

        // Check if construction was cancelled
        if (!building.endTime) {
          this.logger.log(
            `Building ${data.buildingId} was cancelled, skipping`,
          );
          return;
        }

        // Check if already completed (idempotency)
        if (building.level >= data.targetLevel) {
          this.logger.log(
            `Building ${data.buildingId} already at level ${building.level}, skipping`,
          );
          return;
        }

        // Upgrade building level
        await tx.building.update({
          where: { id: data.buildingId },
          data: {
            level: data.targetLevel,
            startTime: null,
            endTime: null,
          },
        });

        // Create event in outbox for WebSocket notification
        await this.outbox.buildingCompleted(
          {
            buildingId: data.buildingId,
            villageId: data.villageId,
            buildingType: data.buildingType,
            level: data.targetLevel,
          },
          tx,
        );

        const eventCreatedAt = Date.now();
        this.logger.log(
          `✉️ [Worker] Event outbox créé à ${eventCreatedAt} pour ${data.buildingId}`,
        );

        this.logger.log(
          `Building ${data.buildingId} upgraded to level ${data.targetLevel}`,
        );
      });

      // ✅ NEW: Update storage limit if Warehouse was upgraded
      if (data.buildingType === 'WAREHOUSE') {
        try {
          await this.resourcesService.updateStorageLimit(
            data.villageId,
            data.targetLevel,
          );
          this.logger.log(
            `Storage limit updated for village ${data.villageId} (Warehouse level ${data.targetLevel})`,
          );
        } catch (error) {
          this.logger.error(`Failed to update storage limit:`, error);
          // Don't throw - building is already upgraded
        }
      }

      // ✅ NEW: Emit resources.changed if production building or warehouse completed
      const productionBuildings = ['WOOD', 'STONE', 'IRON', 'WAREHOUSE'];
      if (productionBuildings.includes(data.buildingType)) {
        try {
          await this.outbox.resourcesChanged(data.villageId);
          this.logger.log(
            `✅ resources.changed event created for ${data.buildingType} completion`,
          );
        } catch (error) {
          this.logger.error(`Failed to emit resources.changed event:`, error);
          // Don't throw - building is already upgraded
        }
      }

      // ✅ NEW: Recalculate crown production rate after any building completion
      try {
        await this.crownsService.recalculateOnBuildingChange(data.villageId);
        this.logger.log(
          `✅ Crown production rate recalculated for village ${data.villageId}`,
        );
      } catch (error) {
        this.logger.error(`Failed to recalculate crown production:`, error);
        // Don't throw - building is already upgraded
      }
    } catch (error) {
      this.logger.error(
        `Failed to complete construction for ${data.buildingId}:`,
        error,
      );
      throw error; // pg-boss will retry
    }
  }
}
