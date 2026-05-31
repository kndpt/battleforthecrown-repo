import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { ApiError, apiClient } from '@/api';
import {
  queryKeys,
  useJoinWorldMutation,
  useMyMembershipsQuery,
  usePublicWorldsQuery,
} from '@/api/queries';
import { WorldDetailDesign } from '@/features/design-system/worlds/WorldDetailDesign';
import { worldDetailLabels } from '@/features/design-system/worlds/worldsSelectionConfig';
import { ToastStack } from '@/features/layout/ToastStack';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import {
  toWorldDetailViewModel,
  type WorldDetailViewModel,
} from './worldsViewModel';

interface PublicKingdomPowerDto {
  userId: string;
  kingdomPower: number;
}

function defaultVillageName(email?: string): string {
  if (!email) return 'Royaume du joueur';
  const handle = email.split('@')[0] ?? 'joueur';
  return `Royaume de ${handle}`;
}

export function WorldDetailScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const worldId = params.worldId ?? null;
  const worlds = usePublicWorldsQuery();
  const memberships = useMyMembershipsQuery();
  const join = useJoinWorldMutation();
  const user = useAuthStore((state) => state.user);
  const pushToast = useUiStore((state) => state.pushToast);
  const [error, setError] = useState<string | null>(null);

  const joinedMemberships = useMemo(() => memberships.data ?? [], [memberships.data]);
  const joinedWorldIdsForPower = useMemo(
    () => joinedMemberships.map((membership) => membership.worldId),
    [joinedMemberships],
  );
  const kingdomPowerByWorld = useQueries({
    queries: joinedWorldIdsForPower.map((joinedWorldId) => ({
      enabled: Boolean(user?.id),
      queryFn: () => {
        if (!user?.id) return Promise.reject(new Error('No user selected'));
        return apiClient.get<PublicKingdomPowerDto>(`/power/kingdom/${user.id}/public`, {
          query: { worldId: joinedWorldId },
          skipAuth: true,
        });
      },
      queryKey: queryKeys.publicKingdomPower(user?.id ?? null, joinedWorldId),
      staleTime: 30_000,
    })),
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

  const model = useMemo<WorldDetailViewModel | null>(() => {
    const world = (worlds.data ?? []).find((candidate) => candidate.id === worldId);
    return world
      ? toWorldDetailViewModel(world, joinedWorldIds, undefined, personalStatsByWorldId)
      : null;
  }, [joinedWorldIds, personalStatsByWorldId, worldId, worlds.data]);

  const onPrimaryAction = (world: WorldDetailViewModel) => {
    if (join.isPending) return;
    setError(null);
    if (world.ctaKind === 'notify') {
      pushToast({
        description: 'Les notifications de lancement seront branchées dans une prochaine passe.',
        title: 'Disponible bientôt',
        tone: 'info',
        ttlMs: 4000,
      });
      return;
    }
    if (world.ctaKind === 'locked') return;
    join.mutate(
      { worldId: world.id, villageName: defaultVillageName(user?.email) },
      {
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : 'Inscription au monde impossible');
        },
        onSuccess: () => navigate('/game'),
      },
    );
  };

  return (
    <>
      <WorldDetailDesign
        errorMessage={worlds.isError ? 'Impossible de charger le royaume.' : error}
        isLoading={worlds.isLoading || memberships.isLoading}
        labels={worldDetailLabels}
        onBack={() => navigate('/worlds')}
        onPrimaryAction={onPrimaryAction}
        world={model}
      />
      <ToastStack />
    </>
  );
}
