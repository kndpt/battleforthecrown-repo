import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router';
import { HeaderBar, type HeaderBarStat } from '@/features/design-system/components/HeaderBar';
import {
  MultiVillageBottomSheet,
  type MultiVillageActivityKind,
  type MultiVillageFilter,
  type MultiVillageItem,
} from '@/features/design-system/components/MultiVillageBottomSheet';
import { useDisplayResources, useDisplayCrowns } from '@/features/resources/useDisplayResources';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import {
  useKingdomPowerQuery,
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
  getVillageSelectorLabel,
  multiVillageBottomSheetLabels,
} from './multiVillageSheet';

const integerFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

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

interface GameHeaderProps {
  onPowerClick?: () => void;
  onResourceClick?: (resource: 'iron' | 'stone' | 'wood') => void;
}

export function GameHeader({ onPowerClick, onResourceClick }: GameHeaderProps = {}) {
  const navigate = useNavigate();
  const villageId = useGameStore((state) => state.villageId);
  const worldId = useGameStore((state) => state.worldId);
  const setVillage = useGameStore((state) => state.setVillage);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const population = usePopulationQuery(villageId);
  const kingdomPower = useKingdomPowerQuery();
  const myVillages = useMyVillagesQuery(worldId);
  const { display, hasSnapshot } = useDisplayResources(villageId);
  const { balance: crownBalance } = useDisplayCrowns(userId, worldId);
  const [isVillageSheetOpen, setIsVillageSheetOpen] = useState(false);
  const [villageFilter, setVillageFilter] = useState<MultiVillageFilter>('all');
  const [sortAscending, setSortAscending] = useState(true);

  const villages = myVillages.data ?? [];
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
      enabled: isVillageSheetOpen,
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
      enabled: isVillageSheetOpen,
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
    const used = population.data?.used ?? 0;
    const max = population.data?.max ?? 0;
    return {
      icon: '/assets/resources/population.png',
      label: 'Population',
      value: max > 0 ? `${formatResourceAmount(used)}/${formatResourceAmount(max)}` : formatResourceAmount(used),
      fillRatio: max > 0 ? used / max : undefined,
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

  return (
    <div className="flex flex-col bg-[#3c2619]">
      <div className="px-1.5 pt-1.5 pb-1">
        <HeaderBar
          avatarInitials="SK"
          level={12}
          population={populationStat}
          primaryStats={primaryStats}
          resources={resources}
        />
      </div>
      {activeVillage && (
        <div className="relative flex h-8 items-center justify-center border-t border-[#3d2f1f]/35 bg-[#4b3826]/35 px-3">
          <button
            type="button"
            onClick={() => switchVillage(-1)}
            disabled={villages.length <= 1}
            className="absolute left-3 inline-flex size-7 items-center justify-center rounded-full text-parchment disabled:opacity-35"
            aria-label="Village précédent"
          >
            <img
              src="/assets/arrow-top.png"
              alt=""
              className="size-6 -rotate-90 object-contain"
            />
          </button>

          <button
            type="button"
            onClick={() => {
              if (villages.length > 1) setIsVillageSheetOpen(true);
            }}
            disabled={villages.length <= 1}
            className="mx-10 flex min-w-0 max-w-[18rem] items-center gap-1 text-center font-game text-sm font-bold uppercase tracking-wide text-parchment disabled:cursor-default"
            aria-expanded={isVillageSheetOpen}
            aria-label="Choisir le village actif"
          >
            <span className="truncate">
              {getVillageSelectorLabel(activeVillage)}
            </span>
            {villages.length > 1 && <ChevronDown size={16} className="shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => switchVillage(1)}
            disabled={villages.length <= 1}
            className="absolute right-3 inline-flex size-7 items-center justify-center rounded-full text-parchment disabled:opacity-35"
            aria-label="Village suivant"
          >
            <img
              src="/assets/arrow-top.png"
              alt=""
              className="size-6 rotate-90 object-contain"
            />
          </button>

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
        </div>
      )}
    </div>
  );
}
