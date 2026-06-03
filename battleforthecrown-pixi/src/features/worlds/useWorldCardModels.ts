import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ApiError } from '@/api';
import {
  publicKingdomPowerQueryOptions,
  useJoinWorldMutation,
  useMyMembershipsQuery,
  usePublicWorldsQuery,
} from '@/api/queries';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { toWorldCardViewModel } from './worldsViewModel';

function defaultVillageName(email?: string): string {
  if (!email) return 'Royaume du joueur';
  const handle = email.split('@')[0] ?? 'joueur';
  return `Royaume de ${handle}`;
}

export function useWorldCardModels() {
  const worlds = usePublicWorldsQuery();
  const memberships = useMyMembershipsQuery();
  const join = useJoinWorldMutation();
  const user = useAuthStore((state) => state.user);
  const userEmail = user?.email;
  const userId = user?.id ?? null;
  const currentWorldId = useGameStore((state) => state.worldId);

  const joinedMemberships = useMemo(() => memberships.data ?? [], [memberships.data]);
  const joinedWorldIdsForPower = useMemo(
    () => joinedMemberships.map((membership) => membership.worldId),
    [joinedMemberships],
  );
  const kingdomPowerByWorld = useQueries({
    queries: joinedWorldIdsForPower.map((worldId) =>
      publicKingdomPowerQueryOptions(userId, worldId),
    ),
  });
  const joinedWorldIds = useMemo(
    () => new Set(joinedMemberships.map((membership) => membership.worldId)),
    [joinedMemberships],
  );
  const personalStatsByWorldId = useMemo(
    () =>
      new Map(
        joinedMemberships.flatMap((membership, index) => {
          const power = kingdomPowerByWorld[index]?.data;
          if (!power) return [];
          return [[membership.worldId, {
            kingdomPower: power.kingdomPower,
            villageCount: membership.villageCount,
          }] as const];
        }),
      ),
    [joinedMemberships, kingdomPowerByWorld],
  );
  const worldModels = useMemo(
    () => (worlds.data ?? []).map((world) => toWorldCardViewModel(
      world,
      joinedWorldIds,
      undefined,
      personalStatsByWorldId,
    )),
    [joinedWorldIds, personalStatsByWorldId, worlds.data],
  );

  return {
    currentWorldId,
    defaultVillageName: defaultVillageName(userEmail),
    join,
    memberships,
    worldModels,
    worlds,
  };
}

export function joinErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Inscription au monde impossible';
}
