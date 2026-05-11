import { describe, expect, it } from 'vitest';
import { buildRecalledExpeditionPatch, inferRecallAt } from './expeditionRecall';
import type { ExpeditionSnapshot } from '@/stores/expeditions';

const snapshot: ExpeditionSnapshot = {
  expeditionId: 'e1',
  kind: 'ATTACK',
  villageId: 'v1',
  origin: { x: 0, y: 0 },
  target: { x: 10, y: 0 },
  phase: 'EN_ROUTE',
  departAt: 0,
  arrivalAt: 10_000,
};

describe('buildRecalledExpeditionPatch', () => {
  it('turns the current outbound position into the return target', () => {
    const patch = buildRecalledExpeditionPatch(snapshot, 5_000, 10_000);

    expect(patch.phase).toBe('RETURNING');
    expect(patch.arrivalAt).toBe(5_000);
    expect(patch.returnAt).toBe(10_000);
    expect(patch.target.x).toBeGreaterThan(0);
    expect(patch.target.x).toBeLessThan(10);
  });
});

describe('inferRecallAt', () => {
  it('uses updatedAt when available', () => {
    expect(inferRecallAt(1_000, 9_000, 4_000)).toBe(4_000);
  });

  it('reconstructs recall time from departAt and returnAt when updatedAt is missing', () => {
    expect(inferRecallAt(1_000, 9_000)).toBe(5_000);
  });
});
