import { describe, expect, it } from 'vitest';
import { buildAttackLootView } from './attackLootView';
import type { LootDistanceConfig } from '@battleforthecrown/shared/logic';

const CFG: LootDistanceConfig = { radius: 25, slope: 0.01, floor: 0.5 };

describe('buildAttackLootView', () => {
  it('applies the malus to a long-distance raid (attack, no noble)', () => {
    // distance 75 → plateau floor 0.5 → capacité 1000 → 500, malus 50 %.
    const view = buildAttackLootView({
      activeMode: 'attack',
      selectedNobleCount: 0,
      distance: 75,
      totalCarryCapacity: 1000,
      lootDistance: CFG,
    });

    expect(view.isRaid).toBe(true);
    expect(view.factor).toBe(0.5);
    expect(view.effectiveCarryCapacity).toBe(500);
    expect(view.malusPct).toBe(50);
    expect(view.showMalus).toBe(true);
  });

  it('hides a malus that rounds to −0 % just beyond the radius', () => {
    // distance 25.1 → factor 0.999 → malusPct arrondi à 0 → badge caché.
    const view = buildAttackLootView({
      activeMode: 'attack',
      selectedNobleCount: 0,
      distance: 25.1,
      totalCarryCapacity: 1000,
      lootDistance: CFG,
    });

    expect(view.factor).toBeLessThan(1);
    expect(view.malusPct).toBe(0);
    expect(view.showMalus).toBe(false);
  });

  it('applies no malus to a raid under the radius', () => {
    const view = buildAttackLootView({
      activeMode: 'attack',
      selectedNobleCount: 0,
      distance: 10,
      totalCarryCapacity: 1000,
      lootDistance: CFG,
    });

    expect(view.factor).toBe(1);
    expect(view.effectiveCarryCapacity).toBe(1000);
    expect(view.showMalus).toBe(false);
  });

  it('never applies the malus in conquest mode (noble selected)', () => {
    const view = buildAttackLootView({
      activeMode: 'attack',
      selectedNobleCount: 1,
      distance: 1000,
      totalCarryCapacity: 1000,
      lootDistance: CFG,
    });

    expect(view.isRaid).toBe(false);
    expect(view.factor).toBe(1);
    expect(view.effectiveCarryCapacity).toBe(1000);
    expect(view.showMalus).toBe(false);
  });

  it('never applies the malus in reinforce mode', () => {
    const view = buildAttackLootView({
      activeMode: 'reinforce',
      selectedNobleCount: 0,
      distance: 1000,
      totalCarryCapacity: 1000,
      lootDistance: CFG,
    });

    expect(view.isRaid).toBe(false);
    expect(view.factor).toBe(1);
    expect(view.showMalus).toBe(false);
  });

  it('falls back to no malus when the world config is unavailable', () => {
    const view = buildAttackLootView({
      activeMode: 'attack',
      selectedNobleCount: 0,
      distance: 1000,
      totalCarryCapacity: 1000,
      lootDistance: undefined,
    });

    expect(view.factor).toBe(1);
    expect(view.showMalus).toBe(false);
  });

  it('hides the malus badge when no units are selected', () => {
    const view = buildAttackLootView({
      activeMode: 'attack',
      selectedNobleCount: 0,
      distance: 1000,
      totalCarryCapacity: 0,
      lootDistance: CFG,
    });

    expect(view.showMalus).toBe(false);
    expect(view.effectiveCarryCapacity).toBe(0);
  });
});
