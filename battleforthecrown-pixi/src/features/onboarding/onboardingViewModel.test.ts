import { describe, expect, it } from 'vitest';
import type { OnboardingSummaryDto } from '@battleforthecrown/shared/onboarding';
import { getOnboardingGuidance } from './onboardingViewModel';

function summary(currentStep: OnboardingSummaryDto['currentStep']): OnboardingSummaryDto {
  return {
    worldId: 'world-1',
    firstVillageId: 'village-1',
    status: currentStep ? 'ACTIVE' : 'COMPLETED',
    currentStep,
    completedSteps: [],
    initialRewardApplied: true,
    initialRewardAppliedAt: '2026-05-26T08:00:00.000Z',
    initialReward: { wood: 850, stone: 850, iron: 850, crowns: 100 },
    completedAt: currentStep ? null : '2026-05-26T08:05:00.000Z',
  };
}

describe('getOnboardingGuidance', () => {
  it('maps the current scripted step to a CTA', () => {
    expect(getOnboardingGuidance(summary('TRAIN_TROOPS'))).toMatchObject({
      title: 'Former des troupes',
      route: '/game/army',
      progressLabel: '3 / 5',
    });
  });

  it('hides guidance once onboarding is complete', () => {
    expect(getOnboardingGuidance(summary(null))).toBeNull();
  });
});
