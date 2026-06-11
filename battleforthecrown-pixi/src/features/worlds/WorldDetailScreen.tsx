import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { WorldDetailDesign } from '@/features/design-system/worlds/WorldDetailDesign';
import { worldDetailLabels } from '@/features/design-system/worlds/worldDetailConfig';
import { ToastStack } from '@/features/layout/ToastStack';
import { useUiStore } from '@/stores/ui';
import type { WorldCardViewModel } from './worldsViewModel';
import { enterErrorMessage, joinErrorMessage, useWorldCardModels } from './useWorldCardModels';

export function WorldDetailScreen() {
  const navigate = useNavigate();
  const { worldId } = useParams();
  const pushToast = useUiStore((state) => state.pushToast);
  const [error, setError] = useState<string | null>(null);
  const { defaultVillageName, enter, join, memberships, worldModels, worlds } = useWorldCardModels();
  const world = useMemo(
    () => worldModels.find((candidate) => candidate.id === worldId) ?? null,
    [worldId, worldModels],
  );

  const onEnter = (selectedWorld: WorldCardViewModel) => {
    if (enter.isPending) return;
    setError(null);
    enter.mutate(
      { worldId: selectedWorld.id },
      {
        onError: (err) => {
          setError(enterErrorMessage(err));
        },
        onSuccess: () => navigate('/game'),
      },
    );
  };

  const onJoin = (selectedWorld: WorldCardViewModel) => {
    if (join.isPending) return;
    setError(null);
    join.mutate(
      { worldId: selectedWorld.id, villageName: defaultVillageName },
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

  if (worlds.isLoading || memberships.isLoading) {
    return (
      <>
        <div className="min-h-screen bg-[#d4c094]" />
        <ToastStack />
      </>
    );
  }

  if (worlds.isError || memberships.isError || !world) {
    return (
      <>
        <main className="min-h-screen bg-[#d4c094] px-4 py-8 font-game text-[#3d2f1f]">
          <div className="mx-auto max-w-[420px] rounded-xl border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#f3e3c2)] p-4 text-center shadow-[0_2px_6px_rgba(60,38,25,.18)]">
            <p className="text-sm font-bold">Royaume introuvable.</p>
            <button
              className="mt-3 rounded-lg border-2 border-[#5d4a32] bg-[linear-gradient(to_bottom,#fef9f0,#d8c298)] px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.08em]"
              onClick={() => navigate('/worlds')}
              type="button"
            >
              Retour aux royaumes
            </button>
          </div>
        </main>
        <ToastStack />
      </>
    );
  }

  return (
    <>
      <WorldDetailDesign
        labels={worldDetailLabels}
        noticeMessage={error}
        onBack={() => navigate('/worlds')}
        onEnter={onEnter}
        onJoin={onJoin}
        onNotify={onNotify}
        world={world}
      />
      <ToastStack />
    </>
  );
}
