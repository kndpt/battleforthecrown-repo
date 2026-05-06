import {
  normalizeTier,
  type WorldEntityFogged,
  type WorldEntityResponse,
  type WorldVillageDto,
} from "@battleforthecrown/shared/world";

export type {
  WorldEntityKind,
  WorldEntityDto,
  WorldEntityFogged,
  WorldEntityResponse,
  WorldVillageDto,
} from "@battleforthecrown/shared/world";

export function isFoggedEntity(
  entity: WorldEntityResponse,
): entity is WorldEntityFogged {
  return entity.kind === "fogged";
}

/** Domain entity used by the WorldMap scene. Already normalized between
 *  the entities feed (barbarians, etc.) and the player villages feed.
 *  `'fogged'` represents an entity outside the player's vision — only
 *  position is known, no owner / kind / name. */
export interface MapEntity {
  id: string;
  kind: "PLAYER_VILLAGE" | "BARBARIAN_VILLAGE" | "OTHER" | "fogged";
  ownerId?: string;
  isMine: boolean;
  x: number;
  y: number;
  name: string;
  tier: "T1" | "T2" | "T3" | null;
}

export function entityFromWorldDto(
  dto: WorldEntityResponse,
  myUserId: string | null,
): MapEntity {
  if (isFoggedEntity(dto)) return entityFromFoggedDto(dto);
  const kind: MapEntity["kind"] =
    dto.kind === "PLAYER_VILLAGE"
      ? "PLAYER_VILLAGE"
      : dto.kind === "BARBARIAN_VILLAGE"
        ? "BARBARIAN_VILLAGE"
        : "OTHER";
  const ownerId =
    typeof dto.data.userId === "string" ? dto.data.userId : undefined;
  return {
    id: dto.id,
    kind,
    ownerId,
    isMine: !!myUserId && ownerId === myUserId,
    x: dto.x,
    y: dto.y,
    name:
      typeof dto.data.name === "string" ? dto.data.name : dto.id.slice(0, 6),
    tier: normalizeTier(dto.data.tier),
  };
}

export function entityFromFoggedDto(dto: WorldEntityFogged): MapEntity {
  return {
    id: dto.id,
    kind: "fogged",
    isMine: false,
    x: dto.x,
    y: dto.y,
    name: "",
    tier: null,
  };
}

export function entityFromMyVillage(
  dto: WorldVillageDto,
  myUserId: string | null,
): MapEntity {
  return {
    id: dto.id,
    kind: "PLAYER_VILLAGE",
    ownerId: dto.userId ?? myUserId ?? undefined,
    isMine: true,
    x: dto.x,
    y: dto.y,
    name: dto.name,
    tier: null,
  };
}
