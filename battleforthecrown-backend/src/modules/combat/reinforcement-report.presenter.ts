import type { ReinforcementReportResponse } from '@battleforthecrown/shared/combat';
import type { UnitMap } from '@battleforthecrown/shared/army';

type ReinforcementReportInput = {
  id: string;
  worldId: string;
  type: string;
  originVillageId: string;
  originVillageName: string | null;
  originX: number;
  originY: number;
  hostVillageId: string;
  hostVillageName: string | null;
  hostX: number;
  hostY: number;
  units: unknown;
  actorUserId: string | null;
  timestamp: Date;
};

export function presentReinforcementReport(
  report: ReinforcementReportInput,
  isRead: boolean,
): ReinforcementReportResponse {
  return {
    id: report.id,
    worldId: report.worldId,
    type: report.type as ReinforcementReportResponse['type'],
    originVillageId: report.originVillageId,
    originVillageName: report.originVillageName,
    originX: report.originX,
    originY: report.originY,
    hostVillageId: report.hostVillageId,
    hostVillageName: report.hostVillageName,
    hostX: report.hostX,
    hostY: report.hostY,
    units: report.units as UnitMap,
    actorUserId: report.actorUserId,
    isRead,
    timestamp: report.timestamp.toISOString(),
  };
}
