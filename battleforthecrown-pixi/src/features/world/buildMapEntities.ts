import {
  entityFromMyVillage,
  entityFromWorldDto,
  type MapEntity,
  type WorldEntityDto,
  type WorldVillageDto,
} from '@/api/world-types';
import { WATCHTOWER_VISION_LEVELS } from '@battleforthecrown/shared/village/buildings';

/**
 * Merge the worldEntities feed (barbarians + foreign players) with the user's
 * own villages list. Player villages from `/village?worldId&userId` always win
 * over their `WorldEntity` counterpart so we mark them as `isMine: true`.
 */
export function buildMapEntities(
  worldEntities: WorldEntityDto[],
  myVillages: WorldVillageDto[],
  myUserId: string | null,
): MapEntity[] {
  const result = new Map<string, MapEntity>();
  for (const dto of worldEntities) {
    result.set(dto.id, entityFromWorldDto(dto, myUserId));
  }
  for (const village of myVillages) {
    result.set(village.id, entityFromMyVillage(village, myUserId));
  }
  return Array.from(result.values());
}

/**
 * Restricts the visible entity feed to those within the watchtower's vision
 * radius from the player's own village. Mirrors the legacy fog-of-war: at level
 * 0 the player only sees their own villages; at level 10 the radius becomes
 * `null` (unlimited) so we return the full set.
 *
 * Always keeps `isMine` entities in the feed, even when out of range.
 */
export function filterEntitiesByVision(
  entities: MapEntity[],
  watchtowerLevel: number,
): MapEntity[] {
  const vision = WATCHTOWER_VISION_LEVELS[watchtowerLevel];
  // Unlimited vision (level 10).
  if (!vision || vision.visibilityRadius === null) {
    return entities;
  }
  // Watchtower not built or destroyed → only own villages are visible.
  if (vision.visibilityRadius === 0) {
    return entities.filter((e) => e.isMine);
  }

  const ownVillages = entities.filter((e) => e.isMine);
  if (ownVillages.length === 0) return entities;

  const radius = vision.visibilityRadius;
  return entities.filter((e) => {
    if (e.isMine) return true;
    return ownVillages.some((mine) => {
      const dx = mine.x - e.x;
      const dy = mine.y - e.y;
      return dx * dx + dy * dy <= radius * radius;
    });
  });
}
