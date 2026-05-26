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
}
