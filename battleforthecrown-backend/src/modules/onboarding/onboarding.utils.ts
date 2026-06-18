import {
  Prisma,
  type OnboardingStep as PrismaOnboardingStep,
} from '@prisma/client';
import { BUILDING_TYPES } from '@battleforthecrown/shared/village';
import { UNIT_TYPES } from '@battleforthecrown/shared/army';
import type {
  OnboardingStep,
  OnboardingSummaryDto,
} from '@battleforthecrown/shared/onboarding';
import type {
  BattleResolvedPayload,
  BuildingCompletedPayload,
  EventKind,
  PayloadForKind,
  UnitTrainedPayload,
} from '../event/event-types';

export const ONBOARDING_INITIAL_REWARD = {
  wood: 850,
  stone: 850,
  iron: 850,
  crowns: 100,
} as const;

export const ONBOARDING_STEP_ORDER: readonly OnboardingStep[] = [
  'UPGRADE_CASTLE_LEVEL_2',
  'BUILD_BARRACKS',
  'TRAIN_TROOPS',
  'UPGRADE_CASTLE_LEVEL_3',
  'BUILD_WATCHTOWER',
  'ATTACK_BARBARIAN',
];

export function getOnboardingProjection<K extends EventKind>(
  kind: K,
  payload: PayloadForKind<K>,
): { villageId: string; step: OnboardingStep } | null {
  switch (kind) {
    case 'building.completed': {
      const eventPayload = payload as BuildingCompletedPayload;
      if (
        eventPayload.buildingType === BUILDING_TYPES.CASTLE &&
        eventPayload.level >= 3
      ) {
        return {
          villageId: eventPayload.villageId,
          step: 'UPGRADE_CASTLE_LEVEL_3',
        };
      }
      if (
        eventPayload.buildingType === BUILDING_TYPES.CASTLE &&
        eventPayload.level >= 2
      ) {
        return {
          villageId: eventPayload.villageId,
          step: 'UPGRADE_CASTLE_LEVEL_2',
        };
      }
      if (
        eventPayload.buildingType === BUILDING_TYPES.BARRACKS &&
        eventPayload.level >= 1
      ) {
        return { villageId: eventPayload.villageId, step: 'BUILD_BARRACKS' };
      }
      if (
        eventPayload.buildingType === BUILDING_TYPES.WATCHTOWER &&
        eventPayload.level >= 1
      ) {
        return { villageId: eventPayload.villageId, step: 'BUILD_WATCHTOWER' };
      }
      return null;
    }
    case 'unit.trained': {
      const eventPayload = payload as UnitTrainedPayload;
      return eventPayload.unitType === UNIT_TYPES.MILITIA &&
        eventPayload.completedQty > 0
        ? { villageId: eventPayload.villageId, step: 'TRAIN_TROOPS' }
        : null;
    }
    case 'battle.resolved': {
      const eventPayload = payload as BattleResolvedPayload;
      // The final onboarding step completes only on a victorious raid against
      // the dedicated narrative target — not against a standard T1 barbarian
      // (which keeps its full 9-15 militia garrison and stays a real challenge).
      // Defeats and victories on STANDARD targets never satisfy the step.
      return eventPayload.targetKind === 'BARBARIAN_VILLAGE' &&
        eventPayload.isVictory &&
        eventPayload.targetOriginKind === 'ONBOARDING_NARRATIVE'
        ? { villageId: eventPayload.villageId, step: 'ATTACK_BARBARIAN' }
        : null;
    }
    default:
      return null;
  }
}

export function getNextStep(step: OnboardingStep): PrismaOnboardingStep | null {
  const currentIndex = ONBOARDING_STEP_ORDER.indexOf(step);
  return ONBOARDING_STEP_ORDER[currentIndex + 1] ?? null;
}

export function mapOnboardingState(state: {
  worldId: string;
  firstVillageId: string;
  narrativeTargetVillageId: string | null;
  status: 'ACTIVE' | 'COMPLETED';
  currentStep: OnboardingStep;
  initialRewardApplied: boolean;
  initialRewardAppliedAt: Date | null;
  completedAt: Date | null;
  steps: Array<{ step: OnboardingStep; completedAt: Date }>;
}): OnboardingSummaryDto {
  return {
    worldId: state.worldId,
    firstVillageId: state.firstVillageId,
    narrativeTargetVillageId: state.narrativeTargetVillageId,
    status: state.status,
    currentStep: state.status === 'ACTIVE' ? state.currentStep : null,
    completedSteps: state.steps.map((step) => ({
      step: step.step,
      completedAt: step.completedAt.toISOString(),
    })),
    initialRewardApplied: state.initialRewardApplied,
    initialRewardAppliedAt: state.initialRewardAppliedAt?.toISOString() ?? null,
    initialReward: ONBOARDING_INITIAL_REWARD,
    completedAt: state.completedAt?.toISOString() ?? null,
  };
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
