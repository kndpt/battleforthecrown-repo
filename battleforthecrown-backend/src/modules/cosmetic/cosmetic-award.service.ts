import { Injectable } from '@nestjs/common';
import { resolveCosmeticAwards } from '@battleforthecrown/shared';
import type { CosmeticAwardResponse } from '@battleforthecrown/shared';
import { WorldConfigSchema } from '@battleforthecrown/shared/world';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PrismaClientOrTx } from '../../common/prisma.types';

/**
 * Permanent, account-global cosmetic championship titles (run 067).
 *
 * Awards are attributed at the LOCKED → ENDED transition, inside the same
 * Prisma transaction as the final ranking snapshot (run 061) — a world can
 * never become ENDED without its awards computed (failure ⇒ atomic rollback).
 * The award reads ONLY the freshly written `WorldFinalRankingSnapshot` rows, so
 * it inherits the snapshot's deterministic tie-breaking. Cosmetic only — never
 * a gameplay bonus (spec 24 § Rewards).
 */
@Injectable()
export class CosmeticAwardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Attribute the championship titles for a world that just reached ENDED.
   * Idempotent: a worker replay (pg-boss retry) hits the unique
   * `(userId, worldId, kind)` constraint and `skipDuplicates` makes it a no-op.
   *
   * @returns the number of awards created (0 if the world had no PvP and the
   *   only champion is POWER on an empty member set).
   */
  async awardChampionsForWorld(
    tx: PrismaClientOrTx,
    worldId: string,
    at: Date,
  ): Promise<number> {
    const rows = await tx.worldFinalRankingSnapshot.findMany({
      where: { worldId, rank: 1 },
      select: { userId: true, signal: true, rank: true, score: true },
    });

    const resolved = resolveCosmeticAwards(
      rows.map((row) => ({
        userId: row.userId,
        signal: row.signal,
        rank: row.rank,
        score: row.score,
      })),
    );
    if (resolved.length === 0) return 0;

    const worldDisplayName = await this.resolveWorldDisplayName(tx, worldId);

    const result = await tx.userWorldCosmeticAward.createMany({
      data: resolved.map((award) => ({
        userId: award.userId,
        worldId,
        kind: award.kind,
        worldDisplayName,
        awardedAt: at,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }

  /** Awards owned by a player, most recent first (profile sheet). */
  async getAwardsForUser(userId: string): Promise<CosmeticAwardResponse[]> {
    const awards = await this.prisma.userWorldCosmeticAward.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
      select: { kind: true, worldDisplayName: true, awardedAt: true },
    });

    return awards.map((award) => ({
      kind: award.kind,
      worldDisplayName: award.worldDisplayName,
      awardedAt: award.awardedAt.toISOString(),
    }));
  }

  /**
   * Snapshot the world's human-readable name at award time so the title stays
   * legible after the world is renamed or purged (run 065). Falls back to the
   * raw `world.name` if the config can't be parsed.
   */
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
    if (parsed.success) {
      return parsed.data.identity.displayName;
    }
    return world.name;
  }
}
