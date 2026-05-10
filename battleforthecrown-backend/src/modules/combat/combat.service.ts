import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WorldConfigService } from '../world/world-config.service';
import { VisionService } from '../world/vision.service';
import { calculateDistance } from '@battleforthecrown/shared/logic';
import type { AttackCommandDto } from './dto/attack-command.schema';
import type { ReinforceCommandDto } from './dto/reinforce-command.schema';
import type { RecallCommandDto } from './dto/recall-command.schema';
import { ExpeditionKind } from '@prisma/client';
import { encodeUnitMap } from './codecs';
import PgBoss from 'pg-boss';
import { createOutboxEvent } from '../event/event.utils';
import { PrismaClientOrTx } from '../../common/prisma.types';

export interface GarrisonLineDto {
  villageId: string;
  hostVillageName: string | null;
  originVillageId: string;
  originVillageName: string | null;
  direction: 'INCOMING' | 'OUTGOING';
  unitType: string;
  quantity: number;
}

@Injectable()
export class CombatService {
  private readonly logger = new Logger(CombatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
    private readonly visionService: VisionService,
    @Inject('PG_BOSS') private readonly boss: PgBoss,
  ) {}

  async initiateAttack(userId: string, dto: AttackCommandDto) {
    this.logger.log(`Attack initiated by user ${userId}`, { dto });

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify ownership and get village
      const village = await tx.village.findFirst({
        where: { id: dto.villageId, userId },
      });

      if (!village) {
        throw new NotFoundException('Village not found or not owned');
      }

      const worldId = village.worldId;

      // 2. Verify target exists
      let targetRefId: string;
      let targetX: number;
      let targetY: number;

      if (dto.targetKind === 'BARBARIAN_VILLAGE') {
        // Phase 2: Barbarian villages are now in Village table with isBarbarian=true
        const barbarian = await tx.village.findUnique({
          where: { id: dto.targetRefId },
        });
        if (!barbarian || !barbarian.isBarbarian) {
          throw new BadRequestException('Barbarian village not found');
        }
        targetRefId = barbarian.id;
        targetX = barbarian.x;
        targetY = barbarian.y;
      } else {
        const targetVillage = await tx.village.findUnique({
          where: { id: dto.targetRefId },
        });
        if (!targetVillage || targetVillage.worldId !== worldId) {
          throw new BadRequestException('Target village not found');
        }
        targetRefId = targetVillage.id;
        targetX = targetVillage.x;
        targetY = targetVillage.y;
      }

      // 3. Enforce fog of war: a target seen as a blip cannot be attacked.
      // Cf. ADR-11 + docs/gameplay/01-overview.md ("Blip non-cliquable").
      const config = await this.worldConfig.getConfig(worldId);
      if (config.fogOfWar?.enabled) {
        const disks = await this.visionService.getVisionDisks(userId, worldId);
        if (!this.visionService.isInVision({ x: targetX, y: targetY }, disks)) {
          throw new ForbiddenException(
            'Target is outside your vision — extend your watchtower to attack.',
          );
        }
      }

      // 4. Verify and deduct units
      await this.verifyAndDeductUnits(tx, dto.villageId, dto.units);

      // 5. Calculate timing
      const { arrivalAt, now } = await this.calculateExpeditionTiming(
        tx,
        worldId,
        village.x,
        village.y,
        targetX,
        targetY,
        dto.units,
        dto.villageId,
      );

      // 6. Create expedition
      const expedition = await tx.expedition.create({
        data: {
          worldId,
          attackerVillageId: dto.villageId,
          kind: ExpeditionKind.ATTACK,
          targetKind: dto.targetKind,
          targetRefId,
          targetX,
          targetY,
          units: encodeUnitMap(dto.units),
          status: 'EN_ROUTE',
          departAt: now,
          arrivalAt,
        },
      });

      // 7. Create event
      await createOutboxEvent(tx, 'battle.sent', dto.villageId, {
        expeditionId: expedition.id,
        villageId: dto.villageId,
        targetX,
        targetY,
        targetKind: dto.targetKind,
        arrivalAt: arrivalAt.toISOString(),
      });

      // 8. Schedule combat resolution worker
      await this.boss.send(
        'combat:resolve',
        { expeditionId: expedition.id },
        {
          startAfter: arrivalAt,
          singletonKey: `combat:${expedition.id}`,
        },
      );

      this.logger.log(
        `Attack expedition created: ${expedition.id}, arrives at ${arrivalAt.toISOString()}`,
      );

      return expedition;
    });
  }

  async initiateReinforce(userId: string, dto: ReinforceCommandDto) {
    this.logger.log(`Reinforcement initiated by user ${userId}`, { dto });

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify ownership of origin village
      const village = await tx.village.findFirst({
        where: { id: dto.villageId, userId },
      });

      if (!village) {
        throw new NotFoundException('Origin village not found or not owned');
      }

      const worldId = village.worldId;

      // 2. Verify target village exists
      const targetVillage = await tx.village.findUnique({
        where: { id: dto.targetVillageId },
      });

      if (!targetVillage || targetVillage.worldId !== worldId) {
        throw new BadRequestException('Target village not found');
      }

      // 3. For MVP inter-villages, target must be owned by the user
      // Note: Architecture supports other players, but business rule limits it here.
      if (targetVillage.userId !== userId) {
        throw new ForbiddenException(
          'You can only reinforce your own villages for now',
        );
      }

      // 4. Verify and deduct units
      await this.verifyAndDeductUnits(tx, dto.villageId, dto.units);

      // 5. Calculate timing
      const { arrivalAt, now } = await this.calculateExpeditionTiming(
        tx,
        worldId,
        village.x,
        village.y,
        targetVillage.x,
        targetVillage.y,
        dto.units,
        dto.villageId,
      );
      // 6. Create expedition
      const expedition = await tx.expedition.create({
        data: {
          worldId,
          attackerVillageId: dto.villageId,
          kind: ExpeditionKind.REINFORCE,
          reinforcementOriginVillageId: dto.villageId,
          targetKind: 'PLAYER_VILLAGE',
          targetRefId: targetVillage.id,
          targetX: targetVillage.x,
          targetY: targetVillage.y,
          units: encodeUnitMap(dto.units),
          status: 'EN_ROUTE',
          departAt: now,
          arrivalAt,
        },
      });

      // 7. Create event
      await createOutboxEvent(tx, 'reinforcement.sent', dto.villageId, {
        expeditionId: expedition.id,
        villageId: dto.villageId,
        targetVillageId: targetVillage.id,
        arrivalAt: arrivalAt.toISOString(),
      });

      // 8. Schedule worker (same as combat:resolve, will handle REINFORCE)
      await this.boss.send(
        'combat:resolve',
        { expeditionId: expedition.id },
        {
          startAfter: arrivalAt,
          singletonKey: `combat:${expedition.id}`,
        },
      );

      this.logger.log(
        `Reinforcement expedition created: ${expedition.id}, arrives at ${arrivalAt.toISOString()}`,
      );

      return expedition;
    });
  }

  async initiateRecall(userId: string, dto: RecallCommandDto) {
    this.logger.log(`Recall initiated by user ${userId}`, { dto });

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify ownership of destination village (A)
      const originVillage = await tx.village.findFirst({
        where: { id: dto.originVillageId, userId },
      });

      if (!originVillage) {
        throw new NotFoundException(
          'Origin village (destination) not found or not owned',
        );
      }

      const worldId = originVillage.worldId;

      // 2. Verify current village (B) exists
      const currentVillage = await tx.village.findUnique({
        where: { id: dto.villageId },
      });

      if (!currentVillage || currentVillage.worldId !== worldId) {
        throw new BadRequestException('Current village not found');
      }

      // 3. Verify units in Garrison
      const garrisons = await tx.garrison.findMany({
        where: {
          villageId: dto.villageId,
          originVillageId: dto.originVillageId,
        },
      });

      const availableUnits = Object.fromEntries(
        garrisons.map((g) => [g.unitType, g.quantity]),
      );

      for (const [unitType, quantity] of Object.entries(dto.units)) {
        if (quantity === undefined || quantity <= 0) continue;
        if ((availableUnits[unitType] || 0) < quantity) {
          throw new BadRequestException(
            `Insufficient ${unitType} in garrison: have ${availableUnits[unitType] || 0}, need ${quantity}`,
          );
        }
      }

      // 4. Deduct units from Garrison
      for (const [unitType, quantity] of Object.entries(dto.units)) {
        if (quantity === undefined || quantity <= 0) continue;
        await tx.garrison.update({
          where: {
            villageId_originVillageId_unitType: {
              villageId: dto.villageId,
              originVillageId: dto.originVillageId,
              unitType,
            },
          },
          data: {
            quantity: { decrement: quantity },
          },
        });
      }

      // 5. Calculate timing
      // Re-calculate timing with origin village strategy
      const { arrivalAt: arrivalAtOrigin, now } =
        await this.calculateExpeditionTiming(
          tx,
          worldId,
          currentVillage.x,
          currentVillage.y,
          originVillage.x,
          originVillage.y,
          dto.units,
          dto.originVillageId, // Strategy of origin follows the troupe
        );

      // 6. Create expedition
      const expedition = await tx.expedition.create({
        data: {
          worldId,
          attackerVillageId: dto.villageId, // From B
          kind: ExpeditionKind.REINFORCE,
          reinforcementOriginVillageId: dto.originVillageId, // To A (Home)
          targetKind: 'PLAYER_VILLAGE',
          targetRefId: originVillage.id,
          targetX: originVillage.x,
          targetY: originVillage.y,
          units: encodeUnitMap(dto.units),
          status: 'EN_ROUTE',
          departAt: now,
          arrivalAt: arrivalAtOrigin,
        },
      });

      // 7. Create event
      await createOutboxEvent(tx, 'reinforcement.recalled', dto.villageId, {
        expeditionId: expedition.id,
        villageId: dto.villageId,
        originVillageId: dto.originVillageId,
        arrivalAt: arrivalAtOrigin.toISOString(),
      });

      // 8. Schedule worker
      await this.boss.send(
        'combat:resolve',
        { expeditionId: expedition.id },
        {
          startAfter: arrivalAtOrigin,
          singletonKey: `combat:${expedition.id}`,
        },
      );

      this.logger.log(
        `Recall expedition created: ${expedition.id}, arrives at ${arrivalAtOrigin.toISOString()}`,
      );

      return expedition;
    });
  }

  async recallEnRoute(userId: string, expeditionId: string) {
    this.logger.log(
      `Recall en-route requested for expedition ${expeditionId} by user ${userId}`,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Get expedition
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
      });

      if (!expedition) {
        throw new NotFoundException('Expedition not found');
      }

      // 2. Verify ownership (attacker village must be owned by user)
      const village = await tx.village.findFirst({
        where: { id: expedition.attackerVillageId, userId },
      });

      if (!village) {
        throw new ForbiddenException(
          'You do not own the origin village of this expedition',
        );
      }

      // 3. Verify status
      if (expedition.status !== 'EN_ROUTE') {
        throw new BadRequestException(
          `Expedition cannot be recalled (status: ${expedition.status})`,
        );
      }

      // 4. Verify timing (cannot recall if already arrived, even if worker hasn't run yet)
      const now = new Date();
      if (now >= expedition.arrivalAt) {
        throw new BadRequestException(
          'Expedition has already arrived at target',
        );
      }

      // 5. Calculate return time (time elapsed since departure)
      const elapsedMs = now.getTime() - expedition.departAt.getTime();
      const returnAt = new Date(now.getTime() + elapsedMs);

      // 6. Update expedition
      const updated = await tx.expedition.update({
        where: { id: expeditionId },
        data: {
          status: 'RETURNING',
          recalled: true,
          returnAt,
        },
      });

      // 7. Attempt to cancel combat resolution job
      // Fallback: the job will still trigger but handleCombatResolution
      // will skip it because the status is no longer EN_ROUTE.
      // PgBoss.cancel requires a jobId, which we don't store.
      // We rely on the status guard in the worker.

      // 8. Create event
      await createOutboxEvent(
        tx,
        'expedition.recalled',
        expedition.attackerVillageId,
        {
          expeditionId: expedition.id,
          villageId: expedition.attackerVillageId,
          returnAt: returnAt.toISOString(),
        },
      );

      this.logger.log(
        `Expedition ${expeditionId} recalled, returns at ${returnAt.toISOString()}`,
      );

      return updated;
    });

    // 9. Schedule return job (OUTSIDE transaction to avoid race condition with worker)
    if (result.returnAt) {
      await this.boss.send(
        'combat:return',
        { expeditionId: expeditionId },
        {
          startAfter: result.returnAt,
          singletonKey: `return:${expeditionId}`,
        },
      );
    }

    return result;
  }

  private async verifyAndDeductUnits(
    tx: PrismaClientOrTx,
    villageId: string,
    units: Record<string, number>,
  ) {
    const unitInventories = await tx.unitInventory.findMany({
      where: { villageId },
    });

    const availableUnits = Object.fromEntries(
      unitInventories.map((inv) => [inv.unitType, inv.quantity]),
    );

    for (const [unitType, qty] of Object.entries(units)) {
      const quantity = qty;
      if (quantity === undefined || quantity <= 0) continue;
      if ((availableUnits[unitType] || 0) < quantity) {
        throw new BadRequestException(
          `Insufficient ${unitType}: have ${availableUnits[unitType] || 0}, need ${quantity}`,
        );
      }
    }

    for (const [unitType, qty] of Object.entries(units)) {
      const quantity = qty;
      if (quantity === undefined || quantity <= 0) continue;
      await tx.unitInventory.update({
        where: {
          villageId_unitType: {
            villageId,
            unitType,
          },
        },
        data: {
          quantity: { decrement: quantity },
        },
      });
    }
  }

  private async calculateExpeditionTiming(
    tx: PrismaClientOrTx,
    worldId: string,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    units: Record<string, number>,
    originVillageId: string,
  ) {
    const distance = calculateDistance(startX, startY, targetX, targetY);

    const travelTimeMs = await this.worldConfig.getTravelTimeForArmy(
      worldId,
      distance,
      units,
      (
        await tx.villageStrategyConfig.findUnique({
          where: { villageId: originVillageId },
        })
      )?.strategy,
    );

    const now = new Date();
    const arrivalAt = new Date(now.getTime() + travelTimeMs);

    return { travelTimeMs, arrivalAt, now };
  }

  async getActiveExpeditions(userId: string, villageId: string) {
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
          select: { id: true, name: true },
        })
      : [];
    const villageNames = new Map(
      villages.map((village) => [village.id, village.name]),
    );

    return garrisons.map((garrison) => ({
      villageId: garrison.villageId,
      hostVillageName: villageNames.get(garrison.villageId) ?? null,
      originVillageId: garrison.originVillageId,
      originVillageName: villageNames.get(garrison.originVillageId) ?? null,
      direction: garrison.villageId === villageId ? 'INCOMING' : 'OUTGOING',
      unitType: garrison.unitType,
      quantity: garrison.quantity,
    }));
  }

  async getAllReports(userId: string) {
    const reports = await this.prisma.combatReport.findMany({
      where: {
        OR: [{ attackerUserId: userId }, { defenderUserId: userId }],
      },
      orderBy: { timestamp: 'desc' },
    });

    return reports.map((report) => ({
      ...report,
      isAttacker: report.attackerUserId === userId,
    }));
  }

  async getReport(userId: string, reportId: string) {
    const report = await this.prisma.combatReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Verify user is attacker or defender
    if (report.attackerUserId !== userId && report.defenderUserId !== userId) {
      throw new BadRequestException('Not authorized to view this report');
    }

    return {
      ...report,
      isAttacker: report.attackerUserId === userId,
    };
  }

  async deleteReport(userId: string, reportId: string) {
    const report = await this.prisma.combatReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.attackerUserId !== userId && report.defenderUserId !== userId) {
      throw new BadRequestException('Not authorized to delete this report');
    }

    await this.prisma.combatReport.delete({ where: { id: reportId } });

    return { message: 'Report deleted successfully' };
  }

  async markReportAsRead(userId: string, reportId: string) {
    const report = await this.prisma.combatReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Verify user is attacker or defender
    if (report.attackerUserId !== userId && report.defenderUserId !== userId) {
      throw new BadRequestException('Not authorized to modify this report');
    }

    const updated = await this.prisma.combatReport.update({
      where: { id: reportId },
      data: { isRead: true },
    });

    return {
      ...updated,
      isAttacker: updated.attackerUserId === userId,
    };
  }
}
