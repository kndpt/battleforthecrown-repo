import { Injectable } from '@nestjs/common';
import { GloryLedger, RankingSignal } from '@prisma/client';
import {
  RANKING_SIGNAL_LABELS,
  applyPairDiminishingReturns,
  calculateOpponentMultiplier,
  calculateRawBattleValue,
  type RankingSignal as PublicRankingSignal,
  type RankingsLeaderboardResponse,
} from '@battleforthecrown/shared/rankings';
import type { UnitMap } from '@battleforthecrown/shared/army';
import { MS_PER_DAY } from '@battleforthecrown/shared/time';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PowerService } from '../power/power.service';
import type { PrismaClientOrTx } from '../../common/prisma.types';
import { createOutboxEvent } from '../event/event.utils';

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
    const since = period === 'WEEKLY' ? this.getWeeklyCutoff() : undefined;
    const grouped = await this.prisma.gloryLedger.groupBy({
      by: ['scorerUserId'],
      where: {
        worldId,
        signal,
        ...(since ? { occurredAt: { gte: since } } : {}),
      },
      _sum: { points: true },
      orderBy: { _sum: { points: 'desc' } },
      take: limit,
    });
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
        playerName: this.toPublicPlayerName(row.scorerUserId),
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

  private toPairKey(left: string, right: string): string {
    return [left, right].sort().join(':');
  }

  private toPublicPlayerName(userId: string): string {
    return `Joueur ${userId.slice(-6)}`;
  }

  private getWeeklyCutoff(): Date {
    return new Date(Date.now() - GLORY_WEEKLY_DAYS * MS_PER_DAY);
  }
}
