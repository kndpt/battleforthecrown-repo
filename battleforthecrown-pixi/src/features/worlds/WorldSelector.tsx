import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api';
import { useJoinWorldMutation, useMyMembershipsQuery, usePublicWorldsQuery } from '@/api/queries';
import {
  WorldsSelectionDesign,
} from '@/features/design-system/worlds/WorldsSelectionDesign';
import { defaultSeasonVariants, worldsSelectionLabels } from '@/features/design-system/worlds/worldsSelectionConfig';
import { ToastStack } from '@/features/layout/ToastStack';
import { useAuthStore } from '@/stores/auth';
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

export function WorldSelector() {
  const navigate = useNavigate();
  const worlds = usePublicWorldsQuery();
  const memberships = useMyMembershipsQuery();
  const join = useJoinWorldMutation();
  const userEmail = useAuthStore((state) => state.user?.email);
  const pushToast = useUiStore((state) => state.pushToast);
  const [activeTab, setActiveTab] = useState<WorldsTab>('open');
  const [error, setError] = useState<string | null>(null);

  const joinedWorldIds = useMemo(
    () => new Set(memberships.data?.map((membership) => membership.worldId) ?? []),
    [memberships.data],
  );
  const worldModels = useMemo(
    () => (worlds.data ?? []).map((world) => toWorldCardViewModel(world, joinedWorldIds)),
    [joinedWorldIds, worlds.data],
  );
  const counts = useMemo(() => buildWorldTabCounts(worldModels), [worldModels]);
  const filteredWorlds = useMemo(
    () => filterWorldsByTab(worldModels, activeTab),
    [activeTab, worldModels],
  );

  const onJoin = (world: WorldCardViewModel) => {
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

  return (
    <>
      <WorldsSelectionDesign
        activeTab={activeTab}
        counts={counts}
        errorMessage={worlds.isError ? 'Impossible de charger la liste des royaumes.' : null}
        isLoading={worlds.isLoading || memberships.isLoading}
        labels={worldsSelectionLabels}
        noticeMessage={error}
        onBack={() => navigate('/my-worlds')}
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
