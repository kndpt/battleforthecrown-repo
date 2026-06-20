import { Injectable, NotFoundException } from '@nestjs/common';
import type { UnitTraining } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import {
  UNIT_CATALOG,
  UnitType,
  UnitCost,
} from '@battleforthecrown/shared/army';

@Injectable()
export class ArmyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async getInventory(villageId: string, userId: string) {
    await this.ownership.assertVillageOwnedBy(villageId, userId);
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: {
        unitInventory: true,
        // Deterministic head-of-queue: the oldest row is the active training
        // surfaced below via `.find()` (run 062, sequential queue).
        unitTraining: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
      },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const allUnitTypes = Object.keys(UNIT_CATALOG.costs) as UnitType[];

    const inventoryMap = new Map(
      village.unitInventory.map((inv) => [inv.unitType, inv.quantity]),
    );

    const activeTraining =
      village.unitTraining.find(
        (training) => training.building === 'BARRACKS',
      ) ?? null;

    return allUnitTypes.map((unitType) => {
      const unitCost: UnitCost = UNIT_CATALOG.costs[unitType];
      const quantity = inventoryMap.get(unitType) || 0;
      const isTraining = activeTraining?.unitType === unitType;

      return {
        id: `${villageId}-${unitType}`,
        type: unitType,
        quantity,
        populationCost: unitCost.population,
        trainingStartTime: isTraining
          ? activeTraining.createdAt.toISOString()
          : undefined,
        trainingTotalQuantity: isTraining ? activeTraining.totalQty : undefined,
        trainingCompletedQuantity: isTraining
          ? activeTraining.completedQty
          : undefined,
        nextUnitCompletionTime: isTraining
          ? activeTraining.nextUnitEta.toISOString()
          : undefined,
        timePerUnit: isTraining ? activeTraining.timePerUnitMs : undefined,
      };
    });
  }

  async getTraining(
    villageId: string,
    userId: string,
  ): Promise<UnitTraining[]> {
    await this.ownership.assertVillageOwnedBy(villageId, userId);
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    return this.prisma.unitTraining.findMany({
      where: { villageId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }
}
