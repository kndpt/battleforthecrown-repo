import { describe, expect, it } from 'vitest';
import { computeUnitTrainingProgress } from './trainingProgress';

const training = {
  completedQty: 0,
  createdAt: '2026-05-14T10:00:00Z',
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

  it('clamps progress after the training end', () => {
    const progress = computeUnitTrainingProgress(
      training,
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
