import { Injectable } from '@nestjs/common';
import { FinalRankingSignal, GloryLedger, RankingSignal } from '@prisma/client';
import {
  RANKING_SIGNAL_LABELS,
  applyPairDiminishingReturns,
  calculateOpponentMultiplier,
  calculateRawBattleValue,
  rankSnapshotEntries,
  type RankingSignal as PublicRankingSignal,
  type RankingsLeaderboardResponse,
} from '@battleforthecrown/shared/rankings';
import type { UnitMap } from '@battleforthecrown/shared/army';
import { MS_PER_DAY } from '@battleforthecrown/shared/time';
import {
  computeCycleBoundaries,
  currentCycleIndex,
} from '@battleforthecrown/shared/rankings';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PowerService } from '../power/power.service';
import type { PrismaClientOrTx } from '../../common/prisma.types';
import { createOutboxEvent } from '../event/event.utils';
import { resolveRankingsConfig } from './rankings-cycle.service';

const GLORY_WEEKLY_DAYS = 7;

interface CreditGloryInput {
  worldId: string;
  signal: RankingSignal;
  scorerUserId: string;
  opponentUserId: string;
  combatReportId: string;
  losses?: UnitMap;
  rawPoints?: number;
  scorerPowerSnapshot: number | null;
  opponentPowerSnapshot: number | null;
  occurredAt?: Date;
}

@Injectable()
export class RankingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly powerService: PowerService,
  ) {}

  async creditGlory(
    tx: PrismaClientOrTx,
    input: CreditGloryInput,
  ): Promise<GloryLedger | null> {
    if (input.scorerUserId === input.opponentUserId) return null;
    if (
      input.scorerPowerSnapshot === null ||
      input.opponentPowerSnapshot === null
    ) {
      return null;
    }

    const rawPoints = Math.max(
      0,
      Math.floor(
        input.rawPoints ?? calculateRawBattleValue(input.losses ?? {}),
      ),
    );
    if (rawPoints <= 0) return null;

    const occurredAt = input.occurredAt ?? new Date();
    const pairKey = this.toPairKey(input.scorerUserId, input.opponentUserId);
    const since = new Date(occurredAt.getTime() - MS_PER_DAY);
    const previous = await tx.gloryLedger.aggregate({
      where: {
        worldId: input.worldId,
        pairKey,
        occurredAt: { gte: since, lt: occurredAt },
      },
      _sum: { rawPoints: true },
    });
    const previousRaw = previous._sum.rawPoints ?? 0;
    const effectiveRawPoints = applyPairDiminishingReturns(
      rawPoints,
      previousRaw,
    );
    const opponentMultiplier = calculateOpponentMultiplier(
      input.scorerPowerSnapshot,
      input.opponentPowerSnapshot,
    );
    const points = Math.floor(effectiveRawPoints * opponentMultiplier);
    if (points <= 0) return null;

    const ledger = await tx.gloryLedger.create({
      data: {
        worldId: input.worldId,
        signal: input.signal,
        scorerUserId: input.scorerUserId,
        opponentUserId: input.opponentUserId,
        pairKey,
        combatReportId: input.combatReportId,
        rawPoints,
        pairRawPoints24hBefore: previousRaw,
        effectiveRawPoints,
        opponentMultiplier,
        points,
        occurredAt,
      },
    });
    await createOutboxEvent(tx, 'rankings.changed', input.worldId, {
      worldId: input.worldId,
      signal: input.signal,
      scorerUserId: input.scorerUserId,
      opponentUserId: input.opponentUserId,
      points,
      combatReportId: input.combatReportId,
      occurredAt: occurredAt.toISOString(),
    });
    return ledger;
  }

  async getRankingsSummary(
    worldId: string,
    limit = 20,
  ): Promise<{ leaderboards: RankingsLeaderboardResponse[] }> {
    const [
      power,
      assaultWeekly,
      rampartWeekly,
      assaultAllTime,
      rampartAllTime,
    ] = await Promise.all([
      this.getPowerLeaderboard(worldId, limit),
      this.getGloryLeaderboard(
        worldId,
        RankingSignal.ASSAULT_GLORY,
        'WEEKLY',
        limit,
      ),
      this.getGloryLeaderboard(
        worldId,
        RankingSignal.RAMPART_GLORY,
        'WEEKLY',
        limit,
      ),
      this.getGloryLeaderboard(
        worldId,
        RankingSignal.ASSAULT_GLORY,
        'ALL_TIME',
        limit,
      ),
      this.getGloryLeaderboard(
        worldId,
        RankingSignal.RAMPART_GLORY,
        'ALL_TIME',
        limit,
      ),
    ]);

    return {
      leaderboards: [
        power,
        assaultWeekly,
        rampartWeekly,
        assaultAllTime,
        rampartAllTime,
      ],
    };
  }

  async getPowerLeaderboard(
    worldId: string,
    limit = 20,
  ): Promise<RankingsLeaderboardResponse> {
    const rows = await this.powerService.getLeaderboard(
      'total',
      limit,
      worldId,
    );
    return {
      worldId,
      signal: 'POWER',
      period: 'LIVE',
      label: RANKING_SIGNAL_LABELS.POWER,
      entries: rows.map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        playerName: row.playerName,
        score: row.total,
        villageCount: row.villageCount,
      })),
    };
  }

  async getGloryLeaderboard(
    worldId: string,
    signal: RankingSignal,
    period: 'WEEKLY' | 'ALL_TIME',
    limit = 20,
  ): Promise<RankingsLeaderboardResponse> {
    // WEEKLY reads the current cycle window `[cycleStartAt, cycleEndAt)` (run
    // 068). During the pre-cycle (before the first reset boundary) it falls back
    // to a sliding 7-day cutoff so the board is never empty.
    const window =
      period === 'WEEKLY' ? await this.resolveWeeklyWindow(worldId) : null;
    const occurredAtFilter: { gte: Date; lt?: Date } | undefined =
      period !== 'WEEKLY'
        ? undefined
        : window
          ? { gte: window.start, lt: window.end }
          : { gte: this.getWeeklyCutoff() };
    const grouped = await this.prisma.gloryLedger.groupBy({
      by: ['scorerUserId'],
      where: {
        worldId,
        signal,
        ...(occurredAtFilter ? { occurredAt: occurredAtFilter } : {}),
      },
      _sum: { points: true },
      orderBy: { _sum: { points: 'desc' } },
      take: limit,
    });
    const displayNames = await this.loadDisplayNamesByUserIds(
      grouped.map((row) => row.scorerUserId),
    );
    return {
      worldId,
      signal,
      period,
      label:
        signal === RankingSignal.ASSAULT_GLORY
          ? RANKING_SIGNAL_LABELS.ASSAULT_GLORY
          : RANKING_SIGNAL_LABELS.RAMPART_GLORY,
      entries: grouped.map((row, index) => ({
        rank: index + 1,
        userId: row.scorerUserId,
        playerName: this.toPublicPlayerName(row.scorerUserId, displayNames),
        score: row._sum.points ?? 0,
      })),
    };
  }

  async getLeaderboard(
    worldId: string,
    signal: PublicRankingSignal,
    period: 'WEEKLY' | 'ALL_TIME',
    limit = 20,
  ): Promise<RankingsLeaderboardResponse> {
    if (signal === 'POWER') {
      return this.getPowerLeaderboard(worldId, limit);
    }
    return this.getGloryLeaderboard(
      worldId,
      signal === 'ASSAULT_GLORY'
        ? RankingSignal.ASSAULT_GLORY
        : RankingSignal.RAMPART_GLORY,
      period,
      limit,
    );
  }

  async snapshotFinalRankings(
    tx: PrismaClientOrTx,
    worldId: string,
    at: Date,
  ): Promise<number> {
    const members = await tx.worldMembership.findMany({
      where: { worldId },
      select: { userId: true },
    });
    if (members.length === 0) return 0;

    // POWER — un seul passage batch (évite le N+1 par membre dans la tx de
    // transition). getLeaderboard calcule la puissance de tous les villages du
    // monde en une requête ; les membres éliminés (0 village) absents du résultat
    // retombent à 0 via le fill ci-dessous.
    const powerRows = await this.powerService.getLeaderboard(
      'total',
      members.length,
      worldId,
      tx,
    );
    const powerMap = new Map(powerRows.map((row) => [row.userId, row.total]));
    const powerEntries = members.map(({ userId }) => ({
      userId,
      score: powerMap.get(userId) ?? 0,
    }));

    // GLORY — agrégation en une seule requête
    const grouped = await tx.gloryLedger.groupBy({
      by: ['scorerUserId', 'signal'],
      where: { worldId },
      _sum: { points: true },
    });

    const assaultMap = new Map<string, number>();
    const rampartMap = new Map<string, number>();
    for (const row of grouped) {
      const pts = row._sum.points ?? 0;
      if (row.signal === RankingSignal.ASSAULT_GLORY) {
        assaultMap.set(
          row.scorerUserId,
          (assaultMap.get(row.scorerUserId) ?? 0) + pts,
        );
      } else if (row.signal === RankingSignal.RAMPART_GLORY) {
        rampartMap.set(
          row.scorerUserId,
          (rampartMap.get(row.scorerUserId) ?? 0) + pts,
        );
      }
    }

    const assaultEntries = members.map(({ userId }) => ({
      userId,
      score: assaultMap.get(userId) ?? 0,
    }));
    const rampartEntries = members.map(({ userId }) => ({
      userId,
      score: rampartMap.get(userId) ?? 0,
    }));

    // Rank + build rows
    const rows = [
      ...rankSnapshotEntries(powerEntries).map((e) => ({
        worldId,
        userId: e.userId,
        signal: FinalRankingSignal.POWER,
        rank: e.rank,
        score: e.score,
        snapshotAt: at,
      })),
      ...rankSnapshotEntries(assaultEntries).map((e) => ({
        worldId,
        userId: e.userId,
        signal: FinalRankingSignal.ASSAULT_GLORY,
        rank: e.rank,
        score: e.score,
        snapshotAt: at,
      })),
      ...rankSnapshotEntries(rampartEntries).map((e) => ({
        worldId,
        userId: e.userId,
        signal: FinalRankingSignal.RAMPART_GLORY,
        rank: e.rank,
        score: e.score,
        snapshotAt: at,
      })),
    ];

    await tx.worldFinalRankingSnapshot.createMany({ data: rows });
    return members.length;
  }

  private toPairKey(left: string, right: string): string {
    return [left, right].sort().join(':');
  }

  private async loadDisplayNamesByUserIds(userIds: string[]) {
    if (userIds.length === 0) return new Map<string, string>();
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true },
    });
    return new Map(users.map((user) => [user.id, user.displayName]));
  }

  private toPublicPlayerName(
    userId: string,
    displayNames: ReadonlyMap<string, string>,
  ): string {
    return displayNames.get(userId) ?? `Joueur ${userId.slice(-6)}`;
  }

  private getWeeklyCutoff(): Date {
    return new Date(Date.now() - GLORY_WEEKLY_DAYS * MS_PER_DAY);
  }

  /**
   * Current weekly cycle window for a world, or `null` during the pre-cycle (the
   * caller then falls back to a sliding cutoff). Reads the world's reset config.
   */
  private async resolveWeeklyWindow(
    worldId: string,
  ): Promise<{ start: Date; end: Date } | null> {
    const world = await this.prisma.world.findUnique({
      where: { id: worldId },
      select: { createdAt: true, config: true },
    });
    if (!world) return null;
    const { reset } = resolveRankingsConfig(world.config);
    const index = currentCycleIndex(world.createdAt, new Date(), reset);
    if (index < 1) return null;
    const boundaries = computeCycleBoundaries(world.createdAt, index, reset);
    return { start: boundaries.cycleStartAt, end: boundaries.cycleEndAt };
  }
}
