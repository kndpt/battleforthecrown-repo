import { Assets, Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import type { BuildingDto } from "@/api";
import { metaFor } from "@/features/village/buildingMeta";
import { computeConstructionProgress } from "@/features/village/constructionProgress";

const COLOR = {
  idle: 0x6b4d2c,
  idleAccent: 0xa37b46,
  construction: 0x5c4a30,
  border: 0x2a1a0a,
  selected: 0xf1c40f,
  flash: 0xfff9d8,
  progressFill: 0x6ebf49,
  progressBg: 0x1a120b,
  textShadow: 0x000000,
};

const COLOR_BY_TYPE: Record<string, number> = {
  CASTLE: 0x9b6b2c,
  WOOD: 0x6b8e23,
  STONE: 0x8a8276,
  IRON: 0x6e7783,
  WAREHOUSE: 0x9c6f2e,
  QUARTER: 0xc7a64e,
  BARRACKS: 0x7a3b2a,
  WATCHTOWER: 0x4a4a55,
  WALL: 0x6b6155,
  HIDEOUT: 0x4a3a2a,
};

const SIZE_BY_TYPE: Record<string, number> = {
  CASTLE: 220,
  WAREHOUSE: 170,
  QUARTER: 170,
  BARRACKS: 170,
  WATCHTOWER: 170,
  WALL: 200,
  WOOD: 170,
  STONE: 170,
  IRON: 170,
  HIDEOUT: 170,
  COUNCIL_HALL: 170,
  THRONE_HALL: 170,
};

const ALIAS_BY_TYPE: Record<string, string> = {
  CASTLE: "castle",
  WOOD: "wood",
  STONE: "stone",
  IRON: "iron",
  WAREHOUSE: "warehouse",
  QUARTER: "quarter",
  BARRACKS: "barracks",
  WATCHTOWER: "watchtower",
  COUNCIL_HALL: "council-hall",
  THRONE_HALL: "throne-hall",
};

function resolveTexture(type: string): Texture | null {
  const alias = ALIAS_BY_TYPE[type];
  if (!alias) return null;
  // Assets.get() returns the cached texture if loaded, undefined otherwise.
  const fromBundle = Assets.get<Texture>(alias);
  if (fromBundle) return fromBundle;
  return null;
}

export interface BuildingSpriteHandle {
  container: Container;
  setBuilding: (building: BuildingDto) => void;
  setSelected: (selected: boolean) => void;
  /** Drives the construction progress bar visual (called per-frame by VillageScene). */
  tick: (nowMs: number) => void;
  flash: () => void;
  destroy: () => void;
}

export interface BuildingSpriteOptions {
  building: BuildingDto;
  onClick?: (buildingId: string) => void;
  onHover?: (buildingId: string | null) => void;
}

export function createBuildingSprite(
  options: BuildingSpriteOptions,
): BuildingSpriteHandle {
  const { onClick, onHover } = options;

  const container = new Container();
  container.eventMode = "static";
  container.cursor = "pointer";

  const haloGraphic = new Graphics();
  haloGraphic.alpha = 0;
  container.addChild(haloGraphic);

  const fallbackGraphic = new Graphics();
  container.addChild(fallbackGraphic);

  const sprite = new Sprite();
  sprite.anchor.set(0.5);
  sprite.visible = false;
  container.addChild(sprite);

  const flashGraphic = new Graphics();
  flashGraphic.alpha = 0;
  container.addChild(flashGraphic);

  const meta = metaFor(options.building.type);
  const fallbackText = new Text({
    text: meta.emoji,
    style: {
      fontFamily: "Apple Color Emoji, Segoe UI Emoji, Cinzel, serif",
      fontSize: 56,
      align: "center",
    },
  });
  fallbackText.anchor.set(0.5);
  fallbackText.visible = false;
  container.addChild(fallbackText);

  const levelText = new Text({
    text: `Niv. ${options.building.level}`,
    style: {
      fontFamily: "Cinzel, Georgia, serif",
      fontSize: 22,
      fill: 0xf1c40f,
      align: "center",
      dropShadow: {
        alpha: 0.7,
        color: COLOR.textShadow,
        distance: 2,
        blur: 3,
        angle: Math.PI / 4,
      },
    },
  });
  levelText.anchor.set(0.5, 0);
  container.addChild(levelText);

  const scaffoldGraphic = new Graphics();
  scaffoldGraphic.visible = false;
  container.addChild(scaffoldGraphic);

  const progressContainer = new Container();
  progressContainer.visible = false;
  container.addChild(progressContainer);

  const progressBg = new Graphics();
  progressContainer.addChild(progressBg);
  const progressFill = new Graphics();
  progressContainer.addChild(progressFill);

  let current: BuildingDto = options.building;
  let selected = false;
  let flashUntil = 0;

  const tryAttachTexture = () => {
    const texture = resolveTexture(current.type);
    if (texture) {
      sprite.texture = texture;
      sprite.visible = true;
      fallbackGraphic.clear();
      fallbackText.visible = false;
      const size = SIZE_BY_TYPE[current.type] ?? 130;
      sprite.width = size;
      sprite.height = size;
    } else {
      sprite.visible = false;
      fallbackText.visible = true;
    }
  };

  const draw = () => {
    const size = SIZE_BY_TYPE[current.type] ?? 130;
    const half = size / 2;
    const baseColor = COLOR_BY_TYPE[current.type] ?? COLOR.idle;
    const inConstruction = Boolean(current.startTime && current.endTime);

    tryAttachTexture();

    // Fallback graphic only paints when no sprite texture is available.
    fallbackGraphic.clear();
    if (!sprite.visible) {
      fallbackGraphic
        .roundRect(-half, -half, size, size, 14)
        .fill(baseColor)
        .stroke({ color: COLOR.border, width: 6, alpha: 0.9 });
      fallbackGraphic
        .roundRect(-half + 8, -half + 8, size - 16, size / 4, 8)
        .fill({ color: COLOR.idleAccent, alpha: 0.7 });
    }

    // Construction overlay: dim the building to signal it's under construction.
    // The progress bar above is the precise indicator; this is just the visual cue.
    scaffoldGraphic.clear();
    scaffoldGraphic.visible = inConstruction;
    if (inConstruction) {
      scaffoldGraphic
        .roundRect(-half, -half, size, size, 14)
        .fill({ color: COLOR.construction, alpha: 0.45 });
    }

    haloGraphic.clear();
    if (selected) {
      haloGraphic
        .circle(0, 0, half + 24)
        .fill({ color: COLOR.selected, alpha: 0.18 });
      haloGraphic.alpha = 1;
    } else {
      haloGraphic.alpha = 0;
    }

    flashGraphic.clear();
    flashGraphic
      .roundRect(-half, -half, size, size, 14)
      .fill({ color: COLOR.flash, alpha: 1 });

    levelText.text =
      current.level >= current.maxLevel ? "Niv. MAX" : `Niv. ${current.level}`;
    levelText.position.set(0, half + 6);

    progressContainer.visible = inConstruction;
    if (inConstruction) {
      progressBg.clear();
      progressBg
        .roundRect(-half, -half - 24, size, 10, 4)
        .fill({ color: COLOR.progressBg, alpha: 0.85 })
        .stroke({ color: COLOR.border, width: 2, alpha: 0.8 });
    }
  };

  const tick = (nowMs: number) => {
    if (current.startTime && current.endTime) {
      const progress = computeConstructionProgress(
        { startTime: current.startTime, endTime: current.endTime },
        nowMs,
      );
      const size = SIZE_BY_TYPE[current.type] ?? 130;
      const half = size / 2;
      const fillWidth = (size * progress.percent) / 100;
      progressFill.clear();
      progressFill
        .roundRect(-half + 1, -half - 23, Math.max(2, fillWidth - 2), 8, 3)
        .fill(COLOR.progressFill);
    }
    if (flashUntil > 0) {
      const remaining = flashUntil - nowMs;
      if (remaining <= 0) {
        flashGraphic.alpha = 0;
        flashUntil = 0;
      } else {
        flashGraphic.alpha = Math.max(0, remaining / 500);
      }
    }
    // Texture might not have been ready when the sprite was created; retry
    // every tick until it lands. Cheap (just a Map lookup).
    if (!sprite.visible && ALIAS_BY_TYPE[current.type]) {
      tryAttachTexture();
    }
  };

  container.on("pointertap", (event) => {
    event.stopPropagation();
    onClick?.(current.id);
  });
  container.on("pointerover", () => onHover?.(current.id));
  container.on("pointerout", () => onHover?.(null));

  draw();

  return {
    container,
    setBuilding(building) {
      current = building;
      fallbackText.text = metaFor(building.type).emoji;
      draw();
    },
    setSelected(value) {
      if (selected === value) return;
      selected = value;
      draw();
    },
    tick,
    flash() {
      flashUntil = Date.now() + 500;
      flashGraphic.alpha = 1;
    },
    destroy() {
      container.removeAllListeners();
      container.destroy({ children: true });
    },
  };
}
