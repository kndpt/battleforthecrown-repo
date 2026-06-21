import {
  Assets,
  Container,
  Culler,
  Graphics,
  Point,
  Sprite,
  Text,
  Texture,
  TilingSprite,
  type Application,
  type FederatedPointerEvent,
} from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import type { PixiScene } from './SceneManager';
import { coastValueAt, terrainSeed } from './worldTerrain';
import { createTerrainTextures } from './worldTerrainTextures';
import { createWorldTerrainLayer } from './worldTerrainLayer';
import { extractWaterContours, pointInLoop, smoothLoops } from './waterContours';
import {
  isoBoundsToTileBox,
  isoEllipseRadii,
  isoToTile,
  isoWorldSize,
  makeIsoConfig,
  tileToIso,
} from './isoProjection';
import { villageSpriteAliasForEntity, type MapEntity } from '@/api/world-types';
import { mapEntityCanvasLabel } from '@/features/world/mapEntityLabels';
import type { ExpeditionSnapshot } from '@/stores/expeditions';
import { villageVisualTierFromCastleLevel } from '@battleforthecrown/shared/world';
import type { VisionDisk } from '@battleforthecrown/shared/world';
import { createExpeditionVisual, type ExpeditionVisualHandle } from '@/pixi/entities/ExpeditionVisual';
import { createBlipSprite, type BlipSpriteHandle } from '@/pixi/entities/BlipSprite';
import { createShieldDome, type ShieldDomeHandle } from '@/pixi/entities/ShieldDome';
import { isMapBackgroundTap } from './worldMapBackgroundTap';
import { computeFocusCenter } from './focusCamera';

export interface WorldMapOptions {
  gridWidth: number;
  gridHeight: number;
  tileSize?: number;
  continentSize?: number;
  initialCenter?: { x: number; y: number };
  initialZoom?: number;
  /** World coords of the selected/player village, for the active village halo. */
  myVillage?: { x: number; y: number } | null;
  /** Authoritative watchtower vision disks in tiles. */
  visionDisks?: readonly VisionDisk[];
  fogOfWarEnabled?: boolean;
  onSelectEntity?: (entityId: string | null) => void;
  onHoverEntity?: (entityId: string | null) => void;
}

export interface WorldMapCameraSnapshot {
  center: { x: number; y: number };
  viewportTiles: { width: number; height: number };
}

const DEFAULT_TILE_SIZE = 32;
const BASE_PLAYER_SIZE = 56;
const BASE_BARBARIAN_SIZE = 46;
const HALO_RADIUS = 45;

function spriteSizeFor(entity: MapEntity): number {
  if (entity.kind === 'PLAYER_VILLAGE') {
    const tier = villageVisualTierFromCastleLevel(entity.castleLevel ?? 1);
    return Math.round(BASE_PLAYER_SIZE * Math.pow(1.1, tier - 1));
  }
  if (entity.kind === 'BARBARIAN_VILLAGE') {
    const idx = entity.tier === 'T3' ? 2 : entity.tier === 'T2' ? 1 : 0;
    return Math.round(BASE_BARBARIAN_SIZE * Math.pow(1.1, idx));
  }
  return BASE_BARBARIAN_SIZE;
}

const COLOR = {
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
  selected: 0xfff9d6,
  worldBorder: 0xffecbe,
  fogOverlay: 0x0c0804,
  capture: 0xf1c40f,
  captureDark: 0x7a4b00,
};

interface EntityVisual {
  container: Container;
  graphic: Graphics;
  captureMarker: Graphics;
  captureIcon: Sprite;
  sprite: Sprite;
  label: Text;
  dome: ShieldDomeHandle | null;
  data: MapEntity;
}

function aliasFor(entity: MapEntity): string | null {
  if (entity.isMine || entity.kind === 'PLAYER_VILLAGE') {
    return villageSpriteAliasForEntity(entity);
  }
  if (entity.kind === 'BARBARIAN_VILLAGE') {
    const tier = entity.tier ?? 'T1';
    return `world.barbarian.${tier.toLowerCase()}`;
  }
  return null;
}

export interface WorldMapHandle {
  scene: PixiScene;
  reconcile: (entities: MapEntity[]) => void;
  reconcileExpeditions: (expeditions: ExpeditionSnapshot[]) => void;
  setSelected: (entityId: string | null) => void;
  centerOn: (worldX: number, worldY: number) => void;
  /** Pan (animé) pour caler un point monde sous une ancre écran précise. */
  focusOn: (
    worldX: number,
    worldY: number,
    screenAnchor?: { x: number; y: number },
    animated?: boolean,
  ) => void;
  onCameraChange: (callback: (camera: WorldMapCameraSnapshot) => void) => () => void;
  /** Update the active village halo and authoritative vision disks. */
  setVision: (
    myVillage: { x: number; y: number } | null,
    disks: readonly VisionDisk[],
    fogOfWarEnabled: boolean,
  ) => void;
  /** Convert world tile coords to current screen pixel coords (for tooltip positioning). */
  worldToScreen: (tileX: number, tileY: number) => { x: number; y: number };
}

export function createWorldMapScene(app: Application, options: WorldMapOptions): WorldMapHandle {
  const tileSize = options.tileSize ?? DEFAULT_TILE_SIZE;
  const iso = makeIsoConfig(options.gridWidth, options.gridHeight, tileSize);
  const { width: worldPx, height: worldPy } = isoWorldSize(
    options.gridWidth,
    options.gridHeight,
    iso,
  );

  const view = new Container();

  const viewport = new Viewport({
    screenWidth: app.screen.width,
    screenHeight: app.screen.height,
    worldWidth: worldPx,
    worldHeight: worldPy,
    events: app.renderer.events,
  });

  viewport
    .drag()
    .pinch()
    .wheel({ smooth: 5 })
    .decelerate({ friction: 0.92 })
    .clampZoom({ minScale: 0.15, maxScale: 1 })
    .clamp({ direction: 'all' });

  view.addChild(viewport);

  const mapGroundLayer = new Container();
  mapGroundLayer.eventMode = 'static';
  viewport.addChild(mapGroundLayer);

  // === Background gradient (full world bounds) ===
  const background = new Graphics();
  background.eventMode = 'none';
  background.rect(0, 0, worldPx, worldPy).fill(COLOR.background);
  mapGroundLayer.addChild(background);

  // === Procedural per-tile terrain (viewport-virtualized) ===
  // Replaces the legacy flat fill + "Continent x,y" checkerboard. The ground is
  // diamond particles tinted by a continuous biome+relief field, so biomes
  // blend smoothly and the flat iso ground reads as rolling, directionally-lit
  // terrain. Deterministic and purely cosmetic — gameplay stays
  // server-authoritative.
  //
  // The world is 500×500 (250k tiles) but only ~30×30 are ever on screen, so
  // the ground + decorations are virtualized into chunks by `worldTerrainLayer`
  // and only the chunks near the camera are kept mounted (see updateViewport).
  const seed = terrainSeed(options.gridWidth, options.gridHeight);
  const chunkTiles = 20;
  const terrainTextures = createTerrainTextures(app, { halfW: iso.halfW, halfH: iso.halfH });

  // SUBDIV× the gameplay grid resolution → finer biome detail + smoother relief.
  // Purely a quality knob; world size, object scale and gameplay coords are
  // unchanged (sub-tiles align exactly with the main projection).
  const SUBDIV = 2;

  // World-objects layer (decorations + entities), depth-sorted. Created here so
  // the virtualized terrain layer can mount its decoration sprites into it
  // (a tree in front of a village must occlude it and vice-versa); added to the
  // viewport later, above the ground/water, to fix its render order.
  const entitiesLayer = new Container();
  entitiesLayer.sortableChildren = true;

  const terrainLayer = createWorldTerrainLayer({
    gridWidth: options.gridWidth,
    gridHeight: options.gridHeight,
    tileSize,
    seed,
    iso,
    subdiv: SUBDIV,
    chunkTiles,
    textures: terrainTextures,
    decorLayer: entitiesLayer,
  });
  mapGroundLayer.addChild(terrainLayer.root);

  // === Water bodies (smooth vector polygons) ===
  // Marching squares on the shoreline field → smooth, feathered lakes/seas drawn
  // over the land. No tile stair-stepping; the coast is a continuous curve.
  //
  // The extraction scans the whole 250k-cell field once, so it's built lazily
  // (deferred to after the first terrain paint in `enter`) to keep the map from
  // janking on load. The soft coast is faked with concentric translucent shore
  // strokes instead of a world-sized BlurFilter — a full-world filterArea would
  // allocate a render texture larger than the GPU max texture size.
  const waterLayer = new Graphics();
  waterLayer.eventMode = 'none';
  let waterBuilt = false;
  const buildWater = () => {
    if (waterBuilt) return;
    waterBuilt = true;
    const loops = smoothLoops(
      extractWaterContours(options.gridWidth, options.gridHeight, (tx, ty) =>
        coastValueAt(tx, ty, seed),
      ),
      2,
    );
    // Classify nesting: even depth = water body, odd depth = land island (hole).
    const depthOf = (loop: { x: number; y: number }[]) =>
      loops.reduce((d, other) => (other !== loop && pointInLoop(loop[0], other) ? d + 1 : d), 0);
    const toIso = (loop: { x: number; y: number }[]): number[] => {
      const flat: number[] = [];
      for (const p of loop) {
        const pt = tileToIso(p.x, p.y, iso);
        flat.push(pt.x, pt.y);
      }
      return flat;
    };
    const WATER_FILL = 0x3f72a6;
    const SHORE = 0x9cc3dd;
    const bodies = loops.filter((l) => depthOf(l) % 2 === 0);
    const holes = loops.filter((l) => depthOf(l) % 2 === 1);
    for (const body of bodies) {
      const isoBody = toIso(body);
      waterLayer.poly(isoBody).fill({ color: WATER_FILL, alpha: 1 });
      for (const hole of holes) {
        if (pointInLoop(hole[0], body)) waterLayer.poly(toIso(hole)).cut();
      }
      // Soft shore: a crisp highlight plus two wider, fainter strokes fake a
      // feathered coast without a (world-sized, GPU-killing) blur filter.
      waterLayer.poly(isoBody).stroke({ color: SHORE, width: 3, alpha: 0.5 });
      waterLayer.poly(isoBody).stroke({ color: SHORE, width: 8, alpha: 0.16 });
      waterLayer.poly(isoBody).stroke({ color: SHORE, width: 14, alpha: 0.07 });
    }
  };

  // === World border (iso diamond outline) ===
  const worldBorder = new Graphics();
  worldBorder.eventMode = 'none';
  {
    const n = tileToIso(0, 0, iso);
    const e = tileToIso(options.gridWidth, 0, iso);
    const s = tileToIso(options.gridWidth, options.gridHeight, iso);
    const w = tileToIso(0, options.gridHeight, iso);
    worldBorder
      .moveTo(n.x, n.y)
      .lineTo(e.x, e.y)
      .lineTo(s.x, s.y)
      .lineTo(w.x, w.y)
      .closePath()
      .stroke({ color: COLOR.worldBorder, width: 2, alpha: 0.45 });
  }
  mapGroundLayer.addChild(worldBorder);

  // === Drifting cloud shadows ===
  // Tiled soft-shadow patch scrolling across the land, above terrain but BELOW
  // the water (clean sea) and below the world-objects layer. Animated in update.
  const cloudLayer = new TilingSprite({
    texture: terrainTextures.cloudShadow,
    width: worldPx,
    height: worldPy,
  });
  cloudLayer.eventMode = 'none';
  cloudLayer.alpha = 0.55;
  mapGroundLayer.addChild(cloudLayer);
  // Water above clouds → cloud shadows never fall on the sea.
  mapGroundLayer.addChild(waterLayer);

  // === World objects layer (decorations + entities), depth-sorted, BELOW fog ===
  // Trees and villages share ONE sortableChildren container keyed by iso depth
  // (tileX+tileY), so a tree in front of a village occludes it and vice-versa.
  // Sits above the ground/water but below the fog veil. Created above (so the
  // virtualized terrain layer mounts its decoration sprites into it); attached
  // here to fix its render order above the ground/water.
  viewport.addChild(entitiesLayer);

  // === Fog-of-war overlay ===
  // Above the ground + world-objects (so unexplored terrain/decor/villages are
  // darkened) but below the blips/expeditions/UI. The 'erase' holes reveal the
  // in-vision world. cacheAsTexture isolates the erase blend in its own pass.
  const fogContainer = new Container();
  fogContainer.eventMode = 'none';
  const fogDark = new Graphics();
  const fogHole = new Graphics();
  fogHole.blendMode = 'erase';
  fogContainer.addChild(fogDark);
  fogContainer.addChild(fogHole);
  // Cap the cached fog texture so it never exceeds the GPU max texture size
  // (commonly 8192, sometimes 4096). The iso world bbox can reach ~32000px
  // wide, so a fixed 0.5 resolution would silently fail to render the veil.
  const fogResolution = Math.min(0.5, 4000 / Math.max(worldPx, worldPy));
  fogContainer.cacheAsTexture({ resolution: fogResolution, antialias: true });
  viewport.addChild(fogContainer);

  // === Blips layer (above fog so the gray "something is there" dots read in
  //     the dark, unexplored areas). ===
  const blipLayer = new Container();
  blipLayer.eventMode = 'none';
  viewport.addChild(blipLayer);

  // === Expeditions layer (above fog; troops are only shown in vision) ===
  const expeditionsLayer = new Container();
  expeditionsLayer.sortableChildren = true;
  viewport.addChild(expeditionsLayer);

  // === Vision border ring (drawn above everything for a crisp gold edge). ===
  const visionRing = new Graphics();
  visionRing.eventMode = 'none';
  viewport.addChild(visionRing);

  // === Active village halo ===
  const activeVillageHalo = new Graphics();
  activeVillageHalo.eventMode = 'none';
  activeVillageHalo.visible = false;
  viewport.addChild(activeVillageHalo);

  let myVillage = options.myVillage ?? null;
  let visionDisks = options.visionDisks ?? [];
  let fogOfWarEnabled = options.fogOfWarEnabled ?? true;

  const tileToWorld = (tx: number, ty: number) => {
    const { x, y } = tileToIso(tx, ty, iso);
    // tileToIso returns the diamond's top vertex; entities/fog sit at the
    // tile's visual center, half a diamond-height lower.
    return { px: x, py: y + iso.halfH };
  };
  const worldToScene = (point: { x: number; y: number }) => {
    const { px, py } = tileToWorld(point.x, point.y);
    return { x: px, y: py };
  };
  const cameraListeners = new Set<(camera: WorldMapCameraSnapshot) => void>();
  let cameraRaf = 0;

  const readCamera = (): WorldMapCameraSnapshot => {
    const center = isoToTile(viewport.center.x, viewport.center.y - iso.halfH, iso);
    // Visible extent in tiles is approximate in iso (the view is a diamond);
    // good enough for the minimap viewbox. Scale screen px by the iso steps.
    return {
      center,
      viewportTiles: {
        width: app.screen.width / viewport.scale.x / iso.halfW,
        height: app.screen.height / viewport.scale.y / iso.halfH,
      },
    };
  };

  // Mount/unmount terrain + decoration chunks so only the region around the
  // camera is materialized, then fine-cull whatever's mounted to the screen.
  const syncViewport = () => {
    const b = viewport.getVisibleBounds();
    terrainLayer.updateViewport(
      isoBoundsToTileBox(b.x, b.y, b.x + b.width, b.y + b.height, iso),
    );
    Culler.shared.cull(terrainLayer.root, app.screen);
    Culler.shared.cull(entitiesLayer, app.screen);
  };

  const notifyCameraChange = () => {
    cameraRaf = 0;
    syncViewport();
    const camera = readCamera();
    cameraListeners.forEach((listener) => listener(camera));
  };

  const scheduleCameraChange = () => {
    if (cameraRaf) return;
    cameraRaf = requestAnimationFrame(notifyCameraChange);
  };

  const drawFog = () => {
    fogDark.clear();
    fogHole.clear();
    visionRing.clear();

    if (!fogOfWarEnabled) {
      fogContainer.visible = false;
      fogContainer.updateCacheTexture();
      return;
    }

    fogContainer.visible = true;

    // Dark veil over the entire world. The hole graphics below punches a
    // transparent disk via blendMode 'erase' (works because the parent is
    // cached as a texture).
    fogDark.rect(0, 0, worldPx, worldPy).fill({ color: COLOR.fogOverlay, alpha: 0.6 });

    for (const disk of visionDisks) {
      if (disk.radius <= 0) continue;
      const { px, py } = tileToWorld(disk.x, disk.y);
      // A tile-space vision circle projects to a 2:1 iso ellipse.
      const { rx, ry } = isoEllipseRadii(disk.radius, iso);
      fogHole.ellipse(px, py, rx, ry).fill({ color: 0xffffff, alpha: 1 });
    }

    fogContainer.updateCacheTexture();
  };

  const drawActiveVillageHalo = (nowMs = Date.now()) => {
    activeVillageHalo.clear();
    if (!myVillage) {
      activeVillageHalo.visible = false;
      return;
    }
    const { px, py } = tileToWorld(myVillage.x, myVillage.y);
    const pulse = (Math.sin(nowMs / 240) + 1) / 2;
    activeVillageHalo.visible = true;
    // Flatten the halo to the iso ground plane (2:1).
    activeVillageHalo
      .ellipse(px, py, HALO_RADIUS, HALO_RADIUS / 2)
      .fill({ color: COLOR.myVillage, alpha: 0.18 })
      .stroke({ color: COLOR.myVillage, width: 4, alpha: 0.45 + pulse * 0.3 });
  };

  const visuals = new Map<string, EntityVisual>();
  const blipVisuals = new Map<string, BlipSpriteHandle>();
  const expeditionVisuals = new Map<string, ExpeditionVisualHandle>();
  let selectedId: string | null = null;

  const styleFor = (entity: MapEntity): { color: number; ringColor: number; radius: number; zIndex: number } => {
    if (entity.kind === 'PLAYER_VILLAGE') {
      return { color: COLOR.myVillage, ringColor: COLOR.myVillageStroke, radius: 14, zIndex: entity.isMine ? 10 : 9 };
    }
    if (entity.kind === 'BARBARIAN_VILLAGE') {
      const tier = entity.tier ?? 'T1';
      const color =
        tier === 'T3' ? COLOR.barbarianT3 : tier === 'T2' ? COLOR.barbarianT2 : COLOR.barbarianT1;
      const ring =
        tier === 'T3' ? COLOR.barbarianRingT3 : tier === 'T2' ? COLOR.barbarianRingT2 : COLOR.barbarianRingT1;
      const radius = tier === 'T3' ? 12 : tier === 'T2' ? 11 : 10;
      return { color, ringColor: ring, radius, zIndex: 5 };
    }
    return { color: COLOR.other, ringColor: 0xffffff, radius: 9, zIndex: 3 };
  };

  const drawEntity = (visual: EntityVisual) => {
    const { captureIcon, captureMarker, graphic, sprite, data } = visual;
    const { color, ringColor, radius, zIndex } = styleFor(data);
    const isSelected = data.id === selectedId;
    const alias = aliasFor(data);
    const texture = alias ? Assets.get<Texture>(alias) : null;
    const isMine = data.isMine;

    graphic.clear();
    if (texture) {
      sprite.texture = texture;
      sprite.visible = true;
      const size = spriteSizeFor(data);
      sprite.width = size;
      sprite.height = size;
      sprite.tint = 0xffffff;
      visual.label.position.set(0, -size * 0.6);
      // Grounding drop-shadow: a flattened iso ellipse offset toward the SE
      // (the terrain light comes from the NW), so the sprite sits on the map.
      graphic
        .ellipse(size * 0.12, size * 0.34, size * 0.36, size * 0.16)
        .fill({ color: 0x14200d, alpha: 0.28 });
      // Subtle ring under the sprite for a halo effect.
      graphic
        .circle(0, 0, size * 0.55)
        .fill({ color: ringColor, alpha: 0.18 });
      if (isMine) {
        graphic
          .circle(0, 0, size * 0.62)
          .stroke({ color: COLOR.ownVillageMarker, width: 3, alpha: 0.85 });
      }
      if (isSelected) {
        graphic
          .circle(0, 0, size * 0.65)
          .stroke({ color: COLOR.selected, width: 3, alpha: 0.9 });
      }
    } else {
      sprite.visible = false;
      graphic
        .circle(0, 0, radius + 4)
        .fill({ color: ringColor, alpha: 0.7 });
      graphic.circle(0, 0, radius).fill({ color: COLOR.outline, alpha: 0.55 });
      graphic.circle(0, 0, radius - 2).fill(color);
      if (isSelected) {
        graphic.circle(0, 0, radius + 6).stroke({ color: COLOR.selected, width: 2 });
      }
    }
    // Iso painter's order: depth (tileX+tileY) dominates so nearer villages
    // draw over further ones; kind/selection only break ties at equal depth.
    const depth = (data.x + data.y) * 16;
    visual.container.zIndex = depth + zIndex + (isSelected ? 100000 : 0);
    visual.label.text = mapEntityCanvasLabel(data);
    visual.label.visible = isMine || isSelected;
    if (!data.captureWindow) {
      captureMarker.clear();
      captureIcon.visible = false;
    }
  };

  const drawCaptureMarker = (visual: EntityVisual, nowMs: number) => {
    const { captureIcon, captureMarker, data } = visual;
    captureMarker.clear();
    if (!data.captureWindow) {
      captureIcon.visible = false;
      return;
    }

    const alias = aliasFor(data);
    const texture = alias ? Assets.get<Texture>(alias) : null;
    const size = texture ? spriteSizeFor(data) : styleFor(data).radius * 2;
    const baseRadius = size * 0.58;
    const pulse = (Math.sin(nowMs / 360) + 1) / 2;
    const outerRadius = baseRadius + 6 + pulse * 7;
    const iconTexture = Assets.get<Texture>('world.capture.crown');

    captureMarker
      .circle(0, 0, outerRadius)
      .stroke({ color: COLOR.capture, width: 4, alpha: 0.35 + pulse * 0.35 });
    captureMarker
      .circle(0, 0, baseRadius + 2)
      .stroke({ color: COLOR.captureDark, width: 2.5, alpha: 0.85 });
    captureMarker
      .circle(0, 0, baseRadius + 7)
      .stroke({ color: 0xffffff, width: 1.5, alpha: 0.45 });

    if (iconTexture) {
      captureIcon.texture = iconTexture;
      captureIcon.visible = true;
      const iconSize = 22 + pulse * 4;
      captureIcon.width = iconSize;
      captureIcon.height = iconSize;
      captureIcon.alpha = 0.88 + pulse * 0.12;
      captureIcon.rotation = Math.sin(nowMs / 480) * 0.08;
      captureIcon.position.set(size * 0.32, -size * 0.62 - pulse * 4);
    }
  };

  // Glassy newbie-shield dome over protected player villages. Added above the
  // sprite (translucent) but below the label/capture icon so they stay legible.
  const syncShieldDome = (visual: EntityVisual) => {
    const active =
      visual.data.kind === 'PLAYER_VILLAGE' && visual.data.newbieShield?.active === true;
    if (active) {
      const size = spriteSizeFor(visual.data);
      if (!visual.dome) {
        const dome = createShieldDome();
        visual.container.addChild(dome.container);
        visual.container.setChildIndex(
          dome.container,
          visual.container.getChildIndex(visual.sprite) + 1,
        );
        visual.dome = dome;
      }
      visual.dome.setSize(size);
      // Drop the base so the village sits at the dome's vertical center
      // (dome rises ~ryTop above the base; half of that re-centers the sprite).
      visual.dome.container.position.set(0, size * 0.55);
    } else if (visual.dome) {
      visual.dome.destroy();
      visual.dome = null;
    }
  };

  const ensureVisual = (entity: MapEntity): EntityVisual => {
    let visual = visuals.get(entity.id);
    if (visual) {
      visual.data = entity;
      const { px, py } = tileToWorld(entity.x, entity.y);
      visual.container.position.set(px, py);
      drawEntity(visual);
      syncShieldDome(visual);
      return visual;
    }

    const container = new Container();
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const graphic = new Graphics();
    container.addChild(graphic);

    const captureMarker = new Graphics();
    captureMarker.eventMode = 'none';
    container.addChild(captureMarker);

    const sprite = new Sprite();
    sprite.anchor.set(0.5);
    sprite.visible = false;
    container.addChild(sprite);

    const label = new Text({
      text: entity.name,
      style: {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: 13,
        fill: 0xfff9d6,
        align: 'center',
        fontWeight: '700',
        dropShadow: { alpha: 0.8, color: 0x000000, distance: 2, blur: 3, angle: Math.PI / 4 },
      },
    });
    label.anchor.set(0.5, 1);
    label.position.set(0, -spriteSizeFor(entity) * 0.6);
    label.visible = false;
    container.addChild(label);

    const captureIcon = new Sprite();
    captureIcon.anchor.set(0.5);
    captureIcon.eventMode = 'none';
    captureIcon.visible = false;
    container.addChild(captureIcon);

    const { px, py } = tileToWorld(entity.x, entity.y);
    container.position.set(px, py);

    container.on('pointertap', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      options.onSelectEntity?.(entity.id);
    });
    container.on('pointerover', () => options.onHoverEntity?.(entity.id));
    container.on('pointerout', () => options.onHoverEntity?.(null));

    entitiesLayer.addChild(container);

    visual = { container, graphic, captureMarker, captureIcon, sprite, label, dome: null, data: entity };
    visuals.set(entity.id, visual);
    drawEntity(visual);
    syncShieldDome(visual);
    return visual;
  };

  const retryAttachTextures = () => {
    visuals.forEach((visual) => {
      if (visual.sprite.visible) return;
      const alias = aliasFor(visual.data);
      if (!alias) return;
      if (Assets.get<Texture>(alias)) {
        drawEntity(visual);
      }
    });
  };

  // Click on background = clear selection.
  viewport.eventMode = 'static';
  viewport.on('pointertap', (event: FederatedPointerEvent) => {
    if (isMapBackgroundTap(event.target, viewport, mapGroundLayer, fogContainer)) {
      options.onSelectEntity?.(null);
    }
  });

  const initialCenter = options.initialCenter ?? { x: options.gridWidth / 2, y: options.gridHeight / 2 };
  const initialZoom = options.initialZoom ?? 1;

  const enter = (a: Application) => {
    viewport.resize(a.screen.width, a.screen.height, worldPx, worldPy);
    const centerPx = tileToWorld(initialCenter.x, initialCenter.y);
    viewport.setZoom(initialZoom, false);
    viewport.moveCenter(centerPx.px, centerPx.py);
    drawActiveVillageHalo();
    drawFog();
    // Mount the visible terrain chunks before the first paint…
    syncViewport();
    // …then build the (whole-world, one-shot) water polygons on the next frame
    // so the ground shows instantly instead of janking on the marching-squares
    // scan.
    requestAnimationFrame(buildWater);
    scheduleCameraChange();
  };

  const handleResize = () => {
    viewport.resize(app.screen.width, app.screen.height, worldPx, worldPy);
    scheduleCameraChange();
  };

  const exit = () => {
    if (cameraRaf) cancelAnimationFrame(cameraRaf);
    cameraRaf = 0;
    cameraListeners.clear();
    app.renderer.off('resize', handleResize);
    fogContainer.cacheAsTexture(false);
    viewport.removeAllListeners();
    visuals.forEach((visual) => {
      entitiesLayer.removeChild(visual.container);
      visual.container.destroy({ children: true });
    });
    visuals.clear();
    blipVisuals.forEach((blip) => {
      blipLayer.removeChild(blip.container);
      blip.destroy();
    });
    blipVisuals.clear();
    expeditionVisuals.forEach((v) => v.destroy());
    expeditionVisuals.clear();
    terrainLayer.destroy();
    terrainTextures.destroy();
  };

  app.renderer.on('resize', handleResize);
  viewport.on('moved', scheduleCameraChange);
  viewport.on('zoomed', scheduleCameraChange);

  const destroyVisual = (id: string) => {
    const visual = visuals.get(id);
    if (visual) {
      entitiesLayer.removeChild(visual.container);
      visual.container.destroy({ children: true });
    }
    visuals.delete(id);
  };

  const destroyBlip = (id: string) => {
    const blip = blipVisuals.get(id);
    if (blip) {
      blipLayer.removeChild(blip.container);
      blip.destroy();
    }
    blipVisuals.delete(id);
  };

  const ensureBlipVisual = (entity: MapEntity) => {
    let blip = blipVisuals.get(entity.id);
    if (!blip) {
      blip = createBlipSprite();
      blipLayer.addChild(blip.container);
      blipVisuals.set(entity.id, blip);
    }
    const { px, py } = tileToWorld(entity.x, entity.y);
    blip.container.position.set(px, py);
  };

  const reconcile = (entities: MapEntity[]) => {
    const nextIds = new Set(entities.map((e) => e.id));
    for (const id of Array.from(visuals.keys())) {
      if (!nextIds.has(id)) destroyVisual(id);
    }
    for (const id of Array.from(blipVisuals.keys())) {
      if (!nextIds.has(id)) destroyBlip(id);
    }
    for (const entity of entities) {
      if (entity.kind === 'fogged') {
        if (visuals.has(entity.id)) destroyVisual(entity.id);
        ensureBlipVisual(entity);
      } else {
        if (blipVisuals.has(entity.id)) destroyBlip(entity.id);
        ensureVisual(entity);
      }
    }
  };

  const reconcileExpeditions = (expeditions: ExpeditionSnapshot[]) => {
    const next = new Set(expeditions.map((e) => e.expeditionId));
    for (const id of Array.from(expeditionVisuals.keys())) {
      if (!next.has(id)) {
        const visual = expeditionVisuals.get(id);
        if (visual) {
          expeditionsLayer.removeChild(visual.container);
          visual.destroy();
        }
        expeditionVisuals.delete(id);
      }
    }
    for (const expedition of expeditions) {
      const existing = expeditionVisuals.get(expedition.expeditionId);
      if (existing) {
        existing.setSnapshot(expedition);
      } else {
        const visual = createExpeditionVisual({ snapshot: expedition, worldToScene });
        expeditionsLayer.addChild(visual.container);
        expeditionVisuals.set(expedition.expeditionId, visual);
      }
    }
  };

  const setSelected = (entityId: string | null) => {
    if (selectedId === entityId) return;
    const previous = selectedId;
    selectedId = entityId;
    if (previous) {
      const visual = visuals.get(previous);
      if (visual) drawEntity(visual);
    }
    if (entityId) {
      const visual = visuals.get(entityId);
      if (visual) drawEntity(visual);
    }
  };

  const centerOn = (worldX: number, worldY: number) => {
    const { px, py } = tileToWorld(worldX, worldY);
    viewport.moveCenter(px, py);
    scheduleCameraChange();
  };

  // Pan (animé par défaut) pour amener un point monde sous une ancre écran
  // précise — au lieu de le centrer. `screenAnchor` est en pixels écran (même
  // espace que `worldToScreen`). Utilisé pour caler le village sélectionné sous
  // le bec du panneau fixe.
  const focusOn = (
    worldX: number,
    worldY: number,
    screenAnchor?: { x: number; y: number },
    animated = true,
  ) => {
    const { px, py } = tileToWorld(worldX, worldY);
    // Math pure extraite dans `computeFocusCenter` (testée) : conversion ancre
    // fenêtre → repère canvas + calcul du centre de viewport cible.
    const canvasRect = app.canvas.getBoundingClientRect();
    const { x: targetX, y: targetY } = computeFocusCenter({
      worldX: px,
      worldY: py,
      scale: viewport.scale.x || 1,
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      canvasRect,
      screenAnchor,
    });
    if (animated) {
      viewport.animate({
        position: new Point(targetX, targetY),
        time: 480,
        ease: 'easeInOutSine',
        removeOnInterrupt: true,
      });
    } else {
      viewport.moveCenter(targetX, targetY);
    }
    scheduleCameraChange();
  };

  const onCameraChange = (callback: (camera: WorldMapCameraSnapshot) => void) => {
    cameraListeners.add(callback);
    callback(readCamera());
    return () => {
      cameraListeners.delete(callback);
    };
  };

  const setVision = (
    nextMyVillage: { x: number; y: number } | null,
    nextDisks: readonly VisionDisk[],
    nextFogOfWarEnabled: boolean,
  ) => {
    myVillage = nextMyVillage;
    visionDisks = nextDisks;
    fogOfWarEnabled = nextFogOfWarEnabled;
    drawActiveVillageHalo();
    drawFog();
  };

  const worldToScreen = (tileX: number, tileY: number): { x: number; y: number } => {
    const { px, py } = tileToWorld(tileX, tileY);
    const screenPoint = viewport.toScreen(px, py);
    return { x: screenPoint.x, y: screenPoint.y };
  };

  let textureRetryAccumulator = 0;
  const scene: PixiScene = {
    view,
    enter,
    exit,
    update: (deltaMs) => {
      // Use epoch ms here: expedition timestamps (departAt / arrivalAt) come
      // from the server as Date.parse(...). performance.now() is time since
      // page load, which would make `nowMs - departAt` deeply negative and
      // freeze the unit at t = 0.
      const now = Date.now();
      drawActiveVillageHalo(now);
      // Slow cloud drift across the world (px/frame at the current deltaMs).
      cloudLayer.tilePosition.x += deltaMs * 0.006;
      cloudLayer.tilePosition.y += deltaMs * 0.002;
      visuals.forEach((visual) => {
        if (visual.data.captureWindow) drawCaptureMarker(visual, now);
        if (visual.dome) visual.dome.tick(now);
      });
      expeditionVisuals.forEach((visual) => visual.tick(now));
      textureRetryAccumulator += deltaMs;
      if (textureRetryAccumulator >= 500) {
        textureRetryAccumulator = 0;
        retryAttachTextures();
      }
    },
  };

  return { scene, reconcile, reconcileExpeditions, setSelected, centerOn, focusOn, onCameraChange, setVision, worldToScreen };
}
