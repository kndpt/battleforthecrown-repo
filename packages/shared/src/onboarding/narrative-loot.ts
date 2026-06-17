import { getWarehouseStorageLimit } from '../resources/storage';
import { getWarehouseLevel } from '../world/barbarian-templates';

/** Loot fill ratio for the onboarding narrative barbarian (cf. `15-onboarding.md`). */
export const ONBOARDING_NARRATIVE_RESOURCE_FILL = 0.4;

export interface OnboardingNarrativeLoot {
  wood: number;
  stone: number;
  iron: number;
}

export function getOnboardingNarrativeLoot(tier = 'T1'): OnboardingNarrativeLoot {
  const maxPerType = getWarehouseStorageLimit(getWarehouseLevel(tier)).wood;
  const fillRatio = ONBOARDING_NARRATIVE_RESOURCE_FILL;

  return {
    wood: Math.floor(maxPerType * fillRatio),
    stone: Math.floor(maxPerType * fillRatio),
    iron: Math.floor(maxPerType * fillRatio * 0.7),
  };
}
