import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Compass, Map as MapIcon, X } from 'lucide-react';
import { BottomSheet, IconButton, Spinner, Tooltip } from '@/ui';
import { WorldMapCanvas, type WorldMapCanvasController } from './WorldMapCanvas';
import { SelectedEntityPanel } from './SelectedEntityPanel';
import { WorldLockedScreen } from './WorldLockedScreen';
import { WorldMiniMap } from './WorldMiniMap';
import { clearWorldMapFocusSearch, parseWorldMapFocusSearch } from './worldMapNavigation';
import {
  buildMapEntities,
  filterEntitiesByVision,
  filterEntitiesForNarrativeTarget,
} from './buildMapEntities';
import { AttackDetailModal } from '@/features/combat/AttackDetailModal';
import { CaravanLaunchModal } from './CaravanLaunchModal';
import { KingdomActivitiesBottomSheet } from '@/features/combat/KingdomActivitiesBottomSheet';
import { OnboardingGuidance } from '@/features/onboarding/OnboardingGuidance';
import { getOnboardingGuidance } from '@/features/onboarding/onboardingViewModel';
import { useOnboardingCompletionAck } from '@/features/onboarding/onboardingCompletion';
import { runGameAction, type GameActionId } from '@/features/game-actions/gameActions';
import { useBuildingsForLockCheck } from '@/features/layout/useBuildingsForLockCheck';
import {
  useMyVillagesQuery,
  useOnboardingSummaryQuery,
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
// Décalage vertical (px) entre le bas du panneau et le village ciblé : assez
// pour que le sprite + l'anneau de sélection soient entièrement visibles sous
// la carte. Augmenter = village plus bas dans la vue.
const VILLAGE_REVEAL_GAP_PX = 65;
const EMPTY_VISION_DISKS: readonly VisionDisk[] = [];
const FALLBACK_VIEWPORT_TILES = { width: 30, height: 30 };

export function WorldMapScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = useGameStore((state) => state.worldId);
  const currentVillageId = useGameStore((state) => state.villageId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldEntities = useWorldEntitiesQuery(worldId);
  const myVillages = useMyVillagesQuery(worldId);
  const onboardingSummary = useOnboardingSummaryQuery(worldId);
  const openConquests = useOpenConquestsQuery(worldId);
  const openExpeditions = useOpenExpeditionsQuery(worldId);
  const worldDetails = useWorldDetailsQuery(worldId);
  const { isWatchtowerBuilt } = useBuildingsForLockCheck();
  const expeditions = useExpeditionsStore((state) => state.byId);

  const setEntities = useWorldMapStore((state) => state.setEntities);
  const setVillage = useGameStore((state) => state.setVillage);
  const selectedEntityId = useWorldMapStore((state) => state.selectedEntityId);
  const setSelectedEntity = useWorldMapStore((state) => state.setSelectedEntity);
  const pendingFocus = useWorldMapStore((state) => state.pendingFocus);
  const setPendingFocus = useWorldMapStore((state) => state.setPendingFocus);
  const [attackTarget, setAttackTarget] = useState<MapEntity | null>(null);
  const [caravanTarget, setCaravanTarget] = useState<MapEntity | null>(null);
  const [attackInitialMode, setAttackInitialMode] = useState<'attack' | 'scout'>('attack');
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(false);
  const [isKingdomActivitiesOpen, setIsKingdomActivitiesOpen] = useState(false);
  const [kingdomActivityTab, setKingdomActivityTab] = useState<KingdomActivityTab>('expeditions');
  const [canvasReady, setCanvasReady] = useState(false);
  const [camera, setCamera] = useState<WorldMapCameraSnapshot>({
    center: { x: FALLBACK_GRID.gridWidth / 2, y: FALLBACK_GRID.gridHeight / 2 },
    viewportTiles: FALLBACK_VIEWPORT_TILES,
  });
  const canvasRef = useRef<WorldMapCanvasController | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
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

  // During onboarding step 6, hide every barbarian except the scripted target.
  const onboardingNarrativeTargetId =
    onboardingSummary.data?.status === 'ACTIVE' &&
    onboardingSummary.data.currentStep === 'ATTACK_BARBARIAN'
      ? onboardingSummary.data.narrativeTargetVillageId
      : null;

  const visibleEntities: MapEntity[] = useMemo(() => {
    const visible = filterEntitiesByVision(allEntities, visionDisks, fogOfWarEnabled);
    return onboardingNarrativeTargetId
      ? filterEntitiesForNarrativeTarget(visible, onboardingNarrativeTargetId)
      : visible;
  }, [allEntities, visionDisks, fogOfWarEnabled, onboardingNarrativeTargetId]);
  const urlFocus = useMemo(() => parseWorldMapFocusSearch(searchParams), [searchParams]);
  const activeFocus = urlFocus ?? pendingFocus;
  const expeditionSnapshots = useMemo(() => Object.values(expeditions), [expeditions]);
  const onboardingCompletion = useOnboardingCompletionAck(worldId, currentVillageId);
  const onboardingGuidance = getOnboardingGuidance(onboardingSummary.data, {
    completionAcknowledged: onboardingCompletion.acknowledged,
  });

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
  const selectedCapture = selectedEntity
    ? openConquests.data?.find((conquest) => conquest.targetVillageId === selectedEntity.id) ?? null
    : null;

  // Le panneau de sélection est FIXE sur la vue (bottom-anchored). À la
  // sélection, on pan la caméra (animé) pour caler le village sous le bec du
  // panneau, de sorte qu'il pointe toujours sur la cible. On mesure le bec
  // après layout ; le panneau étant ancré par le bas, son bec reste à un Y
  // stable même si le corps grandit (intel chargée en différé). Hook déclaré
  // avant tout early return pour garder l'ordre des hooks stable.
  useLayoutEffect(() => {
    if (!selectedEntity || !canvasReady) return;
    const el = panelRef.current;
    const ctrl = canvasRef.current;
    if (!el || !ctrl) return;
    const rect = el.getBoundingClientRect();
    // Ancre écran sous le panneau : on cale le village plus bas que la pointe du
    // bec (~13px) pour qu'il soit entièrement dégagé sous la carte, pas à moitié
    // masqué derrière. La caméra descend d'autant.
    const anchor = {
      x: rect.left + rect.width / 2,
      y: rect.bottom + VILLAGE_REVEAL_GAP_PX,
    };
    ctrl.focusOn(selectedEntity.x, selectedEntity.y, anchor, true);
    // On veut paner UNIQUEMENT quand la cible change (id) ou que le canvas devient
    // prêt — pas à chaque rafraîchissement de données. `selectedEntity` est un
    // objet recalculé par `.find()` à chaque render et muté par les ticks
    // (ressources, etc.) ; l'inclure relancerait le pan en boucle. On le lit donc
    // sans le mettre en deps.
    // Retrait possible quand l'effet dérivera les coords de scalaires stables
    // (ex. `selectedEntity.x/.y` figés dans un ref) au lieu de capturer l'objet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntityId, canvasReady]);

  useEffect(() => {
    if (hasCameraSnapshotRef.current) return;
    const fallbackCamera = {
      center: activeFocus ?? myVillage ?? { x: dims.gridWidth / 2, y: dims.gridHeight / 2 },
      viewportTiles: FALLBACK_VIEWPORT_TILES,
    };
    latestCameraRef.current = fallbackCamera;
    setCamera(fallbackCamera);
    // activeFocus volontairement hors deps : on l'utilise comme seed initial une fois,
    // l'application via centerOn est gérée par l'effet ci-dessous quand le canvas est prêt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.gridWidth, dims.gridHeight, myVillage]);

  useEffect(() => {
    if (!activeFocus) return;
    if (!canvasReady) return;
    if (!canvasRef.current) return;

    canvasRef.current.centerOn(activeFocus.x, activeFocus.y);
    setSelectedEntity(null);

    if (pendingFocus) {
      setPendingFocus(null);
    }
    if (urlFocus) {
      setSearchParams(clearWorldMapFocusSearch(searchParams), { replace: true });
    }
  }, [activeFocus, canvasReady, pendingFocus, searchParams, setPendingFocus, setSearchParams, setSelectedEntity, urlFocus]);

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

  const runWorldAction = (actionId: GameActionId) => {
    runGameAction(actionId, { navigate });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
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
                onControllerReady={setCanvasReady}
                controllerRef={canvasRef}
              />
            )}

            <div className="pointer-events-none absolute inset-0">
              <OnboardingGuidance
                guidance={onboardingGuidance}
                isLoading={
                  onboardingSummary.isLoading ||
                  worldEntities.isLoading ||
                  myVillages.isLoading
                }
                onAcknowledge={onboardingCompletion.acknowledge}
                onAction={runWorldAction}
                onNavigate={navigate}
              />

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

              <div className="pointer-events-auto absolute right-3 top-[160px] flex flex-col items-end gap-2">
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

            {selectedEntity && (
              <div
                ref={panelRef}
                className="pointer-events-auto fixed left-1/2 z-30 -translate-x-1/2"
                // Ancré par le bas : le bec reste à un Y stable et la caméra cale
                // le village dans la zone dégagée sous le panneau.
                style={{ bottom: '24vh' }}
              >
                <SelectedEntityPanel
                  activeCapture={selectedCapture}
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
                  onCaravan={(target) => {
                    setCaravanTarget(target);
                    setSelectedEntity(null);
                  }}
                  onGoToVillage={goToVillage}
                  onClose={() => setSelectedEntity(null)}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {attackTarget && myVillage && (
        <AttackDetailModal
          target={attackTarget}
          origin={{ x: myVillage.x, y: myVillage.y }}
          initialMode={attackInitialMode}
          onClose={() => setAttackTarget(null)}
        />
      )}

      {caravanTarget && myVillage && (
        <CaravanLaunchModal
          target={caravanTarget}
          origin={{ x: myVillage.x, y: myVillage.y }}
          onClose={() => setCaravanTarget(null)}
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
    </div>
  );
}
