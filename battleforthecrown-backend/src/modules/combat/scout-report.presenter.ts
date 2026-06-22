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
  const castleLevel = details.castleLevel;
  return {
    ...(details.scoutLosses && typeof details.scoutLosses === 'object'
      ? { scoutLosses: details.scoutLosses }
      : {}),
    ...(details.scoutUnits && typeof details.scoutUnits === 'object'
      ? { scoutUnits: details.scoutUnits }
      : {}),
    ...(typeof wallLevel === 'number' ? { wallLevel } : {}),
    ...(typeof castleLevel === 'number' ? { castleLevel } : {}),
    ...newbieShieldDetails(details.newbieShield),
  };
}

function newbieShieldDetails(
  value: unknown,
): Pick<NonNullable<ScoutReportResponse['details']>, 'newbieShield'> | object {
  if (!value || typeof value !== 'object') return {};
  const shield = value as Record<string, unknown>;
  if (typeof shield.active !== 'boolean') return {};
  const endsAt = typeof shield.endsAt === 'string' ? shield.endsAt : null;
  return { newbieShield: { active: shield.active, endsAt } };
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
