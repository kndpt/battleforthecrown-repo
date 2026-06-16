import { Container, Graphics, type Application, type FederatedPointerEvent } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import type { PixiScene } from './SceneManager';
import type { BuildingDto } from '@/api';
import { createBuildingSprite, type BuildingSpriteHandle } from '@/pixi/entities/BuildingSprite';
import { VILLAGE_BOUNDS, placementFor } from './villageLayout';
import { getBuildingLockState } from '@/features/village/buildingLockState';

const COLOR = {
  grass: 0x3c5a2c,
  grassAccent: 0x4d6f3a,
  path: 0x9b7e4f,
  pathBorder: 0x6c5430,
};

export interface VillageSceneOptions {
  onSelectBuilding?: (buildingId: string | null) => void;
  onHoverBuilding?: (buildingId: string | null) => void;
}

export interface VillageSceneHandle {
  scene: PixiScene;
  reconcile: (buildings: BuildingDto[]) => void;
  setSelected: (buildingId: string | null) => void;
  flashBuilding: (buildingId: string) => void;
  centerOnBuilding: (buildingId: string) => void;
}

export function createVillageScene(app: Application, options: VillageSceneOptions = {}): VillageSceneHandle {
  const view = new Container();

  const viewport = new Viewport({
    screenWidth: app.screen.width,
    screenHeight: app.screen.height,
    worldWidth: VILLAGE_BOUNDS.width,
    worldHeight: VILLAGE_BOUNDS.height,
    events: app.renderer.events,
  });

  viewport
    .drag()
    .pinch()
    .wheel({ smooth: 4 })
    .decelerate({ friction: 0.92 })
    .clampZoom({ minScale: 0.5, maxScale: 2.5 })
    .clamp({ direction: 'all' });

  view.addChild(viewport);

  // Grass background
  const grass = new Graphics();
  grass
    .rect(0, 0, VILLAGE_BOUNDS.width, VILLAGE_BOUNDS.height)
    .fill(COLOR.grass);

  // Subtle horizontal stripes for depth
  for (let y = 0; y < VILLAGE_BOUNDS.height; y += 80) {
    grass
      .rect(0, y, VILLAGE_BOUNDS.width, 40)
      .fill({ color: COLOR.grassAccent, alpha: 0.18 });
  }
  viewport.addChild(grass);

  // Central vertical path
  const pathWidth = 140;
  const path = new Graphics();
  path
    .rect((VILLAGE_BOUNDS.width - pathWidth) / 2, 0, pathWidth, VILLAGE_BOUNDS.height)
    .fill(COLOR.path)
    .stroke({ color: COLOR.pathBorder, width: 4, alpha: 0.6 });
  viewport.addChild(path);

  const buildingsLayer = new Container();
  buildingsLayer.sortableChildren = true;
  viewport.addChild(buildingsLayer);

  const sprites = new Map<string, BuildingSpriteHandle>();
  let selectedId: string | null = null;

  // Background tap clears selection
  viewport.eventMode = 'static';
  viewport.on('pointertap', (event: FederatedPointerEvent) => {
    if (event.target === viewport || event.target === grass || event.target === path) {
      options.onSelectBuilding?.(null);
    }
  });

  const handleResize = () => {
    viewport.resize(app.screen.width, app.screen.height, VILLAGE_BOUNDS.width, VILLAGE_BOUNDS.height);
  };

  const enter = (a: Application) => {
    handleResize();
    a.renderer.on('resize', handleResize);
    viewport.setZoom(0.7, false);
    viewport.moveCenter(VILLAGE_BOUNDS.width / 2, VILLAGE_BOUNDS.height / 2);
  };

  const exit = () => {
    app.renderer.off('resize', handleResize);
    viewport.removeAllListeners();
    sprites.forEach((sprite) => sprite.destroy());
    sprites.clear();
  };

  const update = (deltaMs: number) => {
    const now = Date.now();
    void deltaMs;
    sprites.forEach((sprite) => sprite.tick(now));
  };

  const ensureSprite = (building: BuildingDto): BuildingSpriteHandle => {
    let sprite = sprites.get(building.id);
    if (!sprite) {
      sprite = createBuildingSprite({
        building,
        onClick: (id) => options.onSelectBuilding?.(id),
        onHover: (id) => options.onHoverBuilding?.(id),
      });
      const placement = placementFor(building.type);
      sprite.container.position.set(placement.x, placement.y);
      sprite.container.zIndex = placement.zIndex;
      buildingsLayer.addChild(sprite.container);
      sprites.set(building.id, sprite);
    } else {
      sprite.setBuilding(building);
    }
    return sprite;
  };

  const reconcile = (buildings: BuildingDto[]) => {
    const castleLevel = buildings.find((building) => building.type === 'CASTLE')?.level ?? 0;
    const visibleBuildings = buildings.filter((building) => {
      const state = getBuildingLockState(building, castleLevel).state;
      return state !== 'unbuilt-locked' && state !== 'unbuilt-available';
    });
    const next = new Set(visibleBuildings.map((b) => b.id));
    for (const id of Array.from(sprites.keys())) {
      if (!next.has(id)) {
        const sprite = sprites.get(id);
        if (sprite) {
          buildingsLayer.removeChild(sprite.container);
          sprite.destroy();
        }
        sprites.delete(id);
      }
    }
    for (const building of visibleBuildings) {
      ensureSprite(building);
    }
    if (selectedId && !next.has(selectedId)) {
      selectedId = null;
    }
  };

  const setSelected = (buildingId: string | null) => {
    if (selectedId === buildingId) return;
    if (selectedId) {
      sprites.get(selectedId)?.setSelected(false);
    }
    selectedId = buildingId;
    if (buildingId) {
      sprites.get(buildingId)?.setSelected(true);
    }
  };

  const flashBuilding = (buildingId: string) => {
    sprites.get(buildingId)?.flash();
  };

  const centerOnBuilding = (buildingId: string) => {
    const sprite = sprites.get(buildingId);
    if (sprite) {
      const { x, y } = sprite.container.position;
      viewport.moveCenter(x, y);
    }
  };

  const scene: PixiScene = {
    view,
    enter,
    exit,
    update,
  };

  return { scene, reconcile, setSelected, flashBuilding, centerOnBuilding };
}
