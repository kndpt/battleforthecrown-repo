import {
  BARRACKS_UNIT_TYPES,
  UNIT_COSTS,
  UNIT_STATS,
  UNIT_TYPES,
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
  ArmySupportRow,
  ArmySupportUnitChip,
  ArmyTroop,
  ArmyTroopCategory,
  ArmyTroopSection,
  ArmyVillageRow,
} from '@/features/design-system/components';
import { formatRemaining } from '@/features/village/constructionProgress';
import type { DisplayResources } from '@/lib/interpolation';
import { unitMetaFor } from './unitConfig';
import { computeUnitTrainingProgress } from './trainingProgress';
import { getEffectiveUnitTrainingDurationSeconds } from './trainingDuration';

export type ArmyFilterId = 'all' | 'mine' | 'allies' | 'sent';

const FILTER_LABELS: Record<ArmyFilterId, string> = {
  all: 'Toutes',
  allies: 'Alliés',
  mine: 'Village',
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

const ARMY_UNIT_TYPES = Object.values(UNIT_TYPES) as UnitType[];
const BARRACKS_UNIT_TYPE_SET = new Set<UnitType>(BARRACKS_UNIT_TYPES);

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
  armySections: ArmyTroopSection[];
  barracksTroops: ArmyTroop[];
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
    populationAvailable: Math.max(0, population?.available ?? 0),
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
  const troops = ARMY_UNIT_TYPES.map((unitType) => {
    const cost = UNIT_COSTS[unitType];
    const stats = UNIT_STATS[unitType];
    const meta = unitMetaFor(unitType);
    const trainableInBarracks = BARRACKS_UNIT_TYPE_SET.has(unitType);
    const requiredLevel = cost.requiredBarracksLevel;
    const unlocked = trainableInBarracks ? barracksLevel >= requiredLevel : true;
    const trainingSeconds = trainableInBarracks
      ? getEffectiveUnitTrainingDurationSeconds({
          barracksLevel,
          unitTimeSeconds: cost.time,
          worldTempo,
        })
      : cost.time;

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
      draggable: trainableInBarracks && unlocked,
      emoji: meta.iconPath ? undefined : meta.emoji,
      fromAllies: incomingByType.get(unitType) ?? 0,
      icon: meta.iconPath ?? undefined,
      id: unitType,
      inVillage: inventoryByType.get(unitType)?.quantity ?? 0,
      name: meta.name,
      pop: cost.population,
      power: getUnitPowerWeight(unitType),
      requiredLevel: trainableInBarracks ? requiredLevel : undefined,
      requirementLabel: trainableInBarracks
        ? `Caserne niv. ${requiredLevel} requis`
        : undefined,
      short: meta.name,
      supportingElsewhere: outgoingByType.get(unitType) ?? 0,
      trainingTime: formatRemaining(Math.floor(trainingSeconds) * 1000),
      unlocked,
    } satisfies ArmyTroop;
  });

  const filters = buildArmyFilters(troops);
  const safeFilter = coerceArmyFilter(activeFilterId, filters);
  const { queue, summaryLabel } = buildArmyQueue(trainings, nowMs);
  const barracksTroops = buildBarracksTroops(troops);

  return {
    activeFilterId: safeFilter,
    armySections: buildArmySections(troops, garrisonLines),
    barracksTroops,
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
    troops.reduce((sum, troop) => sum + getDisplayQuantity(troop, filterId), 0);

  return (['mine', 'allies', 'sent', 'all'] satisfies ArmyFilterId[]).map((id) => ({
    count: count(id),
    id,
    label: FILTER_LABELS[id],
    tone: FILTER_TONES[id],
  }));
}

function filterArmyTroops(troops: ArmyTroop[], filterId: ArmyFilterId): ArmyTroop[] {
  return troops.flatMap((troop) => {
    const quantity = getDisplayQuantity(troop, filterId);
    return quantity > 0 ? [{ ...troop, displayQuantity: quantity }] : [];
  });
}

function buildBarracksTroops(troops: ArmyTroop[]): ArmyTroop[] {
  return troops
    .filter((troop) => BARRACKS_UNIT_TYPE_SET.has(troop.id as UnitType))
    .map((troop) => ({
      ...troop,
      displayQuantity: troop.inVillage + (troop.supportingElsewhere ?? 0),
    }));
}

function buildArmySections(
  troops: ArmyTroop[],
  garrisonLines: GarrisonLine[],
): ArmyTroopSection[] {
  const villageTroops = troops.flatMap((troop) => {
    const quantity = troop.inVillage + (troop.fromAllies ?? 0);
    return quantity > 0
      ? [{ ...troop, displayQuantity: quantity, draggable: false }]
      : [];
  });
  const villageRows = buildVillageRows(troops);
  const supportRows = buildOutgoingSupportRows(garrisonLines);

  return [
    {
      emptyLabel: 'Aucune troupe stationnée dans ce village.',
      id: 'village',
      summary: formatPowerSummary(sumVillagePower(villageRows)),
      summaryIcon: '/assets/army-power.png',
      title: 'Village',
      troops: villageTroops,
      villageRows,
    },
    {
      emptyLabel: 'Aucune troupe stationnée ailleurs.',
      id: 'away',
      summary: formatPowerSummary(sumSupportPower(supportRows)),
      summaryIcon: '/assets/army-power.png',
      supportRows,
      title: 'Stationnées ailleurs',
      troops: [],
    },
  ];
}

function buildVillageRows(troops: ArmyTroop[]): ArmyVillageRow[] {
  return troops.flatMap((troop) => {
    const ownQuantity = troop.inVillage;
    const alliedQuantity = troop.fromAllies ?? 0;
    const totalQuantity = ownQuantity + alliedQuantity;

    if (totalQuantity <= 0) return [];

    return [{
      alliedQuantity,
      emoji: troop.emoji,
      icon: troop.icon,
      id: troop.id,
      ownQuantity,
      power: totalQuantity * troop.power,
      title: troop.name,
      totalQuantity,
    } satisfies ArmyVillageRow];
  });
}

function buildOutgoingSupportRows(lines: GarrisonLine[]): ArmySupportRow[] {
  const rowsByVillage = new Map<
    string,
    {
      id: string;
      subtitle: string;
      title: string;
      totalQuantity: number;
      power: number;
      unitsByType: Map<UnitType, ArmySupportUnitChip>;
    }
  >();

  for (const line of lines) {
    if (line.direction !== 'OUTGOING' || line.quantity <= 0) continue;

    const row = rowsByVillage.get(line.villageId) ?? {
      id: line.villageId,
      power: 0,
      subtitle: line.hostPlayerName
        ? `${line.hostPlayerName} · Depuis : —`
        : 'Depuis : —',
      title: line.hostVillageName ?? `Village ${line.villageId}`,
      totalQuantity: 0,
      unitsByType: new Map<UnitType, ArmySupportUnitChip>(),
    };
    const meta = unitMetaFor(line.unitType);
    const existingUnit = row.unitsByType.get(line.unitType);

    row.totalQuantity += line.quantity;
    row.power += line.quantity * getUnitPowerWeight(line.unitType);
    row.unitsByType.set(line.unitType, {
      emoji: meta.iconPath ? undefined : meta.emoji,
      icon: meta.iconPath ?? undefined,
      id: line.unitType,
      label: meta.name,
      quantity: (existingUnit?.quantity ?? 0) + line.quantity,
    });
    rowsByVillage.set(line.villageId, row);
  }

  return Array.from(rowsByVillage.values())
    .map((row) => {
      const units = Array.from(row.unitsByType.values()).sort(
        (a, b) => b.quantity - a.quantity || a.label.localeCompare(b.label),
      );

      return {
        id: row.id,
        power: row.power,
        subtitle: row.subtitle,
        title: row.title,
        totalQuantity: row.totalQuantity,
        units,
      } satisfies ArmySupportRow;
    })
    .sort((a, b) => b.totalQuantity - a.totalQuantity || a.title.localeCompare(b.title));
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
    summaryLabel: `${totalQuantity} en formation · ${formatRemaining(remainingMs)} restant`,
  };
}

function getDisplayQuantity(troop: ArmyTroop, filterId: ArmyFilterId): number {
  if (filterId === 'mine') return troop.inVillage;
  if (filterId === 'allies') return troop.fromAllies ?? 0;
  if (filterId === 'sent') return troop.supportingElsewhere ?? 0;
  return troop.inVillage + (troop.fromAllies ?? 0);
}

function formatPowerSummary(power: number): string {
  return power.toLocaleString('fr-FR');
}

function sumVillagePower(rows: ArmyVillageRow[]): number {
  return rows.reduce((sum, row) => sum + row.power, 0);
}

function sumSupportPower(rows: ArmySupportRow[]): number {
  return rows.reduce((sum, row) => sum + row.power, 0);
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
