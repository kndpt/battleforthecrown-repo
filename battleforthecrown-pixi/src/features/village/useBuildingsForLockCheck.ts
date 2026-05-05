import { useVillageBuildingsQuery } from '@/api/queries';
import { useGameStore } from '@/stores/game';

/**
 * Returns derived flags used by the bottom navigation to disable / unlock
 * tabs (e.g. Army requires a barracks of level >= 1).
 */
export function useBuildingsForLockCheck() {
  const villageId = useGameStore((state) => state.villageId);
  const buildings = useVillageBuildingsQuery(villageId);

  const barracks = buildings.data?.find((b) => b.type === 'BARRACKS');
  const isBarracksBuilt = (barracks?.level ?? 0) > 0;

  return { isBarracksBuilt };
}
