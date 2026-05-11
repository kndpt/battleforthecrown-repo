import { Injectable, Logger } from '@nestjs/common';
import type { EventOutbox } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { GameGateway } from './game.gateway';
import { parseEventPayload } from './codecs';
import {
  EVENT_PAYLOAD_SCHEMAS,
  type EventKind,
  type BuildingCompletedPayload,
  type UnitTrainingCompletedPayload,
  type BattleSentPayload,
  type BattleResolvedPayload,
  type BattleReturnedPayload,
  type VillageAttackedPayload,
  type VillageConqueredPayload,
  type VillageCaptureWindowOpenedPayload,
  type VillageCaptureWindowCompletedPayload,
  type VillageCaptureWindowInterruptedPayload,
  type ReinforcementSentPayload,
  type ReinforcementRecalledPayload,
  type ReinforcementReturnedPayload,
  type ExpeditionRecalledPayload,
  type ExpeditionReturnedPayload,
  type GarrisonAddedPayload,
  type ResourcesChangedPayload,
  type CrownsChangedPayload,
} from './event-types';

function isEventKind(kind: string): kind is EventKind {
  return kind in EVENT_PAYLOAD_SCHEMAS;
}

@Injectable()
export class EventOutboxService {
  private readonly logger = new Logger(EventOutboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GameGateway,
  ) {}

  async dispatchPendingEvents() {
    const fetchStartTime = Date.now();

    const events = await this.prisma.eventOutbox.findMany({
      where: { dispatchedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    const fetchEndTime = Date.now();

    if (events.length === 0) return;

    this.logger.log(
      `📦 [Outbox] ${events.length} events à dispatcher (fetch: ${fetchEndTime - fetchStartTime}ms)`,
    );

    for (const event of events) {
      const eventDispatchStart = Date.now();
      const eventAge = eventDispatchStart - event.createdAt.getTime();

      this.logger.log(`📨 [Outbox] Dispatch event ${event.kind}:`, {
        eventId: event.id,
        kind: event.kind,
        createdAt: event.createdAt.toISOString(),
        createdAtTimestamp: event.createdAt.getTime(),
        dispatchingAt: eventDispatchStart,
        eventAge,
      });

      try {
        await this.dispatchEvent(event);
        await this.prisma.eventOutbox.update({
          where: { id: event.id },
          data: { dispatchedAt: new Date() },
        });

        const eventDispatchEnd = Date.now();
        this.logger.log(
          `✅ [Outbox] Event ${event.kind} dispatché en ${eventDispatchEnd - eventDispatchStart}ms`,
        );
      } catch (error) {
        this.logger.error(`Failed to dispatch event ${event.id}:`, error);
      }
    }
  }

  private async dispatchEvent(event: EventOutbox) {
    if (!isEventKind(event.kind)) {
      this.logger.warn(`Unknown event kind: ${event.kind}`);
      return;
    }
    switch (event.kind) {
      case 'building.completed':
        await this.notifyBuildingCompleted(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'unit.training.completed':
        await this.notifyUnitTrainingCompleted(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'battle.sent':
        await this.notifyBattleSent(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'battle.resolved':
        await this.notifyBattleResolved(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'battle.returned':
        await this.notifyBattleReturned(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'resources.changed':
        await this.notifyResourcesChanged(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'village.attacked':
        await this.notifyVillageAttacked(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'village.conquered':
        this.notifyVillageConquered(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'village.capture-window-opened':
        await this.notifyVillageCaptureWindowOpened(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'village.capture-window-completed':
        this.notifyVillageCaptureWindowCompleted(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'village.capture-window-interrupted':
        await this.notifyVillageCaptureWindowInterrupted(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'reinforcement.sent':
        await this.notifyReinforcementSent(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'reinforcement.recalled':
        await this.notifyReinforcementRecalled(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'reinforcement.returned':
        await this.notifyReinforcementReturned(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'expedition.recalled':
        await this.notifyExpeditionRecalled(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'expedition.returned':
        await this.notifyExpeditionReturned(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'garrison.added':
        await this.notifyGarrisonAdded(
          parseEventPayload(event.kind, event.payload),
        );
        break;
      case 'crowns.changed':
        this.notifyCrownsChanged(parseEventPayload(event.kind, event.payload));
        break;
      default: {
        const exhaustiveCheck: never = event.kind;
        this.logger.warn(`Unknown event kind: ${String(exhaustiveCheck)}`);
      }
    }
  }

  private async notifyBuildingCompleted(payload: BuildingCompletedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    const notifyTime = Date.now();
    this.logger.log(
      `🔔 [Outbox] Envoi WebSocket building.completed à ${notifyTime}:`,
      {
        userId,
        buildingId: payload.buildingId,
        level: payload.level,
      },
    );

    this.gateway.notifyUser(userId, 'building.completed', {
      buildingId: payload.buildingId,
      villageId: payload.villageId,
      buildingType: payload.buildingType,
      level: payload.level,
    });
  }

  private async notifyUnitTrainingCompleted(
    payload: UnitTrainingCompletedPayload,
  ) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.logger.log(`✅ [Outbox] Envoi WebSocket unit.training.completed:`, {
      userId,
      trainingId: payload.trainingId,
      unitType: payload.unitType,
      totalQty: payload.totalQty,
    });

    this.gateway.notifyUser(userId, 'unit.training.completed', {
      trainingId: payload.trainingId,
      villageId: payload.villageId,
      unitType: payload.unitType,
      completedQty: payload.completedQty,
      totalQty: payload.totalQty,
    });
  }

  private async notifyResourcesChanged(payload: ResourcesChangedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'resources.changed', payload);
  }

  private async notifyBattleSent(payload: BattleSentPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.logger.log(`⚔️ [Outbox] Envoi WebSocket battle.sent:`, {
      userId,
      expeditionId: payload.expeditionId,
      targetKind: payload.targetKind,
    });

    this.gateway.notifyUser(userId, 'battle.sent', {
      expeditionId: payload.expeditionId,
      villageId: payload.villageId,
      targetX: payload.targetX,
      targetY: payload.targetY,
      targetKind: payload.targetKind,
      arrivalAt: payload.arrivalAt,
    });
  }

  private async notifyBattleResolved(payload: BattleResolvedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.logger.log(`⚔️ [Outbox] Envoi WebSocket battle.resolved:`, {
      userId,
      expeditionId: payload.expeditionId,
      reportId: payload.reportId,
      isVictory: payload.isVictory,
      casualtyRate: payload.casualtyRate,
    });

    this.gateway.notifyUser(userId, 'battle.resolved', {
      expeditionId: payload.expeditionId,
      reportId: payload.reportId,
      villageId: payload.villageId,
      villageName: payload.villageName,
      targetKind: payload.targetKind,
      targetName: payload.targetName,
      targetX: payload.targetX,
      targetY: payload.targetY,
      isVictory: payload.isVictory,
      loot: payload.loot,
      lossesAttacker: payload.lossesAttacker,
      casualtyRate: payload.casualtyRate,
      survivingUnits: payload.survivingUnits,
      returnAt: payload.returnAt,
    });
  }

  private async notifyBattleReturned(payload: BattleReturnedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.logger.log(`⚔️ [Outbox] Envoi WebSocket battle.returned:`, {
      userId,
      expeditionId: payload.expeditionId,
    });

    this.gateway.notifyUser(userId, 'battle.returned', {
      expeditionId: payload.expeditionId,
      reportId: payload.reportId,
      villageId: payload.villageId,
      survivingUnits: payload.survivingUnits,
      loot: payload.loot,
    });
  }

  private async notifyVillageAttacked(payload: VillageAttackedPayload) {
    // Pour PvP : notifier le défenseur
    const defenderVillageId = payload.defenderVillageId;
    if (!defenderVillageId) return;

    const userId = await this.getUserIdByVillage(defenderVillageId);
    if (!userId) return;

    this.logger.log(`🛡️ [Outbox] Envoi WebSocket village.attacked:`, {
      userId,
      attackerVillageId: payload.attackerVillageId,
      isDefenseSuccessful: payload.isDefenseSuccessful,
      casualtyRate: payload.casualtyRate,
    });

    this.gateway.notifyUser(userId, 'village.attacked', {
      defenderVillageId: payload.defenderVillageId,
      attackerVillageId: payload.attackerVillageId,
      attackerVillageName: payload.attackerVillageName,
      attackerX: payload.attackerX,
      attackerY: payload.attackerY,
      defenderVillageName: payload.defenderVillageName,
      isDefenseSuccessful: payload.isDefenseSuccessful,
      losses: payload.losses,
      casualtyRate: payload.casualtyRate,
      resourcesLost: payload.resourcesLost,
      timestamp: payload.timestamp,
    });
  }

  private notifyVillageConquered(payload: VillageConqueredPayload) {
    const userId = payload.newOwnerId;
    if (!userId) return;

    this.logger.log(`🏰 [Outbox] Envoi WebSocket village.conquered:`, {
      userId,
      villageId: payload.villageId,
      x: payload.x,
      y: payload.y,
    });

    this.gateway.notifyUser(userId, 'village.conquered', {
      villageId: payload.villageId,
      newOwnerId: payload.newOwnerId,
      previousTier: payload.previousTier,
      x: payload.x,
      y: payload.y,
      buildingsKept: payload.buildingsKept,
    });
  }

  private async notifyVillageCaptureWindowOpened(
    payload: VillageCaptureWindowOpenedPayload,
  ) {
    const pendingConquest = await this.prisma.pendingConquest.findUnique({
      where: { id: payload.pendingConquestId },
      select: { attackerUserId: true },
    });
    if (!pendingConquest) return;

    this.gateway.notifyUser(
      pendingConquest.attackerUserId,
      'village.capture-window-opened',
      payload,
    );
  }

  private notifyVillageCaptureWindowCompleted(
    payload: VillageCaptureWindowCompletedPayload,
  ) {
    this.gateway.notifyUser(
      payload.newOwnerUserId,
      'village.capture-window-completed',
      payload,
    );
  }

  private async notifyVillageCaptureWindowInterrupted(
    payload: VillageCaptureWindowInterruptedPayload,
  ) {
    const pendingConquest = await this.prisma.pendingConquest.findUnique({
      where: { id: payload.pendingConquestId },
      select: { attackerUserId: true },
    });
    if (!pendingConquest) return;

    this.gateway.notifyUser(
      pendingConquest.attackerUserId,
      'village.capture-window-interrupted',
      payload,
    );
  }

  private notifyCrownsChanged(payload: CrownsChangedPayload) {
    const userId = payload.userId;
    if (!userId) return;

    this.gateway.notifyUser(userId, 'crowns.changed', {
      userId: payload.userId,
      worldId: payload.worldId,
      balance: payload.balance,
      productionRate: payload.productionRate,
      lastUpdateTs: payload.lastUpdateTs,
    });
  }

  private async notifyReinforcementSent(payload: ReinforcementSentPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'reinforcement.sent', payload);
  }

  private async notifyReinforcementRecalled(
    payload: ReinforcementRecalledPayload,
  ) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'reinforcement.recalled', payload);
  }

  private async notifyReinforcementReturned(
    payload: ReinforcementReturnedPayload,
  ) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'reinforcement.returned', payload);
  }

  private async notifyExpeditionRecalled(payload: ExpeditionRecalledPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'expedition.recalled', payload);
  }

  private async notifyExpeditionReturned(payload: ExpeditionReturnedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'expedition.returned', payload);
  }

  private async notifyGarrisonAdded(payload: GarrisonAddedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'garrison.added', payload);
  }

  private async getUserIdByVillage(villageId: string): Promise<string | null> {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      select: { userId: true },
    });
    return village?.userId || null;
  }
}
