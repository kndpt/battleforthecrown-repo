import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import PgBoss from 'pg-boss';
import type { UnitTraining } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldService } from '../world/world.service';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { VillageStrategyService } from '../strategy/village-strategy.service';
import { applyPopulationBonus } from '../population/population-capacity';
import {
  UNIT_CATALOG,
  UnitType,
  UnitCost,
  UNIT_TYPES,
} from '@battleforthecrown/shared/army';
import { calculateTrainingTime } from '@battleforthecrown/shared/logic';
import { MS_PER_SECOND } from '@battleforthecrown/shared/time';
import { getBarracksTrainingSpeedMultiplier } from '@battleforthecrown/shared/village/buildings';
import { TempoService } from '@battleforthecrown/shared/world';

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
  ): Promise<UnitTraining> {
    await this.ownership.assertVillageOwnedBy(villageId, userId);
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const worldId = await this.worldService.getWorldIdFromVillage(villageId);
    const config = await this.worldService.getWorldConfig(worldId);

    if (!isValidUnitType(unitType)) {
      throw new BadRequestException('Invalid unit type');
    }
    if (unitType === UNIT_TYPES.NOBLE) {
      throw new BadRequestException(
        'NOBLE is recruited at the Throne Hall, not the Barracks (see Ticket #40)',
      );
    }
    const unitCost: UnitCost = UNIT_CATALOG.costs[unitType];

    return this.prisma.$transaction(async (tx) => {
      // Serialize concurrent recruits on the same (village, building): without
      // it, two near-simultaneous calls both read activeTraining=null and both
      // schedule a job, breaking the "one active training" invariant. The
      // dropped @@unique([villageId, building]) used to enforce this at the DB;
      // this advisory lock (released at tx end) restores the guarantee (run 062).
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`training:${villageId}:BARRACKS`}))`;

      const [
        village,
        barracks,
        stock,
        population,
        activeTraining,
        sameTypeTraining,
      ] = await Promise.all([
        tx.village.findUnique({ where: { id: villageId } }),
        tx.building.findFirst({ where: { villageId, type: 'BARRACKS' } }),
        tx.resourceStock.findUnique({ where: { villageId } }),
        tx.population.findUnique({ where: { villageId } }),
        tx.unitTraining.findFirst({
          where: { villageId, building: 'BARRACKS' },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        }),
        tx.unitTraining.findFirst({
          where: { villageId, building: 'BARRACKS', unitType },
        }),
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
      // One row per unit type (enforced by @@unique([villageId, building,
      // unitType])): reject a same-type enqueue with a clean 400 instead of
      // surfacing a raw P2002. The advisory lock above keeps this check
      // race-free.
      if (sameTypeTraining) {
        throw new BadRequestException(
          'This unit type is already in the training queue',
        );
      }

      // Sequential queue: the Barracks holds one row per unit type. Only the
      // head of the queue (oldest createdAt) gets a pg-boss job; the others
      // start deferred — the worker (on completion) or cancel (on head removal)
      // schedules the next one. `activeTraining` already present ⇒ this row is
      // queued, not head.
      const isFirstInQueue = !activeTraining;

      const [strategyBonus, populationStrategyBonus] = await Promise.all([
        this.villageStrategy.getStrategyBonus(villageId, 'training'),
        this.villageStrategy.getStrategyBonus(villageId, 'population'),
      ]);

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

      const availablePopulation =
        applyPopulationBonus(population.max, populationStrategyBonus) -
        population.used;
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
      const barracksTrainingSpeedMultiplier =
        getBarracksTrainingSpeedMultiplier(barracks.level);
      const effectiveTrainingSpeedBonus =
        trainingSpeedBonus * barracksTrainingSpeedMultiplier;
      const timePerUnitMs = Math.max(
        MS_PER_SECOND,
        Math.round(
          TempoService.applyDuration(
            calculateTrainingTime(
              unitCost.time,
              1,
              effectiveTrainingSpeedBonus,
            ),
            config.tempo,
            'unitTrainingSpeed',
          ),
        ),
      );
      const nextUnitEta = new Date(Date.now() + timePerUnitMs);

      const training = await tx.unitTraining.create({
        data: {
          villageId,
          building: 'BARRACKS',
          unitType,
          totalQty: quantity,
          completedQty: 0,
          timePerUnitMs,
          nextUnitEta,
        },
      });

      if (isFirstInQueue) {
        await this.boss.send(
          'training:tick',
          { trainingId: training.id, villageId, unitType },
          {
            startAfter: nextUnitEta,
            singletonKey: `training:${training.id}`,
          },
        );
      }

      await this.outbox.resourcesChanged(villageId, tx);

      return training;
    });
  }
}

const isValidUnitType = (value: string): value is UnitType => {
  return Object.values(UNIT_TYPES).includes(value as UnitType);
};
