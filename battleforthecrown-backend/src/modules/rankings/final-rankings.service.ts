import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FinalRankingSignal } from '@prisma/client';
import {
  RANKING_SIGNAL_LABELS,
  type WorldFinalRankingLeaderboard,
  type WorldFinalRankingsResponse,
} from '@battleforthecrown/shared/rankings';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  loadUserDisplayNames,
  resolvePublicPlayerName,
} from '../../common/display-names';

/**
 * Read-only consultation of a world's frozen final leaderboards (Hall of fame),
 * persisted at the LOCKED → ENDED transition by run 061
 * (`RankingsService.snapshotFinalRankings`). Split out of `RankingsService` to
 * keep that service under the God-service threshold and to isolate the public
 * read path from the live-scoring write path.
 */
@Injectable()
export class FinalRankingsService {
  private readonly logger = new Logger(FinalRankingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Contract:
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

    const displayNames = await loadUserDisplayNames(
      this.prisma,
      snapshots.map((row) => row.userId),
    );

    const signalOrder: FinalRankingSignal[] = [
      FinalRankingSignal.POWER,
      FinalRankingSignal.ASSAULT_GLORY,
      FinalRankingSignal.RAMPART_GLORY,
    ];
    const leaderboards: WorldFinalRankingLeaderboard[] = signalOrder.map(
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
            playerName: resolvePublicPlayerName(row.userId, displayNames),
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
}
