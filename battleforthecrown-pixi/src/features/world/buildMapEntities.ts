import {
  entityFromMyVillage,
  entityFromWorldDto,
  type MapEntity,
  type WorldEntityResponse,
  type WorldVillageDto,
} from '@/api/world-types';
import { isPointInAnyVisionDisk, type VisionDisk } from '@battleforthecrown/shared/world';

/**
 * Merge the worldEntities feed (barbarians + foreign players, possibly fogged)
 * with the user's own villages list. Player villages from
 * `/village?worldId&userId` always win over their `WorldEntity` counterpart so
 * we mark them as `isMine: true`.
 */
export function buildMapEntities(
  worldEntities: WorldEntityResponse[],
  myVillages: WorldVillageDto[],
  myUserId: string | null,
): MapEntity[] {
  const result = new Map<string, MapEntity>();
  for (const dto of worldEntities) {
    result.set(dto.id, entityFromWorldDto(dto, myUserId));
  }
  for (const village of myVillages) {
    const worldEntity = result.get(village.id);
    result.set(village.id, {
      ...entityFromMyVillage(village, myUserId),
      captureWindow: worldEntity?.captureWindow,
      newbieShield: worldEntity?.newbieShield,
    });
  }
  return Array.from(result.values());
}

/**
 * Restricts the visible entity feed to the authoritative vision disks returned
 * by the backend. At level 0 the player only sees their own villages.
 *
 * Always keeps `isMine` entities in the feed, even when out of range.
 */
export function filterEntitiesByVision(
  entities: MapEntity[],
  visionDisks: readonly VisionDisk[],
  fogOfWarEnabled = true,
): MapEntity[] {
  if (!fogOfWarEnabled) return entities;
  if (visionDisks.length === 0) {
    return entities.filter((e) => e.isMine);
  }

  // Fogged entities come pre-filtered by the server — never drop them here.
  return entities.filter(
    (e) => e.isMine || e.kind === 'fogged' || isPointInAnyVisionDisk(e, visionDisks),
  );
}
