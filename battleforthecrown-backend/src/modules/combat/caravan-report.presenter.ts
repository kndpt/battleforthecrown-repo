import type {
  CaravanReportResponse,
  LootResources,
} from '@battleforthecrown/shared/combat';
import type { CaravanReportType as PrismaCaravanReportType } from '@prisma/client';
import { _caravanReportTypeFromPrisma } from '../../common/prisma-shared-enums';

type CaravanReportInput = {
  id: string;
  worldId: string;
  expeditionId: string;
  type: PrismaCaravanReportType;
  originVillageId: string;
  originVillageName: string | null;
  originX: number;
  originY: number;
  targetVillageId: string;
  targetVillageName: string | null;
  targetX: number;
  targetY: number;
  resources: unknown;
  credited: unknown;
  returned: unknown;
  lost: unknown;
  porters: number;
  recalled: boolean;
  timestamp: Date;
};

export function presentCaravanReport(
  report: CaravanReportInput,
  isRead: boolean,
): CaravanReportResponse {
  return {
    id: report.id,
    worldId: report.worldId,
    expeditionId: report.expeditionId,
    type: _caravanReportTypeFromPrisma[report.type],
    originVillageId: report.originVillageId,
    originVillageName: report.originVillageName,
    originX: report.originX,
    originY: report.originY,
    targetVillageId: report.targetVillageId,
    targetVillageName: report.targetVillageName,
    targetX: report.targetX,
    targetY: report.targetY,
    resources: presentResources(report.resources),
    credited: presentResources(report.credited),
    returned: presentResources(report.returned),
    lost: presentResources(report.lost),
    porters: report.porters,
    recalled: report.recalled,
    isRead,
    timestamp: report.timestamp.toISOString(),
  };
}

export function presentResources(value: unknown): LootResources {
  if (!value || typeof value !== 'object') {
    return { wood: 0, stone: 0, iron: 0 };
  }
  const resources = value as Partial<Record<keyof LootResources, unknown>>;
  return {
    wood: presentResource(resources.wood),
    stone: presentResource(resources.stone),
    iron: presentResource(resources.iron),
  };
}

export function presentResource(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
