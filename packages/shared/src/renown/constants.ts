/**
 * Renommée de compte (account renown) — constantes d'équilibrage.
 *
 * Couche méta cross-monde, cosmétique uniquement (zéro effet in-world).
 * Spec : docs/gameplay/25-account-renown.md.
 *
 * Toutes les valeurs sont des defaults paramétrables.
 */

/** Multiplicateur de la XP de construction : `poids × niveau × FACTOR`. */
export const RENOWN_CONSTRUCTION_FACTOR = 1;

/** XP de base d'une conquête de village joueur (PvP). */
export const RENOWN_CONQUEST_BASE = 500;

/**
 * Facteur appliqué à la XP de conquête quand la cible est barbare.
 * Barbare = `RENOWN_CONQUEST_BASE × RENOWN_BARBARIAN_CONQUEST_FACTOR`.
 */
export const RENOWN_BARBARIAN_CONQUEST_FACTOR = 1 / 3;

/**
 * Multiplicateur de la XP de combat, appliqué sur `GloryLedger.points`
 * (déjà anti-farmé en run 051 — réutilisation, jamais recalcul).
 */
export const RENOWN_COMBAT_FACTOR = 1;

/** Base de la courbe de niveau : `xpForLevel(L) = BASE × L × (L − 1)`. */
export const RENOWN_LEVEL_BASE = 250;

/**
 * Bonus de Renommée crédité à la fin d'un monde (`LOCKED→ENDED`),
 * par palier de classement, **crédité par signal** (POWER / ASSAULT / RAMPART).
 */
export const RENOWN_RANKING_BONUS = Object.freeze({
  top1: 5_000,
  top10: 2_000,
  top100: 500,
  participation: 100,
});

/** Sources de XP de Renommée (miroir de l'enum Prisma `RenownSource`). */
export const RENOWN_SOURCES = Object.freeze([
  'CONSTRUCTION',
  'CONQUEST',
  'COMBAT',
  'RANKING_BONUS',
] as const);

export type RenownSource = (typeof RENOWN_SOURCES)[number];
