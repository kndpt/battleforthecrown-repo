import { UNIT_STATS } from '../army';
import type { UnitType } from '../army';
import {
  BARBARIAN_TIER_DEFENSE_BASE,
  BUILDING_DEFENSE_WEIGHT,
  INTEL_FRESHNESS_THRESHOLDS_MS,
  STALE_THRESHOLD_MS,
  THREAT_RATIO_THRESHOLDS,
  WALL_DEFENSE_BONUS_PER_LEVEL,
} from './constants';
import type { IntelFreshness, ThreatEstimateInput, ThreatLabel } from './types';

export function formatIntelFreshness(intelAgeMs: number): IntelFreshness {
  if (intelAgeMs < INTEL_FRESHNESS_THRESHOLDS_MS.fresh) return 'fresh';
  if (intelAgeMs < INTEL_FRESHNESS_THRESHOLDS_MS.recent) return 'recent';
  if (intelAgeMs < INTEL_FRESHNESS_THRESHOLDS_MS.stale) return 'stale';
  return 'outdated';
}

export function computeThreatLabel(input: ThreatEstimateInput): ThreatLabel {
  const { intel, publicBuildingPower, armyAttackPower, intelAgeMs, isBarbarian, targetTier } = input;

  let defensePower: number;

  if (isBarbarian) {
    // Tier est public : jamais Inconnue pour un barbare.
    defensePower = (targetTier ?? 1) * BARBARIAN_TIER_DEFENSE_BASE + publicBuildingPower * BUILDING_DEFENSE_WEIGHT;
  } else {
    // Joueur : vérifications fraîcheur et présence d'intel.
    if (intel === null) return 'Inconnue';
    if (intel.units == null) return 'Inconnue';
    if (intelAgeMs === null || intelAgeMs >= STALE_THRESHOLD_MS) return 'Inconnue';

    // Calcul défense troupes : moyenne des trois archétypes de défense.
    let troopDef = 0;
    for (const [unitTypeKey, qty] of Object.entries(intel.units)) {
      if (!qty) continue;
      const stats = UNIT_STATS[unitTypeKey as UnitType];
      if (!stats) continue;
      troopDef += qty * (stats.defenseInfantry + stats.defenseCavalry + stats.defenseArcher) / 3;
    }

    const wallMult = 1 + (intel.wallLevel ?? 0) * WALL_DEFENSE_BONUS_PER_LEVEL;
    defensePower = troopDef * wallMult + publicBuildingPower * BUILDING_DEFENSE_WEIGHT;
  }

  const ratio = armyAttackPower / Math.max(1, defensePower);

  if (ratio >= THREAT_RATIO_THRESHOLDS.faible) return 'Faible';
  if (ratio >= THREAT_RATIO_THRESHOLDS.moyenne) return 'Moyenne';
  return 'Élevée';
}
