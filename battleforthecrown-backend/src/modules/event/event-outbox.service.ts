import { Injectable, Logger } from '@nestjs/common';
import type { EventOutbox } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { GameGateway } from './game.gateway';
import { parseEventPayload } from './codecs';
import {
  collectVillageIdsFromOutboxEvents,
  resolveVillageUserIdCache,
  type VillageUserIdCache,
} from './event-outbox-prefetch';
import { RetentionService } from '../retention/retention.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import {
  planNotifications,
  type NotificationPlannerDeps,
} from './event-outbox-notification-planner';
import {
  EVENT_PAYLOAD_SCHEMAS,
  type EventKind,
  type PayloadForKind,
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

    const villageUserIdCache = await resolveVillageUserIdCache(
      () => this.prefetchVillageUserIds(events),
      (error) => {
        this.logger.warn(
          'Outbox village→user prefetch failed; continuing with fallback village lookups.',
          error,
        );
      },
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
        await this.dispatchEvent(event, villageUserIdCache);
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

  private async dispatchEvent(
    event: EventOutbox,
    villageUserIdCache: VillageUserIdCache,
  ) {
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
    await this.emitToRecipients(event.kind, payload, villageUserIdCache);
  }

  private async emitToRecipients<K extends EventKind>(
    kind: K,
    payload: PayloadForKind<K>,
    villageUserIdCache: VillageUserIdCache,
  ) {
    const deps: NotificationPlannerDeps = {
      villageUserIdCache,
      getUserIdByVillage: (villageId) =>
        this.getUserIdByVillage(villageId, villageUserIdCache),
      getAttackerUserIdByConquest: (pendingConquestId) =>
        this.getAttackerUserIdByConquest(pendingConquestId),
    };

    const plans = await planNotifications(kind, payload, deps);
    for (const plan of plans) {
      if (plan.recipient.kind === 'user') {
        this.gateway.notifyUser(
          plan.recipient.id,
          kind,
          plan.payload as PayloadForKind<K>,
        );
      } else {
        this.gateway.notifyWorld(
          plan.recipient.id,
          kind,
          plan.payload as PayloadForKind<K>,
        );
      }
    }
  }

  private async prefetchVillageUserIds(
    events: EventOutbox[],
  ): Promise<Map<string, string | null>> {
    const villageIds = collectVillageIdsFromOutboxEvents(events);

    if (villageIds.length === 0) {
      return new Map();
    }

    const villages = await this.prisma.village.findMany({
      where: { id: { in: villageIds } },
      select: { id: true, userId: true },
    });

    const villageUserIdByVillageId = new Map<string, string | null>();
    for (const villageId of villageIds) {
      villageUserIdByVillageId.set(villageId, null);
    }
    for (const village of villages) {
      villageUserIdByVillageId.set(village.id, village.userId);
    }

    return villageUserIdByVillageId;
  }

  private async getUserIdByVillage(
    villageId: string,
    villageUserIdCache: VillageUserIdCache,
  ): Promise<string | null> {
    const cachedUserId = villageUserIdCache.get(villageId);
    if (cachedUserId !== undefined) {
      return cachedUserId;
    }

    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      select: { userId: true },
    });
    const userId = village?.userId || null;
    villageUserIdCache.set(villageId, userId);
    return userId;
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
}
