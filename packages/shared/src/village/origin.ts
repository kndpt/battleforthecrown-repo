export const VILLAGE_ORIGIN_KINDS = [
  'STANDARD',
  'ONBOARDING_NARRATIVE',
] as const;

export type VillageOriginKind = (typeof VILLAGE_ORIGIN_KINDS)[number];
