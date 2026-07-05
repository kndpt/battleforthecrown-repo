import type { Prisma } from '@prisma/client';
import type { ScoutReportResponse } from '@battleforthecrown/shared/combat';
import {
  blurScoutResources,
  blurScoutUnits,
  deriveScoutPrecision,
  isStrategyRevealed,
  scoutSpyCount,
} from '@battleforthecrown/shared/combat';
import {
  VILLAGE_NATURAL_TRAITS,
  type VillageNaturalTrait,
} from '@battleforthecrown/shared/village';
import type { UnitMap } from '@battleforthecrown/shared/army';
import { parseUnitMap } from './codecs/unit-map.codec';
import { parseLootResourcesWithDefaults } from './codecs/loot.codec';

type ScoutReportInput = {
  id: string;
  scoutVillageId: string;
  targetVillageId: string | null;
  targetKind: string;
  targetX: number;
  targetY: number;
  targetName: string | null;
  targetTier: string | null;
  units: Prisma.JsonValue;
  resources: Prisma.JsonValue;
  strategy: string | null;
  details: Prisma.JsonValue;
  isRead: boolean;
  timestamp: Date;
};

/**
 * Normalise un `UnitMap` d'un `details` Json via le codec strict. Retourne
 * `undefined` (champ omis) sur payload legacy/corrompu, plutôt que de réémettre
 * une valeur brute qui ferait échouer le `.parse()` client (rétrocompat :
 * anciens rapports toujours consommables). Même contrat défensif que les autres
 * extracteurs de `details`.
 */
function safeUnitMap(value: unknown): UnitMap | undefined {
  if (!value || typeof value !== 'object') return undefined;
  try {
    return parseUnitMap(value, 'scoutReport.details.units');
  } catch {
    return undefined;
  }
}

function reportDetails(value: unknown): ScoutReportResponse['details'] {
  if (!value || typeof value !== 'object') return undefined;
  const details = value as Record<string, unknown>;
  const wallLevel = details.wallLevel;
  const castleLevel = details.castleLevel;
  const scoutLosses = safeUnitMap(details.scoutLosses);
  const scoutUnits = safeUnitMap(details.scoutUnits);
  return {
    ...(scoutLosses ? { scoutLosses } : {}),
    ...(scoutUnits ? { scoutUnits } : {}),
    ...(typeof wallLevel === 'number' ? { wallLevel } : {}),
    ...(typeof castleLevel === 'number' ? { castleLevel } : {}),
    ...newbieShieldDetails(details.newbieShield),
    ...defensiveFriendsDetails(details.defensiveFriendsDisplayNames),
    ...inactivityDetails(details.inactivity),
    ...naturalTraitDetails(details.naturalTrait),
  };
}

function naturalTraitDetails(
  value: unknown,
): Pick<NonNullable<ScoutReportResponse['details']>, 'naturalTrait'> | object {
  // Reject anything not a known trait from a corrupted or legacy Json payload
  // before it reaches the UI.
  if (
    typeof value !== 'string' ||
    !VILLAGE_NATURAL_TRAITS.includes(value as VillageNaturalTrait)
  ) {
    return {};
  }
  return { naturalTrait: value as VillageNaturalTrait };
}

function defensiveFriendsDetails(
  value: unknown,
):
  | Pick<
      NonNullable<ScoutReportResponse['details']>,
      'defensiveFriendsDisplayNames'
    >
  | object {
  if (!Array.isArray(value)) return {};
  const names = value.filter(
    (name): name is string => typeof name === 'string',
  );
  if (names.length === 0) return {};
  return { defensiveFriendsDisplayNames: names };
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

function inactivityDetails(
  value: unknown,
): Pick<NonNullable<ScoutReportResponse['details']>, 'inactivity'> | object {
  if (!value || typeof value !== 'object') return {};
  const inactivity = value as Record<string, unknown>;
  // Only the INACTIVE state is ever persisted (ACTIVE → field absent); reject
  // anything else defensively. `sinceDays` must be a number.
  if (inactivity.state !== 'INACTIVE') return {};
  // `sinceDays` is a floored non-negative day count upstream
  // (computeInactivityState); reject fractional/negative values from a
  // corrupted or legacy Json payload before they reach the UI.
  if (
    typeof inactivity.sinceDays !== 'number' ||
    !Number.isSafeInteger(inactivity.sinceDays) ||
    inactivity.sinceDays < 0
  ) {
    return {};
  }
  return { inactivity: { state: 'INACTIVE', sinceDays: inactivity.sinceDays } };
}

/**
 * Nombre d'ESPIONS engagés, extrait de `details.scoutUnits` (snapshot figé à
 * l'envoi). Base de dérivation de la précision — présent aussi sur les anciens
 * rapports, qui sont donc floutés rétroactivement de façon cohérente.
 */
function scoutSpyCountFromDetails(details: Prisma.JsonValue): number {
  if (!details || typeof details !== 'object') return 0;
  const raw = (details as Record<string, unknown>).scoutUnits;
  if (!raw || typeof raw !== 'object') return 0;
  try {
    return scoutSpyCount(parseUnitMap(raw, 'scoutReport.scoutUnits'));
  } catch {
    // `scoutUnits` legacy/corrompu (clé hors enum, float, négatif) : rester
    // défensif comme les autres extracteurs de `details` — jamais crasher le
    // presenter, retomber sur le palier le plus vague.
    return 0;
  }
}

export function presentScoutReport(
  report: ScoutReportInput,
): ScoutReportResponse {
  // La précision scale avec le nombre d'ESPIONS (run 090). Le flou est appliqué
  // ICI (read-time) : la DB garde le snapshot exact, mais l'exact ne transite
  // jamais vers le client sous le palier PRECISE.
  const precision = deriveScoutPrecision(
    scoutSpyCountFromDetails(report.details),
  );
  const exactUnits = parseUnitMap(report.units, 'scoutReport.units');
  const exactResources = parseLootResourcesWithDefaults(
    report.resources,
    'scoutReport.resources',
  );
  const blurredUnits = blurScoutUnits(exactUnits, precision);
  const blurredResources = blurScoutResources(exactResources, precision);

  return {
    id: report.id,
    scoutVillageId: report.scoutVillageId,
    targetVillageId: report.targetVillageId ?? undefined,
    targetKind: report.targetKind,
    targetX: report.targetX,
    targetY: report.targetY,
    targetName: report.targetName,
    targetTier: report.targetTier,
    precision,
    units: blurredUnits.units,
    resources: blurredResources.resources,
    ...(blurredUnits.unitRanges ? { unitRanges: blurredUnits.unitRanges } : {}),
    ...(blurredResources.resourceRanges
      ? { resourceRanges: blurredResources.resourceRanges }
      : {}),
    ...(blurredUnits.armyBand ? { armyBand: blurredUnits.armyBand } : {}),
    ...(blurredResources.resourceBand
      ? { resourceBand: blurredResources.resourceBand }
      : {}),
    // Le style stratégique n'est révélé qu'à partir du palier RANGED.
    strategy: isStrategyRevealed(precision) ? report.strategy : null,
    details: reportDetails(report.details),
    isRead: report.isRead,
    timestamp: report.timestamp.toISOString(),
  };
}
