import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { BottomSheet, Spinner } from "@/ui";
import {
  WorldMapCanvas,
  type WorldMapCanvasController,
} from "./WorldMapCanvas";
import {
  MapZoomControls,
  ZOOM_IN_FACTOR,
  ZOOM_OUT_FACTOR,
} from "./MapZoomControls";
import { SelectedEntityPanel } from "./SelectedEntityPanel";
import { WorldLockedScreen } from "./WorldLockedScreen";
import { WorldMiniMap } from "./WorldMiniMap";
import {
  clearWorldMapFocusSearch,
  parseWorldMapFocusSearch,
} from "./worldMapNavigation";
import {
  buildMapEntities,
  filterEntitiesByVision,
  filterEntitiesForNarrativeTarget,
} from "./buildMapEntities";
import { AttackDetailModal } from "@/features/combat/AttackDetailModal";
import { DefensiveFriendsSheet } from "@/features/social/DefensiveFriendsSheet";
import { CaravanLaunchModal } from "./CaravanLaunchModal";
import { KingdomActivitiesBottomSheet } from "@/features/combat/KingdomActivitiesBottomSheet";
import { OnboardingGuidance } from "@/features/onboarding/OnboardingGuidance";
import { getOnboardingGuidance } from "@/features/onboarding/onboardingViewModel";
import { useOnboardingCompletionAck } from "@/features/onboarding/onboardingCompletion";
import {
  runGameAction,
  type GameActionId,
} from "@/features/game-actions/gameActions";
import { useBuildingsForLockCheck } from "@/features/layout/useBuildingsForLockCheck";
import {
  useMyVillagesQuery,
  useOnboardingSummaryQuery,
  useOpenConquestsQuery,
  useOpenExpeditionsQuery,
  useWorldDetailsQuery,
  useWorldEntitiesQuery,
} from "@/api/queries";
import { useGameStore } from "@/stores/game";
import { useAuthStore } from "@/stores/auth";
import { useExpeditionsStore } from "@/stores/expeditions";
import { useWorldMapStore } from "@/stores/worldMap";
import type { MapEntity } from "@/api/world-types";
import type { VisionDisk } from "@battleforthecrown/shared/world";
import type { WorldMapCameraSnapshot } from "@/pixi/scenes/WorldMapScene";
import {
  KingdomActivityHudBadges,
  type KingdomActivityTab,
} from "@/features/design-system/components";

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
  const setSelectedEntity = useWorldMapStore(
    (state) => state.setSelectedEntity,
  );
  const pendingFocus = useWorldMapStore((state) => state.pendingFocus);
  const setPendingFocus = useWorldMapStore((state) => state.setPendingFocus);
  const [attackTarget, setAttackTarget] = useState<MapEntity | null>(null);
  const [caravanTarget, setCaravanTarget] = useState<MapEntity | null>(null);
  const [attackInitialMode, setAttackInitialMode] = useState<
    "attack" | "scout"
  >("attack");
  const [isKingdomActivitiesOpen, setIsKingdomActivitiesOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(false);
  const [kingdomActivityTab, setKingdomActivityTab] =
    useState<KingdomActivityTab>("expeditions");
  const [canvasReady, setCanvasReady] = useState(false);
  const [camera, setCamera] = useState<WorldMapCameraSnapshot>({
    center: { x: FALLBACK_GRID.gridWidth / 2, y: FALLBACK_GRID.gridHeight / 2 },
    viewportTiles: FALLBACK_VIEWPORT_TILES,
  });
  const canvasRef = useRef<WorldMapCanvasController | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const hasCameraSnapshotRef = useRef(false);
  const latestCameraRef = useRef(camera);
  const visionDisks = worldEntities.data?.visionDisks ?? EMPTY_VISION_DISKS;
  const fogOfWarEnabled = worldEntities.data?.fogOfWarEnabled ?? true;
  const dims = worldDetails.data
    ? {
        gridWidth: worldDetails.data.gridWidth ?? FALLBACK_GRID.gridWidth,
        gridHeight: worldDetails.data.gridHeight ?? FALLBACK_GRID.gridHeight,
      }
    : FALLBACK_GRID;

  const allEntities: MapEntity[] = useMemo(
    () =>
      buildMapEntities(
        worldEntities.data?.entities ?? [],
        myVillages.data ?? [],
        userId,
      ),
    [worldEntities.data?.entities, myVillages.data, userId],
  );

  // During onboarding step 6, hide every barbarian except the scripted target.
  const onboardingNarrativeTargetId =
    onboardingSummary.data?.status === "ACTIVE" &&
    onboardingSummary.data.currentStep === "ATTACK_BARBARIAN"
      ? onboardingSummary.data.narrativeTargetVillageId
      : null;

  const visibleEntities: MapEntity[] = useMemo(() => {
    const visible = filterEntitiesByVision(
      allEntities,
      visionDisks,
      fogOfWarEnabled,
    );
    return onboardingNarrativeTargetId
      ? filterEntitiesForNarrativeTarget(visible, onboardingNarrativeTargetId)
      : visible;
  }, [allEntities, visionDisks, fogOfWarEnabled, onboardingNarrativeTargetId]);
  const urlFocus = useMemo(
    () => parseWorldMapFocusSearch(searchParams),
    [searchParams],
  );
  const activeFocus = urlFocus ?? pendingFocus;
  const expeditionSnapshots = useMemo(
    () => Object.values(expeditions),
    [expeditions],
  );
  const onboardingCompletion = useOnboardingCompletionAck(
    worldId,
    currentVillageId,
  );
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

  const myVillage =
    visibleEntities.find((e) => e.id === currentVillageId && e.isMine) ??
    visibleEntities.find((e) => e.isMine) ??
    null;
  const selectedEntity = selectedEntityId
    ? (visibleEntities.find((e) => e.id === selectedEntityId) ?? null)
    : null;
  const selectedCapture = selectedEntity
    ? (openConquests.data?.find(
        (conquest) => conquest.targetVillageId === selectedEntity.id,
      ) ?? null)
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
      center: activeFocus ??
        myVillage ?? { x: dims.gridWidth / 2, y: dims.gridHeight / 2 },
      viewportTiles: FALLBACK_VIEWPORT_TILES,
    };
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
      setSearchParams(clearWorldMapFocusSearch(searchParams), {
        replace: true,
      });
    }
  }, [
    activeFocus,
    canvasReady,
    pendingFocus,
    searchParams,
    setPendingFocus,
    setSearchParams,
    setSelectedEntity,
    urlFocus,
  ]);

  // À l'ouverture, resynchronise le state caméra avec le dernier snapshot capté
  // pendant que la minimap était fermée (sinon viewbox figée à l'ouverture).
  useEffect(() => {
    if (isMiniMapOpen) setCamera(latestCameraRef.current);
  }, [isMiniMapOpen]);

  const canViewWorld =
    !fogOfWarEnabled || isWatchtowerBuilt || visionDisks.length > 0;
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
    navigate("/game");
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
                  // La minimap (repliée par défaut) se redessine à chaque update
                  // caméra. Tant qu'elle est fermée, on n'écrit pas le snapshot
                  // dans le state React → pas de re-render/redraw pendant pan/zoom.
                  if (isMiniMapOpen) setCamera(nextCamera);
                }}
                onControllerReady={setCanvasReady}
                controllerRef={canvasRef}
              />
            )}

            {/* Split view : la minimap occupe la moitié haute (navigation par
                tap/drag) ; la map Pixi interactive reste accessible en dessous.
                Repliable via l'onglet qui dépasse en bas (slide vers le haut). */}
            {!worldEntities.isLoading && !myVillages.isLoading && (
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 z-20 h-1/2 transition-transform duration-300 ease-out ${
                  isMiniMapOpen ? "translate-y-0" : "-translate-y-full"
                }`}
              >
                <div className="pointer-events-auto h-full w-full overflow-hidden border-b-2 border-game-gold-border bg-[#2e2112] shadow-xl">
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
                </div>
                <button
                  type="button"
                  onClick={() => setIsMiniMapOpen((open) => !open)}
                  aria-label={
                    isMiniMapOpen ? "Fermer la minimap" : "Ouvrir la minimap"
                  }
                  className="pointer-events-auto absolute left-1/2 top-full flex -translate-x-1/2 items-center gap-1.5 rounded-b-xl border-2 border-t-0 border-game-gold-border bg-gradient-to-b from-[#5a4424] to-[#2e2112] px-4 py-1.5 font-game text-xs font-bold uppercase tracking-wide text-game-gold-light shadow-lg transition-all hover:brightness-110 active:translate-y-px"
                >
                  {isMiniMapOpen ? (
                    <ChevronUp size={16} strokeWidth={2.5} />
                  ) : (
                    <ChevronDown size={16} strokeWidth={2.5} />
                  )}
                  {isMiniMapOpen ? "Fermer" : "Minimap"}
                </button>
              </div>
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

              <div className="pointer-events-auto absolute left-3 top-9 flex flex-col items-start gap-2">
                <KingdomActivityHudBadges
                  badges={[
                    {
                      count: openExpeditions.data?.length ?? 0,
                      label: "Expéditions",
                      onClick: () => openKingdomActivities("expeditions"),
                      tone: "stone",
                    },
                    {
                      count: openConquests.data?.length ?? 0,
                      label: "Captures",
                      onClick: () => openKingdomActivities("captures"),
                      tone: "gold",
                    },
                  ]}
                />
                <button
                  type="button"
                  onClick={() => setIsFriendsOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border-2 border-game-gold-border bg-gradient-to-b from-[#5a4424] to-[#2e2112] px-2.5 py-1.5 font-game text-[11px] font-bold uppercase tracking-wide text-game-gold-light shadow-lg transition-all hover:brightness-110 active:translate-y-px"
                >
                  <Users size={14} strokeWidth={2.2} />
                  Amis
                </button>
              </div>

              <div className="pointer-events-auto absolute right-4 bottom-[calc(var(--bftc-bottom-nav-height,88px)_+_16px)]">
                <MapZoomControls
                  onZoomIn={() => canvasRef.current?.zoomBy(ZOOM_IN_FACTOR)}
                  onZoomOut={() => canvasRef.current?.zoomBy(ZOOM_OUT_FACTOR)}
                  onRecenter={handleRecenter}
                  recenterDisabled={!myVillage}
                />
              </div>
            </div>

            {selectedEntity && (
              <div
                ref={panelRef}
                className="pointer-events-auto fixed left-1/2 z-30 -translate-x-1/2"
                // Ancré par le bas : le bec reste à un Y stable et la caméra cale
                // le village dans la zone dégagée sous le panneau.
                style={{ bottom: "24vh" }}
              >
                <SelectedEntityPanel
                  activeCapture={selectedCapture}
                  entity={selectedEntity}
                  currentVillageId={currentVillageId}
                  currentUserId={userId}
                  onAttack={(target) => {
                    setAttackInitialMode("attack");
                    setAttackTarget(target);
                    setSelectedEntity(null);
                  }}
                  onScout={(target) => {
                    setAttackInitialMode("scout");
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

      <DefensiveFriendsSheet
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
      />

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
