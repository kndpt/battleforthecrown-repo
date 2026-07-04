import { Prisma, VillageStrategy } from '@prisma/client';
import { isUnitType } from '@battleforthecrown/shared/army';
import type { UnitMap, UnitType } from '@battleforthecrown/shared/army';
import type { PrismaClientOrTx } from '../../common/prisma.types';
import type { CombatParticipant } from './interfaces/combat-context.interface';

export type GarrisonWithStrategy = Prisma.GarrisonGetPayload<{
  include: { originVillage: { include: { strategyConfig: true } } };
}>;

/**
 * Loads all garrisons stationed in a village with the origin village's
 * strategyConfig (needed by `mergeGarrisonsIntoParticipants` to carry the
 * defender's reinforcement strategy into the resolution engine).
 */
export function loadDefenderGarrisons(
  tx: PrismaClientOrTx,
  villageId: string,
): Promise<GarrisonWithStrategy[]> {
  return tx.garrison.findMany({
    where: { villageId },
    include: {
      originVillage: {
        include: { strategyConfig: true },
      },
    },
  });
}

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
    if (!isUnitType(g.unitType)) continue;
    const ut: UnitType = g.unitType;
    const gUnits: UnitMap = { [ut]: g.quantity };
    const existing = participants.find(
      (p) => p.villageId === g.originVillageId,
    );

    if (existing) {
      existing.units[ut] = (existing.units[ut] ?? 0) + g.quantity;
    } else {
      participants.push({
        villageId: g.originVillageId,
        units: gUnits,
        strategy: g.originVillage?.strategyConfig?.strategy,
      });
    }

    totalUnits[ut] = (totalUnits[ut] ?? 0) + g.quantity;
  }
}

/**
 * Builds the defender-side participants list and accumulated unit totals for
 * a single villageId: loads its garrisons, seeds the local participant with
 * the given units + strategy, then folds in each garrison.
 */
export async function assembleDefenderParticipants(
  tx: PrismaClientOrTx,
  input: {
    villageId: string;
    localUnits: UnitMap;
    strategy?: VillageStrategy;
  },
): Promise<{ participants: CombatParticipant[]; totalUnits: UnitMap }> {
  const garrisons = await loadDefenderGarrisons(tx, input.villageId);
  const participants: CombatParticipant[] = [
    {
      villageId: input.villageId,
      units: input.localUnits,
      strategy: input.strategy,
    },
  ];
  const totalUnits: UnitMap = { ...input.localUnits };
  mergeGarrisonsIntoParticipants(garrisons, participants, totalUnits);
  return { participants, totalUnits };
}
