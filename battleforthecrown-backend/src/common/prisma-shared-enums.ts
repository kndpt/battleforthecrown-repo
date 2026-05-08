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
const _expeditionStatusFromPrisma: Record<PrismaExpeditionStatus, ExpeditionStatus> = {
  EN_ROUTE: 'EN_ROUTE',
  RESOLVED: 'RESOLVED',
  RETURNING: 'RETURNING',
};
const _expeditionStatusToPrisma: Record<ExpeditionStatus, PrismaExpeditionStatus> = {
  EN_ROUTE: 'EN_ROUTE',
  RESOLVED: 'RESOLVED',
  RETURNING: 'RETURNING',
};

const _targetKindFromPrisma: Record<PrismaTargetKind, TargetKind> = {
  PLAYER_VILLAGE: 'PLAYER_VILLAGE',
  BARBARIAN_VILLAGE: 'BARBARIAN_VILLAGE',
};
const _targetKindToPrisma: Record<TargetKind, PrismaTargetKind> = {
  PLAYER_VILLAGE: 'PLAYER_VILLAGE',
  BARBARIAN_VILLAGE: 'BARBARIAN_VILLAGE',
};

const _villageStrategyFromPrisma: Record<PrismaVillageStrategy, VillageStrategyType> = {
  FORTRESS: 'FORTRESS',
  RAIDERS: 'RAIDERS',
  ECONOMIC: 'ECONOMIC',
  BALANCED: 'BALANCED',
};
const _villageStrategyToPrisma: Record<VillageStrategyType, PrismaVillageStrategy> = {
  FORTRESS: 'FORTRESS',
  RAIDERS: 'RAIDERS',
  ECONOMIC: 'ECONOMIC',
  BALANCED: 'BALANCED',
};
