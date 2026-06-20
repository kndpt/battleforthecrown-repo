import type { BuildingDto, JoinedVillage, PopulationDto, QueueEntryDto } from '@/api';
import type {
  ArmyTrainingDto,
  ResourcesPayload,
  VillageStrategyInfoDto,
} from '@/api/queries';
import { computeUnitTrainingProgress } from '@/features/army/trainingProgress';
import { unitMetaFor } from '@/features/army/unitConfig';
import { computeConstructionProgress } from '@/features/village/constructionProgress';
import { metaFor } from '@/features/village/buildingMeta';
import type {
  MultiVillageBottomSheetLabels,
  MultiVillageItem,
} from '@/features/design-system/components/MultiVillageBottomSheet';
import { VILLAGE_LABEL_DISPLAY } from '@battleforthecrown/shared/village';
import { UNIT_TYPES } from '@battleforthecrown/shared/army';

export const multiVillageBottomSheetLabels: MultiVillageBottomSheetLabels = {
  activeFilter: 'Actifs',
  allFilter: 'Tous',
  alertsFilter: 'Alertes',
  buildActivity: 'Chantier',
  close: 'Fermer',
  empty: 'Aucun village à afficher',
  eyebrow: 'Domaines du royaume',
  levelPrefix: 'Niv.',
  lordActivity: 'Seigneur',
  noActivity: 'Aucune activité',
  sort: 'Trier',
  title: 'Mes villages',
  troopsActivity: 'Formation',
};

export function getVillageSelectorLabel(village: JoinedVillage) {
  const prefix = village.isCapital
    ? 'Capitale'
    : village.label
      ? VILLAGE_LABEL_DISPLAY[village.label]
      : 'Village';

  return `${prefix} — ${village.name}`;
}

export function buildMultiVillageSheetItems(
  villages: JoinedVillage[],
  activeVillageId: string | null,
  runtime: {
    buildingsByVillageId?: ReadonlyMap<string, BuildingDto[]>;
    now?: number;
    populationByVillageId?: ReadonlyMap<string, PopulationDto>;
    powerByVillageId?: ReadonlyMap<string, number>;
    queueByVillageId?: ReadonlyMap<string, QueueEntryDto[]>;
    resourcesByVillageId?: ReadonlyMap<string, ResourcesPayload>;
    strategyByVillageId?: ReadonlyMap<string, VillageStrategyInfoDto>;
    trainingByVillageId?: ReadonlyMap<string, ArmyTrainingDto[]>;
  } = {},
): MultiVillageItem[] {
  const now = runtime.now ?? Date.now();

  return villages.map((village) => ({
    active: village.id === activeVillageId,
    badge: village.label
        ? VILLAGE_LABEL_DISPLAY[village.label]
        : null,
    builds: mapBuildActivities(runtime.queueByVillageId?.get(village.id), now),
    capitale: village.isCapital,
    coords: `${village.x}:${village.y}`,
    id: village.id,
    level: getCastleLevel(runtime.buildingsByVillageId?.get(village.id)),
    lords: mapLordActivities(runtime.trainingByVillageId?.get(village.id), now),
    name: village.name,
    power: runtime.powerByVillageId?.get(village.id)?.toLocaleString('fr-FR'),
    resources: mapResources(
      runtime.resourcesByVillageId?.get(village.id),
      runtime.populationByVillageId?.get(village.id),
    ),
    strategy: runtime.strategyByVillageId?.get(village.id)?.currentStrategy,
    troops: mapTroopActivities(runtime.trainingByVillageId?.get(village.id), now),
  }));
}

/**
 * `buildMultiVillageSheetItems` + alphabetical sort, shared by every multi-village
 * sheet call site (GameHeader, VillageView) so the sort stays consistent.
 */
export function buildSortedMultiVillageSheetItems(
  villages: JoinedVillage[],
  activeVillageId: string | null,
  runtime: Parameters<typeof buildMultiVillageSheetItems>[2],
  sortAscending: boolean,
): MultiVillageItem[] {
  return buildMultiVillageSheetItems(villages, activeVillageId, runtime).toSorted((a, b) =>
    sortAscending
      ? a.name.localeCompare(b.name, 'fr')
      : b.name.localeCompare(a.name, 'fr'),
  );
}

function getCastleLevel(buildings: BuildingDto[] | undefined) {
  return buildings?.find((building) => building.type === 'CASTLE')?.level;
}

function mapResources(
  resources: ResourcesPayload | undefined,
  population: PopulationDto | undefined,
): MultiVillageItem['resources'] {
  if (!resources && !population) return undefined;

  return {
    iron: { max: resources?.maxPerType ?? 0, n: Math.floor(resources?.iron ?? 0) },
    pop: { max: population?.max ?? 0, n: population?.available ?? 0 },
    stone: { max: resources?.maxPerType ?? 0, n: Math.floor(resources?.stone ?? 0) },
    wood: { max: resources?.maxPerType ?? 0, n: Math.floor(resources?.wood ?? 0) },
  };
}

function mapBuildActivities(queue: QueueEntryDto[] | undefined, now: number): MultiVillageItem['builds'] {
  return (queue ?? []).slice(0, 2).map((item) => {
    const progress = computeConstructionProgress(
      { startTime: item.startTime, endTime: item.endTime },
      now,
    );
    const meta = metaFor(item.type);

    return {
      eta: formatCompactRemaining(progress.remainingMs),
      name: meta.label,
      progress: progress.percent / 100,
      target: item.type.toLowerCase(),
      to: item.level,
    };
  });
}

function mapTroopActivities(training: ArmyTrainingDto[] | undefined, now: number): MultiVillageItem['troops'] {
  return (training ?? [])
    .filter((item) => item.unitType !== UNIT_TYPES.NOBLE)
    .slice(0, 2)
    .map((item, index) => {
      // Sequential queue: only the first non-noble row (Barracks head) trains.
      const progress = computeUnitTrainingProgress(item, now, index === 0);
      const meta = unitMetaFor(item.unitType);

      return {
        count: Math.max(0, item.totalQty - item.completedQty),
        eta: formatCompactRemaining(progress.totalRemainingMs),
        label: meta.pluralName,
        progress: progress.percent / 100,
        unit: item.unitType.toLowerCase(),
      };
    });
}

function mapLordActivities(training: ArmyTrainingDto[] | undefined, now: number): MultiVillageItem['lords'] {
  return (training ?? [])
    .filter((item) => item.unitType === UNIT_TYPES.NOBLE)
    .slice(0, 1)
    .map((item) => {
      const progress = computeUnitTrainingProgress(item, now);

      return {
        eta: formatCompactRemaining(progress.totalRemainingMs),
        name: 'Seigneur',
        progress: progress.percent / 100,
      };
    });
}

function formatCompactRemaining(ms: number) {
  if (ms <= 0) return '—';
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
