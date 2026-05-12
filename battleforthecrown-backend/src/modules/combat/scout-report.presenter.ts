import type { ScoutReportResponse } from '@battleforthecrown/shared/combat';
import type { UnitMap } from '@battleforthecrown/shared/army';
import type { LootResources } from '@battleforthecrown/shared/combat';

type ScoutReportInput = {
  id: string;
  scoutVillageId: string;
  targetVillageId: string | null;
  targetKind: string;
  targetX: number;
  targetY: number;
  targetName: string | null;
  targetTier: string | null;
  units: unknown;
  resources: unknown;
  strategy: string | null;
  isRead: boolean;
  timestamp: Date;
};

export function presentScoutReport(
  report: ScoutReportInput,
): ScoutReportResponse {
  return {
    id: report.id,
    scoutVillageId: report.scoutVillageId,
    targetVillageId: report.targetVillageId ?? undefined,
    targetKind: report.targetKind,
    targetX: report.targetX,
    targetY: report.targetY,
    targetName: report.targetName,
    targetTier: report.targetTier,
    units: report.units as UnitMap,
    resources: report.resources as LootResources,
    strategy: report.strategy,
    isRead: report.isRead,
    timestamp: report.timestamp.toISOString(),
  };
}
