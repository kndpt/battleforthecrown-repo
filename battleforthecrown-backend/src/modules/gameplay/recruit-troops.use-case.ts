import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import PgBoss from 'pg-boss';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldService } from '../world/world.service';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { VillageStrategyService } from '../strategy/village-strategy.service';
import {
  UNIT_CATALOG,
  UnitType,
  UnitCost,
  UNIT_TYPES,
} from '@battleforthecrown/shared/army';
import { calculateTrainingTime } from '@battleforthecrown/shared/logic';

@Injectable()
export class RecruitTroopsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly worldService: WorldService,
    private readonly outbox: OutboxPublisher,
    private readonly villageStrategy: VillageStrategyService,
    @Inject('PG_BOSS') private readonly boss: PgBoss,
  ) {}

  async execute(
    villageId: string,
    unitType: string,
    quantity: number,
    userId: string,
  ) {
    await this.ownership.assertVillageOwnedBy(villageId, userId);
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const worldId = await this.worldService.getWorldIdFromVillage(villageId);
    const config = await this.worldService.getWorldConfig(worldId);

    if (!isValidUnitType(unitType)) {
      throw new BadRequestException('Invalid unit type');
    }
    const unitCost: UnitCost = UNIT_CATALOG.costs[unitType];

    return this.prisma.$transaction(async (tx) => {
      const [village, barracks, stock, population, activeTraining] =
        await Promise.all([
          tx.village.findUnique({ where: { id: villageId } }),
          tx.building.findFirst({ where: { villageId, type: 'BARRACKS' } }),
          tx.resourceStock.findUnique({ where: { villageId } }),
          tx.population.findUnique({ where: { villageId } }),
          tx.unitTraining.findFirst({ where: { villageId } }),
        ]);

      if (!village) throw new NotFoundException('Village not found');
      if (!barracks) throw new BadRequestException('Barracks not found');
      if (barracks.level < unitCost.requiredBarracksLevel) {
        throw new BadRequestException(
          `Barracks level ${unitCost.requiredBarracksLevel} required`,
        );
      }
      if (!stock) throw new NotFoundException('Resource stock not found');
      if (!population) throw new NotFoundException('Population not found');
      if (activeTraining) {
        throw new BadRequestException('Training already in progress');
      }

      const strategyBonus = await this.villageStrategy.getStrategyBonus(
        villageId,
        'training',
      );

      const unitCostMultiplier =
        strategyBonus &&
        typeof strategyBonus.unitCostReduction === 'number' &&
        strategyBonus.unitCostReduction > 0
          ? strategyBonus.unitCostReduction
          : 1;

      const effectiveUnitCost =
        unitCostMultiplier === 1
          ? unitCost
          : {
              ...unitCost,
              wood: Math.floor(unitCost.wood * unitCostMultiplier),
              stone: Math.floor(unitCost.stone * unitCostMultiplier),
              iron: Math.floor(unitCost.iron * unitCostMultiplier),
            };

      const totalWood = effectiveUnitCost.wood * quantity;
      const totalStone = effectiveUnitCost.stone * quantity;
      const totalIron = effectiveUnitCost.iron * quantity;
      const totalPopulation = unitCost.population * quantity;

      if (
        stock.wood < totalWood ||
        stock.stone < totalStone ||
        stock.iron < totalIron
      ) {
        throw new BadRequestException('Insufficient resources');
      }

      const availablePopulation = population.max - population.used;
      if (availablePopulation < totalPopulation) {
        throw new BadRequestException('Insufficient population');
      }

      await tx.resourceStock.update({
        where: { villageId },
        data: {
          wood: { decrement: totalWood },
          stone: { decrement: totalStone },
          iron: { decrement: totalIron },
        },
      });

      await tx.population.update({
        where: { villageId },
        data: { used: { increment: totalPopulation } },
      });

      const trainingSpeedBonus =
        typeof strategyBonus?.trainingSpeedBonus === 'number'
          ? strategyBonus.trainingSpeedBonus
          : 1;
      const timePerUnitMs = calculateTrainingTime(
        unitCost.time,
        config.gameSpeed.training,
        trainingSpeedBonus,
      );
      const nextUnitEta = new Date(Date.now() + timePerUnitMs);

      const training = await tx.unitTraining.create({
        data: {
          villageId,
          unitType,
          totalQty: quantity,
          completedQty: 0,
          timePerUnitMs,
          nextUnitEta,
        },
      });

      await this.boss.send(
        'training:tick',
        { trainingId: training.id, villageId, unitType },
        {
          startAfter: nextUnitEta,
          singletonKey: `training:${training.id}`,
        },
      );

      await this.outbox.resourcesChanged(villageId, tx);

      return training;
    });
  }
}

const isValidUnitType = (value: string): value is UnitType => {
  return Object.values(UNIT_TYPES).includes(value as UnitType);
};
