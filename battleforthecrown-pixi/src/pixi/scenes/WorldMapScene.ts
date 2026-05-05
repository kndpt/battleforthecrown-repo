import { Assets, Container, Graphics, Sprite, Text, Texture, type Application, type FederatedPointerEvent } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import type { PixiScene } from './SceneManager';
import type { MapEntity } from '@/api/world-types';
import type { ExpeditionSnapshot } from '@/stores/expeditions';
import { createExpeditionVisual, type ExpeditionVisualHandle } from '@/pixi/entities/ExpeditionVisual';

export interface WorldMapOptions {
  gridWidth: number;
  gridHeight: number;
  tileSize?: number;
  continentSize?: number;
  initialCenter?: { x: number; y: number };
  initialZoom?: number;
  /** World coords of the player's own village, for vision overlay + crosshair. */
  myVillage?: { x: number; y: number } | null;
  /** Watchtower vision in tiles. null = unlimited. */
  visibilityRadius?: number | null;
  onSelectEntity?: (entityId: string | null) => void;
  onHoverEntity?: (entityId: string | null) => void;
}

const DEFAULT_TILE_SIZE = 32;
const DEFAULT_CONTINENT_SIZE = 100;
const SPRITE_SIZE = 64;
const PLAYER_SPRITE_SIZE = 72;

const COLOR = {
  background: 0x2f2416,
  continentA: 0x81603a,
  continentAAlpha: 0.22,
  continentB: 0xa0794b,
  continentBAlpha: 0.18,
  continentBorder: 0xf0d28c,
  continentBorderAlpha: 0.25,
  continentLabel: 0xf6d67b,
  grid: 0xfff3c8,
  myVillage: 0xf2d15c,
  myVillageStroke: 0xf6e7b1,
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
};

interface EntityVisual {
  container: Container;
  graphic: Graphics;
  sprite: Sprite;
  label: Text;
  data: MapEntity;
}

function aliasFor(entity: MapEntity): string | null {
  if (entity.isMine || entity.kind === 'PLAYER_VILLAGE') {
    return 'world.village.t1';
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
  /** Update the vision center / radius (when watchtower upgrades). */
  setVision: (myVillage: { x: number; y: number } | null, radius: number | null) => void;
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
    .clampZoom({ minScale: 0.15, maxScale: 4 })
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

  // === Expeditions layer ===
  const expeditionsLayer = new Container();
  expeditionsLayer.sortableChildren = true;
  viewport.addChild(expeditionsLayer);

  // === Entities layer ===
  const entitiesLayer = new Container();
  entitiesLayer.sortableChildren = true;
  viewport.addChild(entitiesLayer);

  // === Fog-of-war overlay (drawn on top of world but below tooltips) ===
  const fogLayer = new Graphics();
  viewport.addChild(fogLayer);

  // === Crosshair on my village ===
  const crosshair = new Graphics();
  crosshair.visible = false;
  viewport.addChild(crosshair);

  let myVillage = options.myVillage ?? null;
  let visibilityRadius = options.visibilityRadius ?? null;

  const tileToWorld = (tx: number, ty: number) => ({
    px: tx * tileSize + tileSize / 2,
    py: ty * tileSize + tileSize / 2,
  });
  const worldToScene = (point: { x: number; y: number }) => {
    const { px, py } = tileToWorld(point.x, point.y);
    return { x: px, y: py };
  };

  const drawFog = () => {
    fogLayer.clear();
    if (!myVillage || visibilityRadius === null) return;
    if (visibilityRadius <= 0) return;

    // Simple golden ring at the vision border — gives the player a visual cue
    // for "what I can see" without the broken donut overlay (Pixi v8 doesn't
    // expose evenodd fillRule cleanly enough for a real fog-of-war mask).
    const { px, py } = tileToWorld(myVillage.x, myVillage.y);
    const radiusPx = visibilityRadius * tileSize;
    fogLayer
      .circle(px, py, radiusPx)
      .stroke({ color: COLOR.worldBorder, width: 2, alpha: 0.4 });
  };

  const drawCrosshair = () => {
    crosshair.clear();
    if (!myVillage) {
      crosshair.visible = false;
      return;
    }
    const { px, py } = tileToWorld(myVillage.x, myVillage.y);
    crosshair.visible = true;
    // Small dotted-ish crosshair behind the sprite. Sits below the sprite
    // (lower zIndex) so it doesn't paint over the player village.
    const arm = 14;
    const gap = 8;
    crosshair
      .moveTo(px - arm, py)
      .lineTo(px - gap, py)
      .moveTo(px + gap, py)
      .lineTo(px + arm, py)
      .moveTo(px, py - arm)
      .lineTo(px, py - gap)
      .moveTo(px, py + gap)
      .lineTo(px, py + arm)
      .stroke({ color: COLOR.myVillageStroke, width: 1.5, alpha: 0.6 });
  };

  const visuals = new Map<string, EntityVisual>();
  const expeditionVisuals = new Map<string, ExpeditionVisualHandle>();
  let selectedId: string | null = null;

  const styleFor = (entity: MapEntity): { color: number; ringColor: number; radius: number; zIndex: number } => {
    if (entity.isMine || entity.kind === 'PLAYER_VILLAGE') {
      return { color: COLOR.myVillage, ringColor: COLOR.myVillageStroke, radius: 14, zIndex: 10 };
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
    const { graphic, sprite, data } = visual;
    const { color, ringColor, radius, zIndex } = styleFor(data);
    const isSelected = data.id === selectedId;
    const alias = aliasFor(data);
    const texture = alias ? Assets.get<Texture>(alias) : null;
    const isMine = data.isMine;

    graphic.clear();
    if (texture) {
      sprite.texture = texture;
      sprite.visible = true;
      const size = isMine ? PLAYER_SPRITE_SIZE : SPRITE_SIZE;
      sprite.width = size;
      sprite.height = size;
      // Subtle ring under the sprite for a halo effect.
      graphic
        .circle(0, 0, size * 0.55)
        .fill({ color: ringColor, alpha: 0.18 });
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

    visual = { container, graphic, sprite, label, data: entity };
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
      event.target === grid ||
      event.target === fogLayer ||
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
    drawCrosshair();
    drawFog();
  };

  const handleResize = () => {
    viewport.resize(app.screen.width, app.screen.height, worldPx, worldPy);
  };

  const exit = () => {
    app.renderer.off('resize', handleResize);
    viewport.removeAllListeners();
    visuals.clear();
    expeditionVisuals.forEach((v) => v.destroy());
    expeditionVisuals.clear();
  };

  app.renderer.on('resize', handleResize);

  const reconcile = (entities: MapEntity[]) => {
    const nextIds = new Set(entities.map((e) => e.id));
    for (const id of Array.from(visuals.keys())) {
      if (!nextIds.has(id)) {
        const visual = visuals.get(id);
        if (visual) {
          entitiesLayer.removeChild(visual.container);
          visual.container.destroy({ children: true });
        }
        visuals.delete(id);
      }
    }
    for (const entity of entities) {
      ensureVisual(entity);
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
  };

  const setVision = (
    nextMyVillage: { x: number; y: number } | null,
    nextRadius: number | null,
  ) => {
    myVillage = nextMyVillage;
    visibilityRadius = nextRadius;
    drawCrosshair();
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
      const now = performance.now();
      expeditionVisuals.forEach((visual) => visual.tick(now));
      textureRetryAccumulator += deltaMs;
      if (textureRetryAccumulator >= 500) {
        textureRetryAccumulator = 0;
        retryAttachTextures();
      }
    },
  };

  return { scene, reconcile, reconcileExpeditions, setSelected, centerOn, setVision, worldToScreen };
}
