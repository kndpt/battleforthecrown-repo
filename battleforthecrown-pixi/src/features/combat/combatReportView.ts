import { isVictoryForAttacker } from '@battleforthecrown/shared/combat';
import type { CombatReportDto } from '@/api/queries';
import { unitMetaFor } from '@/features/army/unitConfig';
import { formatResourceAmount } from '@/lib/resourceConfig';
import type {
  CombatReportAction,
  CombatReportHighlight,
  CombatReportModalLabels,
  CombatReportModalProps,
  CombatReportOutcome,
  CombatReportParticipant,
  CombatReportUnit,
} from '@/features/design-system/components';
import { formatCoord, shortReportId } from './report-view-utils';

export const combatReportLabels: CombatReportModalLabels = {
  attackerTitle: 'Attaquant',
  defenderTitle: 'Défenseur',
  lossesTitle: 'Pertes sur le champ',
  reportPrefix: 'Rapport',
};

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const RESOURCE_ICONS = {
  iron: '/assets/resources/iron.png',
  stone: '/assets/resources/stone.png',
  wood: '/assets/resources/wood.png',
} as const;

function targetLabel(report: CombatReportDto): string {
  if (report.targetKind === 'BARBARIAN_VILLAGE') {
    return `Village barbare${report.details?.targetTier ? ` ${report.details.targetTier}` : ''}`;
  }
  return 'Village joueur';
}

function participant({
  coord,
  name,
  place,
}: {
  coord: string;
  name: string;
  place: string;
}): CombatReportParticipant {
  return {
    coord,
    name,
    place,
  };
}

function allUnitTypes(report: CombatReportDto): string[] {
  return Array.from(
    new Set([
      ...Object.keys(report.totalUnitsAttacker ?? {}),
      ...Object.keys(report.totalUnitsDefender ?? {}),
    ]),
  ).sort();
}

function buildUnits(
  unitTypes: string[],
  totals: Record<string, number> | undefined,
  losses: Record<string, number> | undefined,
): CombatReportUnit[] {
  return unitTypes
    .map((unitType) => {
      const sent = totals?.[unitType] ?? 0;
      if (sent <= 0) return null;
      const meta = unitMetaFor(unitType);
      return {
        icon: meta.iconPath ?? '/assets/attack.png',
        lost: losses?.[unitType] ?? 0,
        name: meta.pluralName,
        sent,
      };
    })
    .filter((unit): unit is CombatReportUnit => Boolean(unit));
}

export function combatReportOutcome(report: CombatReportDto): {
  isVictory: boolean;
  outcome: CombatReportOutcome;
} {
  if (report.details?.captureFinalized) {
    const isVictory = report.recipientRole === 'attacker';
    return { isVictory, outcome: isVictory ? 'win' : 'lose' };
  }

  const attackerWon = isVictoryForAttacker(
    report.lossesAttacker,
    report.totalUnitsAttacker,
  );
  const isVictory = report.isAttacker ? attackerWon : !attackerWon;
  return { isVictory, outcome: isVictory ? 'win' : 'lose' };
}

export function combatReportTypeLabel(report: CombatReportDto): {
  icon: string;
  label: string;
  roleLabel: string;
} {
  if (report.details?.captureFinalized) {
    const isConqueror = report.recipientRole === 'attacker';
    return {
      icon: isConqueror ? '🏰' : '💔',
      label: isConqueror ? 'Capture réussie' : 'Capture perdue',
      roleLabel: isConqueror ? 'Conquérant' : 'Ancien propriétaire',
    };
  }

  if (report.recipientRole === 'observer') {
    return {
      icon: '👁️',
      label: 'Capture contestée',
      roleLabel: 'Propriétaire original',
    };
  }

  if (report.details?.occupationDefense) {
    return {
      icon: '🛡️',
      label: 'Défense de capture',
      roleLabel: 'Occupant',
    };
  }

  if (report.isAttacker) {
    return {
      icon: '⚔️',
      label:
        report.targetKind === 'BARBARIAN_VILLAGE'
          ? 'Pillage barbare'
          : 'Attaque',
      roleLabel: 'Attaquant',
    };
  }

  return { icon: '🛡️', label: 'Défense', roleLabel: 'Défenseur' };
}

function buildLootHighlight(
  report: CombatReportDto,
): CombatReportHighlight | undefined {
  const resources = report.loot?.resources ?? {};
  const remaining = report.loot?.remainingResources ?? {};
  const chips = (['wood', 'stone', 'iron'] as const)
    .map((resource) => {
      const looted = resources[resource] ?? 0;
      const stillThere = remaining[resource] ?? 0;
      if (looted + stillThere <= 0) return null;
      return {
        icon: RESOURCE_ICONS[resource],
        remainingValue: formatResourceAmount(looted + stillThere),
        value: formatResourceAmount(looted),
      };
    })
    .filter((chip): chip is NonNullable<typeof chip> => Boolean(chip));

  if (chips.length === 0) return undefined;

  return {
    chips,
    kind: report.isAttacker ? 'loot' : 'lootLost',
    title: report.isAttacker ? 'Butin ramené' : 'Ressources pillées',
  };
}

export function buildCombatReportModalProps(
  report: CombatReportDto,
  actions: CombatReportAction[],
  onAction?: (action: CombatReportAction) => void,
): CombatReportModalProps {
  const { isVictory, outcome } = combatReportOutcome(report);
  const target = targetLabel(report);
  const attackerCoord = formatCoord(
    report.attackerX ?? undefined,
    report.attackerY ?? undefined,
  );
  const defenderCoord = formatCoord(
    report.defenderX ?? report.targetX,
    report.defenderY ?? report.targetY,
  );
  const isSelfAttacker =
    report.recipientRole != null
      ? report.recipientRole === 'attacker'
      : report.isAttacker;
  const isSelfDefender =
    report.recipientRole != null
      ? report.recipientRole === 'defender'
      : !report.isAttacker;
  const attackerVillageName =
    report.attackerVillageName ??
    (isSelfAttacker ? 'Votre village' : 'Village attaquant');
  const defenderVillageName =
    report.defenderVillageName ??
    (isSelfDefender ? 'Votre village' : target);
  const attacker = participant({
    coord: attackerCoord,
    name: isSelfAttacker ? 'Vous' : attackerVillageName,
    place: isSelfAttacker ? attackerVillageName : 'Village attaquant',
  });
  const defender = participant({
    coord: defenderCoord,
    name: isSelfDefender ? 'Vous' : defenderVillageName,
    place: isSelfDefender ? defenderVillageName : target,
  });
  const unitTypes = allUnitTypes(report);
  const reportType = combatReportTypeLabel(report);

  return {
    actions,
    attacker,
    attackerUnits: buildUnits(
      unitTypes,
      report.totalUnitsAttacker,
      report.lossesAttacker,
    ),
    battleId: shortReportId(report.id),
    banner: isVictory ? 'VICTOIRE' : 'DÉFAITE',
    defender,
    defenderUnits: buildUnits(
      unitTypes,
      report.totalUnitsDefender,
      report.lossesDefender,
    ),
    highlight: buildLootHighlight(report),
    isPlayerAttacker: report.isAttacker,
    labels: combatReportLabels,
    maxHeight: 'min(90dvh, 760px)',
    motto: report.details?.captureFinalized
      ? isVictory
        ? '« La bannière du village est désormais vôtre. »'
        : '« Le registre consigne la perte du village. »'
      : isVictory
        ? '« Le champ de bataille vous appartient. »'
        : '« Le rapport consigne vos pertes. »',
    onAction,
    outcome,
    roleLabel: reportType.roleLabel,
    type: reportType.label,
    when: DATE_FORMATTER.format(new Date(report.timestamp)),
    width: 360,
  };
}
