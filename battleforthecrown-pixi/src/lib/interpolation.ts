import type { ResourcesSnapshot } from '@/stores/resources';
import type { CrownsSnapshot } from '@/stores/crowns';

export interface DisplayResources {
  wood: number;
  stone: number;
  iron: number;
  maxPerType: number;
}

/**
 * Project a `ResourcesSnapshot` into displayable values at `nowMs`.
 * Production rates are per-hour, capped at `maxPerType`.
 */
export function projectResources(snapshot: ResourcesSnapshot, nowMs: number): DisplayResources {
  const elapsedHours = Math.max(0, (nowMs - snapshot.lastUpdateTs) / 3_600_000);
  return {
    wood: clampToMax(snapshot.wood + snapshot.productionRates.wood * elapsedHours, snapshot.maxPerType),
    stone: clampToMax(snapshot.stone + snapshot.productionRates.stone * elapsedHours, snapshot.maxPerType),
    iron: clampToMax(snapshot.iron + snapshot.productionRates.iron * elapsedHours, snapshot.maxPerType),
    maxPerType: snapshot.maxPerType,
  };
}

export function projectCrowns(snapshot: CrownsSnapshot, nowMs: number): number {
  const elapsedHours = Math.max(0, (nowMs - snapshot.lastUpdateTs) / 3_600_000);
  return snapshot.balance + snapshot.productionRate * elapsedHours;
}

function clampToMax(value: number, max: number): number {
  return value > max ? max : value;
}
