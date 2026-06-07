import { Prisma } from '@prisma/client';
import { UnitMapSchema, type UnitMap } from '@battleforthecrown/shared/army';

/**
 * Decode a Prisma JSON column into a typed UnitMap.
 * Used for `expedition.units`, `combatReport.lossesAttacker/Defender`,
 * `combatReport.totalUnitsAttacker/Defender`.
 */
export function parseUnitMap(
  raw: Prisma.JsonValue,
  fieldName: string,
): UnitMap {
  const result = UnitMapSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid ${fieldName} JSON shape: ${result.error.message}`);
  }
  return result.data;
}

/** Encode a UnitMap for writing into a Prisma JSON column. */
export function encodeUnitMap(value: UnitMap): Prisma.InputJsonValue {
  return value;
}
