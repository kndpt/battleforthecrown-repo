import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import PgBoss from 'pg-boss';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldConfigService } from '../world/world-config.service';
import { OutboxPublisher } from '../event/outbox-publisher.service';
import { applyPopulationBonus } from '../population/population-capacity';
import {
  getBuildingMaxLevel,
  getBuildingUnlockRequirement,
  getStrategyBonusValue,
  isBuildingEnabled,
  MAX_CONSTRUCTION_QUEUE,
} from '@battleforthecrown/shared/village';

type StrategyName = 'FORTRESS' | 'RAIDERS' | 'ECONOMIC' | 'BALANCED';

@Injectable()
export class UpgradeBuildingUseCase {
  private readonly logger = new Logger(UpgradeBuildingUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly worldConfig: WorldConfigService,
    private readonly outbox: OutboxPublisher,
    @Inject('PG_BOSS') private readonly boss: PgBoss,
  ) {}

  async execute(villageId: string, buildingType: string, userId: string) {
    await this.ownership.assertVillageOwnedBy(villageId, userId);

    return this.prisma.$transaction(async (tx) => {
      const [
        village,
        building,
        queue,
        stock,
        population,
        allBuildings,
        strategyConfig,
      ] = await Promise.all([
        tx.village.findUnique({ where: { id: villageId } }),
        tx.building.findFirst({ where: { villageId, type: buildingType } }),
        tx.building.count({ where: { villageId, endTime: { not: null } } }),
        tx.resourceStock.findUnique({ where: { villageId } }),
        tx.population.findUnique({ where: { villageId } }),
        tx.building.findMany({ where: { villageId } }),
        tx.villageStrategyConfig.findUnique({ where: { villageId } }),
      ]);

      if (!village || !stock || !population) {
        throw new NotFoundException('Village not found');
      }

      if (!isBuildingEnabled(buildingType)) {
        throw new BadRequestException('This building is temporarily disabled');
      }

      const currentLevel = building?.level ?? 0;
      const nextLevel = currentLevel + 1;

      if (currentLevel === 0) {
        const requiredCastleLevel = getBuildingUnlockRequirement(buildingType);
        if (requiredCastleLevel) {
          const castle = allBuildings.find((b) => b.type === 'CASTLE');
          const castleLevel = castle?.level ?? 1;
          if (castleLevel < requiredCastleLevel) {
            throw new BadRequestException(
              `Castle level ${requiredCastleLevel} required`,
            );
          }
        }
      }

      if (queue >= MAX_CONSTRUCTION_QUEUE) {
        throw new BadRequestException(
          `Construction queue full (max ${MAX_CONSTRUCTION_QUEUE})`,
        );
      }

      const maxLevel = getBuildingMaxLevel(buildingType);
      if (nextLevel > maxLevel) {
        throw new BadRequestException('Building already at max level');
      }

      if (building?.endTime) {
        throw new ConflictException('Building already under construction');
      }

      const castle = allBuildings.find((b) => b.type === 'CASTLE');
      const castleLevel = castle?.level ?? 1;
      const currentStrategy = strategyConfig?.strategy as
        | StrategyName
        | undefined;

      const cost = await this.worldConfig.getCost(
        village.worldId,
        buildingType,
        nextLevel,
        castleLevel,
        currentStrategy,
      );

      if (
        stock.wood < cost.wood ||
        stock.stone < cost.stone ||
        stock.iron < cost.iron
      ) {
        throw new BadRequestException('Insufficient resources');
      }

      const adjustedMaxPopulation = applyPopulationBonus(
        population.max,
        currentStrategy
          ? {
              populationBonus: getStrategyBonusValue(
                currentStrategy,
                'populationBonus',
              ),
            }
          : null,
      );

      if (adjustedMaxPopulation - population.used < cost.population) {
        throw new BadRequestException('Insufficient population');
      }

      const now = new Date();
      const endTime = new Date(now.getTime() + cost.time);

      this.logger.log(
        `[UpgradeBuilding] ${buildingType} → lvl ${nextLevel} (village ${villageId}, ETA ${endTime.toISOString()})`,
      );

      await Promise.all([
        tx.resourceStock.update({
          where: { villageId },
          data: {
            wood: stock.wood - cost.wood,
            stone: stock.stone - cost.stone,
            iron: stock.iron - cost.iron,
          },
        }),
        tx.population.update({
          where: { villageId },
          data: { used: population.used + cost.population },
        }),
      ]);

      const updated = building
        ? await tx.building.update({
            where: { id: building.id },
            data: { startTime: now, endTime, version: building.version + 1 },
          })
        : await tx.building.create({
            data: {
              villageId,
              type: buildingType,
              level: 0,
              startTime: now,
              endTime,
            },
          });

      await this.boss.send(
        'construction:end',
        {
          buildingId: updated.id,
          villageId,
          buildingType,
          targetLevel: nextLevel,
        },
        {
          startAfter: endTime,
          singletonKey: `construction:${updated.id}`,
        },
      );

      await this.outbox.resourcesChanged(villageId, tx);

      return {
        id: updated.id,
        type: updated.type,
        currentLevel,
        nextLevel,
        startTime: updated.startTime,
        endTime: updated.endTime,
        cost,
        populationCost: cost.population,
      };
    });
  }
}
