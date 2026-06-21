import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router';
import { BottomSheet } from '@/ui';
import { Spinner } from '@/ui/spinners';
import { BuildingDetailModal } from '@/features/village/BuildingDetailModal';
import { QueueBottomSheet } from '@/features/village/QueueBottomSheet';
import { VillageStyleControl } from '@/features/village/VillageStyleControl';
import { metaFor } from '@/features/village/buildingMeta';
import { DailyRetentionWidget } from '@/features/retention/DailyRetentionWidget';
import { OnboardingGuidance } from '@/features/onboarding/OnboardingGuidance';
import { getOnboardingGuidance } from '@/features/onboarding/onboardingViewModel';
import { useOnboardingCompletionAck } from '@/features/onboarding/onboardingCompletion';
import { PowerBottomSheet } from '@/features/power/PowerBottomSheet';
import { BottomNavigationBar } from '@/features/layout/BottomNavigationBar';
import {
  MultiVillageBottomSheet,
  type MultiVillageActivityKind,
  type MultiVillageFilter,
} from '@/features/design-system/components/MultiVillageBottomSheet';
import {
  PlayerProfileSheet,
  type PlayerProfileSheetTab,
} from '@/features/design-system/components/PlayerProfileSheet';
import { villageStyleOptions } from '@/features/design-system/components/villageStyleData';
import { multiVillageBottomSheetLabels } from '@/features/layout/multiVillageSheet';
import {
  getPlayerInitials,
  integerFormatter,
  PLAYER_PROFILE_LEVEL,
} from '@/features/layout/headerHelpers';
import { useMultiVillageData } from '@/features/layout/useMultiVillageData';
import {
  buildPlayerProfileSheetData,
  buildProfileVillages,
} from '@/features/layout/profileViewModel';
import {
  profileSheetIcons,
  profileSheetLabels,
  profileSheetSettings,
} from '@/features/layout/profileSheetData';
import { useRenownLevelUp } from '@/features/layout/useRenownLevelUp';
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
import { VillageHero } from './VillageHero';
import { useHeroParallax } from './useHeroParallax';

import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { usePendingBuildingModalStore } from '@/stores/pendingBuildingModal';
import { useTickingNow } from '@/lib/useTickingNow';
import {
  useClaimDailyCardMutation,
  useMyVillagesQuery,
  useOnboardingSummaryQuery,
  useRetentionSummaryQuery,
  useVillageBuildingsQuery,
  useBuildingQueueQuery,
  usePopulationQuery,
  useLogout,
  useMyMembershipsQuery,
  usePublicWorldsQuery,
  useCancelConstructionMutation,
  useVillageStrategyQuery,
} from '@/api/queries';
import type { BuildingDto } from '@/api';
import { BUILDING_TYPES } from '@battleforthecrown/shared/village/buildings';
import { villageVisualTierFromCastleLevel } from '@battleforthecrown/shared/world';

// ─── Constants ───────────────────────────────────────────────────────────────

const RESOURCE_BUILDING_BY_TYPE: Record<'iron' | 'stone' | 'wood', string> = {
  iron: BUILDING_TYPES.IRON,
  stone: BUILDING_TYPES.STONE,
  wood: BUILDING_TYPES.WOOD,
};

type VillageTransitionDirection = -1 | 0 | 1;

// ─── Main Component ───────────────────────────────────────────────────────────

export function VillageView() {
  const navigate = useNavigate();

  // Auth & context
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;
  const villageId = useGameStore((s) => s.villageId);
  const worldId = useGameStore((s) => s.worldId);
  const setVillage = useGameStore((s) => s.setVillage);
  const pendingBuildingType = usePendingBuildingModalStore((s) => s.buildingType);
  const consumePendingBuilding = usePendingBuildingModalStore((s) => s.consume);
  const logout = useLogout();
  const { renown, justLeveledUp, acknowledge: acknowledgeRenown } = useRenownLevelUp();

  // Village data
  const buildingsQuery = useVillageBuildingsQuery(villageId);
  const queueQuery = useBuildingQueueQuery(villageId);
  const populationQuery = usePopulationQuery(villageId);
  const myVillages = useMyVillagesQuery(worldId);
  const strategyQuery = useVillageStrategyQuery(villageId);

  // Global data
  const { display: resources, hasSnapshot } = useDisplayResources(villageId);
  const { balance: crownBalance } = useDisplayCrowns(userId, worldId);
  const retentionSummary = useRetentionSummaryQuery(worldId);
  const onboardingSummary = useOnboardingSummaryQuery(worldId);
  const claimDailyCard = useClaimDailyCardMutation();
  const cancelConstruction = useCancelConstructionMutation();
  const memberships = useMyMembershipsQuery();
  const publicWorlds = usePublicWorldsQuery();

  const unreadCount = useUnreadReportsCount();
  const now = useTickingNow(1_000);

  // UI state
  // Hero parallax scroll
  const { styles: heroParallaxStyles, handleScroll: handleVillageScroll } = useHeroParallax();

  const [selectedBuilding, setSelectedBuilding] = useState<BuildingDto | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPowerOpen, setIsPowerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isVillageSheetOpen, setIsVillageSheetOpen] = useState(false);
  const [isVillageStyleOpen, setIsVillageStyleOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<PlayerProfileSheetTab>('profile');
  const [villageFilter, setVillageFilter] = useState<MultiVillageFilter>('all');
  const [sortAscending, setSortAscending] = useState(true);
  const [villageTransitionDirection, setVillageTransitionDirection] =
    useState<VillageTransitionDirection>(0);

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

  const {
    kingdomPower,
    powerByVillageId,
    buildingsByVillageId,
    strategyByVillageId,
    villageSheetItems,
  } = useMultiVillageData(villages, {
    villageSheetOpen: isVillageSheetOpen,
    profileVillagesActive: isProfileOpen && profileTab === 'villages',
    activeVillageId: activeVillage?.id ?? villageId,
    sortAscending,
  });

  const activeVillagePowerId = activeVillage?.id ?? villageId;
  const activeVillagePower =
    (activeVillagePowerId ? powerByVillageId.get(activeVillagePowerId) : undefined) ?? 0;
  const totalKingdomPower = kingdomPower?.kingdomPower ?? 0;

  const onboardingCompletion = useOnboardingCompletionAck(worldId, villageId);
  const onboardingGuidance = getOnboardingGuidance(onboardingSummary.data, {
    completionAcknowledged: onboardingCompletion.acknowledged,
  });
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

  const activeMembership = memberships.data?.find((m) => m.worldId === worldId);
  const activePublicWorld = publicWorlds.data?.find((w) => w.id === worldId);

  const profileVillages = useMemo(
    () =>
      buildProfileVillages({ villages, buildingsByVillageId, powerByVillageId, strategyByVillageId }),
    [buildingsByVillageId, powerByVillageId, strategyByVillageId, villages],
  );

  const profileSheetData = useMemo(
    () =>
      buildPlayerProfileSheetData({
        kingdomPower,
        crownBalance,
        user,
        villagesCount: villages.length,
        activePublicWorld,
        activeMembership,
        worldId,
        renownLevel: renown?.level ?? null,
      }),
    [activeMembership, activePublicWorld, crownBalance, kingdomPower, renown?.level, user, villages.length, worldId],
  );

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

  // A building-modal request queued by an onboarding CTA (possibly from another
  // screen) resolves to a building once loaded — derived, no effect/setState.
  const pendingBuilding = pendingBuildingType
    ? buildings.find((b) => b.type === pendingBuildingType) ?? null
    : null;
  const activeBuildingModal = selectedBuilding ?? pendingBuilding;

  const handleCancelConstruction = (buildingId: string) => {
    if (!villageId) return;
    cancelConstruction.mutate({ villageId, buildingId });
  };

  const closeProfile = () => {
    setIsProfileOpen(false);
    setProfileTab('profile');
    // Acquittement à la fermeture : le feedback de level-up reste visible
    // pendant toute la consultation du profil, puis est consommé.
    acknowledgeRenown();
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
    <div className="font-game relative flex h-full flex-col overflow-hidden bg-[#1a0f08]">

        <div
          className="bftc-noscroll flex-1 overflow-y-auto [overflow-anchor:none]"
          onScroll={handleVillageScroll}
          style={{
            paddingBottom: 'calc(var(--bftc-bottom-nav-height, 64px) + 8px)',
          }}
        >
          <VillageHero
            activeVillage={activeVillage}
            activeVillagePower={activeVillagePower}
            availablePopulation={populationQuery.data?.available}
            canOpenVillageStyle={canOpenVillageStyle}
            crownsDisplay={crownsDisplay}
            isVillageSheetOpen={isVillageSheetOpen}
            newbieShieldEndsAt={
              activeMembership?.newbieShield?.active
                ? activeMembership.newbieShield.endsAt
                : null
            }
            onOpenProfile={() => {
              setProfileTab('profile');
              setIsProfileOpen(true);
            }}
            onOpenPower={() => setIsPowerOpen(true)}
            onOpenVillageSheet={() => setIsVillageSheetOpen(true)}
            onOpenVillageStyle={() => setIsVillageStyleOpen(true)}
            parallaxStyles={heroParallaxStyles}
            playerInitials={getPlayerInitials(user?.displayName ?? 'Joueur')}
            playerLevel={renown?.level ?? PLAYER_PROFILE_LEVEL}
            retentionSlot={
              <DailyRetentionWidget
                activeVillageId={villageId}
                className="shrink-0"
                isClaiming={claimDailyCard.isPending}
                isLoading={retentionSummary.isLoading}
                onAction={runVillageAction}
                onClaim={(input) => claimDailyCard.mutate(input)}
                onNavigate={navigate}
                sealSize={40}
                summary={retentionSummary.data}
                villages={myVillages.data ?? []}
              />
            }
            strategyOption={strategyOption}
            switchVillage={switchVillage}
            totalKingdomPower={totalKingdomPower}
            villageCount={villages.length}
            villageId={villageId}
            villageTier={villageTier}
            villageTransitionClass={villageTransitionClass}
          />

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

        <OnboardingGuidance
          guidance={onboardingGuidance}
          isLoading={onboardingSummary.isLoading || !villageId || buildingsQuery.isLoading}
          onAcknowledge={onboardingCompletion.acknowledge}
          onAction={runVillageAction}
          onNavigate={navigate}
        />

        {/* Bottom navigation */}
        <BottomNavigationBar
          activeTab="buildings"
          animateActiveOnMount
          onArmyClick={() => navigate('/game/army')}
          onBuildingsClick={() => undefined}
          onMessagesClick={() => navigate('/game/messages')}
          onRankingsClick={() => navigate('/game/rankings')}
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
            renown={renown ? { level: renown.level, xpIntoLevel: renown.xpIntoLevel, xpForNextLevel: renown.xpForNextLevel, justLeveledUp } : undefined}
            settings={profileSheetSettings}
            stats={profileSheetData.stats}
            villages={profileVillages}
            world={profileSheetData.world}
          />
        </BottomSheet>

        {/* Building detail modal */}
        {activeBuildingModal && (
          <BuildingDetailModal
            villageId={villageId}
            building={activeBuildingModal}
            onClose={() => {
              // Only consume the pending request when the modal currently shown
              // is the pending one (selectedBuilding takes priority); otherwise a
              // manually-opened building would swallow the queued request unseen.
              if (!selectedBuilding && pendingBuildingType) {
                consumePendingBuilding();
              }
              setSelectedBuilding(null);
            }}
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
  );
}
