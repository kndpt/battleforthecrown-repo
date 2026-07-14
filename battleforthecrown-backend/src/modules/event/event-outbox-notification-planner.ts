import type {
  EventKind,
  PayloadForKind,
  VillageAttackedPayload,
  VillageConqueredPayload,
  VillageCaptureWindowCompletedPayload,
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

/**
 * Fog-safe defender copy of a capture-window event: strips every attacker
 * identity/origin field so the besieged owner never learns who is capturing
 * them (mirror of {@link planVillageAttacked}'s observer scrub). The attacker
 * keeps their full copy.
 */
function scrubAttackerFields(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const defenderView = { ...payload };
  delete defenderView.attackerUserId;
  delete defenderView.attackerVillageId;
  return defenderView;
}

/**
 * Structural shape shared by the OPEN and INTERRUPTED capture-window payloads:
 * both carry a resolvable attacker (payload field or via the pending conquest)
 * plus a `targetVillageId` whose row still points to the defender.
 */
interface AttackerRoutedCaptureWindowPayload {
  pendingConquestId: string;
  targetVillageId: string;
  attackerUserId?: string;
}

/**
 * Routes a capture-window event to the attacker (full payload) and, when
 * distinct, to the current owner of the target village (attacker fields
 * scrubbed). During an OPEN or INTERRUPTED window the target's row still points
 * to its original owner — the transfer only happens at finalize — so the
 * defender is resolvable live via `getUserIdByVillage(targetVillageId)`. A
 * barbarian target yields no owner and is therefore never routed a defender
 * copy. Shared by `capture-window-opened` and `capture-window-interrupted`
 * (byte-identical routing); `capture-window-completed` differs and stays apart.
 */
const planCaptureWindowAttackerRouted: AnyPlanner = async (payload, deps) => {
  const typed = payload as AttackerRoutedCaptureWindowPayload;
  const attackerUserId =
    typed.attackerUserId ??
    (await deps.getAttackerUserIdByConquest(typed.pendingConquestId));

  const plans: NotificationPlan[] = [];
  if (attackerUserId) {
    plans.push({ recipient: userRecipient(attackerUserId), payload: typed });
  }

  const defenderUserId = await deps.getUserIdByVillage(typed.targetVillageId);
  if (defenderUserId && defenderUserId !== attackerUserId) {
    plans.push({
      recipient: userRecipient(defenderUserId),
      payload: scrubAttackerFields(typed as unknown as Record<string, unknown>),
    });
  }
  return plans;
};

/**
 * The completed event routes both the new owner (attacker) and the original
 * owner (defender who just lost the village). The previous owner is carried as
 * a snapshot in the payload — never resolved live, since `targetVillageId`
 * already points to the new owner by now.
 */
const planCaptureWindowCompleted: AnyPlanner = (payload) => {
  const typed = payload as VillageCaptureWindowCompletedPayload;
  const plans: NotificationPlan[] = [
    { recipient: userRecipient(typed.newOwnerUserId), payload: typed },
  ];
  if (
    typed.previousOwnerUserId &&
    typed.previousOwnerUserId !== typed.newOwnerUserId
  ) {
    plans.push({
      recipient: userRecipient(typed.previousOwnerUserId),
      payload: typed,
    });
  }
  return plans;
};

const PLANNERS: Record<EventKind, AnyPlanner> = {
  'building.completed': userByVillage('villageId'),
  'unit.training.completed': userByVillage('villageId'),
  'unit.trained': userByVillage('villageId'),
  'battle.sent': userByVillage('villageId'),
  // Routed to the defender only: targetVillageId resolves to its owner; a
  // barbarian target (userId = null) yields no recipient, so it is never sent.
  'attack.incoming': userByVillage('targetVillageId'),
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
  'village.capture-window-opened': planCaptureWindowAttackerRouted,
  'village.capture-window-interrupted': planCaptureWindowAttackerRouted,
  'village.capture-window-completed': planCaptureWindowCompleted,
  'noble.killed': directUser('attackerUserId'),
  'crowns.changed': directUser('userId'),
  'rankings.changed': directWorld('worldId'),
  'rankings.cycle.closed': directWorld('worldId'),
  'world.status.changed': directWorld('worldId'),
  'world.planned.created': directWorld('worldId'),
  'world.inscription-phase.changed': directWorld('worldId'),
  'pvp.shield.broken': directUser('userId'),
  'intel.updated': directUser('userId'),
  'extraction.started': userByVillage('villageId'),
  'extraction.depleted': directWorld('worldId'),
  'extraction.attacked': userByVillage('villageId'),
  'extraction.returned': userByVillage('villageId'),
};

export async function planNotifications<K extends EventKind>(
  kind: K,
  payload: PayloadForKind<K>,
  deps: NotificationPlannerDeps,
): Promise<NotificationPlan[]> {
  return PLANNERS[kind](payload, deps);
}
