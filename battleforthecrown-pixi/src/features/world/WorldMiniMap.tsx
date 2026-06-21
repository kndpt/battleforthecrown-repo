import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { clamp } from '@/lib/math';
import type { MapEntity } from '@/api/world-types';
import type { ExpeditionSnapshot } from '@/stores/expeditions';
import type { VisionDisk } from '@battleforthecrown/shared/world';

interface WorldMiniMapProps {
  gridWidth: number;
  gridHeight: number;
  entities: MapEntity[];
  expeditions: ExpeditionSnapshot[];
  myVillage: MapEntity | null;
  visionDisks: readonly VisionDisk[];
  /** Tile coords currently centred in the main viewport (for the camera box). */
  cameraCenter: { x: number; y: number };
  /** Visible viewport size in world tiles (for the camera box). */
  viewportTiles: { width: number; height: number };
  onRecenter?: (tileX: number, tileY: number) => void;
}

// ─── Cartographic palette (cohérente avec le thème bois/or de la HUD) ────────
// Fog : tout est sombre, seules les zones de vision révèlent la terre.
const UNREVEALED = '#16110a';
const LAND_REVEAL = '#5d6c3c';
const LAND_REVEAL_EDGE = 'rgba(67, 81, 42, 0)';
const OUT_OF_WORLD = 'rgba(10, 7, 4, 0.7)';
const GRID_COLOR = 'rgba(255, 243, 200, 0.06)';
const GRID_STEP_TILES = 50;
const FRAME_GOLD = 'rgba(214, 178, 92, 0.75)';
const VIEWBOX_GOLD = 'rgba(255, 236, 195, 0.95)';
const VIEWBOX_SHADE = 'rgba(0, 0, 0, 0.28)';

const KIND_COLOR: Record<string, string> = {
  PLAYER_VILLAGE: 'rgba(206, 158, 108, 0.95)',
  BARBARIAN_VILLAGE: 'rgba(214, 98, 92, 0.98)',
  OTHER: 'rgba(160, 160, 160, 0.7)',
};

const EXPEDITION_COLOR: Record<string, string> = {
  ATTACK: 'rgba(96, 168, 70, 0.85)',
  REINFORCE: 'rgba(96, 190, 224, 0.9)',
};

/** Geometry of the (square) world drawn "contain"-fitted into a w×h panel. */
function fitGeometry(w: number, h: number) {
  const drawSize = Math.min(w, h);
  return { drawSize, offX: (w - drawSize) / 2, offY: (h - drawSize) / 2 };
}

/**
 * Full-width cartographic mini-map filling its parent (the top half of the
 * world view). Canvas2D — markers are tiny dots, doesn't warrant a 2nd Pixi
 * instance. Tap / drag recentres the main camera (feature preserved).
 */
export function WorldMiniMap({
  gridWidth,
  gridHeight,
  entities,
  expeditions,
  myVillage,
  visionDisks,
  cameraCenter,
  viewportTiles,
  onRecenter,
}: WorldMiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });

  // Track the panel size so the canvas + projection stay responsive.
  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setBox({ w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const recenterFromPointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!onRecenter || !box.w || !box.h) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const { drawSize, offX, offY } = fitGeometry(box.w, box.h);
    const px = event.clientX - rect.left - offX;
    const py = event.clientY - rect.top - offY;
    const tileX = clamp((px / drawSize) * gridWidth, 0, gridWidth);
    const tileY = clamp((py / drawSize) * gridHeight, 0, gridHeight);
    onRecenter(tileX, tileY);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    recenterFromPointer(event);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    recenterFromPointer(event);
  };

  const stopDrag = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    activePointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !box.w || !box.h) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = box.w * dpr;
    canvas.height = box.h * dpr;
    canvas.style.width = `${box.w}px`;
    canvas.style.height = `${box.h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { drawSize, offX, offY } = fitGeometry(box.w, box.h);
    const sx = drawSize / gridWidth;
    const sy = drawSize / gridHeight;
    const tx = (tile: number) => offX + tile * sx;
    const ty = (tile: number) => offY + tile * sy;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, box.w, box.h);

    // Letterbox bands around the square world.
    ctx.fillStyle = OUT_OF_WORLD;
    ctx.fillRect(0, 0, box.w, box.h);

    // Land plate (clipped to the world square).
    ctx.save();
    ctx.beginPath();
    ctx.rect(offX, offY, drawSize, drawSize);
    ctx.clip();

    // Unrevealed fog over the whole world; only vision disks reveal the land
    // (soft radial edge so it fades back into the dark).
    ctx.fillStyle = UNREVEALED;
    ctx.fillRect(offX, offY, drawSize, drawSize);

    for (const disk of visionDisks) {
      if (disk.radius <= 0) continue;
      const cx = tx(disk.x);
      const cy = ty(disk.y);
      const r = disk.radius * Math.max(sx, sy);
      // Solid disk with only a thin soft edge — a clean revealed circle, not a
      // fuzzy "spray".
      const reveal = ctx.createRadialGradient(cx, cy, Math.max(1, r * 0.88), cx, cy, r);
      reveal.addColorStop(0, LAND_REVEAL);
      reveal.addColorStop(0.88, LAND_REVEAL);
      reveal.addColorStop(1, LAND_REVEAL_EDGE);
      ctx.fillStyle = reveal;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cartographic grid (subtle; reads only over the revealed land).
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let g = 0; g <= gridWidth; g += GRID_STEP_TILES) {
      ctx.beginPath();
      ctx.moveTo(tx(g), offY);
      ctx.lineTo(tx(g), offY + drawSize);
      ctx.stroke();
    }
    for (let g = 0; g <= gridHeight; g += GRID_STEP_TILES) {
      ctx.beginPath();
      ctx.moveTo(offX, ty(g));
      ctx.lineTo(offX + drawSize, ty(g));
      ctx.stroke();
    }

    // Expedition routes.
    for (const expedition of expeditions) {
      if (expedition.phase === 'RETURNED') continue;
      ctx.strokeStyle =
        expedition.kind === 'REINFORCE' ? EXPEDITION_COLOR.REINFORCE : EXPEDITION_COLOR.ATTACK;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(tx(expedition.origin.x), ty(expedition.origin.y));
      ctx.lineTo(tx(expedition.target.x), ty(expedition.target.y));
      ctx.stroke();
    }

    // Foreign entities.
    for (const e of entities) {
      if (e.isMine) continue;
      ctx.fillStyle = KIND_COLOR[e.kind] ?? KIND_COLOR.OTHER;
      ctx.beginPath();
      ctx.arc(tx(e.x), ty(e.y), 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Own villages (active one highlighted).
    for (const e of entities) {
      if (!e.isMine) continue;
      const isActive = e.id === myVillage?.id;
      ctx.fillStyle = isActive ? '#eaf7ff' : 'rgba(96, 178, 216, 0.9)';
      ctx.strokeStyle = '#1f5288';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(tx(e.x), ty(e.y), isActive ? 3.6 : 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Camera viewbox (shaded fill + gold outline).
    const boxW = viewportTiles.width * sx;
    const boxH = viewportTiles.height * sy;
    const boxX = tx(cameraCenter.x) - boxW / 2;
    const boxY = ty(cameraCenter.y) - boxH / 2;
    ctx.fillStyle = VIEWBOX_SHADE;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = VIEWBOX_GOLD;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.restore();

    // World square frame.
    ctx.strokeStyle = FRAME_GOLD;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(offX + 0.75, offY + 0.75, drawSize - 1.5, drawSize - 1.5);

    ctx.restore();
  }, [
    box,
    gridWidth,
    gridHeight,
    entities,
    expeditions,
    myVillage,
    visionDisks,
    cameraCenter,
    viewportTiles,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
    />
  );
}
