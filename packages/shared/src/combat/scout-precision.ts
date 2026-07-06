import { UNIT_TYPES, type UnitType } from '../army/types';
import type { UnitMap } from '../army/unit-map';
import type { LootResources } from './loot';

/**
 * Qualité d'un rapport de scout, dérivée du nombre d'ESPIONS envoyés
 * (cf. docs/gameplay/11-scouting.md § Qualité du renseignement, run 090).
 *
 * L'information devient une ressource stratégique : plus on envoie d'espions,
 * plus le rapport est précis.
 * - `VAGUE`   (1-2 espions)  : aucune compo ni stock exacts, seulement une
 *                              magnitude catégorielle.
 * - `RANGED`  (3-9 espions)  : fourchettes déterministes par type d'unité et
 *                              par ressource.
 * - `PRECISE` (>= 10 espions): compo + stock exacts (parité historique).
 */
export type ScoutPrecision = 'VAGUE' | 'RANGED' | 'PRECISE';

export const SCOUT_PRECISIONS = ['VAGUE', 'RANGED', 'PRECISE'] as const;

/** Seuils **fixes** (bornes figées T1). `>=` pour chaque palier. */
export const SCOUT_PRECISION_THRESHOLDS = {
  ranged: 3,
  precise: 10,
} as const;

/**
 * Palier de précision d'un rapport à partir du nombre d'ESPIONS engagés.
 * Un compte non fini / négatif retombe sur le palier le plus vague (0 espion
 * n'est pas censé produire de rapport, mais on ne crashe jamais).
 */
export function deriveScoutPrecision(spyCount: number): ScoutPrecision {
  const count = Number.isFinite(spyCount) ? Math.floor(spyCount) : 0;
  if (count >= SCOUT_PRECISION_THRESHOLDS.precise) return 'PRECISE';
  if (count >= SCOUT_PRECISION_THRESHOLDS.ranged) return 'RANGED';
  return 'VAGUE';
}

/** Nombre d'ESPIONS engagés déduit du snapshot `details.scoutUnits`. */
export function scoutSpyCount(
  scoutUnits: UnitMap | null | undefined,
): number {
  if (!scoutUnits) return 0;
  // Une expédition de scout ne contient que des ESPIONS ; on lit la clé SPY et,
  // par robustesse (payload legacy), on retombe sur la somme des valeurs.
  const spy = scoutUnits[UNIT_TYPES.SPY];
  if (typeof spy === 'number' && Number.isFinite(spy)) return spy;
  return Object.values(scoutUnits).reduce(
    (sum, q) => sum + (typeof q === 'number' && Number.isFinite(q) ? q : 0),
    0,
  );
}

/** Fourchette déterministe `[min, max]` autour d'une valeur exacte. */
export interface ScoutRange {
  min: number;
  max: number;
}

/** Bandes de magnitude catégorielles (palier VAGUE). */
export const SCOUT_MAGNITUDE_BANDS = [
  'NONE',
  'LOW',
  'MEDIUM',
  'HIGH',
  'VERY_HIGH',
] as const;

export type ScoutMagnitudeBand = (typeof SCOUT_MAGNITUDE_BANDS)[number];

export type ScoutUnitRanges = Partial<Record<UnitType, ScoutRange>>;

export interface ScoutResourceRanges {
  wood: ScoutRange;
  stone: ScoutRange;
  iron: ScoutRange;
}

/**
 * Pas de bucket par magnitude (troupes). Table figée T1. La borne `below` est
 * stricte : une valeur exactement égale bascule sur le pas suivant (plus large).
 */
const UNIT_BUCKET_STEPS: ReadonlyArray<{ below: number; step: number }> = [
  { below: 10, step: 5 },
  { below: 50, step: 10 },
  { below: 200, step: 25 },
  { below: 1000, step: 100 },
  { below: Number.POSITIVE_INFINITY, step: 250 },
];

/** Idem pour les ressources (ordres de grandeur plus élevés). */
const RESOURCE_BUCKET_STEPS: ReadonlyArray<{ below: number; step: number }> = [
  { below: 100, step: 50 },
  { below: 1000, step: 250 },
  { below: 10_000, step: 1000 },
  { below: 100_000, step: 5000 },
  { below: Number.POSITIVE_INFINITY, step: 25_000 },
];

function bucketStep(
  value: number,
  table: ReadonlyArray<{ below: number; step: number }>,
): number {
  for (const { below, step } of table) {
    if (value < below) return step;
  }
  return table[table.length - 1].step;
}

/**
 * Fourchette bucketisée `[min, max]` : `min` = plancher du bucket contenant la
 * valeur exacte, `max` = plancher suivant. La valeur exacte n'est **jamais** le
 * centre de la fourchette (sinon fuite triviale). Déterministe, sans RNG.
 */
function bucketRange(
  value: number,
  table: ReadonlyArray<{ below: number; step: number }>,
): ScoutRange {
  const v = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  if (v <= 0) return { min: 0, max: 0 };
  const step = bucketStep(v, table);
  const min = Math.floor(v / step) * step;
  return { min, max: min + step };
}

/** Point médian d'une fourchette (valeur représentative pour le carnet d'intel). */
function rangeMidpoint(range: ScoutRange): number {
  return Math.round((range.min + range.max) / 2);
}

function magnitudeBand(
  total: number,
  bounds: { low: number; medium: number; high: number },
): ScoutMagnitudeBand {
  const t = Number.isFinite(total) && total > 0 ? total : 0;
  if (t <= 0) return 'NONE';
  if (t < bounds.low) return 'LOW';
  if (t < bounds.medium) return 'MEDIUM';
  if (t < bounds.high) return 'HIGH';
  return 'VERY_HIGH';
}

const ARMY_BAND_BOUNDS = { low: 20, medium: 100, high: 400 } as const;
const RESOURCE_BAND_BOUNDS = { low: 1000, medium: 10_000, high: 100_000 } as const;

function unitTotal(units: UnitMap): number {
  return Object.values(units).reduce(
    (sum, q) => sum + (typeof q === 'number' && Number.isFinite(q) ? q : 0),
    0,
  );
}

function resourceTotal(resources: LootResources): number {
  return (resources.wood ?? 0) + (resources.stone ?? 0) + (resources.iron ?? 0);
}

/** Vue floutée des unités, prête à sérialiser dans `ScoutReportResponse`. */
export interface BlurredUnits {
  units: UnitMap | null;
  unitRanges: ScoutUnitRanges | null;
  armyBand: ScoutMagnitudeBand | null;
}

/** Vue floutée des ressources, prête à sérialiser dans `ScoutReportResponse`. */
export interface BlurredResources {
  resources: LootResources | null;
  resourceRanges: ScoutResourceRanges | null;
  resourceBand: ScoutMagnitudeBand | null;
}

/** Applique le flou aux unités selon le palier de précision (read-time). */
export function blurScoutUnits(
  units: UnitMap,
  precision: ScoutPrecision,
): BlurredUnits {
  if (precision === 'PRECISE') {
    return { units, unitRanges: null, armyBand: null };
  }
  if (precision === 'RANGED') {
    const unitRanges: ScoutUnitRanges = {};
    for (const [unitType, quantity] of Object.entries(units)) {
      if (typeof quantity !== 'number' || quantity <= 0) continue;
      unitRanges[unitType as UnitType] = bucketRange(quantity, UNIT_BUCKET_STEPS);
    }
    return { units: null, unitRanges, armyBand: null };
  }
  // VAGUE : aucune compo, seulement une magnitude.
  return {
    units: null,
    unitRanges: null,
    armyBand: magnitudeBand(unitTotal(units), ARMY_BAND_BOUNDS),
  };
}

/** Applique le flou aux ressources selon le palier de précision (read-time). */
export function blurScoutResources(
  resources: LootResources,
  precision: ScoutPrecision,
): BlurredResources {
  if (precision === 'PRECISE') {
    return { resources, resourceRanges: null, resourceBand: null };
  }
  if (precision === 'RANGED') {
    return {
      resources: null,
      resourceRanges: {
        wood: bucketRange(resources.wood, RESOURCE_BUCKET_STEPS),
        stone: bucketRange(resources.stone, RESOURCE_BUCKET_STEPS),
        iron: bucketRange(resources.iron, RESOURCE_BUCKET_STEPS),
      },
      resourceBand: null,
    };
  }
  return {
    resources: null,
    resourceRanges: null,
    resourceBand: magnitudeBand(resourceTotal(resources), RESOURCE_BAND_BOUNDS),
  };
}

/** Le style stratégique n'est révélé qu'à partir du palier RANGED. */
export function isStrategyRevealed(precision: ScoutPrecision): boolean {
  return precision !== 'VAGUE';
}

/**
 * Valeur représentative des unités pour le **carnet d'intel** (shape `UnitMap`
 * exacte, pas de fourchette possible en base) :
 * - PRECISE → compo exacte ;
 * - RANGED  → médiane des buckets (estimation grossière mais exploitable) ;
 * - VAGUE   → `{}` (compo inconnue).
 */
export function representativeIntelUnits(
  units: UnitMap,
  precision: ScoutPrecision,
): UnitMap {
  if (precision === 'PRECISE') return units;
  if (precision === 'VAGUE') return {};
  const out: UnitMap = {};
  for (const [unitType, quantity] of Object.entries(units)) {
    if (typeof quantity !== 'number' || quantity <= 0) continue;
    out[unitType as UnitType] = rangeMidpoint(
      bucketRange(quantity, UNIT_BUCKET_STEPS),
    );
  }
  return out;
}

/**
 * Valeur représentative des ressources pour le carnet d'intel :
 * - PRECISE → stock exact ;
 * - RANGED  → médiane des buckets ;
 * - VAGUE   → `{0,0,0}` (stock inconnu).
 */
export function representativeIntelResources(
  resources: LootResources,
  precision: ScoutPrecision,
): LootResources {
  if (precision === 'PRECISE') return resources;
  if (precision === 'VAGUE') return { wood: 0, stone: 0, iron: 0 };
  return {
    wood: rangeMidpoint(bucketRange(resources.wood, RESOURCE_BUCKET_STEPS)),
    stone: rangeMidpoint(bucketRange(resources.stone, RESOURCE_BUCKET_STEPS)),
    iron: rangeMidpoint(bucketRange(resources.iron, RESOURCE_BUCKET_STEPS)),
  };
}

/**
 * Une compo/stock est « révélé » (et peut donc écraser une valeur plus riche
 * du carnet) dès RANGED. Au VAGUE, la compo exacte n'est pas apprise → on ne
 * doit pas dégrader une observation antérieure plus précise (pattern « si
 * révélé » de `recordIntel`).
 */
export function isIntelCompositionRevealed(precision: ScoutPrecision): boolean {
  return precision !== 'VAGUE';
}
