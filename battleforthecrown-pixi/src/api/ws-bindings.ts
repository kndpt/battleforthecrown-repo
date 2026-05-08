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
    villageId: payload.villageId,
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

export function applyVillageAttacked(
  payload: VillageAttackedPayload,
  _ctx?: BindingsContext,
): void {
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

function resolveOrigin(villageId: string): { x: number; y: number } {
  const entity = useWorldMapStore.getState().entities[villageId];
  if (entity) return { x: entity.x, y: entity.y };
  return { x: 0, y: 0 };
}

// Exhaustive map: TypeScript enforces a binding for every key of ServerEvents.
// Adding a new event in shared without registering it here breaks the build.
const bindings: ServerEventBindings = {
  'resources.changed': applyResourcesChanged,
  'crowns.changed': applyCrownsChanged,
  'building.completed': applyBuildingCompleted,
  'unit.training.completed': applyUnitTrainingCompleted,
  'battle.sent': applyBattleSent,
  'battle.resolved': applyBattleResolved,
  'battle.returned': applyBattleReturned,
  'village.attacked': applyVillageAttacked,
  'village.conquered': applyVillageConquered,
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
