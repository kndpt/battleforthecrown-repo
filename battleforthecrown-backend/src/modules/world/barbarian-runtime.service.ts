import { Injectable, Logger } from '@nestjs/common';
import { isUnitType, type UnitMap } from '@battleforthecrown/shared/army';
import { MS_PER_HOUR } from '@battleforthecrown/shared/time';
import { typedEntries } from '@battleforthecrown/shared/utils';
import { TempoService, type WorldTempo } from '@battleforthecrown/shared/world';
import {
  calculateBarbarianUnitRegen,
  getBarbarianRegenRates,
  getUnits,
} from './barbarian-tier-templates';
import { PrismaClientOrTx } from '../../common/prisma.types';

@Injectable()
export class BarbarianRuntimeService {
  async catchUpVillage(
    tx: PrismaClientOrTx,
    villageId: string,
    tempo: WorldTempo,
    now = new Date(),
  ): Promise<{
    units: UnitMap;
    resources: { wood: number; stone: number; iron: number };
  }> {
    const village = await tx.village.findUniqueOrThrow({
      where: { id: villageId },
      include: { resourceStock: true, unitInventory: true },
    });

    if (!village.isBarbarian) {
      return {
        units: toUnitMap(village.unitInventory),
        resources: village.resourceStock
          ? {
              wood: village.resourceStock.wood,
              stone: village.resourceStock.stone,
              iron: village.resourceStock.iron,
            }
          : { wood: 0, stone: 0, iron: 0 },
      };
    }

    const tier = village.tier ?? 'T1';
    const currentUnits = toUnitMap(village.unitInventory);
    const troopsLastRegen =
      village.barbarianTroopsLastRegenTs ?? village.createdAt;
    const troopElapsedHours = Math.max(
      0,
      (now.getTime() - troopsLastRegen.getTime()) / MS_PER_HOUR,
    );
    const unitRegen = calculateBarbarianUnitRegen({
      tier,
      currentUnits,
      elapsedHours: TempoService.applyRate(
        troopElapsedHours,
        tempo,
        'barbarianRegen',
      ),
    });

    for (const [unitType, quantity] of typedEntries(unitRegen)) {
      if (!quantity) continue;
      await tx.unitInventory.upsert({
        where: {
          villageId_unitType: {
            villageId,
            unitType,
          },
        },
        create: {
          villageId,
          unitType,
          quantity,
        },
        update: {
          quantity: { increment: quantity },
        },
      });
      currentUnits[unitType] = (currentUnits[unitType] ?? 0) + quantity;
    }

    const isTroopStockFull = isAtCap(tier, currentUnits);
    if (Object.keys(unitRegen).length > 0 || isTroopStockFull) {
      await tx.village.update({
        where: { id: villageId },
        data: { barbarianTroopsLastRegenTs: now },
      });
    }

    const resources = village.resourceStock
      ? await this.catchUpResources(tx, village.resourceStock, tier, tempo, now)
      : { wood: 0, stone: 0, iron: 0 };

    return { units: currentUnits, resources };
  }

  private async catchUpResources(
    tx: PrismaClientOrTx,
    stock: {
      villageId: string;
      wood: number;
      stone: number;
      iron: number;
      maxPerType: number;
      lastUpdateTs: Date;
    },
    tier: string,
    tempo: WorldTempo,
    now: Date,
  ) {
    const elapsedHours = Math.max(
      0,
      (now.getTime() - stock.lastUpdateTs.getTime()) / MS_PER_HOUR,
    );
    const { resourceRatePerHour } = getBarbarianRegenRates(tier);
    const gain = Math.floor(
      stock.maxPerType *
        TempoService.applyRate(resourceRatePerHour, tempo, 'barbarianRegen') *
        elapsedHours,
    );
    const resources = {
      wood: Math.min(stock.maxPerType, stock.wood + gain),
      stone: Math.min(stock.maxPerType, stock.stone + gain),
      iron: Math.min(stock.maxPerType, stock.iron + gain),
    };

    const changed =
      resources.wood !== stock.wood ||
      resources.stone !== stock.stone ||
      resources.iron !== stock.iron;
    const isFull =
      resources.wood >= stock.maxPerType &&
      resources.stone >= stock.maxPerType &&
      resources.iron >= stock.maxPerType;

    if (changed || isFull) {
      await tx.resourceStock.update({
        where: { villageId: stock.villageId },
        data: {
          ...resources,
          lastUpdateTs: now,
        },
      });
    }

    return resources;
  }
}

const logger = new Logger('BarbarianRuntime');

function toUnitMap(
  inventory: Array<{ unitType: string; quantity: number }>,
): UnitMap {
  const units: UnitMap = {};
  for (const item of inventory) {
    if (item.quantity <= 0) continue;
    if (isUnitType(item.unitType)) {
      units[item.unitType] = item.quantity;
    } else {
      logger.warn(`Invalid unitType "${item.unitType}" ignored in toUnitMap`);
    }
  }
  return units;
}

function isAtCap(tier: string, currentUnits: UnitMap): boolean {
  const maxUnits = getUnits(tier);
  return typedEntries(maxUnits).every(
    ([unitType, max]) => (currentUnits[unitType] ?? 0) >= max,
  );
}
