/**
 * Virtualized world terrain layer.
 *
 * The world is 500×500 tiles (250k); rendering every tile eagerly meant ~1M
 * particles + tens of thousands of decoration sprites built on scene enter,
 * for a viewport that only ever shows ~30×30 tiles. This layer instead splits
 * the world into chunks and only keeps the chunks near the camera mounted:
 *
 *   - each chunk owns ONE static `ParticleContainer` of land diamonds (built
 *     lazily on first mount, then reused) and its decoration sprites;
 *   - on every camera change the scene calls `updateViewport(tileBox)`; chunks
 *     entering the viewport (+ a 1-chunk margin ring) are mounted, chunks
 *     leaving it are unmounted (kept warm in an LRU pool, destroyed only past a
 *     budget so revisiting a region is instant and bounded in memory).
 *
 * Visual output is identical to the eager renderer — same sub-tile diamonds,
 * tints, depth ordering and decoration placement — purely virtualized. Chunk
 * containers carry `zIndex = cx + cy` so cross-chunk seams composite in the
 * same back-to-front order as the original single container, and decorations
 * keep their per-tile `zIndex` so they still sort against villages in the
 * shared world-objects layer.
 */

import { Container, Particle, ParticleContainer, Rectangle, Sprite } from 'pixi.js';
import {
  buildTerrainChunks,
  coastValueAt,
  decorationsForChunk,
  landTintAt,
  type TerrainChunk,
} from './worldTerrain';
import { makeIsoConfig, tileToIso, type IsoConfig, type TileBox } from './isoProjection';
import type { TerrainTextureSet } from './worldTerrainTextures';

export interface WorldTerrainLayerOptions {
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  seed: number;
  iso: IsoConfig;
  /** Render the ground at this multiple of the gameplay grid resolution. */
  subdiv: number;
  /** Chunk edge length in gameplay tiles. */
  chunkTiles: number;
  textures: TerrainTextureSet;
  /** Shared world-objects container; decorations are added here so they
   *  z-sort against villages (a tree can occlude a village and vice-versa). */
  decorLayer: Container;
  /** Extra ring of chunks kept mounted around the viewport to avoid pop-in. */
  marginChunks?: number;
  /** Max chunks kept built (mounted + warm pool) before LRU eviction. */
  maxBuiltChunks?: number;
}

export interface WorldTerrainLayerHandle {
  /** Add to the ground layer. Holds the mounted chunk terrain containers. */
  root: Container;
  /** Mount/unmount chunks so the given tile box (+ margin) is covered. */
  updateViewport: (box: TileBox) => void;
  destroy: () => void;
  /** Diagnostics (built/mounted chunk counts). */
  stats: () => { built: number; mounted: number };
}

interface ChunkVisual {
  terrain: ParticleContainer;
  decor: Sprite[];
  touched: number;
}

const DEFAULT_MARGIN_CHUNKS = 1;
const DEFAULT_MAX_BUILT_CHUNKS = 96;

const clampInt = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export interface ChunkRange {
  minCx: number;
  maxCx: number;
  minCy: number;
  maxCy: number;
}

/**
 * Tile bbox → inclusive chunk index range, expanded by `marginChunks` and
 * clamped to the world. PURE/testable — the virtualization core.
 */
export function chunkRangeForTileBox(
  box: TileBox,
  chunkTiles: number,
  cols: number,
  rows: number,
  marginChunks: number,
): ChunkRange {
  return {
    minCx: clampInt(Math.floor(box.minX / chunkTiles) - marginChunks, 0, cols - 1),
    maxCx: clampInt(Math.floor(box.maxX / chunkTiles) + marginChunks, 0, cols - 1),
    minCy: clampInt(Math.floor(box.minY / chunkTiles) - marginChunks, 0, rows - 1),
    maxCy: clampInt(Math.floor(box.maxY / chunkTiles) + marginChunks, 0, rows - 1),
  };
}

export function createWorldTerrainLayer(
  options: WorldTerrainLayerOptions,
): WorldTerrainLayerHandle {
  const {
    gridWidth,
    gridHeight,
    tileSize,
    seed,
    iso,
    subdiv,
    chunkTiles,
    textures,
    decorLayer,
  } = options;
  const marginChunks = options.marginChunks ?? DEFAULT_MARGIN_CHUNKS;
  const maxBuiltChunks = options.maxBuiltChunks ?? DEFAULT_MAX_BUILT_CHUNKS;

  const cols = Math.ceil(gridWidth / chunkTiles);
  const rows = Math.ceil(gridHeight / chunkTiles);

  // Sub-tile iso config: aligns exactly with the main projection (offsetX and
  // tile-corner positions match), just at SUBDIV× resolution.
  const subIso = makeIsoConfig(gridWidth * subdiv, gridHeight * subdiv, tileSize / subdiv);
  const subScale = 1.02 / subdiv; // sub-tile size + 2% overlap to hide AA seams

  // Chunk decoration metadata (biome per chunk) — cheap to precompute for all
  // chunks; only the sprites themselves are built lazily per mounted chunk.
  const chunkMeta = new Map<string, TerrainChunk>();
  for (const chunk of buildTerrainChunks({ gridWidth, gridHeight, chunkTiles, seed })) {
    chunkMeta.set(`${chunk.cx},${chunk.cy}`, chunk);
  }

  const root = new Container();
  root.sortableChildren = true;
  root.eventMode = 'none';

  const built = new Map<string, ChunkVisual>();
  const mounted = new Set<string>();
  let clock = 0;

  const buildChunk = (cx: number, cy: number): ChunkVisual => {
    const tx0 = cx * chunkTiles;
    const ty0 = cy * chunkTiles;
    const tx1 = Math.min(tx0 + chunkTiles, gridWidth);
    const ty1 = Math.min(ty0 + chunkTiles, gridHeight);

    const terrain = new ParticleContainer({
      texture: textures.tileDiamond,
      dynamicProperties: {
        vertex: false,
        position: false,
        rotation: false,
        uvs: false,
        color: false,
      },
    });
    terrain.eventMode = 'none';
    terrain.zIndex = cx + cy;
    terrain.cullable = true;

    // Sub-tile range for this chunk, built back-to-front (sx+sy ascending) so
    // the slight tile overlap composites correctly within the chunk.
    const sx0 = tx0 * subdiv;
    const sx1 = tx1 * subdiv - 1;
    const sy0 = ty0 * subdiv;
    const sy1 = ty1 * subdiv - 1;
    for (let depth = sx0 + sy0; depth <= sx1 + sy1; depth++) {
      const sxMin = Math.max(sx0, depth - sy1);
      const sxMax = Math.min(sx1, depth - sy0);
      for (let sx = sxMin; sx <= sxMax; sx++) {
        const sy = depth - sx;
        const pos = tileToIso(sx, sy, subIso);
        terrain.addParticle(
          new Particle({
            texture: textures.tileDiamond,
            x: pos.x,
            y: pos.y,
            anchorX: 0.5,
            anchorY: 0,
            scaleX: subScale,
            scaleY: subScale,
            tint: landTintAt(sx / subdiv, sy / subdiv, seed),
          }),
        );
      }
    }

    // Static bounds → ParticleContainer skips per-frame bounds computation and
    // the whole chunk is cullable as a unit.
    const top = tileToIso(tx0, ty0, iso);
    const right = tileToIso(tx1, ty0, iso);
    const bottom = tileToIso(tx1, ty1, iso);
    const left = tileToIso(tx0, ty1, iso);
    terrain.boundsArea = new Rectangle(
      left.x,
      top.y,
      right.x - left.x,
      bottom.y - top.y,
    );

    // Decorations — individual sprites so they sort against villages. Skip any
    // that landed on water (no floating trees on lakes).
    const decor: Sprite[] = [];
    const meta = chunkMeta.get(`${cx},${cy}`);
    if (meta) {
      for (const placement of decorationsForChunk(meta, seed)) {
        if (coastValueAt(placement.tileX, placement.tileY, seed) < 0) continue;
        const tex = textures.decor[placement.kind];
        const pos = tileToIso(placement.tileX, placement.tileY, iso);
        const sprite = new Sprite(tex.texture);
        sprite.anchor.set(tex.anchorX, tex.anchorY);
        sprite.position.set(pos.x, pos.y);
        sprite.scale.set(placement.scale);
        sprite.eventMode = 'none';
        sprite.cullable = true;
        sprite.zIndex = (placement.tileX + placement.tileY) * 16;
        decor.push(sprite);
      }
    }

    return { terrain, decor, touched: clock };
  };

  const mount = (key: string, cx: number, cy: number): void => {
    let visual = built.get(key);
    if (!visual) {
      visual = buildChunk(cx, cy);
      built.set(key, visual);
    }
    visual.touched = ++clock;
    if (!mounted.has(key)) {
      root.addChild(visual.terrain);
      for (const sprite of visual.decor) decorLayer.addChild(sprite);
      mounted.add(key);
    }
  };

  const unmount = (key: string): void => {
    const visual = built.get(key);
    if (!visual || !mounted.has(key)) return;
    root.removeChild(visual.terrain);
    for (const sprite of visual.decor) decorLayer.removeChild(sprite);
    mounted.delete(key);
  };

  const destroyChunk = (key: string, visual: ChunkVisual): void => {
    visual.terrain.destroy();
    for (const sprite of visual.decor) sprite.destroy();
    built.delete(key);
  };

  const evictIfNeeded = (): void => {
    if (built.size <= maxBuiltChunks) return;
    const warm = Array.from(built.entries())
      .filter(([key]) => !mounted.has(key))
      .sort((a, b) => a[1].touched - b[1].touched);
    for (const [key, visual] of warm) {
      if (built.size <= maxBuiltChunks) break;
      destroyChunk(key, visual);
    }
  };

  const updateViewport = (box: TileBox): void => {
    const range = chunkRangeForTileBox(box, chunkTiles, cols, rows, marginChunks);
    const want = new Set<string>();
    for (let cy = range.minCy; cy <= range.maxCy; cy++) {
      for (let cx = range.minCx; cx <= range.maxCx; cx++) {
        const key = `${cx},${cy}`;
        want.add(key);
        mount(key, cx, cy);
      }
    }
    for (const key of Array.from(mounted)) {
      if (!want.has(key)) unmount(key);
    }
    evictIfNeeded();
  };

  const destroy = (): void => {
    for (const [key, visual] of Array.from(built.entries())) {
      if (mounted.has(key)) unmount(key);
      destroyChunk(key, visual);
    }
    built.clear();
    mounted.clear();
    root.destroy({ children: true });
  };

  return {
    root,
    updateViewport,
    destroy,
    stats: () => ({ built: built.size, mounted: mounted.size }),
  };
}
