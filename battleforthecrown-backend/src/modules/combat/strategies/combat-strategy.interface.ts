import type { CombatContext } from '../interfaces/combat-context.interface';

export type { CombatResolution } from '@battleforthecrown/shared/combat';

import type { CombatResolution } from '@battleforthecrown/shared/combat';

export interface CombatStrategy {
  /**
   * Resolves combat according to the strategy
   */
  resolve(context: CombatContext): Promise<CombatResolution>;
}
