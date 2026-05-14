import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
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

const SIZE = 180;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const KIND_COLOR: Record<string, string> = {
  PLAYER_VILLAGE: 'rgba(200, 150, 100, 0.9)',
  BARBARIAN_VILLAGE: 'rgba(208, 98, 92, 0.95)',
  OTHER: 'rgba(150, 150, 150, 0.7)',
};

const EXPEDITION_COLOR: Record<string, string> = {
  ATTACK: 'rgba(74, 140, 42, 0.8)',
  REINFORCE: 'rgba(79, 179, 216, 0.85)',
};

/**
 * Lightweight Canvas2D mini-map. Re-rendered on every prop change. Doesn't
 * warrant a second Pixi instance — markers are tiny dots.
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

  const recenterFromPointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!onRecenter) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const tileX = clamp(((event.clientX - rect.left) / rect.width) * gridWidth, 0, gridWidth);
    const tileY = clamp(((event.clientY - rect.top) / rect.height) * gridHeight, 0, gridHeight);
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
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Background
    ctx.fillStyle = 'rgba(20, 14, 8, 0.92)';
    ctx.fillRect(0, 0, SIZE, SIZE);

    const sx = SIZE / gridWidth;
    const sy = SIZE / gridHeight;

    // Vision disks
    for (const disk of visionDisks) {
      if (disk.radius <= 0) continue;
      const cx = disk.x * sx;
      const cy = disk.y * sy;
      const r = disk.radius * Math.max(sx, sy);
      ctx.fillStyle = 'rgba(246, 214, 123, 0.18)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Entities
    for (const expedition of expeditions) {
      if (expedition.phase === 'RETURNED') continue;
      ctx.strokeStyle =
        expedition.kind === 'REINFORCE' ? EXPEDITION_COLOR.REINFORCE : EXPEDITION_COLOR.ATTACK;
      ctx.lineWidth = expedition.kind === 'REINFORCE' ? 1.4 : 1.2;
      ctx.beginPath();
      ctx.moveTo(expedition.origin.x * sx, expedition.origin.y * sy);
      ctx.lineTo(expedition.target.x * sx, expedition.target.y * sy);
      ctx.stroke();
    }

    for (const e of entities) {
      if (e.isMine) continue;
      ctx.fillStyle = KIND_COLOR[e.kind] ?? KIND_COLOR.OTHER;
      ctx.beginPath();
      ctx.arc(e.x * sx, e.y * sy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Own villages (selected one brighter)
    for (const e of entities) {
      if (!e.isMine) continue;
      ctx.fillStyle = e.id === myVillage?.id ? '#f6e7b1' : 'rgba(246, 231, 177, 0.72)';
      ctx.strokeStyle = '#a07028';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(e.x * sx, e.y * sy, e.id === myVillage?.id ? 3.2 : 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Camera viewbox
    const boxW = viewportTiles.width * sx;
    const boxH = viewportTiles.height * sy;
    const boxX = cameraCenter.x * sx - boxW / 2;
    const boxY = cameraCenter.y * sy - boxH / 2;
    ctx.strokeStyle = 'rgba(255, 236, 195, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Border
    ctx.strokeStyle = 'rgba(246, 214, 123, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1);

    ctx.restore();
  }, [
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
      className={`touch-none rounded-md shadow-lg ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
    />
  );
}
