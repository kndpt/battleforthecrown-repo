/**
 * Friction logistique par distance appliquée à la **capacité de pillage**
 * (raid uniquement). Au-delà d'un rayon, la capacité de transport effective du
 * butin décroît linéairement jusqu'à un plateau plancher — jamais nul. Objectif
 * gameplay : renforcer les fronts locaux et limiter la projection globale des
 * pillages des top players, sans cap dur (cf. `docs/gameplay/28-distance-loot-friction.md`).
 *
 * Source de vérité unique réutilisée par le backend server-authoritative
 * (`loot.manager`) ET le front (`AttackDetailModal`, pré-affichage du malus).
 *
 * Le gating pillage-seul vit chez l'appelant : renfort et conquête (armée
 * partie avec un Noble) **n'appliquent jamais** ce facteur.
 */
export type LootDistanceConfig = {
  /** Rayon (tuiles) sous lequel aucun malus ne s'applique (facteur = 1). */
  radius: number;
  /** Perte de facteur par tuile au-delà du rayon (décroissance linéaire). */
  slope: number;
  /** Plancher du facteur : plateau minimal, strictement > 0. */
  floor: number;
};

/**
 * Facteur multiplicatif dans `[floor, 1]` appliqué à la capacité de pillage en
 * fonction de la distance **brute** attaquant→cible.
 *
 * - `d ≤ radius`            → `1` exactement (aucun malus, non-régression).
 * - `radius < d < plateau`  → décroissance linéaire **strictement** monotone.
 * - `d ≥ plateau`           → `floor` (jamais `< floor`, jamais `0` tant que `floor > 0`).
 *
 * L'arrondi de capacité (`Math.floor(capacity × factor)`) est laissé à
 * l'appelant, aligné sur `getCaravanResourceCapacity`.
 */
export function lootDistanceFactor(
  distance: number,
  cfg: LootDistanceConfig,
): number {
  if (distance <= cfg.radius) return 1;
  const decayed = 1 - cfg.slope * (distance - cfg.radius);
  return Math.max(cfg.floor, decayed);
}
