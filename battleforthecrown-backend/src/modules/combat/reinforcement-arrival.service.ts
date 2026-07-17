import { Injectable, Logger } from '@nestjs/common';
import { Expedition, PendingConquestStatus } from '@prisma/client';
import { PrismaClientOrTx } from '../../common/prisma.types';
import { createOutboxEvent } from '../event/event.utils';
import { creditUnitsToInventory } from './unit-inventory';
import { parseUnitMap, encodeUnitMap } from './codecs';
import {
  dedupedRecipientUserIds,
  loadReportVillageSnapshot,
} from './combat-report.utils';
import type { UnitMap } from '@battleforthecrown/shared/army';

/**
 * Reinforcement arrival lifecycle: stations in-flight troops in the host
 * garrison (or credits them home when returning), writes the STATIONED/RETURNED
 * reinforcement report + inbox entries, and bounces troops back home when the
 * host slammed a capture window shut mid-flight.
 *
 * Runs inside the caller's `combat:resolve` transaction (`tx` is passed in) —
 * `CombatWorker` only routes by expedition kind, mirroring how
 * `ScoutArrivalService` / `CaravanArrivalService` own their paths.
 */
@Injectable()
export class ReinforcementArrivalService {
  private readonly logger = new Logger(ReinforcementArrivalService.name);

  async handleArrival(
    tx: PrismaClientOrTx,
    expedition: Expedition,
  ): Promise<void> {
    this.logger.debug(`Processing reinforcement arrival: ${expedition.id}`);

    const units = parseUnitMap(expedition.units, 'expedition.units');
    const originVillageId =
      expedition.reinforcementOriginVillageId || expedition.attackerVillageId;
    const isReturningHome = expedition.targetRefId === originVillageId;

    // A capture window may have opened on the host between dispatch and arrival.
    // Defensive friends must never prop up an occupation garrison (cf.
    // docs/gameplay/14-pvp-conquest.md § Acteurs autorisés). The dispatch guard
    // (combat.service) only covers send-time, so re-check on arrival and bounce
    // in-flight reinforcements back home instead of stationing them.
    if (!isReturningHome) {
      const openConquest = await tx.pendingConquest.findFirst({
        where: {
          targetVillageId: expedition.targetRefId,
          status: PendingConquestStatus.OPEN,
        },
        select: { id: true },
      });
      if (openConquest) {
        await this.bounceReinforcementFromCaptureWindow(
          tx,
          expedition,
          units,
          originVillageId,
        );
        return;
      }
    }

    if (isReturningHome) {
      this.logger.debug(`Reinforcement returning home to ${originVillageId}`);
      // Back to home inventory
      await creditUnitsToInventory(tx, originVillageId, units);
    } else {
      this.logger.debug(
        `Reinforcement arriving at ${expedition.targetRefId} from ${originVillageId}`,
      );
      // Transfer units to Garrison
      for (const [unitType, quantity] of Object.entries(units)) {
        if (quantity <= 0) continue;

        await tx.garrison.upsert({
          where: {
            villageId_originVillageId_unitType: {
              villageId: expedition.targetRefId,
              originVillageId: originVillageId,
              unitType,
            },
          },
          create: {
            villageId: expedition.targetRefId,
            originVillageId: originVillageId,
            unitType,
            quantity,
          },
          update: {
            quantity: { increment: quantity },
          },
        });
      }
    }

    // 2. Update expedition status
    await tx.expedition.update({
      where: { id: expedition.id },
      data: { status: 'RESOLVED' },
    });

    // 3. Create event
    if (isReturningHome) {
      await createOutboxEvent(
        tx,
        'reinforcement.returned',
        expedition.targetRefId,
        {
          expeditionId: expedition.id,
          villageId: expedition.targetRefId,
          originVillageId: originVillageId,
          hostVillageId: expedition.attackerVillageId,
          units,
        },
      );
    } else {
      await createOutboxEvent(tx, 'garrison.added', expedition.targetRefId, {
        villageId: expedition.targetRefId,
        originVillageId: originVillageId,
        units,
      });
    }

    // 4. Create ReinforcementReport + InboxEntry per recipient
    const reportType = isReturningHome ? 'RETURNED' : 'STATIONED';
    const reportActorUserId = isReturningHome
      ? (expedition.reinforcementRecallActorUserId ?? null)
      : null;

    // STATIONED: origin = originVillageId, host = targetRefId
    // RETURNED:  origin = targetRefId (home), host = attackerVillageId (B)
    const reportOriginVillageId = isReturningHome
      ? expedition.targetRefId
      : originVillageId;
    const reportHostVillageId = isReturningHome
      ? expedition.attackerVillageId
      : expedition.targetRefId;

    const [originVillageSnap, hostVillageSnap] = await Promise.all([
      loadReportVillageSnapshot(tx, reportOriginVillageId),
      loadReportVillageSnapshot(tx, reportHostVillageId),
    ]);

    if (!originVillageSnap) {
      throw new Error(
        `Reinforcement report origin village not found: originVillageId=${reportOriginVillageId}, worldId=${expedition.worldId}`,
      );
    }
    if (!hostVillageSnap) {
      throw new Error(
        `Reinforcement report host village not found: hostVillageId=${reportHostVillageId}, worldId=${expedition.worldId}`,
      );
    }

    const report = await tx.reinforcementReport.create({
      data: {
        worldId: expedition.worldId,
        type: reportType,
        originVillageId: reportOriginVillageId,
        originVillageName: originVillageSnap.name,
        originX: originVillageSnap.x,
        originY: originVillageSnap.y,
        hostVillageId: reportHostVillageId,
        hostVillageName: hostVillageSnap.name,
        hostX: hostVillageSnap.x,
        hostY: hostVillageSnap.y,
        units: encodeUnitMap(units),
        actorUserId: reportActorUserId,
      },
    });

    const recipientIds = dedupedRecipientUserIds(
      originVillageSnap.userId,
      hostVillageSnap.userId,
    );

    for (const recipientUserId of recipientIds) {
      await tx.inboxEntry.create({
        data: {
          userId: recipientUserId,
          worldId: expedition.worldId,
          kind: 'REINFORCEMENT',
          reinforcementReportId: report.id,
        },
      });
    }

    this.logger.debug(
      `ReinforcementReport ${report.id} (${reportType}) created, ${recipientIds.length} inbox entries for expedition ${expedition.id}`,
    );

    this.logger.debug(
      `Reinforcement ${isReturningHome ? 'returned' : 'stationed'}: ${expedition.id}`,
    );
  }

  /**
   * The host slammed an OPEN capture window shut while these reinforcements were
   * in flight. Refuse delivery: the troops turn back at the gates and are
   * returned to their origin village immediately (pop stays consumed at origin —
   * the units are alive and home). A RETURNED report tells the troop owner why.
   */
  private async bounceReinforcementFromCaptureWindow(
    tx: PrismaClientOrTx,
    expedition: Expedition,
    units: UnitMap,
    originVillageId: string,
  ): Promise<void> {
    this.logger.debug(
      `Reinforcement ${expedition.id} bounced: host ${expedition.targetRefId} under an open capture window`,
    );

    await creditUnitsToInventory(tx, originVillageId, units);

    await tx.expedition.update({
      where: { id: expedition.id },
      data: { status: 'RESOLVED' },
    });

    await createOutboxEvent(tx, 'reinforcement.returned', originVillageId, {
      expeditionId: expedition.id,
      villageId: originVillageId,
      originVillageId,
      hostVillageId: expedition.targetRefId,
      units,
    });

    const [originVillageSnap, hostVillageSnap] = await Promise.all([
      loadReportVillageSnapshot(tx, originVillageId),
      loadReportVillageSnapshot(tx, expedition.targetRefId),
    ]);
    if (!originVillageSnap) {
      throw new Error(
        `Bounced reinforcement origin village not found: originVillageId=${originVillageId}, worldId=${expedition.worldId}`,
      );
    }
    if (!hostVillageSnap) {
      throw new Error(
        `Bounced reinforcement host village not found: hostVillageId=${expedition.targetRefId}, worldId=${expedition.worldId}`,
      );
    }

    const report = await tx.reinforcementReport.create({
      data: {
        worldId: expedition.worldId,
        type: 'RETURNED',
        originVillageId,
        originVillageName: originVillageSnap.name,
        originX: originVillageSnap.x,
        originY: originVillageSnap.y,
        hostVillageId: expedition.targetRefId,
        hostVillageName: hostVillageSnap.name,
        hostX: hostVillageSnap.x,
        hostY: hostVillageSnap.y,
        units: encodeUnitMap(units),
        actorUserId: null,
      },
    });

    const recipientIds = dedupedRecipientUserIds(
      originVillageSnap.userId,
      hostVillageSnap.userId,
    );
    for (const recipientUserId of recipientIds) {
      await tx.inboxEntry.create({
        data: {
          userId: recipientUserId,
          worldId: expedition.worldId,
          kind: 'REINFORCEMENT',
          reinforcementReportId: report.id,
        },
      });
    }
  }
}
