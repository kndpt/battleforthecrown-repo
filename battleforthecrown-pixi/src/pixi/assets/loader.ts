import { Assets, type Texture } from 'pixi.js';
import { registerPixiBundles } from './manifest';

export type BundleProgressCallback = (progress: number) => void;

/**
 * Loads a Pixi Assets bundle by name. Idempotent — repeated calls return
 * the previously loaded textures without re-fetching, since Assets caches
 * them internally.
 */
export async function loadBundle(
  name: string,
  onProgress?: BundleProgressCallback,
): Promise<Record<string, Texture>> {
  registerPixiBundles();
  const textures = (await Assets.loadBundle(name, onProgress)) as Record<string, Texture>;
  return textures;
}
