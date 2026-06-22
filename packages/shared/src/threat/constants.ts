export const THREAT_LEVELS = ['Inconnue', 'Faible', 'Moyenne', 'Élevée'] as const;

export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;

/** Bornes de fraîcheur de l'intel (strictement inférieur à). */
export const INTEL_FRESHNESS_THRESHOLDS_MS = {
  fresh: 1 * HOUR_MS, // < 1h
  recent: 24 * HOUR_MS, // < 24h
  stale: 7 * DAY_MS, // < 7j
} as const;

/** Au-delà de ce seuil, l'estimation joueur retombe en `Inconnue`. = borne `outdated`. */
export const STALE_THRESHOLD_MS = INTEL_FRESHNESS_THRESHOLDS_MS.stale;

/** Bonus de défense estimé par niveau de mur. */
export const WALL_DEFENSE_BONUS_PER_LEVEL = 0.05;
/** Poids de la puissance bâtiments publique dans la défense estimée (signal secondaire, jamais suffisant seul pour un joueur). */
export const BUILDING_DEFENSE_WEIGHT = 0.5;
/** Défense estimée proxy par tier barbare (le tier est public, cf. 06-barbarians.md). */
export const BARBARIAN_TIER_DEFENSE_BASE = 150;

/** Seuils du ratio attaque/défense. ratio >= faible ⇒ menace `Faible` (victoire facile). */
export const THREAT_RATIO_THRESHOLDS = {
  faible: 1.5,
  moyenne: 0.75,
} as const;
