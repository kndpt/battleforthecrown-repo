import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldConfigService } from '../world/world-config.service';
import { OutboxPublisher } from '../event/outbox-publisher.service';

type StrategyName = 'FORTRESS' | 'RAIDERS' | 'ECONOMIC' | 'BALANCED';

@Injectable()
export class CancelConstructionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly worldConfig: WorldConfigService,
    private readonly outbox: OutboxPublisher,
  ) {}

  async execute(villageId: string, buildingId: string, userId: string) {
    await this.ownership.assertVillageOwnedBy(villageId, userId);

    return this.prisma.$transaction(async (tx) => {
      const building = await tx.building.findUnique({
        where: { id: buildingId },
        include: {
          village: { include: { resourceStock: true, population: true } },
        },
      });

      if (!building) throw new NotFoundException('Building not found');
      if (!building.endTime) {
        throw new BadRequestException('Building not under construction');
      }
      if (building.villageId !== villageId) {
        throw new NotFoundException('Building not found in this village');
      }

      const worldId = building.village.worldId;
      const nextLevel = building.level + 1;

      const allBuildings = await tx.building.findMany({
        where: { villageId: building.villageId },
      });
      const castle = allBuildings.find((b) => b.type === 'CASTLE');
      const castleLevel = castle?.level ?? 1;
      const strategyConfig = await tx.villageStrategyConfig.findUnique({
        where: { villageId: building.villageId },
      });
      const currentStrategy = strategyConfig?.strategy as
        | StrategyName
        | undefined;

      const cost = await this.worldConfig.getCost(
        worldId,
        building.type,
        nextLevel,
        castleLevel,
        currentStrategy,
      );

      await Promise.all([
        tx.resourceStock.update({
          where: { villageId: building.villageId },
          data: {
            wood: { increment: cost.wood },
            stone: { increment: cost.stone },
            iron: { increment: cost.iron },
          },
        }),
        tx.population.update({
          where: { villageId: building.villageId },
          data: { used: { decrement: cost.population } },
        }),
        tx.building.update({
          where: { id: buildingId },
          data: { startTime: null, endTime: null },
        }),
      ]);

      // pg-boss singleton job will be skipped at firing time because endTime is null
      // (ConstructionWorker checks this and exits early).

      // Emit the refund as a resources.changed event so the frontend stays in sync
      // (the previous implementation forgot this — see audit ticket 03 / 11).
      await this.outbox.resourcesChanged(building.villageId, tx);

      return { success: true, refunded: cost };
    });
  }
}
