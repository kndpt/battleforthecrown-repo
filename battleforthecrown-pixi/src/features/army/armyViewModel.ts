import {
  BARRACKS_UNIT_TYPES,
  UNIT_COSTS,
  UNIT_STATS,
  type UnitType,
} from '@battleforthecrown/shared/army';
import { getUnitPowerWeight } from '@battleforthecrown/shared/power';
import type { ArmyTrainingDto, ArmyUnitDto } from '@/api/queries';
import type { PopulationDto } from '@/api';
import type { GarrisonLine } from '@/lib/types';
import type {
  ArmyFilterOption,
  ArmyQueueItem,
  ArmyRecruitQuickValue,
  ArmyRecruitSheetProps,
  ArmyRecruitStock,
  ArmyTroop,
  ArmyTroopCategory,
} from '@/features/design-system/components';
import { formatArmyTrainingDuration } from '@/features/design-system/components';
import type { DisplayResources } from '@/lib/interpolation';
import { unitMetaFor } from './unitConfig';
import { computeUnitTrainingProgress } from './trainingProgress';
import { getEffectiveUnitTrainingDurationSeconds } from './trainingDuration';

export type ArmyFilterId = 'all' | 'mine' | 'allies' | 'sent';

const FILTER_LABELS: Record<ArmyFilterId, string> = {
  all: 'Toutes',
  allies: 'Alliés',
  mine: 'Mien',
  sent: 'Envoyés',
};

const FILTER_TONES: Partial<Record<ArmyFilterId, ArmyFilterOption['tone']>> = {
  allies: 'blue',
  mine: 'green',
  sent: 'gold',
};

const UNIT_CATEGORIES: Record<UnitType, ArmyTroopCategory> = {
  ARCHER: 'Tireur',
  CATAPULT: 'Siège',
  CAVALRY: 'Cavalerie',
  MILITIA: 'Infanterie',
  NOBLE: 'Élite',
  RAM: 'Siège',
  SPY: 'Spécial',
  SQUIRE: 'Infanterie',
  TEMPLAR: 'Élite',
  WARRIOR: 'Infanterie',
};

export interface ArmyViewModelInput {
  activeFilterId: ArmyFilterId;
  barracksLevel: number;
  garrisonLines: GarrisonLine[];
  nowMs: number;
  population: PopulationDto | null | undefined;
  resources: DisplayResources | null | undefined;
  trainings: ArmyTrainingDto[];
  units: ArmyUnitDto[];
  worldTempo?: Parameters<typeof getEffectiveUnitTrainingDurationSeconds>[0]['worldTempo'];
}

export interface ArmyViewModel {
  activeFilterId: ArmyFilterId;
  filters: ArmyFilterOption[];
  recruitSheet: ArmyRecruitSheetProps;
  stock: ArmyRecruitStock;
  troops: ArmyTroop[];
  visibleTroops: ArmyTroop[];
}

export function buildArmyRecruitStock(
  resources: DisplayResources | null | undefined,
  population: PopulationDto | null | undefined,
): ArmyRecruitStock {
  return {
    iron: Math.max(0, Math.floor(resources?.iron ?? 0)),
    popMax: Math.max(0, population?.max ?? 0),
    population: Math.max(0, population?.used ?? 0),
    stone: Math.max(0, Math.floor(resources?.stone ?? 0)),
    wood: Math.max(0, Math.floor(resources?.wood ?? 0)),
  };
}

export function buildArmyRecruitQuickValues(max: number): ArmyRecruitQuickValue[] {
  return [
    { label: '10', value: 10 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '500', value: 500 },
    { label: 'MAX', tone: 'gold', value: Math.max(0, max) },
  ];
}

export function buildArmyViewModel({
  activeFilterId,
  barracksLevel,
  garrisonLines,
  nowMs,
  population,
  resources,
  trainings,
  units,
  worldTempo,
}: ArmyViewModelInput): ArmyViewModel {
  const inventoryByType = new Map(units.map((unit) => [unit.type, unit]));
  const incomingByType = sumGarrisonByType(garrisonLines, 'INCOMING');
  const outgoingByType = sumGarrisonByType(garrisonLines, 'OUTGOING');
  const stock = buildArmyRecruitStock(resources, population);
  const troops = BARRACKS_UNIT_TYPES.map((unitType) => {
    const cost = UNIT_COSTS[unitType];
    const stats = UNIT_STATS[unitType];
    const meta = unitMetaFor(unitType);
    const requiredLevel = cost.requiredBarracksLevel;
    const unlocked = barracksLevel >= requiredLevel;
    const trainingSeconds = getEffectiveUnitTrainingDurationSeconds({
      barracksLevel,
      unitTimeSeconds: cost.time,
      worldTempo,
    });

    return {
      attack: stats.attack,
      category: UNIT_CATEGORIES[unitType],
      cost: {
        iron: cost.iron,
        stone: cost.stone,
        wood: cost.wood,
      },
      defense: Math.max(
        stats.defenseArcher,
        stats.defenseCavalry,
        stats.defenseInfantry,
      ),
      draggable: unlocked,
      emoji: meta.iconPath ? undefined : meta.emoji,
      fromAllies: incomingByType.get(unitType) ?? 0,
      icon: meta.iconPath ?? undefined,
      id: unitType,
      inVillage: inventoryByType.get(unitType)?.quantity ?? 0,
      name: meta.name,
      pop: cost.population,
      power: getUnitPowerWeight(unitType),
      requiredLevel,
      requirementLabel: `Caserne niv. ${requiredLevel} requis`,
      short: meta.name,
      supportingElsewhere: outgoingByType.get(unitType) ?? 0,
      trainingTime: formatArmyTrainingDuration(trainingSeconds),
      unlocked,
    } satisfies ArmyTroop;
  });

  const filters = buildArmyFilters(troops);
  const safeFilter = coerceArmyFilter(activeFilterId, filters);
  const { queue, summaryLabel } = buildArmyQueue(trainings, nowMs);

  return {
    activeFilterId: safeFilter,
    filters,
    recruitSheet: {
      activeDropLabel: 'Lâcher ici',
      dropIdleLabel: 'Glissez une troupe ici',
      iconPath: 'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6m-3 9 5-5m-4.5-1.5 5 5',
      queue,
      summaryLabel,
      title: "Caserne · file d'attente",
    },
    stock,
    troops,
    visibleTroops: filterArmyTroops(troops, safeFilter),
  };
}

export function findArmyUnitByTroopId(
  units: ArmyUnitDto[],
  troopId: string,
): ArmyUnitDto | null {
  return units.find((unit) => unit.type === troopId) ?? null;
}

function buildArmyFilters(troops: ArmyTroop[]): ArmyFilterOption[] {
  const count = (filterId: ArmyFilterId) =>
    filterArmyTroops(troops, filterId).reduce((sum, troop) => {
      if (filterId === 'mine') return sum + troop.inVillage;
      if (filterId === 'allies') return sum + (troop.fromAllies ?? 0);
      if (filterId === 'sent') return sum + (troop.supportingElsewhere ?? 0);
      return sum + troop.inVillage + (troop.fromAllies ?? 0) + (troop.supportingElsewhere ?? 0);
    }, 0);

  return (['all', 'mine', 'allies', 'sent'] satisfies ArmyFilterId[]).map((id) => ({
    count: count(id),
    id,
    label: FILTER_LABELS[id],
    tone: FILTER_TONES[id],
  }));
}

function filterArmyTroops(troops: ArmyTroop[], filterId: ArmyFilterId): ArmyTroop[] {
  if (filterId === 'mine') return troops.filter((troop) => troop.inVillage > 0);
  if (filterId === 'allies') return troops.filter((troop) => (troop.fromAllies ?? 0) > 0);
  if (filterId === 'sent') return troops.filter((troop) => (troop.supportingElsewhere ?? 0) > 0);
  return troops;
}

function coerceArmyFilter(
  filterId: ArmyFilterId,
  filters: ArmyFilterOption[],
): ArmyFilterId {
  const filter = filters.find((candidate) => candidate.id === filterId);
  return filter ? (filter.id as ArmyFilterId) : 'all';
}

function buildArmyQueue(
  trainings: ArmyTrainingDto[],
  nowMs: number,
): { queue: ArmyQueueItem[]; summaryLabel: string } {
  const queue = trainings.map((training, index) => {
    const progress = computeUnitTrainingProgress(training, nowMs);
    return {
      active: index === 0,
      id: training.id,
      progress: progress.percent / 100,
      quantity: Math.max(0, training.totalQty - training.completedQty),
      troopId: training.unitType,
    } satisfies ArmyQueueItem;
  });

  if (queue.length === 0) {
    return { queue, summaryLabel: 'File vide' };
  }

  const totalQuantity = queue.reduce((sum, item) => sum + item.quantity, 0);
  const remainingMs = trainings.reduce(
    (sum, training) =>
      sum + computeUnitTrainingProgress(training, nowMs).totalRemainingMs,
    0,
  );

  return {
    queue,
    summaryLabel: `${totalQuantity} en formation · ${formatArmyTrainingDuration(remainingMs / 1000)} restant`,
  };
}

function sumGarrisonByType(
  lines: GarrisonLine[],
  direction: GarrisonLine['direction'],
): Map<UnitType, number> {
  const byType = new Map<UnitType, number>();
  for (const line of lines) {
    if (line.direction !== direction) continue;
    byType.set(line.unitType, (byType.get(line.unitType) ?? 0) + line.quantity);
  }
  return byType;
}
