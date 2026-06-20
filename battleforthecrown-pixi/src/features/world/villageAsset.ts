import { villageVisualTierFromCastleLevel } from '@battleforthecrown/shared/world';
import { publicAsset } from '@/lib/publicAsset';

/**
 * Resolve the village sprite asset (the one rendered on the world map) from a
 * castle-level snapshot. React equivalent of the Pixi `villageSpriteAliasForEntity`
 * path: castle level → visual tier → `village-tier{tier}.png`.
 *
 * Falls back to tier 1 when the castle level is unknown (`null`).
 * `villageVisualTierFromCastleLevel` clamps the level internally.
 */
export function villageAssetSrcFromCastleLevel(
  castleLevel: number | null,
): string {
  const tier = villageVisualTierFromCastleLevel(castleLevel ?? 1);
  return publicAsset(`/assets/world/entity/village-tier${tier}.png`);
}
