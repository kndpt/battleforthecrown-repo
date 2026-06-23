import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FinalRankingSignal, GloryLedger, RankingSignal } from '@prisma/client';
import {
  RANKING_SIGNAL_LABELS,
  applyPairDiminishingReturns,
  calculateOpponentMultiplier,
  calculateRawBattleValue,
  rankSnapshotEntries,
  type RankingSignal as PublicRankingSignal,
  type RankingsLeaderboardResponse,
  type WorldFinalRankingsResponse,
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
  private readonly logger = new Logger(RankingsService.name);

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

  /**
   * Reads the frozen end-of-world leaderboards persisted at the LOCKED → ENDED
   * transition (run 061 `snapshotFinalRankings`). Contract:
   * - 404 when the world is not ENDED yet (snapshot legitimately absent).
   * - 409 when the world IS ENDED but no snapshot exists (invariant break —
   *   061 writes it in the same tx as the transition, so this is corruption).
   */
  async getFinalRankings(worldId: string): Promise<WorldFinalRankingsResponse> {
    const world = await this.prisma.world.findUnique({
      where: { id: worldId },
      select: { status: true },
    });
    if (!world) {
      throw new NotFoundException(`World ${worldId} not found`);
    }
    if (world.status !== 'ENDED') {
      throw new NotFoundException('FINAL_RANKINGS_NOT_AVAILABLE');
    }

    const snapshots = await this.prisma.worldFinalRankingSnapshot.findMany({
      where: { worldId },
      orderBy: [{ signal: 'asc' }, { rank: 'asc' }],
    });
    if (snapshots.length === 0) {
      this.logger.warn(
        `World ${worldId} is ENDED but has no final ranking snapshot`,
      );
      throw new ConflictException('FINAL_RANKINGS_MISSING');
    }

    const displayNames = await this.loadDisplayNamesByUserIds(
      snapshots.map((row) => row.userId),
    );

    const signalOrder: FinalRankingSignal[] = [
      FinalRankingSignal.POWER,
      FinalRankingSignal.ASSAULT_GLORY,
      FinalRankingSignal.RAMPART_GLORY,
    ];
    const leaderboards: RankingsLeaderboardResponse[] = signalOrder.map(
      (signal) => ({
        worldId,
        signal,
        period: 'FINAL',
        label: RANKING_SIGNAL_LABELS[signal],
        entries: snapshots
          .filter((row) => row.signal === signal)
          .map((row) => ({
            rank: row.rank,
            userId: row.userId,
            playerName: this.toPublicPlayerName(row.userId, displayNames),
            score: row.score,
          })),
      }),
    );

    return {
      worldId,
      snapshotAt: snapshots[0].snapshotAt.toISOString(),
      leaderboards,
    };
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
}
