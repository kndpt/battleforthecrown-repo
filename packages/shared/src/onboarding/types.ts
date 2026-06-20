export const ONBOARDING_STATUSES = ['ACTIVE', 'COMPLETED'] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const ONBOARDING_STEPS = [
  'UPGRADE_CASTLE_LEVEL_2',
  'BUILD_BARRACKS',
  'TRAIN_TROOPS',
  'UPGRADE_CASTLE_LEVEL_3',
  'BUILD_WATCHTOWER',
  'ATTACK_BARBARIAN',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_TRAIN_TROOPS_TARGET = 5;

export interface OnboardingCompletionReward {
  wood: number;
  stone: number;
  iron: number;
}

/**
 * Guaranteed loot granted when the player claims the onboarding completion CTA.
 * Distinct from the narrative barbarian's lootable stock
 * (`getOnboardingNarrativeLoot`) and from the join reward
 * (`ONBOARDING_INITIAL_REWARD`). Single source of truth for the credit
 * (backend) and the advertised preview (frontend).
 */
export const ONBOARDING_COMPLETION_REWARD: OnboardingCompletionReward = {
  wood: 1000,
  stone: 1700,
  iron: 900,
};

export interface OnboardingRewardDto {
  wood: number;
  stone: number;
  iron: number;
  crowns: number;
}

export interface OnboardingStepDto {
  step: OnboardingStep;
  completedAt: string;
}

export interface OnboardingSummaryDto {
  worldId: string;
  firstVillageId: string | null;
  status: OnboardingStatus;
  currentStep: OnboardingStep | null;
  completedSteps: OnboardingStepDto[];
  initialRewardApplied: boolean;
  initialRewardAppliedAt: string | null;
  initialReward: OnboardingRewardDto;
  completedAt: string | null;
  /**
   * Identifier of the weakened barbarian village created by the onboarding
   * runtime once the player builds Watchtower L1. `null` until that step
   * fires, or for accounts that joined before the feature shipped.
   * Exposed so the frontend can center the world map on the revealed target
   * for the final `ATTACK_BARBARIAN` step.
   */
  narrativeTargetVillageId: string | null;
}
