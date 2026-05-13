import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PendingConquestStatus } from '@prisma/client';
import PgBoss from 'pg-boss';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { createOutboxEvent } from '../event/event.utils';
import { UNIT_COSTS, UNIT_TYPES } from '@battleforthecrown/shared/army';
import { getWarehouseStorageLimit } from '@battleforthecrown/shared/resources';
import {
  BUILDING_TYPES,
  getBuildingLevelValues,
  getFarmPopulationLimit,
  type BuildingType,
} from '@battleforthecrown/shared/village';

export const CONQUEST_FINALIZE_QUEUE = 'conquest:finalize';

const BARBARIAN_CONQUEST_BUILDINGS = [
  BUILDING_TYPES.CASTLE,
  BUILDING_TYPES.WOOD,
  BUILDING_TYPES.STONE,
  BUILDING_TYPES.IRON,
  BUILDING_TYPES.WAREHOUSE,
  BUILDING_TYPES.FARM,
  BUILDING_TYPES.BARRACKS,
] as const satisfies readonly BuildingType[];

const BARBARIAN_CONQUEST_LEVEL_BY_TIER = {
  T1: 1,
  T2: 1,
  T3: 2,
  T4: 3,
  T5: 4,
} as const;

const calculateBuildingPopulationUsed = (
  buildings: {
    type: BuildingType;
    level: number;
  }[],
) => {
  return buildings.reduce((total, building) => {
    let buildingPopulation = 0;
    for (let level = 1; level <= building.level; level += 1) {
      buildingPopulation +=
        getBuildingLevelValues(building.type, level)?.population ?? 0;
    }
    return total + buildingPopulation;
  }, 0);
};

@Injectable()
export class ConquestService {
  private readonly logger = new Logger(ConquestService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('PG_BOSS') private readonly boss: PgBoss,
  ) {}

  async openCaptureWindow(params: {
    attackerVillageId: string;
    targetVillageId: string;
    attackerUserId: string;
    captureUntil: Date;
    attackerNobleId?: string;
  }) {
    const pendingConquest = await this.prisma.$transaction((tx) =>
      this.openCaptureWindowInTx(tx, params),
    );
    await this.scheduleFinalizeJob(pendingConquest);
    return this.prisma.pendingConquest.findUniqueOrThrow({
      where: { id: pendingConquest.id },
    });
  }

  async openCaptureWindowInTx(
    tx: PrismaClientOrTx,
    params: {
      attackerVillageId: string;
      targetVillageId: string;
      attackerUserId: string;
      captureUntil: Date;
      attackerNobleId?: string;
    },
  ) {
    const [attacker, target, existingOpen] = await Promise.all([
      tx.village.findUnique({
        where: { id: params.attackerVillageId },
        select: { id: true, userId: true, worldId: true },
      }),
      tx.village.findUnique({
        where: { id: params.targetVillageId },
        select: { id: true, worldId: true },
      }),
      tx.pendingConquest.findFirst({
        where: {
          targetVillageId: params.targetVillageId,
          status: PendingConquestStatus.OPEN,
        },
      }),
    ]);

    if (!attacker) throw new NotFoundException('Attacker village not found');
    if (!target) throw new NotFoundException('Target village not found');
    if (attacker.userId !== params.attackerUserId) {
      throw new ForbiddenException('Attacker village does not belong to user');
    }
    if (attacker.worldId !== target.worldId) {
      throw new ForbiddenException('Target village is in another world');
    }
    if (existingOpen) {
      throw new ConflictException('A capture window is already open');
    }

    const created = await tx.pendingConquest.create({
      data: {
        attackerVillageId: params.attackerVillageId,
        attackerUserId: params.attackerUserId,
        attackerNobleId: params.attackerNobleId,
        targetVillageId: params.targetVillageId,
        worldId: attacker.worldId,
        captureUntil: params.captureUntil,
      },
    });

    await createOutboxEvent(
      tx,
      'village.capture-window-opened',
      params.targetVillageId,
      {
        pendingConquestId: created.id,
        targetVillageId: params.targetVillageId,
        attackerVillageId: params.attackerVillageId,
        captureUntil: params.captureUntil.toISOString(),
      },
    );

    return created;
  }

  async scheduleFinalizeJob(pendingConquest: {
    id: string;
    captureUntil: Date;
  }) {
    const finalizeJobId = await this.boss.send(
      CONQUEST_FINALIZE_QUEUE,
      { pendingConquestId: pendingConquest.id },
      {
        startAfter: pendingConquest.captureUntil,
        singletonKey: `conquest-finalize:${pendingConquest.id}`,
      },
    );

    if (!finalizeJobId) return;

    await this.prisma.pendingConquest.update({
      where: { id: pendingConquest.id },
      data: { finalizeJobId },
    });
  }

  async interruptCaptureWindowInTx(
    tx: PrismaClientOrTx,
    targetVillageId: string,
    reason: string,
  ): Promise<{
    interrupted: boolean;
    pendingConquestId?: string;
    finalizeJobId?: string | null;
  }> {
    const pending = await tx.pendingConquest.findFirst({
      where: { targetVillageId, status: PendingConquestStatus.OPEN },
    });

    if (!pending) return { interrupted: false };

    await tx.pendingConquest.update({
      where: { id: pending.id },
      data: { status: PendingConquestStatus.INTERRUPTED },
    });

    await createOutboxEvent(
      tx,
      'village.capture-window-interrupted',
      targetVillageId,
      {
        pendingConquestId: pending.id,
        targetVillageId,
        reason,
      },
    );

    return {
      interrupted: true,
      pendingConquestId: pending.id,
      finalizeJobId: pending.finalizeJobId,
    };
  }

  async finalizeCaptureWindow(pendingConquestId: string): Promise<{
    completed: boolean;
    villageId?: string;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const pending = await tx.pendingConquest.findUnique({
        where: { id: pendingConquestId },
      });

      if (!pending) throw new NotFoundException('Pending conquest not found');
      if (pending.status !== PendingConquestStatus.OPEN) {
        return { completed: false };
      }

      await this.conquerVillageInTx(tx, {
        attackerVillageId: pending.attackerVillageId,
        targetVillageId: pending.targetVillageId,
        attackerUserId: pending.attackerUserId,
      });

      await this.installNobleInConqueredVillage(tx, pending);

      await tx.pendingConquest.update({
        where: { id: pending.id },
        data: { status: PendingConquestStatus.COMPLETED },
      });

      await createOutboxEvent(
        tx,
        'village.capture-window-completed',
        pending.targetVillageId,
        {
          pendingConquestId: pending.id,
          targetVillageId: pending.targetVillageId,
          newOwnerUserId: pending.attackerUserId,
        },
      );

      return { completed: true, villageId: pending.targetVillageId };
    });
  }

  async interruptCaptureWindow(
    targetVillageId: string,
    reason: string,
  ): Promise<{ interrupted: boolean; pendingConquestId?: string }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const pending = await tx.pendingConquest.findFirst({
        where: { targetVillageId, status: PendingConquestStatus.OPEN },
      });

      if (!pending) return { interrupted: false };

      await tx.pendingConquest.update({
        where: { id: pending.id },
        data: { status: PendingConquestStatus.INTERRUPTED },
      });

      await createOutboxEvent(
        tx,
        'village.capture-window-interrupted',
        targetVillageId,
        {
          pendingConquestId: pending.id,
          targetVillageId,
          reason,
        },
      );

      return {
        interrupted: true,
        pendingConquestId: pending.id,
        finalizeJobId: pending.finalizeJobId,
      };
    });

    if (result.interrupted && result.finalizeJobId) {
      try {
        await this.boss.cancel(CONQUEST_FINALIZE_QUEUE, result.finalizeJobId);
      } catch (error) {
        this.logger.warn(
          `Unable to cancel conquest finalization job ${result.finalizeJobId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return {
      interrupted: result.interrupted,
      pendingConquestId: result.pendingConquestId,
    };
  }

  /**
   * Conquer a village immediately. Production flow should call
   * `openCaptureWindow` first, then let `conquest:finalize` invoke this logic.
   */
  async conquerVillage(params: {
    attackerVillageId: string;
    targetVillageId: string;
    attackerUserId: string;
  }): Promise<{
    success: boolean;
    villageId: string;
    name: string;
    buildings: number;
    tier?: string;
  }> {
    this.logger.log(
      `Attempting conquest: ${params.attackerVillageId} -> ${params.targetVillageId}`,
    );

    return this.prisma.$transaction((tx) =>
      this.conquerVillageInTx(tx, params),
    );
  }

  /**
   * Check if a village can be conquered.
   */
  async canConquer(villageId: string): Promise<{
    canConquer: boolean;
    reason?: string;
  }> {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      select: { isBarbarian: true, userId: true },
    });

    if (!village) {
      return { canConquer: false, reason: 'Village not found' };
    }

    return { canConquer: true };
  }

  private async conquerVillageInTx(
    tx: PrismaClientOrTx,
    params: {
      attackerVillageId: string;
      targetVillageId: string;
      attackerUserId: string;
    },
  ): Promise<{
    success: boolean;
    villageId: string;
    name: string;
    buildings: number;
    tier?: string;
  }> {
    const { attackerVillageId, targetVillageId, attackerUserId } = params;
    const target = await tx.village.findUnique({
      where: { id: targetVillageId },
      include: {
        buildings: true,
        resourceStock: true,
      },
    });

    if (!target) {
      throw new NotFoundException('Target village not found');
    }

    const attacker = await tx.village.findUnique({
      where: { id: attackerVillageId },
      select: { userId: true, worldId: true },
    });

    if (!attacker) {
      throw new NotFoundException('Attacker village not found');
    }

    if (attacker.userId !== attackerUserId) {
      throw new ForbiddenException('Attacker village does not belong to user');
    }

    if (attacker.worldId !== target.worldId) {
      throw new ForbiddenException('Target village is in another world');
    }

    await tx.village.update({
      where: { id: targetVillageId },
      data: {
        userId: attackerUserId,
        isBarbarian: false,
        tier: null,
        conqueredAt: new Date(),
      },
    });

    let buildingsKept = target.buildings.length;

    if (target.isBarbarian) {
      const materializedLevel =
        BARBARIAN_CONQUEST_LEVEL_BY_TIER[
          target.tier as keyof typeof BARBARIAN_CONQUEST_LEVEL_BY_TIER
        ] ?? 1;
      const materializedBuildings = BARBARIAN_CONQUEST_BUILDINGS.map(
        (type) => ({
          villageId: targetVillageId,
          type,
          level: materializedLevel,
        }),
      );
      const usedPopulation = calculateBuildingPopulationUsed(
        materializedBuildings,
      );
      const maxPopulation = getFarmPopulationLimit(materializedLevel);

      await tx.unitInventory.deleteMany({
        where: { villageId: targetVillageId },
      });

      await tx.building.deleteMany({
        where: { villageId: targetVillageId },
      });
      await tx.building.createMany({
        data: materializedBuildings,
      });

      await tx.villageStrategyConfig.upsert({
        where: { villageId: targetVillageId },
        create: { villageId: targetVillageId, strategy: 'BALANCED' },
        update: {
          strategy: 'BALANCED',
          changeCost: 0,
          cooldownEndsAt: null,
        },
      });

      await tx.population.upsert({
        where: { villageId: targetVillageId },
        create: {
          villageId: targetVillageId,
          used: usedPopulation,
          max: maxPopulation,
        },
        update: {
          used: usedPopulation,
          max: maxPopulation,
        },
      });

      buildingsKept = materializedBuildings.length;
    }

    if (target.resourceStock) {
      await tx.resourceStock.update({
        where: { villageId: targetVillageId },
        data: {
          wood: 0,
          stone: 0,
          iron: 0,
          maxPerType: target.isBarbarian
            ? getWarehouseStorageLimit(
                BARBARIAN_CONQUEST_LEVEL_BY_TIER[
                  target.tier as keyof typeof BARBARIAN_CONQUEST_LEVEL_BY_TIER
                ] ?? 1,
              ).wood
            : target.resourceStock.maxPerType,
        },
      });
    }

    await createOutboxEvent(tx, 'village.conquered', targetVillageId, {
      villageId: targetVillageId,
      newOwnerId: attackerUserId,
      previousTier: target.tier,
      x: target.x,
      y: target.y,
      buildingsKept,
    });

    this.logger.log(
      `Village ${target.name} conquered by user ${attackerUserId}`,
    );

    return {
      success: true,
      villageId: target.id,
      name: target.name,
      buildings: buildingsKept,
      tier: target.tier || undefined,
    };
  }

  private async installNobleInConqueredVillage(
    tx: PrismaClientOrTx,
    pending: {
      attackerVillageId: string;
      targetVillageId: string;
    },
  ) {
    const noblePopulation = UNIT_COSTS[UNIT_TYPES.NOBLE].population;

    const deletedOccupation = await tx.garrison.deleteMany({
      where: {
        villageId: pending.targetVillageId,
        originVillageId: pending.attackerVillageId,
        unitType: UNIT_TYPES.NOBLE,
      },
    });

    if (deletedOccupation.count === 0) return;

    await tx.population.update({
      where: { villageId: pending.attackerVillageId },
      data: { used: { decrement: noblePopulation } },
    });
    await tx.population.upsert({
      where: { villageId: pending.targetVillageId },
      create: {
        villageId: pending.targetVillageId,
        used: noblePopulation,
        max: noblePopulation,
      },
      update: { used: { increment: noblePopulation } },
    });
  }
}
