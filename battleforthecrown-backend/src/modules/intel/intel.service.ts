import { Injectable } from '@nestjs/common';
import type {
  VillageIntelDto,
  IntelSourceKind,
} from '@battleforthecrown/shared/world';
import type { UnitMap } from '@battleforthecrown/shared/army';
import type { VillageStrategyType } from '@battleforthecrown/shared/village';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { OwnershipService } from '../../common/auth/ownership.service';

export interface RecordIntelInput {
  userId: string;
  worldId: string;
  targetVillageId: string;
  sourceKind: IntelSourceKind;
  sourceReportId: string;
  units: UnitMap;
  resources: { wood: number; stone: number; iron: number };
  wallLevel: number | null;
  strategy: VillageStrategyType | null;
  targetName: string | null;
  targetX: number;
  targetY: number;
  targetTier: string | null;
  seenAt: Date;
}

@Injectable()
export class IntelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxPublisher,
    private readonly ownership: OwnershipService,
  ) {}

  async getIntel(
    userId: string,
    worldId: string,
    villageId: string,
  ): Promise<VillageIntelDto | null> {
    await this.ownership.assertWorldMember(worldId, userId);

    const row = await this.prisma.villageIntel.findUnique({
      where: {
        userId_worldId_targetVillageId: {
          userId,
          worldId,
          targetVillageId: villageId,
        },
      },
    });

    if (!row) return null;

    return {
      targetVillageId: row.targetVillageId,
      worldId: row.worldId,
      sourceKind: row.sourceKind,
      sourceReportId: row.sourceReportId,
      units: row.units as UnitMap,
      resources: row.resources as { wood: number; stone: number; iron: number },
      wallLevel: row.wallLevel,
      strategy: row.strategy,
      targetName: row.targetName,
      targetX: row.targetX,
      targetY: row.targetY,
      targetTier: row.targetTier,
      seenAt: row.seenAt.toISOString(),
    };
  }

  async recordIntel(
    tx: PrismaClientOrTx,
    input: RecordIntelInput,
  ): Promise<void> {
    const {
      userId,
      worldId,
      targetVillageId,
      sourceKind,
      sourceReportId,
      units,
      resources,
      wallLevel,
      strategy,
      targetName,
      targetX,
      targetY,
      targetTier,
      seenAt,
    } = input;

    // Garde temporelle : un job retardé/rejoué (pg-boss) ne doit pas faire
    // régresser une observation plus récente déjà enregistrée. On ne bloque que
    // le strictement plus ancien — l'égalité reste idempotente et la sémantique
    // par-champ « si révélé » ci-dessous préserve déjà les valeurs riches.
    const existing = await tx.villageIntel.findUnique({
      where: {
        userId_worldId_targetVillageId: { userId, worldId, targetVillageId },
      },
      select: { seenAt: true },
    });
    if (existing && new Date(seenAt).getTime() < existing.seenAt.getTime()) {
      return;
    }

    await tx.villageIntel.upsert({
      where: {
        userId_worldId_targetVillageId: { userId, worldId, targetVillageId },
      },
      create: {
        userId,
        worldId,
        targetVillageId,
        sourceKind,
        sourceReportId,
        units,
        resources,
        wallLevel,
        strategy,
        targetName,
        targetX,
        targetY,
        targetTier,
        seenAt,
      },
      // Per-field "last known" semantics (docs/gameplay/11-scouting.md: each
      // field is the last value "si révélé"). A source that does not reveal a
      // field (null) must NOT erase a richer value from a previous source —
      // e.g. a combat win (no wall/style) must keep the scout's wall/style.
      update: {
        sourceKind,
        sourceReportId,
        units,
        resources,
        ...(wallLevel !== null ? { wallLevel } : {}),
        ...(strategy !== null ? { strategy } : {}),
        ...(targetName !== null ? { targetName } : {}),
        ...(targetTier !== null ? { targetTier } : {}),
        targetX,
        targetY,
        seenAt,
      },
    });

    await this.outbox.intelUpdated(
      {
        userId: input.userId,
        worldId: input.worldId,
        villageId: input.targetVillageId,
      },
      tx,
    );
  }
}
