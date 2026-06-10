import type { Expedition } from '@prisma/client';
import { parseCombatLoot } from './codecs';
import { CARRY_PER_PORTER } from '@battleforthecrown/shared/logic';

/** Minimal shape needed to parse the caravan payload — avoids forcing a full Expedition load. */
export type WithLoot = Pick<Expedition, 'loot'>;

export type CaravanResources = { wood: number; stone: number; iron: number };

const EMPTY: CaravanResources = Object.freeze({ wood: 0, stone: 0, iron: 0 });

export function emptyCaravanResources(): CaravanResources {
  return { ...EMPTY };
}

export function normalizeCaravanResources(
  resources: Partial<CaravanResources>,
): CaravanResources {
  return {
    wood: Math.max(0, Math.floor(resources.wood ?? 0)),
    stone: Math.max(0, Math.floor(resources.stone ?? 0)),
    iron: Math.max(0, Math.floor(resources.iron ?? 0)),
  };
}

export function sumCaravanResources(resources: CaravanResources): number {
  return resources.wood + resources.stone + resources.iron;
}

export function caravanPortersFor(resources: CaravanResources): number {
  const volume = sumCaravanResources(resources);
  return volume > 0 ? Math.ceil(volume / CARRY_PER_PORTER) : 0;
}

export function addCaravanResources(
  left: CaravanResources,
  right: CaravanResources,
): CaravanResources {
  return {
    wood: left.wood + right.wood,
    stone: left.stone + right.stone,
    iron: left.iron + right.iron,
  };
}

export function subtractCaravanResources(
  left: CaravanResources,
  right: CaravanResources,
): CaravanResources {
  return {
    wood: Math.max(0, left.wood - right.wood),
    stone: Math.max(0, left.stone - right.stone),
    iron: Math.max(0, left.iron - right.iron),
  };
}

export function parseCaravanResources(expedition: WithLoot): CaravanResources {
  if (expedition.loot === null) return emptyCaravanResources();
  return normalizeCaravanResources(
    parseCombatLoot(expedition.loot).resources ?? EMPTY,
  );
}
