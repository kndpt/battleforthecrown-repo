import { Injectable, Logger } from '@nestjs/common';
import type { EventOutbox } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { GameGateway } from './game.gateway';
import { parseEventPayload } from './codecs';
import { RetentionService } from '../retention/retention.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import {
  EVENT_PAYLOAD_SCHEMAS,
  type EventKind,
  type BuildingCompletedPayload,
  type UnitTrainingCompletedPayload,
  type UnitTrainedPayload,
  type BattleSentPayload,
  type BattleResolvedPayload,
  type BattleReturnedPayload,
  type ScoutSentPayload,
  type ScoutReportedPayload,
  type ScoutReturnedPayload,
  type VillageAttackedPayload,
  type VillageConqueredPayload,
  type VillageCaptureWindowOpenedPayload,
  type VillageCaptureWindowCompletedPayload,
  type VillageCaptureWindowInterruptedPayload,
  type NobleKilledPayload,
  type ReinforcementSentPayload,
  type ReinforcementRecalledPayload,
  type ReinforcementReturnedPayload,
  type CaravanSentPayload,
  type CaravanArrivedPayload,
  type CaravanRecalledPayload,
  type CaravanReturnedPayload,
  type ExpeditionRecalledPayload,
  type ExpeditionReturnedPayload,
  type GarrisonAddedPayload,
  type ResourcesChangedPayload,
  type CrownsChangedPayload,
  type RankingsChangedPayload,
  type WorldStatusChangedPayload,
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
    private readonly retention: RetentionService,
    private readonly onboarding: OnboardingService,
  ) {}

  async dispatchPendingEvents(): Promise<void> {
    const fetchStartTime = Date.now();

    const events = await this.prisma.eventOutbox.findMany({
      where: { dispatchedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    const fetchEndTime = Date.now();

    if (events.length === 0) return;

    this.logger.debug(
      `📦 [Outbox] ${events.length} events à dispatcher (fetch: ${fetchEndTime - fetchStartTime}ms)`,
    );

    for (const event of events) {
      const eventDispatchStart = Date.now();
      const eventAge = eventDispatchStart - event.createdAt.getTime();

      this.logger.debug(`📨 [Outbox] Dispatch event ${event.kind}:`, {
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
        this.logger.debug(
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
    const payload = parseEventPayload(event.kind, event.payload);
    await this.retention.recordOutboxEvent(
      event.id,
      event.kind,
      payload,
      event.createdAt,
    );
    await this.onboarding.recordOutboxEvent(event.id, event.kind, payload);
    switch (event.kind) {
      case 'building.completed':
        await this.notifyBuildingCompleted(payload as BuildingCompletedPayload);
        break;
      case 'unit.training.completed':
        await this.notifyUnitTrainingCompleted(
          payload as UnitTrainingCompletedPayload,
        );
        break;
      case 'unit.trained':
        await this.notifyUnitTrained(payload as UnitTrainedPayload);
        break;
      case 'battle.sent':
        await this.notifyBattleSent(payload as BattleSentPayload);
        break;
      case 'battle.resolved':
        await this.notifyBattleResolved(payload as BattleResolvedPayload);
        break;
      case 'battle.returned':
        await this.notifyBattleReturned(payload as BattleReturnedPayload);
        break;
      case 'scout.sent':
        await this.notifyScoutSent(payload as ScoutSentPayload);
        break;
      case 'scout.reported':
        await this.notifyScoutReported(payload as ScoutReportedPayload);
        break;
      case 'scout.returned':
        await this.notifyScoutReturned(payload as ScoutReturnedPayload);
        break;
      case 'resources.changed':
        await this.notifyResourcesChanged(payload as ResourcesChangedPayload);
        break;
      case 'village.attacked':
        await this.notifyVillageAttacked(payload as VillageAttackedPayload);
        break;
      case 'village.conquered':
        this.notifyVillageConquered(payload as VillageConqueredPayload);
        break;
      case 'village.capture-window-opened':
        await this.notifyVillageCaptureWindowOpened(
          payload as VillageCaptureWindowOpenedPayload,
        );
        break;
      case 'village.capture-window-completed':
        this.notifyVillageCaptureWindowCompleted(
          payload as VillageCaptureWindowCompletedPayload,
        );
        break;
      case 'village.capture-window-interrupted':
        await this.notifyVillageCaptureWindowInterrupted(
          payload as VillageCaptureWindowInterruptedPayload,
        );
        break;
      case 'noble.killed':
        this.notifyNobleKilled(payload as NobleKilledPayload);
        break;
      case 'reinforcement.sent':
        await this.notifyReinforcementSent(payload as ReinforcementSentPayload);
        break;
      case 'reinforcement.recalled':
        await this.notifyReinforcementRecalled(
          payload as ReinforcementRecalledPayload,
        );
        break;
      case 'reinforcement.returned':
        await this.notifyReinforcementReturned(
          payload as ReinforcementReturnedPayload,
        );
        break;
      case 'caravan.sent':
        await this.notifyCaravanSent(payload as CaravanSentPayload);
        break;
      case 'caravan.arrived':
        await this.notifyCaravanArrived(payload as CaravanArrivedPayload);
        break;
      case 'caravan.recalled':
        await this.notifyCaravanRecalled(payload as CaravanRecalledPayload);
        break;
      case 'caravan.returned':
        await this.notifyCaravanReturned(payload as CaravanReturnedPayload);
        break;
      case 'expedition.recalled':
        await this.notifyExpeditionRecalled(
          payload as ExpeditionRecalledPayload,
        );
        break;
      case 'expedition.returned':
        await this.notifyExpeditionReturned(
          payload as ExpeditionReturnedPayload,
        );
        break;
      case 'garrison.added':
        await this.notifyGarrisonAdded(payload as GarrisonAddedPayload);
        break;
      case 'crowns.changed':
        this.notifyCrownsChanged(payload as CrownsChangedPayload);
        break;
      case 'rankings.changed':
        this.notifyRankingsChanged(payload as RankingsChangedPayload);
        break;
      case 'world.status.changed':
        this.notifyWorldStatusChanged(payload as WorldStatusChangedPayload);
        break;
      default: {
        const exhaustiveCheck: never = event.kind;
        this.logger.warn(`Unknown event kind: ${String(exhaustiveCheck)}`);
      }
    }
  }

  private notifyRankingsChanged(payload: RankingsChangedPayload) {
    this.gateway.notifyWorld(payload.worldId, 'rankings.changed', payload);
  }

  private async notifyBuildingCompleted(payload: BuildingCompletedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    const notifyTime = Date.now();
    this.logger.debug(
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

    this.logger.debug(`✅ [Outbox] Envoi WebSocket unit.training.completed:`, {
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

  private async notifyUnitTrained(payload: UnitTrainedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'unit.trained', payload);
  }

  private async notifyResourcesChanged(payload: ResourcesChangedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'resources.changed', payload);
  }

  private async notifyBattleSent(payload: BattleSentPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.logger.debug(`⚔️ [Outbox] Envoi WebSocket battle.sent:`, {
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

    this.logger.debug(`⚔️ [Outbox] Envoi WebSocket battle.resolved:`, {
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
      targetTier: payload.targetTier,
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

    this.logger.debug(`⚔️ [Outbox] Envoi WebSocket battle.returned:`, {
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

  private async notifyScoutSent(payload: ScoutSentPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'scout.sent', payload);
  }

  private async notifyScoutReported(payload: ScoutReportedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'scout.reported', payload);
  }

  private async notifyScoutReturned(payload: ScoutReturnedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'scout.returned', payload);
  }

  private async notifyVillageAttacked(payload: VillageAttackedPayload) {
    // Pour PvP : notifier le défenseur
    const defenderVillageId = payload.defenderVillageId;
    if (!defenderVillageId) return;

    const userId =
      payload.defenderUserId ??
      (await this.getUserIdByVillage(defenderVillageId));
    if (!userId) return;

    this.logger.debug(`🛡️ [Outbox] Envoi WebSocket village.attacked:`, {
      userId,
      attackerVillageId: payload.attackerVillageId,
      isDefenseSuccessful: payload.isDefenseSuccessful,
      casualtyRate: payload.casualtyRate,
    });

    const payloadForClient = {
      defenderVillageId: payload.defenderVillageId,
      defenderUserId: payload.defenderUserId,
      attackerVillageId: payload.attackerVillageId,
      attackerVillageName: payload.attackerVillageName,
      attackerX: payload.attackerX,
      attackerY: payload.attackerY,
      defenderVillageName: payload.defenderVillageName,
      isDefenseSuccessful: payload.isDefenseSuccessful,
      losses: payload.losses,
      reinforcementOriginVillageIds: payload.reinforcementOriginVillageIds,
      casualtyRate: payload.casualtyRate,
      resourcesLost: payload.resourcesLost,
      timestamp: payload.timestamp,
    };

    this.gateway.notifyUser(userId, 'village.attacked', payloadForClient);
    if (payload.observerUserId && payload.observerUserId !== userId) {
      this.gateway.notifyUser(payload.observerUserId, 'village.attacked', {
        ...payloadForClient,
        observerUserId: payload.observerUserId,
      });
    }
  }

  private notifyVillageConquered(payload: VillageConqueredPayload) {
    this.logger.debug(`🏰 [Outbox] Envoi WebSocket village.conquered:`, {
      newOwnerId: payload.newOwnerId,
      previousOwnerId: payload.previousOwnerId,
      villageId: payload.villageId,
      x: payload.x,
      y: payload.y,
    });

    const payloadForClient = {
      villageId: payload.villageId,
      villageName: payload.villageName,
      newOwnerId: payload.newOwnerId,
      previousOwnerId: payload.previousOwnerId,
      previousTier: payload.previousTier,
      x: payload.x,
      y: payload.y,
      buildingsKept: payload.buildingsKept,
    };

    this.gateway.notifyUser(
      payload.newOwnerId,
      'village.conquered',
      payloadForClient,
    );
    if (
      payload.previousOwnerId &&
      payload.previousOwnerId !== payload.newOwnerId
    ) {
      this.gateway.notifyUser(
        payload.previousOwnerId,
        'village.conquered',
        payloadForClient,
      );
    }
  }

  private async notifyVillageCaptureWindowOpened(
    payload: VillageCaptureWindowOpenedPayload,
  ) {
    const attackerUserId =
      payload.attackerUserId ??
      (await this.getAttackerUserIdByConquest(payload.pendingConquestId));
    if (!attackerUserId) return;
    this.gateway.notifyUser(
      attackerUserId,
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
    const attackerUserId =
      payload.attackerUserId ??
      (await this.getAttackerUserIdByConquest(payload.pendingConquestId));
    if (!attackerUserId) return;
    this.gateway.notifyUser(
      attackerUserId,
      'village.capture-window-interrupted',
      payload,
    );
  }

  private notifyNobleKilled(payload: NobleKilledPayload) {
    this.gateway.notifyUser(payload.attackerUserId, 'noble.killed', payload);
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

  private notifyWorldStatusChanged(payload: WorldStatusChangedPayload) {
    this.gateway.notifyWorld(payload.worldId, 'world.status.changed', payload);
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
    const recipientIds = await this.getUniqueUserIdsByVillages(
      payload.villageId,
      payload.hostVillageId,
    );

    for (const userId of recipientIds) {
      this.gateway.notifyUser(userId, 'reinforcement.returned', payload);
    }
  }

  private async notifyCaravanSent(payload: CaravanSentPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'caravan.sent', payload);
  }

  private async notifyCaravanArrived(payload: CaravanArrivedPayload) {
    const recipientIds = await this.getUniqueUserIdsByVillages(
      payload.villageId,
      payload.targetVillageId,
    );

    for (const userId of recipientIds) {
      this.gateway.notifyUser(userId, 'caravan.arrived', payload);
    }
  }

  private async notifyCaravanRecalled(payload: CaravanRecalledPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'caravan.recalled', payload);
  }

  private async notifyCaravanReturned(payload: CaravanReturnedPayload) {
    const userId = await this.getUserIdByVillage(payload.villageId);
    if (!userId) return;

    this.gateway.notifyUser(userId, 'caravan.returned', payload);
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

  private async getAttackerUserIdByConquest(
    pendingConquestId: string,
  ): Promise<string | null> {
    const conquest = await this.prisma.pendingConquest.findUnique({
      where: { id: pendingConquestId },
      select: { attackerUserId: true },
    });
    return conquest?.attackerUserId ?? null;
  }

  private async getUniqueUserIdsByVillages(
    ...villageIds: Array<string | undefined>
  ): Promise<string[]> {
    const uniqueVillageIds = [
      ...new Set(villageIds.filter(Boolean)),
    ] as string[];
    const userIds = await Promise.all(
      uniqueVillageIds.map((villageId) => this.getUserIdByVillage(villageId)),
    );
    return [
      ...new Set(userIds.filter((userId): userId is string => Boolean(userId))),
    ];
  }
}
