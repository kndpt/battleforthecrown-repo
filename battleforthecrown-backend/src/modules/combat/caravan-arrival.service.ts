import { Injectable, Logger } from '@nestjs/common';
import { Expedition } from '@prisma/client';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { createOutboxEvent } from '../event/event.utils';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { ResourcesService } from '../resources/resources.service';
import { findBuildingByType } from '@battleforthecrown/shared/village';
import { getWarehouseStorageLimit } from '@battleforthecrown/shared/resources';
import {
  caravanPortersFor,
  parseCaravanResources,
  subtractCaravanResources,
} from './caravan.utils';
import {
  dedupedRecipientUserIds,
  loadReportVillageSnapshot,
} from './combat-report.utils';
import type { ReturnJobToSchedule } from './interfaces/return-job.interface';

const EMPTY_LOOT = { wood: 0, stone: 0, iron: 0 } as const;

/**
 * Caravan arrival lifecycle: credits the hauled resources to the target stock
 * (warehouse-capped, overflow recorded as lost), writes the ARRIVED
 * caravan report + inbox entries, flips the expedition to RETURNING and returns
 * the return job for the caller to schedule post-commit.
 *
 * Runs inside the caller's `combat:resolve` transaction (`tx` is passed in) —
 * `CombatWorker` only routes by expedition kind, mirroring how
 * `ScoutArrivalService` / `ExtractionLifecycleService` own their paths.
 */
@Injectable()
export class CaravanArrivalService {
  private readonly logger = new Logger(CaravanArrivalService.name);

  constructor(
    private readonly resources: ResourcesService,
    private readonly outbox: OutboxPublisher,
  ) {}

  async handleArrival(
    tx: PrismaClientOrTx,
    expedition: Expedition,
  ): Promise<ReturnJobToSchedule> {
    this.logger.debug(`Processing caravan arrival: ${expedition.id}`);

    const targetVillage = await tx.village.findUnique({
      where: { id: expedition.targetRefId },
      include: {
        buildings: { select: { type: true, level: true } },
        resourceStock: true,
        strategyConfig: true,
      },
    });
    if (!targetVillage?.resourceStock) {
      throw new Error(
        `Caravan target stock not found: ${expedition.targetRefId}`,
      );
    }

    const carried = parseCaravanResources(expedition);
    const warehouseLevel =
      findBuildingByType(targetVillage.buildings, 'WAREHOUSE')?.level ?? 1;
    const limits = getWarehouseStorageLimit(warehouseLevel);
    const now = new Date();
    const currentStock = await this.resources.calculateCurrentResources({
      worldId: targetVillage.worldId,
      resourceStock: targetVillage.resourceStock,
      buildings: targetVillage.buildings,
      strategy: targetVillage.strategyConfig?.strategy,
      naturalTrait: targetVillage.naturalTrait,
    });
    const credited = {
      wood: Math.min(
        carried.wood,
        Math.max(0, limits.wood - currentStock.wood),
      ),
      stone: Math.min(
        carried.stone,
        Math.max(0, limits.stone - currentStock.stone),
      ),
      iron: Math.min(
        carried.iron,
        Math.max(0, limits.iron - currentStock.iron),
      ),
    };
    const lost = subtractCaravanResources(carried, credited);
    const returnAt = new Date(Date.now() + expedition.outboundTravelMs);

    await tx.resourceStock.update({
      where: { villageId: expedition.targetRefId },
      data: {
        wood: currentStock.wood + credited.wood,
        stone: currentStock.stone + credited.stone,
        iron: currentStock.iron + credited.iron,
        lastUpdateTs: now,
      },
    });
    await this.outbox.resourcesChanged(expedition.targetRefId, tx);

    await tx.expedition.update({
      where: { id: expedition.id },
      data: {
        status: 'RETURNING',
        returnAt,
      },
    });

    const originVillage = await loadReportVillageSnapshot(
      tx,
      expedition.attackerVillageId,
    );
    if (!originVillage?.userId) {
      throw new Error(
        `Caravan report origin village not found: originVillageId=${expedition.attackerVillageId}, worldId=${expedition.worldId}`,
      );
    }

    const report = await tx.caravanReport.upsert({
      where: {
        expeditionId_type: {
          expeditionId: expedition.id,
          type: 'ARRIVED',
        },
      },
      create: {
        worldId: expedition.worldId,
        expeditionId: expedition.id,
        type: 'ARRIVED',
        originVillageId: originVillage.id,
        originVillageName: originVillage.name,
        originX: originVillage.x,
        originY: originVillage.y,
        targetVillageId: targetVillage.id,
        targetVillageName: targetVillage.name,
        targetX: targetVillage.x,
        targetY: targetVillage.y,
        resources: carried,
        credited,
        returned: EMPTY_LOOT,
        lost,
        porters: caravanPortersFor(carried),
        recalled: false,
      },
      update: {},
    });

    const recipientIds = dedupedRecipientUserIds(
      originVillage.userId,
      targetVillage.userId,
    );

    for (const recipientUserId of recipientIds) {
      await tx.inboxEntry.upsert({
        where: {
          userId_caravanReportId: {
            userId: recipientUserId,
            caravanReportId: report.id,
          },
        },
        create: {
          userId: recipientUserId,
          worldId: expedition.worldId,
          kind: 'CARAVAN',
          caravanReportId: report.id,
        },
        update: {},
      });
    }

    await createOutboxEvent(tx, 'caravan.arrived', expedition.targetRefId, {
      expeditionId: expedition.id,
      villageId: expedition.attackerVillageId,
      targetVillageId: expedition.targetRefId,
      credited,
      lost,
      returnAt: returnAt.toISOString(),
    });

    this.logger.debug(
      `Caravan arrived for expedition ${expedition.id}, credited=${JSON.stringify(credited)}, lost=${JSON.stringify(lost)}`,
    );

    return { expeditionId: expedition.id, returnAt };
  }
}
