import { Injectable } from '@nestjs/common';
import { RenownSource } from '@prisma/client';
import {
  renownCombatXp,
  renownConstructionXp,
  renownConquestXp,
  renownRankingBonus,
  renownStatusForXp,
  type RenownStatus,
} from '@battleforthecrown/shared';
import type {
  BuildingCompletedPayload,
  VillageConqueredPayload,
} from '@battleforthecrown/shared/events';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { PrismaClientOrTx } from '../../common/prisma.types';

@Injectable()
export class RenownService {
  constructor(private readonly prisma: PrismaService) {}

  private async creditInTx(
    tx: PrismaClientOrTx,
    input: {
      userId: string;
      source: RenownSource;
      xp: number;
      worldId: string | null;
      dedupKey: string;
    },
  ): Promise<boolean> {
    if (input.xp <= 0) return false;

    const res = await tx.renownLedger.createMany({
      data: [input],
      skipDuplicates: true,
    });

    if (res.count > 0) {
      await tx.user.update({
        where: { id: input.userId },
        data: { renownXp: { increment: input.xp } },
      });
      return true;
    }

    return false;
  }

  /**
   * Point d'entrée pour les events Outbox live (appelé en pass 2).
   * Gère `building.completed` et `village.conquered`, ignore le reste.
   */
  async recordOutboxEvent(
    eventId: string,
    kind: string,
    payload: unknown,
  ): Promise<void> {
    if (kind === 'building.completed') {
      const p = payload as BuildingCompletedPayload;
      // Propriétaire/monde capturés à la complétion (immuables) → attribution
      // correcte même si le village est conquis avant le dispatch Outbox.
      const ownerId = p.ownerId;
      if (!ownerId) return;

      const xp = renownConstructionXp(p.buildingType, p.level);
      await this.prisma.$transaction((tx) =>
        this.creditInTx(tx, {
          userId: ownerId,
          source: RenownSource.CONSTRUCTION,
          xp,
          worldId: p.worldId,
          dedupKey: `outbox:${eventId}`,
        }),
      );
      return;
    }

    if (kind === 'village.conquered') {
      const p = payload as VillageConqueredPayload;
      // MVP : un village sans propriétaire précédent est considéré barbare.
      // En production, les villages barbares ont previousOwnerId === null.
      const isBarbarian = p.previousOwnerId === null;
      const xp = renownConquestXp(isBarbarian);

      const v = await this.prisma.village.findUnique({
        where: { id: p.villageId },
        select: { worldId: true },
      });

      await this.prisma.$transaction((tx) =>
        this.creditInTx(tx, {
          userId: p.newOwnerId,
          source: RenownSource.CONQUEST,
          xp,
          worldId: v?.worldId ?? null,
          dedupKey: `outbox:${eventId}`,
        }),
      );
      return;
    }

    // Kind non géré en pass 1 — ignoré intentionnellement.
  }

  /**
   * Appelé en pass 2 dans la transaction combat (même tx que GloryLedger).
   * NE PAS ouvrir de nouvelle transaction : utilise le `tx` reçu.
   */
  async creditCombat(
    tx: PrismaClientOrTx,
    input: {
      userId: string;
      opponentUserId: string;
      gloryPoints: number;
      combatReportId: string;
      signal: string;
      worldId: string;
    },
  ): Promise<void> {
    const xp = renownCombatXp(input.gloryPoints);
    // dedupKey aligné 1:1 sur la clé unique de GloryLedger
    // (combatReportId, signal, scorerUserId, opponentUserId) : un même scorer
    // peut marquer contre plusieurs adversaires dans un seul rapport (renforts
    // défensifs) → une ligne de Renommée par ligne de Gloire.
    await this.creditInTx(tx, {
      userId: input.userId,
      source: RenownSource.COMBAT,
      xp,
      worldId: input.worldId,
      dedupKey: `combat:${input.combatReportId}:${input.signal}:${input.userId}:${input.opponentUserId}`,
    });
  }

  /**
   * Appelé en pass 2 dans la transaction de transition LOCKED→ENDED.
   * NE PAS ouvrir de nouvelle transaction : utilise le `tx` reçu.
   */
  async creditRankingBonuses(
    tx: PrismaClientOrTx,
    worldId: string,
  ): Promise<void> {
    const snapshots = await tx.worldFinalRankingSnapshot.findMany({
      where: { worldId },
      select: { userId: true, signal: true, rank: true },
    });
    if (snapshots.length === 0) return;

    const entries = snapshots
      .map((row) => ({
        userId: row.userId,
        source: RenownSource.RANKING_BONUS,
        xp: renownRankingBonus(row.rank),
        worldId,
        dedupKey: `ranking:${worldId}:${row.signal}:${row.userId}`,
      }))
      .filter((entry) => entry.xp > 0);
    if (entries.length === 0) return;

    // Crédit batché (vs N+1 par snapshot) — aligné sur le voisin
    // snapshotFinalRankings appelé dans la même tx LOCKED→ENDED.
    // Idempotence : on ne crédite que les entrées absentes du ledger.
    //
    // Concurrence : le pré-filtre `fresh` puis l'incrément depuis `fresh` sont
    // sûrs car cette méthode est structurellement sérialisée par monde — la
    // transition LOCKED→ENDED est gardée par `updateMany({where:{status:from}})`
    // (world-lifecycle.worker.ts) qui ne laisse passer qu'une seule tx (count===1).
    // Deux transitions concurrentes du même monde sont donc impossibles ; le
    // skipDuplicates reste un backstop pour les rejeux d'une transition échouée.
    const existing = await tx.renownLedger.findMany({
      where: { dedupKey: { in: entries.map((entry) => entry.dedupKey) } },
      select: { dedupKey: true },
    });
    const existingKeys = new Set(existing.map((row) => row.dedupKey));
    const fresh = entries.filter((entry) => !existingKeys.has(entry.dedupKey));
    if (fresh.length === 0) return;

    // 1 insert batch (skipDuplicates en backstop concurrence).
    await tx.renownLedger.createMany({ data: fresh, skipDuplicates: true });

    // 1 update par joueur affecté (l'incrément XP est intrinsèquement
    // par-row User ; on agrège les signaux d'un même joueur).
    const xpByUser = new Map<string, number>();
    for (const entry of fresh) {
      xpByUser.set(entry.userId, (xpByUser.get(entry.userId) ?? 0) + entry.xp);
    }
    for (const [userId, xp] of xpByUser) {
      await tx.user.update({
        where: { id: userId },
        data: { renownXp: { increment: xp } },
      });
    }
  }

  async getStatus(userId: string): Promise<RenownStatus> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { renownXp: true },
    });
    return renownStatusForXp(u?.renownXp ?? 0);
  }
}
