import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  LootResourcesSchema,
  LootResultSchema,
  CombatLootSchema,
  type LootResources,
  type LootResult,
  type CombatLoot,
} from '@battleforthecrown/shared/combat';

const LootResourcesWithDefaultsSchema = z.strictObject({
  wood: z.number().nonnegative().default(0),
  stone: z.number().nonnegative().default(0),
  iron: z.number().nonnegative().default(0),
});

export function parseLootResources(
  raw: Prisma.JsonValue,
  fieldName: string,
): LootResources {
  const result = LootResourcesSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid ${fieldName} JSON shape: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Decode loot resources from Prisma JSON when empty or partial objects are
 * valid persisted shapes (scout reports, village intel). Missing keys default
 * to zero — same semantics as caravan `presentResources`.
 */
export function parseLootResourcesWithDefaults(
  raw: Prisma.JsonValue,
  fieldName: string,
): LootResources {
  if (raw === null || raw === undefined) {
    return { wood: 0, stone: 0, iron: 0 };
  }
  const result = LootResourcesWithDefaultsSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid ${fieldName} JSON shape: ${result.error.message}`);
  }
  return result.data;
}

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
