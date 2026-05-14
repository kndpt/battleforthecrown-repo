import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Compass, Map as MapIcon, X } from 'lucide-react';
import { GameHeader } from '@/features/layout/GameHeader';
import { ToastStack } from '@/features/layout/ToastStack';
import { BottomSheet, IconButton, Spinner, Tooltip } from '@/ui';
import { WorldMapCanvas, type WorldMapCanvasController } from './WorldMapCanvas';
import { SelectedEntityPanel } from './SelectedEntityPanel';
import { WorldLockedScreen } from './WorldLockedScreen';
import { WorldMiniMap } from './WorldMiniMap';
import { WorldEntityTooltip } from './WorldEntityTooltip';
import { buildMapEntities, filterEntitiesByVision } from './buildMapEntities';
import { AttackDetailModal } from '@/features/combat/AttackDetailModal';
import { KingdomActivitiesBottomSheet } from '@/features/combat/KingdomActivitiesBottomSheet';
import { useUnreadReportsCount } from '@/features/combat/useUnreadReportsCount';
import { BottomNavigationBar } from '@/features/layout/BottomNavigationBar';
import { useBuildingsForLockCheck } from '@/features/layout/useBuildingsForLockCheck';
import {
  useMyVillagesQuery,
  useOpenConquestsQuery,
  useOpenExpeditionsQuery,
  useWorldDetailsQuery,
  useWorldEntitiesQuery,
} from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { useAuthStore } from '@/stores/auth';
import { useExpeditionsStore } from '@/stores/expeditions';
import { useWorldMapStore } from '@/stores/worldMap';
import type { MapEntity } from '@/api/world-types';
import type { VisionDisk } from '@battleforthecrown/shared/world';
import type { WorldMapCameraSnapshot } from '@/pixi/scenes/WorldMapScene';
import {
  KingdomActivityHudBadges,
  type KingdomActivityTab,
} from '@/features/design-system/components';

const FALLBACK_GRID = { gridWidth: 500, gridHeight: 500 };
const EMPTY_VISION_DISKS: readonly VisionDisk[] = [];
const FALLBACK_VIEWPORT_TILES = { width: 30, height: 30 };

export function WorldMapScreen() {
  const navigate = useNavigate();
  const worldId = useGameStore((state) => state.worldId);
  const currentVillageId = useGameStore((state) => state.villageId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldEntities = useWorldEntitiesQuery(worldId);
  const myVillages = useMyVillagesQuery(worldId);
  const openConquests = useOpenConquestsQuery(worldId);
  const openExpeditions = useOpenExpeditionsQuery(worldId);
  const worldDetails = useWorldDetailsQuery(worldId);
  const { isWatchtowerBuilt } = useBuildingsForLockCheck();
  const unreadCount = useUnreadReportsCount();
  const expeditions = useExpeditionsStore((state) => state.byId);

  const setEntities = useWorldMapStore((state) => state.setEntities);
  const setVillage = useGameStore((state) => state.setVillage);
  const selectedEntityId = useWorldMapStore((state) => state.selectedEntityId);
  const setSelectedEntity = useWorldMapStore((state) => state.setSelectedEntity);
  const pendingFocus = useWorldMapStore((state) => state.pendingFocus);
  const setPendingFocus = useWorldMapStore((state) => state.setPendingFocus);
  const [attackTarget, setAttackTarget] = useState<MapEntity | null>(null);
  const [attackInitialMode, setAttackInitialMode] = useState<'attack' | 'scout'>('attack');
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(false);
  const [isKingdomActivitiesOpen, setIsKingdomActivitiesOpen] = useState(false);
  const [kingdomActivityTab, setKingdomActivityTab] = useState<KingdomActivityTab>('expeditions');
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [camera, setCamera] = useState<WorldMapCameraSnapshot>({
    center: { x: FALLBACK_GRID.gridWidth / 2, y: FALLBACK_GRID.gridHeight / 2 },
    viewportTiles: FALLBACK_VIEWPORT_TILES,
  });
  const canvasRef = useRef<WorldMapCanvasController | null>(null);
  const latestCameraRef = useRef(camera);
  const hasCameraSnapshotRef = useRef(false);
  const visionDisks = worldEntities.data?.visionDisks ?? EMPTY_VISION_DISKS;
  const fogOfWarEnabled = worldEntities.data?.fogOfWarEnabled ?? true;
  const dims = worldDetails.data
    ? {
        gridWidth: worldDetails.data.gridWidth ?? FALLBACK_GRID.gridWidth,
        gridHeight: worldDetails.data.gridHeight ?? FALLBACK_GRID.gridHeight,
      }
    : FALLBACK_GRID;

  const allEntities: MapEntity[] = useMemo(
    () => buildMapEntities(worldEntities.data?.entities ?? [], myVillages.data ?? [], userId),
    [worldEntities.data?.entities, myVillages.data, userId],
  );

  const visibleEntities: MapEntity[] = useMemo(
    () => filterEntitiesByVision(allEntities, visionDisks, fogOfWarEnabled),
    [allEntities, visionDisks, fogOfWarEnabled],
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

  useEffect(() => {
    if (hasCameraSnapshotRef.current) return;
    const fallbackCamera = {
      center: pendingFocus ?? myVillage ?? { x: dims.gridWidth / 2, y: dims.gridHeight / 2 },
      viewportTiles: FALLBACK_VIEWPORT_TILES,
    };
    latestCameraRef.current = fallbackCamera;
    setCamera(fallbackCamera);
    // pendingFocus volontairement hors deps : on l'utilise comme seed initial une fois,
    // l'application via centerOn est gérée par l'effet ci-dessous quand le canvas est prêt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.gridWidth, dims.gridHeight, myVillage]);

  useEffect(() => {
    if (!pendingFocus) return;
    if (!canvasRef.current) return;
    canvasRef.current.centerOn(pendingFocus.x, pendingFocus.y);
    setPendingFocus(null);
  }, [pendingFocus, worldEntities.isLoading, myVillages.isLoading, setPendingFocus]);

  useEffect(() => {
    if (isMiniMapVisible) {
      setCamera(latestCameraRef.current);
    }
  }, [isMiniMapVisible]);

  const canViewWorld = !fogOfWarEnabled || isWatchtowerBuilt || visionDisks.length > 0;
  if (!worldEntities.isLoading && !canViewWorld) {
    return <WorldLockedScreen />;
  }

  const handleRecenter = () => {
    if (myVillage) {
      canvasRef.current?.centerOn(myVillage.x, myVillage.y);
    }
  };

  const goToVillage = (target: MapEntity) => {
    setVillage(target.id);
    navigate('/game');
    setSelectedEntity(null);
  };

  const openKingdomActivities = (tab: KingdomActivityTab) => {
    setKingdomActivityTab(tab);
    setIsKingdomActivitiesOpen(true);
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
                visionDisks={visionDisks}
                fogOfWarEnabled={fogOfWarEnabled}
                onCameraChange={(nextCamera) => {
                  hasCameraSnapshotRef.current = true;
                  latestCameraRef.current = nextCamera;
                  if (isMiniMapVisible) {
                    setCamera(nextCamera);
                  }
                }}
                controllerRef={canvasRef}
              />
            )}

            <div className="pointer-events-none absolute inset-0">
              <div className="pointer-events-auto absolute left-3 top-3 flex flex-col items-start gap-2">
                <KingdomActivityHudBadges
                  badges={[
                    {
                      count: openExpeditions.data?.length ?? 0,
                      label: 'Expéditions',
                      onClick: () => openKingdomActivities('expeditions'),
                      tone: 'stone',
                    },
                    {
                      count: openConquests.data?.length ?? 0,
                      label: 'Captures',
                      onClick: () => openKingdomActivities('captures'),
                      tone: 'gold',
                    },
                  ]}
                />
              </div>

              <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2">
                {isMiniMapVisible && (
                  <WorldMiniMap
                    gridWidth={dims.gridWidth}
                    gridHeight={dims.gridHeight}
                    entities={visibleEntities}
                    expeditions={expeditionSnapshots}
                    myVillage={myVillage}
                    visionDisks={visionDisks}
                    cameraCenter={camera.center}
                    viewportTiles={camera.viewportTiles}
                    onRecenter={(x, y) => canvasRef.current?.centerOn(x, y)}
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
                  onAttack={(target) => {
                    setAttackInitialMode('attack');
                    setAttackTarget(target);
                    setSelectedEntity(null);
                  }}
                  onScout={(target) => {
                    setAttackInitialMode('scout');
                    setAttackTarget(target);
                    setSelectedEntity(null);
                  }}
                  onGoToVillage={goToVillage}
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
          initialMode={attackInitialMode}
          onClose={() => setAttackTarget(null)}
        />
      )}

      <BottomSheet
        isOpen={isKingdomActivitiesOpen}
        onClose={() => setIsKingdomActivitiesOpen(false)}
        maxHeight="82vh"
      >
        <KingdomActivitiesBottomSheet
          activeTab={kingdomActivityTab}
          onClose={() => setIsKingdomActivitiesOpen(false)}
          onTabChange={setKingdomActivityTab}
          worldId={worldId}
        />
      </BottomSheet>

      <ToastStack />
    </div>
  );
}
