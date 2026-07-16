import {
  lootDistanceFactor,
  type LootDistanceConfig,
} from '@battleforthecrown/shared/logic';

/**
 * Vue dérivée pour l'affichage de la friction logistique par distance dans
 * `AttackDetailModal`. Le malus s'applique **uniquement au pillage/raid**
 * (mode attaque sans Noble) — jamais en renfort ni en conquête (Noble
 * sélectionné). Réutilise le helper shared `lootDistanceFactor` : source de
 * vérité unique partagée avec le backend server-authoritative (`loot.manager`).
 */
export interface AttackLootView {
  /** Le mode courant applique-t-il la friction distance (pillage/raid only). */
  isRaid: boolean;
  /** Facteur `[floor, 1]` appliqué à la capacité (1 hors raid ou config absente). */
  factor: number;
  /** Capacité de transport effective après malus (`Math.floor`). */
  effectiveCarryCapacity: number;
  /** Pourcentage de malus entier (0 si aucun). */
  malusPct: number;
  /** Afficher le badge / libellé de malus. */
  showMalus: boolean;
}

export function buildAttackLootView(params: {
  activeMode: 'attack' | 'scout' | 'reinforce';
  selectedNobleCount: number;
  distance: number;
  totalCarryCapacity: number;
  lootDistance: LootDistanceConfig | undefined;
}): AttackLootView {
  const {
    activeMode,
    selectedNobleCount,
    distance,
    totalCarryCapacity,
    lootDistance,
  } = params;

  // Pillage/raid = attaque sans Noble. Conquête (Noble) et renfort exemptés,
  // en miroir du gating backend (`context.config._isConquest`).
  const isRaid = activeMode === 'attack' && selectedNobleCount === 0;
  const factor =
    isRaid && lootDistance ? lootDistanceFactor(distance, lootDistance) : 1;
  // `Math.floor` aligné sur le backend et `getCaravanResourceCapacity`.
  const effectiveCarryCapacity = Math.floor(totalCarryCapacity * factor);
  const malusPct = Math.round((1 - factor) * 100);
  // Ne pas afficher un malus arrondi à « −0 % » : négligeable juste au-delà du
  // rayon (le backend applique tout de même la micro-réduction canonique).
  const showMalus = isRaid && malusPct >= 1 && totalCarryCapacity > 0;

  return { isRaid, factor, effectiveCarryCapacity, malusPct, showMalus };
}
