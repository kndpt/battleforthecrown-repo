import type { UnitType } from "../army/types";
import type { UnitMap } from "../army/unit-map";

export const RANKING_SIGNAL_LABELS = Object.freeze({
  POWER: "Puissance du Royaume",
  ASSAULT_GLORY: "Gloire d'Assaut",
  RAMPART_GLORY: "Gloire du Rempart",
});

export type RankingSignal = keyof typeof RANKING_SIGNAL_LABELS;
export type GlorySignal = Exclude<RankingSignal, "POWER">;

export const BATTLE_UNIT_VALUES = Object.freeze({
  MILITIA: 2,
  SQUIRE: 8,
  WARRIOR: 12,
  ARCHER: 6,
  TEMPLAR: 12,
  CAVALRY: 15,
  SPY: 10,
  RAM: 30,
  CATAPULT: 40,
  NOBLE: 400,
} satisfies Record<UnitType, number>);

export const GLORY_OPPONENT_MULTIPLIER = Object.freeze({
  min: 0.35,
  max: 1.25,
});

export const GLORY_PAIR_24H_THRESHOLDS = Object.freeze({
  full: 2_000,
  half: 5_000,
});

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

export interface RankingsLeaderboardEntry {
  rank: number;
  userId: string;
  playerName: string;
  score: number;
  villageCount?: number;
}

export interface RankingsLeaderboardResponse {
  worldId: string;
  signal: RankingSignal;
  period: "LIVE" | "WEEKLY" | "ALL_TIME";
  label: string;
  entries: RankingsLeaderboardEntry[];
}
