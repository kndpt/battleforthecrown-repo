import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  WorldsSelectionDesign,
} from '@/features/design-system/worlds/WorldsSelectionDesign';
import { defaultSeasonVariants, worldsSelectionLabels } from '@/features/design-system/worlds/worldsSelectionConfig';
import { ToastStack } from '@/features/layout/ToastStack';
import { useUiStore } from '@/stores/ui';
import {
  buildWorldTabCounts,
  filterWorldsByTab,
  type WorldCardViewModel,
  type WorldsTab,
} from './worldsViewModel';
import { joinErrorMessage, useWorldCardModels } from './useWorldCardModels';

export function WorldSelector() {
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const [activeTab, setActiveTab] = useState<WorldsTab>('open');
  const [error, setError] = useState<string | null>(null);
  const { currentWorldId, defaultVillageName, join, memberships, worldModels, worlds } = useWorldCardModels();
  const counts = useMemo(() => buildWorldTabCounts(worldModels), [worldModels]);
  const filteredWorlds = useMemo(
    () => filterWorldsByTab(worldModels, activeTab),
    [activeTab, worldModels],
  );

  const onJoin = (world: WorldCardViewModel) => {
    if (join.isPending) return;
    setError(null);
    join.mutate(
      { worldId: world.id, villageName: defaultVillageName },
      {
        onError: (err) => {
          setError(joinErrorMessage(err));
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
        onBack={() => navigate(currentWorldId ? '/game' : '/')}
        onJoin={onJoin}
        onDetails={(world) => navigate(`/worlds/${world.id}`)}
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
