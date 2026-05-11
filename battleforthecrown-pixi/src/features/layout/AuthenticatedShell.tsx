import { useEffect, useMemo } from 'react';
import { Outlet } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { useResourcesStore } from '@/stores/resources';
import { useCrownsStore } from '@/stores/crowns';
import { useExpeditionsStore } from '@/stores/expeditions';
import { useWorldMapStore } from '@/stores/worldMap';
import { gameSocket } from '@/api/ws';
import { bindServerEvents } from '@/api/ws-bindings';
import {
  useActiveExpeditionsQuery,
  useCrownsQuery,
  useMyVillagesQuery,
  useResourcesQuery,
} from '@/api/queries';
import { entityFromMyVillage } from '@/api/world-types';
import { buildRecalledExpeditionPatch, inferRecallAt } from '@/lib/expeditionRecall';
import type { ExpeditionSnapshot } from '@/stores/expeditions';

/**
 * Mounted once at the top of the protected route tree (via <Outlet />).
 * Owns the WebSocket lifecycle, server-event bindings and initial REST → store
 * seeding so navigating between protected screens never tears down the live
 * session.
 */
export function AuthenticatedShell() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const worldId = useGameStore((state) => state.worldId);
  const villageId = useGameStore((state) => state.villageId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;
    gameSocket.connect(accessToken);
    return () => gameSocket.disconnect();
  }, [accessToken]);

  useEffect(() => {
    if (!worldId) return;
    return gameSocket.subscribeStatus((status) => {
      if (status === 'connected') gameSocket.joinWorld(worldId);
    });
  }, [worldId]);

  useEffect(() => bindServerEvents({ queryClient }), [queryClient]);

  const resourcesQuery = useResourcesQuery(villageId);
  const setResources = useResourcesStore((state) => state.setResources);
  useEffect(() => {
    if (!villageId || !resourcesQuery.data) return;
    setResources({
      villageId,
      wood: resourcesQuery.data.wood,
      stone: resourcesQuery.data.stone,
      iron: resourcesQuery.data.iron,
      maxPerType: resourcesQuery.data.maxPerType,
      productionRates: resourcesQuery.data.productionRates,
      lastUpdateTs: Date.parse(resourcesQuery.data.lastUpdateTs),
    });
  }, [villageId, resourcesQuery.data, setResources]);

  const crownsQuery = useCrownsQuery(worldId);
  const setCrowns = useCrownsStore((state) => state.setCrowns);
  useEffect(() => {
    if (!userId || !worldId || !crownsQuery.data) return;
    setCrowns({
      userId,
      worldId,
      balance: crownsQuery.data.balance,
      productionRate: crownsQuery.data.productionRate,
      lastUpdateTs: Date.now(),
    });
  }, [userId, worldId, crownsQuery.data, setCrowns]);

  // Seed worldMap store with the player's villages so expedition origins
  // resolve correctly even when not on the WorldMap screen — otherwise
  // `resolveOrigin` falls back to (0, 0) and paths start top-left.
  const myVillagesQuery = useMyVillagesQuery(worldId);
  const upsertEntity = useWorldMapStore((state) => state.upsertEntity);
  const villageOrigins = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    (myVillagesQuery.data ?? []).forEach((v) => map.set(v.id, { x: v.x, y: v.y }));
    return map;
  }, [myVillagesQuery.data]);
  useEffect(() => {
    if (!myVillagesQuery.data) return;
    myVillagesQuery.data.forEach((village) => upsertEntity(entityFromMyVillage(village, userId)));
  }, [myVillagesQuery.data, userId, upsertEntity]);

  // Reconcile expeditions on every poll tick so phase transitions and
  // server-side removals stay correct even if a WS event was missed.
  const activeExpeditionsQuery = useActiveExpeditionsQuery(villageId);
  useEffect(() => {
    if (!activeExpeditionsQuery.data) return;
    const list = activeExpeditionsQuery.data;
    const store = useExpeditionsStore.getState();
    const liveIds = new Set(list.map((exp) => exp.id));
    list.forEach((exp) => {
      const origin = villageOrigins.get(exp.attackerVillageId) ?? { x: 0, y: 0 };
      const snapshot: ExpeditionSnapshot = {
        expeditionId: exp.id,
        kind: exp.kind,
        reportId: exp.reportId ?? undefined,
        villageId: exp.attackerVillageId,
        origin,
        target: { x: exp.targetX, y: exp.targetY },
        targetKind: exp.targetKind,
        phase: exp.status as 'EN_ROUTE' | 'RESOLVED' | 'RETURNING' | 'RETURNED',
        departAt: Date.parse(exp.departAt),
        arrivalAt: Date.parse(exp.arrivalAt),
        returnAt: exp.returnAt ? Date.parse(exp.returnAt) : undefined,
      };

      if (exp.recalled && snapshot.phase === 'RETURNING' && snapshot.returnAt) {
        store.add({
          ...snapshot,
          ...buildRecalledExpeditionPatch(
            snapshot,
            inferRecallAt(
              snapshot.departAt,
              snapshot.returnAt,
              exp.updatedAt ? Date.parse(exp.updatedAt) : undefined,
            ),
            snapshot.returnAt,
          ),
        });
      } else {
        store.add(snapshot);
      }
    });
    Object.keys(store.byId).forEach((id) => {
      if (!liveIds.has(id)) store.remove(id);
    });
  }, [activeExpeditionsQuery.data, villageOrigins]);

  return <Outlet />;
}
