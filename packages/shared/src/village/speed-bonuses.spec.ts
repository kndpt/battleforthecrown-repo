import { describe, expect, it } from 'vitest';
import {
  BARRACKS_TRAINING_SPEED_MULTIPLIER,
  CASTLE_CONSTRUCTION_SPEED_BONUS,
  getBarracksTrainingSpeedMultiplier,
} from './speed-bonuses';

describe('CASTLE_CONSTRUCTION_SPEED_BONUS', () => {
  it('has entries for levels 1 through 10', () => {
    for (let level = 1; level <= 10; level++) {
      expect(CASTLE_CONSTRUCTION_SPEED_BONUS[level]).toBeDefined();
    }
  });

  it('starts at 1.0 at level 1 and reaches 0.25 at level 10', () => {
    expect(CASTLE_CONSTRUCTION_SPEED_BONUS[1]).toBe(1.0);
    expect(CASTLE_CONSTRUCTION_SPEED_BONUS[10]).toBe(0.25);
  });

  it('decreases monotonically from level 1 to 10', () => {
    for (let level = 2; level <= 10; level++) {
      expect(CASTLE_CONSTRUCTION_SPEED_BONUS[level]).toBeLessThan(
        CASTLE_CONSTRUCTION_SPEED_BONUS[level - 1]!,
      );
    }
  });
});

describe('BARRACKS_TRAINING_SPEED_MULTIPLIER', () => {
  it('has entries for levels 1 through 10', () => {
    for (let level = 1; level <= 10; level++) {
      expect(BARRACKS_TRAINING_SPEED_MULTIPLIER[level]).toBeDefined();
    }
  });

  it('starts at 1.0 at level 1', () => {
    expect(BARRACKS_TRAINING_SPEED_MULTIPLIER[1]).toBe(1.0);
  });

  it('increases monotonically from level 1 to 10', () => {
    for (let level = 2; level <= 10; level++) {
      expect(BARRACKS_TRAINING_SPEED_MULTIPLIER[level]).toBeGreaterThan(
        BARRACKS_TRAINING_SPEED_MULTIPLIER[level - 1]!,
      );
    }
  });
});

describe('getBarracksTrainingSpeedMultiplier', () => {
  it('returns the correct multiplier for valid levels', () => {
    expect(getBarracksTrainingSpeedMultiplier(1)).toBe(1.0);
    expect(getBarracksTrainingSpeedMultiplier(5)).toBe(1.16);
    expect(getBarracksTrainingSpeedMultiplier(10)).toBe(1.36);
  });

  it('clamps level below 1 to level 1', () => {
    expect(getBarracksTrainingSpeedMultiplier(0)).toBe(1.0);
    expect(getBarracksTrainingSpeedMultiplier(-5)).toBe(1.0);
  });

  it('clamps level above 10 to level 10', () => {
    expect(getBarracksTrainingSpeedMultiplier(11)).toBe(1.36);
    expect(getBarracksTrainingSpeedMultiplier(99)).toBe(1.36);
  });

  it('clamps fractional levels by flooring', () => {
    expect(getBarracksTrainingSpeedMultiplier(1.9)).toBe(1.0);
    expect(getBarracksTrainingSpeedMultiplier(5.7)).toBe(1.16);
  });
});
