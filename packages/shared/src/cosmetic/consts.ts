import type { CosmeticAwardKind, CosmeticSourceSignal } from "./types";

/** Final-ranking signal → cosmetic award kind (1:1). */
export const SIGNAL_TO_COSMETIC_AWARD_KIND: Record<
  CosmeticSourceSignal,
  CosmeticAwardKind
> = {
  POWER: "POWER_CHAMPION_TITLE",
  ASSAULT_GLORY: "ASSAULT_CHAMPION_TITLE",
  RAMPART_GLORY: "RAMPART_CHAMPION_TITLE",
};

/**
 * FR title prefix per kind. The full label is `${prefix} de ${worldDisplayName}`
 * (see {@link formatCosmeticAwardLabel}). Centralised here so backend and front
 * never drift on wording (spec 24 § Rewards).
 */
export const COSMETIC_AWARD_LABELS: Record<CosmeticAwardKind, string> = {
  POWER_CHAMPION_TITLE: "Vainqueur",
  ASSAULT_CHAMPION_TITLE: "Conquérant",
  RAMPART_CHAMPION_TITLE: "Sentinelle",
};

/** Short FR descriptor of what each title rewards (subtitles / tooltips). */
export const COSMETIC_AWARD_DESCRIPTIONS: Record<CosmeticAwardKind, string> = {
  POWER_CHAMPION_TITLE: "Puissance du royaume",
  ASSAULT_CHAMPION_TITLE: "Gloire d’assaut",
  RAMPART_CHAMPION_TITLE: "Gloire du rempart",
};

/** `Vainqueur de Aubeforge`, `Conquérant de Aubeforge`, `Sentinelle de Aubeforge`. */
export function formatCosmeticAwardLabel(
  kind: CosmeticAwardKind,
  worldDisplayName: string,
): string {
  return `${COSMETIC_AWARD_LABELS[kind]} de ${worldDisplayName}`;
}
