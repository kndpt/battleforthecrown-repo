import { useEffect, useMemo, type ReactNode } from 'react';
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

export function GameSession({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const worldId = useGameStore((state) => state.worldId);
  const villageId = useGameStore((state) => state.villageId);
  const queryClient = useQueryClient();

  // Connect WS once we have an access token. socket.io's built-in reconnection
  // handles transient drops; we just (dis)connect on mount/unmount.
  useEffect(() => {
    if (!accessToken) return;
    gameSocket.connect(accessToken);
    return () => {
      gameSocket.disconnect();
    };
  }, [accessToken]);

  // Join the world room when both the socket and the world id are known.
  useEffect(() => {
    if (!worldId) return;
    const off = gameSocket.subscribeStatus((status) => {
      if (status === 'connected') {
        gameSocket.joinWorld(worldId);
      }
    });
    return off;
  }, [worldId]);

  // Wire server events → stores / query invalidations once per session.
  useEffect(() => {
    return bindServerEvents({ queryClient });
  }, [queryClient]);

  // Initial resources baseline: REST snapshot pushed into the Zustand store.
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

  // Initial crowns baseline. WS event `crowns.changed` keeps it fresh afterwards.
  const userId = useAuthStore((state) => state.user?.id ?? null);
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

  // Keep worldMap store seeded with the user's villages so that expedition
  // origins resolve correctly even when the player isn't on the WorldMap screen
  // (otherwise `resolveOrigin` falls back to (0, 0) and paths start from the
  // top-left corner of the map).
  const myVillagesQuery = useMyVillagesQuery(worldId);
  const upsertEntity = useWorldMapStore((state) => state.upsertEntity);
  const villageOrigins = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    (myVillagesQuery.data ?? []).forEach((v) => {
      map.set(v.id, { x: v.x, y: v.y });
    });
    return map;
  }, [myVillagesQuery.data]);
  useEffect(() => {
    if (!myVillagesQuery.data) return;
    myVillagesQuery.data.forEach((village) => {
      upsertEntity(entityFromMyVillage(village, userId));
    });
  }, [myVillagesQuery.data, userId, upsertEntity]);

  // Active expeditions sync. The query polls the backend; we reconcile the
  // store on every tick so phase transitions (EN_ROUTE → RETURNING → RETURNED)
  // and removals stay correct even if a WS event was missed.
  const activeExpeditionsQuery = useActiveExpeditionsQuery(villageId);
  useEffect(() => {
    if (!activeExpeditionsQuery.data) return;
    const list = activeExpeditionsQuery.data;
    const store = useExpeditionsStore.getState();
    const liveIds = new Set(list.map((exp) => exp.id));

    list.forEach((exp) => {
      const origin = villageOrigins.get(exp.attackerVillageId) ?? { x: 0, y: 0 };
      store.add({
        expeditionId: exp.id,
        reportId: exp.reportId ?? undefined,
        villageId: exp.attackerVillageId,
        origin,
        target: { x: exp.targetX, y: exp.targetY },
        targetKind: exp.targetKind,
        phase: exp.status as 'EN_ROUTE' | 'RESOLVED' | 'RETURNING' | 'RETURNED',
        departAt: Date.parse(exp.departAt),
        arrivalAt: Date.parse(exp.arrivalAt),
        returnAt: exp.returnAt ? Date.parse(exp.returnAt) : undefined,
      });
    });

    // Drop expeditions that the server no longer considers active (returned,
    // cancelled, etc.) so the path / sprite vanish from the map.
    Object.keys(store.byId).forEach((id) => {
      if (!liveIds.has(id)) store.remove(id);
    });
  }, [activeExpeditionsQuery.data, villageOrigins]);

  return <>{children}</>;
}
