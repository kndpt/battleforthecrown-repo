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
  MultiVillageAlert,
  MultiVillageBottomSheetLabels,
  MultiVillageFilter,
  MultiVillageItem,
} from '@/features/design-system/components/MultiVillageBottomSheet';
import { VILLAGE_LABEL_DISPLAY } from '@battleforthecrown/shared/village';
import { UNIT_TYPES } from '@battleforthecrown/shared/army';

// Segment set used by the live in-game selector (no per-label chips). Single source of
// truth so the two mount points (village view + shell header) can't drift apart.
export const MULTI_VILLAGE_SELECTOR_FILTERS: MultiVillageFilter[] = ['all', 'active', 'alerts'];

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
    alert: deriveVillageStateAlert({
      queue: runtime.queueByVillageId?.get(village.id),
      resources: runtime.resourcesByVillageId?.get(village.id),
      training: runtime.trainingByVillageId?.get(village.id),
    }),
    badge: village.label
        ? VILLAGE_LABEL_DISPLAY[village.label]
        : null,
    builds: mapBuildActivities(runtime.queueByVillageId?.get(village.id), now),
    capitale: village.isCapital,
    coords: `${village.x}:${village.y}`,
    id: village.id,
    label: village.label ?? null,
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
 * FR messages for the derived state warnings. Kept here (not in the component
 * label bag) so the pure derivation stays self-contained and unit-testable.
 */
export const VILLAGE_STATE_ALERT_MESSAGES = {
  idleQueue: 'File inactive',
  warehouseFull: 'Entrepôt plein',
} as const;

/** No natural countdown for a state warning — the eta pill shows a dash. */
const STATE_ALERT_NO_ETA = '—';

/**
 * Purely presentational per-village state warning for the multi-village sheet
 * (run 095). Derived from data already fetched by `useMultiVillageData`; it has
 * **zero gameplay effect** and never triggers any server write.
 *
 * Invariant inherited from run 031: never invent an alert when no state data is
 * available (returns `null`). This derivation path only ever emits
 * `kind: 'warning'` — never `kind: 'attack'` (incoming-attack alerts are a
 * separate, still-open concern).
 *
 * Deterministic priority when several conditions hold (`alert` is singular):
 * warehouse full > idle queue.
 */
export function deriveVillageStateAlert(input: {
  queue?: QueueEntryDto[];
  resources?: ResourcesPayload;
  training?: ArmyTrainingDto[];
}): MultiVillageAlert | null {
  const { queue, resources, training } = input;

  // No state data loaded for this village → nothing to assert (invariant 031).
  if (resources === undefined && queue === undefined && training === undefined) {
    return null;
  }

  if (isWarehouseFull(resources)) {
    return {
      eta: STATE_ALERT_NO_ETA,
      kind: 'warning',
      msg: VILLAGE_STATE_ALERT_MESSAGES.warehouseFull,
    };
  }

  if (isQueueIdle(queue, training)) {
    return {
      eta: STATE_ALERT_NO_ETA,
      kind: 'warning',
      msg: VILLAGE_STATE_ALERT_MESSAGES.idleQueue,
    };
  }

  return null;
}

/** At least one storable resource (wood/stone/iron) reached its cap. */
function isWarehouseFull(resources: ResourcesPayload | undefined): boolean {
  if (!resources || resources.maxPerType <= 0) return false;
  const { iron, maxPerType, stone, wood } = resources;
  return (
    Math.floor(wood) >= maxPerType ||
    Math.floor(stone) >= maxPerType ||
    Math.floor(iron) >= maxPerType
  );
}

/**
 * Nothing under construction and nothing training (lords included). Only
 * concludes "idle" when both feeds are actually loaded, to avoid a false
 * positive while data is still fetching.
 */
function isQueueIdle(
  queue: QueueEntryDto[] | undefined,
  training: ArmyTrainingDto[] | undefined,
): boolean {
  if (queue === undefined || training === undefined) return false;
  const building = queue.length > 0;
  const forming = training.some((item) => item.totalQty - item.completedQty > 0);
  return !building && !forming;
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
