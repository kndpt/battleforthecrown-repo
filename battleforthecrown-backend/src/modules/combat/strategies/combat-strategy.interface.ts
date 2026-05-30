import type { CombatContext } from '../interfaces/combat-context.interface';
import type { CombatResolution } from '@battleforthecrown/shared/combat';

export type { CombatResolution };

export interface CombatStrategy {
  /**
   * Resolves combat according to the strategy
   */
  resolve(context: CombatContext): Promise<CombatResolution>;
}
