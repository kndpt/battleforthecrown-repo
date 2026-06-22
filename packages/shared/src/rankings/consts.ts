import type { UnitType } from "../army/types";

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
