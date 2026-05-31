import type { UnitMap } from '../army/unit-map';

// Cooldown base en ms avant de pouvoir relancer un combat
const BASE_COOLDOWN_MS = 5 * 60 * 1000;

export function calculateCombatCooldown(
  attackerUnits: UnitMap,
  result: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  bonusMultiplier?: number
): number {
  const unitCount = Object.values(attackerUnits).reduce(
    (sum, qty) => sum + (qty ?? 0),
    0
  );

  const victoryBonus = result.victory ? 0.5 : 1;
  const multiplier = (bonusMultiplier ?? 1) * victoryBonus;

  // Plus l'armée est grande, plus le cooldown est long
  const scaledCooldown = BASE_COOLDOWN_MS + unitCount * 120000;

  return Math.round(scaledCooldown * multiplier);
}

export function formatCooldownLabel(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
