/**
 * Anti-snowball power guard — spec `14-pvp-conquest.md` § 2.
 *
 * An attack (raid OR PvP conquest) is forbidden when the defender's kingdom
 * power is strictly below 1/3 of the attacker's. At exactly 1/3, it is allowed.
 * The check is unidirectional: only the attacker is bounded (heroic asymmetry —
 * a small player may always attack a large one). Barbarian villages are out of
 * scope (no defensive power).
 */
export const POWER_RATIO_DIVISOR = 3;

export interface PowerRatioInput {
  /** Attacker's total kingdom power (Σ of all their villages). */
  attackerPower: number;
  /** Defender's total kingdom power (Σ of all their villages). */
  defenderPower: number;
}

/**
 * Returns `true` when the attack respects the power ratio guard.
 *
 * Uses multiplication (`defenderPower * 3 >= attackerPower`) instead of a
 * float division to keep the comparison exact and integer-safe.
 *
 * Degenerate case `attackerPower = 0` → always allowed (in practice covered by
 * the 48h newbie shield; deterministic value kept here regardless).
 */
export function isAttackAllowedByPowerRatio({
  attackerPower,
  defenderPower,
}: PowerRatioInput): boolean {
  return defenderPower * POWER_RATIO_DIVISOR >= attackerPower;
}
