import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ApiError, apiClient } from '@/api';
import {
  queryKeys,
  useJoinWorldMutation,
  useMyMembershipsQuery,
  usePublicWorldsQuery,
} from '@/api/queries';
import {
  WorldsSelectionDesign,
} from '@/features/design-system/worlds/WorldsSelectionDesign';
import { defaultSeasonVariants, worldsSelectionLabels } from '@/features/design-system/worlds/worldsSelectionConfig';
import { ToastStack } from '@/features/layout/ToastStack';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { useUiStore } from '@/stores/ui';
import {
  buildWorldTabCounts,
  filterWorldsByTab,
  toWorldCardViewModel,
  type WorldCardViewModel,
  type WorldsTab,
} from './worldsViewModel';

function defaultVillageName(email?: string): string {
  if (!email) return 'Royaume du joueur';
  const handle = email.split('@')[0] ?? 'joueur';
  return `Royaume de ${handle}`;
}

interface PublicKingdomPowerDto {
  userId: string;
  kingdomPower: number;
}

export function WorldSelector() {
  const navigate = useNavigate();
  const worlds = usePublicWorldsQuery();
  const memberships = useMyMembershipsQuery();
  const join = useJoinWorldMutation();
  const user = useAuthStore((state) => state.user);
  const userEmail = user?.email;
  const userId = user?.id ?? null;
  const currentWorldId = useGameStore((state) => state.worldId);
  const pushToast = useUiStore((state) => state.pushToast);
  const [activeTab, setActiveTab] = useState<WorldsTab>('open');
  const [error, setError] = useState<string | null>(null);

  const joinedMemberships = useMemo(() => memberships.data ?? [], [memberships.data]);
  const joinedWorldIdsForPower = useMemo(
    () => joinedMemberships.map((membership) => membership.worldId),
    [joinedMemberships],
  );
  const kingdomPowerByWorld = useQueries({
    queries: joinedWorldIdsForPower.map((worldId) => ({
      enabled: Boolean(userId),
      queryFn: () => {
        if (!userId) return Promise.reject(new Error('No user selected'));
        return apiClient.get<PublicKingdomPowerDto>(`/power/kingdom/${userId}/public`, {
          query: { worldId },
          skipAuth: true,
        });
      },
      queryKey: queryKeys.publicKingdomPower(userId, worldId),
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
  const worldModels = useMemo(
    () => (worlds.data ?? []).map((world) => toWorldCardViewModel(
      world,
      joinedWorldIds,
      undefined,
      personalStatsByWorldId,
    )),
    [joinedWorldIds, personalStatsByWorldId, worlds.data],
  );
  const counts = useMemo(() => buildWorldTabCounts(worldModels), [worldModels]);
  const filteredWorlds = useMemo(
    () => filterWorldsByTab(worldModels, activeTab),
    [activeTab, worldModels],
  );

  const onJoin = (world: WorldCardViewModel) => {
    if (join.isPending) return;
    setError(null);
    join.mutate(
      { worldId: world.id, villageName: defaultVillageName(userEmail) },
      {
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : 'Inscription au monde impossible');
        },
        onSuccess: () => navigate('/game'),
      },
    );
  };

  const onNotify = () => {
    pushToast({
      description: 'Les notifications de lancement seront branchées dans une prochaine passe.',
      title: 'Disponible bientôt',
      tone: 'info',
      ttlMs: 4000,
    });
  };

  const onDetails = (world: WorldCardViewModel) => {
    navigate(`/worlds/${world.id}`);
  };

  return (
    <>
      <WorldsSelectionDesign
        activeTab={activeTab}
        counts={counts}
        errorMessage={worlds.isError ? 'Impossible de charger la liste des royaumes.' : null}
        isLoading={worlds.isLoading || memberships.isLoading}
        labels={worldsSelectionLabels}
        noticeMessage={error}
        onBack={() => navigate(currentWorldId ? '/game' : '/')}
        onDetails={onDetails}
        onJoin={onJoin}
        onNotify={onNotify}
        onTabChange={setActiveTab}
        totalCount={worldModels.length}
        variants={defaultSeasonVariants}
        worlds={filteredWorlds}
      />
      <ToastStack />
    </>
  );
}
