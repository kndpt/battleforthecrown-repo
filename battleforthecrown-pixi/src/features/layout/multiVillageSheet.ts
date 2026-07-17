import type { BuildingDto, JoinedVillage, PopulationDto, QueueEntryDto } from '@/api';
import type {
  ArmyTrainingDto,
  ResourcesPayload,
  VillageStrategyInfoDto,
} from '@/api/queries';
import { formatDuration, NUMBER_FMT } from '@/lib/formatters';
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
import type { IncomingAttackDto } from '@battleforthecrown/shared/events';

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
    incomingByVillageId?: ReadonlyMap<string, IncomingAttackDto[]>;
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

  return villages.map((village) => {
    const power = runtime.powerByVillageId?.get(village.id);
    return {
    active: village.id === activeVillageId,
    alert: deriveVillageStateAlert({
      incoming: runtime.incomingByVillageId?.get(village.id),
      now,
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
    power: power != null ? NUMBER_FMT.format(power) : undefined,
    resources: mapResources(
      runtime.resourcesByVillageId?.get(village.id),
      runtime.populationByVillageId?.get(village.id),
    ),
    strategy: runtime.strategyByVillageId?.get(village.id)?.currentStrategy,
    troops: mapTroopActivities(runtime.trainingByVillageId?.get(village.id), now),
  };
  });
}

/**
 * FR messages for the derived state warnings. Kept here (not in the component
 * label bag) so the pure derivation stays self-contained and unit-testable.
 */
export const VILLAGE_STATE_ALERT_MESSAGES = {
  attackIncoming: 'Attaque entrante',
  idleQueue: 'File inactive',
  warehouseFull: 'Entrepôt plein',
} as const;

/** No natural countdown for a state warning — the eta pill shows a dash. */
const STATE_ALERT_NO_ETA = '—';

/**
 * Purely presentational per-village alert for the multi-village sheet. Derived
 * from data already fetched by `useMultiVillageData`; it has **zero gameplay
 * effect** and never triggers any server write.
 *
 * Invariant inherited from run 031: never invent an alert when no data is
 * available (returns `null`).
 *
 * Deterministic priority when several conditions hold (`alert` is singular):
 * incoming attack (run 101) > warehouse full > idle queue (run 095). The attack
 * branch is the only one that emits `kind: 'attack'`; the state branches emit
 * `kind: 'warning'`.
 *
 * Fog-of-war safe: the attack path reads only the defender-facing
 * {@link IncomingAttackDto} (5 fields, no attacker/composition/origin) and
 * surfaces solely the nearest ETA — never any attacker detail.
 */
export function deriveVillageStateAlert(input: {
  incoming?: IncomingAttackDto[];
  now?: number;
  queue?: QueueEntryDto[];
  resources?: ResourcesPayload;
  training?: ArmyTrainingDto[];
}): MultiVillageAlert | null {
  const { incoming, now, queue, resources, training } = input;

  // No data loaded for this village → nothing to assert (invariant 031).
  if (
    resources === undefined &&
    queue === undefined &&
    training === undefined &&
    incoming === undefined
  ) {
    return null;
  }

  // Highest priority: a real incoming threat outranks any state warning.
  const attack = deriveIncomingAttackAlert(incoming, now);
  if (attack) return attack;

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

/**
 * Emits a `kind: 'attack'` alert when at least one unresolved incoming attack
 * targets the village. ETA = the nearest `arrivalAt`, compact-formatted. Reads
 * only the fog-safe DTO fields; nothing about the attacker leaks into the pill.
 */
function deriveIncomingAttackAlert(
  incoming: IncomingAttackDto[] | undefined,
  now: number | undefined,
): MultiVillageAlert | null {
  if (!incoming || incoming.length === 0) return null;

  const reference = now ?? Date.now();
  // Only a still-pending arrival drives a live countdown. Ignore unparseable or
  // already-elapsed entries (stale cache before the 2 s refetch) so an expired
  // attack can't become the `min` and mask a genuine future threat's ETA — nor
  // surface a dash instead of the real remaining time. If nothing is still
  // pending, the threat has resolved: no pill.
  const nearestArrival = incoming.reduce((soonest, attack) => {
    const at = Date.parse(attack.arrivalAt);
    return Number.isNaN(at) || at <= reference ? soonest : Math.min(soonest, at);
  }, Number.POSITIVE_INFINITY);

  if (!Number.isFinite(nearestArrival)) return null;

  return {
    eta: formatCompactRemaining(nearestArrival - reference),
    kind: 'attack',
    msg: VILLAGE_STATE_ALERT_MESSAGES.attackIncoming,
  };
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
  return ms <= 0 ? '—' : formatDuration(Math.ceil(ms / 1000) * 1000);
}
