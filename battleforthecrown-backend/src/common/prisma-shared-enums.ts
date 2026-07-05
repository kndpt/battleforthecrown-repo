import type {
  CaravanReportType as PrismaCaravanReportType,
  ExpeditionKind as PrismaExpeditionKind,
  ExpeditionStatus as PrismaExpeditionStatus,
  ExtractionResourceType as PrismaExtractionResourceType,
  ExtractionSiteState as PrismaExtractionSiteState,
  FriendshipStatus as PrismaFriendshipStatus,
  MapMarkerKind as PrismaMapMarkerKind,
  OnboardingStatus as PrismaOnboardingStatus,
  OnboardingStep as PrismaOnboardingStep,
  ReinforcementReportType as PrismaReinforcementReportType,
  TargetKind as PrismaTargetKind,
  VillageOriginKind as PrismaVillageOriginKind,
  VillageStrategy as PrismaVillageStrategy,
} from '@prisma/client';
import type {
  CaravanReportType,
  ExpeditionKind,
  ExpeditionStatus,
  ReinforcementReportType,
  TargetKind,
} from '@battleforthecrown/shared/combat';
import type {
  VillageOriginKind,
  VillageStrategyType,
} from '@battleforthecrown/shared/village';
import type {
  OnboardingStatus,
  OnboardingStep,
} from '@battleforthecrown/shared/onboarding';
import type { FriendshipStatus } from '@battleforthecrown/shared/social';
import type { MapMarkerKind } from '@battleforthecrown/shared/map-markers';
import type { ExtractionResourceType } from '@battleforthecrown/shared/extraction';

// Prisma-only enum (no shared union yet): site lifecycle state.
type ExtractionSiteState = 'ACTIVE' | 'DEPLETED';

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
  EXPLOITING: 'EXPLOITING',
};
export const _expeditionStatusToPrisma: Record<
  ExpeditionStatus,
  PrismaExpeditionStatus
> = {
  EN_ROUTE: 'EN_ROUTE',
  RESOLVED: 'RESOLVED',
  RETURNING: 'RETURNING',
  EXPLOITING: 'EXPLOITING',
};

export const _expeditionKindFromPrisma: Record<
  PrismaExpeditionKind,
  ExpeditionKind
> = {
  ATTACK: 'ATTACK',
  REINFORCE: 'REINFORCE',
  SCOUT: 'SCOUT',
  CARAVAN: 'CARAVAN',
  EXTRACTION: 'EXTRACTION',
};
export const _expeditionKindToPrisma: Record<
  ExpeditionKind,
  PrismaExpeditionKind
> = {
  ATTACK: 'ATTACK',
  REINFORCE: 'REINFORCE',
  SCOUT: 'SCOUT',
  CARAVAN: 'CARAVAN',
  EXTRACTION: 'EXTRACTION',
};

export const _reinforcementReportTypeFromPrisma: Record<
  PrismaReinforcementReportType,
  ReinforcementReportType
> = {
  STATIONED: 'STATIONED',
  RETURNED: 'RETURNED',
};
export const _reinforcementReportTypeToPrisma: Record<
  ReinforcementReportType,
  PrismaReinforcementReportType
> = {
  STATIONED: 'STATIONED',
  RETURNED: 'RETURNED',
};

export const _friendshipStatusFromPrisma: Record<
  PrismaFriendshipStatus,
  FriendshipStatus
> = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
};
export const _friendshipStatusToPrisma: Record<
  FriendshipStatus,
  PrismaFriendshipStatus
> = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
};

export const _caravanReportTypeFromPrisma: Record<
  PrismaCaravanReportType,
  CaravanReportType
> = {
  ARRIVED: 'ARRIVED',
  RETURNED: 'RETURNED',
};
export const _caravanReportTypeToPrisma: Record<
  CaravanReportType,
  PrismaCaravanReportType
> = {
  ARRIVED: 'ARRIVED',
  RETURNED: 'RETURNED',
};

export const _targetKindFromPrisma: Record<PrismaTargetKind, TargetKind> = {
  PLAYER_VILLAGE: 'PLAYER_VILLAGE',
  BARBARIAN_VILLAGE: 'BARBARIAN_VILLAGE',
  EXTRACTION_SITE: 'EXTRACTION_SITE',
};

// No reverse mapping: shared TargetKind may diverge from Prisma in future variants.

export const _extractionResourceTypeFromPrisma: Record<
  PrismaExtractionResourceType,
  ExtractionResourceType
> = {
  WOOD: 'WOOD',
  STONE: 'STONE',
  IRON: 'IRON',
};
export const _extractionResourceTypeToPrisma: Record<
  ExtractionResourceType,
  PrismaExtractionResourceType
> = {
  WOOD: 'WOOD',
  STONE: 'STONE',
  IRON: 'IRON',
};

export const _extractionSiteStateFromPrisma: Record<
  PrismaExtractionSiteState,
  ExtractionSiteState
> = {
  ACTIVE: 'ACTIVE',
  DEPLETED: 'DEPLETED',
};
export const _extractionSiteStateToPrisma: Record<
  ExtractionSiteState,
  PrismaExtractionSiteState
> = {
  ACTIVE: 'ACTIVE',
  DEPLETED: 'DEPLETED',
};

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

export const _villageOriginKindFromPrisma: Record<
  PrismaVillageOriginKind,
  VillageOriginKind
> = {
  STANDARD: 'STANDARD',
  ONBOARDING_NARRATIVE: 'ONBOARDING_NARRATIVE',
};
export const _villageOriginKindToPrisma: Record<
  VillageOriginKind,
  PrismaVillageOriginKind
> = {
  STANDARD: 'STANDARD',
  ONBOARDING_NARRATIVE: 'ONBOARDING_NARRATIVE',
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

export const _mapMarkerKindFromPrisma: Record<
  PrismaMapMarkerKind,
  MapMarkerKind
> = {
  TO_SCOUT: 'TO_SCOUT',
  TARGET: 'TARGET',
  DANGER: 'DANGER',
  FUTURE_VILLAGE: 'FUTURE_VILLAGE',
  INTEREST: 'INTEREST',
  NOTE: 'NOTE',
};
export const _mapMarkerKindToPrisma: Record<
  MapMarkerKind,
  PrismaMapMarkerKind
> = {
  TO_SCOUT: 'TO_SCOUT',
  TARGET: 'TARGET',
  DANGER: 'DANGER',
  FUTURE_VILLAGE: 'FUTURE_VILLAGE',
  INTEREST: 'INTEREST',
  NOTE: 'NOTE',
};
