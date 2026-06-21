/**
 * Procedural world terrain — PURE module (no Pixi import).
 *
 * Produces a deterministic per-tile biome/colour field and decoration
 * placements from the world grid dimensions + a seed. Server stays
 * authoritative for gameplay; this layer is purely cosmetic (like the legacy
 * grass/tree scatter it replaces), so the map can look like a real world
 * without any backend change.
 *
 * The terrain is rendered as one diamond particle per tile, tinted by
 * `terrainTintAt`. Biome thresholds are continuous, so adjacent tiles blend
 * smoothly (no chunk checkerboard), and a slope term bakes directional
 * lighting / relief straight into the tint.
 *
 * Determinism guarantee: same (gridWidth, gridHeight, seed) → same layout
 * across reloads.
 */

export type Biome = 'water' | 'sand' | 'grass' | 'forest' | 'rock';
export type DecorKind = 'tree' | 'grass' | 'rock';

export const BIOMES: readonly Biome[] = ['water', 'sand', 'grass', 'forest', 'rock'];
export const DECOR_KINDS: readonly DecorKind[] = ['tree', 'grass', 'rock'];

export interface TerrainConfig {
  gridWidth: number;
  gridHeight: number;
  /** Chunk size in tiles. Only used to bucket decorations for density. */
  chunkTiles: number;
  seed: number;
}

export interface TerrainChunk {
  cx: number;
  cy: number;
  tileX: number;
  tileY: number;
  widthTiles: number;
  heightTiles: number;
  biome: Biome;
}

export interface DecorPlacement {
  kind: DecorKind;
  /** Tile-space position (float). The caller projects it (iso/top-down). */
  tileX: number;
  tileY: number;
  scale: number;
}

const REFERENCE_CHUNK_TILES = 20;

const DECOR_DENSITY: Record<Biome, Record<DecorKind, number>> = {
  water: { tree: 0, grass: 0, rock: 0 },
  sand: { tree: 0, grass: 2, rock: 4 },
  grass: { tree: 6, grass: 30, rock: 1 },
  forest: { tree: 42, grass: 22, rock: 2 },
  rock: { tree: 2, grass: 4, rock: 18 },
};

// ── Noise ───────────────────────────────────────────────────────────────────

function hashUint32(ix: number, iy: number, seed: number): number {
  let h = (Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ (seed | 0)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smoothstep(x - ix);
  const fy = smoothstep(y - iy);
  const v00 = hashUint32(ix, iy, seed) / 4294967296;
  const v10 = hashUint32(ix + 1, iy, seed) / 4294967296;
  const v01 = hashUint32(ix, iy + 1, seed) / 4294967296;
  const v11 = hashUint32(ix + 1, iy + 1, seed) / 4294967296;
  const top = v00 + (v10 - v00) * fx;
  const bot = v01 + (v11 - v01) * fx;
  return top + (bot - top) * fy;
}

function fbm(x: number, y: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let octave = 0; octave < 3; octave++) {
    sum += amp * valueNoise(x * freq, y * freq, (seed + octave * 1013) | 0);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** Per-tile field frequency: regions span ~50 tiles. */
const FIELD_FREQ = 0.02;

function elevation(tx: number, ty: number, seed: number): number {
  return fbm(tx * FIELD_FREQ, ty * FIELD_FREQ, seed);
}

function moisture(tx: number, ty: number, seed: number): number {
  return fbm(tx * FIELD_FREQ + 50, ty * FIELD_FREQ + 50, (seed ^ 0x9e3779b9) | 0);
}

// ── Biomes (discrete, for decoration density) ────────────────────────────────

export function biomeAt(tx: number, ty: number, seed: number): Biome {
  const e = elevation(tx, ty, seed);
  const m = moisture(tx, ty, seed);
  if (e < 0.34) return 'water';
  if (e > 0.78) return 'rock';
  if (m > 0.6) return 'forest';
  if (m < 0.3) return 'sand';
  return 'grass';
}

export function buildTerrainChunks(config: TerrainConfig): TerrainChunk[] {
  const { gridWidth, gridHeight, chunkTiles, seed } = config;
  const cols = Math.ceil(gridWidth / chunkTiles);
  const rows = Math.ceil(gridHeight / chunkTiles);
  const chunks: TerrainChunk[] = [];
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const tileX = cx * chunkTiles;
      const tileY = cy * chunkTiles;
      const widthTiles = Math.min(chunkTiles, gridWidth - tileX);
      const heightTiles = Math.min(chunkTiles, gridHeight - tileY);
      chunks.push({
        cx,
        cy,
        tileX,
        tileY,
        widthTiles,
        heightTiles,
        // Sample the chunk centre tile to pick the decoration palette.
        biome: biomeAt(tileX + widthTiles / 2, tileY + heightTiles / 2, seed),
      });
    }
  }
  return chunks;
}

// ── Continuous colour + directional relief (baked into the tile tint) ─────────

interface RGB {
  r: number;
  g: number;
  b: number;
}

const C_WATER_DEEP: RGB = { r: 0x33, g: 0x5d, b: 0x8c };
const C_WATER: RGB = { r: 0x3f, g: 0x72, b: 0xa6 };
const C_WATER_SHALLOW: RGB = { r: 0x77, g: 0xa8, b: 0xc6 };
const C_SAND_WET: RGB = { r: 0xa7, g: 0x95, b: 0x6a };
const C_SAND: RGB = { r: 0xc7, g: 0xb2, b: 0x83 };
const C_GRASS: RGB = { r: 0x6f, g: 0x9b, b: 0x41 };
const C_FOREST: RGB = { r: 0x40, g: 0x6c, b: 0x2f };
const C_ROCK: RGB = { r: 0x8a, g: 0x83, b: 0x77 };

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

function clamp01(x: number): number {
  return clamp(x, 0, 1);
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

function packRGB(c: RGB, shade: number): number {
  const r = clamp(Math.round(c.r * shade), 0, 255);
  const g = clamp(Math.round(c.g * shade), 0, 255);
  const b = clamp(Math.round(c.b * shade), 0, 255);
  return (r << 16) | (g << 8) | b;
}

const C_DIRT: RGB = { r: 0x8a, g: 0x6f, b: 0x44 };

/** Water sits below this elevation (flat, animated separately from land). */
const WATER_LEVEL = 0.3;

/** Continuous biome colour from elevation + moisture (smooth, no hard edges). */
function colorForField(e: number, m: number): RGB {
  // Flat open water; a thin lighter "shallows" ring at the very shore bridges
  // the blue→sand contrast so the coastline reads soft, not brutal.
  if (e < WATER_LEVEL) {
    const deep = clamp01((WATER_LEVEL - e) / WATER_LEVEL); // 0 shore, 1 deepest
    const open = lerpRGB(C_WATER, C_WATER_DEEP, deep * 0.3);
    const shore = clamp01((e - (WATER_LEVEL - 0.05)) / 0.05); // 0 open, 1 at shore
    return lerpRGB(open, C_WATER_SHALLOW, shore * 0.6);
  }
  // Shore: wet sand first (no bright jump), then a muted dry beach.
  if (e < 0.38) return lerpRGB(C_SAND_WET, C_SAND, clamp01((e - WATER_LEVEL) / 0.08));
  const lush = lerpRGB(C_GRASS, C_FOREST, clamp01((m - 0.3) / 0.45));
  if (e > 0.78) return lerpRGB(lush, C_ROCK, clamp01((e - 0.78) / 0.22)); // highlands
  if (e < 0.48) return lerpRGB(C_SAND, lush, clamp01((e - 0.38) / 0.1)); // beach→meadow
  return lush;
}

/**
 * Directional relief: shade a tile by the slope of the elevation field against
 * a fixed north-west "sun", plus a gentle altitude term (valleys darker,
 * ridges brighter). Baked into the tint so the flat iso ground reads as
 * rolling, lit terrain.
 */
function reliefShade(tx: number, ty: number, seed: number, e: number): number {
  const dx = elevation(tx + 1, ty, seed) - elevation(tx - 1, ty, seed);
  const dy = elevation(tx, ty + 1, seed) - elevation(tx, ty - 1, seed);
  const lit = -(dx + dy); // > 0 → slope faces the NW light
  const slope = clamp(1 + lit * 7, 0.62, 1.32); // stronger directional contrast
  const altitude = 0.9 + clamp01(e) * 0.2; // higher ground catches more light
  return slope * altitude;
}

/**
 * Coastline jitter: perturb the shoreline with two noise octaves so the water
 * edge follows organic bays/points instead of the field's smooth iso-contour.
 */
function coastJitter(tx: number, ty: number, seed: number): number {
  return (
    (fbm(tx * 0.18, ty * 0.18, (seed + 555) | 0) - 0.5) * 0.12 +
    (fbm(tx * 0.5, ty * 0.5, (seed + 777) | 0) - 0.5) * 0.04
  );
}

/**
 * Signed shoreline field: < 0 is water, > 0 is land, 0 is the coast. Marching
 * squares extracts the smooth water polygons from this; it includes the same
 * jitter as the colouring so the polygon edge matches the wet-sand band.
 */
export function coastValueAt(tx: number, ty: number, seed: number): number {
  return elevation(tx, ty, seed) + coastJitter(tx, ty, seed) - WATER_LEVEL;
}

function applyLandDetail(base: RGB, e: number, tx: number, ty: number, seed: number): RGB {
  // High-frequency detail breaks the flat look (patchy lighter/darker).
  const detail = fbm(tx * 0.16, ty * 0.16, (seed + 9999) | 0);
  const v = 0.9 + detail * 0.2;
  let out = { r: base.r * v, g: base.g * v, b: base.b * v };
  // Occasional dry-earth patches on meadows (not beach/highland).
  if (e > 0.46 && e < 0.78) {
    const dirt = fbm(tx * 0.05 + 200, ty * 0.05 + 200, (seed + 333) | 0);
    if (dirt > 0.62) out = lerpRGB(out, C_DIRT, clamp01((dirt - 0.62) / 0.22) * 0.5);
  }
  return out;
}

/**
 * Ground tint treating every tile as LAND (water bodies are drawn on top as
 * smooth vector polygons, so the tile grid never defines the coastline). Tiles
 * under water get a wet-sand "lakebed" colour that reads as a beach under the
 * feathered water edge.
 */
export function landTintAt(tx: number, ty: number, seed: number): number {
  const e = elevation(tx, ty, seed);
  const m = moisture(tx, ty, seed);
  const eShore = Math.max(e + coastJitter(tx, ty, seed), WATER_LEVEL + 0.001);
  const base = applyLandDetail(colorForField(eShore, m), eShore, tx, ty, seed);
  return packRGB(base, reliefShade(tx, ty, seed, e));
}

/** Final 0xRRGGBB tile tint (legacy: includes blue water tiles). */
export function terrainTintAt(tx: number, ty: number, seed: number): number {
  const e = elevation(tx, ty, seed);
  const m = moisture(tx, ty, seed);
  const eShore = e + coastJitter(tx, ty, seed);
  let base = colorForField(eShore, m);
  if (eShore >= WATER_LEVEL) base = applyLandDetail(base, e, tx, ty, seed);
  const shade = eShore < WATER_LEVEL ? 1 : reliefShade(tx, ty, seed, e);
  return packRGB(base, shade);
}

// ── Decorations ───────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic decoration placements for one chunk, in TILE space. Counts
 * scale with the chunk's clamped area so edge chunks stay consistent with full
 * chunks. The caller projects (tileX, tileY) to scene pixels.
 */
export function decorationsForChunk(chunk: TerrainChunk, seed: number): DecorPlacement[] {
  const density = DECOR_DENSITY[chunk.biome];
  const areaRatio =
    (chunk.widthTiles * chunk.heightTiles) / (REFERENCE_CHUNK_TILES * REFERENCE_CHUNK_TILES);
  const rand = mulberry32(hashUint32(chunk.cx, chunk.cy, seed));

  const out: DecorPlacement[] = [];
  for (const kind of DECOR_KINDS) {
    const count = Math.round(density[kind] * areaRatio);
    for (let i = 0; i < count; i++) {
      out.push({
        kind,
        tileX: chunk.tileX + rand() * chunk.widthTiles,
        tileY: chunk.tileY + rand() * chunk.heightTiles,
        scale: 1 + rand() * 0.8,
      });
    }
  }
  return out;
}

/** Stable seed derived from world dimensions (mirrors the legacy decoration seed). */
export function terrainSeed(gridWidth: number, gridHeight: number): number {
  return (Math.imul(gridWidth, 73856093) ^ Math.imul(gridHeight, 19349663)) | 0;
}
