import type { BuildingDto, QueueEntryDto } from '@/api';
import type { DisplayResources } from '@/lib/interpolation';
import {
  BUILDING_DEFINITIONS,
  type BuildingType,
} from '@battleforthecrown/shared/village/buildings';
import type { VillageResourceType } from './VillageViewSections';

export function formatQueueTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1_000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function computeQueueProgress(
  queueEntry: Pick<QueueEntryDto, 'endTime' | 'startTime'>,
  now: number,
) {
  const endMs = Date.parse(queueEntry.endTime);
  const startMs = Date.parse(queueEntry.startTime);
  const timeRemaining = Math.max(0, endMs - now);
  const totalTime = Math.max(1, endMs - startMs);
  const progress = Math.min(100, ((now - startMs) / totalTime) * 100);
  return { progress, timeRemaining, totalTime };
}

export function computeResourceRatios(
  resources: DisplayResources | null,
): Record<VillageResourceType, number> {
  const maxRes = resources?.maxPerType ?? 0;
  return {
    wood: maxRes > 0 && resources ? Math.min(100, (Math.floor(resources.wood) / maxRes) * 100) : 0,
    stone: maxRes > 0 && resources ? Math.min(100, (Math.floor(resources.stone) / maxRes) * 100) : 0,
    iron: maxRes > 0 && resources ? Math.min(100, (Math.floor(resources.iron) / maxRes) * 100) : 0,
  };
}

export function canAffordNextBuildingLevel(
  building: BuildingDto,
  resources: DisplayResources | null,
  availablePopulation = 0,
): boolean {
  const nextCost =
    BUILDING_DEFINITIONS[building.type as BuildingType]?.levels[building.level + 1] ?? null;
  return (
    nextCost !== null &&
    resources !== null &&
    resources.wood >= nextCost.wood &&
    resources.stone >= nextCost.stone &&
    resources.iron >= nextCost.iron &&
    availablePopulation >= nextCost.population
  );
}
