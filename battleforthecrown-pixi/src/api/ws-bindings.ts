import type { QueryClient } from '@tanstack/react-query';
import { gameSocket } from './ws';
import { queryKeys } from './queries';
import type {
  BattleResolvedPayload,
  BattleReturnedPayload,
  BattleSentPayload,
  BuildingCompletedPayload,
  CrownsChangedPayload,
  ResourcesChangedPayload,
  ServerEventName,
  ServerEvents,
  UnitTrainingCompletedPayload,
  VillageAttackedPayload,
  VillageCaptureWindowCompletedPayload,
  VillageCaptureWindowInterruptedPayload,
  VillageCaptureWindowOpenedPayload,
  VillageConqueredPayload,
} from './ws-types';
import { useResourcesStore } from '@/stores/resources';
import { useCrownsStore } from '@/stores/crowns';
import { useUiStore } from '@/stores/ui';
import { useExpeditionsStore, type ExpeditionSnapshot } from '@/stores/expeditions';
import { useWorldMapStore } from '@/stores/worldMap';
import {
  RESOLVED_TO_RETURNING_DELAY_MS,
  RETURNED_TO_CLEANUP_DELAY_MS,
} from '@/lib/expeditionTiming';
import { buildRecalledExpeditionPatch } from '@/lib/expeditionRecall';

export interface BindingsContext {
  queryClient: QueryClient;
}

type ServerEventListener<K extends ServerEventName> = (
  payload: ServerEvents[K],
  ctx: BindingsContext,
) => void;

// Phase-transition timers in flight. Cleared on bindServerEvents teardown so
// pending store updates don't fire after the gateway is gone (e.g. on logout).
const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();
const scheduleTimeout = (fn: () => void, ms: number): void => {
  const id = setTimeout(() => {
    pendingTimeouts.delete(id);
    fn();
  }, ms);
  pendingTimeouts.add(id);
};

type ServerEventBindings = {
  [K in ServerEventName]: ServerEventListener<K>;
};

export function applyResourcesChanged(
  payload: ResourcesChangedPayload,
  _ctx?: BindingsContext,
): void {
  useResourcesStore.getState().setResources({
    villageId: payload.villageId,
    wood: payload.wood,
    stone: payload.stone,
    iron: payload.iron,
    maxPerType: payload.maxPerType,
    productionRates: payload.productionRates,
    lastUpdateTs: Date.parse(payload.lastUpdateTs),
  });
}

export function applyCrownsChanged(
  payload: CrownsChangedPayload,
  _ctx?: BindingsContext,
): void {
  useCrownsStore.getState().setCrowns({
    userId: payload.userId,
    worldId: payload.worldId,
    balance: payload.balance,
    productionRate: payload.productionRate,
    lastUpdateTs: Date.parse(payload.lastUpdateTs),
  });
}

export function applyBuildingCompleted(
  payload: BuildingCompletedPayload,
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({ queryKey: ['buildings', payload.villageId] });
  ctx.queryClient.invalidateQueries({ queryKey: ['queue', payload.villageId] });
  ctx.queryClient.invalidateQueries({ queryKey: ['population', payload.villageId] });
  ctx.queryClient.invalidateQueries({ queryKey: ['resources', payload.villageId] });
  useUiStore.getState().pushToast({
    tone: 'success',
    title: 'Construction terminée',
    description: `${payload.buildingType} niveau ${payload.level}`,
    ttlMs: 4000,
  });
}

export function applyUnitTrainingCompleted(
  payload: UnitTrainingCompletedPayload,
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.armyTraining(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.population(payload.villageId) });
  useUiStore.getState().pushToast({
    tone: 'success',
    title: 'Entraînement terminé',
    description: `${payload.completedQty} ${payload.unitType}`,
    ttlMs: 4000,
  });
}

export function applyBattleSent(
  payload: BattleSentPayload,
  _ctx?: BindingsContext,
): void {
  const origin = resolveOrigin(payload.villageId);
  const snapshot: ExpeditionSnapshot = {
    expeditionId: payload.expeditionId,
    kind: 'ATTACK',
    villageId: payload.villageId,
    originVillageId: payload.villageId,
    targetVillageId: getString(payload, 'targetRefId'),
    origin,
    target: { x: payload.targetX, y: payload.targetY },
    targetKind: payload.targetKind,
    phase: 'EN_ROUTE',
    departAt: Date.now(),
    arrivalAt: Date.parse(payload.arrivalAt),
  };
  useExpeditionsStore.getState().add(snapshot);
}

export function applyBattleResolved(payload: BattleResolvedPayload, ctx: BindingsContext): void {
  useExpeditionsStore.getState().update(payload.expeditionId, {
    phase: 'RESOLVED',
    isVictory: payload.isVictory,
    reportId: payload.reportId,
    villageName: payload.villageName,
    targetName: payload.targetName,
    target: { x: payload.targetX, y: payload.targetY },
    arrivalAt: Date.now(),
    returnAt: Date.parse(payload.returnAt),
  });
  // Wait for the FX flash to finish before troops turn back. Source of truth
  // for the delay lives in `lib/expeditionTiming` alongside the flash duration.
  scheduleTimeout(() => {
    useExpeditionsStore.getState().update(payload.expeditionId, { phase: 'RETURNING' });
  }, RESOLVED_TO_RETURNING_DELAY_MS);

  ctx.queryClient.invalidateQueries({ queryKey: ['resources', payload.villageId] });
  // Population freed for dead attacker units — see backend combat.worker:sumPopulationCost.
  ctx.queryClient.invalidateQueries({ queryKey: ['population', payload.villageId] });
  // A new combat report just landed on the server. Tell TanStack to refetch the
  // reports list so the unread bubble in the bottom nav updates without waiting
  // on the 10s staleTime.
  ctx.queryClient.invalidateQueries({ queryKey: ['combat', 'reports'] });
  useUiStore.getState().pushToast({
    tone: payload.isVictory ? 'success' : 'error',
    title: payload.isVictory ? 'Victoire' : 'Défaite',
    description: `${payload.villageName} → ${payload.targetName}`,
    ttlMs: 5000,
  });
}

export function applyBattleReturned(payload: BattleReturnedPayload, ctx: BindingsContext): void {
  useExpeditionsStore.getState().update(payload.expeditionId, { phase: 'RETURNED' });
  scheduleTimeout(() => {
    useExpeditionsStore.getState().remove(payload.expeditionId);
  }, RETURNED_TO_CLEANUP_DELAY_MS);
  ctx.queryClient.invalidateQueries({ queryKey: ['resources', payload.villageId] });
  ctx.queryClient.invalidateQueries({ queryKey: ['army', payload.villageId] });
}

export function applyExpeditionRecalled(
  payload: ServerEvents['expedition.recalled'],
  _ctx: BindingsContext,
): void {
  const store = useExpeditionsStore.getState();
  const current = store.byId[payload.expeditionId];
  const returnAt = Date.parse(payload.returnAt);
  store.update(
    payload.expeditionId,
    current
      ? current.phase === 'RETURNING'
        ? { phase: 'RETURNING', returnAt }
        : buildRecalledExpeditionPatch(current, Date.now(), returnAt)
      : {
          phase: 'RETURNING',
          returnAt,
        },
  );
  useUiStore.getState().pushToast({
    tone: 'warning',
    title: 'Armée rappelée',
    description: `Retour prévu à ${new Date(payload.returnAt).toLocaleTimeString()}`,
    ttlMs: 4000,
  });
}

export function applyExpeditionReturned(
  payload: ServerEvents['expedition.returned'],
  ctx: BindingsContext,
): void {
  useExpeditionsStore.getState().update(payload.expeditionId, { phase: 'RETURNED' });
  scheduleTimeout(() => {
    useExpeditionsStore.getState().remove(payload.expeditionId);
  }, RETURNED_TO_CLEANUP_DELAY_MS);
  ctx.queryClient.invalidateQueries({ queryKey: ['army', payload.villageId] });
  ctx.queryClient.invalidateQueries({ queryKey: ['resources', payload.villageId] });
}

export function applyReinforcementSent(
  payload: ServerEvents['reinforcement.sent'],
  ctx: BindingsContext,
): void {
  const expeditionId = resolveExpeditionId(payload, [
    'reinforcement',
    'sent',
    payload.villageId,
    payload.targetVillageId,
    getString(payload, 'arrivalAt') ?? `${Date.now()}`,
  ]);
  const snapshot: ExpeditionSnapshot = {
    expeditionId,
    kind: 'REINFORCE',
    villageId: payload.villageId,
    originVillageId: payload.villageId,
    targetVillageId: payload.targetVillageId,
    origin: resolveOrigin(payload.villageId),
    target: resolveOrigin(payload.targetVillageId),
    targetKind: 'PLAYER_VILLAGE',
    phase: 'EN_ROUTE',
    departAt: parseEventDate(payload, 'departAt') ?? Date.now(),
    arrivalAt: parseEventDate(payload, 'arrivalAt') ?? Date.now(),
  };
  useExpeditionsStore.getState().add(snapshot);
  invalidateReinforcementQueries(ctx, payload.villageId, payload.targetVillageId);
}

export function applyReinforcementRecalled(
  payload: ServerEvents['reinforcement.recalled'],
  ctx: BindingsContext,
): void {
  const expeditionId = resolveExpeditionId(payload, [
    'reinforcement',
    'recalled',
    payload.villageId,
    payload.originVillageId,
    getString(payload, 'arrivalAt') ?? `${Date.now()}`,
  ]);
  const snapshot: ExpeditionSnapshot = {
    expeditionId,
    kind: 'REINFORCE',
    villageId: payload.villageId,
    originVillageId: payload.originVillageId,
    targetVillageId: payload.originVillageId,
    origin: resolveOrigin(payload.villageId),
    target: resolveOrigin(payload.originVillageId),
    targetKind: 'PLAYER_VILLAGE',
    phase: 'EN_ROUTE',
    departAt: parseEventDate(payload, 'departAt') ?? Date.now(),
    arrivalAt: parseEventDate(payload, 'arrivalAt') ?? Date.now(),
  };
  useExpeditionsStore.getState().add(snapshot);
  invalidateReinforcementQueries(ctx, payload.villageId, payload.originVillageId);
}

export function applyReinforcementReturned(
  payload: ServerEvents['reinforcement.returned'],
  ctx: BindingsContext,
): void {
  const expeditionId = getString(payload, 'expeditionId');
  if (expeditionId) {
    markExpeditionReturned(expeditionId);
  } else {
    markReturnedReinforcementSnapshots(payload.villageId, getString(payload, 'originVillageId'));
  }
  invalidateReinforcementQueries(
    ctx,
    payload.villageId,
    getString(payload, 'originVillageId'),
    getString(payload, 'targetVillageId'),
  );
}

export function applyGarrisonAdded(
  payload: ServerEvents['garrison.added'],
  ctx: BindingsContext,
): void {
  invalidateReinforcementQueries(
    ctx,
    payload.villageId,
    getString(payload, 'originVillageId'),
    getString(payload, 'targetVillageId'),
  );
}

export function applyVillageAttacked(
  payload: VillageAttackedPayload,
  ctx: BindingsContext,
): void {
  // Defender lost units → population was released server-side. Refresh the HUD.
  ctx.queryClient.invalidateQueries({ queryKey: ['population', payload.defenderVillageId] });
  ctx.queryClient.invalidateQueries({ queryKey: ['army', payload.defenderVillageId] });
  useUiStore.getState().pushToast({
    tone: payload.isDefenseSuccessful ? 'success' : 'error',
    title: payload.isDefenseSuccessful ? 'Attaque repoussée' : 'Village attaqué',
    description: `${payload.attackerVillageName} (${payload.attackerX},${payload.attackerY})`,
    ttlMs: 6000,
  });
}

export function applyVillageConquered(payload: VillageConqueredPayload, ctx: BindingsContext): void {
  ctx.queryClient.invalidateQueries({ queryKey: ['memberships'] });
  ctx.queryClient.invalidateQueries({ queryKey: ['villages'] });
  ctx.queryClient.invalidateQueries({ queryKey: ['world-entities'] });
  // Mark the entity as conquered on the map by simply removing it; the next
  // refetch will reinsert it under the new owner.
  useWorldMapStore.getState().removeEntity(payload.villageId);
  useUiStore.getState().pushToast({
    tone: 'warning',
    title: 'Village conquis',
    description: `(${payload.x}, ${payload.y})`,
    ttlMs: 6000,
  });
}

export function applyVillageCaptureWindowOpened(
  payload: VillageCaptureWindowOpenedPayload,
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({ queryKey: ['world-entities'] });
  useUiStore.getState().pushToast({
    tone: 'warning',
    title: 'Capture en cours',
    description: `Fin prévue à ${new Date(payload.captureUntil).toLocaleTimeString()}`,
    ttlMs: 6000,
  });
}

export function applyVillageCaptureWindowCompleted(
  payload: VillageCaptureWindowCompletedPayload,
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({ queryKey: ['memberships'] });
  ctx.queryClient.invalidateQueries({ queryKey: ['villages'] });
  ctx.queryClient.invalidateQueries({ queryKey: ['world-entities'] });
  useUiStore.getState().pushToast({
    tone: 'success',
    title: 'Capture terminée',
    description: payload.targetVillageId,
    ttlMs: 6000,
  });
}

export function applyVillageCaptureWindowInterrupted(
  payload: VillageCaptureWindowInterruptedPayload,
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({ queryKey: ['world-entities'] });
  useUiStore.getState().pushToast({
    tone: 'error',
    title: 'Capture interrompue',
    description: payload.reason,
    ttlMs: 6000,
  });
}

export function applyNobleKilled(
  payload: ServerEvents['noble.killed'],
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(payload.attackerVillageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.population(payload.attackerVillageId) });
  useUiStore.getState().pushToast({
    tone: 'error',
    title: 'Seigneur perdu',
    description: 'Conquête échouée',
    ttlMs: 6000,
  });
}

function resolveOrigin(villageId: string): { x: number; y: number } {
  const entity = useWorldMapStore.getState().entities[villageId];
  if (entity) return { x: entity.x, y: entity.y };
  return { x: 0, y: 0 };
}

// Exhaustive map: TypeScript enforces a binding for every key of ServerEvents.
// Adding a new event in shared without registering it here breaks the build.
function getString(payload: unknown, key: string): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function parseEventDate(payload: unknown, key: string): number | undefined {
  const value = getString(payload, key);
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function resolveExpeditionId(payload: unknown, fallbackParts: string[]): string {
  return getString(payload, 'expeditionId') ?? fallbackParts.join(':');
}

function markExpeditionReturned(expeditionId: string): void {
  useExpeditionsStore.getState().update(expeditionId, { phase: 'RETURNED' });
  scheduleTimeout(() => {
    useExpeditionsStore.getState().remove(expeditionId);
  }, RETURNED_TO_CLEANUP_DELAY_MS);
}

function markReturnedReinforcementSnapshots(villageId: string, originVillageId?: string): void {
  const store = useExpeditionsStore.getState();
  const expeditionIds = Object.values(store.byId)
    .filter((snapshot) => {
      if (snapshot.kind !== 'REINFORCE') return false;
      if (!originVillageId) {
        return snapshot.villageId === villageId || snapshot.targetVillageId === villageId;
      }
      return (
        snapshot.villageId === villageId ||
        snapshot.targetVillageId === villageId ||
        snapshot.originVillageId === originVillageId ||
        snapshot.targetVillageId === originVillageId
      );
    })
    .map((snapshot) => snapshot.expeditionId);

  for (const expeditionId of expeditionIds) {
    markExpeditionReturned(expeditionId);
  }
}

function invalidateReinforcementQueries(
  ctx: BindingsContext,
  ...villageIds: Array<string | undefined>
): void {
  const uniqueVillageIds = new Set(villageIds.filter((villageId): villageId is string => Boolean(villageId)));
  for (const villageId of uniqueVillageIds) {
    ctx.queryClient.invalidateQueries({ queryKey: queryKeys.activeExpeditions(villageId) });
    ctx.queryClient.invalidateQueries({ queryKey: queryKeys.garrison(villageId) });
    ctx.queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
  }
}

const bindings: ServerEventBindings = {
  'resources.changed': applyResourcesChanged,
  'crowns.changed': applyCrownsChanged,
  'building.completed': applyBuildingCompleted,
  'unit.training.completed': applyUnitTrainingCompleted,
  'battle.sent': applyBattleSent,
  'battle.resolved': applyBattleResolved,
  'battle.returned': applyBattleReturned,
  'expedition.recalled': applyExpeditionRecalled,
  'expedition.returned': applyExpeditionReturned,
  'reinforcement.sent': applyReinforcementSent,
  'reinforcement.recalled': applyReinforcementRecalled,
  'reinforcement.returned': applyReinforcementReturned,
  'garrison.added': applyGarrisonAdded,
  'village.attacked': applyVillageAttacked,
  'village.conquered': applyVillageConquered,
  'village.capture-window-opened': applyVillageCaptureWindowOpened,
  'village.capture-window-completed': applyVillageCaptureWindowCompleted,
  'village.capture-window-interrupted': applyVillageCaptureWindowInterrupted,
  'noble.killed': applyNobleKilled,
};

export function bindServerEvents(ctx: BindingsContext): () => void {
  const offs: Array<() => void> = [];
  for (const eventName of Object.keys(bindings) as ServerEventName[]) {
    const handler = bindings[eventName] as ServerEventListener<typeof eventName>;
    offs.push(
      gameSocket.on(eventName, (payload) => {
        handler(payload, ctx);
      }),
    );
  }
  return () => {
    for (const off of offs) {
      off();
    }
    for (const id of pendingTimeouts) clearTimeout(id);
    pendingTimeouts.clear();
  };
}
