import type { UnitMap } from '@battleforthecrown/shared/army';
import { isVictoryForAttacker } from './combat.utils';

type CombatReportVisibilityInput = {
  targetKind: string;
  loot: unknown;
  totalUnitsAttacker: unknown;
  totalUnitsDefender: unknown;
  lossesAttacker: unknown;
  lossesDefender: unknown;
  details: unknown;
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
>(report: TReport, userId: string): TReport & { isAttacker: boolean } {
  const isAttacker =
    'attackerUserId' in report && report.attackerUserId === userId;

  if (!shouldHideBarbarianDefeatDetails(report, isAttacker)) {
    return { ...report, isAttacker };
  }

  const { targetTier } = reportDetails(report.details);

  return {
    ...report,
    isAttacker,
    loot: {},
    totalUnitsDefender: {},
    lossesDefender: {},
    details: targetTier ? { targetTier } : {},
  };
}
