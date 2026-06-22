import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { ResourcesService } from '../modules/resources/resources.service';
import { CrownsService } from '../modules/crowns/crowns.service';
import { OutboxPublisher } from '../modules/event/outbox-publisher.service';
import { registerJobQueueWorker } from '../infra/pg-boss/queue-worker.helper';
import PgBoss from 'pg-boss';
import {
  BUILDING_TYPES,
  getQuarterPopulationLimit,
} from '@battleforthecrown/shared/village';

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
    await registerJobQueueWorker<ConstructionJob>(
      this.boss,
      this.logger,
      {
        queueName: 'construction:end',
        displayName: 'Construction',
        // Aggressive polling: building completion is user-facing and 1s latency
        // matches the Outbox cadence so the WS event lands without extra delay.
        workOptions: { pollingIntervalSeconds: 1, batchSize: 1 },
      },
      (data) => this.handleConstructionComplete(data),
    );
  }

  private async handleConstructionComplete(data: ConstructionJob) {
    const receivedAt = Date.now();
    this.logger.log(`Construction job received: ${data.buildingId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Get building and verify it exists
        const building = await tx.building.findUnique({
          where: { id: data.buildingId },
          include: {
            village: { select: { userId: true, worldId: true } },
          },
        });

        if (!building) {
          this.logger.warn(`Building ${data.buildingId} not found, skipping`);
          return;
        }

        const now = Date.now();
        const expectedEndTime = building.endTime?.getTime() || 0;
        const delta = now - expectedEndTime;

        this.logger.log(`Construction timing analysis:`, {
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
        const completedBuilding = await tx.building.update({
          where: { id: data.buildingId },
          data: {
            level: data.targetLevel,
            startTime: null,
            endTime: null,
          },
        });

        if (completedBuilding.type === BUILDING_TYPES.QUARTER) {
          await tx.population.update({
            where: { villageId: completedBuilding.villageId },
            data: { max: getQuarterPopulationLimit(completedBuilding.level) },
          });
        }

        // Create event in outbox for WebSocket notification
        await this.outbox.buildingCompleted(
          {
            buildingId: data.buildingId,
            villageId: data.villageId,
            buildingType: data.buildingType,
            level: data.targetLevel,
            // Capture immuable : attribue la Renommée au propriétaire au
            // moment de la complétion, pas à l'état courant au dispatch
            // (le village peut être conquis dans la fenêtre Outbox ~1s).
            ownerId: building.village.userId,
            worldId: building.village.worldId,
          },
          tx,
        );

        this.logger.log(
          `Building ${data.buildingId} upgraded to level ${data.targetLevel}`,
        );
      });

      // Update storage limit if Warehouse was upgraded
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

      // Emit resources.changed if production building or warehouse completed
      const productionBuildings = ['WOOD', 'STONE', 'IRON', 'WAREHOUSE'];
      if (productionBuildings.includes(data.buildingType)) {
        try {
          await this.outbox.resourcesChanged(data.villageId);
          this.logger.log(
            `resources.changed event created for ${data.buildingType} completion`,
          );
        } catch (error) {
          this.logger.error(`Failed to emit resources.changed event:`, error);
          // Don't throw - building is already upgraded
        }
      }

      // Recalculate crown production rate after any building completion
      try {
        await this.crownsService.recalculateOnBuildingChange(data.villageId);
        this.logger.log(
          `Crown production rate recalculated for village ${data.villageId}`,
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
