import type {
  ScoutReportCardProps,
  ScoutReportSection,
} from '@/features/design-system/components/ScoutReportCard';
import {
  getPvpCaptureDurationLabel,
  type ScoutReportResponse,
} from '@battleforthecrown/shared/combat';
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

export function scoutReportTargetLabel(report: ScoutReportResponse): string {
  const base = TARGET_KIND_LABEL[report.targetKind] ?? report.targetKind;
  if (report.targetKind === 'BARBARIAN_VILLAGE' && report.targetTier) {
    return `${base} ${report.targetTier}`;
  }
  return base;
}

export function scoutReportTitle(report: ScoutReportResponse): string {
  return report.targetName?.trim() || scoutReportTargetLabel(report);
}

export function scoutReportUnitTotal(report: ScoutReportResponse): number {
  return Object.values(report.units ?? {}).reduce((sum, quantity) => sum + quantity, 0);
}

export function scoutReportResourceTotal(report: ScoutReportResponse): number {
  return (
    (report.resources?.wood ?? 0) +
    (report.resources?.stone ?? 0) +
    (report.resources?.iron ?? 0)
  );
}

function scoutReportUnitMapTotal(units: Record<string, number> | undefined): number {
  return Object.values(units ?? {}).reduce((sum, quantity) => sum + quantity, 0);
}

function formatRelativeTime(timestamp: string): string {
  const elapsedMs = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  if (elapsedMinutes < 1) return "à l'instant";
  if (elapsedMinutes < 60) return `il y a ${elapsedMinutes} min`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `il y a ${elapsedHours} h`;
  return `il y a ${Math.floor(elapsedHours / 24)} j`;
}

export function scoutReportStrategyLabel(strategy: string | null | undefined): string {
  if (!strategy) return 'Non applicable';
  return DEFAULT_VILLAGE_STRATEGY.strategies[strategy as VillageStrategyType]?.displayName ?? strategy;
}

export function buildScoutReportCardProps(
  report: ScoutReportResponse,
  onDelete: ScoutReportCardProps['action']['onClick'],
  deleteDisabled: boolean,
): ScoutReportCardProps {
  const scoutMeta = unitMetaFor('SPY');
  const scoutUnits = scoutReportUnitMapTotal(report.details?.scoutUnits);
  const scoutLosses = scoutReportUnitMapTotal(report.details?.scoutLosses);
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
      title: 'Espions',
      items: [
        {
          icon: scoutMeta.iconPath ?? '/assets/lupa.png',
          label: scoutMeta.name,
          troopBar: { lost: scoutLosses, sent: scoutUnits },
          value: NUMBER_FORMATTER.format(scoutUnits),
        },
      ],
    },
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
    ...(report.targetKind === 'BARBARIAN_VILLAGE'
      ? []
      : [
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
          {
            title: 'Fenêtre de capture',
            items: [
              {
                icon: '/assets/clock.png',
                label: 'Durée',
                value:
                  getPvpCaptureDurationLabel(report.details?.castleLevel) ??
                  'Inconnue',
              },
            ],
          },
        ]),
  ];

  return {
    action: {
      disabled: deleteDisabled,
      label: deleteDisabled ? 'Suppression...' : 'Supprimer',
      onClick: onDelete,
    },
    bannerIcon: '/assets/lupa.png',
    sections,
    targetName: scoutReportTitle(report),
    targetPrefix: 'Cible',
    timeLabel: formatRelativeTime(report.timestamp),
    title: 'Rapport scout',
    verdicts: [
      {
        label: 'Pillage estimé',
        value: NUMBER_FORMATTER.format(scoutReportResourceTotal(report)),
      },
      report.details?.wallLevel !== undefined
        ? {
            label: 'Menace · mur',
            tone: report.details.wallLevel > 0 ? 'danger' : 'default',
            value: `Niv. ${report.details.wallLevel}`,
          }
        : {
            label: 'Menace · mur',
            value: 'Inconnu',
          },
    ],
    villageLabel: `${scoutReportTargetLabel(report)} · ${report.targetX}|${report.targetY}`,
  };
}
