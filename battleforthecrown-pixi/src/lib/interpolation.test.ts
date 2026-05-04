import { describe, expect, it } from 'vitest';
import { projectCrowns, projectResources } from './interpolation';
import type { ResourcesSnapshot } from '@/stores/resources';
import type { CrownsSnapshot } from '@/stores/crowns';

const ONE_HOUR_MS = 3_600_000;

describe('projectResources', () => {
  const baseline: ResourcesSnapshot = {
    villageId: 'v1',
    wood: 100,
    stone: 200,
    iron: 50,
    maxPerType: 1000,
    productionRates: { wood: 60, stone: 30, iron: 90 },
    lastUpdateTs: 1_000_000,
  };

  it('does not change values when nowMs equals lastUpdateTs', () => {
    expect(projectResources(baseline, baseline.lastUpdateTs)).toEqual({
      wood: 100,
      stone: 200,
      iron: 50,
      maxPerType: 1000,
    });
  });

  it('adds productionRate × elapsed hours', () => {
    const display = projectResources(baseline, baseline.lastUpdateTs + ONE_HOUR_MS);
    expect(display.wood).toBeCloseTo(160);
    expect(display.stone).toBeCloseTo(230);
    expect(display.iron).toBeCloseTo(140);
  });

  it('handles fractional hours', () => {
    // half an hour at 60/h = +30
    const display = projectResources(baseline, baseline.lastUpdateTs + ONE_HOUR_MS / 2);
    expect(display.wood).toBeCloseTo(130);
  });

  it('clamps each resource at maxPerType', () => {
    const display = projectResources(baseline, baseline.lastUpdateTs + ONE_HOUR_MS * 100);
    expect(display.wood).toBe(1000);
    expect(display.stone).toBe(1000);
    expect(display.iron).toBe(1000);
  });

  it('does not roll back if nowMs is earlier than lastUpdateTs (clock skew safety)', () => {
    const display = projectResources(baseline, baseline.lastUpdateTs - ONE_HOUR_MS);
    expect(display.wood).toBe(100);
    expect(display.stone).toBe(200);
    expect(display.iron).toBe(50);
  });
});

describe('projectCrowns', () => {
  const snapshot: CrownsSnapshot = {
    userId: 'u1',
    worldId: 'w1',
    balance: 12,
    productionRate: 6,
    lastUpdateTs: 1_000_000,
  };

  it('returns the balance at lastUpdateTs', () => {
    expect(projectCrowns(snapshot, snapshot.lastUpdateTs)).toBe(12);
  });

  it('grows linearly with elapsed time', () => {
    expect(projectCrowns(snapshot, snapshot.lastUpdateTs + ONE_HOUR_MS)).toBeCloseTo(18);
    expect(projectCrowns(snapshot, snapshot.lastUpdateTs + ONE_HOUR_MS * 2)).toBeCloseTo(24);
  });
});
