import type { UnitMap } from '../army/unit-map';
import type { Position } from '../world/barbarian-geometry';

export const ONBOARDING_NARRATIVE_TARGET_NAME = 'Campement du débutant';

export const ONBOARDING_NARRATIVE_TARGET_UNITS: UnitMap = {
  MILITIA: 2,
};

export function findOnboardingNarrativeTargetPosition(params: {
  centerX: number;
  centerY: number;
  worldWidth: number;
  worldHeight: number;
  minDistance: number;
  maxDistance: number;
  minSpacing: number;
  playerExclusion: number;
  existingPositions: Position[];
  playerVillages: Position[];
}): Position | null {
  const {
    centerX,
    centerY,
    worldWidth,
    worldHeight,
    minDistance,
    maxDistance,
    minSpacing,
    playerExclusion,
    existingPositions,
    playerVillages,
  } = params;

  const candidates: Position[] = [];
  const minX = Math.max(0, Math.floor(centerX - maxDistance));
  const maxX = Math.min(worldWidth - 1, Math.ceil(centerX + maxDistance));
  const minY = Math.max(0, Math.floor(centerY - maxDistance));
  const maxY = Math.min(worldHeight - 1, Math.ceil(centerY + maxDistance));

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const distance = Math.hypot(x - centerX, y - centerY);
      if (distance < minDistance || distance > maxDistance) continue;
      if (
        playerVillages.some(
          (village) =>
            Math.hypot(x - village.x, y - village.y) < playerExclusion,
        )
      ) {
        continue;
      }
      if (
        existingPositions.some(
          (position) => Math.hypot(x - position.x, y - position.y) < minSpacing,
        )
      ) {
        continue;
      }
      candidates.push({ x, y });
    }
  }

  candidates.sort((left, right) => {
    const leftDistance = Math.hypot(left.x - centerX, left.y - centerY);
    const rightDistance = Math.hypot(right.x - centerX, right.y - centerY);
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    if (left.y !== right.y) return left.y - right.y;
    return left.x - right.x;
  });

  return candidates[0] ?? null;
}
