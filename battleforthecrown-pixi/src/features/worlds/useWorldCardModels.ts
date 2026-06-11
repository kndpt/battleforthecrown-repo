import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ApiError } from '@/api';
import {
  publicKingdomPowerQueryOptions,
  useEnterWorldMutation,
  useJoinWorldMutation,
  useMyMembershipsQuery,
  usePublicWorldsQuery,
} from '@/api/queries';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { toWorldCardViewModel } from './worldsViewModel';

function defaultVillageName(displayName?: string): string {
  if (!displayName) return 'Royaume du joueur';
  return `Royaume de ${displayName}`;
}

export function useWorldCardModels() {
  const worlds = usePublicWorldsQuery();
  const memberships = useMyMembershipsQuery();
  const enter = useEnterWorldMutation();
  const join = useJoinWorldMutation();
  const user = useAuthStore((state) => state.user);
  const userDisplayName = user?.displayName;
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
  const villageCountByWorldId = useMemo(
    () => new Map(joinedMemberships.map((m) => [m.worldId, m.villageCount] as const)),
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
      villageCountByWorldId,
    )),
    [joinedWorldIds, personalStatsByWorldId, villageCountByWorldId, worlds.data],
  );

  return {
    currentWorldId,
    defaultVillageName: defaultVillageName(userDisplayName),
    enter,
    join,
    memberships,
    worldModels,
    worlds,
  };
}

const JOIN_ERROR_TRANSLATIONS: Array<[RegExp, string]> = [
  [/not open for joining/i, "Les inscriptions de ce royaume sont closes."],
  [/already joined/i, "Tu as déjà un village dans ce royaume : utilise « Entrer dans le royaume »."],
];

export function joinErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Inscription au royaume impossible.';

  const translated = JOIN_ERROR_TRANSLATIONS.find(([pattern]) => pattern.test(err.message));
  return (translated?.[1] ?? err.message) || 'Inscription au royaume impossible.';
}

export function enterErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return "Impossible d'entrer dans le royaume.";
  if (err.status === 404) return "Tu n'es pas encore inscrit à ce royaume.";
  return err.message || "Impossible d'entrer dans le royaume.";
}
