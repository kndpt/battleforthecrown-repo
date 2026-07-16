import { BadRequestException } from '@nestjs/common';

/**
 * Builds an on-hand unit-quantity map from Prisma rows that expose
 * `{ unitType, quantity }` (Garrison and UnitInventory both do). Mirrors the
 * `Object.fromEntries(rows.map((r) => [r.unitType, r.quantity]))` that
 * combat.service and initiate-extraction each inlined before this helper.
 */
export function toUnitQuantityMap(
  rows: ReadonlyArray<{ unitType: string; quantity: number }>,
): Record<string, number> {
  return Object.fromEntries(rows.map((row) => [row.unitType, row.quantity]));
}

/**
 * Guards that every requested unit quantity is on hand, throwing a
 * `BadRequestException` on the first shortfall.
 *
 * Extracted from three byte-identical check-then-throw blocks — garrison recall
 * and army-inventory deduction in `combat.service`, and escort deduction in
 * `initiate-extraction.use-case` (whose comment already flagged the shared
 * shape). Requested entries that are `undefined` or `<= 0` are skipped, exactly
 * like the original loops. `locationLabel` preserves the garrison variant's
 * "... in garrison" message suffix (pass e.g. `' in garrison'`).
 */
export function assertUnitsAvailable(
  available: Readonly<Record<string, number>>,
  requested: Readonly<Record<string, number | undefined>>,
  locationLabel = '',
): void {
  for (const [unitType, requestedQty] of Object.entries(requested)) {
    const need = requestedQty ?? 0;
    if (need <= 0) continue;
    const have = available[unitType] ?? 0;
    if (have < need) {
      throw new BadRequestException(
        `Insufficient ${unitType}${locationLabel}: have ${have}, need ${need}`,
      );
    }
  }
}
