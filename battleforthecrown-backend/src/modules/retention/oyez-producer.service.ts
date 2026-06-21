import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WorldConfigSchema } from '@battleforthecrown/shared/world';
import type { OyezTheme } from '@battleforthecrown/shared/retention';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OYEZ_CATALOGUE, selectOyezForDay } from './retention-oyez';
import { getParisDailyKey } from './retention.utils';

const MS_PER_HOUR = 60 * 60 * 1000;

export interface OyezProductionResult {
  created: boolean;
  theme?: OyezTheme;
  reason?: 'not-open' | 'disabled' | 'no-oyez-today' | 'already-active';
}

@Injectable()
export class OyezProducerService {
  private readonly logger = new Logger(OyezProducerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotently produces the Oyez of the day for one world. No-op when the
   * world is not OPEN, Oyez is disabled, the deterministic scheduler does not
   * fire today, or an Oyez is already active. The DB unique index
   * `(world_id, day_key)` is the final guard against concurrent producers.
   */
  async produceForWorld(
    worldId: string,
    now: Date = new Date(),
  ): Promise<OyezProductionResult> {
    const world = await this.prisma.world.findUnique({
      where: { id: worldId },
      select: { id: true, status: true, config: true },
    });
    if (!world || world.status !== 'OPEN') {
      return { created: false, reason: 'not-open' };
    }

    const parsed = WorldConfigSchema.safeParse(world.config);
    if (!parsed.success) {
      this.logger.warn(
        `World ${worldId} has an invalid config, skipping Oyez production`,
      );
      return { created: false, reason: 'disabled' };
    }
    const oyezConfig = parsed.data.oyez;
    if (!oyezConfig.enabled) {
      return { created: false, reason: 'disabled' };
    }

    const dayKey = getParisDailyKey(now);
    const theme = selectOyezForDay(worldId, dayKey, oyezConfig.weeklyCadence);
    if (!theme) {
      return { created: false, reason: 'no-oyez-today' };
    }

    const entry = OYEZ_CATALOGUE[theme];
    const endsAt = new Date(
      now.getTime() + oyezConfig.defaultDurationHours * MS_PER_HOUR,
    );

    return this.prisma.$transaction(async (tx) => {
      const active = await tx.dailyOyez.findFirst({
        where: { worldId, startsAt: { lte: now }, endsAt: { gt: now } },
        select: { id: true },
      });
      if (active) {
        return { created: false, reason: 'already-active' as const };
      }

      try {
        await tx.dailyOyez.create({
          data: {
            worldId,
            dayKey,
            theme,
            title: entry.title,
            description: entry.description,
            startsAt: now,
            endsAt,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return { created: false, reason: 'already-active' as const };
        }
        throw error;
      }

      this.logger.log(
        `Oyez produced for world ${worldId}: ${theme} (${dayKey})`,
      );
      return { created: true, theme };
    });
  }

  /** Produces the Oyez of the day for every OPEN world. */
  async produceForOpenWorlds(now: Date = new Date()): Promise<number> {
    const worlds = await this.prisma.world.findMany({
      where: { status: 'OPEN' },
      select: { id: true },
    });
    let created = 0;
    for (const world of worlds) {
      const result = await this.produceForWorld(world.id, now);
      if (result.created) created += 1;
    }
    if (created > 0) {
      this.logger.log(`Oyez producer created ${created} Oyez`);
    }
    return created;
  }
}
