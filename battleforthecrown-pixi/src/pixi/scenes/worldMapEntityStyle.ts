import {
  villageVisualTierFromCastleLevel,
  type WorldTier,
} from "@battleforthecrown/shared/world";
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
  barbarianT4: 0xb0402a,
  barbarianT5: 0x7a2414,
  barbarianRingT1: 0xffe4b6,
  barbarianRingT2: 0xffccd2,
  barbarianRingT3: 0xeaccff,
  barbarianRingT4: 0xf2b15a,
  barbarianRingT5: 0xffd166,
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

const BARBARIAN_TIER_ORDER: readonly WorldTier[] = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
];

const BARBARIAN_TIER_COLOR: readonly number[] = [
  COLOR.barbarianT1,
  COLOR.barbarianT2,
  COLOR.barbarianT3,
  COLOR.barbarianT4,
  COLOR.barbarianT5,
];

const BARBARIAN_TIER_RING: readonly number[] = [
  COLOR.barbarianRingT1,
  COLOR.barbarianRingT2,
  COLOR.barbarianRingT3,
  COLOR.barbarianRingT4,
  COLOR.barbarianRingT5,
];

/** Maps a barbarian tier (`T1..T5`) to its progression index `0..4`. */
export function barbarianTierIndex(tier: WorldTier | null | undefined): number {
  if (!tier) return 0;
  const idx = BARBARIAN_TIER_ORDER.indexOf(tier);
  return idx === -1 ? 0 : idx;
}

export function spriteSizeFor(entity: MapEntity): number {
  if (entity.kind === "PLAYER_VILLAGE") {
    const tier = villageVisualTierFromCastleLevel(entity.castleLevel ?? 1);
    return Math.round(BASE_PLAYER_SIZE * Math.pow(1.1, tier - 1));
  }
  if (entity.kind === "BARBARIAN_VILLAGE") {
    const idx = barbarianTierIndex(entity.tier);
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
    const idx = barbarianTierIndex(entity.tier);
    return {
      color: BARBARIAN_TIER_COLOR[idx],
      ringColor: BARBARIAN_TIER_RING[idx],
      radius: 10 + idx,
      zIndex: 5,
    };
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
