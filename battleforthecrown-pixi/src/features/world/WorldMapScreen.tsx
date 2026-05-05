import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Compass } from 'lucide-react';
import { GameSession } from '@/features/game/GameSession';
import { GameHeader } from '@/features/layout/GameHeader';
import { ToastStack } from '@/features/layout/ToastStack';
import { IconButton, Spinner, Tooltip } from '@/ui';
import { WorldMapCanvas, type WorldMapCanvasController } from './WorldMapCanvas';
import { SelectedEntityPanel } from './SelectedEntityPanel';
import { WorldLockedScreen } from './WorldLockedScreen';
import { buildMapEntities, filterEntitiesByVision } from './buildMapEntities';
import { ExpeditionList } from '@/features/combat/ExpeditionList';
import { AttackDetailModal } from '@/features/combat/AttackDetailModal';
import { useUnreadReportsCount } from '@/features/combat/useUnreadReportsCount';
import { BottomNavigationBar } from '@/features/village/BottomNavigationBar';
import { useBuildingsForLockCheck } from '@/features/village/useBuildingsForLockCheck';
import {
  useMyVillagesQuery,
  useWorldDetailsQuery,
  useWorldEntitiesQuery,
} from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { useAuthStore } from '@/stores/auth';
import { useWorldMapStore } from '@/stores/worldMap';
import type { MapEntity } from '@/api/world-types';

const FALLBACK_GRID = { gridWidth: 500, gridHeight: 500 };

export function WorldMapScreen() {
  const navigate = useNavigate();
  const worldId = useGameStore((state) => state.worldId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldEntities = useWorldEntitiesQuery(worldId);
  const myVillages = useMyVillagesQuery(worldId);
  const worldDetails = useWorldDetailsQuery(worldId);
  const { isWatchtowerBuilt, watchtowerLevel } = useBuildingsForLockCheck();
  const unreadCount = useUnreadReportsCount();

  const setEntities = useWorldMapStore((state) => state.setEntities);
  const selectedEntityId = useWorldMapStore((state) => state.selectedEntityId);
  const setSelectedEntity = useWorldMapStore((state) => state.setSelectedEntity);
  const [attackTarget, setAttackTarget] = useState<MapEntity | null>(null);
  const canvasRef = useRef<WorldMapCanvasController | null>(null);

  const allEntities: MapEntity[] = useMemo(
    () => buildMapEntities(worldEntities.data ?? [], myVillages.data ?? [], userId),
    [worldEntities.data, myVillages.data, userId],
  );

  const visibleEntities: MapEntity[] = useMemo(
    () => filterEntitiesByVision(allEntities, watchtowerLevel),
    [allEntities, watchtowerLevel],
  );

  useEffect(() => {
    setEntities(visibleEntities);
  }, [visibleEntities, setEntities]);

  // Clean store entry when leaving the map.
  useEffect(() => {
    return () => {
      useWorldMapStore.getState().clear();
    };
  }, []);

  if (!isWatchtowerBuilt) {
    return <WorldLockedScreen />;
  }

  const myVillage = visibleEntities.find((e) => e.isMine);
  const selectedEntity = selectedEntityId
    ? visibleEntities.find((e) => e.id === selectedEntityId) ?? null
    : null;

  const dims = worldDetails.data
    ? {
        gridWidth: worldDetails.data.gridWidth ?? FALLBACK_GRID.gridWidth,
        gridHeight: worldDetails.data.gridHeight ?? FALLBACK_GRID.gridHeight,
      }
    : FALLBACK_GRID;

  const handleRecenter = () => {
    if (myVillage) {
      canvasRef.current?.centerOn(myVillage.x, myVillage.y);
    }
  };

  return (
    <GameSession>
      <div className="h-screen flex flex-col mx-auto overflow-hidden bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
        <div className="flex-shrink">
          <GameHeader />
        </div>

        <main className="relative flex-1 overflow-hidden border-y-2 border-game-gold-border bg-[#0d0f17]">
          {worldEntities.isLoading || myVillages.isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <WorldMapCanvas
              gridWidth={dims.gridWidth}
              gridHeight={dims.gridHeight}
              myVillage={myVillage ?? null}
              controllerRef={canvasRef}
            />
          )}

          <div className="pointer-events-none absolute inset-0 flex flex-col">
            <div className="flex justify-between p-3">
              <div className="pointer-events-auto rounded border-2 border-game-gold-border bg-black/70 px-3 py-1 text-xs text-parchment/80">
                {visibleEntities.length} entité{visibleEntities.length > 1 ? 's' : ''}
              </div>
              <Tooltip content="Recentrer sur mon village" position="bottom" variant="dark">
                <div className="pointer-events-auto">
                  <IconButton
                    icon={Compass}
                    variant="warning"
                    size="md"
                    label="Recentrer sur mon village"
                    onClick={handleRecenter}
                    disabled={!myVillage}
                  />
                </div>
              </Tooltip>
            </div>

            <div className="mt-auto flex flex-wrap items-end justify-between gap-3 p-3">
              <ExpeditionList />
              <SelectedEntityPanel
                entity={selectedEntity}
                onClose={() => setSelectedEntity(null)}
                onAttack={(target) => setAttackTarget(target)}
              />
            </div>
          </div>
        </main>

        <BottomNavigationBar
          activeTab="world"
          onBuildingsClick={() => navigate('/game')}
          onArmyClick={() => navigate('/game/army')}
          onWorldClick={() => undefined}
          onMessagesClick={() => navigate('/game/messages')}
          unreadCount={unreadCount}
        />

        {attackTarget && myVillage && (
          <AttackDetailModal
            target={attackTarget}
            origin={{ x: myVillage.x, y: myVillage.y }}
            onClose={() => setAttackTarget(null)}
          />
        )}

        <ToastStack />
      </div>
    </GameSession>
  );
}
