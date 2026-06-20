import type {
  EventKind,
  PayloadForKind,
  VillageAttackedPayload,
  VillageConqueredPayload,
  VillageCaptureWindowOpenedPayload,
  VillageCaptureWindowInterruptedPayload,
} from './event-types';
import type { VillageUserIdCache } from './event-outbox-prefetch';

export type NotificationRecipient =
  | { kind: 'user'; id: string }
  | { kind: 'world'; id: string };

export interface NotificationPlan {
  recipient: NotificationRecipient;
  payload: unknown;
}

export interface NotificationPlannerDeps {
  villageUserIdCache: VillageUserIdCache;
  getUserIdByVillage: (villageId: string) => Promise<string | null>;
  getAttackerUserIdByConquest: (
    pendingConquestId: string,
  ) => Promise<string | null>;
}

type AnyPlanner = (
  payload: unknown,
  deps: NotificationPlannerDeps,
) => NotificationPlan[] | Promise<NotificationPlan[]>;

function userRecipient(id: string): NotificationRecipient {
  return { kind: 'user', id };
}

function worldRecipient(id: string): NotificationRecipient {
  return { kind: 'world', id };
}

function readStringField(payload: unknown, field: string): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const value = (payload as Record<string, unknown>)[field];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Forward the payload to the owner of a single village resolved via cache. */
function userByVillage(field: string): AnyPlanner {
  return async (payload, deps) => {
    const villageId = readStringField(payload, field);
    if (!villageId) return [];
    const userId = await deps.getUserIdByVillage(villageId);
    return userId ? [{ recipient: userRecipient(userId), payload }] : [];
  };
}

/** Forward the payload to the owners of multiple villages, deduplicated. */
function usersByVillages(fields: readonly string[]): AnyPlanner {
  return async (payload, deps) => {
    const villageIds = new Set<string>();
    for (const field of fields) {
      const id = readStringField(payload, field);
      if (id) villageIds.add(id);
    }
    const userIds = new Set<string>();
    for (const villageId of villageIds) {
      const userId = await deps.getUserIdByVillage(villageId);
      if (userId) userIds.add(userId);
    }
    return [...userIds].map((id) => ({
      recipient: userRecipient(id),
      payload,
    }));
  };
}

/** Forward the payload to a userId carried directly in the payload. */
function directUser(field: string): AnyPlanner {
  return (payload) => {
    const userId = readStringField(payload, field);
    return userId ? [{ recipient: userRecipient(userId), payload }] : [];
  };
}

/** Broadcast the payload to all sockets joined to a world room. */
function directWorld(field: string): AnyPlanner {
  return (payload) => {
    const worldId = readStringField(payload, field);
    return worldId ? [{ recipient: worldRecipient(worldId), payload }] : [];
  };
}

/**
 * The defender receives the payload **without** observerUserId (privacy: the
 * observer is the original owner during a barbarian capture window — they
 * should not be revealed to the defender of the occupied village). The
 * observer, when distinct, gets the full payload including observerUserId.
 */
const planVillageAttacked: AnyPlanner = async (payload, deps) => {
  const typed = payload as VillageAttackedPayload;
  const defenderVillageId = typed.defenderVillageId;
  if (!defenderVillageId) return [];
  const defenderUserId =
    typed.defenderUserId ??
    (await deps.getUserIdByVillage(defenderVillageId)) ??
    undefined;
  if (!defenderUserId) return [];

  const payloadWithoutObserver: Record<string, unknown> = { ...typed };
  delete payloadWithoutObserver.observerUserId;

  const plans: NotificationPlan[] = [
    {
      recipient: userRecipient(defenderUserId),
      payload: payloadWithoutObserver,
    },
  ];
  if (typed.observerUserId && typed.observerUserId !== defenderUserId) {
    plans.push({
      recipient: userRecipient(typed.observerUserId),
      payload: {
        ...payloadWithoutObserver,
        observerUserId: typed.observerUserId,
      },
    });
  }
  return plans;
};

const planVillageConquered: AnyPlanner = (payload) => {
  const typed = payload as VillageConqueredPayload;
  const plans: NotificationPlan[] = [
    { recipient: userRecipient(typed.newOwnerId), payload: typed },
  ];
  if (typed.previousOwnerId && typed.previousOwnerId !== typed.newOwnerId) {
    plans.push({
      recipient: userRecipient(typed.previousOwnerId),
      payload: typed,
    });
  }
  return plans;
};

const planCaptureWindowOpened: AnyPlanner = async (payload, deps) => {
  const typed = payload as VillageCaptureWindowOpenedPayload;
  const attackerUserId =
    typed.attackerUserId ??
    (await deps.getAttackerUserIdByConquest(typed.pendingConquestId));
  return attackerUserId
    ? [{ recipient: userRecipient(attackerUserId), payload: typed }]
    : [];
};

const planCaptureWindowInterrupted: AnyPlanner = async (payload, deps) => {
  const typed = payload as VillageCaptureWindowInterruptedPayload;
  const attackerUserId =
    typed.attackerUserId ??
    (await deps.getAttackerUserIdByConquest(typed.pendingConquestId));
  return attackerUserId
    ? [{ recipient: userRecipient(attackerUserId), payload: typed }]
    : [];
};

const PLANNERS: Record<EventKind, AnyPlanner> = {
  'building.completed': userByVillage('villageId'),
  'unit.training.completed': userByVillage('villageId'),
  'unit.trained': userByVillage('villageId'),
  'battle.sent': userByVillage('villageId'),
  'battle.resolved': userByVillage('villageId'),
  'battle.returned': userByVillage('villageId'),
  'scout.sent': userByVillage('villageId'),
  'scout.reported': userByVillage('villageId'),
  'scout.returned': userByVillage('villageId'),
  'resources.changed': userByVillage('villageId'),
  'reinforcement.sent': userByVillage('villageId'),
  'reinforcement.recalled': userByVillage('villageId'),
  'reinforcement.returned': usersByVillages(['villageId', 'hostVillageId']),
  'caravan.sent': userByVillage('villageId'),
  'caravan.arrived': usersByVillages(['villageId', 'targetVillageId']),
  'caravan.recalled': userByVillage('villageId'),
  'caravan.returned': userByVillage('villageId'),
  'expedition.recalled': userByVillage('villageId'),
  'expedition.returned': userByVillage('villageId'),
  'garrison.added': userByVillage('villageId'),
  'village.attacked': planVillageAttacked,
  'village.conquered': planVillageConquered,
  'village.removed': directWorld('worldId'),
  'village.capture-window-opened': planCaptureWindowOpened,
  'village.capture-window-interrupted': planCaptureWindowInterrupted,
  'village.capture-window-completed': directUser('newOwnerUserId'),
  'noble.killed': directUser('attackerUserId'),
  'crowns.changed': directUser('userId'),
  'rankings.changed': directWorld('worldId'),
  'world.status.changed': directWorld('worldId'),
  'pvp.shield.broken': directUser('userId'),
};

export async function planNotifications<K extends EventKind>(
  kind: K,
  payload: PayloadForKind<K>,
  deps: NotificationPlannerDeps,
): Promise<NotificationPlan[]> {
  return PLANNERS[kind](payload, deps);
}
