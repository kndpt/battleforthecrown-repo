import { describe, expect, it } from 'vitest';
import { computeUnitTrainingProgress } from './trainingProgress';

const training = {
  completedQty: 1,
  createdAt: '2026-05-14T10:00:00Z',
  nextUnitEta: '2026-05-14T10:02:00Z',
  timePerUnitMs: 60_000,
  totalQty: 3,
};

describe('computeUnitTrainingProgress', () => {
  it('reports total and current unit remaining time while training is active', () => {
    const progress = computeUnitTrainingProgress(
      training,
      Date.parse('2026-05-14T10:01:30Z'),
    );

    expect(progress.percent).toBe(50);
    expect(progress.totalRemainingMs).toBe(90_000);
    expect(progress.currentUnitRemainingMs).toBe(30_000);
    expect(progress.displayedCompletedQty).toBe(1);
  });

  it('uses nextUnitEta so worker scheduling drift does not accumulate visually', () => {
    const progress = computeUnitTrainingProgress(
      { ...training, nextUnitEta: '2026-05-14T10:02:30Z' },
      Date.parse('2026-05-14T10:02:00Z'),
    );

    expect(progress.percent).toBe(50);
    expect(progress.totalRemainingMs).toBe(90_000);
    expect(progress.currentUnitRemainingMs).toBe(30_000);
    expect(progress.finishedAtMs).toBe(Date.parse('2026-05-14T10:03:30Z'));
  });

  it('does not display a unit as completed before the server confirms it', () => {
    const progress = computeUnitTrainingProgress(
      training,
      Date.parse('2026-05-14T10:02:10Z'),
    );

    expect(progress.displayedCompletedQty).toBe(1);
    expect(progress.percent).toBeCloseTo(66.666, 2);
    expect(progress.totalRemainingMs).toBe(60_000);
  });

  it('clamps progress after the training end', () => {
    const progress = computeUnitTrainingProgress(
      { ...training, completedQty: 3, nextUnitEta: '2026-05-14T10:03:00Z' },
      Date.parse('2026-05-14T10:04:00Z'),
    );

    expect(progress.percent).toBe(100);
    expect(progress.totalRemainingMs).toBe(0);
    expect(progress.currentUnitRemainingMs).toBe(0);
    expect(progress.displayedCompletedQty).toBe(3);
  });

  it('never moves below the server completed quantity', () => {
    const progress = computeUnitTrainingProgress(
      { ...training, completedQty: 2 },
      Date.parse('2026-05-14T10:00:30Z'),
    );

    expect(progress.displayedCompletedQty).toBe(2);
  });
});
