import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { World, WorldStatus } from '@prisma/client';
import PgBoss from 'pg-boss';
import { PrismaService } from '../infra/prisma/prisma.service';
import { registerScheduledQueueWorker } from '../infra/pg-boss/queue-worker.helper';
import { createOutboxEvent } from '../modules/event/event.utils';
import { RankingsService } from '../modules/rankings/rankings.service';
import { RenownService } from '../modules/renown/renown.service';
import {
  WorldConfigSchema,
  resolveWorldLifecycleConfig,
} from '@battleforthecrown/shared/world';
import { MS_PER_DAY } from '@battleforthecrown/shared/time';
const WORLD_LIFECYCLE_QUEUE = 'world:lifecycle';
const WORLD_LIFECYCLE_CRON = '*/5 * * * *';

@Injectable()
export class WorldLifecycleWorker implements OnModuleInit {
  private readonly logger = new Logger(WorldLifecycleWorker.name);

  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly prisma: PrismaService,
    private readonly rankings: RankingsService,
    private readonly renown: RenownService,
  ) {}

  async onModuleInit() {
    await registerScheduledQueueWorker(
      this.boss,
      this.logger,
      {
        queueName: WORLD_LIFECYCLE_QUEUE,
        cron: WORLD_LIFECYCLE_CRON,
        tz: 'UTC',
        displayName: 'World lifecycle',
      },
      () => this.handleLifecycleTick(),
    );
  }

  async handleLifecycleTick(now = new Date()): Promise<{
    plannedToOpen: number;
    openToLocked: number;
    lockedToEnded: number;
  }> {
    const plannedToOpen = await this.openPlannedWorlds(now);
    const openToLocked = await this.lockExpiredRegistrationWindows(now);
    const lockedToEnded = await this.endExpiredWorlds(now);

    if (plannedToOpen + openToLocked + lockedToEnded > 0) {
      this.logger.log(
        `World lifecycle transitions: plannedToOpen=${plannedToOpen}, openToLocked=${openToLocked}, lockedToEnded=${lockedToEnded}`,
      );
    }

    return { plannedToOpen, openToLocked, lockedToEnded };
  }

  private async openPlannedWorlds(now: Date): Promise<number> {
    const worlds = await this.prisma.world.findMany({
      where: {
        status: 'PLANNED',
        plannedOpenAt: { lte: now },
      },
      orderBy: { plannedOpenAt: 'asc' },
    });

    let transitions = 0;
    for (const world of worlds) {
      const lifecycle = this.getLifecycle(world);
      const startedAt = now;
      const endsAt = addDays(startedAt, lifecycle.worldDuration);
      transitions += await this.transitionWorld(world.id, 'PLANNED', 'OPEN', {
        startedAt,
        endsAt,
        at: now,
      });
    }
    return transitions;
  }

  private async lockExpiredRegistrationWindows(now: Date): Promise<number> {
    const worlds = await this.prisma.world.findMany({
      where: {
        status: 'OPEN',
        startedAt: { not: null },
      },
      orderBy: { startedAt: 'asc' },
    });

    let transitions = 0;
    for (const world of worlds) {
      if (!world.startedAt) continue;

      const lifecycle = this.getLifecycle(world);
      const lockAt = addDays(
        world.startedAt,
        lifecycle.inscriptionMainDays + lifecycle.inscriptionLateDays,
      );
      if (lockAt > now) continue;

      transitions += await this.transitionWorld(world.id, 'OPEN', 'LOCKED', {
        at: now,
      });
    }
    return transitions;
  }

  private async endExpiredWorlds(now: Date): Promise<number> {
    const worlds = await this.prisma.world.findMany({
      where: {
        status: 'LOCKED',
        endsAt: { lte: now },
      },
      orderBy: { endsAt: 'asc' },
    });

    let transitions = 0;
    for (const world of worlds) {
      transitions += await this.transitionWorld(world.id, 'LOCKED', 'ENDED', {
        at: now,
      });
    }
    return transitions;
  }

  private async transitionWorld(
    worldId: string,
    from: WorldStatus,
    to: WorldStatus,
    params: { at: Date; startedAt?: Date; endsAt?: Date },
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.world.updateMany({
        where: { id: worldId, status: from },
        data: {
          status: to,
          startedAt: params.startedAt,
          endsAt: params.endsAt,
          plannedOpenAt: to === 'OPEN' ? null : undefined,
        },
      });

      if (updated.count !== 1) {
        return 0;
      }

      await createOutboxEvent(tx, 'world.status.changed', worldId, {
        worldId,
        from,
        to,
        at: params.at.toISOString(),
      });

      // Snapshot final des 3 classements dans la MÊME transaction que la
      // transition : un monde ne peut jamais devenir ENDED sans son snapshot
      // (échec ⇒ rollback atomique). Source des cosmétiques permanents (run 067)
      // et de l'UI lecture seule (run 066).
      if (to === 'ENDED') {
        await this.rankings.snapshotFinalRankings(tx, worldId, params.at);
        await this.renown.creditRankingBonuses(tx, worldId);
      }

      return 1;
    });
  }

  private getLifecycle(world: Pick<World, 'id' | 'config'>) {
    const parsed = WorldConfigSchema.safeParse(world.config);
    if (!parsed.success) {
      throw new Error(
        `World ${world.id} has an invalid config: ${parsed.error.message}`,
      );
    }
    return resolveWorldLifecycleConfig(parsed.data.lifecycle);
  }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}
