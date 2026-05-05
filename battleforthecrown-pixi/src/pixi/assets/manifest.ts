import { Assets, type AssetsBundle } from 'pixi.js';

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
    { alias: 'castle', src: '/assets/castle.png' },
    { alias: 'wood', src: '/assets/resources/wood.png' },
    { alias: 'stone', src: '/assets/stone.png' },
    { alias: 'iron', src: '/assets/iron.png' },
    { alias: 'warehouse', src: '/assets/warehouse.png' },
    { alias: 'farm', src: '/assets/farm.png' },
    { alias: 'barracks', src: '/assets/barracks.png' },
    { alias: 'watchtower', src: '/assets/watchtower.png' },
  ],
};

export const WORLD_MAP_BUNDLE: AssetsBundle = {
  name: 'world-map',
  assets: [
    { alias: 'world.barbarian.t1', src: '/assets/world/entity/barbarian-village-tier1.png' },
    { alias: 'world.barbarian.t2', src: '/assets/world/entity/barbarian-village-tier2.png' },
    { alias: 'world.barbarian.t3', src: '/assets/world/entity/barbarian-village-tier3.png' },
    { alias: 'world.village.t1', src: '/assets/world/entity/village-tier1.png' },
    { alias: 'world.village.t2', src: '/assets/world/entity/village-tier2.png' },
    { alias: 'world.village.t3', src: '/assets/world/entity/village-tier3.png' },
    { alias: 'world.village.t4', src: '/assets/world/entity/village-tier4.png' },
    { alias: 'world.village.t5', src: '/assets/world/entity/village-tier5.png' },
    { alias: 'world.village.t6', src: '/assets/world/entity/village-tier6.png' },
  ],
};

export const BOOT_BUNDLE: AssetsBundle = {
  name: 'boot',
  assets: [{ alias: 'banner', src: '/assets/ui/banner.png' }],
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
