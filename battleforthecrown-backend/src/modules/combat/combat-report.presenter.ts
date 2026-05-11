import type { UnitMap } from '@battleforthecrown/shared/army';
import { isVictoryForAttacker } from './combat.utils';

type CombatReportVisibilityInput = {
  attackerUserId?: string;
  defenderUserId?: string | null;
  targetKind: string;
  loot: unknown;
  totalUnitsAttacker: unknown;
  totalUnitsDefender: unknown;
  lossesAttacker: unknown;
  lossesDefender: unknown;
  details: unknown;
  isRead?: boolean;
  readByAttacker?: boolean;
  readByDefender?: boolean;
};

type CombatReportDetails = {
  targetTier?: string;
};

function asUnitMap(value: unknown): UnitMap {
  return value && typeof value === 'object' ? (value as UnitMap) : {};
}

function reportDetails(value: unknown): CombatReportDetails {
  return value && typeof value === 'object'
    ? (value as CombatReportDetails)
    : {};
}

function shouldHideBarbarianDefeatDetails(
  report: CombatReportVisibilityInput,
  isAttacker: boolean,
): boolean {
  return (
    isAttacker &&
    report.targetKind === 'BARBARIAN_VILLAGE' &&
    !isVictoryForAttacker(
      asUnitMap(report.lossesAttacker),
      asUnitMap(report.totalUnitsAttacker),
    )
  );
}

export function presentCombatReport<
  TReport extends CombatReportVisibilityInput,
>(
  report: TReport,
  userId: string,
): TReport & { isAttacker: boolean; isRead: boolean } {
  const isAttacker = report.attackerUserId === userId;
  const isDefender = report.defenderUserId === userId;
  const isRead = isAttacker
    ? (report.readByAttacker ?? report.isRead ?? false)
    : isDefender
      ? (report.readByDefender ?? report.isRead ?? false)
      : (report.isRead ?? false);

  if (!shouldHideBarbarianDefeatDetails(report, isAttacker)) {
    return { ...report, isAttacker, isRead };
  }

  const { targetTier } = reportDetails(report.details);

  return {
    ...report,
    isAttacker,
    isRead,
    loot: {},
    totalUnitsDefender: {},
    lossesDefender: {},
    details: targetTier ? { targetTier } : {},
  };
}
