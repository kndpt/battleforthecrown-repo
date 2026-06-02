import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { BuildingDto, JoinedVillage } from '@/api';
import {
  armyTrainingQueryOptions,
  buildingsQueryOptions,
  populationQueryOptions,
  queueQueryOptions,
  resourcesQueryOptions,
  useKingdomPowerQuery,
  villageStrategyQueryOptions,
  type KingdomPowerDto,
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
 */
export function useMultiVillageData(
  villages: JoinedVillage[],
  { villageSheetOpen, profileVillagesActive, activeVillageId, sortAscending }: MultiVillageDataOptions,
): MultiVillageData {
  const kingdomPower = useKingdomPowerQuery();
  const villageIds = useMemo(() => villages.map((village) => village.id), [villages]);

  const villageResources = useQueries({
    queries: villageIds.map((id) => ({ ...resourcesQueryOptions(id), enabled: villageSheetOpen })),
  });
  const villagePopulation = useQueries({
    queries: villageIds.map((id) => ({ ...populationQueryOptions(id), enabled: villageSheetOpen })),
  });
  const villageBuildings = useQueries({
    queries: villageIds.map((id) => ({
      ...buildingsQueryOptions(id),
      enabled: villageSheetOpen || profileVillagesActive,
    })),
  });
  const villageQueue = useQueries({
    queries: villageIds.map((id) => ({ ...queueQueryOptions(id), enabled: villageSheetOpen })),
  });
  const villageStrategy = useQueries({
    queries: villageIds.map((id) => ({
      ...villageStrategyQueryOptions(id),
      enabled: villageSheetOpen || profileVillagesActive,
    })),
  });
  const villageTraining = useQueries({
    queries: villageIds.map((id) => ({ ...armyTrainingQueryOptions(id), enabled: villageSheetOpen })),
  });

  const powerByVillageId = useMemo(
    () =>
      new Map(
        (kingdomPower.data?.villages ?? []).map((village) => [village.villageId, village.total]),
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
