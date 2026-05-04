import { useResourcesStore } from '@/stores/resources';
import { useCrownsStore } from '@/stores/crowns';
import { projectCrowns, projectResources, type DisplayResources } from '@/lib/interpolation';
import { useTickingNow } from '@/lib/useTickingNow';

export interface DisplayResourcesResult {
  display: DisplayResources | null;
  productionRates: { wood: number; stone: number; iron: number } | null;
  hasSnapshot: boolean;
}

export function useDisplayResources(villageId: string | null): DisplayResourcesResult {
  const snapshot = useResourcesStore((state) =>
    villageId ? state.byVillageId[villageId] : undefined,
  );
  const now = useTickingNow(1_000);

  if (!snapshot) {
    return { display: null, productionRates: null, hasSnapshot: false };
  }

  return {
    display: projectResources(snapshot, now),
    productionRates: snapshot.productionRates,
    hasSnapshot: true,
  };
}

export interface DisplayCrownsResult {
  balance: number | null;
  productionRate: number | null;
}

export function useDisplayCrowns(userId: string | null, worldId: string | null): DisplayCrownsResult {
  const snapshot = useCrownsStore((state) =>
    userId && worldId ? state.byKey[`${userId}:${worldId}`] : undefined,
  );
  const now = useTickingNow(1_000);

  if (!snapshot) {
    return { balance: null, productionRate: null };
  }

  return {
    balance: projectCrowns(snapshot, now),
    productionRate: snapshot.productionRate,
  };
}
