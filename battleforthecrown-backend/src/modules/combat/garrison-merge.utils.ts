import { Prisma } from '@prisma/client';
import type { UnitMap, UnitType } from '@battleforthecrown/shared/army';
import type { CombatParticipant } from './interfaces/combat-context.interface';

export type GarrisonWithStrategy = Prisma.GarrisonGetPayload<{
  include: { originVillage: { include: { strategyConfig: true } } };
}>;

/**
 * Merges each garrison row into the defender participant list and
 * accumulates unit counts in totalUnits. Mutates both arguments.
 */
export function mergeGarrisonsIntoParticipants(
  garrisons: GarrisonWithStrategy[],
  participants: CombatParticipant[],
  totalUnits: UnitMap,
): void {
  for (const g of garrisons) {
    const gUnits: UnitMap = { [g.unitType as UnitType]: g.quantity };
    const existing = participants.find(
      (p) => p.villageId === g.originVillageId,
    );

    if (existing) {
      existing.units[g.unitType as UnitType] =
        (existing.units[g.unitType as UnitType] ?? 0) + g.quantity;
    } else {
      participants.push({
        villageId: g.originVillageId,
        units: gUnits,
        strategy: g.originVillage?.strategyConfig?.strategy,
      });
    }

    totalUnits[g.unitType as UnitType] =
      (totalUnits[g.unitType as UnitType] ?? 0) + g.quantity;
  }
}
