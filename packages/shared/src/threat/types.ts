import type { UnitType } from '../army';

export type ThreatLabel = 'Inconnue' | 'Faible' | 'Moyenne' | 'Élevée';
export type IntelFreshness = 'fresh' | 'recent' | 'stale' | 'outdated';

/** Sous-ensemble de l'intel consommé par la formule menace (mappé côté front depuis VillageIntelDto). */
export interface ThreatIntel {
  units: Partial<Record<UnitType, number>> | null;
  wallLevel: number | null;
}

export interface ThreatEstimateInput {
  /** null = jamais scouté (joueur). */
  intel: ThreatIntel | null;
  /** PublicVillagePowerDto.buildings — puissance bâtiments publique. */
  publicBuildingPower: number;
  /** Puissance d'attaque de l'armée envoyée (dérivée front depuis les sliders). */
  armyAttackPower: number;
  /** now - seenAt en ms ; null si pas d'intel. */
  intelAgeMs: number | null;
  isBarbarian: boolean;
  /** Tier barbare visible publiquement (1..N) ; null pour un joueur. */
  targetTier: number | null;
}
