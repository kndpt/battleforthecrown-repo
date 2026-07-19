import {
  NATURAL_TRAIT_POPULATION_BONUS,
  type StrategyBonus,
  type VillageNaturalTrait,
} from '@battleforthecrown/shared/village';

/**
 * Population max ajustée : facteur strategy (`populationBonus`) × facteur trait
 * naturel (`FERTILE_SOIL`), tous deux plats et indépendants du niveau de
 * bâtiment. **Un seul `Math.floor` final** (composer les facteurs, jamais les
 * arrondis) pour éviter un arrondi divergent entre les callers. `naturalTrait`
 * absent/neutre → facteur 1. Cf. `docs/gameplay/27-village-natural-traits.md`.
 */
export function applyPopulationBonus(
  baseMax: number,
  strategyBonus: Pick<StrategyBonus, 'populationBonus'> | null | undefined,
  naturalTrait?: VillageNaturalTrait | null,
): number {
  const strategyMultiplier =
    typeof strategyBonus?.populationBonus === 'number' &&
    strategyBonus.populationBonus > 0
      ? strategyBonus.populationBonus
      : 1;
  const traitMultiplier = naturalTrait
    ? NATURAL_TRAIT_POPULATION_BONUS[naturalTrait]
    : 1;
  return Math.floor(baseMax * strategyMultiplier * traitMultiplier);
}
