import type {
  ScoutReportCardProps,
  ScoutReportSection,
} from '@/features/design-system/components/ScoutReportCard';
import type { ScoutReportDto } from '@/api/queries';
import { unitMetaFor } from '@/features/army/unitConfig';
import { formatResourceAmount } from '@/lib/resourceConfig';
import { DEFAULT_VILLAGE_STRATEGY, type VillageStrategyType } from '@battleforthecrown/shared/village';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');

const TARGET_KIND_LABEL: Record<string, string> = {
  BARBARIAN_VILLAGE: 'Village barbare',
  PLAYER_VILLAGE: 'Village joueur',
};

const RESOURCE_ICONS = {
  wood: '/assets/resources/wood.png',
  stone: '/assets/resources/stone.png',
  iron: '/assets/resources/iron.png',
} as const;

const RESOURCE_LABELS = {
  wood: 'Bois',
  stone: 'Pierre',
  iron: 'Fer',
} as const;

export function scoutReportTargetLabel(report: ScoutReportDto): string {
  const base = TARGET_KIND_LABEL[report.targetKind] ?? report.targetKind;
  if (report.targetKind === 'BARBARIAN_VILLAGE' && report.targetTier) {
    return `${base} ${report.targetTier}`;
  }
  return base;
}

export function scoutReportTitle(report: ScoutReportDto): string {
  return report.targetName?.trim() || scoutReportTargetLabel(report);
}

export function scoutReportUnitTotal(report: ScoutReportDto): number {
  return Object.values(report.units ?? {}).reduce((sum, quantity) => sum + quantity, 0);
}

export function scoutReportResourceTotal(report: ScoutReportDto): number {
  return (
    (report.resources?.wood ?? 0) +
    (report.resources?.stone ?? 0) +
    (report.resources?.iron ?? 0)
  );
}

export function scoutReportStrategyLabel(strategy: string | null | undefined): string {
  if (!strategy) return 'Non applicable';
  return DEFAULT_VILLAGE_STRATEGY.strategies[strategy as VillageStrategyType]?.displayName ?? strategy;
}

export function buildScoutReportCardProps(
  report: ScoutReportDto,
  onDelete: ScoutReportCardProps['action']['onClick'],
  deleteDisabled: boolean,
): ScoutReportCardProps {
  const armyItems = Object.entries(report.units ?? {})
    .filter(([, quantity]) => quantity > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([unitType, quantity]) => {
      const meta = unitMetaFor(unitType);
      return {
        icon: meta.iconPath ?? '/assets/army-power.png',
        label: meta.name,
        value: NUMBER_FORMATTER.format(quantity),
      };
    });

  const resourceItems = (['wood', 'stone', 'iron'] as const).map((resource) => ({
    icon: RESOURCE_ICONS[resource],
    label: RESOURCE_LABELS[resource],
    value: formatResourceAmount(report.resources?.[resource] ?? 0),
  }));

  const sections: ScoutReportSection[] = [
    {
      title: 'Armée observée',
      items: armyItems.length > 0
        ? armyItems
        : [{ icon: '/assets/army-power.png', label: 'Unités', value: '0' }],
    },
    {
      title: 'Ressources',
      items: resourceItems,
    },
    {
      title: 'Style stratégique',
      items: [
        {
          icon: '/assets/strategy-icons/spritesheet.png',
          label: 'Style',
          value: scoutReportStrategyLabel(report.strategy),
        },
      ],
    },
  ];

  return {
    action: {
      disabled: deleteDisabled,
      label: deleteDisabled ? 'Suppression...' : 'Supprimer',
      onClick: onDelete,
    },
    bannerIcon: '/assets/watchtower.png',
    metaLabel: report.isRead ? 'Lu' : 'Nouveau',
    note: "Snapshot observé à l'arrivée des ESPIONs. Les stocks et troupes peuvent avoir changé depuis.",
    sections,
    targetName: scoutReportTitle(report),
    targetPrefix: scoutReportTargetLabel(report),
    timeLabel: new Date(report.timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    title: 'Rapport scout',
    verdicts: [
      {
        label: 'Unités',
        value: NUMBER_FORMATTER.format(scoutReportUnitTotal(report)),
      },
      {
        label: 'Stock',
        value: formatResourceAmount(scoutReportResourceTotal(report)),
      },
    ],
    villageLabel: `(${report.targetX}, ${report.targetY})`,
  };
}
