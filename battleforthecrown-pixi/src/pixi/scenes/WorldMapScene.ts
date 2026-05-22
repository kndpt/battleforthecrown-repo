import { Assets, Container, Graphics, Sprite, Text, Texture, type Application, type FederatedPointerEvent } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import type { PixiScene } from './SceneManager';
import { villageSpriteAliasForEntity, type MapEntity } from '@/api/world-types';
import type { ExpeditionSnapshot } from '@/stores/expeditions';
import type { VisionDisk } from '@battleforthecrown/shared/world';
import { createExpeditionVisual, type ExpeditionVisualHandle } from '@/pixi/entities/ExpeditionVisual';
import { createBlipSprite, type BlipSpriteHandle } from '@/pixi/entities/BlipSprite';

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
const DEFAULT_CONTINENT_SIZE = 100;
const SPRITE_SIZE = 64;
const PLAYER_SPRITE_SIZE = 72;

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

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

interface EntityVisual {
  container: Container;
  graphic: Graphics;
  captureMarker: Graphics;
  sprite: Sprite;
  label: Text;
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
  const continentSize = options.continentSize ?? DEFAULT_CONTINENT_SIZE;
  const worldPx = options.gridWidth * tileSize;
  const worldPy = options.gridHeight * tileSize;

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

  // === Background gradient (full world bounds) ===
  const background = new Graphics();
  background.rect(0, 0, worldPx, worldPy).fill(COLOR.background);
  viewport.addChild(background);

  // === Continent damier ===
  const continentsLayer = new Container();
  viewport.addChild(continentsLayer);

  const continentCols = Math.ceil(options.gridWidth / continentSize);
  const continentRows = Math.ceil(options.gridHeight / continentSize);
  const continentPx = continentSize * tileSize;

  for (let cx = 0; cx < continentCols; cx++) {
    for (let cy = 0; cy < continentRows; cy++) {
      const tile = new Graphics();
      const isAlt = (cx + cy) % 2 === 0;
      tile
        .rect(cx * continentPx, cy * continentPx, continentPx, continentPx)
        .fill({
          color: isAlt ? COLOR.continentA : COLOR.continentB,
          alpha: isAlt ? COLOR.continentAAlpha : COLOR.continentBAlpha,
        })
        .stroke({ color: COLOR.continentBorder, width: 1, alpha: COLOR.continentBorderAlpha });
      continentsLayer.addChild(tile);

      const label = new Text({
        text: `Continent ${cx},${cy}`,
        style: {
          fontFamily: 'Cinzel, Georgia, serif',
          fontSize: 14,
          fill: COLOR.continentLabel,
          fontWeight: '600',
        },
      });
      label.alpha = 0.5;
      label.position.set(cx * continentPx + 12, cy * continentPx + 8);
      continentsLayer.addChild(label);
    }
  }

  // === Decorations (grass tufts + small forests) baked into one Graphics ===
  // Deterministic so the layout is stable across reloads of the same world.
  const decorations = new Graphics();
  {
    const rand = mulberry32(options.gridWidth * 73856093 ^ options.gridHeight * 19349663);
    // Density tuned by eye: ~1 decoration per 6 tiles² → readable but not noisy.
    const cellPx = tileSize * 6;
    for (let x = 0; x < worldPx; x += cellPx) {
      for (let y = 0; y < worldPy; y += cellPx) {
        const jitterX = rand() * cellPx;
        const jitterY = rand() * cellPx;
        const cx = x + jitterX;
        const cy = y + jitterY;
        const isTree = rand() < 0.32;
        if (isTree) {
          // Two-tone disc + shadow to suggest a tree clump.
          decorations
            .ellipse(cx + 4.5, cy + 6, 18, 9)
            .fill({ color: COLOR.treeShadow, alpha: 0.35 });
          decorations
            .circle(cx, cy, 15)
            .fill({ color: COLOR.treeCanopy, alpha: 0.85 });
          decorations
            .circle(cx - 4.5, cy - 4.5, 6)
            .fill({ color: 0x5d7d2e, alpha: 0.6 });
        } else {
          // Grass tuft = 3 blades fanning out.
          decorations
            .moveTo(cx - 6, cy + 3)
            .lineTo(cx - 7.5, cy - 9)
            .moveTo(cx, cy + 3)
            .lineTo(cx, cy - 12)
            .moveTo(cx + 6, cy + 3)
            .lineTo(cx + 7.5, cy - 9)
            .stroke({ color: COLOR.grassBlade, width: 3.6, alpha: 0.55 });
        }
      }
    }
  }
  viewport.addChild(decorations);

  // === Sparse grid lines (every tile, very subtle) ===
  const grid = new Graphics();
  for (let gx = 0; gx <= options.gridWidth; gx += 10) {
    const px = gx * tileSize;
    grid.moveTo(px, 0).lineTo(px, worldPy);
  }
  for (let gy = 0; gy <= options.gridHeight; gy += 10) {
    const py = gy * tileSize;
    grid.moveTo(0, py).lineTo(worldPx, py);
  }
  grid.stroke({ color: COLOR.grid, width: 1, alpha: 0.08 });
  viewport.addChild(grid);

  // === World border (golden rectangle) ===
  const worldBorder = new Graphics();
  worldBorder
    .rect(0, 0, worldPx, worldPy)
    .stroke({ color: COLOR.worldBorder, width: 2, alpha: 0.45 });
  viewport.addChild(worldBorder);

  // === Fog-of-war overlay (sits between the ground and the entities so the
  //     ground is darkened outside vision but the blips/villages stay legible).
  //     Uses cacheAsTexture so the 'erase' blendMode of the hole composes
  //     against the dark layer in an isolated render pass. ===
  const fogContainer = new Container();
  fogContainer.eventMode = 'none';
  const fogDark = new Graphics();
  const fogHole = new Graphics();
  fogHole.blendMode = 'erase';
  fogContainer.addChild(fogDark);
  fogContainer.addChild(fogHole);
  fogContainer.cacheAsTexture({ resolution: 0.5, antialias: true });
  viewport.addChild(fogContainer);

  // === Entities layer ===
  const entitiesLayer = new Container();
  entitiesLayer.sortableChildren = true;
  viewport.addChild(entitiesLayer);

  // === Expeditions layer ===
  // Must sit above entities so the moving troop sprite is never hidden behind
  // the village it's heading to / coming back from.
  const expeditionsLayer = new Container();
  expeditionsLayer.sortableChildren = true;
  viewport.addChild(expeditionsLayer);

  // === Vision border ring (drawn above entities for a crisp gold edge). ===
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

  const tileToWorld = (tx: number, ty: number) => ({
    px: tx * tileSize + tileSize / 2,
    py: ty * tileSize + tileSize / 2,
  });
  const worldToScene = (point: { x: number; y: number }) => {
    const { px, py } = tileToWorld(point.x, point.y);
    return { x: px, y: py };
  };
  const cameraListeners = new Set<(camera: WorldMapCameraSnapshot) => void>();
  let cameraRaf = 0;

  const readCamera = (): WorldMapCameraSnapshot => {
    const topLeft = viewport.toWorld(0, 0);
    const bottomRight = viewport.toWorld(app.screen.width, app.screen.height);

    return {
      center: {
        x: viewport.center.x / tileSize,
        y: viewport.center.y / tileSize,
      },
      viewportTiles: {
        width: Math.abs(bottomRight.x - topLeft.x) / tileSize,
        height: Math.abs(bottomRight.y - topLeft.y) / tileSize,
      },
    };
  };

  const notifyCameraChange = () => {
    cameraRaf = 0;
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
      const radiusPx = disk.radius * tileSize;
      fogHole.circle(px, py, radiusPx).fill({ color: 0xffffff, alpha: 1 });
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
    activeVillageHalo
      .circle(px, py, PLAYER_SPRITE_SIZE * 0.62)
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
    const { captureMarker, graphic, sprite, data } = visual;
    const { color, ringColor, radius, zIndex } = styleFor(data);
    const isSelected = data.id === selectedId;
    const alias = aliasFor(data);
    const texture = alias ? Assets.get<Texture>(alias) : null;
    const isMine = data.isMine;

    graphic.clear();
    if (texture) {
      sprite.texture = texture;
      sprite.visible = true;
      const size = data.kind === 'PLAYER_VILLAGE' ? PLAYER_SPRITE_SIZE : SPRITE_SIZE;
      sprite.width = size;
      sprite.height = size;
      sprite.tint = 0xffffff;
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
    visual.container.zIndex = zIndex + (isSelected ? 50 : 0);
    visual.label.text = data.name;
    visual.label.visible = isMine || isSelected;
    if (!data.captureWindow) captureMarker.clear();
  };

  const drawCaptureMarker = (visual: EntityVisual, nowMs: number) => {
    const { captureMarker, data } = visual;
    captureMarker.clear();
    if (!data.captureWindow) return;

    const alias = aliasFor(data);
    const texture = alias ? Assets.get<Texture>(alias) : null;
    const size = texture ? (data.isMine ? PLAYER_SPRITE_SIZE : SPRITE_SIZE) : styleFor(data).radius * 2;
    const baseRadius = size * 0.58;
    const pulse = (Math.sin(nowMs / 360) + 1) / 2;
    const outerRadius = baseRadius + 6 + pulse * 7;

    captureMarker
      .circle(0, 0, outerRadius)
      .stroke({ color: COLOR.capture, width: 4, alpha: 0.35 + pulse * 0.35 });
    captureMarker
      .circle(0, 0, baseRadius + 2)
      .stroke({ color: COLOR.captureDark, width: 2.5, alpha: 0.85 });
    captureMarker
      .circle(0, 0, baseRadius + 7)
      .stroke({ color: 0xffffff, width: 1.5, alpha: 0.45 });
  };

  const ensureVisual = (entity: MapEntity): EntityVisual => {
    let visual = visuals.get(entity.id);
    if (visual) {
      visual.data = entity;
      const { px, py } = tileToWorld(entity.x, entity.y);
      visual.container.position.set(px, py);
      drawEntity(visual);
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
    label.position.set(0, -PLAYER_SPRITE_SIZE * 0.6);
    label.visible = false;
    container.addChild(label);

    const { px, py } = tileToWorld(entity.x, entity.y);
    container.position.set(px, py);

    container.on('pointertap', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      options.onSelectEntity?.(entity.id);
    });
    container.on('pointerover', () => options.onHoverEntity?.(entity.id));
    container.on('pointerout', () => options.onHoverEntity?.(null));

    entitiesLayer.addChild(container);

    visual = { container, graphic, captureMarker, sprite, label, data: entity };
    visuals.set(entity.id, visual);
    drawEntity(visual);
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
    if (
      event.target === viewport ||
      event.target === background ||
      event.target === decorations ||
      event.target === grid ||
      event.target === fogContainer ||
      event.target === fogDark ||
      event.target === fogHole ||
      event.target === visionRing ||
      event.target === worldBorder ||
      event.target === continentsLayer ||
      event.target.parent === continentsLayer
    ) {
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
    viewport.removeAllListeners();
    visuals.clear();
    expeditionVisuals.forEach((v) => v.destroy());
    expeditionVisuals.clear();
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
      entitiesLayer.removeChild(blip.container);
      blip.destroy();
    }
    blipVisuals.delete(id);
  };

  const ensureBlipVisual = (entity: MapEntity) => {
    let blip = blipVisuals.get(entity.id);
    if (!blip) {
      blip = createBlipSprite();
      entitiesLayer.addChild(blip.container);
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
      visuals.forEach((visual) => drawCaptureMarker(visual, now));
      expeditionVisuals.forEach((visual) => visual.tick(now));
      textureRetryAccumulator += deltaMs;
      if (textureRetryAccumulator >= 500) {
        textureRetryAccumulator = 0;
        retryAttachTextures();
      }
    },
  };

  return { scene, reconcile, reconcileExpeditions, setSelected, centerOn, onCameraChange, setVision, worldToScreen };
}
