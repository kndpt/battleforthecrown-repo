import { findOnboardingNarrativeTargetPosition } from '@battleforthecrown/shared/onboarding';
import type { Position } from '@battleforthecrown/shared/world';

describe('findOnboardingNarrativeTargetPosition', () => {
  it('returns a valid deterministic position inside the reachable ring', () => {
    const position = findOnboardingNarrativeTargetPosition({
      centerX: 50,
      centerY: 50,
      worldWidth: 100,
      worldHeight: 100,
      minDistance: 8,
      maxDistance: 10,
      minSpacing: 6,
      playerExclusion: 2,
      existingPositions: [{ x: 50, y: 50 }],
      playerVillages: [{ x: 50, y: 50 }],
    });

    expect(position).toEqual({ x: 50, y: 42 });
  });

  it('returns null when every reachable candidate violates spacing', () => {
    const existingPositions: Position[] = [];
    for (let x = 40; x <= 60; x += 1) {
      for (let y = 40; y <= 60; y += 1) {
        existingPositions.push({ x, y });
      }
    }

    const position = findOnboardingNarrativeTargetPosition({
      centerX: 50,
      centerY: 50,
      worldWidth: 100,
      worldHeight: 100,
      minDistance: 8,
      maxDistance: 10,
      minSpacing: 6,
      playerExclusion: 2,
      existingPositions,
      playerVillages: [{ x: 50, y: 50 }],
    });

    expect(position).toBeNull();
  });
});
