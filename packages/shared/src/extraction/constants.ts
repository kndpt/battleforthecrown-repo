export const EXTRACTION_DURATIONS_HOURS = [2, 4, 8] as const;

export type ExtractionDurationHours =
  (typeof EXTRACTION_DURATIONS_HOURS)[number];

export type ExtractionResourceType = 'WOOD' | 'STONE' | 'IRON';

export const EXTRACTION_RATE_PER_VILLAGER_PER_HOUR = 40;
export const EXTRACTION_MIN_VILLAGERS = 5;
export const EXTRACTION_MAX_VILLAGERS = 30;
export const EXTRACTION_ESCORT_UNIT_CAP = 50;
export const EXTRACTION_SITE_INITIAL_CAPACITY = 12_000;
export const EXTRACTION_STEAL_RATIO = 0.5;
export const EXTRACTION_SITES_PER_PLAYER_RATIO = 0.5;
