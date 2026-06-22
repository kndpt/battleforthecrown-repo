import type { UnitType } from "../army/types";
import type { UnitMap } from "../army/unit-map";
import {
  BATTLE_UNIT_VALUES,
  GLORY_OPPONENT_MULTIPLIER,
  GLORY_PAIR_24H_THRESHOLDS,
} from "./consts";

export function getBattleUnitValue(unitType: string): number {
  return BATTLE_UNIT_VALUES[unitType as UnitType] ?? 0;
}

export function calculateRawBattleValue(losses: UnitMap): number {
  return Object.entries(losses).reduce((sum, [unitType, quantity]) => {
    if (!Number.isFinite(quantity) || quantity <= 0) return sum;
    return sum + getBattleUnitValue(unitType) * quantity;
  }, 0);
}

export function calculateOpponentMultiplier(
  scorerPower: number,
  opponentPower: number,
): number {
  if (scorerPower <= 0 || opponentPower <= 0) return 1;
  const ratio = opponentPower / scorerPower;
  return Math.min(
    GLORY_OPPONENT_MULTIPLIER.max,
    Math.max(GLORY_OPPONENT_MULTIPLIER.min, ratio),
  );
}

export function applyPairDiminishingReturns(
  rawPoints: number,
  previousPairRawPoints24h: number,
): number {
  if (rawPoints <= 0) return 0;

  let remaining = rawPoints;
  let cursor = Math.max(0, previousPairRawPoints24h);
  let effective = 0;

  const fullRoom = Math.max(0, GLORY_PAIR_24H_THRESHOLDS.full - cursor);
  const fullPoints = Math.min(remaining, fullRoom);
  effective += fullPoints;
  remaining -= fullPoints;
  cursor += fullPoints;

  const halfRoom = Math.max(0, GLORY_PAIR_24H_THRESHOLDS.half - cursor);
  const halfPoints = Math.min(remaining, halfRoom);
  effective += halfPoints * 0.5;
  remaining -= halfPoints;

  effective += remaining * 0.2;
  return Math.floor(effective);
}

export function splitPointsByWeights<T extends string>(
  totalPoints: number,
  weights: { id: T; weight: number }[],
): { id: T; points: number }[] {
  const safeTotal = Math.max(0, Math.floor(totalPoints));
  if (safeTotal <= 0) return [];

  const grouped = new Map<T, number>();
  for (const item of weights) {
    if (!Number.isFinite(item.weight) || item.weight <= 0) continue;
    grouped.set(item.id, (grouped.get(item.id) ?? 0) + item.weight);
  }

  const entries = [...grouped.entries()].map(([id, weight]) => ({ id, weight }));
  const totalWeight = entries.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return [];

  const split = entries.map((item) => {
    const exact = (safeTotal * item.weight) / totalWeight;
    const points = Math.floor(exact);
    return { id: item.id, points, remainder: exact - points };
  });

  let remaining = safeTotal - split.reduce((sum, item) => sum + item.points, 0);
  for (const item of [...split].sort((a, b) => b.remainder - a.remainder)) {
    if (remaining <= 0) break;
    item.points += 1;
    remaining -= 1;
  }

  return split
    .filter((item) => item.points > 0)
    .map(({ id, points }) => ({ id, points }));
}
