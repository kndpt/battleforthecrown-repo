/**
 * Renommée — courbe de niveau (fonctions pures).
 *
 * Seuil cumulé pour atteindre le niveau L (niveau 1 = 0 XP) :
 *   xpForLevel(L) = RENOWN_LEVEL_BASE × L × (L − 1)
 *
 * Spec : docs/gameplay/25-account-renown.md §4.
 */
import { z } from 'zod';
import { getBuildingPowerWeight } from '../power/weights';
import {
  RENOWN_BARBARIAN_CONQUEST_FACTOR,
  RENOWN_COMBAT_FACTOR,
  RENOWN_CONQUEST_BASE,
  RENOWN_CONSTRUCTION_FACTOR,
  RENOWN_LEVEL_BASE,
} from './constants';

/** XP cumulée requise pour atteindre `level` (level ≥ 1, level 1 = 0). */
export const xpForLevel = (level: number): number => {
  const clamped = Math.max(1, Math.floor(level));
  return RENOWN_LEVEL_BASE * clamped * (clamped - 1);
};

/** Plus grand niveau L tel que `xpForLevel(L) ≤ xp`. Toujours ≥ 1. */
export const renownLevelForXp = (xp: number): number => {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  // Inverse de BASE·L·(L−1) = xp → L = (1 + √(1 + 4·xp/BASE)) / 2.
  const approx = Math.floor((1 + Math.sqrt(1 + (4 * xp) / RENOWN_LEVEL_BASE)) / 2);
  let level = Math.max(1, approx);
  // Corrige d'éventuelles imprécisions flottantes aux bords.
  while (xpForLevel(level + 1) <= xp) level += 1;
  while (level > 1 && xpForLevel(level) > xp) level -= 1;
  return level;
};

const intNN = z.number().int().nonnegative();

export const RenownStatusSchema = z.object({
  xp: intNN,
  level: intNN,
  currentLevelXp: intNN,
  nextLevelXp: intNN,
  xpIntoLevel: intNN,
  xpForNextLevel: intNN,
});

export type RenownStatus = z.infer<typeof RenownStatusSchema>;

/** Dérive le statut complet de Renommée depuis l'XP cumulée. */
export const renownStatusForXp = (xp: number): RenownStatus => {
  const safeXp = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  const level = renownLevelForXp(safeXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  return {
    xp: safeXp,
    level,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel: safeXp - currentLevelXp,
    xpForNextLevel: nextLevelXp - currentLevelXp,
  };
};

/** XP de construction pour un bâtiment de type `type` complété au niveau `level`. */
export const renownConstructionXp = (type: string, level: number): number =>
  Math.round(
    getBuildingPowerWeight(type) *
      Math.max(0, Math.floor(level)) *
      RENOWN_CONSTRUCTION_FACTOR,
  );

/** XP de conquête. `isBarbarian` applique le facteur barbare. */
export const renownConquestXp = (isBarbarian: boolean): number =>
  Math.round(
    RENOWN_CONQUEST_BASE *
      (isBarbarian ? RENOWN_BARBARIAN_CONQUEST_FACTOR : 1),
  );

/** XP de combat dérivée des points de Gloire déjà anti-farmés. */
export const renownCombatXp = (gloryPoints: number): number =>
  Math.max(0, Math.round(gloryPoints * RENOWN_COMBAT_FACTOR));
