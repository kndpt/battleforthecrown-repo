import type { UnitMap } from '@battleforthecrown/shared/army';
import { typedEntries } from '@battleforthecrown/shared/utils';
import type { PrismaClientOrTx } from '../../common/prisma.types';

/**
 * Credits a {@link UnitMap} back into a village's `UnitInventory`, upserting one
 * row per unit type and incrementing existing rows. Quantities `<= 0` are
 * skipped.
 *
 * Extracted from four byte-identical loops that each returned units to an
 * inventory: reinforcement return-home and capture-window bounce
 * (`combat.worker`), surviving-unit return (`return.worker`), and escort return
 * (`extraction-lifecycle.service`). Every caller passes a `UnitMap` produced by
 * combat resolution (`subtractLosses` only emits `> 0` survivors) or
 * `parseUnitMap`, so skipping `<= 0` is behaviour-identical to the callers'
 * original `=== undefined` / `<= 0` guards.
 */
export async function creditUnitsToInventory(
  tx: PrismaClientOrTx,
  villageId: string,
  units: UnitMap,
): Promise<void> {
  for (const [unitType, quantity] of typedEntries(units)) {
    if (quantity <= 0) continue;
    await tx.unitInventory.upsert({
      where: { villageId_unitType: { villageId, unitType } },
      create: { villageId, unitType, quantity },
      update: { quantity: { increment: quantity } },
    });
  }
}
