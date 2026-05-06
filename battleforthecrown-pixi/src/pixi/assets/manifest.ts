import { Assets, type AssetsBundle } from 'pixi.js';
import { publicAsset } from '@/lib/publicAsset';

export const BUILDING_TEXTURE_KEYS = [
  'castle',
  'wood',
  'stone',
  'iron',
  'warehouse',
  'farm',
  'barracks',
  'watchtower',
] as const;

export type BuildingTextureKey = (typeof BUILDING_TEXTURE_KEYS)[number];

export const VILLAGE_BUNDLE: AssetsBundle = {
  name: 'village',
  assets: [
    { alias: 'castle', src: publicAsset('/assets/castle.png') },
    { alias: 'wood', src: publicAsset('/assets/resources/wood.png') },
    { alias: 'stone', src: publicAsset('/assets/stone.png') },
    { alias: 'iron', src: publicAsset('/assets/iron.png') },
    { alias: 'warehouse', src: publicAsset('/assets/warehouse.png') },
    { alias: 'farm', src: publicAsset('/assets/farm.png') },
    { alias: 'barracks', src: publicAsset('/assets/barracks.png') },
    { alias: 'watchtower', src: publicAsset('/assets/watchtower.png') },
  ],
};

export const WORLD_MAP_BUNDLE: AssetsBundle = {
  name: 'world-map',
  assets: [
    { alias: 'world.barbarian.t1', src: publicAsset('/assets/world/entity/barbarian-village-tier1.png') },
    { alias: 'world.barbarian.t2', src: publicAsset('/assets/world/entity/barbarian-village-tier2.png') },
    { alias: 'world.barbarian.t3', src: publicAsset('/assets/world/entity/barbarian-village-tier3.png') },
    { alias: 'world.village.t1', src: publicAsset('/assets/world/entity/village-tier1.png') },
    { alias: 'world.village.t2', src: publicAsset('/assets/world/entity/village-tier2.png') },
    { alias: 'world.village.t3', src: publicAsset('/assets/world/entity/village-tier3.png') },
    { alias: 'world.village.t4', src: publicAsset('/assets/world/entity/village-tier4.png') },
    { alias: 'world.village.t5', src: publicAsset('/assets/world/entity/village-tier5.png') },
    { alias: 'world.village.t6', src: publicAsset('/assets/world/entity/village-tier6.png') },
  ],
};

export const BOOT_BUNDLE: AssetsBundle = {
  name: 'boot',
  assets: [{ alias: 'banner', src: publicAsset('/assets/ui/banner.png') }],
};

export const PIXI_BUNDLES: AssetsBundle[] = [BOOT_BUNDLE, VILLAGE_BUNDLE, WORLD_MAP_BUNDLE];

let registered = false;

/**
 * Registers all bundles with the Pixi Assets manifest. Idempotent.
 * Call once at app startup so subsequent loadBundle calls work.
 */
export function registerPixiBundles(): void {
  if (registered) return;
  registered = true;
  Assets.init({
    manifest: {
      bundles: PIXI_BUNDLES,
    },
  });
}
