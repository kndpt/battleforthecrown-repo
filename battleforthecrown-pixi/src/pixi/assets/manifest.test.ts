import { describe, expect, it } from 'vitest';
import { BUILDING_TEXTURE_KEYS, PIXI_BUNDLES, VILLAGE_BUNDLE, WORLD_MAP_BUNDLE } from './manifest';

function bundleAliases(bundle: typeof VILLAGE_BUNDLE): string[] {
  return (bundle.assets as Array<{ alias: string }>).map((a) => a.alias);
}

describe('Pixi asset manifest', () => {
  it('declares boot, village and world-map bundles', () => {
    const names = PIXI_BUNDLES.map((b) => b.name);
    expect(names).toEqual(expect.arrayContaining(['boot', 'village', 'world-map']));
  });

  it('village bundle contains the canonical building aliases', () => {
    const aliases = bundleAliases(VILLAGE_BUNDLE);
    for (const key of BUILDING_TEXTURE_KEYS) {
      expect(aliases).toContain(key);
    }
  });

  it('world-map bundle covers tiers 1-5 barbarians and 1-6 villages', () => {
    const aliases = bundleAliases(WORLD_MAP_BUNDLE);
    for (let t = 1; t <= 5; t += 1) {
      expect(aliases).toContain(`world.barbarian.t${t}`);
    }
    for (let t = 1; t <= 6; t += 1) {
      expect(aliases).toContain(`world.village.t${t}`);
    }
  });

  it('uses the noble asset for capture markers', () => {
    const captureAsset = (WORLD_MAP_BUNDLE.assets as Array<{ alias: string; src: string }>).find(
      (asset) => asset.alias === 'world.capture.crown',
    );

    expect(captureAsset?.src).toContain('/assets/army/noble.png');
  });

  it('every asset src references the public /assets/ tree', () => {
    for (const bundle of PIXI_BUNDLES) {
      for (const asset of bundle.assets as Array<{ src: string }>) {
        expect(asset.src).toContain('/assets/');
      }
    }
  });
});
