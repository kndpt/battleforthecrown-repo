import type { QueryClient } from '@tanstack/react-query';
import { gameSocket } from './ws';
import { queryKeys } from './queries';
import type {
  BattleResolvedPayload,
  BattleReturnedPayload,
  BattleSentPayload,
  BuildingCompletedPayload,
  CrownsChangedPayload,
  RankingsChangedPayload,
  ResourcesChangedPayload,
  ScoutReportedPayload,
  ScoutReturnedPayload,
  ScoutSentPayload,
  ServerEventName,
  ServerEvents,
  UnitTrainingCompletedPayload,
  UnitTrainedPayload,
  VillageAttackedPayload,
  VillageCaptureWindowCompletedPayload,
  VillageCaptureWindowInterruptedPayload,
  VillageCaptureWindowOpenedPayload,
  VillageConqueredPayload,
  WorldStatusChangedPayload,
} from './ws-types';
import { useResourcesStore } from '@/stores/resources';
import { useCrownsStore } from '@/stores/crowns';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { useExpeditionsStore, type ExpeditionSnapshot } from '@/stores/expeditions';
import { useGameStore } from '@/stores/game';
import { useWorldMapStore } from '@/stores/worldMap';
import { unitMetaFor } from '@/features/army/unitConfig';
import { metaFor as buildingMetaFor } from '@/features/village/buildingMeta';
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

export function applyRankingsChanged(
  payload: RankingsChangedPayload,
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({
    queryKey: queryKeys.rankingsSummary(payload.worldId),
  });
}

export function applyWorldStatusChanged(
  payload: WorldStatusChangedPayload,
  ctx: BindingsContext,
): void {
  const userId = useAuthStore.getState().user?.id ?? null;
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.publicWorlds() });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.worlds() });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships(userId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.worldConfig(payload.worldId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.worldConfigFull(payload.worldId) });
}

export function applyBuildingCompleted(
  payload: BuildingCompletedPayload,
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.buildings(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.queue(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.population(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.resources(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.villageStrategy(payload.villageId) });
  invalidatePowerQueries(ctx, payload.villageId);
  invalidateRetentionSummary(ctx);
  invalidateOnboardingSummary(ctx);
  if (payload.buildingType === 'CASTLE') {
    invalidateVillageVisualQueries(ctx);
  }
  useUiStore.getState().pushToast({
    tone: 'success',
    title: 'Construction terminée',
    description: `${buildingMetaFor(payload.buildingType).label} niveau ${payload.level}`,
    ttlMs: 4000,
  });
}

export function applyUnitTrained(
  payload: UnitTrainedPayload,
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.armyTraining(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.population(payload.villageId) });
  invalidatePowerQueries(ctx, payload.villageId);
  invalidateRetentionSummary(ctx);
  invalidateOnboardingSummary(ctx);
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
    description: `${payload.completedQty} ${formatUnitName(payload.unitType, payload.completedQty)}`,
    ttlMs: 4000,
  });
}

export function applyBattleSent(
  payload: BattleSentPayload,
  ctx: BindingsContext,
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
  invalidateOpenExpeditions(ctx);
}

export function applyBattleResolved(payload: BattleResolvedPayload, ctx: BindingsContext): void {
  const returnAt = payload.returnAt ? Date.parse(payload.returnAt) : undefined;

  useExpeditionsStore.getState().update(payload.expeditionId, {
    phase: 'RESOLVED',
    isVictory: payload.isVictory,
    reportId: payload.reportId,
    villageName: payload.villageName,
    targetName: payload.targetName,
    target: { x: payload.targetX, y: payload.targetY },
    arrivalAt: Date.now(),
    returnAt,
  });
  // Wait for the FX flash to finish before troops turn back. Source of truth
  // for the delay lives in `lib/expeditionTiming` alongside the flash duration.
  scheduleTimeout(() => {
    if (returnAt) {
      useExpeditionsStore.getState().update(payload.expeditionId, { phase: 'RETURNING' });
      return;
    }
    useExpeditionsStore.getState().remove(payload.expeditionId);
  }, RESOLVED_TO_RETURNING_DELAY_MS);

  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.resources(payload.villageId) });
  // Population freed for dead attacker units — see backend combat.worker:sumPopulationCost.
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.population(payload.villageId) });
  invalidatePowerQueries(ctx, payload.villageId);
  invalidateCombatReports(ctx);
  invalidateOpenExpeditions(ctx);
  invalidateRetentionSummary(ctx);
  invalidateOnboardingSummary(ctx);
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
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.resources(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(payload.villageId) });
  invalidatePowerQueries(ctx, payload.villageId);
  invalidateOpenExpeditions(ctx);
}

export function applyScoutSent(
  payload: ScoutSentPayload,
  ctx: BindingsContext,
): void {
  const origin = resolveOrigin(payload.villageId);
  const snapshot: ExpeditionSnapshot = {
    expeditionId: payload.expeditionId,
    kind: 'SCOUT',
    villageId: payload.villageId,
    originVillageId: payload.villageId,
    origin,
    target: { x: payload.targetX, y: payload.targetY },
    targetKind: payload.targetKind,
    phase: 'EN_ROUTE',
    departAt: Date.now(),
    arrivalAt: Date.parse(payload.arrivalAt),
  };
  useExpeditionsStore.getState().add(snapshot);
  invalidateOpenExpeditions(ctx);
}

export function applyScoutReported(
  payload: ScoutReportedPayload,
  ctx: BindingsContext,
): void {
  useExpeditionsStore.getState().update(payload.expeditionId, {
    phase: 'RESOLVED',
    reportId: payload.reportId,
    targetName: payload.targetName ?? undefined,
    target: { x: payload.targetX, y: payload.targetY },
    arrivalAt: Date.now(),
    returnAt: Date.parse(payload.returnAt),
  });
  scheduleTimeout(() => {
    useExpeditionsStore.getState().update(payload.expeditionId, { phase: 'RETURNING' });
  }, RESOLVED_TO_RETURNING_DELAY_MS);
  invalidateCombatReports(ctx);
  invalidateOpenExpeditions(ctx);
  invalidateRetentionSummary(ctx);
}

export function applyScoutReturned(
  payload: ScoutReturnedPayload,
  ctx: BindingsContext,
): void {
  useExpeditionsStore.getState().update(payload.expeditionId, { phase: 'RETURNED' });
  scheduleTimeout(() => {
    useExpeditionsStore.getState().remove(payload.expeditionId);
  }, RETURNED_TO_CLEANUP_DELAY_MS);
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(payload.villageId) });
  invalidateOpenExpeditions(ctx);
}

export function applyExpeditionRecalled(
  payload: ServerEvents['expedition.recalled'],
  ctx: BindingsContext,
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
  invalidateOpenExpeditions(ctx);
}

export function applyExpeditionReturned(
  payload: ServerEvents['expedition.returned'],
  ctx: BindingsContext,
): void {
  useExpeditionsStore.getState().update(payload.expeditionId, { phase: 'RETURNED' });
  scheduleTimeout(() => {
    useExpeditionsStore.getState().remove(payload.expeditionId);
  }, RETURNED_TO_CLEANUP_DELAY_MS);
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.resources(payload.villageId) });
  invalidateOpenExpeditions(ctx);
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
  invalidateOpenExpeditions(ctx);
  invalidateRetentionSummary(ctx);
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
  invalidateOpenExpeditions(ctx);
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
    getString(payload, 'hostVillageId'),
  );
  invalidateOpenExpeditions(ctx);
  invalidateRetentionSummary(ctx);
  invalidateReinforcementReports(ctx);
}

export function applyCaravanSent(
  payload: ServerEvents['caravan.sent'],
  ctx: BindingsContext,
): void {
  const snapshot: ExpeditionSnapshot = {
    expeditionId: payload.expeditionId,
    kind: 'CARAVAN',
    villageId: payload.villageId,
    originVillageId: payload.villageId,
    targetVillageId: payload.targetVillageId,
    origin: resolveOrigin(payload.villageId),
    target: { x: payload.targetX, y: payload.targetY },
    targetKind: 'PLAYER_VILLAGE',
    phase: 'EN_ROUTE',
    departAt: Date.now(),
    arrivalAt: Date.parse(payload.arrivalAt),
  };
  useExpeditionsStore.getState().add(snapshot);
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.resources(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.population(payload.villageId) });
  invalidateOpenExpeditions(ctx);
}

export function applyCaravanArrived(
  payload: ServerEvents['caravan.arrived'],
  ctx: BindingsContext,
): void {
  useExpeditionsStore.getState().update(payload.expeditionId, {
    phase: 'RETURNING',
    returnAt: Date.parse(payload.returnAt),
  });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.resources(payload.targetVillageId) });
  invalidateOpenExpeditions(ctx);
}

export function applyCaravanRecalled(
  payload: ServerEvents['caravan.recalled'],
  ctx: BindingsContext,
): void {
  const store = useExpeditionsStore.getState();
  const current = store.byId[payload.expeditionId];
  const returnAt = Date.parse(payload.returnAt);
  if (current) {
    store.update(
      payload.expeditionId,
      current.phase === 'RETURNING'
        ? { phase: 'RETURNING', returnAt }
        : buildRecalledExpeditionPatch(current, Date.now(), returnAt),
    );
  } else {
    const now = Date.now();
    store.add({
      expeditionId: payload.expeditionId,
      kind: 'CARAVAN',
      villageId: payload.villageId,
      originVillageId: payload.villageId,
      targetVillageId: payload.targetVillageId,
      origin: resolveOrigin(payload.villageId),
      target: resolveOrigin(payload.targetVillageId),
      targetKind: 'PLAYER_VILLAGE',
      phase: 'RETURNING',
      departAt: now,
      arrivalAt: now,
      returnAt,
    });
  }
  useUiStore.getState().pushToast({
    tone: 'warning',
    title: 'Caravane rappelée',
    description: `Retour prévu à ${new Date(payload.returnAt).toLocaleTimeString()}`,
    ttlMs: 4000,
  });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.resources(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.population(payload.villageId) });
  invalidateOpenExpeditions(ctx);
}

export function applyCaravanReturned(
  payload: ServerEvents['caravan.returned'],
  ctx: BindingsContext,
): void {
  markExpeditionReturned(payload.expeditionId);
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.resources(payload.villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.population(payload.villageId) });
  invalidateOpenExpeditions(ctx);
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
  invalidateOpenExpeditions(ctx);
  invalidateReinforcementReports(ctx);
}

export function applyVillageAttacked(
  payload: VillageAttackedPayload,
  ctx: BindingsContext,
): void {
  // Defender lost units → population was released server-side. Refresh the HUD.
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.population(payload.defenderVillageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(payload.defenderVillageId) });
  invalidatePowerQueries(ctx, payload.defenderVillageId);
  for (const originVillageId of payload.reinforcementOriginVillageIds ?? []) {
    invalidatePowerQueries(ctx, originVillageId);
  }
  invalidateCombatReports(ctx);
  useUiStore.getState().pushToast({
    tone: payload.isDefenseSuccessful ? 'success' : 'error',
    title: payload.isDefenseSuccessful ? 'Attaque repoussée' : 'Village attaqué',
    description: `${payload.attackerVillageName} (${payload.attackerX},${payload.attackerY})`,
    ttlMs: 6000,
  });
}

function invalidateCombatReports(ctx: BindingsContext): void {
  const userId = useAuthStore.getState().user?.id ?? null;
  ctx.queryClient.invalidateQueries({ queryKey: ['combat', 'reports', userId] });
  ctx.queryClient.invalidateQueries({ queryKey: ['combat', 'scout-reports', userId] });
}

function invalidateReinforcementReports(ctx: BindingsContext): void {
  const userId = useAuthStore.getState().user?.id ?? null;
  ctx.queryClient.invalidateQueries({ queryKey: ['combat', 'reinforcement-reports', userId] });
}

function invalidateOpenConquests(ctx: BindingsContext): void {
  const userId = useAuthStore.getState().user?.id ?? null;
  const worldId = useGameStore.getState().worldId;
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.openConquests(userId, worldId) });
}

function invalidateOpenExpeditions(ctx: BindingsContext): void {
  const userId = useAuthStore.getState().user?.id ?? null;
  const worldId = useGameStore.getState().worldId;
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.openExpeditions(userId, worldId) });
}

function invalidatePowerQueries(ctx: BindingsContext, villageId: string): void {
  const userId = useAuthStore.getState().user?.id ?? null;
  const worldId = useGameStore.getState().worldId;
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.villagePower(villageId) });
  ctx.queryClient.invalidateQueries({ queryKey: ['power', 'kingdom', userId] });
  // The rankings summary embeds the live POWER leaderboard; refresh it whenever
  // kingdom power shifts (build/train/combat/conquest), since the backend only
  // emits rankings.changed on glory writes, not power changes.
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.rankingsSummary(worldId) });
}

function invalidateRetentionSummary(ctx: BindingsContext): void {
  const userId = useAuthStore.getState().user?.id ?? null;
  const worldId = useGameStore.getState().worldId;
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.retentionSummary(userId, worldId) });
}

function invalidateOnboardingSummary(ctx: BindingsContext): void {
  const userId = useAuthStore.getState().user?.id ?? null;
  const worldId = useGameStore.getState().worldId;
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.onboardingSummary(userId, worldId) });
}

function invalidateVillageVisualQueries(ctx: BindingsContext): void {
  const userId = useAuthStore.getState().user?.id ?? null;
  const worldId = useGameStore.getState().worldId;
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.myVillages(userId, worldId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.worldEntities(worldId) });
}

export function applyVillageConquered(payload: VillageConqueredPayload, ctx: BindingsContext): void {
  const userId = useAuthStore.getState().user?.id ?? null;
  ctx.queryClient.invalidateQueries({ queryKey: ['memberships'] });
  ctx.queryClient.invalidateQueries({ queryKey: ['villages'] });
  ctx.queryClient.invalidateQueries({ queryKey: ['world-entities'] });
  invalidatePowerQueries(ctx, payload.villageId);
  invalidateOpenConquests(ctx);
  invalidateCombatReports(ctx);
  // Mark the entity as conquered on the map by simply removing it; the next
  // refetch will reinsert it under the new owner.
  useWorldMapStore.getState().removeEntity(payload.villageId);
  if (userId === payload.newOwnerId) {
    useUiStore.getState().pushVictoryModal({
      villageId: payload.villageId,
      villageName: payload.villageName,
      x: payload.x,
      y: payload.y,
      buildingsKept: payload.buildingsKept,
      previousTier: payload.previousTier,
    });
  }
}

export function applyVillageCaptureWindowOpened(
  payload: VillageCaptureWindowOpenedPayload,
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({ queryKey: ['world-entities'] });
  invalidateConquestAttackerState(ctx, payload.attackerVillageId);
  invalidateOpenConquests(ctx);
  invalidateOpenExpeditions(ctx);
  useUiStore.getState().pushToast({
    tone: 'warning',
    title: 'Capture en cours',
    description: `Fin prévue à ${new Date(payload.captureUntil).toLocaleTimeString()}`,
    ttlMs: 6000,
  });
}

export function applyVillageCaptureWindowCompleted(
  _payload: VillageCaptureWindowCompletedPayload,
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({ queryKey: ['memberships'] });
  ctx.queryClient.invalidateQueries({ queryKey: ['villages'] });
  ctx.queryClient.invalidateQueries({ queryKey: ['world-entities'] });
  invalidateOpenConquests(ctx);
  invalidateCombatReports(ctx);
  useUiStore.getState().pushToast({
    tone: 'success',
    title: 'Capture terminée',
    description: 'Village conquis',
    ttlMs: 6000,
  });
}

export function applyVillageCaptureWindowInterrupted(
  payload: VillageCaptureWindowInterruptedPayload,
  ctx: BindingsContext,
): void {
  ctx.queryClient.invalidateQueries({ queryKey: ['world-entities'] });
  invalidateOpenConquests(ctx);
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
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.activeExpeditions(payload.attackerVillageId) });
  invalidateOpenConquests(ctx);
  invalidateOpenExpeditions(ctx);
  useUiStore.getState().pushToast({
    tone: 'error',
    title: 'Seigneur perdu',
    description: 'Conquête échouée',
    ttlMs: 6000,
  });
}

function invalidateConquestAttackerState(ctx: BindingsContext, attackerVillageId: string): void {
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.activeExpeditions(attackerVillageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(attackerVillageId) });
  ctx.queryClient.invalidateQueries({ queryKey: queryKeys.population(attackerVillageId) });
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

function formatUnitName(unitType: string, quantity: number): string {
  const meta = unitMetaFor(unitType);
  return quantity > 1 ? meta.pluralName : meta.name;
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
  'rankings.changed': applyRankingsChanged,
  'world.status.changed': applyWorldStatusChanged,
  'building.completed': applyBuildingCompleted,
  'unit.training.completed': applyUnitTrainingCompleted,
  'unit.trained': applyUnitTrained,
  'battle.sent': applyBattleSent,
  'battle.resolved': applyBattleResolved,
  'battle.returned': applyBattleReturned,
  'scout.sent': applyScoutSent,
  'scout.reported': applyScoutReported,
  'scout.returned': applyScoutReturned,
  'expedition.recalled': applyExpeditionRecalled,
  'expedition.returned': applyExpeditionReturned,
  'reinforcement.sent': applyReinforcementSent,
  'reinforcement.recalled': applyReinforcementRecalled,
  'reinforcement.returned': applyReinforcementReturned,
  'caravan.sent': applyCaravanSent,
  'caravan.arrived': applyCaravanArrived,
  'caravan.recalled': applyCaravanRecalled,
  'caravan.returned': applyCaravanReturned,
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
