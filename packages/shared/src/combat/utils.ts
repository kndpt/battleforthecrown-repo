export interface CasualtyStats {
  total: number;
  losses: number;
  casualtyRate: number;
}

/**
 * Calculate casualty statistics for a unit collection.
 * Returns total / losses / casualty rate as a percentage (0..100).
 */
export function calculateCasualtyStats(
  original: Record<string, number>,
  losses: Record<string, number>,
): CasualtyStats {
  const total = Object.values(original).reduce((sum, qty) => sum + qty, 0);
  const lossesTotal = Object.values(losses).reduce((sum, qty) => sum + qty, 0);
  const casualtyRate = total > 0 ? Math.round((lossesTotal / total) * 100) : 0;
  return { total, losses: lossesTotal, casualtyRate };
}

/** True if at least one attacker unit survived. */
export function isVictoryForAttacker(
  losses: Record<string, number>,
  original: Record<string, number>,
): boolean {
  for (const [unitType, originalQty] of Object.entries(original)) {
    const lost = losses[unitType] || 0;
    if (originalQty - lost > 0) {
      return true;
    }
  }
  return false;
}
