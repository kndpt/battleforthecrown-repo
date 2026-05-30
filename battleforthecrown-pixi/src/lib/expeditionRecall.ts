import type { ExpeditionSnapshot } from '@/stores/expeditions';
import { clamp01 } from '@/lib/math';
import { pathControl, pathPointAt, type Point2 } from '@/lib/pathGeometry';

type RecalledExpeditionPatch = Pick<ExpeditionSnapshot, 'phase' | 'target' | 'arrivalAt' | 'returnAt'>;

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
  return pathPointAt(origin, pathControl(origin, target), target, t);
}
