import { useVillageBuildingsQuery } from '@/api/queries';
import { useGameStore } from '@/stores/game';

/**
 * Returns derived flags used by the bottom navigation to disable / unlock
 * tabs (Army requires a barracks of level >= 1, World requires a watchtower).
 */
export function useBuildingsForLockCheck() {
  const villageId = useGameStore((state) => state.villageId);
  const buildings = useVillageBuildingsQuery(villageId);

  const barracks = buildings.data?.find((b) => b.type === 'BARRACKS');
  const isBarracksBuilt = (barracks?.level ?? 0) > 0;

  const watchtower = buildings.data?.find((b) => b.type === 'WATCHTOWER');
  const watchtowerLevel = watchtower?.level ?? 0;
  const isWatchtowerBuilt = watchtowerLevel > 0;

  return { isBarracksBuilt, isWatchtowerBuilt, watchtowerLevel };
}
