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
import { enterErrorMessage, joinErrorMessage, useWorldCardModels } from './useWorldCardModels';

export function WorldSelector() {
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const [activeTab, setActiveTab] = useState<WorldsTab>('open');
  const [error, setError] = useState<string | null>(null);
  const { currentWorldId, defaultVillageName, enter, join, memberships, worldModels, worlds } = useWorldCardModels();
  const counts = useMemo(() => buildWorldTabCounts(worldModels), [worldModels]);
  const filteredWorlds = useMemo(
    () => filterWorldsByTab(worldModels, activeTab),
    [activeTab, worldModels],
  );

  const onEnter = (world: WorldCardViewModel) => {
    if (enter.isPending) return;
    setError(null);
    enter.mutate(
      { worldId: world.id },
      {
        onError: (err) => {
          setError(enterErrorMessage(err));
        },
        onSuccess: () => navigate('/game'),
      },
    );
  };

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

  const onSelectFreshAlternative = (worldId: string) => {
    // Fresh worlds are always still-OPEN (main phase) → ensure the tab is visible
    // before anchoring to the target card. No automatic join: the user validates
    // via the card's own primary CTA.
    setActiveTab('open');
    requestAnimationFrame(() => {
      const card = document.getElementById(`world-card-${worldId}`);
      if (typeof card?.scrollIntoView === 'function') {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
        onEnter={onEnter}
        onJoin={onJoin}
        onDetails={(world) => navigate(`/worlds/${world.id}`)}
        onNotify={onNotify}
        onSelectFreshAlternative={onSelectFreshAlternative}
        onViewRankings={(world) => navigate(`/worlds/${world.id}/rankings/final`)}
        onTabChange={setActiveTab}
        totalCount={worldModels.length}
        variants={defaultSeasonVariants}
        worlds={filteredWorlds}
      />
      <ToastStack />
    </>
  );
}
