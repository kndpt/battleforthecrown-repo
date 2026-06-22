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
  type BuildingType,
} from '@battleforthecrown/shared/village';

interface ConstructionJob {
  buildingId: string;
  villageId: string;
  buildingType: string;
  targetLevel: number;
}

// Buildings whose completion changes resource production OR storage capacity.
// Used to gate the `resources.changed` event after a successful upgrade.
const PRODUCTION_RECOMPUTE_BUILDINGS: ReadonlySet<BuildingType> = new Set([
  BUILDING_TYPES.WOOD,
  BUILDING_TYPES.STONE,
  BUILDING_TYPES.IRON,
  BUILDING_TYPES.WAREHOUSE,
]);

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

    const completed = await this.applyCompletionInTransaction(data, receivedAt);
    if (!completed) {
      // Worker exited early (building gone, cancelled, or already at target):
      // post-tx side effects must not run. updateStorageLimit in particular
      // would write the future level into resourceStock.maxPerType.
      return;
    }

    await this.runPostCompletionSideEffects(data);
  }

  private async applyCompletionInTransaction(
    data: ConstructionJob,
    receivedAt: number,
  ): Promise<boolean> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const building = await tx.building.findUnique({
          where: { id: data.buildingId },
          include: {
            village: { select: { userId: true, worldId: true } },
          },
        });

        if (!building) {
          this.logger.warn(`Building ${data.buildingId} not found, skipping`);
          return false;
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

        if (!building.endTime) {
          this.logger.log(
            `Building ${data.buildingId} was cancelled, skipping`,
          );
          return false;
        }

        if (building.level >= data.targetLevel) {
          this.logger.log(
            `Building ${data.buildingId} already at level ${building.level}, skipping`,
          );
          return false;
        }

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
        return true;
      });
    } catch (error) {
      this.logger.error(
        `Failed to complete construction for ${data.buildingId}:`,
        error,
      );
      throw error; // pg-boss will retry
    }
  }

  private async runPostCompletionSideEffects(
    data: ConstructionJob,
  ): Promise<void> {
    // Each effect is isolated: the building upgrade is already committed and
    // we never want to retry the whole job (it would re-emit
    // `building.completed`). Failures surface as structured logs.
    if (data.buildingType === BUILDING_TYPES.WAREHOUSE) {
      await this.runIsolatedSideEffect('updateStorageLimit', data, () =>
        this.resourcesService.updateStorageLimit(
          data.villageId,
          data.targetLevel,
        ),
      );
    }

    if (PRODUCTION_RECOMPUTE_BUILDINGS.has(data.buildingType as BuildingType)) {
      await this.runIsolatedSideEffect('resourcesChanged', data, () =>
        this.outbox.resourcesChanged(data.villageId),
      );
    }

    await this.runIsolatedSideEffect('recalculateOnBuildingChange', data, () =>
      this.crownsService.recalculateOnBuildingChange(data.villageId),
    );
  }

  private async runIsolatedSideEffect(
    op: string,
    data: ConstructionJob,
    fn: () => Promise<unknown>,
  ): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.error(
        `Post-completion side-effect "${op}" failed for building ${data.buildingId}`,
        {
          op,
          buildingId: data.buildingId,
          villageId: data.villageId,
          buildingType: data.buildingType,
          targetLevel: data.targetLevel,
          error:
            error instanceof Error
              ? (error.stack ?? error.message)
              : String(error),
        },
      );
    }
  }
}
