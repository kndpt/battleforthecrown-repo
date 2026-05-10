import type {
  ExpeditionStatus as PrismaExpeditionStatus,
  TargetKind as PrismaTargetKind,
  VillageStrategy as PrismaVillageStrategy,
} from '@prisma/client';
import type {
  ExpeditionStatus,
  TargetKind,
} from '@battleforthecrown/shared/combat';
import type { VillageStrategyType } from '@battleforthecrown/shared/village';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _targetKindFromPrisma: Record<PrismaTargetKind, TargetKind> = {
  PLAYER_VILLAGE: 'PLAYER_VILLAGE',
  BARBARIAN_VILLAGE: 'BARBARIAN_VILLAGE',
};

// No bidirectional mapping for TargetKind anymore as they started to diverge
// between Prisma and Shared.

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
