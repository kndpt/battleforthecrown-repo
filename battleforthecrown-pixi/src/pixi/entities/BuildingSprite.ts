import { Container, Graphics, Text } from 'pixi.js';
import type { BuildingDto } from '@/api';
import { metaFor } from '@/features/village/buildingMeta';
import { computeConstructionProgress } from '@/features/village/constructionProgress';

const COLOR = {
  idle: 0x6b4d2c,
  idleAccent: 0xa37b46,
  construction: 0x5c4a30,
  constructionStripes: 0xf1c40f,
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
  FARM: 0xc7a64e,
  BARRACKS: 0x7a3b2a,
  WATCHTOWER: 0x4a4a55,
  WALL: 0x6b6155,
  HIDEOUT: 0x4a3a2a,
};

const SIZE_BY_TYPE: Record<string, number> = {
  CASTLE: 220,
  WAREHOUSE: 160,
  FARM: 150,
  BARRACKS: 160,
  WATCHTOWER: 110,
  WALL: 200,
  WOOD: 130,
  STONE: 130,
  IRON: 130,
  HIDEOUT: 120,
};

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

export function createBuildingSprite(options: BuildingSpriteOptions): BuildingSpriteHandle {
  const { onClick, onHover } = options;

  const container = new Container();
  container.eventMode = 'static';
  container.cursor = 'pointer';

  const haloGraphic = new Graphics();
  haloGraphic.alpha = 0;
  container.addChild(haloGraphic);

  const flashGraphic = new Graphics();
  flashGraphic.alpha = 0;
  container.addChild(flashGraphic);

  const buildingGraphic = new Graphics();
  container.addChild(buildingGraphic);

  const meta = metaFor(options.building.type);
  const emojiText = new Text({
    text: meta.emoji,
    style: {
      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Cinzel, serif',
      fontSize: 56,
      align: 'center',
    },
  });
  emojiText.anchor.set(0.5);
  container.addChild(emojiText);

  const levelText = new Text({
    text: `Niv. ${options.building.level}`,
    style: {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: 22,
      fill: 0xf1c40f,
      align: 'center',
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

  const draw = () => {
    const size = SIZE_BY_TYPE[current.type] ?? 130;
    const half = size / 2;
    const baseColor = COLOR_BY_TYPE[current.type] ?? COLOR.idle;
    const inConstruction = Boolean(current.startTime && current.endTime);

    buildingGraphic.clear();
    buildingGraphic
      .roundRect(-half, -half, size, size, 14)
      .fill(inConstruction ? COLOR.construction : baseColor)
      .stroke({ color: COLOR.border, width: 6, alpha: 0.9 });
    if (!inConstruction) {
      buildingGraphic
        .roundRect(-half + 8, -half + 8, size - 16, size / 4, 8)
        .fill({ color: COLOR.idleAccent, alpha: 0.7 });
    } else {
      // diagonal scaffolding stripes
      const step = 18;
      for (let i = -half; i < half; i += step) {
        buildingGraphic
          .moveTo(i, -half)
          .lineTo(i + size, half)
          .stroke({ color: COLOR.constructionStripes, width: 2, alpha: 0.6 });
      }
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

    levelText.text = current.level >= current.maxLevel ? 'Niv. MAX' : `Niv. ${current.level}`;
    levelText.position.set(0, half + 6);

    progressContainer.visible = inConstruction;
    if (inConstruction) {
      progressBg.clear();
      progressBg
        .roundRect(-half, -half - 24, size, 10, 4)
        .fill({ color: COLOR.progressBg, alpha: 0.85 })
        .stroke({ color: COLOR.border, width: 2, alpha: 0.8 });

      progressContainer.position.set(0, 0);
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
  };

  container.on('pointertap', (event) => {
    event.stopPropagation();
    onClick?.(current.id);
  });
  container.on('pointerover', () => onHover?.(current.id));
  container.on('pointerout', () => onHover?.(null));

  draw();

  return {
    container,
    setBuilding(building) {
      current = building;
      emojiText.text = metaFor(building.type).emoji;
      draw();
    },
    setSelected(value) {
      if (selected === value) return;
      selected = value;
      draw();
    },
    tick,
    flash() {
      flashUntil = performance.now() + 500;
      flashGraphic.alpha = 1;
    },
    destroy() {
      container.destroy({ children: true });
    },
  };
}
