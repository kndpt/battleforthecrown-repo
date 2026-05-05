import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { useResourcesStore } from '@/stores/resources';
import { useCrownsStore } from '@/stores/crowns';
import { gameSocket } from '@/api/ws';
import { bindServerEvents } from '@/api/ws-bindings';
import { useCrownsQuery, useResourcesQuery } from '@/api/queries';

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
  const crownsQuery = useCrownsQuery(userId, worldId);
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

  return <>{children}</>;
}
