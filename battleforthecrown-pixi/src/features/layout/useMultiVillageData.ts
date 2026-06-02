import { useCallback, useMemo } from 'react';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import type { BuildingDto, JoinedVillage, PopulationDto, QueueEntryDto } from '@/api';
import {
  armyTrainingQueryOptions,
  buildingsQueryOptions,
  populationQueryOptions,
  queueQueryOptions,
  resourcesQueryOptions,
  useKingdomPowerQuery,
  villageStrategyQueryOptions,
  type ArmyTrainingDto,
  type KingdomPowerDto,
  type ResourcesPayload,
  type VillageStrategyInfoDto,
} from '@/api/queries';
import type { MultiVillageItem } from '@/features/design-system/components/MultiVillageBottomSheet';
import { buildSortedMultiVillageSheetItems } from './multiVillageSheet';
import { toResultMap } from './headerHelpers';

interface MultiVillageDataOptions {
  /** True when the multi-village bottom sheet is open (loads all per-village data). */
  villageSheetOpen: boolean;
  /** True when the profile "villages" tab is active (loads buildings + strategy only). */
  profileVillagesActive: boolean;
  activeVillageId: string | null;
  sortAscending: boolean;
}

interface MultiVillageData {
  kingdomPower: KingdomPowerDto | undefined;
  powerByVillageId: ReadonlyMap<string, number>;
  buildingsByVillageId: ReadonlyMap<string, BuildingDto[]>;
  strategyByVillageId: ReadonlyMap<string, VillageStrategyInfoDto>;
  villageSheetItems: MultiVillageItem[];
}

/**
 * Shared multi-village query orchestration for the topbar / village sheets.
 *
 * Encapsulates the 6 `useQueries` fan-outs (resources, population, buildings,
 * queue, strategy, training) gated on sheet visibility, plus the kingdom-power
 * map, and builds the sorted sheet items. Consumed by both `GameHeader` and
 * `VillageView` to avoid duplicating ~180 LOC of identical wiring.
 *
 * Each fan-out folds its results into a `Map` via the `combine` option so the
 * derived maps stay referentially stable across renders (TanStack v5 returns a
 * fresh results array on every render, which would otherwise defeat the
 * downstream `useMemo`s — see #41 review).
 */
export function useMultiVillageData(
  villages: JoinedVillage[],
  { villageSheetOpen, profileVillagesActive, activeVillageId, sortAscending }: MultiVillageDataOptions,
): MultiVillageData {
  const kingdomPower = useKingdomPowerQuery();
  const villageIds = useMemo(() => villages.map((village) => village.id), [villages]);

  const combineResources = useCallback(
    (results: UseQueryResult<ResourcesPayload>[]) => toResultMap(villageIds, results),
    [villageIds],
  );
  const combinePopulation = useCallback(
    (results: UseQueryResult<PopulationDto>[]) => toResultMap(villageIds, results),
    [villageIds],
  );
  const combineBuildings = useCallback(
    (results: UseQueryResult<BuildingDto[]>[]) => toResultMap(villageIds, results),
    [villageIds],
  );
  const combineQueue = useCallback(
    (results: UseQueryResult<QueueEntryDto[]>[]) => toResultMap(villageIds, results),
    [villageIds],
  );
  const combineStrategy = useCallback(
    (results: UseQueryResult<VillageStrategyInfoDto>[]) => toResultMap(villageIds, results),
    [villageIds],
  );
  const combineTraining = useCallback(
    (results: UseQueryResult<ArmyTrainingDto[]>[]) => toResultMap(villageIds, results),
    [villageIds],
  );

  const resourcesByVillageId = useQueries({
    queries: villageIds.map((id) => ({ ...resourcesQueryOptions(id), enabled: villageSheetOpen })),
    combine: combineResources,
  });
  const populationByVillageId = useQueries({
    queries: villageIds.map((id) => ({ ...populationQueryOptions(id), enabled: villageSheetOpen })),
    combine: combinePopulation,
  });
  const buildingsByVillageId = useQueries({
    queries: villageIds.map((id) => ({
      ...buildingsQueryOptions(id),
      enabled: villageSheetOpen || profileVillagesActive,
    })),
    combine: combineBuildings,
  });
  const queueByVillageId = useQueries({
    queries: villageIds.map((id) => ({ ...queueQueryOptions(id), enabled: villageSheetOpen })),
    combine: combineQueue,
  });
  const strategyByVillageId = useQueries({
    queries: villageIds.map((id) => ({
      ...villageStrategyQueryOptions(id),
      enabled: villageSheetOpen || profileVillagesActive,
    })),
    combine: combineStrategy,
  });
  const trainingByVillageId = useQueries({
    queries: villageIds.map((id) => ({ ...armyTrainingQueryOptions(id), enabled: villageSheetOpen })),
    combine: combineTraining,
  });

  const powerByVillageId = useMemo(
    () =>
      new Map(
        (kingdomPower.data?.villages ?? []).map((village) => [village.villageId, village.total]),
      ),
    [kingdomPower.data?.villages],
  );

  const villageSheetItems = useMemo(
    () =>
      buildSortedMultiVillageSheetItems(
        villages,
        activeVillageId,
        {
          buildingsByVillageId,
          populationByVillageId,
          powerByVillageId,
          queueByVillageId,
          resourcesByVillageId,
          strategyByVillageId,
          trainingByVillageId,
        },
        sortAscending,
      ),
    [
      activeVillageId,
      buildingsByVillageId,
      populationByVillageId,
      powerByVillageId,
      queueByVillageId,
      resourcesByVillageId,
      sortAscending,
      strategyByVillageId,
      trainingByVillageId,
      villages,
    ],
  );

  return {
    kingdomPower: kingdomPower.data,
    powerByVillageId,
    buildingsByVillageId,
    strategyByVillageId,
    villageSheetItems,
  };
}
