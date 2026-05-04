import {
  entityFromMyVillage,
  entityFromWorldDto,
  type MapEntity,
  type WorldEntityDto,
  type WorldVillageDto,
} from '@/api/world-types';

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
