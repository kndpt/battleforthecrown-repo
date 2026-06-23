import { villageVisualTierFromCastleLevel } from "@battleforthecrown/shared/world";
import { villageSpriteAliasForEntity, type MapEntity } from "@/api/world-types";

export const BASE_PLAYER_SIZE = 56;
export const BASE_BARBARIAN_SIZE = 46;

export const WORLD_MIN_ZOOM = 0.4;
export const WORLD_MAX_ZOOM = 1;

export const ACTIVE_HALO_SCALE = 1.2;

const OWNED_HALO_RX_FACTOR: Record<number, number> = {
  1: 0.44,
  2: 0.49,
  3: 0.54,
  4: 0.57,
  5: 0.58,
  6: 0.6,
};

export const COLOR = {
  background: 0x6b8c3a,
  continentA: 0x7a9d44,
  continentAAlpha: 0.22,
  continentB: 0x5e7c30,
  continentBAlpha: 0.22,
  continentBorder: 0xf0d28c,
  continentBorderAlpha: 0.18,
  continentLabel: 0xf6d67b,
  grid: 0xfff3c8,
  grassBlade: 0x4a6322,
  treeCanopy: 0x3d5520,
  treeShadow: 0x29371a,
  myVillage: 0xf2d15c,
  myVillageStroke: 0xf6e7b1,
  ownVillageMarker: 0x4fb3d8,
  barbarianT1: 0xc69455,
  barbarianT2: 0xd0625c,
  barbarianT3: 0x9644a0,
  barbarianRingT1: 0xffe4b6,
  barbarianRingT2: 0xffccd2,
  barbarianRingT3: 0xeaccff,
  other: 0xc89664,
  outline: 0x000000,
  worldBorder: 0xffecbe,
  fogOverlay: 0x0c0804,
  capture: 0xf1c40f,
  captureDark: 0x7a4b00,
} as const;

export interface EntityStyle {
  color: number;
  ringColor: number;
  radius: number;
  zIndex: number;
}

export function spriteSizeFor(entity: MapEntity): number {
  if (entity.kind === "PLAYER_VILLAGE") {
    const tier = villageVisualTierFromCastleLevel(entity.castleLevel ?? 1);
    return Math.round(BASE_PLAYER_SIZE * Math.pow(1.1, tier - 1));
  }
  if (entity.kind === "BARBARIAN_VILLAGE") {
    const idx = entity.tier === "T3" ? 2 : entity.tier === "T2" ? 1 : 0;
    return Math.round(BASE_BARBARIAN_SIZE * Math.pow(1.1, idx));
  }
  return BASE_BARBARIAN_SIZE;
}

export function ownedHaloRxFactor(entity: MapEntity): number {
  const tier = villageVisualTierFromCastleLevel(entity.castleLevel ?? 1);
  return OWNED_HALO_RX_FACTOR[tier] ?? 0.6;
}

export function styleFor(entity: MapEntity): EntityStyle {
  if (entity.kind === "PLAYER_VILLAGE") {
    return {
      color: COLOR.myVillage,
      ringColor: COLOR.myVillageStroke,
      radius: 14,
      zIndex: entity.isMine ? 10 : 9,
    };
  }
  if (entity.kind === "BARBARIAN_VILLAGE") {
    const tier = entity.tier ?? "T1";
    const color =
      tier === "T3"
        ? COLOR.barbarianT3
        : tier === "T2"
          ? COLOR.barbarianT2
          : COLOR.barbarianT1;
    const ring =
      tier === "T3"
        ? COLOR.barbarianRingT3
        : tier === "T2"
          ? COLOR.barbarianRingT2
          : COLOR.barbarianRingT1;
    const radius = tier === "T3" ? 12 : tier === "T2" ? 11 : 10;
    return { color, ringColor: ring, radius, zIndex: 5 };
  }
  return { color: COLOR.other, ringColor: 0xffffff, radius: 9, zIndex: 3 };
}

export function aliasFor(entity: MapEntity): string | null {
  if (entity.isMine || entity.kind === "PLAYER_VILLAGE") {
    return villageSpriteAliasForEntity(entity);
  }
  if (entity.kind === "BARBARIAN_VILLAGE") {
    const tier = entity.tier ?? "T1";
    return `world.barbarian.${tier.toLowerCase()}`;
  }
  return null;
}
