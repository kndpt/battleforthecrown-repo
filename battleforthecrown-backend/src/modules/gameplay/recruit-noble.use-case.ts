import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PgBoss from 'pg-boss';
import type { UnitTraining } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldService } from '../world/world.service';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { VillageStrategyService } from '../strategy/village-strategy.service';
import { applyPopulationBonus } from '../population/population-capacity';
import { CrownsService } from '../crowns/crowns.service';
import {
  canRecruitNoble,
  UNIT_CATALOG,
  UNIT_TYPES,
} from '@battleforthecrown/shared/army';
import { calculateTrainingTime } from '@battleforthecrown/shared/logic';
import { MS_PER_SECOND } from '@battleforthecrown/shared/time';
import { TempoService } from '@battleforthecrown/shared/world';

@Injectable()
export class RecruitNobleUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly worldService: WorldService,
    private readonly outbox: OutboxPublisher,
    private readonly villageStrategy: VillageStrategyService,
    private readonly crowns: CrownsService,
    @Inject('PG_BOSS') private readonly boss: PgBoss,
  ) {}

  async execute(villageId: string, userId: string): Promise<UnitTraining> {
    await this.ownership.assertVillageOwnedBy(villageId, userId);

    const worldId = await this.worldService.getWorldIdFromVillage(villageId);
    const config = await this.worldService.getWorldConfig(worldId);
    const unitCost = UNIT_CATALOG.costs[UNIT_TYPES.NOBLE];
    const requiredThroneHallLevel = unitCost.requiredThroneHallLevel ?? 1;
    const requiredCrowns = unitCost.crowns ?? 0;

    return this.prisma.$transaction(async (tx) => {
      // Serialize concurrent noble recruits on the Throne Hall: the dropped
      // @@unique([villageId, building]) used to block a 2nd THRONE_HALL row at
      // the DB; this advisory lock (released at tx end) keeps the canRecruitNoble
      // gate race-free so at most one noble training exists (run 062).
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`training:${villageId}:THRONE_HALL`}))`;

      const [
        village,
        throneHall,
        stock,
        population,
        nobleInventory,
        activeNobleTraining,
        crownBalance,
      ] = await Promise.all([
        tx.village.findUnique({ where: { id: villageId } }),
        tx.building.findFirst({
          where: { villageId, type: 'THRONE_HALL' },
        }),
        tx.resourceStock.findUnique({ where: { villageId } }),
        tx.population.findUnique({ where: { villageId } }),
        tx.unitInventory.findUnique({
          where: {
            villageId_unitType: { villageId, unitType: UNIT_TYPES.NOBLE },
          },
        }),
        tx.unitTraining.findFirst({
          where: {
            villageId,
            unitType: UNIT_TYPES.NOBLE,
            building: 'THRONE_HALL',
          },
        }),
        tx.crownBalance.findUnique({
          where: { userId_worldId: { userId, worldId } },
        }),
      ]);

      if (!village) throw new NotFoundException('Village not found');
      if (!throneHall) throw new BadRequestException('Throne Hall not found');
      if (throneHall.level < requiredThroneHallLevel) {
        throw new BadRequestException(
          `Throne Hall level ${requiredThroneHallLevel} required`,
        );
      }
      if (!stock) throw new NotFoundException('Resource stock not found');
      if (!population) throw new NotFoundException('Population not found');
      if (!crownBalance) throw new NotFoundException('Crown balance not found');

      const nobleGate = canRecruitNoble({
        garrisonNobleCount: nobleInventory?.quantity ?? 0,
        hasNobleInQueue: Boolean(activeNobleTraining),
      });

      if (!nobleGate.allowed) {
        throw new BadRequestException(
          nobleGate.reason === 'GARRISON_FULL'
            ? 'A noble is already in garrison'
            : 'A noble is already in training',
        );
      }

      if (
        stock.wood < unitCost.wood ||
        stock.stone < unitCost.stone ||
        stock.iron < unitCost.iron
      ) {
        throw new BadRequestException('Insufficient resources');
      }

      const populationStrategyBonus =
        await this.villageStrategy.getStrategyBonus(villageId, 'population');
      const availablePopulation =
        applyPopulationBonus(population.max, populationStrategyBonus) -
        population.used;
      if (availablePopulation < unitCost.population) {
        throw new BadRequestException('Insufficient population');
      }

      if (crownBalance.balance < requiredCrowns) {
        throw new BadRequestException('Insufficient crowns');
      }

      const strategyBonus = await this.villageStrategy.getStrategyBonus(
        villageId,
        'training',
      );
      const trainingSpeedBonus =
        typeof strategyBonus?.trainingSpeedBonus === 'number'
          ? strategyBonus.trainingSpeedBonus
          : 1;
      const timePerUnitMs = Math.max(
        MS_PER_SECOND,
        Math.round(
          TempoService.applyDuration(
            calculateTrainingTime(unitCost.time, 1, trainingSpeedBonus),
            config.tempo,
            'lordTrainingSpeed',
          ),
        ),
      );
      const now = new Date();
      const nextUnitEta = new Date(now.getTime() + timePerUnitMs);

      await tx.resourceStock.update({
        where: { villageId },
        data: {
          wood: { decrement: unitCost.wood },
          stone: { decrement: unitCost.stone },
          iron: { decrement: unitCost.iron },
        },
      });

      await tx.population.update({
        where: { villageId },
        data: { used: { increment: unitCost.population } },
      });

      await tx.crownBalance.update({
        where: { userId_worldId: { userId, worldId } },
        data: {
          balance: { decrement: requiredCrowns },
          lastUpdateTs: now,
        },
      });

      const training = await tx.unitTraining.create({
        data: {
          villageId,
          building: 'THRONE_HALL',
          unitType: UNIT_TYPES.NOBLE,
          totalQty: 1,
          completedQty: 0,
          timePerUnitMs,
          nextUnitEta,
        },
      });

      await this.boss.send(
        'training:tick',
        { trainingId: training.id, villageId, unitType: UNIT_TYPES.NOBLE },
        {
          startAfter: nextUnitEta,
          singletonKey: `training:${training.id}`,
        },
      );

      await this.outbox.resourcesChanged(villageId, tx);
      await this.crowns.createCrownsChangedEvent(userId, worldId, tx);

      return training;
    });
  }
}
