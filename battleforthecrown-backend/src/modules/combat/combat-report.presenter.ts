import type { UnitMap } from '@battleforthecrown/shared/army';
import { isVictoryForAttacker } from './combat.utils';

type CombatReportVisibilityInput = {
  attackerUserId?: string;
  defenderUserId?: string | null;
  observerUserId?: string | null;
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
  readByObserver?: boolean;
};

type CombatReportDetails = {
  captureFinalized?: { outcome?: string };
  occupationDefense?: unknown;
  targetTier?: string;
};

function asUnitMap(value: unknown): UnitMap {
  return value && typeof value === 'object' ? value : {};
}

function reportDetails(value: unknown): CombatReportDetails {
  return value && typeof value === 'object' ? value : {};
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
): TReport & {
  isAttacker: boolean;
  isRead: boolean;
  recipientRole: 'attacker' | 'defender' | 'observer' | null;
} {
  const details = reportDetails(report.details);
  const isObserver = report.observerUserId === userId;
  const isDefender = !isObserver && report.defenderUserId === userId;
  const isAttacker =
    !isObserver && !isDefender && report.attackerUserId === userId;
  const recipientRole = isAttacker
    ? 'attacker'
    : isDefender
      ? 'defender'
      : isObserver
        ? 'observer'
        : null;
  const isRead = isAttacker
    ? (report.readByAttacker ?? report.isRead ?? false)
    : isDefender
      ? (report.readByDefender ?? report.isRead ?? false)
      : isObserver
        ? (report.readByObserver ?? report.isRead ?? false)
        : (report.isRead ?? false);

  if (!shouldHideBarbarianDefeatDetails(report, isAttacker)) {
    return { ...report, isAttacker, isRead, recipientRole };
  }

  const { targetTier } = details;

  return {
    ...report,
    isAttacker,
    isRead,
    recipientRole,
    loot: {},
    totalUnitsDefender: {},
    lossesDefender: {},
    details: targetTier ? { targetTier } : {},
  };
}
