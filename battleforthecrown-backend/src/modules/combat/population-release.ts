import { type UnitMap } from '@battleforthecrown/shared/army';
import type { PrismaClientOrTx } from '../../common/prisma.types';
import { sumPopulationCost } from './combat.utils';

/**
 * Release `villageId`'s population for units killed in combat. A dead unit's
 * population is freed back to the village pool at *resolution* (not at return) —
 * see `docs/gameplay/02-economy-and-progression.md` § Population. No-op when the
 * losses free zero population, so callers can invoke it unconditionally.
 *
 * Single home for the `sumPopulationCost` + `population.used` decrement pattern
 * shared by combat.worker (attacker + reinforcement participants) and
 * ExtractionLifecycleService (interception losses on both sides). Barbarian
 * villages have no population row — callers guard on `isBarbarian` before
 * invoking (this helper stays neutral to that concern).
 */
export async function releasePopulationForLosses(
  tx: PrismaClientOrTx,
  villageId: string,
  losses: UnitMap,
): Promise<void> {
  const popReleased = sumPopulationCost(losses);
  if (popReleased <= 0) return;
  await tx.population.update({
    where: { villageId },
    data: { used: { decrement: popReleased } },
  });
}
