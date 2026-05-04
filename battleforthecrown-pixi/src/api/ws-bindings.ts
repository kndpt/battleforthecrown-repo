import type { QueryClient } from '@tanstack/react-query';
import { gameSocket } from './ws';
import type {
  BuildingCompletedPayload,
  CrownsChangedPayload,
  ResourcesChangedPayload,
} from './ws-types';
import { useResourcesStore } from '@/stores/resources';
import { useCrownsStore } from '@/stores/crowns';
import { useUiStore } from '@/stores/ui';

export interface BindingsContext {
  queryClient: QueryClient;
}

export function applyResourcesChanged(payload: ResourcesChangedPayload): void {
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

export function applyCrownsChanged(payload: CrownsChangedPayload): void {
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

export function bindServerEvents(ctx: BindingsContext): () => void {
  const offs: Array<() => void> = [
    gameSocket.on('resources.changed', applyResourcesChanged),
    gameSocket.on('crowns.changed', applyCrownsChanged),
    gameSocket.on('building.completed', (payload) => applyBuildingCompleted(payload, ctx)),
  ];
  return () => {
    for (const off of offs) {
      off();
    }
  };
}
