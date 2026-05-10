import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Compass, Map as MapIcon, X } from 'lucide-react';
import { GameHeader } from '@/features/layout/GameHeader';
import { ToastStack } from '@/features/layout/ToastStack';
import { IconButton, Spinner, Tooltip } from '@/ui';
import { WorldMapCanvas, type WorldMapCanvasController } from './WorldMapCanvas';
import { SelectedEntityPanel } from './SelectedEntityPanel';
import { WorldLockedScreen } from './WorldLockedScreen';
import { WorldMiniMap } from './WorldMiniMap';
import { WorldEntityTooltip } from './WorldEntityTooltip';
import { buildMapEntities, filterEntitiesByVision } from './buildMapEntities';
import { AttackDetailModal } from '@/features/combat/AttackDetailModal';
import { useUnreadReportsCount } from '@/features/combat/useUnreadReportsCount';
import { BottomNavigationBar } from '@/features/layout/BottomNavigationBar';
import { useBuildingsForLockCheck } from '@/features/layout/useBuildingsForLockCheck';
import {
  useMyVillagesQuery,
  useWorldDetailsQuery,
  useWorldEntitiesQuery,
} from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { useAuthStore } from '@/stores/auth';
import { useExpeditionsStore } from '@/stores/expeditions';
import { useWorldMapStore } from '@/stores/worldMap';
import { WATCHTOWER_VISION_LEVELS } from '@battleforthecrown/shared/village/buildings';
import type { MapEntity } from '@/api/world-types';

const FALLBACK_GRID = { gridWidth: 500, gridHeight: 500 };

export function WorldMapScreen() {
  const navigate = useNavigate();
  const worldId = useGameStore((state) => state.worldId);
  const currentVillageId = useGameStore((state) => state.villageId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldEntities = useWorldEntitiesQuery(worldId);
  const myVillages = useMyVillagesQuery(worldId);
  const worldDetails = useWorldDetailsQuery(worldId);
  const { isWatchtowerBuilt, watchtowerLevel } = useBuildingsForLockCheck();
  const unreadCount = useUnreadReportsCount();
  const expeditions = useExpeditionsStore((state) => state.byId);

  const setEntities = useWorldMapStore((state) => state.setEntities);
  const selectedEntityId = useWorldMapStore((state) => state.selectedEntityId);
  const setSelectedEntity = useWorldMapStore((state) => state.setSelectedEntity);
  const [attackTarget, setAttackTarget] = useState<MapEntity | null>(null);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<WorldMapCanvasController | null>(null);

  const allEntities: MapEntity[] = useMemo(
    () => buildMapEntities(worldEntities.data ?? [], myVillages.data ?? [], userId),
    [worldEntities.data, myVillages.data, userId],
  );

  const visibleEntities: MapEntity[] = useMemo(
    () => filterEntitiesByVision(allEntities, watchtowerLevel),
    [allEntities, watchtowerLevel],
  );
  const expeditionSnapshots = useMemo(() => Object.values(expeditions), [expeditions]);

  useEffect(() => {
    setEntities(visibleEntities);
  }, [visibleEntities, setEntities]);

  // Clean store entry when leaving the map.
  useEffect(() => {
    return () => {
      useWorldMapStore.getState().clear();
    };
  }, []);

  const myVillage = visibleEntities.find((e) => e.id === currentVillageId && e.isMine)
    ?? visibleEntities.find((e) => e.isMine)
    ?? null;
  const selectedEntity = selectedEntityId
    ? visibleEntities.find((e) => e.id === selectedEntityId) ?? null
    : null;

  // Update tooltip screen-space position whenever the selection changes. We
  // declare this *before* any early return so React keeps the hook order stable.
  useEffect(() => {
    if (!selectedEntity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTooltipPosition(null);
      return;
    }
    let raf = 0;
    const tick = () => {
      const pos = canvasRef.current?.worldToScreen(selectedEntity.x, selectedEntity.y);
       
      if (pos) setTooltipPosition(pos);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selectedEntity]);

  if (!isWatchtowerBuilt) {
    return <WorldLockedScreen />;
  }

  const dims = worldDetails.data
    ? {
        gridWidth: worldDetails.data.gridWidth ?? FALLBACK_GRID.gridWidth,
        gridHeight: worldDetails.data.gridHeight ?? FALLBACK_GRID.gridHeight,
      }
    : FALLBACK_GRID;

  const visibilityRadius = WATCHTOWER_VISION_LEVELS[watchtowerLevel]?.visibilityRadius ?? null;

  const handleRecenter = () => {
    if (myVillage) {
      canvasRef.current?.centerOn(myVillage.x, myVillage.y);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-b from-parchment via-kingdom-50 to-kingdom-100">
      <div className="flex-shrink">
        <GameHeader />
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-6xl">
          <main className="relative h-full overflow-hidden border-y-2 border-game-gold-border bg-[#0d0f17]">
            {worldEntities.isLoading || myVillages.isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <WorldMapCanvas
                gridWidth={dims.gridWidth}
                gridHeight={dims.gridHeight}
                myVillage={myVillage}
                visibilityRadius={visibilityRadius}
                controllerRef={canvasRef}
              />
            )}

            <div className="pointer-events-none absolute inset-0">
              <div className="pointer-events-auto absolute left-3 top-3 rounded border-2 border-game-gold-border bg-black/70 px-3 py-1 text-xs text-parchment/80">
                {visibleEntities.length} entité{visibleEntities.length > 1 ? 's' : ''}
              </div>

              <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2">
                {isMiniMapVisible && (
                  <WorldMiniMap
                    gridWidth={dims.gridWidth}
                    gridHeight={dims.gridHeight}
                    entities={visibleEntities}
                    expeditions={expeditionSnapshots}
                    myVillage={myVillage}
                    visibilityRadius={visibilityRadius}
                    cameraCenter={myVillage ?? { x: dims.gridWidth / 2, y: dims.gridHeight / 2 }}
                    viewportTiles={{ width: 30, height: 30 }}
                  />
                )}
                <Tooltip
                  content={isMiniMapVisible ? 'Masquer la mini-carte' : 'Afficher la mini-carte'}
                  position="left"
                  variant="dark"
                >
                  <IconButton
                    icon={isMiniMapVisible ? X : MapIcon}
                    variant="warning"
                    size="md"
                    label={isMiniMapVisible ? 'Masquer la mini-carte' : 'Afficher la mini-carte'}
                    onClick={() => setIsMiniMapVisible((v) => !v)}
                  />
                </Tooltip>
              </div>

              <div className="pointer-events-auto absolute bottom-4 right-4">
                <Tooltip content="Recentrer sur mon village" position="left" variant="dark">
                  <IconButton
                    icon={Compass}
                    variant="warning"
                    size="md"
                    label="Recentrer sur mon village"
                    onClick={handleRecenter}
                    disabled={!myVillage}
                  />
                </Tooltip>
              </div>
            </div>

            {selectedEntity && tooltipPosition && (
              <WorldEntityTooltip screenPosition={tooltipPosition}>
                <SelectedEntityPanel
                  entity={selectedEntity}
                  currentVillageId={currentVillageId}
                  onClose={() => setSelectedEntity(null)}
                  onAttack={(target) => {
                    setAttackTarget(target);
                    setSelectedEntity(null);
                  }}
                />
              </WorldEntityTooltip>
            )}
          </main>
        </div>
      </div>

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
  );
}
