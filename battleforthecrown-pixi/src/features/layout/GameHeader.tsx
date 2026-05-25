import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
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
  useKingdomPowerQuery,
  useLogout,
  useMyMembershipsQuery,
  useMyVillagesQuery,
  usePopulationQuery,
  queryKeys,
  type ArmyTrainingDto,
  type ResourcesPayload,
  type VillageStrategyInfoDto,
} from '@/api/queries';
import { apiClient, type BuildingDto, type PopulationDto, type QueueEntryDto } from '@/api';
import { formatResourceAmount } from '@/lib/resourceConfig';
import { BottomSheet } from '@/ui';
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
      enabled: isVillageSheetOpen,
      queryFn: () => apiClient.get<ResourcesPayload>(`/resources/${id}`),
      queryKey: queryKeys.resources(id),
      staleTime: 5_000,
    })),
  });
  const villagePopulation = useQueries({
    queries: villageIds.map((id) => ({
      enabled: isVillageSheetOpen,
      queryFn: () => apiClient.get<PopulationDto>('/population', { query: { villageId: id } }),
      queryKey: queryKeys.population(id),
      staleTime: 5_000,
    })),
  });
  const villageBuildings = useQueries({
    queries: villageIds.map((id) => ({
      enabled: isVillageSheetOpen || shouldLoadProfileVillages,
      queryFn: () => apiClient.get<BuildingDto[]>('/village/buildings', { query: { villageId: id } }),
      queryKey: queryKeys.buildings(id),
      staleTime: 5_000,
    })),
  });
  const villageQueue = useQueries({
    queries: villageIds.map((id) => ({
      enabled: isVillageSheetOpen,
      queryFn: () => apiClient.get<QueueEntryDto[]>('/village/queue', { query: { villageId: id } }),
      queryKey: queryKeys.queue(id),
      staleTime: 5_000,
    })),
  });
  const villageStrategy = useQueries({
    queries: villageIds.map((id) => ({
      enabled: isVillageSheetOpen || shouldLoadProfileVillages,
      queryFn: () => apiClient.get<VillageStrategyInfoDto>('/village/strategy', { query: { villageId: id } }),
      queryKey: queryKeys.villageStrategy(id),
      staleTime: 5_000,
    })),
  });
  const villageTraining = useQueries({
    queries: villageIds.map((id) => ({
      enabled: isVillageSheetOpen,
      queryFn: () => apiClient.get<ArmyTrainingDto[]>(`/army/${id}/training`),
      queryKey: queryKeys.armyTraining(id),
      staleTime: 2_000,
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
        day: '—',
        name: activeMembership?.worldName ?? worldId ?? 'À venir',
        total: '—',
      },
    };
  }, [activeMembership?.worldName, crownBalance, kingdomPower.data, user, villages.length, worldId]);

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
        value: formatResourceAmount(woodCurrent),
        fillRatio: ratio(woodCurrent),
        onClick: onResourceClick ? () => onResourceClick('wood') : undefined,
      },
      {
        icon: '/assets/resources/stone.png',
        label: 'Pierre',
        value: formatResourceAmount(stoneCurrent),
        fillRatio: ratio(stoneCurrent),
        onClick: onResourceClick ? () => onResourceClick('stone') : undefined,
      },
      {
        icon: '/assets/resources/iron.png',
        label: 'Fer',
        value: formatResourceAmount(ironCurrent),
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
      value: formatResourceAmount(available),
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
    <div className="flex flex-col overflow-hidden bg-[#442918]">
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
            <div className="relative flex h-[136px] items-start justify-center border-t-4 border-[#8b7355] bg-[#442918] px-0 pt-5">
              <button
                type="button"
                onClick={() => switchVillage(-1)}
                disabled={villages.length <= 1}
                className="absolute left-[20px] top-[31px] inline-flex size-[70px] items-center justify-center rounded-[18px] border-4 border-[#255f94] bg-[linear-gradient(to_bottom,#77b6ef,#2f7fc3)] text-white shadow-[0_5px_0_rgba(0,0,0,.35)] disabled:opacity-35"
                aria-label="Village précédent"
              >
                <ChevronLeft aria-hidden="true" className="size-12 stroke-[5]" />
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
                <span className="text-[20px] font-bold leading-none tracking-[.34em] text-[#d9c08d]">Village</span>
                <span className="mt-2 flex w-full min-w-0 items-center justify-center gap-2 text-[28px] font-bold leading-none tracking-normal text-white [text-shadow:2px_2px_0_rgba(0,0,0,.55)]">
                  <span className="min-w-0 truncate">{activeVillage.name}</span>
                  {villages.length > 1 && <ChevronDown aria-hidden="true" className="size-8 shrink-0 stroke-[4]" />}
                </span>
                {activeVillage.isCapital && (
                  <span className="mt-1 font-serif text-[23px] italic leading-none normal-case text-[#e9d9ae] [text-shadow:1px_1px_0_rgba(0,0,0,.45)]">
                    Capitale
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => switchVillage(1)}
                disabled={villages.length <= 1}
                className="absolute right-[20px] top-[31px] inline-flex size-[70px] items-center justify-center rounded-[18px] border-4 border-[#255f94] bg-[linear-gradient(to_bottom,#77b6ef,#2f7fc3)] text-white shadow-[0_5px_0_rgba(0,0,0,.35)] disabled:opacity-35"
                aria-label="Village suivant"
              >
                <ChevronRight aria-hidden="true" className="size-12 stroke-[5]" />
              </button>
            </div>
          )}
        </div>
      </div>
      {activeVillage && (
        <BottomSheet
          className="mx-auto h-[86vh] max-w-[32rem]"
          isOpen={isVillageSheetOpen}
          maxHeight="86vh"
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
        className="mx-auto h-[86vh] max-w-[32rem]"
        isOpen={isProfileOpen}
        maxHeight="86vh"
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
