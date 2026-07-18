import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Expedition,
  ExpeditionKind,
  PendingConquestStatus,
} from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { IncomingAttackDto } from '@battleforthecrown/shared/events';
import type {
  DefenderCaptureDto,
  OpenConquestDto,
  OpenExpeditionDto,
} from '@battleforthecrown/shared/combat';
import { parseUnitMap } from './codecs';
import { parseCaravanResources } from './caravan.utils';

export interface GarrisonLineDto {
  villageId: string;
  hostVillageName: string | null;
  hostPlayerName: string | null;
  originVillageId: string;
  originVillageName: string | null;
  originPlayerName: string | null;
  direction: 'INCOMING' | 'OUTGOING';
  unitType: string;
  quantity: number;
}

type CaptureTierDto = OpenConquestDto['targetTier'];

/**
 * Read-only projections over expeditions, pending conquests, and garrisons for
 * the in-app combat surfaces. Split out of {@link CombatService} so the write
 * path (attack/scout/reinforce/caravan/recall orchestration) stays focused;
 * these methods perform no mutations and emit no Outbox events. Every entry
 * enforces ownership service-side and returns fog-of-war-safe DTOs.
 */
@Injectable()
export class ExpeditionQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveExpeditions(
    userId: string,
    villageId: string,
  ): Promise<Expedition[]> {
    // Verify ownership
    const village = await this.prisma.village.findFirst({
      where: { id: villageId, userId },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    return this.prisma.expedition.findMany({
      where: {
        attackerVillageId: villageId,
        status: { in: ['EN_ROUTE', 'RETURNING'] },
      },
      orderBy: { departAt: 'desc' },
    });
  }

  /**
   * In-app incoming-attack threats for a village the caller owns. Returns only
   * unresolved ATTACK expeditions still en route to this village, soonest
   * arrival first. The DTO is fog-of-war safe: it never exposes the attacking
   * army, the attacker identity, or the attack origin (see {@link IncomingAttackDto}).
   */
  async getIncomingAttacks(
    userId: string,
    villageId: string,
  ): Promise<IncomingAttackDto[]> {
    const village = await this.prisma.village.findFirst({
      where: { id: villageId, userId },
      select: { id: true, x: true, y: true },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const expeditions = await this.prisma.expedition.findMany({
      where: {
        targetRefId: villageId,
        kind: ExpeditionKind.ATTACK,
        status: 'EN_ROUTE',
        arrivalAt: { gt: new Date() },
      },
      select: { id: true, arrivalAt: true },
      orderBy: { arrivalAt: 'asc' },
    });

    return expeditions.map((expedition) => ({
      expeditionId: expedition.id,
      targetVillageId: village.id,
      targetX: village.x,
      targetY: village.y,
      arrivalAt: expedition.arrivalAt.toISOString(),
    }));
  }

  async getOpenConquests(
    userId: string,
    worldId?: string,
  ): Promise<OpenConquestDto[]> {
    const conquests = await this.prisma.pendingConquest.findMany({
      where: {
        attackerUserId: userId,
        status: PendingConquestStatus.OPEN,
        ...(worldId ? { worldId } : {}),
      },
      include: {
        attackerVillage: { select: { id: true, name: true } },
        targetVillage: {
          select: {
            buildings: {
              select: { level: true, type: true },
              where: { type: 'CASTLE' },
            },
            id: true,
            isBarbarian: true,
            name: true,
            tier: true,
            x: true,
            y: true,
          },
        },
      },
      orderBy: { captureUntil: 'asc' },
    });

    return conquests.map((conquest) => ({
      pendingConquestId: conquest.id,
      attackerVillageId: conquest.attackerVillageId,
      attackerVillageName: conquest.attackerVillage.name,
      targetVillageId: conquest.targetVillageId,
      targetName: conquest.targetVillage.name,
      targetX: conquest.targetVillage.x,
      targetY: conquest.targetVillage.y,
      targetKind: conquest.targetVillage.isBarbarian
        ? 'BARBARIAN_VILLAGE'
        : 'PLAYER_VILLAGE',
      targetCastleLevel: conquest.targetVillage.isBarbarian
        ? null
        : (conquest.targetVillage.buildings[0]?.level ?? 1),
      targetTier: this.toCaptureTier(conquest.targetVillage.tier),
      captureStartedAt: conquest.openedAt.toISOString(),
      captureUntil: conquest.captureUntil.toISOString(),
      status: 'OPEN',
    }));
  }

  /**
   * In-app defender view of the capture windows currently targeting villages
   * the caller owns (the mirror of {@link getOpenConquests} for the besieged
   * side). Ownership is enforced service-side by filtering on
   * `targetVillage.userId = userId`; there is no `@Public` surface. During an
   * OPEN window the target village still belongs to its original owner, so this
   * join naturally resolves the defender. Barbarian targets have no owner and
   * are never listed. The DTO is fog-of-war safe: it never exposes the attacker
   * identity/origin nor the occupation garrison (see {@link DefenderCaptureDto}).
   */
  async getCapturesTargetingMe(
    userId: string,
    worldId?: string,
  ): Promise<DefenderCaptureDto[]> {
    const conquests = await this.prisma.pendingConquest.findMany({
      where: {
        status: PendingConquestStatus.OPEN,
        targetVillage: { userId },
        ...(worldId ? { worldId } : {}),
      },
      include: {
        targetVillage: {
          select: {
            buildings: {
              select: { level: true, type: true },
              where: { type: 'CASTLE' },
            },
            id: true,
            name: true,
            x: true,
            y: true,
          },
        },
      },
      orderBy: { captureUntil: 'asc' },
    });

    return conquests.map((conquest) => ({
      pendingConquestId: conquest.id,
      targetVillageId: conquest.targetVillageId,
      targetName: conquest.targetVillage.name,
      targetX: conquest.targetVillage.x,
      targetY: conquest.targetVillage.y,
      targetCastleLevel: conquest.targetVillage.buildings[0]?.level ?? 1,
      captureStartedAt: conquest.openedAt.toISOString(),
      captureUntil: conquest.captureUntil.toISOString(),
      status: 'OPEN',
    }));
  }

  async getOpenExpeditions(
    userId: string,
    worldId?: string,
  ): Promise<OpenExpeditionDto[]> {
    const attackerVillages = await this.prisma.village.findMany({
      where: {
        userId,
        ...(worldId ? { worldId } : {}),
      },
      select: { id: true, name: true },
    });
    const attackerVillageById = new Map(
      attackerVillages.map((village) => [village.id, village]),
    );
    const attackerVillageIds = attackerVillages.map((village) => village.id);
    if (!attackerVillageIds.length) return [];

    const expeditions = await this.prisma.expedition.findMany({
      where: {
        attackerVillageId: { in: attackerVillageIds },
        status: { in: ['EN_ROUTE', 'RETURNING'] },
        ...(worldId ? { worldId } : {}),
      },
    });
    const targetIds = [
      ...new Set(expeditions.map((expedition) => expedition.targetRefId)),
    ];
    const targets = targetIds.length
      ? await this.prisma.village.findMany({
          where: { id: { in: targetIds } },
          select: { id: true, name: true },
        })
      : [];
    const targetById = new Map(targets.map((target) => [target.id, target]));

    return expeditions
      .map((expedition) => {
        const attackerVillage = attackerVillageById.get(
          expedition.attackerVillageId,
        );
        const target = targetById.get(expedition.targetRefId);
        const units = parseUnitMap(expedition.units, 'expedition.units');

        return {
          expeditionId: expedition.id,
          kind: expedition.kind,
          isConquest: (units.NOBLE ?? 0) > 0,
          attackerVillageId: expedition.attackerVillageId,
          attackerVillageName: attackerVillage?.name ?? '',
          targetVillageId: target?.id ?? null,
          targetName: target?.name ?? null,
          targetX: expedition.targetX,
          targetY: expedition.targetY,
          targetKind: expedition.targetKind,
          departAt: expedition.departAt.toISOString(),
          arrivalAt: expedition.arrivalAt.toISOString(),
          returnAt: expedition.returnAt?.toISOString() ?? null,
          status: expedition.status,
          recalled: expedition.recalled,
          resources:
            expedition.kind === ExpeditionKind.CARAVAN && expedition.loot
              ? parseCaravanResources(expedition)
              : undefined,
        };
      })
      .sort((left, right) => {
        const leftDue =
          left.status === 'RETURNING' && left.returnAt
            ? left.returnAt
            : left.arrivalAt;
        const rightDue =
          right.status === 'RETURNING' && right.returnAt
            ? right.returnAt
            : right.arrivalAt;

        return leftDue.localeCompare(rightDue);
      });
  }

  async getGarrison(
    userId: string,
    villageId: string,
  ): Promise<GarrisonLineDto[]> {
    const village = await this.prisma.village.findFirst({
      where: { id: villageId, userId },
      select: { id: true },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const garrisons = await this.prisma.garrison.findMany({
      where: {
        quantity: { gt: 0 },
        OR: [
          { villageId },
          { originVillageId: villageId, villageId: { not: villageId } },
        ],
      },
      select: {
        villageId: true,
        originVillageId: true,
        unitType: true,
        quantity: true,
      },
      orderBy: [
        { villageId: 'asc' },
        { originVillageId: 'asc' },
        { unitType: 'asc' },
      ],
    });

    const villageIds = [
      ...new Set(
        garrisons.flatMap((garrison) => [
          garrison.villageId,
          garrison.originVillageId,
        ]),
      ),
    ];
    const villages = villageIds.length
      ? await this.prisma.village.findMany({
          where: { id: { in: villageIds } },
          select: {
            id: true,
            name: true,
            user: { select: { displayName: true } },
          },
        })
      : [];
    const villageNames = new Map(
      villages.map((village) => [village.id, village.name]),
    );
    const playerNames = new Map(
      villages.map((village) => [
        village.id,
        village.user?.displayName ?? null,
      ]),
    );

    return garrisons.map((garrison) => ({
      villageId: garrison.villageId,
      hostVillageName: villageNames.get(garrison.villageId) ?? null,
      hostPlayerName: playerNames.get(garrison.villageId) ?? null,
      originVillageId: garrison.originVillageId,
      originVillageName: villageNames.get(garrison.originVillageId) ?? null,
      originPlayerName: playerNames.get(garrison.originVillageId) ?? null,
      direction: garrison.villageId === villageId ? 'INCOMING' : 'OUTGOING',
      unitType: garrison.unitType,
      quantity: garrison.quantity,
    }));
  }

  private toCaptureTier(tier: string | null): CaptureTierDto {
    if (
      tier === 'T1' ||
      tier === 'T2' ||
      tier === 'T3' ||
      tier === 'T4' ||
      tier === 'T5'
    ) {
      return tier;
    }

    return null;
  }
}
