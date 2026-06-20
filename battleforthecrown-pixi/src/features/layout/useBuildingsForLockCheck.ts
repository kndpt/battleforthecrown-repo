import { useMyVillagesQuery, useVillageBuildingsQuery } from '@/api/queries';
import { useGameStore } from '@/stores/game';

/**
 * Returns derived flags used by the bottom navigation to disable / unlock
 * tabs.
 *
 * - Army requires a barracks of level >= 1 in the **current** village.
 * - World requires a watchtower in **any** of the player's villages: the
 *   world-map unlock is a player-level capability (cf. `VisionService`
 *   aggregating vision disks across every owned village), so standing on a
 *   village without a watchtower must not re-lock the map when another
 *   village already has one.
 */
export function useBuildingsForLockCheck() {
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const buildings = useVillageBuildingsQuery(villageId);
  const myVillages = useMyVillagesQuery(worldId);

  const barracks = buildings.data?.find((b) => b.type === 'BARRACKS');
  const isBarracksBuilt = (barracks?.level ?? 0) > 0;

  const watchtower = buildings.data?.find((b) => b.type === 'WATCHTOWER');
  const watchtowerLevel = watchtower?.level ?? 0;
  const isWatchtowerBuilt = watchtowerLevel > 0;

  // World map unlocks as soon as *any* owned village has a watchtower.
  const isWatchtowerBuiltAnywhere =
    isWatchtowerBuilt ||
    (myVillages.data?.some((v) => (v.watchtowerLevel ?? 0) > 0) ?? false);

  return {
    isBarracksBuilt,
    isWatchtowerBuilt,
    isWatchtowerBuiltAnywhere,
    watchtowerLevel,
  };
}
