import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { PublicWorld } from '@battleforthecrown/shared/world';
import { VILLAGE_LABEL_DISPLAY } from '@battleforthecrown/shared/village';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { HeaderBar, type HeaderBarStat } from '@/features/design-system/components/HeaderBar';
import {
  MultiVillageBottomSheet,
  type MultiVillageActivityKind,
  type MultiVillageFilter,
  type MultiVillageItem,
} from '@/features/design-system/components/MultiVillageBottomSheet';
import {
  PlayerProfileSheet,
  type PlayerProfileSheetProps,
  type PlayerProfileSheetTab,
  type PlayerProfileSheetVillage,
} from '@/features/design-system/components/PlayerProfileSheet';
import { villageStyleOptions } from '@/features/design-system/components/villageStyleData';
import { useDisplayResources, useDisplayCrowns } from '@/features/resources/useDisplayResources';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import {
  armyTrainingQueryOptions,
  buildingsQueryOptions,
  populationQueryOptions,
  queueQueryOptions,
  resourcesQueryOptions,
  useKingdomPowerQuery,
  useLogout,
  useMyMembershipsQuery,
  useMyVillagesQuery,
  usePopulationQuery,
  villageStrategyQueryOptions,
  usePublicWorldsQuery,
} from '@/api/queries';
import { formatHeaderCompactAmount } from '@/lib/resourceConfig';
import { publicAsset } from '@/lib/publicAsset';
import { BottomSheet } from '@/ui';
import { WORLD_SIGIL_GLYPHS, WORLD_THEME_TOKENS } from '@/features/worlds/worldsViewModel';
import {
  buildMultiVillageSheetItems,
  multiVillageBottomSheetLabels,
} from './multiVillageSheet';

const integerFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
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
  tabs: {
    profile: 'Profil',
    settings: 'Réglages',
    villages: 'Villages',
  },
  villageHint: 'Styles et niveaux affichés uniquement quand les données existent.',
  world: 'Monde',
};
const profileSheetSettings: PlayerProfileSheetProps['settings'] = [
  { icon: '—', id: 'notifications', label: 'Notifications', value: 'À venir' },
  { icon: '—', id: 'sound', label: 'Son et musique', value: 'À venir' },
  { icon: '—', id: 'language', label: 'Langue', value: 'À venir' },
];
const strategyLabels = Object.fromEntries(
  villageStyleOptions.map((option) => [option.id, option.name]),
);

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

function getPlayerInitials(email: string | null | undefined) {
  const source = email?.trim();
  if (!source) return '—';
  const localPart = source.split('@')[0] ?? source;
  const parts = localPart.split(/[._-]+/).filter(Boolean);
  const letters = parts.length >= 2
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

interface GameHeaderProps {
  onPowerClick?: () => void;
  onResourceClick?: (resource: 'iron' | 'stone' | 'wood') => void;
}

export function GameHeader({ onPowerClick, onResourceClick }: GameHeaderProps = {}) {
  const navigate = useNavigate();
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const setVillage = useGameStore((state) => state.setVillage);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const logout = useLogout();
  const population = usePopulationQuery(villageId);
  const kingdomPower = useKingdomPowerQuery();
  const publicWorlds = usePublicWorldsQuery();
  const memberships = useMyMembershipsQuery();
  const myVillages = useMyVillagesQuery(worldId);
  const { display, hasSnapshot } = useDisplayResources(villageId);
  const { balance: crownBalance } = useDisplayCrowns(userId, worldId);
  const [isVillageSheetOpen, setIsVillageSheetOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<PlayerProfileSheetTab>('profile');
  const [villageFilter, setVillageFilter] = useState<MultiVillageFilter>('all');
  const [sortAscending, setSortAscending] = useState(true);

  const villages = myVillages.data ?? [];
  const activeMembership = memberships.data?.find((membership) => membership.worldId === worldId);
  const activePublicWorld = publicWorlds.data?.find((world) => world.id === worldId);
  const shouldLoadProfileVillages = isProfileOpen && profileTab === 'villages';
  const fallbackVillageId = villages.find((village) => village.isCapital)?.id
    ?? villages[0]?.id
    ?? null;
  const activeVillage =
    villages.find((village) => village.id === villageId) ?? villages[0] ?? null;
  const activeVillageIndex = activeVillage
    ? villages.findIndex((village) => village.id === activeVillage.id)
    : -1;
  const villageIds = useMemo(() => villages.map((village) => village.id), [villages]);
  const villageResources = useQueries({
    queries: villageIds.map((id) => ({
      ...resourcesQueryOptions(id),
      enabled: isVillageSheetOpen,
    })),
  });
  const villagePopulation = useQueries({
    queries: villageIds.map((id) => ({
      ...populationQueryOptions(id),
      enabled: isVillageSheetOpen,
    })),
  });
  const villageBuildings = useQueries({
    queries: villageIds.map((id) => ({
      ...buildingsQueryOptions(id),
      enabled: isVillageSheetOpen || shouldLoadProfileVillages,
    })),
  });
  const villageQueue = useQueries({
    queries: villageIds.map((id) => ({
      ...queueQueryOptions(id),
      enabled: isVillageSheetOpen,
    })),
  });
  const villageStrategy = useQueries({
    queries: villageIds.map((id) => ({
      ...villageStrategyQueryOptions(id),
      enabled: isVillageSheetOpen || shouldLoadProfileVillages,
    })),
  });
  const villageTraining = useQueries({
    queries: villageIds.map((id) => ({
      ...armyTrainingQueryOptions(id),
      enabled: isVillageSheetOpen,
    })),
  });
  const powerByVillageId = useMemo(
    () =>
      new Map(
        (kingdomPower.data?.villages ?? []).map((village) => [
          village.villageId,
          village.total,
        ]),
      ),
    [kingdomPower.data?.villages],
  );
  const activeVillagePower = activeVillage
    ? powerByVillageId.get(activeVillage.id) ?? 0
    : 0;
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
    () => toResultMap(villageIds, villageStrategy),
    [villageIds, villageStrategy],
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
      })
        .toSorted((a, b) =>
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
  const profileVillages = useMemo<PlayerProfileSheetVillage[]>(
    () =>
      villages.map((village) => {
        const strategy = strategyByVillageId.get(village.id)?.currentStrategy;
        const level = village.castleLevel
          ?? buildingsByVillageId.get(village.id)?.find((building) => building.type === 'CASTLE')?.level
          ?? '—';

        return {
          capital: village.isCapital,
          coords: `${village.x}:${village.y}`,
          id: village.id,
          label: village.label ? VILLAGE_LABEL_DISPLAY[village.label] : undefined,
          level,
          name: village.name,
          power: powerByVillageId.get(village.id)?.toLocaleString('fr-FR') ?? '—',
          style: strategy ? { id: strategy, label: strategyLabels[strategy] ?? strategy } : undefined,
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
        level: '—',
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
        name: activePublicWorld?.identity.displayName ?? activeMembership?.worldName ?? worldId ?? 'À venir',
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
  }, [activeMembership?.worldName, activePublicWorld, crownBalance, kingdomPower.data, user, villages.length, worldId]);

  useEffect(() => {
    if (
      fallbackVillageId &&
      (!villageId || !villages.some((village) => village.id === villageId))
    ) {
      setVillage(fallbackVillageId);
    }
  }, [fallbackVillageId, setVillage, villageId, villages]);

  const primaryStats = useMemo<[HeaderBarStat, HeaderBarStat]>(() => {
    const power = kingdomPower.data?.kingdomPower ?? 0;
    const crowns = Number.isFinite(crownBalance ?? NaN) ? Math.floor(crownBalance ?? 0) : 0;
    return [
      {
        icon: '/assets/army-power.png',
        label: 'Puissance',
        value: integerFormatter.format(power),
        onClick: onPowerClick,
      },
      { icon: '/assets/crown.png', label: 'Couronnes', value: integerFormatter.format(crowns) },
    ];
  }, [kingdomPower.data, crownBalance, onPowerClick]);

  const resources = useMemo<[HeaderBarStat, HeaderBarStat, HeaderBarStat]>(() => {
    const max = hasSnapshot && display ? display.maxPerType : 0;
    const woodCurrent = hasSnapshot && display ? Math.floor(display.wood) : 0;
    const stoneCurrent = hasSnapshot && display ? Math.floor(display.stone) : 0;
    const ironCurrent = hasSnapshot && display ? Math.floor(display.iron) : 0;
    const ratio = (current: number) => (max > 0 ? current / max : undefined);
    return [
      {
        icon: '/assets/resources/wood.png',
        label: 'Bois',
        value: formatHeaderCompactAmount(woodCurrent),
        fillRatio: ratio(woodCurrent),
        onClick: onResourceClick ? () => onResourceClick('wood') : undefined,
      },
      {
        icon: '/assets/resources/stone.png',
        label: 'Pierre',
        value: formatHeaderCompactAmount(stoneCurrent),
        fillRatio: ratio(stoneCurrent),
        onClick: onResourceClick ? () => onResourceClick('stone') : undefined,
      },
      {
        icon: '/assets/resources/iron.png',
        label: 'Fer',
        value: formatHeaderCompactAmount(ironCurrent),
        fillRatio: ratio(ironCurrent),
        onClick: onResourceClick ? () => onResourceClick('iron') : undefined,
      },
    ];
  }, [hasSnapshot, display, onResourceClick]);

  const populationStat = useMemo<HeaderBarStat>(() => {
    const available = population.data?.available ?? 0;
    return {
      icon: '/assets/resources/population.png',
      label: 'Population',
      value: formatHeaderCompactAmount(available),
    };
  }, [population.data]);

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

  return (
    <div className="flex flex-col overflow-hidden bg-[linear-gradient(180deg,#563a22_0%,#4f341f_48%,#3f2718_100%)]">
      <div className="h-[136px] overflow-hidden">
        <div className="w-[calc(100vw/0.44)] origin-top-left scale-[.44]">
          <HeaderBar
            avatarInitials={getPlayerInitials(user?.email)}
            className="w-full"
            level="—"
            onProfileClick={openProfile}
            population={populationStat}
            primaryStats={primaryStats}
            profileExpanded={isProfileOpen}
            resources={resources}
          />
          {activeVillage && (
            <div className="relative flex h-[136px] items-center justify-center border-t-[5px] border-[#2b1a10] bg-[linear-gradient(180deg,#523720_0%,#4a301e_54%,#3f2718_100%)] px-0">
              <button
                type="button"
                onClick={() => switchVillage(-1)}
                disabled={villages.length <= 1}
                className="absolute left-[18px] top-[28px] inline-flex size-[78px] items-center justify-center rounded-[19px] border-[5px] border-[#3b291a] bg-[linear-gradient(180deg,#716242_0%,#5a4f35_46%,#493f2c_100%)] text-[#ffe083] shadow-[0_2px_0_rgba(35,20,11,.34),0_3px_5px_rgba(20,12,7,.18),inset_0_2px_0_rgba(255,235,168,.16),inset_0_0_0_2px_rgba(255,255,255,.04)] disabled:opacity-35"
                aria-label="Village précédent"
              >
                <ChevronLeft aria-hidden="true" className="size-9 stroke-[5] drop-shadow-[0_2px_1px_rgba(0,0,0,.45)]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (villages.length > 1) setIsVillageSheetOpen(true);
                }}
                disabled={villages.length <= 1}
                className="mx-[98px] flex min-w-0 max-w-[600px] flex-col items-center text-center font-game uppercase text-parchment disabled:cursor-default"
                aria-expanded={isVillageSheetOpen}
                aria-label="Choisir le village actif"
              >
                <span className="text-[20px] font-bold leading-none tracking-[.34em] text-[#d9c08d]">
                  {activeVillage.isCapital ? 'Capitale' : 'Village'}
                </span>
                <span className="mt-2 flex w-full min-w-0 items-center justify-center gap-2 text-[28px] font-bold leading-none tracking-normal text-white [text-shadow:2px_2px_0_rgba(0,0,0,.55)]">
                  <span className="min-w-0 truncate">{activeVillage.name}</span>
                  {villages.length > 1 && <ChevronDown aria-hidden="true" className="size-8 shrink-0 stroke-[4]" />}
                </span>
                <span className="mt-3 flex items-center justify-center gap-[6px] text-[22px] font-bold leading-none tracking-normal text-[#ffe083] [text-shadow:1px_1px_0_rgba(0,0,0,.5)]">
                  <img alt="" className="size-[26px]" src={publicAsset('/assets/army-power.png')} />
                  {integerFormatter.format(activeVillagePower)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => switchVillage(1)}
                disabled={villages.length <= 1}
                className="absolute right-[18px] top-[28px] inline-flex size-[78px] items-center justify-center rounded-[19px] border-[5px] border-[#3b291a] bg-[linear-gradient(180deg,#716242_0%,#5a4f35_46%,#493f2c_100%)] text-[#ffe083] shadow-[0_2px_0_rgba(35,20,11,.34),0_3px_5px_rgba(20,12,7,.18),inset_0_2px_0_rgba(255,235,168,.16),inset_0_0_0_2px_rgba(255,255,255,.04)] disabled:opacity-35"
                aria-label="Village suivant"
              >
                <ChevronRight aria-hidden="true" className="size-9 stroke-[5] drop-shadow-[0_2px_1px_rgba(0,0,0,.45)]" />
              </button>
            </div>
          )}
        </div>
      </div>
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
