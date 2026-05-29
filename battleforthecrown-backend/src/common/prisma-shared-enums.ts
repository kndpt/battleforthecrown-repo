import type {
  ExpeditionStatus as PrismaExpeditionStatus,
  OnboardingStatus as PrismaOnboardingStatus,
  OnboardingStep as PrismaOnboardingStep,
  TargetKind as PrismaTargetKind,
  VillageStrategy as PrismaVillageStrategy,
} from '@prisma/client';
import type {
  ExpeditionStatus,
  TargetKind,
} from '@battleforthecrown/shared/combat';
import type { VillageStrategyType } from '@battleforthecrown/shared/village';
import type {
  OnboardingStatus,
  OnboardingStep,
} from '@battleforthecrown/shared/onboarding';

// Compile-time alignment between Prisma enums and shared unions.
// Bidirectional Records: if either side adds, removes, or renames a variant,
// one of these objects fails to type-check — the build breaks before any
// runtime cast is needed.
export const _expeditionStatusFromPrisma: Record<
  PrismaExpeditionStatus,
  ExpeditionStatus
> = {
  EN_ROUTE: 'EN_ROUTE',
  RESOLVED: 'RESOLVED',
  RETURNING: 'RETURNING',
};
export const _expeditionStatusToPrisma: Record<
  ExpeditionStatus,
  PrismaExpeditionStatus
> = {
  EN_ROUTE: 'EN_ROUTE',
  RESOLVED: 'RESOLVED',
  RETURNING: 'RETURNING',
};

export const _targetKindFromPrisma: Record<PrismaTargetKind, TargetKind> = {
  PLAYER_VILLAGE: 'PLAYER_VILLAGE',
  BARBARIAN_VILLAGE: 'BARBARIAN_VILLAGE',
};

// No reverse mapping: shared TargetKind may diverge from Prisma in future variants.

export const _villageStrategyFromPrisma: Record<
  PrismaVillageStrategy,
  VillageStrategyType
> = {
  FORTRESS: 'FORTRESS',
  RAIDERS: 'RAIDERS',
  ECONOMIC: 'ECONOMIC',
  BALANCED: 'BALANCED',
};
export const _villageStrategyToPrisma: Record<
  VillageStrategyType,
  PrismaVillageStrategy
> = {
  FORTRESS: 'FORTRESS',
  RAIDERS: 'RAIDERS',
  ECONOMIC: 'ECONOMIC',
  BALANCED: 'BALANCED',
};

export const _onboardingStatusFromPrisma: Record<
  PrismaOnboardingStatus,
  OnboardingStatus
> = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
};
export const _onboardingStepFromPrisma: Record<
  PrismaOnboardingStep,
  OnboardingStep
> = {
  UPGRADE_CASTLE_LEVEL_2: 'UPGRADE_CASTLE_LEVEL_2',
  BUILD_BARRACKS: 'BUILD_BARRACKS',
  TRAIN_TROOPS: 'TRAIN_TROOPS',
  UPGRADE_CASTLE_LEVEL_3: 'UPGRADE_CASTLE_LEVEL_3',
  BUILD_WATCHTOWER: 'BUILD_WATCHTOWER',
  ATTACK_BARBARIAN: 'ATTACK_BARBARIAN',
};
