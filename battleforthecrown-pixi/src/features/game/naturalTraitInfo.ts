import { publicAsset } from '@/lib/publicAsset';
import {
  NATURAL_TRAIT_DISPLAY,
  NATURAL_TRAIT_PRODUCTION_BONUS,
  type VillageNaturalTrait,
} from '@battleforthecrown/shared/village';
import type { ResourceType } from '@battleforthecrown/shared/resources';

/**
 * Mapping trait naturel → slug d'asset. Vit côté front (pas dans
 * `packages/shared`, qui est aussi consommé backend et ne porte pas de
 * chemins d'assets). Cf. `docs/gameplay/27-village-natural-traits.md` § Assets.
 */
const NATURAL_TRAIT_ASSET_SLUG: Record<VillageNaturalTrait, string> = {
  DENSE_FOREST: 'dense-forest',
  RICH_QUARRY: 'rich-quarry',
  IRON_VEIN: 'iron-vein',
  PLAINS: 'plains',
};

const RESOURCE_LABELS: Record<ResourceType, string> = {
  WOOD: 'Bois',
  STONE: 'Pierre',
  IRON: 'Fer',
};

/** Chemin public (non résolu par `publicAsset`) de l'icône du trait. */
export function iconAsset(trait: VillageNaturalTrait): string {
  return `/assets/natural-traits/${NATURAL_TRAIT_ASSET_SLUG[trait]}.webp`;
}

/**
 * Label du bonus de production, ex "+10 % Bois". `PLAINS` (ou tout trait sans
 * ressource boostée / facteur défini) → "Aucun bonus".
 *
 * Source unique de la logique bonus/label (badge + modal) — plus de
 * duplication avec `scoutReportView.ts`.
 */
export function naturalTraitBonusLabel(trait: VillageNaturalTrait): string {
  const display = NATURAL_TRAIT_DISPLAY[trait];
  const boosted = display.boostedResource;
  const factor = boosted ? NATURAL_TRAIT_PRODUCTION_BONUS[trait][boosted] : undefined;
  if (!boosted || !factor) return 'Aucun bonus';
  return `+${Math.round((factor - 1) * 100)} % ${RESOURCE_LABELS[boosted]}`;
}

export interface NaturalTraitInfo {
  boostedResourceLabel: string | null;
  bonusLabel: string;
  iconAsset: string;
  label: string;
  trait: VillageNaturalTrait;
}

/** Objet unique consommé par `NaturalTraitBadge` + `NaturalTraitModal`. */
export function naturalTraitInfo(trait: VillageNaturalTrait): NaturalTraitInfo {
  const display = NATURAL_TRAIT_DISPLAY[trait];
  return {
    boostedResourceLabel: display.boostedResource
      ? RESOURCE_LABELS[display.boostedResource]
      : null,
    bonusLabel: naturalTraitBonusLabel(trait),
    iconAsset: publicAsset(iconAsset(trait)),
    label: display.label,
    trait,
  };
}
