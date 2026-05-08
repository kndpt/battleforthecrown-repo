import { Prisma } from '@prisma/client';
import {
  LootResultSchema,
  CombatLootSchema,
  type LootResult,
  type CombatLoot,
} from '@battleforthecrown/shared/combat';

/**
 * Decode the full LootResult JSON stored in `combatReport.loot`.
 * The combat worker writes a complete LootResult; downstream readers
 * (return.worker) only need the `resources` summary, but parsing the
 * full shape ensures we never see fields we don't expect.
 */
export function parseLootResult(raw: Prisma.JsonValue): LootResult {
  const result = LootResultSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid combatReport.loot JSON shape: ${result.error.message}`,
    );
  }
  return result.data;
}

/**
 * Decode the lighter CombatLoot shape (used in event payloads / responses)
 * when the metadata block is not relevant.
 */
export function parseCombatLoot(raw: Prisma.JsonValue): CombatLoot {
  const result = CombatLootSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid combat loot JSON shape: ${result.error.message}`);
  }
  return result.data;
}

export function encodeLootResult(value: LootResult): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export function encodeCombatLoot(value: CombatLoot): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
