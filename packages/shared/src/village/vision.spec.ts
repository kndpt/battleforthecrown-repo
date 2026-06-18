import { describe, expect, it } from 'vitest';
import { WATCHTOWER_VISION_LEVELS } from './vision';

describe('WATCHTOWER_VISION_LEVELS', () => {
  it('has entries for levels 0 through 10', () => {
    for (let level = 0; level <= 10; level++) {
      expect(WATCHTOWER_VISION_LEVELS[level]).toBeDefined();
    }
  });

  it('level 0 has world locked and radius 0', () => {
    expect(WATCHTOWER_VISION_LEVELS[0]).toEqual({
      isWorldUnlocked: false,
      visibilityRadius: 0,
    });
  });

  it('level 1 unlocks the world with radius 10', () => {
    expect(WATCHTOWER_VISION_LEVELS[1]).toEqual({
      isWorldUnlocked: true,
      visibilityRadius: 10,
    });
  });

  it('level 10 has world unlocked and radius 55', () => {
    expect(WATCHTOWER_VISION_LEVELS[10]).toEqual({
      isWorldUnlocked: true,
      visibilityRadius: 55,
    });
  });

  it('visibility radius increases monotonically from level 1 to 10', () => {
    for (let level = 2; level <= 10; level++) {
      expect(WATCHTOWER_VISION_LEVELS[level]!.visibilityRadius).toBeGreaterThan(
        WATCHTOWER_VISION_LEVELS[level - 1]!.visibilityRadius,
      );
    }
  });

  it('all levels from 1 to 10 have world unlocked', () => {
    for (let level = 1; level <= 10; level++) {
      expect(WATCHTOWER_VISION_LEVELS[level]!.isWorldUnlocked).toBe(true);
    }
  });
});
