import { afterEach, describe, expect, it } from 'vitest';
import { GlobalResourceRegistry, TexturePool } from 'pixi.js';

// Regression guard for the world-map fog teardown crash:
//   "Cannot read properties of undefined (reading 'push')" at
//   WorldMapScene.exit() -> fogContainer.cacheAsTexture(false).
//
// Root cause: TexturePool is a process-global singleton shared by every PixiJS
// Application. BFTC runs two (VillageCanvas + WorldMapCanvas). Destroying one
// renderer with `releaseGlobalResources` calls TexturePool.clear(), which wipes
// `_texturePool` but NOT `_poolKeyHash`. A cache-as-texture still alive on the
// other canvas (the fog) then returns its pooled texture: the key is still in
// `_poolKeyHash`, but its bucket is gone, so `_texturePool[key].push()` throws.
//
// PixiCanvas now tears down each renderer with `{ removeView: true }` (no
// `releaseGlobalResources`), so destroying one canvas no longer corrupts the
// pool used by the other. These tests pin both halves of that contract.

describe('TexturePool cross-Application teardown', () => {
  afterEach(() => {
    // Keep the shared singleton clean for other suites.
    TexturePool.clear();
  });

  it('crashes returnTexture when the global pool is cleared underneath a live cache texture', () => {
    const tex = TexturePool.getOptimalTexture(128, 128, 1, false);

    // Simulate another Application destroying WITH releaseGlobalResources.
    GlobalResourceRegistry.release();

    // The world-map fog teardown returns its still-referenced pooled texture.
    expect(() => TexturePool.returnTexture(tex, true)).toThrow(/push/);
  });

  it('does not crash returnTexture when global resources are NOT released on teardown', () => {
    const tex = TexturePool.getOptimalTexture(128, 128, 1, false);

    // PixiCanvas destroys with `{ removeView: true }` -> no GlobalResourceRegistry
    // release, so the shared pool keeps the bucket the fog texture belongs to.
    expect(() => TexturePool.returnTexture(tex, true)).not.toThrow();
  });
});
