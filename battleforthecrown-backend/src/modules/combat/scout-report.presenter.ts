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
  details: unknown;
  isRead: boolean;
  timestamp: Date;
};

function reportDetails(value: unknown): ScoutReportResponse['details'] {
  if (!value || typeof value !== 'object') return undefined;
  const details = value as Record<string, unknown>;
  const wallLevel = details.wallLevel;
  return {
    ...(details.scoutLosses && typeof details.scoutLosses === 'object'
      ? { scoutLosses: details.scoutLosses as UnitMap }
      : {}),
    ...(details.scoutUnits && typeof details.scoutUnits === 'object'
      ? { scoutUnits: details.scoutUnits as UnitMap }
      : {}),
    ...(typeof wallLevel === 'number' ? { wallLevel } : {}),
  };
}

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
    details: reportDetails(report.details),
    isRead: report.isRead,
    timestamp: report.timestamp.toISOString(),
  };
}
