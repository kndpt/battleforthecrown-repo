import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  MultiVillageBottomSheet,
  type MultiVillageActivityKind,
  type MultiVillageFilter,
  type MultiVillageItem,
} from '@/features/design-system/components/MultiVillageBottomSheet';
import {
  PlayerProfileSheet,
  type PlayerProfileSheetTab,
} from '@/features/design-system/components/PlayerProfileSheet';
import { useDisplayResources, useDisplayCrowns } from '@/features/resources/useDisplayResources';
import { DailyRetentionWidget } from '@/features/retention/DailyRetentionWidget';
import { runGameAction, type GameActionId } from '@/features/game-actions/gameActions';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import {
  useClaimDailyCardMutation,
  useLogout,
  useMyMembershipsQuery,
  useMyVillagesQuery,
  useRetentionSummaryQuery,
  usePublicWorldsQuery,
} from '@/api/queries';
import { formatHeaderCompactAmount } from '@/lib/resourceConfig';
import { publicAsset } from '@/lib/publicAsset';
import { BottomSheet } from '@/ui';
import { multiVillageBottomSheetLabels } from './multiVillageSheet';
import { getPlayerInitials, integerFormatter, PLAYER_PROFILE_LEVEL } from './headerHelpers';
import { useMultiVillageData } from './useMultiVillageData';
import { buildPlayerProfileSheetData, buildProfileVillages } from './profileViewModel';
import {
  profileSheetIcons,
  profileSheetLabels,
  profileSheetSettings,
} from './profileSheetData';
import { NewbieShieldIcon, NewbieShieldTimer } from '@/features/world/NewbieShieldIcon';

interface GameHeaderProps {
  onPowerClick?: () => void;
  showResources?: boolean;
  showVillageSwitcher?: boolean;
}

export function GameHeader({
  onPowerClick,
  showResources = true,
  showVillageSwitcher = true,
}: GameHeaderProps = {}) {
  const navigate = useNavigate();
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const setVillage = useGameStore((state) => state.setVillage);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const logout = useLogout();
  const publicWorlds = usePublicWorldsQuery();
  const memberships = useMyMembershipsQuery();
  const myVillages = useMyVillagesQuery(worldId);
  const retentionSummary = useRetentionSummaryQuery(worldId);
  const claimDailyCard = useClaimDailyCardMutation();
  const { display, hasSnapshot } = useDisplayResources(villageId);
  const { balance: crownBalance } = useDisplayCrowns(userId, worldId);
  const [isVillageSheetOpen, setIsVillageSheetOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<PlayerProfileSheetTab>('profile');
  const [villageFilter, setVillageFilter] = useState<MultiVillageFilter>('all');
  const [sortAscending, setSortAscending] = useState(true);

  const villages = useMemo(() => myVillages.data ?? [], [myVillages.data]);
  const activeMembership = memberships.data?.find((membership) => membership.worldId === worldId);
  const activePublicWorld = publicWorlds.data?.find((world) => world.id === worldId);
  const fallbackVillageId = villages.find((village) => village.isCapital)?.id
    ?? villages[0]?.id
    ?? null;
  const activeVillage =
    villages.find((village) => village.id === villageId) ?? villages[0] ?? null;
  const activeVillageIndex = activeVillage
    ? villages.findIndex((village) => village.id === activeVillage.id)
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

  const activeVillagePower = activeVillage ? powerByVillageId.get(activeVillage.id) ?? 0 : 0;

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
      }),
    [activeMembership, activePublicWorld, crownBalance, kingdomPower, user, villages.length, worldId],
  );

  useEffect(() => {
    if (
      fallbackVillageId &&
      (!villageId || !villages.some((village) => village.id === villageId))
    ) {
      setVillage(fallbackVillageId);
    }
  }, [fallbackVillageId, setVillage, villageId, villages]);

  const resources = useMemo(() => {
    const max = hasSnapshot && display ? display.maxPerType : 0;
    const woodCurrent = hasSnapshot && display ? Math.floor(display.wood) : 0;
    const stoneCurrent = hasSnapshot && display ? Math.floor(display.stone) : 0;
    const ironCurrent = hasSnapshot && display ? Math.floor(display.iron) : 0;
    const ratio = (current: number) => (max > 0 ? current / max : undefined);
    return [
      {
        fillClass: 'bg-[linear-gradient(90deg,#7a5a32,#b08040)]',
        icon: '/assets/resources/wood.png',
        label: 'Bois',
        value: formatHeaderCompactAmount(woodCurrent),
        fillRatio: ratio(woodCurrent),
      },
      {
        fillClass: 'bg-[linear-gradient(90deg,#7a7a7a,#a0a0a0)]',
        icon: '/assets/resources/stone.png',
        label: 'Pierre',
        value: formatHeaderCompactAmount(stoneCurrent),
        fillRatio: ratio(stoneCurrent),
      },
      {
        fillClass: 'bg-[linear-gradient(90deg,#4a6070,#6a90a8)]',
        icon: '/assets/resources/iron.png',
        label: 'Fer',
        value: formatHeaderCompactAmount(ironCurrent),
        fillRatio: ratio(ironCurrent),
      },
    ];
  }, [hasSnapshot, display]);
  const totalPower = kingdomPower?.kingdomPower ?? 0;
  const crowns = Number.isFinite(crownBalance ?? NaN) ? Math.floor(crownBalance ?? 0) : 0;

  const switchVillage = (direction: -1 | 1) => {
    if (villages.length <= 1) return;
    const index = activeVillageIndex >= 0 ? activeVillageIndex : 0;
    const nextIndex = (index + direction + villages.length) % villages.length;
    setVillage(villages[nextIndex].id);
    setIsVillageSheetOpen(false);
  };

  const openVillageActivity = (
    village: MultiVillageItem,
    activity: MultiVillageActivityKind,
  ) => {
    setVillage(village.id);
    setIsVillageSheetOpen(false);
    navigate(activity === 'build' ? '/game' : '/game/army');
  };
  const openProfile = () => {
    setProfileTab('profile');
    setIsProfileOpen(true);
  };
  const closeProfile = () => {
    setIsProfileOpen(false);
    setProfileTab('profile');
  };
  const runHeaderAction = (actionId: GameActionId) => {
    runGameAction(actionId, { navigate });
  };

  return (
    <div className="relative flex flex-col overflow-hidden border-b border-[rgba(246,213,123,.16)] bg-[linear-gradient(180deg,#07150f_0%,#142816_46%,#2b170b_100%)] text-[#f0e0c0] shadow-[0_10px_26px_rgba(0,0,0,.3)]">
      <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_75%_80%_at_50%_-20%,rgba(246,213,123,.2),transparent_72%)]" />

      <div className="game-topbar-account relative flex items-center gap-2.5 px-3 pb-2 pt-3 [animation:bftc-topbar-account-dock_.34s_cubic-bezier(.16,1,.24,1)_both]">
        <button
          type="button"
          aria-expanded={isProfileOpen}
          aria-label="Profil joueur"
          onClick={openProfile}
          className="relative shrink-0"
        >
          <span className="flex size-11 items-center justify-center rounded-full border-2 border-[#8b6f47] bg-[radial-gradient(circle_at_30%_25%,#7a5a38,#3a2210)] font-game text-[13px] font-bold text-[#f0e0c0] [text-shadow:0_1px_2px_rgba(0,0,0,.8)]">
            {getPlayerInitials(user?.displayName ?? 'Joueur')}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full border border-[#7a5200] bg-gradient-to-b from-[#f6d57b] to-[#c9900c] font-game text-[8.5px] font-black text-[#3a2a00]">
            {PLAYER_PROFILE_LEVEL}
          </span>
        </button>

        <button
          type="button"
          aria-label={`Puissance du royaume ${integerFormatter.format(totalPower)}`}
          onClick={onPowerClick}
          className="flex items-center gap-1.5 rounded-full border border-[#1a120a] bg-[linear-gradient(180deg,#4a3a28,#2a1f14)] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.1)] transition-transform active:scale-95"
        >
          <img alt="" className="size-[14px] object-contain" src={publicAsset('/assets/power.png')} />
          <span className="font-game tabular-nums text-[12px] font-bold text-[#f0e0c0] [text-shadow:0_1px_1px_rgba(0,0,0,.6)]">
            {integerFormatter.format(totalPower)}
          </span>
        </button>

        <div className="flex-1" />

        <div
          aria-label={`Couronnes ${integerFormatter.format(crowns)}`}
          className="flex items-center gap-1.5 rounded-full border-2 border-[#7a5200] bg-gradient-to-b from-[#f6d57b] to-[#c9900c] px-3 py-1.5 shadow-[0_2px_0_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,255,255,.45)]"
        >
          <img alt="" className="size-4 object-contain" src={publicAsset('/assets/casual-icons/crown.png')} />
          <span className="font-game tabular-nums text-[13px] font-extrabold text-[#3a2a00]">
            {integerFormatter.format(crowns)}
          </span>
        </div>

        <DailyRetentionWidget
          activeVillageId={villageId}
          className="shrink-0"
          isClaiming={claimDailyCard.isPending}
          isLoading={retentionSummary.isLoading}
          onAction={runHeaderAction}
          onClaim={(input) => claimDailyCard.mutate(input)}
          onNavigate={navigate}
          sealSize={40}
          summary={retentionSummary.data}
          villages={villages}
        />
      </div>

      {showVillageSwitcher && activeVillage && (
        <div className="game-topbar-village relative flex min-h-[68px] items-center justify-center px-3 pb-2 [animation:bftc-topbar-village-dock_.38s_cubic-bezier(.16,1,.24,1)_.04s_both]">
          <button
            type="button"
            onClick={() => switchVillage(-1)}
            disabled={villages.length <= 1}
            aria-label="Village précédent"
            className="absolute left-3 top-2 flex size-10 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-[#0e0805] bg-[linear-gradient(180deg,#3a2a1f,#1f1308)] text-[#cdb88a] shadow-[0_2px_0_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.12)] disabled:opacity-30"
          >
            <ChevronLeft aria-hidden="true" className="size-5 stroke-[4]" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (villages.length > 1) setIsVillageSheetOpen(true);
            }}
            disabled={villages.length <= 1}
            aria-expanded={isVillageSheetOpen}
            aria-label="Choisir le village actif"
            className="mx-12 flex max-w-full min-w-0 flex-col items-center text-center font-game disabled:cursor-default"
          >
            <span className="mb-1 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-[.32em] text-[#9a7a5a]">
              <span>Village</span>
              {activeVillage.isCapital && (
                <span
                  aria-label="Capitale"
                  className="flex size-[17px] items-center justify-center rounded-full border border-[rgba(246,213,123,.35)] bg-[rgba(246,213,123,.16)]"
                  title="Capitale"
                >
                  <img alt="" className="size-[10px] object-contain" src={publicAsset('/assets/casual-icons/crown.png')} />
                </span>
              )}
              {activeMembership?.newbieShield?.active && (
                <>
                  <NewbieShieldIcon endsAt={activeMembership.newbieShield.endsAt} size={18} />
                  <NewbieShieldTimer endsAt={activeMembership.newbieShield.endsAt} />
                </>
              )}
            </span>
            <span className="flex max-w-full min-w-0 items-center justify-center gap-1.5 text-[13px] font-bold uppercase tracking-[.04em] text-[#f6d57b] [text-shadow:0_2px_6px_rgba(0,0,0,.9)]">
              <span className="min-w-0 truncate">{activeVillage.name}</span>
              {villages.length > 1 && <ChevronDown aria-hidden="true" className="size-4 shrink-0 stroke-[3]" />}
            </span>
            <span
              aria-label={`Puissance du village ${integerFormatter.format(activeVillagePower)}`}
              className="mt-1 flex items-center gap-1 font-game tabular-nums text-[11px] font-bold text-[#cdb88a]"
            >
              <img alt="" className="size-[12px] object-contain" src={publicAsset('/assets/power.png')} />
              {integerFormatter.format(activeVillagePower)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchVillage(1)}
            disabled={villages.length <= 1}
            aria-label="Village suivant"
            className="absolute right-3 top-2 flex size-10 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-[#0e0805] bg-[linear-gradient(180deg,#3a2a1f,#1f1308)] text-[#cdb88a] shadow-[0_2px_0_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.12)] disabled:opacity-30"
          >
            <ChevronRight aria-hidden="true" className="size-5 stroke-[4]" />
          </button>
        </div>
      )}

      {showResources && (
        <div className="game-topbar-resources relative grid grid-cols-3 divide-x divide-[rgba(166,124,82,.28)] border-t border-[rgba(246,213,123,.1)] bg-[linear-gradient(180deg,rgba(44,26,10,.74),rgba(31,19,9,.66))] shadow-[0_-1px_0_rgba(255,255,255,.04)_inset] backdrop-blur-md backdrop-saturate-150 [animation:bftc-topbar-resources-dock_.36s_cubic-bezier(.16,1,.24,1)_.09s_both]">
          {resources.map((resource) => (
            <div
              key={resource.label}
              aria-label={`${resource.label} ${resource.value}`}
              className="min-w-0 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <img alt="" className="size-[17px] shrink-0 object-contain" src={publicAsset(resource.icon)} />
                <span className="min-w-0 truncate font-game text-[9px] font-bold uppercase tracking-[.1em] text-[#9a7a5a]">
                  {resource.label}
                </span>
                <span className="ml-auto shrink-0 font-game tabular-nums text-[14px] font-bold text-[#f0e0c0]">
                  {hasSnapshot ? resource.value : '…'}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(93,74,50,.34)]">
                <div
                  className={`h-full origin-left rounded-full transition-[width] duration-300 ${resource.fillClass}`}
                  style={{ width: `${Math.max(0, Math.min(1, resource.fillRatio ?? 0)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {activeVillage && (
        <BottomSheet
          className="mx-auto h-[68vh] max-w-[32rem]"
          isOpen={isVillageSheetOpen}
          maxHeight="68vh"
          onClose={() => setIsVillageSheetOpen(false)}
        >
          <MultiVillageBottomSheet
            availableFilters={['all', 'active']}
            className="relative h-full max-h-full"
            filter={villageFilter}
            labels={multiVillageBottomSheetLabels}
            onActivitySelect={openVillageActivity}
            onClose={() => setIsVillageSheetOpen(false)}
            onFilterChange={setVillageFilter}
            onSelectVillage={(village) => {
              setVillage(village.id);
              setIsVillageSheetOpen(false);
            }}
            onSort={() => setSortAscending((value) => !value)}
            totalCount={villages.length}
            villages={villageSheetItems}
          />
        </BottomSheet>
      )}
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
    </div>
  );
}
