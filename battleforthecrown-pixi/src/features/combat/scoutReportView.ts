import type {
  ScoutReportCardProps,
  ScoutReportSection,
} from '@/features/design-system/components/ScoutReportCard';
import {
  getPvpCaptureDurationLabel,
  type ScoutMagnitudeBand,
  type ScoutRange,
  type ScoutReportResponse,
} from '@battleforthecrown/shared/combat';
import { formatInactivityLabel } from '@battleforthecrown/shared/world';
import { unitMetaFor } from '@/features/army/unitConfig';
import { formatResourceAmount, RESOURCE_ICON_PATHS, RESOURCE_DISPLAY_LABELS } from '@/lib/resourceConfig';
import { formatRemaining } from '@/features/village/constructionProgress';
import {
  DEFAULT_VILLAGE_STRATEGY,
  type VillageStrategyType,
} from '@battleforthecrown/shared/village';

import { NUMBER_FMT } from '@/lib/formatters';

const NUMBER_FORMATTER = NUMBER_FMT;

const TARGET_KIND_LABEL: Record<string, string> = {
  BARBARIAN_VILLAGE: 'Village barbare',
  PLAYER_VILLAGE: 'Village joueur',
};

const RESOURCE_ICONS = RESOURCE_ICON_PATHS;
const RESOURCE_LABELS = RESOURCE_DISPLAY_LABELS;

export function scoutReportTargetLabel(report: ScoutReportResponse): string {
  const base = TARGET_KIND_LABEL[report.targetKind] ?? report.targetKind;
  if (report.targetKind === 'BARBARIAN_VILLAGE' && report.targetTier) {
    return `${base} ${report.targetTier}`;
  }
  return base;
}

export function scoutReportTitle(report: ScoutReportResponse): string {
  // Les villages barbares n'ont jamais de nom affiché : on masque le nom de
  // fantaisie stocké et on retombe sur le label générique « Village barbare ».
  if (report.targetKind === 'BARBARIAN_VILLAGE') {
    return scoutReportTargetLabel(report);
  }
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

export interface NewbieShieldStatus {
  active: boolean;
  endsAt: string | null;
  /**
   * Temps restant figé au moment du scout (`endsAt - report.timestamp`).
   * `null` si le bouclier est inactif ou la valeur non dérivable. Snapshot —
   * jamais recalculé en live (cohérent avec wallLevel/castleLevel).
   */
  remainingLabel: string | null;
}

/**
 * État du bouclier débutant figé sur un rapport de scout. `null` si la cible
 * est barbare, sans membership, ou si le champ est absent (anciens rapports).
 */
export function getNewbieShieldStatus(
  report: ScoutReportResponse,
): NewbieShieldStatus | null {
  const shield = report.details?.newbieShield;
  if (!shield) return null;
  const endsAt = shield.endsAt ?? null;
  if (!shield.active) {
    return { active: false, endsAt, remainingLabel: null };
  }
  let remainingLabel: string | null = null;
  if (endsAt) {
    const remainingMs = Date.parse(endsAt) - Date.parse(report.timestamp);
    if (Number.isFinite(remainingMs) && remainingMs > 0) {
      remainingLabel = formatRemaining(remainingMs);
    }
  }
  return { active: true, endsAt, remainingLabel };
}

/**
 * Badge d'inactivité pré-abandon figé sur un rapport de scout (spec 18).
 * `undefined` si la cible est barbare, si le propriétaire était ACTIVE au
 * moment du scout, ou pour un ancien rapport (champ absent). Snapshot — jamais
 * recalculé en live, jamais dérivé d'un `lastLoginAt` brut (non exposé).
 */
export function getInactivityBadge(
  report: ScoutReportResponse,
): { label: string } | undefined {
  const inactivity = report.details?.inactivity;
  if (!inactivity) return undefined;
  return { label: formatInactivityLabel(inactivity.sinceDays) };
}

export function scoutReportStrategyLabel(strategy: string | null | undefined): string {
  if (!strategy) return 'Non applicable';
  return DEFAULT_VILLAGE_STRATEGY.strategies[strategy as VillageStrategyType]?.displayName ?? strategy;
}

/**
 * Defensive-friends section for a PvP scout. The list is a snapshot frozen at
 * scout time (cf. wallLevel/newbieShield). Omitted entirely when the field is
 * absent (barbarian / old reports / no friends) so we never render an empty
 * "Amis défensifs : —" row. Display is capped at the MVP cap (5).
 */
function buildDefensiveFriendsSections(
  names: string[] | undefined,
): ScoutReportSection[] {
  if (!names || names.length === 0) return [];
  const shown = names.slice(0, 5);
  return [
    {
      title: 'Amis défensifs',
      items: [
        {
          icon: '/assets/hand-silver.png',
          label: `${shown.length} ami${shown.length > 1 ? 's' : ''}`,
          value: shown.join(', '),
        },
      ],
    },
  ];
}

/** Libellés FR des bandes de magnitude (palier VAGUE). */
const SCOUT_BAND_LABELS: Record<ScoutMagnitudeBand, string> = {
  NONE: 'Aucune',
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Élevée',
  VERY_HIGH: 'Très élevée',
};

/** Libellé de fiabilité affiché en verdict + note. */
export function scoutReportPrecisionLabel(report: ScoutReportResponse): string {
  switch (report.precision) {
    case 'PRECISE':
      return 'Précis';
    case 'RANGED':
      return 'Fourchettes';
    default:
      return 'Estimation vague';
  }
}

function formatUnitRange(range: ScoutRange): string {
  if (range.min === range.max) return NUMBER_FORMATTER.format(range.min);
  return `${NUMBER_FORMATTER.format(range.min)}–${NUMBER_FORMATTER.format(range.max)}`;
}

function formatResourceRange(range: ScoutRange): string {
  if (range.min === range.max) return formatResourceAmount(range.min);
  return `${formatResourceAmount(range.min)}–${formatResourceAmount(range.max)}`;
}

/**
 * Section « Armée observée » — rendu selon la précision (run 090) :
 * compo exacte (PRECISE), fourchettes par type (RANGED), ou magnitude
 * catégorielle (VAGUE).
 */
function buildArmySection(report: ScoutReportResponse): ScoutReportSection {
  const title = 'Armée observée';
  if (report.precision === 'RANGED' && report.unitRanges) {
    const items = Object.entries(report.unitRanges)
      .filter(([, range]) => range && range.max > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([unitType, range]) => {
        const meta = unitMetaFor(unitType);
        return {
          icon: meta.iconPath ?? '/assets/army-power.png',
          label: meta.name,
          value: formatUnitRange(range as ScoutRange),
        };
      });
    return {
      title,
      items:
        items.length > 0
          ? items
          : [{ icon: '/assets/army-power.png', label: 'Unités', value: '≈ 0' }],
    };
  }
  if (report.precision === 'VAGUE') {
    return {
      title,
      items: [
        {
          icon: '/assets/army-power.png',
          label: 'Ampleur',
          value: SCOUT_BAND_LABELS[report.armyBand ?? 'NONE'],
        },
      ],
    };
  }
  const items = Object.entries(report.units ?? {})
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
  return {
    title,
    items:
      items.length > 0
        ? items
        : [{ icon: '/assets/army-power.png', label: 'Unités', value: '0' }],
  };
}

/** Section « Ressources » — exact / fourchettes / magnitude selon la précision. */
function buildResourceSection(report: ScoutReportResponse): ScoutReportSection {
  const title = 'Ressources';
  if (report.precision === 'RANGED' && report.resourceRanges) {
    const ranges = report.resourceRanges;
    return {
      title,
      items: (['wood', 'stone', 'iron'] as const).map((resource) => ({
        icon: RESOURCE_ICONS[resource],
        label: RESOURCE_LABELS[resource],
        value: formatResourceRange(ranges[resource]),
      })),
    };
  }
  if (report.precision === 'VAGUE') {
    return {
      title,
      items: [
        {
          icon: RESOURCE_ICONS.wood,
          label: 'Stock',
          value: SCOUT_BAND_LABELS[report.resourceBand ?? 'NONE'],
        },
      ],
    };
  }
  return {
    title,
    items: (['wood', 'stone', 'iron'] as const).map((resource) => ({
      icon: RESOURCE_ICONS[resource],
      label: RESOURCE_LABELS[resource],
      value: formatResourceAmount(report.resources?.[resource] ?? 0),
    })),
  };
}

/** Valeur du verdict « Pillage estimé » selon la précision. */
function pillageVerdictValue(report: ScoutReportResponse): string {
  if (report.precision === 'RANGED' && report.resourceRanges) {
    const ranges = report.resourceRanges;
    const mid = (['wood', 'stone', 'iron'] as const).reduce(
      (sum, resource) =>
        sum + Math.round((ranges[resource].min + ranges[resource].max) / 2),
      0,
    );
    return `≈ ${NUMBER_FORMATTER.format(mid)}`;
  }
  if (report.precision === 'VAGUE') {
    return SCOUT_BAND_LABELS[report.resourceBand ?? 'NONE'];
  }
  return NUMBER_FORMATTER.format(scoutReportResourceTotal(report));
}

export function buildScoutReportCardProps(
  report: ScoutReportResponse,
  onDelete: ScoutReportCardProps['action']['onClick'],
  deleteDisabled: boolean,
): ScoutReportCardProps {
  const scoutMeta = unitMetaFor('SPY');
  const scoutUnits = scoutReportUnitMapTotal(report.details?.scoutUnits);
  const scoutLosses = scoutReportUnitMapTotal(report.details?.scoutLosses);

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
    buildArmySection(report),
    buildResourceSection(report),
    ...(report.targetKind === 'BARBARIAN_VILLAGE'
      ? []
      : [
          {
            title: 'Style stratégique',
            items: [
              {
                icon: '/assets/strategy-icons/spritesheet.png',
                label: 'Style',
                value:
                  report.precision === 'VAGUE'
                    ? 'Inconnu'
                    : scoutReportStrategyLabel(report.strategy),
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
          ...buildDefensiveFriendsSections(
            report.details?.defensiveFriendsDisplayNames,
          ),
        ]),
  ];

  const shieldStatus = getNewbieShieldStatus(report);

  return {
    action: {
      disabled: deleteDisabled,
      label: deleteDisabled ? 'Suppression...' : 'Supprimer',
      onClick: onDelete,
    },
    bannerIcon: '/assets/lupa.png',
    shieldBadge: shieldStatus?.active
      ? { label: 'Bouclier débutant', remaining: shieldStatus.remainingLabel }
      : undefined,
    inactivityBadge: getInactivityBadge(report),
    naturalTraitBadge: report.details?.naturalTrait,
    // Un rapport imprécis (peu d'espions) affiche la raison du flou.
    note:
      report.precision === 'PRECISE'
        ? undefined
        : `Fiabilité : ${scoutReportPrecisionLabel(report)}. Envoyer plus d'espions affine le rapport.`,
    sections,
    targetName: scoutReportTitle(report),
    targetPrefix: 'Cible',
    timeLabel: formatRelativeTime(report.timestamp),
    title: 'Rapport scout',
    verdicts: [
      {
        label: 'Pillage estimé',
        value: pillageVerdictValue(report),
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
      {
        label: 'Fiabilité',
        value: scoutReportPrecisionLabel(report),
      },
    ],
    villageLabel: `${scoutReportTargetLabel(report)} · ${report.targetX}|${report.targetY}`,
  };
}
