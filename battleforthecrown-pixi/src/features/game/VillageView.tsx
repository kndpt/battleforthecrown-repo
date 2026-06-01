import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type UIEvent,
} from 'react';
import { useNavigate } from 'react-router';
import { useQueries } from '@tanstack/react-query';
import { BottomSheet } from '@/ui';
import { Spinner } from '@/ui/spinners';
import { BuildingDetailModal } from '@/features/village/BuildingDetailModal';
import { QueueBottomSheet } from '@/features/village/QueueBottomSheet';
import { VillageStyleControl } from '@/features/village/VillageStyleControl';
import { metaFor } from '@/features/village/buildingMeta';
import { DailyRetentionWidget } from '@/features/retention/DailyRetentionWidget';
import { OnboardingGuidance } from '@/features/onboarding/OnboardingGuidance';
import { getOnboardingGuidance } from '@/features/onboarding/onboardingViewModel';
import { PowerBottomSheet } from '@/features/power/PowerBottomSheet';
import { BottomNavigationBar } from '@/features/layout/BottomNavigationBar';
import {
  MultiVillageBottomSheet,
  type MultiVillageActivityKind,
  type MultiVillageFilter,
} from '@/features/design-system/components/MultiVillageBottomSheet';
import {
  PlayerProfileSheet,
  type PlayerProfileSheetProps,
  type PlayerProfileSheetTab,
  type PlayerProfileSheetVillage,
} from '@/features/design-system/components/PlayerProfileSheet';
import { villageStyleOptions } from '@/features/design-system/components/villageStyleData';
import {
  buildMultiVillageSheetItems,
  multiVillageBottomSheetLabels,
} from '@/features/layout/multiVillageSheet';
import { useDisplayResources, useDisplayCrowns } from '@/features/resources/useDisplayResources';
import { useUnreadReportsCount } from '@/features/combat/useUnreadReportsCount';
import { runGameAction, type GameActionId } from '@/features/game-actions/gameActions';
import {
  VillageBuildingCatalog,
  VillageConstructionQueueStrip,
  VillageResourcesBar,
  type VillageResourceType,
} from './VillageViewSections';
import { categorizeVillageBuildings } from './VillageViewData';

import { publicAsset } from '@/lib/publicAsset';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { useTickingNow } from '@/lib/useTickingNow';
import {
  useClaimDailyCardMutation,
  useMyVillagesQuery,
  useOnboardingSummaryQuery,
  useRetentionSummaryQuery,
  useVillageBuildingsQuery,
  useBuildingQueueQuery,
  usePopulationQuery,
  useKingdomPowerQuery,
  useLogout,
  useMyMembershipsQuery,
  usePublicWorldsQuery,
  useCancelConstructionMutation,
  armyTrainingQueryOptions,
  buildingsQueryOptions,
  populationQueryOptions,
  queueQueryOptions,
  resourcesQueryOptions,
  useVillageStrategyQuery,
  villageStrategyQueryOptions,
} from '@/api/queries';
import type { BuildingDto } from '@/api';
import { BUILDING_TYPES } from '@battleforthecrown/shared/village/buildings';
import { VILLAGE_LABEL_DISPLAY } from '@battleforthecrown/shared/village';
import { villageVisualTierFromCastleLevel } from '@battleforthecrown/shared/world';
import type { PublicWorld } from '@battleforthecrown/shared/world';
import { WORLD_SIGIL_GLYPHS, WORLD_THEME_TOKENS } from '@/features/worlds/worldsViewModel';

// ─── Constants ───────────────────────────────────────────────────────────────

const integerFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const HERO_SCROLL_FADE_DISTANCE = 340;
const HERO_EXPANDED_HEIGHT = 368;

const RESOURCE_BUILDING_BY_TYPE: Record<'iron' | 'stone' | 'wood', string> = {
  iron: BUILDING_TYPES.IRON,
  stone: BUILDING_TYPES.STONE,
  wood: BUILDING_TYPES.WOOD,
};

const profileSheetIcons: PlayerProfileSheetProps['icons'] = {
  armyPower: '/assets/army-power.png',
  castle: '/assets/castle.png',
  crown: '/assets/casual-icons/crown.png',
  defense: '/assets/hand-silver.png',
  position: '/assets/position.png',
  raids: '/assets/hand-red.png',
};

const profileSheetLabels: PlayerProfileSheetProps['labels'] = {
  close: 'Fermer',
  history: 'Historique',
  logout: 'Quitter la session',
  phase: 'Phase',
  tabs: { profile: 'Profil', settings: 'Réglages', villages: 'Villages' },
  villageHint: 'Styles et niveaux affichés uniquement quand les données existent.',
  world: 'Monde',
};

const profileSheetSettings: PlayerProfileSheetProps['settings'] = [
  { icon: '—', id: 'notifications', label: 'Notifications', value: 'À venir' },
  { icon: '—', id: 'sound', label: 'Son et musique', value: 'À venir' },
  { icon: '—', id: 'language', label: 'Langue', value: 'À venir' },
];

const strategyLabels = Object.fromEntries(villageStyleOptions.map((o) => [o.id, o.name]));

type HeroSwipeState = {
  pointerId: number;
  startX: number;
  startY: number;
};

type VillageTransitionDirection = -1 | 0 | 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPlayerInitials(email: string | null | undefined): string {
  const source = email?.trim();
  if (!source) return '—';
  const localPart = source.split('@')[0] ?? source;
  const parts = localPart.split(/[._-]+/).filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`
      : localPart.slice(0, 2);
  return letters.toUpperCase();
}

function formatWorldPhase(world: PublicWorld | undefined): string {
  if (!world) return '—';
  if (world.status === 'PLANNED') return 'Planifié';
  if (world.status === 'LOCKED') return 'Verrouillé';
  if (world.lifecycle.inscriptionPhase === 'main') return 'Inscription ouverte';
  if (world.lifecycle.inscriptionPhase === 'late') return 'Retardataires';
  return 'Inscriptions closes';
}

function toResultMap<T>(
  ids: string[],
  results: readonly { data?: T }[],
): ReadonlyMap<string, T> {
  return new Map(
    ids.flatMap((id, index) => {
      const data = results[index]?.data;
      return data === undefined ? [] : [[id, data] as const];
    }),
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VillageView() {
  const navigate = useNavigate();

  // Auth & context
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;
  const villageId = useGameStore((s) => s.villageId);
  const worldId = useGameStore((s) => s.worldId);
  const setVillage = useGameStore((s) => s.setVillage);
  const logout = useLogout();

  // Village data
  const buildingsQuery = useVillageBuildingsQuery(villageId);
  const queueQuery = useBuildingQueueQuery(villageId);
  const populationQuery = usePopulationQuery(villageId);
  const myVillages = useMyVillagesQuery(worldId);
  const strategyQuery = useVillageStrategyQuery(villageId);

  // Global data
  const { display: resources, hasSnapshot } = useDisplayResources(villageId);
  const { balance: crownBalance } = useDisplayCrowns(userId, worldId);
  const kingdomPower = useKingdomPowerQuery();
  const retentionSummary = useRetentionSummaryQuery(worldId);
  const onboardingSummary = useOnboardingSummaryQuery(worldId);
  const claimDailyCard = useClaimDailyCardMutation();
  const cancelConstruction = useCancelConstructionMutation();
  const memberships = useMyMembershipsQuery();
  const publicWorlds = usePublicWorldsQuery();

  const unreadCount = useUnreadReportsCount();
  const now = useTickingNow(1_000);

  // UI state
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingDto | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPowerOpen, setIsPowerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isVillageSheetOpen, setIsVillageSheetOpen] = useState(false);
  const [isVillageStyleOpen, setIsVillageStyleOpen] = useState(false);
  const [isRetentionOpen, setIsRetentionOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<PlayerProfileSheetTab>('profile');
  const [villageFilter, setVillageFilter] = useState<MultiVillageFilter>('all');
  const [sortAscending, setSortAscending] = useState(true);
  const [heroScrollProgress, setHeroScrollProgress] = useState(0);
  const [villageTransitionDirection, setVillageTransitionDirection] =
    useState<VillageTransitionDirection>(0);
  const heroSwipeRef = useRef<HeroSwipeState | null>(null);
  const pendingHeroScrollTopRef = useRef(0);
  const heroScrollFrameRef = useRef<number | null>(null);
  const suppressHeroClickRef = useRef(false);

  // ── Derived data ────────────────────────────────────────────────────────────

  const buildings = useMemo(
    () =>
      [...(buildingsQuery.data ?? [])].sort(
        (a, b) =>
          metaFor(a.type).sortKey - metaFor(b.type).sortKey || a.type.localeCompare(b.type),
      ),
    [buildingsQuery.data],
  );

  const castleBuilding = buildings.find((b) => b.type === BUILDING_TYPES.CASTLE);
  const castleLevel = castleBuilding?.level ?? 0;
  const villageTier = villageVisualTierFromCastleLevel(Math.max(1, castleLevel));
  const buildingQueue = useMemo(() => queueQuery.data ?? [], [queueQuery.data]);
  const queueByBuildingId = useMemo(
    () => new Map(buildingQueue.map((e) => [e.id, e])),
    [buildingQueue],
  );

  const villages = useMemo(() => myVillages.data ?? [], [myVillages.data]);
  const fallbackVillageId =
    villages.find((v) => v.isCapital)?.id ?? villages[0]?.id ?? null;
  const activeVillage =
    villages.find((v) => v.id === villageId) ?? villages[0] ?? null;
  const activeVillageIndex = activeVillage
    ? villages.findIndex((v) => v.id === activeVillage.id)
    : -1;

  const activeVillagePower =
    kingdomPower.data?.villages.find((v) => v.villageId === villageId)?.total ?? 0;
  const totalKingdomPower = kingdomPower.data?.kingdomPower ?? 0;

  const onboardingGuidance = getOnboardingGuidance(onboardingSummary.data);
  const retentionBadge = retentionSummary.data?.claimableCount ?? 0;
  const crownsDisplay = Number.isFinite(crownBalance ?? NaN)
    ? integerFormatter.format(Math.floor(crownBalance ?? 0))
    : '0';

  const currentStrategy = strategyQuery.data?.currentStrategy ?? 'BALANCED';
  const canOpenVillageStyle = buildings.some(
    (building) =>
      building.type === BUILDING_TYPES.COUNCIL_HALL &&
      building.level >= 1 &&
      !building.isUnderConstruction,
  );
  const strategyOption = canOpenVillageStyle
    ? villageStyleOptions.find((o) => o.id === currentStrategy) ?? villageStyleOptions[3]
    : null;
  const { byCategory, lockedBuildings } = useMemo(
    () => categorizeVillageBuildings(buildings, castleLevel),
    [buildings, castleLevel],
  );

  const builtCount = buildings.filter((b) => b.level > 0).length;

  // ── Per-village data for sheets ──────────────────────────────────────────────

  const villageIds = useMemo(() => villages.map((v) => v.id), [villages]);
  const shouldLoadVillageData = isVillageSheetOpen;
  const shouldLoadProfileVillages = isProfileOpen && profileTab === 'villages';

  const villageResources = useQueries({
    queries: villageIds.map((id) => ({
      ...resourcesQueryOptions(id),
      enabled: shouldLoadVillageData,
    })),
  });
  const villagePopulation = useQueries({
    queries: villageIds.map((id) => ({
      ...populationQueryOptions(id),
      enabled: shouldLoadVillageData,
    })),
  });
  const villageBuildings = useQueries({
    queries: villageIds.map((id) => ({
      ...buildingsQueryOptions(id),
      enabled: shouldLoadVillageData || shouldLoadProfileVillages,
    })),
  });
  const villageQueue = useQueries({
    queries: villageIds.map((id) => ({
      ...queueQueryOptions(id),
      enabled: shouldLoadVillageData,
    })),
  });
  const villageStrategyQ = useQueries({
    queries: villageIds.map((id) => ({
      ...villageStrategyQueryOptions(id),
      enabled: shouldLoadVillageData || shouldLoadProfileVillages,
    })),
  });
  const villageTraining = useQueries({
    queries: villageIds.map((id) => ({
      ...armyTrainingQueryOptions(id),
      enabled: shouldLoadVillageData,
    })),
  });

  const powerByVillageId = useMemo(
    () =>
      new Map(
        (kingdomPower.data?.villages ?? []).map((v) => [v.villageId, v.total]),
      ),
    [kingdomPower.data?.villages],
  );
  const resourcesByVillageId = useMemo(
    () => toResultMap(villageIds, villageResources),
    [villageIds, villageResources],
  );
  const populationByVillageId = useMemo(
    () => toResultMap(villageIds, villagePopulation),
    [villageIds, villagePopulation],
  );
  const buildingsByVillageId = useMemo(
    () => toResultMap(villageIds, villageBuildings),
    [villageIds, villageBuildings],
  );
  const queueByVillageId = useMemo(
    () => toResultMap(villageIds, villageQueue),
    [villageIds, villageQueue],
  );
  const strategyByVillageId = useMemo(
    () => toResultMap(villageIds, villageStrategyQ),
    [villageIds, villageStrategyQ],
  );
  const trainingByVillageId = useMemo(
    () => toResultMap(villageIds, villageTraining),
    [villageIds, villageTraining],
  );

  const villageSheetItems = useMemo(
    () =>
      buildMultiVillageSheetItems(villages, activeVillage?.id ?? villageId, {
        buildingsByVillageId,
        populationByVillageId,
        powerByVillageId,
        queueByVillageId,
        resourcesByVillageId,
        strategyByVillageId,
        trainingByVillageId,
      }).toSorted((a, b) =>
        sortAscending
          ? a.name.localeCompare(b.name, 'fr')
          : b.name.localeCompare(a.name, 'fr'),
      ),
    [
      activeVillage?.id,
      buildingsByVillageId,
      populationByVillageId,
      powerByVillageId,
      queueByVillageId,
      resourcesByVillageId,
      sortAscending,
      strategyByVillageId,
      trainingByVillageId,
      villageId,
      villages,
    ],
  );

  // Profile sheet data
  const activeMembership = memberships.data?.find((m) => m.worldId === worldId);
  const activePublicWorld = publicWorlds.data?.find((w) => w.id === worldId);

  const profileVillages = useMemo<PlayerProfileSheetVillage[]>(
    () =>
      villages.map((village) => {
        const strategy = strategyByVillageId.get(village.id)?.currentStrategy;
        const level =
          village.castleLevel ??
          buildingsByVillageId
            .get(village.id)
            ?.find((b) => b.type === 'CASTLE')?.level ??
          '—';
        return {
          capital: village.isCapital,
          coords: `${village.x}:${village.y}`,
          id: village.id,
          label: village.label ? VILLAGE_LABEL_DISPLAY[village.label] : undefined,
          level,
          name: village.name,
          power: powerByVillageId.get(village.id)?.toLocaleString('fr-FR') ?? '—',
          style: strategy
            ? { id: strategy, label: strategyLabels[strategy] ?? strategy }
            : undefined,
        };
      }),
    [buildingsByVillageId, powerByVillageId, strategyByVillageId, villages],
  );

  const profileSheetData = useMemo<
    Pick<PlayerProfileSheetProps, 'player' | 'stats' | 'world'>
  >(() => {
    const power = kingdomPower.data
      ? integerFormatter.format(kingdomPower.data.kingdomPower)
      : '—';
    const crowns = Number.isFinite(crownBalance ?? NaN)
      ? integerFormatter.format(Math.floor(crownBalance ?? 0))
      : '—';
    return {
      player: {
        initials: getPlayerInitials(user?.email),
        level: castleLevel > 0 ? castleLevel : '—',
        name: user?.email ?? 'Joueur',
        online: Boolean(user),
        tribe: { cap: 0, members: 0, name: 'Sans tribu', role: 'À venir', tag: '—' },
      },
      stats: {
        crowns,
        defenses: 'À venir',
        points: 'À venir',
        power,
        raidsWon: 'À venir',
        rank: '—',
        rankTotal: '—',
        villages: villages.length,
      },
      world: {
        day: activePublicWorld?.lifecycle.day ?? '—',
        name:
          activePublicWorld?.identity.displayName ??
          activeMembership?.worldName ??
          worldId ??
          'À venir',
        phase: formatWorldPhase(activePublicWorld),
        sigilGlyph: activePublicWorld
          ? WORLD_SIGIL_GLYPHS[activePublicWorld.identity.sigil]
          : WORLD_SIGIL_GLYPHS.crown,
        theme: activePublicWorld
          ? WORLD_THEME_TOKENS[activePublicWorld.identity.themeColor]
          : WORLD_THEME_TOKENS.green,
        total: activePublicWorld?.lifecycle.totalDays ?? '—',
      },
    };
  }, [
    activeMembership?.worldName,
    activePublicWorld,
    castleLevel,
    crownBalance,
    kingdomPower.data,
    user,
    villages.length,
    worldId,
  ]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  // Auto-select a village when none is set or the current one is gone
  useEffect(() => {
    if (
      fallbackVillageId &&
      (!villageId || !villages.some((v) => v.id === villageId))
    ) {
      setVillage(fallbackVillageId);
    }
  }, [fallbackVillageId, setVillage, villageId, villages]);

  useEffect(
    () => () => {
      if (heroScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(heroScrollFrameRef.current);
      }
    },
    [],
  );

  const handleVillageScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    pendingHeroScrollTopRef.current = event.currentTarget.scrollTop;
    if (heroScrollFrameRef.current !== null) return;

    heroScrollFrameRef.current = window.requestAnimationFrame(() => {
      heroScrollFrameRef.current = null;
      const nextProgress = Math.min(
        1,
        Math.max(0, pendingHeroScrollTopRef.current / HERO_SCROLL_FADE_DISTANCE),
      );
      const easedProgress = nextProgress ** 1.55;
      setHeroScrollProgress((currentProgress) =>
        Math.abs(currentProgress - easedProgress) < 0.01 ? currentProgress : easedProgress,
      );
    });
  }, []);

  const heroShellStyle = useMemo<CSSProperties>(
    () => ({
      height: HERO_EXPANDED_HEIGHT,
    }),
    [],
  );

  const heroBackgroundStyle = useMemo<CSSProperties>(
    () => ({
      filter: `brightness(${1 - heroScrollProgress * 0.2}) saturate(${
        1 - heroScrollProgress * 0.16
      })`,
      transform: `translate3d(0, ${heroScrollProgress * 42}px, 0) scale(${
        1 + heroScrollProgress * 0.22
      })`,
    }),
    [heroScrollProgress],
  );

  const heroGlowStyle = useMemo<CSSProperties>(
    () => ({
      opacity: 1 - heroScrollProgress * 0.65,
      transform: `translate3d(0, ${-heroScrollProgress * 42}px, 0) scale(${
        1 + heroScrollProgress * 0.22
      })`,
    }),
    [heroScrollProgress],
  );

  const heroChromeStyle = useMemo<CSSProperties>(
    () => ({
      opacity: 1 - heroScrollProgress * 0.95,
      transform: `translate3d(0, ${-heroScrollProgress * 70}px, 0) scale(${
        1 - heroScrollProgress * 0.04
      })`,
    }),
    [heroScrollProgress],
  );

  const heroAssetParallaxStyle = useMemo<CSSProperties>(
    () => ({
      filter: `drop-shadow(0 ${4 + heroScrollProgress * 10}px ${
        16 + heroScrollProgress * 14
      }px rgba(0,0,0,.65)) brightness(${1 - heroScrollProgress * 0.08})`,
      opacity: 1 - heroScrollProgress * 0.82,
      transform: `translate3d(0, ${heroScrollProgress * 18}px, ${
        heroScrollProgress * 22
      }px) scale(${1 + heroScrollProgress * 0.2}) rotate(${
        -heroScrollProgress * 0.45
      }deg)`,
    }),
    [heroScrollProgress],
  );

  const heroIdentityParallaxStyle = useMemo<CSSProperties>(
    () => ({
      opacity: 1 - heroScrollProgress * 0.96,
      transform: `translate3d(0, ${-heroScrollProgress * 26}px, ${
        heroScrollProgress * 20
      }px) scale(${1 - heroScrollProgress * 0.05})`,
    }),
    [heroScrollProgress],
  );

  const villageTransitionClass =
    villageTransitionDirection < 0
      ? 'village-enter-from-left'
      : villageTransitionDirection > 0
        ? 'village-enter-from-right'
        : 'village-enter-neutral';

  // ── Handlers ────────────────────────────────────────────────────────────────

  const markVillageTransition = useCallback(
    (nextVillageId: string) => {
      const nextIndex = villages.findIndex((v) => v.id === nextVillageId);
      if (activeVillageIndex < 0 || nextIndex < 0 || nextIndex === activeVillageIndex) {
        setVillageTransitionDirection(0);
        return;
      }
      setVillageTransitionDirection(nextIndex > activeVillageIndex ? 1 : -1);
    },
    [activeVillageIndex, villages],
  );

  const switchVillage = useCallback((direction: -1 | 1) => {
    if (villages.length <= 1) return;
    const index = activeVillageIndex >= 0 ? activeVillageIndex : 0;
    const nextIndex = (index + direction + villages.length) % villages.length;
    setVillageTransitionDirection(direction);
    setVillage(villages[nextIndex].id);
  }, [activeVillageIndex, setVillage, villages]);

  const handleHeroPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (villages.length <= 1) return;
      heroSwipeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [villages.length],
  );

  const handleHeroPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const swipe = heroSwipeRef.current;
      heroSwipeRef.current = null;
      if (!swipe || swipe.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - swipe.startX;
      const deltaY = event.clientY - swipe.startY;
      const isHorizontalSwipe = Math.abs(deltaX) >= 52 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35;
      if (!isHorizontalSwipe) return;

      suppressHeroClickRef.current = true;
      window.setTimeout(() => {
        suppressHeroClickRef.current = false;
      }, 0);
      switchVillage(deltaX < 0 ? 1 : -1);
    },
    [switchVillage],
  );

  const handleHeroPointerCancel = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (heroSwipeRef.current?.pointerId === event.pointerId) {
      heroSwipeRef.current = null;
    }
  }, []);

  const handleHeroClickCapture = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!suppressHeroClickRef.current) return;
    suppressHeroClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleSelectBuilding = (building: BuildingDto) => {
    if (
      building.type === BUILDING_TYPES.COUNCIL_HALL &&
      building.level >= 1 &&
      !building.isUnderConstruction
    ) {
      setSelectedBuilding(null);
      setIsVillageStyleOpen(true);
      return;
    }
    setIsVillageStyleOpen(false);
    setSelectedBuilding(building);
  };

  const handleSelectResourceBuilding = useCallback(
    (resource: VillageResourceType) => {
      const buildingType = RESOURCE_BUILDING_BY_TYPE[resource];
      const building = buildings.find((b) => b.type === buildingType);
      if (building) setSelectedBuilding(building);
    },
    [buildings],
  );

  const runVillageAction = (actionId: GameActionId) => {
    runGameAction(actionId, {
      navigate,
      openBuildingManagement: () => navigate('/game'),
    });
  };

  const handleCancelConstruction = (buildingId: string) => {
    if (!villageId) return;
    cancelConstruction.mutate({ villageId, buildingId });
  };

  const closeProfile = () => {
    setIsProfileOpen(false);
    setProfileTab('profile');
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!villageId) {
    return (
      <div className="flex h-full items-center justify-center font-game text-sm text-kingdom-700">
        Pas de village actif.
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes royalHalo {
          from { opacity: .3; transform: scale(.95); }
          to   { opacity: .75; transform: scale(1.08); }
        }
        @keyframes villageAssetEnter {
          0% {
            opacity: 0;
            transform: translate3d(var(--village-enter-x, 0px), 0, 0) scale(.9) scaleX(1.16) skewX(var(--village-enter-skew, 0deg));
            filter: blur(2.5px);
          }
          64% {
            opacity: 1;
            transform: translate3d(calc(var(--village-enter-x, 0px) * -0.12), 0, 0) scale(1.035) scaleX(.98) skewX(calc(var(--village-enter-skew, 0deg) * -0.2));
            filter: blur(.6px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }
        @keyframes villageInfoEnter {
          0% {
            opacity: 0;
            transform: translate3d(0, 12px, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes villageResourceFillEnter {
          0% { transform: scaleX(0); filter: brightness(1.35); }
          70% { filter: brightness(1.2); }
          100% { transform: scaleX(1); filter: brightness(1); }
        }
        @keyframes villageResourceValueEnter {
          0% { opacity: 0; transform: translate3d(0, -3px, 0) scale(.92); color: #f6d57b; }
          60% { opacity: 1; transform: translate3d(0, 0, 0) scale(1.06); color: #f6d57b; }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); color: #f0e0c0; }
        }
        .village-asset-enter {
          animation: villageAssetEnter .38s cubic-bezier(.16,1,.24,1) both;
        }
        .village-info-enter {
          animation: villageInfoEnter .34s cubic-bezier(.16,1,.24,1) .05s both;
        }
        .village-enter-from-left {
          --village-enter-x: -86px;
          --village-enter-skew: -7deg;
        }
        .village-enter-from-right {
          --village-enter-x: 86px;
          --village-enter-skew: 7deg;
        }
        .village-enter-neutral {
          --village-enter-x: 0px;
          --village-enter-skew: 0deg;
        }
        .village-resource-fill-enter {
          animation: villageResourceFillEnter .58s cubic-bezier(.2,.8,.2,1) .08s both;
        }
        .village-resource-value-enter {
          animation: villageResourceValueEnter .42s cubic-bezier(.2,.8,.2,1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .village-asset-enter,
          .village-info-enter,
          .village-resource-fill-enter,
          .village-resource-value-enter {
            animation: none;
          }
        }
        .bftc-noscroll::-webkit-scrollbar { display: none; }
        .bftc-noscroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      <div className="font-game relative flex h-full flex-col overflow-hidden bg-[#1a0f08]">

        <div
          className="bftc-noscroll flex-1 overflow-y-auto [overflow-anchor:none]"
          onScroll={handleVillageScroll}
          style={{
            paddingBottom: 'calc(var(--bftc-bottom-nav-height, 64px) + 8px)',
          }}
        >
          {/* ═══════════════════════ HERO SECTION ═══════════════════════ */}
          <div
            className="relative shrink-0 touch-pan-y overflow-hidden [overflow-anchor:none] [perspective:900px]"
            onClickCapture={handleHeroClickCapture}
            onPointerCancel={handleHeroPointerCancel}
            onPointerDown={handleHeroPointerDown}
            onPointerUp={handleHeroPointerUp}
            style={heroShellStyle}
          >
            <div className="absolute inset-x-0 top-0 h-[368px]">
          {/* Backgrounds */}
          <div
            className="absolute inset-[-18px] bg-[linear-gradient(180deg,#0d2218_0%,#1b3a1a_40%,#2c1a0a_100%)] will-change-[filter,transform]"
            style={heroBackgroundStyle}
          />
          <div
            className="absolute inset-[-28px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(246,213,123,.18),transparent_65%)] will-change-[opacity,transform]"
            style={heroGlowStyle}
          />

          {/* Village image */}
          <div
            className="absolute inset-x-0 top-[58px] bottom-[138px] flex items-center justify-center px-6 py-2 will-change-[filter,opacity,transform]"
            style={heroAssetParallaxStyle}
          >
            <div
              key={`village-asset-${activeVillage?.id ?? villageId}`}
              className={`village-asset-enter ${villageTransitionClass}`}
            >
              <img
                src={publicAsset(`/assets/world/entity/village-tier${villageTier}.png`)}
                alt="Village"
                className="h-[178px] object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Top / bottom vignettes */}
          <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(0,0,0,.65)_0%,transparent_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(0deg,rgba(26,15,8,1)_0%,transparent_100%)]" />

          {/* ── Header row ── */}
          <div
            className="absolute inset-x-0 top-0 flex items-center gap-2.5 px-3 pb-2 pt-3 will-change-[opacity,transform]"
            style={heroChromeStyle}
          >
            {/* Profile avatar */}
            <button
              type="button"
              aria-label="Ouvrir le profil"
              onClick={() => {
                setProfileTab('profile');
                setIsProfileOpen(true);
              }}
              className="relative shrink-0"
            >
              <div className="flex size-11 items-center justify-center rounded-full border-2 border-[#8b6f47] bg-[radial-gradient(circle_at_30%_25%,#7a5a38,#3a2210)] text-[13px] font-bold text-[#f0e0c0] [text-shadow:0_1px_2px_rgba(0,0,0,.8)]">
                {getPlayerInitials(user?.email)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full border border-[#7a5200] bg-gradient-to-b from-[#f6d57b] to-[#c9900c] text-[8.5px] font-black text-[#3a2a00]">
                {castleLevel > 0 ? castleLevel : '—'}
              </div>
            </button>

            {/* Power pill */}
            <button
              type="button"
              aria-label="Puissance du royaume"
              onClick={() => setIsPowerOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-[#1a120a] bg-[linear-gradient(180deg,#4a3a28,#2a1f14)] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.1)]"
            >
              <img
                src={publicAsset('/assets/army-power.png')}
                alt="Force"
                className="size-[14px] object-contain"
                loading="lazy"
                decoding="async"
              />
              <span className="tabular-nums text-[12px] font-bold text-[#f0e0c0] [text-shadow:0_1px_1px_rgba(0,0,0,.6)]">
                {integerFormatter.format(totalKingdomPower)}
              </span>
            </button>

            <div className="flex-1" />

            {/* Crown balance */}
            <div className="flex items-center gap-1.5 rounded-full border-2 border-[#7a5200] bg-gradient-to-b from-[#f6d57b] to-[#c9900c] px-3 py-1.5 shadow-[0_2px_0_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,255,255,.45)]">
              <img
                src={publicAsset('/assets/casual-icons/crown.png')}
                alt="Couronnes"
                className="size-4 object-contain"
                loading="lazy"
                decoding="async"
              />
              <span className="tabular-nums text-[13px] font-extrabold text-[#3a2a00]">
                {crownsDisplay}
              </span>
            </div>

            {/* Devoir button */}
            <button
              type="button"
              aria-label={
                retentionBadge > 0
                  ? `Devoir royal, ${retentionBadge} carte${retentionBadge > 1 ? 's' : ''} à réclamer`
                  : 'Devoir royal'
              }
              onClick={() => setIsRetentionOpen(true)}
              className="relative flex size-10 items-center justify-center rounded-full border-2 border-[#7a5200] bg-gradient-to-b from-[#e8b040] to-[#c47a0a] shadow-[0_2px_0_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.35)]"
            >
              <div
                className="pointer-events-none absolute inset-[-5px] rounded-full"
                style={{
                  background: 'radial-gradient(circle,rgba(241,196,15,.35),transparent 68%)',
                  animation: 'royalHalo 2s ease-in-out infinite alternate',
                }}
              />
              <img
                src={publicAsset('/assets/casual-icons/crown.png')}
                alt=""
                className="size-[18px] object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]"
                loading="lazy"
                decoding="async"
              />
              {retentionBadge > 0 && (
                <span className="absolute -right-[3px] -top-[3px] flex size-[17px] items-center justify-center rounded-full border border-[#1a0f08] bg-[#c0392b] text-[9px] font-extrabold text-white">
                  {retentionBadge}
                </span>
              )}
            </button>
          </div>

          {/* ── Village identity and controls ── */}
          <div
            className="absolute inset-x-0 bottom-0 h-[138px] px-3 will-change-[opacity,transform]"
            style={heroIdentityParallaxStyle}
          >
            <div
              key={`village-info-${activeVillage?.id ?? villageId}`}
              className="village-info-enter absolute inset-x-0 bottom-0 h-full text-center"
            >
              <div className="absolute inset-x-3 bottom-[74px] px-2">
                <div className="mb-1 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[.32em] text-[#9a7a5a]">
                  <span>Village</span>
                  {activeVillage?.isCapital && (
                    <span
                      className="flex size-[17px] items-center justify-center rounded-full border border-[rgba(246,213,123,.35)] bg-[rgba(246,213,123,.16)]"
                      aria-label="Capitale"
                      title="Capitale"
                    >
                      <img
                        src={publicAsset('/assets/casual-icons/crown.png')}
                        alt=""
                        className="size-[10px] object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (villages.length > 1) setIsVillageSheetOpen(true);
                  }}
                  disabled={villages.length <= 1}
                  aria-expanded={isVillageSheetOpen}
                  className="mx-auto flex max-w-full items-center justify-center gap-2 disabled:cursor-default"
                >
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap align-bottom text-[19px] font-bold uppercase tracking-[.04em] text-[#f6d57b] [text-shadow:0_2px_6px_rgba(0,0,0,.9)]">
                    {activeVillage?.name ?? '—'}
                  </span>
                  {villages.length > 1 && (
                    <svg
                      width="10"
                      height="7"
                      viewBox="0 0 10 7"
                      fill="none"
                      className="shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M1 1L5 5L9 1"
                        stroke="#f6d57b"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>

              <div className="absolute inset-x-0 bottom-5 flex h-10 items-center justify-center px-16">
                <div className="flex min-w-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap">
                  {strategyOption && (
                    <button
                      type="button"
                      onClick={() => {
                        if (canOpenVillageStyle) setIsVillageStyleOpen(true);
                      }}
                      disabled={!canOpenVillageStyle}
                      className="flex min-w-0 items-center gap-1 rounded-full border border-[rgba(205,184,138,.35)] bg-[rgba(0,0,0,.38)] px-2 py-1 disabled:cursor-default disabled:opacity-80"
                      aria-label="Changer le style du village"
                      title={
                        canOpenVillageStyle
                          ? 'Changer le style du village'
                          : 'Construisez la Salle du Conseil pour changer de style'
                      }
                    >
                      <img
                        src={publicAsset(strategyOption.shield)}
                        alt=""
                        className="size-[14px] object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="min-w-0 truncate text-[9.5px] font-bold tracking-[.06em] text-[#d4b87a]">
                        {strategyOption.name}
                      </span>
                    </button>
                  )}
                  {activeVillage?.label && (
                    <span className="shrink-0 rounded-full border border-[rgba(246,213,123,.45)] bg-[rgba(246,213,123,.18)] px-2 py-1 text-[9.5px] uppercase tracking-[.1em] text-[#f6d57b]">
                      {VILLAGE_LABEL_DISPLAY[activeVillage.label]}
                    </span>
                  )}
                  <span className="shrink-0 text-[12px] text-[#cdb88a]">
                    Niv. <b className="text-[#fef9f0]">{castleLevel > 0 ? castleLevel : '—'}</b>
                  </span>
                  <span className="shrink-0 text-[12px] text-[#cdb88a] opacity-40">·</span>
                  <span className="flex shrink-0 items-center gap-1 tabular-nums text-[12px] text-[#cdb88a]">
                    <img
                      src={publicAsset('/assets/army-power.png')}
                      alt=""
                      className="size-[12px] object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                    {integerFormatter.format(activeVillagePower)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => switchVillage(-1)}
              disabled={villages.length <= 1}
              aria-label="Village précédent"
              className="absolute bottom-5 left-3 flex size-10 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-[#0e0805] bg-[linear-gradient(180deg,#3a2a1f,#1f1308)] text-xl font-bold text-[#cdb88a] shadow-[0_2px_0_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.12)] disabled:opacity-30"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={() => switchVillage(1)}
              disabled={villages.length <= 1}
              aria-label="Village suivant"
              className="absolute bottom-5 right-3 flex size-10 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-[#0e0805] bg-[linear-gradient(180deg,#3a2a1f,#1f1308)] text-xl font-bold text-[#cdb88a] shadow-[0_2px_0_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.12)] disabled:opacity-30"
            >
              ›
            </button>
          </div>
            </div>
          </div>

          {/* ═══════════════════════ SCROLLABLE CONTENT ═══════════════════════ */}
          {buildingsQuery.isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
            <VillageResourcesBar
              animationKey={activeVillage?.id ?? villageId}
              hasSnapshot={hasSnapshot}
              onSelectResource={handleSelectResourceBuilding}
              resources={resources}
            />

            <VillageConstructionQueueStrip
              buildings={buildings}
              isCancelPending={cancelConstruction.isPending}
              now={now}
              onCancel={handleCancelConstruction}
              onOpenQueue={() => setIsQueueOpen(true)}
              queue={buildingQueue}
            />

            <VillageBuildingCatalog
              availablePopulation={populationQuery.data?.available}
              buildings={buildings}
              builtCount={builtCount}
              byCategory={byCategory}
              castleLevel={castleLevel}
              lockedBuildings={lockedBuildings}
              now={now}
              onSelectBuilding={handleSelectBuilding}
              queueByBuildingId={queueByBuildingId}
              resources={resources}
            />
            </>
          )}
        </div>

        {/* ═══════════════════════ OVERLAYS & PORTALS ═══════════════════════ */}

        {/* Tutorial guidance (floating FAB) */}
        <OnboardingGuidance
          guidance={onboardingGuidance}
          isLoading={onboardingSummary.isLoading || !villageId || buildingsQuery.isLoading}
          onAction={runVillageAction}
          onNavigate={navigate}
        />

        {/* Daily retention widget — portal mode (button is the custom crown icon above) */}
        <DailyRetentionWidget
          activeVillageId={villageId}
          hideButton
          isClaiming={claimDailyCard.isPending}
          isLoading={retentionSummary.isLoading}
          onClaim={(input) => claimDailyCard.mutate(input)}
          onAction={runVillageAction}
          onNavigate={navigate}
          open={isRetentionOpen}
          onOpenChange={setIsRetentionOpen}
          summary={retentionSummary.data}
          villages={myVillages.data ?? []}
        />

        {/* Bottom navigation */}
        <BottomNavigationBar
          activeTab="buildings"
          onArmyClick={() => navigate('/game/army')}
          onBuildingsClick={() => undefined}
          onMessagesClick={() => navigate('/game/messages')}
          onWorldClick={() => navigate('/game/world')}
          unreadCount={unreadCount}
        />

        {/* ═══════════════════════ MODALS & SHEETS ═══════════════════════ */}

        {/* Power bottom sheet */}
        <PowerBottomSheet isOpen={isPowerOpen} onClose={() => setIsPowerOpen(false)} />

        <QueueBottomSheet
          isOpen={isQueueOpen}
          onClose={() => setIsQueueOpen(false)}
        />

        {/* Village selector sheet */}
        {activeVillage && (
          <BottomSheet
            className="mx-auto h-[68vh] max-w-[32rem]"
            isOpen={isVillageSheetOpen}
            maxHeight="68vh"
            onClose={() => setIsVillageSheetOpen(false)}
            zIndex={50}
          >
            <MultiVillageBottomSheet
              availableFilters={['all', 'active']}
              className="relative h-full max-h-full"
              filter={villageFilter}
              labels={multiVillageBottomSheetLabels}
              onActivitySelect={(village, activity: MultiVillageActivityKind) => {
                markVillageTransition(village.id);
                setVillage(village.id);
                setIsVillageSheetOpen(false);
                navigate(activity === 'build' ? '/game' : '/game/army');
              }}
              onFilterChange={setVillageFilter}
              onSelectVillage={(village) => {
                markVillageTransition(village.id);
                setVillage(village.id);
                setIsVillageSheetOpen(false);
              }}
              onSort={() => setSortAscending((v) => !v)}
              totalCount={villages.length}
              villages={villageSheetItems}
            />
          </BottomSheet>
        )}

        {/* Player profile sheet */}
        <BottomSheet
          className="mx-auto h-[64vh] max-w-[32rem]"
          isOpen={isProfileOpen}
          maxHeight="64vh"
          onClose={closeProfile}
          zIndex={60}
        >
          <PlayerProfileSheet
            activeTab={profileTab}
            className="relative h-full max-h-full"
            icons={profileSheetIcons}
            labels={profileSheetLabels}
            onLogout={() => {
              closeProfile();
              logout();
            }}
            onTabChange={setProfileTab}
            onVillageSelect={(village) => {
              markVillageTransition(village.id);
              setVillage(village.id);
              closeProfile();
            }}
            onWorldSelect={() => {
              closeProfile();
              navigate('/worlds');
            }}
            player={profileSheetData.player}
            settings={profileSheetSettings}
            stats={profileSheetData.stats}
            villages={profileVillages}
            world={profileSheetData.world}
          />
        </BottomSheet>

        {/* Building detail modal */}
        {selectedBuilding && (
          <BuildingDetailModal
            villageId={villageId}
            building={selectedBuilding}
            onClose={() => setSelectedBuilding(null)}
          />
        )}

        {/* Village style modal (triggered by COUNCIL_HALL click) */}
        <VillageStyleControl
          villageId={villageId}
          buildings={buildings}
          open={isVillageStyleOpen}
          onOpenChange={setIsVillageStyleOpen}
          showTrigger={false}
        />
      </div>
    </>
  );
}
