import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, RankingSignal } from '@prisma/client';
import {
  computeCycleBoundaries,
  currentCycleIndex,
  formatRankingCycleTitleLabel,
  latestDueCycleIndex,
  resolveCycleChampions,
  type CycleResetConfig,
  type RankingCycleCurrent,
  type RankingCycleSnapshotEntry,
  type RankingCyclesCurrentResponse,
  type RankingTitlesResponse,
} from '@battleforthecrown/shared/rankings';
import {
  DEFAULT_WORLD_RANKINGS_CONFIG,
  WorldConfigSchema,
} from '@battleforthecrown/shared/world';
import { MS_PER_DAY } from '@battleforthecrown/shared/time';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { PrismaClientOrTx } from '../../common/prisma.types';
import { createOutboxEvent } from '../event/event.utils';

const GLORY_SIGNALS: RankingSignal[] = [
  RankingSignal.ASSAULT_GLORY,
  RankingSignal.RAMPART_GLORY,
];

/** Reset config + snapshot size resolved from a world's (possibly partial) config. */
export function resolveRankingsConfig(config: unknown): {
  reset: CycleResetConfig;
  snapshotEntries: number;
} {
  const parsed = WorldConfigSchema.safeParse(config);
  const rankings = parsed.success
    ? parsed.data.rankings
    : DEFAULT_WORLD_RANKINGS_CONFIG;
  return {
    reset: {
      resetDayUtc: rankings.weeklyCycleResetDayUtc,
      resetHourUtc: rankings.weeklyCycleResetHourUtc,
    },
    snapshotEntries: rankings.snapshotEntriesPerCycle,
  };
}

interface WindowEntry {
  userId: string;
  displayName: string;
  score: number;
  rank: number;
}

/**
 * Weekly Glory cycle closing + temporary title attribution (run 068).
 *
 * `closeDueCycles` runs hourly (see RankingsCycleWorker): for each OPEN/LOCKED
 * world × Glory signal it snapshots every cycle whose window has fully elapsed
 * and has no snapshot yet, awarding the rank-1 champions a temporary title in
 * the same transaction. Idempotent via the `(worldId, signal, cycleIndex)`
 * unique constraint — a replayed tick is a silent no-op.
 */
@Injectable()
export class RankingsCycleService {
  private readonly logger = new Logger(RankingsCycleService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Close every due, not-yet-snapshotted cycle across all live worlds. */
  async closeDueCycles(now = new Date()): Promise<number> {
    const worlds = await this.prisma.world.findMany({
      where: { status: { in: ['OPEN', 'LOCKED'] } },
      select: { id: true, createdAt: true, config: true },
    });

    let closed = 0;
    for (const world of worlds) {
      const { reset, snapshotEntries } = resolveRankingsConfig(world.config);
      const latestDue = latestDueCycleIndex(world.createdAt, now, reset);
      if (latestDue < 1) continue;

      for (const signal of GLORY_SIGNALS) {
        const lastIndex = await this.lastSnapshottedIndex(world.id, signal);
        // Catch up every missed cycle in one tick (downtime-resilient): close
        // each index from the first unsnapshotted one up to the latest due.
        for (let idx = lastIndex + 1; idx <= latestDue; idx++) {
          const didClose = await this.closeCycle(
            world.id,
            world.createdAt,
            reset,
            snapshotEntries,
            signal,
            idx,
            now,
          );
          if (didClose) closed++;
        }
      }
    }

    if (closed > 0) {
      this.logger.log(`Closed ${closed} weekly Glory cycle(s)`);
    }
    return closed;
  }

  /** Current cycle + last closed snapshot per Glory signal (banner endpoint). */
  async getCurrentCycles(
    worldId: string,
    now = new Date(),
  ): Promise<RankingCyclesCurrentResponse> {
    const world = await this.prisma.world.findUnique({
      where: { id: worldId },
      select: { createdAt: true, config: true },
    });
    if (!world) throw new NotFoundException('World not found');
    const { reset } = resolveRankingsConfig(world.config);

    const cycles = await Promise.all(
      GLORY_SIGNALS.map((signal) =>
        this.buildCurrentCycle(worldId, world.createdAt, reset, signal, now),
      ),
    );

    return { worldId, cycles };
  }

  /** Active + historical temporary titles owned by a player (profile sheet). */
  async getTitlesForUser(
    userId: string,
    now = new Date(),
  ): Promise<RankingTitlesResponse> {
    const titles = await this.prisma.rankingCycleTitleAward.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
    });

    return titles.map((title) => {
      const signal = title.signal;
      return {
        id: title.id,
        signal,
        cycleIndex: title.cycleIndex,
        worldId: title.worldId,
        worldDisplayName: title.worldDisplayName,
        label: formatRankingCycleTitleLabel(
          signal,
          title.cycleIndex,
          title.worldDisplayName,
        ),
        cycleEndAt: title.cycleEndAt.toISOString(),
        validUntilAt: title.validUntilAt.toISOString(),
        awardedAt: title.awardedAt.toISOString(),
        active: title.validUntilAt.getTime() > now.getTime(),
      };
    });
  }

  private async buildCurrentCycle(
    worldId: string,
    worldCreatedAt: Date,
    reset: CycleResetConfig,
    signal: RankingSignal,
    now: Date,
  ): Promise<RankingCycleCurrent> {
    const index = currentCycleIndex(worldCreatedAt, now, reset);

    // Index 0 = pre-cycle: surface the upcoming cycle 1 boundaries and use a
    // sliding 7d leader so the banner is never empty before the first Monday.
    const boundaries = computeCycleBoundaries(
      worldCreatedAt,
      Math.max(index, 1),
      reset,
    );
    const leaderWindowStart =
      index >= 1
        ? boundaries.cycleStartAt
        : new Date(now.getTime() - 7 * MS_PER_DAY);
    const leaderWindowEnd = index >= 1 ? boundaries.cycleEndAt : now;

    const top = await this.readWindow(
      this.prisma,
      worldId,
      signal,
      leaderWindowStart,
      leaderWindowEnd,
      1,
    );
    const leader = top[0] ?? null;

    const last = await this.prisma.gloryCycleSnapshot.findFirst({
      where: { worldId, signal },
      orderBy: { cycleIndex: 'desc' },
    });

    return {
      signal: signal,
      cycleIndex: index,
      cycleStartAt: boundaries.cycleStartAt.toISOString(),
      cycleEndAt: boundaries.cycleEndAt.toISOString(),
      leaderUserId: leader?.userId ?? null,
      leaderName: leader?.displayName ?? null,
      lastClosedSnapshot: last
        ? {
            cycleIndex: last.cycleIndex,
            cycleEndAt: last.cycleEndAt.toISOString(),
            topEntries: this.parseSnapshotEntries(last.entries).slice(0, 3),
          }
        : null,
    };
  }

  private async closeCycle(
    worldId: string,
    worldCreatedAt: Date,
    reset: CycleResetConfig,
    snapshotEntries: number,
    signal: RankingSignal,
    cycleIndex: number,
    now: Date,
  ): Promise<boolean> {
    const boundaries = computeCycleBoundaries(
      worldCreatedAt,
      cycleIndex,
      reset,
    );
    // The title earned this cycle stays "active" through the *next* cycle.
    const validUntilAt = computeCycleBoundaries(
      worldCreatedAt,
      cycleIndex + 1,
      reset,
    ).cycleEndAt;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const entries = await this.readWindow(
          tx,
          worldId,
          signal,
          boundaries.cycleStartAt,
          boundaries.cycleEndAt,
          snapshotEntries,
        );

        await tx.gloryCycleSnapshot.create({
          data: {
            worldId,
            signal,
            cycleIndex,
            cycleStartAt: boundaries.cycleStartAt,
            cycleEndAt: boundaries.cycleEndAt,
            closedAt: now,
            entries: entries as unknown as Prisma.InputJsonValue,
          },
        });

        const championIds = resolveCycleChampions(entries);
        if (championIds.length > 0) {
          const worldDisplayName = await this.resolveWorldDisplayName(
            tx,
            worldId,
          );
          await tx.rankingCycleTitleAward.createMany({
            data: championIds.map((userId) => ({
              userId,
              worldId,
              signal,
              cycleIndex,
              worldDisplayName,
              cycleEndAt: boundaries.cycleEndAt,
              validUntilAt,
              awardedAt: now,
            })),
            skipDuplicates: true,
          });
        }

        await createOutboxEvent(tx, 'rankings.cycle.closed', worldId, {
          worldId,
          signal: signal,
          cycleIndex,
          cycleEndAt: boundaries.cycleEndAt.toISOString(),
        });

        return true;
      });
    } catch (error) {
      // Concurrent worker already closed this exact cycle → silent no-op.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }

  private async lastSnapshottedIndex(
    worldId: string,
    signal: RankingSignal,
  ): Promise<number> {
    const last = await this.prisma.gloryCycleSnapshot.findFirst({
      where: { worldId, signal },
      orderBy: { cycleIndex: 'desc' },
      select: { cycleIndex: true },
    });
    return last?.cycleIndex ?? 0;
  }

  private async readWindow(
    db: PrismaClientOrTx,
    worldId: string,
    signal: RankingSignal,
    start: Date,
    end: Date,
    limit: number,
  ): Promise<WindowEntry[]> {
    const grouped = await db.gloryLedger.groupBy({
      by: ['scorerUserId'],
      where: { worldId, signal, occurredAt: { gte: start, lt: end } },
      _sum: { points: true },
      orderBy: { _sum: { points: 'desc' } },
      take: limit,
    });
    const names = await this.loadDisplayNames(
      db,
      grouped.map((row) => row.scorerUserId),
    );
    return grouped.map((row, index) => ({
      userId: row.scorerUserId,
      displayName:
        names.get(row.scorerUserId) ?? `Joueur ${row.scorerUserId.slice(-6)}`,
      score: row._sum.points ?? 0,
      rank: index + 1,
    }));
  }

  private async loadDisplayNames(
    db: PrismaClientOrTx,
    userIds: string[],
  ): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true },
    });
    return new Map(users.map((user) => [user.id, user.displayName]));
  }

  private async resolveWorldDisplayName(
    tx: PrismaClientOrTx,
    worldId: string,
  ): Promise<string> {
    const world = await tx.world.findUnique({
      where: { id: worldId },
      select: { name: true, config: true },
    });
    if (!world) return worldId;
    const parsed = WorldConfigSchema.safeParse(world.config);
    return parsed.success ? parsed.data.identity.displayName : world.name;
  }

  private parseSnapshotEntries(value: unknown): RankingCycleSnapshotEntry[] {
    if (!Array.isArray(value)) return [];
    return value as RankingCycleSnapshotEntry[];
  }
}
