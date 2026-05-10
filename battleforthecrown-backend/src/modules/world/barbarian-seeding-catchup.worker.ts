import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from './world-config.service';
import { BarbarianSeedingService } from './barbarian-seeding.service';
import { MS_PER_HOUR } from '@battleforthecrown/shared/time';

@Injectable()
export class BarbarianSeedingCatchupWorker {
  private readonly logger = new Logger(BarbarianSeedingCatchupWorker.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
    private readonly seeding: BarbarianSeedingService,
  ) {}

  /**
   * Catchup worker — runs every day at midnight UTC.
   *
   * When a player joins a world, `/world/:worldId/join` seeds the 4 nearest
   * chunks synchronously (MAX_SYNC_CHUNKS=4). This cron catches up the chunks
   * that the sync pass did not cover: it looks for player villages created in
   * the last hour and calls `BarbarianSeedingService.seedAroundVillage` (which
   * is idempotent via `ChunkSpawnState`) on up to 3 villages per world.
   *
   * No EventOutbox write on purpose — frontends pick up new BVs via
   * `useWorldEntitiesQuery`'s 30s refetch interval. Documented under
   * "Exceptions au pattern Outbox" in `docs/architecture/realtime.md`.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSeedingCatchup() {
    if (this.isRunning) {
      this.logger.debug('Seeding catchup already running, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.log('Starting barbarian seeding catchup cycle');

      // Get all open worlds
      const worlds = await this.prisma.world.findMany({
        where: {
          status: 'OPEN',
        },
      });

      for (const world of worlds) {
        try {
          await this.catchupSeedingForWorld(world.id);
        } catch (err) {
          this.logger.error(
            `Seeding catchup failed for world ${world.id}`,
            err,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Seeding catchup cycle completed in ${duration}ms for ${worlds.length} worlds`,
      );
    } catch (err) {
      this.logger.error('Seeding catchup cycle failed', err);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Catchup seeding for a single world: finds player villages created in the
   * last hour and seeds the surrounding chunks that the sync pass may have
   * missed (idempotent via ChunkSpawnState).
   */
  private async catchupSeedingForWorld(worldId: string) {
    const config = await this.worldConfig.getConfig(worldId);
    const seedingConfig = config.barbarianSeeding;

    if (!seedingConfig?.enabled) {
      return;
    }

    // Find recently created player villages (within last hour)
    const recentVillages = await this.prisma.village.findMany({
      where: {
        worldId,
        createdAt: {
          gte: new Date(Date.now() - MS_PER_HOUR),
        },
      },
      select: { x: true, y: true },
    });

    if (recentVillages.length === 0) {
      return;
    }

    let totalCreated = 0;

    // Process a few villages (avoid overload)
    const maxVillagesToProcess = 3;
    for (
      let i = 0;
      i < Math.min(maxVillagesToProcess, recentVillages.length);
      i++
    ) {
      const village = recentVillages[i];

      try {
        // Seed around this village (will be idempotent)
        const result = await this.seeding['seedAroundVillage']({
          worldId,
          villageX: village.x,
          villageY: village.y,
        });

        totalCreated += result.created;
      } catch (err) {
        this.logger.error(
          `Seeding catchup failed for village at (${village.x}, ${village.y})`,
          err,
        );
      }
    }

    if (totalCreated > 0) {
      this.logger.log(
        `Seeding catchup created ${totalCreated} BVs in world ${worldId} around ${Math.min(maxVillagesToProcess, recentVillages.length)} villages`,
      );
    }
  }
}
