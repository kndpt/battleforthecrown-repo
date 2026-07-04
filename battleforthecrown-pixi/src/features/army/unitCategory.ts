import type { UnitType } from '@battleforthecrown/shared/army';

/**
 * Catégorie visuelle d'une unité. Source **unique** pilotant la couleur de
 * tuile partout (écran Caserne, panneau carte, rapports). Ne pas dupliquer.
 */
export type UnitCategory = 'Infanterie' | 'Tireur' | 'Cavalerie' | 'Spécial' | 'Élite' | 'Siège';

export interface CategoryTheme {
  /** Haut du dégradé de tuile. */ light: string;
  /** Bas du dégradé de tuile. */ dark: string;
  /** Bordure de tuile. */ border: string;
  /** Couleur d'encre sur la tuile. */ ink: string;
}

/** Unité backend → catégorie visuelle. */
export const UNIT_CATEGORY: Record<UnitType, UnitCategory> = {
  MILITIA: 'Infanterie',
  SQUIRE: 'Infanterie',
  WARRIOR: 'Infanterie',
  ARCHER: 'Tireur',
  CAVALRY: 'Cavalerie',
  TEMPLAR: 'Élite',
  NOBLE: 'Élite',
  SPY: 'Spécial',
  CATAPULT: 'Siège',
  RAM: 'Siège',
};

/**
 * Catégorie → palette de tuile. Hex littéraux (pas de CSS var) pour rester
 * valables hors du scope de variables, ex. les `style` inline du panneau carte.
 * L'espion (`Spécial`) partage volontairement le gris de `Siège` : troupe
 * utilitaire hors combat.
 */
export const CATEGORY_THEME: Record<UnitCategory, CategoryTheme> = {
  Infanterie: { light: '#a67c52', dark: '#5d4a32', border: '#3c2619', ink: '#fff' },
  Tireur: { light: '#5b9bd5', dark: '#2e75b6', border: '#1f5288', ink: '#fff' },
  Cavalerie: { light: '#6ebf49', dark: '#4a8c2a', border: '#3a6c1f', ink: '#fff' },
  Spécial: { light: '#95a5a6', dark: '#7f8c8d', border: '#5d6d6e', ink: '#fff' },
  Élite: { light: '#f6d57b', dark: '#d4a017', border: '#9e7b0d', ink: '#3a2a00' },
  Siège: { light: '#95a5a6', dark: '#7f8c8d', border: '#5d6d6e', ink: '#fff' },
};

export function unitCategoryFor(unitType: string): UnitCategory {
  return UNIT_CATEGORY[unitType as UnitType] ?? 'Infanterie';
}
