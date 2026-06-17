import { z } from 'zod';
import { ONBOARDING_STATUSES, ONBOARDING_STEPS } from './types';

export const OnboardingStatusSchema = z.enum(ONBOARDING_STATUSES);
export const OnboardingStepSchema = z.enum(ONBOARDING_STEPS);

export const OnboardingRewardSchema = z.object({
  wood: z.number(),
  stone: z.number(),
  iron: z.number(),
  crowns: z.number(),
});

export const OnboardingStepDtoSchema = z.object({
  step: OnboardingStepSchema,
  completedAt: z.string(),
});

export const OnboardingSummarySchema = z.object({
  worldId: z.string(),
  firstVillageId: z.string().nullable(),
  status: OnboardingStatusSchema,
  currentStep: OnboardingStepSchema.nullable(),
  completedSteps: z.array(OnboardingStepDtoSchema),
  initialRewardApplied: z.boolean(),
  initialRewardAppliedAt: z.string().nullable(),
  initialReward: OnboardingRewardSchema,
  completedAt: z.string().nullable(),
  narrativeTargetVillageId: z.string().nullable(),
});
