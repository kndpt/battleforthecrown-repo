import {
  computeThreatLabel,
  STALE_THRESHOLD_MS,
  type ThreatLabel,
} from '@battleforthecrown/shared';
import type { VillageIntelDto, WorldTier } from '@battleforthecrown/shared/world';

export interface BuildThreatViewParams {
  target: { kind: string; tier?: WorldTier | null };
  intel: VillageIntelDto | null;
  publicBuildingPower: number;
  armyAttackPower: number;
  now: number;
}

/** 'T1'..'T5' (tier barbare public) → 1..5 ; null sinon. */
function tierToNumber(tier: WorldTier | null | undefined): number | null {
  if (tier == null) return null;
  const n = Number.parseInt(tier.slice(1), 10);
  return Number.isFinite(n) ? n : null;
}

export interface ThreatEstimateView {
  label: ThreatLabel;
  tone: 'unknown' | 'low' | 'medium' | 'high';
  tooltip: string;
  freshnessNote: string | null;
}

const TONE_MAP: Record<ThreatLabel, ThreatEstimateView['tone']> = {
  Inconnue: 'unknown',
  Faible: 'low',
  Moyenne: 'medium',
  Élevée: 'high',
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function buildThreatEstimateView(
  params: BuildThreatViewParams,
): ThreatEstimateView {
  const { target, intel, publicBuildingPower, armyAttackPower, now } = params;

  const isBarbarian = target.kind === 'BARBARIAN_VILLAGE';
  const intelAgeMs = intel ? now - Date.parse(intel.seenAt) : null;

  const mappedIntel =
    intel != null
      ? { units: intel.units, wallLevel: intel.wallLevel }
      : null;

  const label = computeThreatLabel({
    intel: mappedIntel,
    publicBuildingPower,
    armyAttackPower,
    intelAgeMs,
    isBarbarian,
    targetTier: isBarbarian ? tierToNumber(target.tier) : null,
  });

  const tone = TONE_MAP[label];

  let tooltip: string;
  if (!isBarbarian && intel === null) {
    tooltip = 'Envoyer un ESPION pour estimer la menace';
  } else if (
    !isBarbarian &&
    intelAgeMs !== null &&
    intelAgeMs >= STALE_THRESHOLD_MS
  ) {
    tooltip = 'Intel trop ancienne, envoie un nouveau scout';
  } else {
    switch (label) {
      case 'Faible':
        tooltip = 'Cible probablement prenable';
        break;
      case 'Moyenne':
        tooltip = 'Combat incertain, pertes possibles';
        break;
      case 'Élevée':
        tooltip = 'Risque fort de défaite ou pertes lourdes';
        break;
      default:
        tooltip = 'Estimation indisponible';
    }
  }

  // freshnessNote uniquement si l'intel a réellement servi (joueur, non-null, non-stale, label != Inconnue)
  const freshnessNote =
    !isBarbarian &&
    intel !== null &&
    intelAgeMs !== null &&
    intelAgeMs < STALE_THRESHOLD_MS &&
    label !== 'Inconnue'
      ? `Estimation basée sur scout du ${shortDate(intel.seenAt)}`
      : null;

  return { label, tone, tooltip, freshnessNote };
}
