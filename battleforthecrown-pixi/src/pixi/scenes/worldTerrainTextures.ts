/**
 * Placeholder ISO terrain & decoration textures, generated at runtime from
 * `Graphics` via `renderer.generateTexture`. No art assets required — this is
 * the prototype layer that proves out the isometric per-tile terrain +
 * ParticleContainer rendering before final hand-painted iso atlases land.
 *
 * Terrain: ONE white diamond texture, instanced as one particle per tile and
 * tinted via `terrainTintAt` (continuous biome colour + directional relief).
 * Decorations: base-anchored sprites so they "stand" on the iso ground, each
 * carrying a baked directional drop-shadow.
 */

import { Graphics, type Application, type Texture } from 'pixi.js';
import { DECOR_KINDS, type DecorKind } from './worldTerrain';

export interface DecorTexture {
  texture: Texture;
  anchorX: number;
  anchorY: number;
}

export interface TerrainTextureSet {
  /** White 2*halfW × 2*halfH diamond, top vertex centred at top edge (anchor 0.5, 0). */
  tileDiamond: Texture;
  /** Tileable soft cloud-shadow patch (dark blobs on transparent) for drifting shade. */
  cloudShadow: Texture;
  decor: Record<DecorKind, DecorTexture>;
  destroy(): void;
}

const CLOUD_TILE = 768;

export interface TerrainTextureOptions {
  halfW: number;
  halfH: number;
}

function bake(app: Application, draw: (g: Graphics) => void): Texture {
  const g = new Graphics();
  draw(g);
  const texture = app.renderer.generateTexture(g);
  g.destroy();
  return texture;
}

/** Single white diamond; tinted per tile at the particle level. */
function makeDiamondTexture(app: Application, { halfW, halfH }: TerrainTextureOptions): Texture {
  return bake(app, (g) => {
    // Top vertex at (halfW, 0) → anchor (0.5, 0) lands it on the tile's top.
    g.moveTo(halfW, 0)
      .lineTo(2 * halfW, halfH)
      .lineTo(halfW, 2 * halfH)
      .lineTo(0, halfH)
      .closePath()
      .fill(0xffffff);
  });
}

/**
 * Tileable cloud-shadow patch: a few soft dark blobs (concentric low-alpha
 * ellipses fake the blur) on a transparent ground. Kept clear of the texture
 * edges so it tiles without visible seams when scrolled as a TilingSprite.
 */
function makeCloudShadowTexture(app: Application): Texture {
  // Deterministic blob layout so the sky is stable across reloads.
  const rand = mulberry32(0x5c10d5);
  const blobs = 6;
  return bake(app, (g) => {
    for (let i = 0; i < blobs; i++) {
      const bx = CLOUD_TILE * (0.18 + rand() * 0.64);
      const by = CLOUD_TILE * (0.18 + rand() * 0.64);
      const rx = 70 + rand() * 70;
      const ry = rx * (0.55 + rand() * 0.2);
      // Stack rings from wide+faint to tight to soften the edge.
      for (let ring = 0; ring < 5; ring++) {
        const k = 1 - ring / 5;
        g.ellipse(bx, by, rx * (0.5 + k * 0.5), ry * (0.5 + k * 0.5)).fill({
          color: 0x141d2b,
          alpha: 0.05,
        });
      }
    }
  });
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Light comes from the north-west, so shadows fall to the south-east. */
function makeTreeTexture(app: Application): DecorTexture {
  const texture = bake(app, (g) => {
    g.ellipse(26, 48, 16, 5).fill({ color: 0x14200d, alpha: 0.32 }); // SE drop shadow
    g.rect(17, 32, 6, 15).fill(0x5b3a1e); // trunk
    g.circle(20, 25, 15).fill(0x3a6029); // canopy (shaded side)
    g.circle(15, 22, 10).fill(0x4f7d39);
    g.circle(24, 19, 9).fill(0x5d8a42);
    g.circle(17, 14, 9).fill(0x73a352); // NW lit crown
  });
  return { texture, anchorX: 0.5, anchorY: 0.95 };
}

function makeGrassTexture(app: Application): DecorTexture {
  const texture = bake(app, (g) => {
    g.ellipse(11, 19, 8, 3).fill({ color: 0x14200d, alpha: 0.2 }); // soft shadow
    g.moveTo(4, 19)
      .lineTo(2, 4)
      .moveTo(10, 19)
      .lineTo(10, 1)
      .moveTo(16, 19)
      .lineTo(18, 5)
      .stroke({ color: 0x4a6322, width: 2.6, alpha: 0.9 });
  });
  return { texture, anchorX: 0.5, anchorY: 0.95 };
}

function makeRockTexture(app: Application): DecorTexture {
  const texture = bake(app, (g) => {
    g.ellipse(17, 19, 13, 4).fill({ color: 0x14200d, alpha: 0.28 }); // SE shadow
    g.roundRect(3, 6, 22, 13, 5).fill(0x6f685d); // shaded body
    g.roundRect(5, 7, 13, 8, 3).fill({ color: 0x968f82, alpha: 0.9 }); // NW lit face
  });
  return { texture, anchorX: 0.5, anchorY: 0.95 };
}

export function createTerrainTextures(
  app: Application,
  options: TerrainTextureOptions,
): TerrainTextureSet {
  const tileDiamond = makeDiamondTexture(app, options);
  const cloudShadow = makeCloudShadowTexture(app);
  const decor: Record<DecorKind, DecorTexture> = {
    tree: makeTreeTexture(app),
    grass: makeGrassTexture(app),
    rock: makeRockTexture(app),
  };

  return {
    tileDiamond,
    cloudShadow,
    decor,
    destroy() {
      tileDiamond.destroy(true);
      cloudShadow.destroy(true);
      for (const kind of DECOR_KINDS) decor[kind].texture.destroy(true);
    },
  };
}
