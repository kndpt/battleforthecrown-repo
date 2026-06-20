import {
  isFoggedEntity,
  normalizeTier,
  villageVisualTierFromCastleLevel,
  type WorldTier,
  type WorldEntityFogged,
  type WorldEntityResponse,
  type WorldVillageDto,
} from "@battleforthecrown/shared/world";
import { VILLAGE_LABEL_DISPLAY, type VillageLabel } from "@battleforthecrown/shared/village";
import { clampBuildingLevel } from "@battleforthecrown/shared/utils";

export {
  isFoggedEntity,
  type WorldEntityKind,
  type WorldEntityDto,
  type WorldEntityFogged,
  type WorldEntityResponse,
  type WorldEntitiesResponse,
  type WorldVillageDto,
} from "@battleforthecrown/shared/world";

/** Domain entity used by the WorldMap scene. Already normalized between
 *  the entities feed (barbarians, etc.) and the player villages feed.
 *  `'fogged'` represents an entity outside the player's vision — only
 *  position is known, no owner / kind / name. */
export interface MapEntity {
  id: string;
  kind: "PLAYER_VILLAGE" | "BARBARIAN_VILLAGE" | "OTHER" | "fogged";
  ownerId?: string;
  ownerDisplayName?: string;
  isMine: boolean;
  x: number;
  y: number;
  name: string;
  tier: WorldTier | null;
  castleLevel?: number | null;
  label?: VillageLabel | null;
  isCapital?: boolean;
  captureWindow?: {
    status: "OPEN";
    pendingConquestId: string;
    attackerVillageId: string;
    captureUntil: string;
  };
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
  const ownerDisplayName =
    typeof dto.data.ownerDisplayName === "string"
      ? dto.data.ownerDisplayName
      : undefined;
  return {
    id: dto.id,
    kind,
    ownerId,
    ownerDisplayName,
    isMine: !!myUserId && ownerId === myUserId,
    x: dto.x,
    y: dto.y,
    name:
      typeof dto.data.name === "string" ? dto.data.name : dto.id.slice(0, 6),
    tier: normalizeTier(dto.data.tier),
    castleLevel: normalizeCastleLevel(dto.data.castleLevel),
    label: ownerId === myUserId ? normalizeVillageLabel(dto.data.label) : undefined,
    isCapital: ownerId === myUserId ? dto.data.isCapital === true : undefined,
    captureWindow: normalizeCaptureWindow(dto.data.captureWindow),
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
    castleLevel: null,
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
    castleLevel: normalizeCastleLevel(dto.castleLevel),
    label: dto.label ?? null,
    isCapital: dto.isCapital ?? false,
  };
}

export function villageSpriteAliasForEntity(entity: MapEntity): string {
  const tier = villageVisualTierFromCastleLevel(entity.castleLevel ?? 1);
  return `world.village.t${tier}`;
}

export function villageImageSrcForVisualTier(tier: number): string {
  const clamped = Math.min(6, Math.max(1, Math.round(tier))) as 1 | 2 | 3 | 4 | 5 | 6;
  return `/assets/world/entity/village-tier${clamped}.png`;
}

function normalizeCaptureWindow(value: unknown): MapEntity["captureWindow"] {
  if (!value || typeof value !== "object") return undefined;
  const data = value as Record<string, unknown>;
  if (
    data.status !== "OPEN" ||
    typeof data.pendingConquestId !== "string" ||
    typeof data.attackerVillageId !== "string" ||
    typeof data.captureUntil !== "string"
  ) {
    return undefined;
  }

  return {
    status: "OPEN",
    pendingConquestId: data.pendingConquestId,
    attackerVillageId: data.attackerVillageId,
    captureUntil: data.captureUntil,
  };
}

function normalizeVillageLabel(value: unknown): VillageLabel | null {
  return typeof value === "string" && value in VILLAGE_LABEL_DISPLAY
    ? (value as VillageLabel)
    : null;
}

function normalizeCastleLevel(value: unknown): number | null {
  if (!Number.isFinite(value)) return null;
  return clampBuildingLevel(value as number);
}
