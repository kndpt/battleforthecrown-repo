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
  initialCenter?: { x: number; y: number };
  initialZoom?: number;
  onSelectEntity?: (entityId: string | null) => void;
  onHoverEntity?: (entityId: string | null) => void;
}

const DEFAULT_TILE_SIZE = 8;

const COLOR = {
  background: 0x1c2333,
  grid: 0x2a3548,
  gridMajor: 0x37466a,
  myVillage: 0xf1c40f,
  barbarianT1: 0x4a8c2a,
  barbarianT2: 0xd4a017,
  barbarianT3: 0xc0392b,
  other: 0x95a5a6,
  outline: 0x000000,
  selected: 0xffffff,
};

interface EntityVisual {
  container: Container;
  graphic: Graphics;
  sprite: Sprite;
  label: Text;
  data: MapEntity;
}

const WORLD_SPRITE_SIZE = 28;

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
}

export function createWorldMapScene(app: Application, options: WorldMapOptions): WorldMapHandle {
  const tileSize = options.tileSize ?? DEFAULT_TILE_SIZE;
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
    .clampZoom({ minScale: 0.25, maxScale: 4 })
    .clamp({ direction: 'all' });

  view.addChild(viewport);

  // Background tile layer (single rectangle of the world bounds, tinted).
  const background = new Graphics();
  background.rect(0, 0, worldPx, worldPy).fill(COLOR.background);
  viewport.addChild(background);

  // Sparse grid every 50 tiles for orientation, painted into a single Graphics
  // to keep draw calls minimal.
  const grid = new Graphics();
  const majorEvery = 50;
  for (let gx = 0; gx <= options.gridWidth; gx += 10) {
    const px = gx * tileSize;
    grid.moveTo(px, 0).lineTo(px, worldPy);
    grid.stroke({ color: gx % majorEvery === 0 ? COLOR.gridMajor : COLOR.grid, width: gx % majorEvery === 0 ? 2 : 1, alpha: 0.4 });
  }
  for (let gy = 0; gy <= options.gridHeight; gy += 10) {
    const py = gy * tileSize;
    grid.moveTo(0, py).lineTo(worldPx, py);
    grid.stroke({ color: gy % majorEvery === 0 ? COLOR.gridMajor : COLOR.grid, width: gy % majorEvery === 0 ? 2 : 1, alpha: 0.4 });
  }
  viewport.addChild(grid);

  const expeditionsLayer = new Container();
  expeditionsLayer.sortableChildren = true;
  viewport.addChild(expeditionsLayer);

  const entitiesLayer = new Container();
  entitiesLayer.sortableChildren = true;
  viewport.addChild(entitiesLayer);

  const visuals = new Map<string, EntityVisual>();
  const expeditionVisuals = new Map<string, ExpeditionVisualHandle>();
  let selectedId: string | null = null;

  const tileToWorld = (tx: number, ty: number) => ({ px: tx * tileSize + tileSize / 2, py: ty * tileSize + tileSize / 2 });
  const worldToScene = (point: { x: number; y: number }) => {
    const { px, py } = tileToWorld(point.x, point.y);
    return { x: px, y: py };
  };

  const styleFor = (entity: MapEntity): { color: number; radius: number; zIndex: number } => {
    if (entity.isMine || entity.kind === 'PLAYER_VILLAGE') {
      return { color: COLOR.myVillage, radius: 9, zIndex: 10 };
    }
    if (entity.kind === 'BARBARIAN_VILLAGE') {
      const tier = entity.tier ?? 'T1';
      const color = tier === 'T3' ? COLOR.barbarianT3 : tier === 'T2' ? COLOR.barbarianT2 : COLOR.barbarianT1;
      const radius = tier === 'T3' ? 8 : tier === 'T2' ? 7 : 6;
      return { color, radius, zIndex: 5 };
    }
    return { color: COLOR.other, radius: 6, zIndex: 3 };
  };

  const drawEntity = (visual: EntityVisual) => {
    const { graphic, sprite, data } = visual;
    const { color, radius, zIndex } = styleFor(data);
    const isSelected = data.id === selectedId;
    const alias = aliasFor(data);
    const texture = alias ? Assets.get<Texture>(alias) : null;

    graphic.clear();
    if (texture) {
      sprite.texture = texture;
      sprite.visible = true;
      sprite.width = WORLD_SPRITE_SIZE;
      sprite.height = WORLD_SPRITE_SIZE;
      if (isSelected) {
        graphic
          .circle(0, 0, WORLD_SPRITE_SIZE * 0.65)
          .stroke({ color: COLOR.selected, width: 3, alpha: 0.9 });
      }
    } else {
      sprite.visible = false;
      graphic
        .circle(0, 0, radius + (isSelected ? 4 : 0))
        .fill({ color: COLOR.outline, alpha: 0.55 });
      graphic.circle(0, 0, radius).fill(color);
      if (isSelected) {
        graphic.circle(0, 0, radius + 2).stroke({ color: COLOR.selected, width: 2 });
      }
    }
    visual.container.zIndex = zIndex + (isSelected ? 50 : 0);
    visual.label.text = data.name;
    visual.label.visible = isSelected;
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
        fontSize: 11,
        fill: 0xf1c40f,
        align: 'center',
        dropShadow: { alpha: 0.7, color: 0x000000, distance: 1, blur: 2, angle: Math.PI / 4 },
      },
    });
    label.anchor.set(0.5, 1.5);
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

  // Re-draw every entity once when a texture finishes loading, so the sprite
  // can replace the placeholder circle without waiting for the next reconcile.
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
    if (event.target === viewport || event.target === background || event.target === grid) {
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

  let textureRetryAccumulator = 0;
  const scene: PixiScene = {
    view,
    enter,
    exit,
    update: (deltaMs) => {
      const now = performance.now();
      expeditionVisuals.forEach((visual) => visual.tick(now));
      // Cheap retry every ~500ms while sprites are still placeholders.
      textureRetryAccumulator += deltaMs;
      if (textureRetryAccumulator >= 500) {
        textureRetryAccumulator = 0;
        retryAttachTextures();
      }
    },
  };

  return { scene, reconcile, reconcileExpeditions, setSelected, centerOn };
}
