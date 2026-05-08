import { Container, Graphics, Text } from 'pixi.js';
import type { ExpeditionSnapshot } from '@/stores/expeditions';
import { BATTLE_FLASH_DURATION_MS } from '@/lib/expeditionTiming';
import {
  computeProgress,
  pathControl,
  pathPointAt,
  type Point2,
} from './expeditionMath';

const COLOR = {
  enRoute: 0x4a8c2a,
  resolvedVictory: 0xf1c40f,
  resolvedDefeat: 0xc0392b,
  returning: 0x95a5a6,
  dust: 0xe6c98c,
  flash: 0xfff9d8,
};

export interface ExpeditionVisualHandle {
  container: Container;
  setSnapshot: (snapshot: ExpeditionSnapshot) => void;
  tick: (nowMs: number) => void;
  destroy: () => void;
}

export interface ExpeditionVisualOptions {
  snapshot: ExpeditionSnapshot;
  /** Pixi-space conversion: world coords → scene coords. */
  worldToScene: (point: Point2) => Point2;
}

interface DustParticle {
  graphic: Graphics;
  bornAt: number;
  ttlMs: number;
  cx: number;
  cy: number;
  radius: number;
}

const DUST_TTL_MS = 600;
const DUST_INTERVAL_MS = 90;

export function createExpeditionVisual(options: ExpeditionVisualOptions): ExpeditionVisualHandle {
  const container = new Container();
  container.sortableChildren = true;

  const pathGraphic = new Graphics();
  pathGraphic.zIndex = 1;
  container.addChild(pathGraphic);

  const dustLayer = new Container();
  dustLayer.zIndex = 2;
  container.addChild(dustLayer);

  const flashGraphic = new Graphics();
  flashGraphic.zIndex = 4;
  flashGraphic.alpha = 0;
  container.addChild(flashGraphic);

  const unit = new Container();
  unit.zIndex = 5;
  container.addChild(unit);

  const unitGlyph = new Text({
    text: '⚔️',
    style: {
      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Cinzel, serif',
      fontSize: 28,
      align: 'center',
    },
  });
  unitGlyph.anchor.set(0.5);
  unit.addChild(unitGlyph);

  let snapshot = options.snapshot;
  let lastDustEmit = 0;
  const dust: DustParticle[] = [];
  let flashUntil = 0;
  let lastPhase = snapshot.phase;

  const drawPath = () => {
    const origin = options.worldToScene(snapshot.origin);
    const target = options.worldToScene(snapshot.target);
    const control = pathControl(origin, target);

    const color =
      snapshot.phase === 'RETURNING' || snapshot.phase === 'RETURNED'
        ? COLOR.returning
        : snapshot.phase === 'RESOLVED'
          ? snapshot.isVictory
            ? COLOR.resolvedVictory
            : COLOR.resolvedDefeat
          : COLOR.enRoute;

    pathGraphic.clear();
    if (snapshot.phase === 'RETURNED') {
      // Troops are home. Don't render a stale trail; the snapshot will be
      // dropped from the store on the next tick.
      return { origin, control, target };
    }
    pathGraphic.moveTo(origin.x, origin.y);
    pathGraphic.quadraticCurveTo(control.x, control.y, target.x, target.y);
    pathGraphic.stroke({
      color,
      width: snapshot.phase === 'EN_ROUTE' ? 3 : 2,
      alpha: snapshot.phase === 'RETURNING' ? 0.55 : 0.85,
    });

    return { origin, control, target };
  };

  let geometry = drawPath();

  const triggerFlash = () => {
    // Same epoch-ms time base as `tick(nowMs)` to keep `flashUntil - now`
    // meaningful.
    flashUntil = Date.now() + BATTLE_FLASH_DURATION_MS;
    flashGraphic.alpha = 1;
  };

  const drawFlash = (now: number) => {
    if (flashUntil <= 0) {
      flashGraphic.alpha = 0;
      return;
    }
    const remaining = flashUntil - now;
    if (remaining <= 0) {
      flashGraphic.alpha = 0;
      flashUntil = 0;
      flashGraphic.clear();
      return;
    }
    const ratio = remaining / BATTLE_FLASH_DURATION_MS;
    const radius = 36 * (1 + (1 - ratio) * 1.4);
    const target = options.worldToScene(snapshot.target);
    flashGraphic.clear();
    flashGraphic
      .circle(target.x, target.y, radius)
      .stroke({ color: COLOR.flash, width: 4, alpha: ratio });
    flashGraphic
      .circle(target.x, target.y, radius * 0.55)
      .fill({ color: COLOR.flash, alpha: ratio * 0.4 });
  };

  const emitDust = (now: number, x: number, y: number) => {
    if (now - lastDustEmit < DUST_INTERVAL_MS) return;
    lastDustEmit = now;
    const graphic = new Graphics();
    const radius = 4 + Math.random() * 3;
    graphic.circle(0, 0, radius).fill({ color: COLOR.dust, alpha: 0.6 });
    graphic.position.set(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6);
    dustLayer.addChild(graphic);
    dust.push({ graphic, bornAt: now, ttlMs: DUST_TTL_MS, cx: x, cy: y, radius });
  };

  const stepDust = (now: number) => {
    for (let i = dust.length - 1; i >= 0; i -= 1) {
      const particle = dust[i];
      const age = now - particle.bornAt;
      if (age >= particle.ttlMs) {
        dustLayer.removeChild(particle.graphic);
        particle.graphic.destroy();
        dust.splice(i, 1);
        continue;
      }
      const ratio = 1 - age / particle.ttlMs;
      particle.graphic.alpha = ratio * 0.6;
      particle.graphic.scale.set(1 + (1 - ratio) * 0.5);
    }
  };

  const tick = (nowMs: number) => {
    const progress = computeProgress(
      {
        departAt: snapshot.departAt,
        arrivalAt: snapshot.arrivalAt,
        returnAt: snapshot.returnAt,
        phase: snapshot.phase,
      },
      nowMs,
    );

    if (progress.moving) {
      const point = pathPointAt(geometry.origin, geometry.control, geometry.target, progress.t);
      unit.position.set(point.x, point.y);
      unit.visible = true;
      unitGlyph.text = progress.returning ? '🐎' : '⚔️';
      emitDust(nowMs, point.x, point.y);
    } else if (snapshot.phase === 'EN_ROUTE' || snapshot.phase === 'RESOLVED') {
      const point = pathPointAt(geometry.origin, geometry.control, geometry.target, 1);
      unit.position.set(point.x, point.y);
      unit.visible = snapshot.phase === 'EN_ROUTE';
    } else {
      unit.visible = false;
    }

    drawFlash(nowMs);
    stepDust(nowMs);
  };

  const setSnapshot = (next: ExpeditionSnapshot) => {
    snapshot = next;
    geometry = drawPath();
    if (next.phase === 'RESOLVED' && lastPhase !== 'RESOLVED') {
      triggerFlash();
    }
    lastPhase = next.phase;
  };

  const destroy = () => {
    for (const particle of dust) {
      particle.graphic.destroy();
    }
    dust.length = 0;
    container.destroy({ children: true });
  };

  return { container, setSnapshot, tick, destroy };
}
