import type { ExpeditionSnapshot } from '@/stores/expeditions';

type RecalledExpeditionPatch = Pick<ExpeditionSnapshot, 'phase' | 'target' | 'arrivalAt' | 'returnAt'>;

interface Point2 {
  x: number;
  y: number;
}

export function buildRecalledExpeditionPatch(
  snapshot: ExpeditionSnapshot,
  recallAt: number,
  returnAt: number,
): RecalledExpeditionPatch {
  const outboundDuration = snapshot.arrivalAt - snapshot.departAt;
  const outboundProgress =
    outboundDuration > 0 ? clamp01((recallAt - snapshot.departAt) / outboundDuration) : 0;

  return {
    phase: 'RETURNING',
    target: currentOutboundPoint(snapshot.origin, snapshot.target, outboundProgress),
    arrivalAt: recallAt,
    returnAt,
  };
}

export function inferRecallAt(departAt: number, returnAt: number, updatedAt?: number): number {
  if (updatedAt !== undefined && Number.isFinite(updatedAt)) {
    return updatedAt;
  }
  return departAt + (returnAt - departAt) / 2;
}

function currentOutboundPoint(origin: Point2, target: Point2, t: number): Point2 {
  const control = pathControl(origin, target);
  const oneMinusT = 1 - t;
  return {
    x: oneMinusT * oneMinusT * origin.x + 2 * oneMinusT * t * control.x + t * t * target.x,
    y: oneMinusT * oneMinusT * origin.y + 2 * oneMinusT * t * control.y + t * t * target.y,
  };
}

function pathControl(origin: Point2, target: Point2): Point2 {
  const mid = { x: (origin.x + target.x) / 2, y: (origin.y + target.y) / 2 };
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return mid;
  const nx = -dy / length;
  const ny = dx / length;
  const offset = length * 0.25;
  return { x: mid.x + nx * offset, y: mid.y + ny * offset };
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
