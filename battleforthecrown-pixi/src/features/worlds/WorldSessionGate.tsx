import { useEffect, useMemo, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useMyMembershipsQuery, useMyVillagesQuery } from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { Panel, Spinner } from '@/ui';
import { pickDefaultVillage, pickLastPlayedMembership } from './worldResume';

interface WorldSessionGateProps {
  children: ReactNode;
}

export function WorldSessionGate({ children }: WorldSessionGateProps) {
  const worldId = useGameStore((state) => state.worldId);
  const villageId = useGameStore((state) => state.villageId);
  const setContext = useGameStore((state) => state.setContext);
  const memberships = useMyMembershipsQuery();

  const latestMembership = useMemo(
    () => pickLastPlayedMembership(memberships.data ?? []),
    [memberships.data],
  );
  const targetWorldId = worldId ?? latestMembership?.worldId ?? null;
  const hasGameContext = Boolean(worldId && villageId);
  const villages = useMyVillagesQuery(targetWorldId);
  const selectedVillage = useMemo(
    () => pickDefaultVillage(villages.data ?? []),
    [villages.data],
  );
  const hasNoVillage = Boolean(targetWorldId && villages.isSuccess && !selectedVillage);

  useEffect(() => {
    if (hasGameContext || !targetWorldId || !selectedVillage) return;
    setContext({ worldId: targetWorldId, villageId: selectedVillage.id });
  }, [hasGameContext, selectedVillage, setContext, targetWorldId]);

  if (hasGameContext) return <>{children}</>;

  if (memberships.isLoading || (targetWorldId && villages.isLoading)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (memberships.isError || villages.isError || hasNoVillage) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Panel variant="danger" padding="md">
          <p className="text-sm text-white">Impossible de charger ton royaume.</p>
        </Panel>
      </div>
    );
  }

  if (!targetWorldId) {
    return <Navigate to="/worlds" replace />;
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
