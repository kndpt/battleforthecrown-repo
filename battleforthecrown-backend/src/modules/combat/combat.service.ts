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
import { UNIT_TYPES } from '@battleforthecrown/shared/army';
import type {
  OpenConquestDto,
  OpenExpeditionDto,
} from '@battleforthecrown/shared/combat';
import type { AttackCommandDto } from './dto/attack-command.schema';
import type { ReinforceCommandDto } from './dto/reinforce-command.schema';
import type { RecallCommandDto } from './dto/recall-command.schema';
import type { ScoutCommandDto } from './dto/scout-command.schema';
import { ExpeditionKind, PendingConquestStatus } from '@prisma/client';
import { encodeUnitMap, parseUnitMap } from './codecs';
import PgBoss from 'pg-boss';
import { createOutboxEvent } from '../event/event.utils';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { OwnershipService } from '../../common/auth';

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

@Injectable()
export class CombatService {
  private readonly logger = new Logger(CombatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly worldConfig: WorldConfigService,
    private readonly visionService: VisionService,
    private readonly ownership: OwnershipService,
    @Inject('PG_BOSS') private readonly boss: PgBoss,
  ) {}

  async initiateAttack(userId: string, dto: AttackCommandDto) {
    this.logger.debug(`Attack initiated by user ${userId}`, { dto });

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify ownership and get village
      const village = await this.loadOwnedVillage(tx, dto.villageId, userId);

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
      await this.assertTargetInVision(
        userId,
        worldId,
        { x: targetX, y: targetY },
        'attack',
      );

      // 4. Verify and deduct units
      await this.verifyAndDeductUnits(tx, dto.villageId, dto.units);

      // 5. Calculate timing
      const { travelTimeMs, arrivalAt, now } =
        await this.calculateExpeditionTiming(
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
          outboundTravelMs: travelTimeMs,
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
      await this.scheduleResolution(expedition.id, arrivalAt);

      this.logger.log(
        `Attack expedition created: ${expedition.id}, arrives at ${arrivalAt.toISOString()}`,
      );

      return expedition;
    });
  }

  async initiateScout(userId: string, dto: ScoutCommandDto) {
    this.logger.debug(`Scout initiated by user ${userId}`, { dto });

    return this.prisma.$transaction(async (tx) => {
      const village = await this.loadOwnedVillage(tx, dto.villageId, userId);

      this.assertScoutUnitsOnly(dto.units);

      const worldId = village.worldId;
      const target = await this.resolveTargetVillage(tx, worldId, dto);

      await this.assertTargetInVision(
        userId,
        worldId,
        { x: target.x, y: target.y },
        'scout',
      );

      await this.verifyAndDeductUnits(tx, dto.villageId, dto.units);

      const { travelTimeMs, arrivalAt, now } =
        await this.calculateExpeditionTiming(
          tx,
          worldId,
          village.x,
          village.y,
          target.x,
          target.y,
          dto.units,
          dto.villageId,
        );

      const expedition = await tx.expedition.create({
        data: {
          worldId,
          attackerVillageId: dto.villageId,
          kind: ExpeditionKind.SCOUT,
          targetKind: dto.targetKind,
          targetRefId: target.id,
          targetX: target.x,
          targetY: target.y,
          units: encodeUnitMap(dto.units),
          status: 'EN_ROUTE',
          departAt: now,
          arrivalAt,
          outboundTravelMs: travelTimeMs,
        },
      });

      await createOutboxEvent(tx, 'scout.sent', dto.villageId, {
        expeditionId: expedition.id,
        villageId: dto.villageId,
        targetX: target.x,
        targetY: target.y,
        targetKind: dto.targetKind,
        arrivalAt: arrivalAt.toISOString(),
      });

      await this.scheduleResolution(expedition.id, arrivalAt);

      this.logger.log(
        `Scout expedition created: ${expedition.id}, arrives at ${arrivalAt.toISOString()}`,
      );

      return expedition;
    });
  }

  async initiateReinforce(userId: string, dto: ReinforceCommandDto) {
    this.logger.debug(`Reinforcement initiated by user ${userId}`, { dto });

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify ownership of origin village
      const village = await this.loadOwnedVillage(
        tx,
        dto.villageId,
        userId,
        'Origin village not found or not owned',
      );

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
      const { travelTimeMs, arrivalAt, now } =
        await this.calculateExpeditionTiming(
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
          outboundTravelMs: travelTimeMs,
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
      await this.scheduleResolution(expedition.id, arrivalAt);

      this.logger.log(
        `Reinforcement expedition created: ${expedition.id}, arrives at ${arrivalAt.toISOString()}`,
      );

      return expedition;
    });
  }

  async initiateRecall(userId: string, dto: RecallCommandDto) {
    this.logger.debug(`Recall initiated by user ${userId}`, { dto });

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify both villages and allow either recall-from-origin or send-back-from-host.
      const [originVillage, currentVillage] = await Promise.all([
        tx.village.findUnique({
          where: { id: dto.originVillageId },
        }),
        tx.village.findUnique({
          where: { id: dto.villageId },
        }),
      ]);

      if (!originVillage) {
        throw new BadRequestException('Origin village not found');
      }

      const worldId = originVillage.worldId;

      if (!currentVillage || currentVillage.worldId !== worldId) {
        throw new BadRequestException('Current village not found');
      }

      if (originVillage.userId !== userId && currentVillage.userId !== userId) {
        throw new ForbiddenException(
          'Cannot recall reinforcement from villages not owned by user',
        );
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
      const {
        travelTimeMs,
        arrivalAt: arrivalAtOrigin,
        now,
      } = await this.calculateExpeditionTiming(
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
          outboundTravelMs: travelTimeMs,
          reinforcementRecallActorUserId: userId,
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
      await this.scheduleResolution(expedition.id, arrivalAtOrigin);

      this.logger.log(
        `Recall expedition created: ${expedition.id}, arrives at ${arrivalAtOrigin.toISOString()}`,
      );

      return expedition;
    });
  }

  async recallEnRoute(userId: string, expeditionId: string) {
    this.logger.debug(
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

  private assertScoutUnitsOnly(units: Record<string, number>) {
    if ((units[UNIT_TYPES.SPY] ?? 0) <= 0) {
      throw new BadRequestException('Scout missions require at least one SPY');
    }

    const hasNonSpy = Object.entries(units).some(
      ([unitType, quantity]) =>
        unitType !== UNIT_TYPES.SPY && quantity !== undefined && quantity > 0,
    );
    if (hasNonSpy) {
      throw new BadRequestException(
        'Scout missions must contain SPY units only',
      );
    }
  }

  private async resolveTargetVillage(
    tx: PrismaClientOrTx,
    worldId: string,
    dto: Pick<
      ScoutCommandDto | AttackCommandDto,
      'targetKind' | 'targetRefId' | 'targetX' | 'targetY'
    >,
  ) {
    const targetVillage = await tx.village.findUnique({
      where: { id: dto.targetRefId },
    });

    if (dto.targetKind === 'BARBARIAN_VILLAGE') {
      if (!targetVillage || !targetVillage.isBarbarian) {
        throw new BadRequestException('Barbarian village not found');
      }
    } else if (
      !targetVillage ||
      targetVillage.worldId !== worldId ||
      targetVillage.isBarbarian
    ) {
      throw new BadRequestException('Target village not found');
    }

    if (targetVillage.worldId !== worldId) {
      throw new BadRequestException('Target village not found');
    }

    if (targetVillage.x !== dto.targetX || targetVillage.y !== dto.targetY) {
      throw new BadRequestException('Target coordinates do not match target');
    }

    return targetVillage;
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

  /** Load a village the caller must own, or throw. Shared by the expedition creators. */
  private async loadOwnedVillage(
    tx: PrismaClientOrTx,
    villageId: string,
    userId: string,
    notFoundMessage = 'Village not found or not owned',
  ) {
    const village = await tx.village.findFirst({
      where: { id: villageId, userId },
    });

    if (!village) {
      throw new NotFoundException(notFoundMessage);
    }

    return village;
  }

  /**
   * Enforce fog of war: a target seen only as a blip cannot be targeted.
   * No-op when the world has fog disabled.
   * Cf. ADR-11 + docs/gameplay/01-overview.md ("Blip non-cliquable").
   */
  private async assertTargetInVision(
    userId: string,
    worldId: string,
    point: { x: number; y: number },
    action: string,
  ) {
    const config = await this.worldConfig.getConfig(worldId);
    if (!config.fogOfWar?.enabled) return;

    const disks = await this.visionService.getVisionDisks(userId, worldId);
    if (!this.visionService.isInVision(point, disks)) {
      throw new ForbiddenException(
        `Target is outside your vision — extend your watchtower to ${action}.`,
      );
    }
  }

  /** Schedule the combat resolution worker for a freshly created EN_ROUTE expedition. */
  private async scheduleResolution(expeditionId: string, startAfter: Date) {
    await this.boss.send(
      'combat:resolve',
      { expeditionId },
      {
        startAfter,
        singletonKey: `combat:${expeditionId}`,
      },
    );
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
            user: { select: { email: true } },
          },
        })
      : [];
    const villageNames = new Map(
      villages.map((village) => [village.id, village.name]),
    );
    const playerNames = new Map(
      villages.map((village) => [village.id, village.user?.email ?? null]),
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
