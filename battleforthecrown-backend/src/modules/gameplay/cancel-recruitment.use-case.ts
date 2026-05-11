import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { CrownsService } from '../crowns/crowns.service';
import {
  UNIT_CATALOG,
  UnitType,
  UnitCost,
  UNIT_TYPES,
} from '@battleforthecrown/shared/army';

@Injectable()
export class CancelRecruitmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly outbox: OutboxPublisher,
    private readonly crowns: CrownsService,
  ) {}

  async execute(villageId: string, trainingId: string, userId: string) {
    await this.ownership.assertVillageOwnedBy(villageId, userId);

    return this.prisma.$transaction(async (tx) => {
      const training = await tx.unitTraining.findUnique({
        where: { id: trainingId },
        include: {
          village: { select: { worldId: true } },
        },
      });

      if (!training) throw new NotFoundException('Training not found');
      if (training.villageId !== villageId) {
        throw new NotFoundException('Training not found for this village');
      }
      if (!isValidUnitType(training.unitType)) {
        throw new BadRequestException('Invalid unit type');
      }

      const unitCost: UnitCost = UNIT_CATALOG.costs[training.unitType];
      const remainingQty = training.totalQty - training.completedQty;

      const refundWood = unitCost.wood * remainingQty;
      const refundStone = unitCost.stone * remainingQty;
      const refundIron = unitCost.iron * remainingQty;
      const refundPopulation = unitCost.population * remainingQty;
      const refundedCrowns = (unitCost.crowns ?? 0) * remainingQty;

      await tx.resourceStock.update({
        where: { villageId: training.villageId },
        data: {
          wood: { increment: refundWood },
          stone: { increment: refundStone },
          iron: { increment: refundIron },
        },
      });

      await tx.population.update({
        where: { villageId: training.villageId },
        data: { used: { decrement: refundPopulation } },
      });

      if (refundedCrowns > 0) {
        await tx.crownBalance.update({
          where: {
            userId_worldId: { userId, worldId: training.village.worldId },
          },
          data: {
            balance: { increment: refundedCrowns },
            lastUpdateTs: new Date(),
          },
        });
      }

      await tx.unitTraining.delete({ where: { id: trainingId } });

      // Same fix as cancel-construction: emit a resources.changed so the frontend
      // sees the refund without waiting on TanStack Query invalidation alone.
      await this.outbox.resourcesChanged(training.villageId, tx);
      if (refundedCrowns > 0) {
        await this.crowns.createCrownsChangedEvent(
          userId,
          training.village.worldId,
          tx,
        );
      }

      return { success: true, refunded: remainingQty, refundedCrowns };
    });
  }
}

const isValidUnitType = (value: string): value is UnitType => {
  return Object.values(UNIT_TYPES).includes(value as UnitType);
};
