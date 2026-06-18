import { clampBuildingLevel } from "../utils/level";

// Diviseur de durée appliqué à TOUTE construction du village, selon le niveau
// actuel du Château (cf. building-cost.ts). Courbe géométrique 1.0 -> 0.25 :
// le multiplicateur ressenti par le joueur passe de ×1.0 (niv1) à ×4.0 (niv10).
// Calibrée pour un max-village ~7-8 j wall-clock (cf. ADR-15, validée au
// build-simulator). Monter le Château devient le levier central de vitesse.
export const CASTLE_CONSTRUCTION_SPEED_BONUS: Record<number, number> = {
  1: 1.0, // ×1.00
  2: 0.86, // ×1.16
  3: 0.74, // ×1.35
  4: 0.63, // ×1.59
  5: 0.54, // ×1.85
  6: 0.46, // ×2.17
  7: 0.4, // ×2.50
  8: 0.34, // ×2.94
  9: 0.29, // ×3.45
  10: 0.25, // ×4.00
};

export const BARRACKS_TRAINING_SPEED_MULTIPLIER: Record<number, number> = {
  1: 1.0,
  2: 1.04,
  3: 1.08,
  4: 1.12,
  5: 1.16,
  6: 1.2,
  7: 1.24,
  8: 1.28,
  9: 1.32,
  10: 1.36,
};

export const getBarracksTrainingSpeedMultiplier = (level: number): number => {
  return BARRACKS_TRAINING_SPEED_MULTIPLIER[clampBuildingLevel(level)] ?? 1;
};
