import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldConfigService } from '../world/world-config.service';
import { VillageStrategyService } from '../strategy/village-strategy.service';
import { applyPopulationBonus } from './population-capacity';

@Injectable()
export class PopulationService {
  constructor(
    private prisma: PrismaService,
    private ownership: OwnershipService,
    private worldConfig: WorldConfigService,
    private villageStrategy: VillageStrategyService,
  ) {}

  async getPopulation(villageId: string, userId: string) {
    await this.ownership.assertVillageOwnedBy(villageId, userId);
    const [population, village] = await Promise.all([
      this.prisma.population.findUnique({
        where: { villageId },
      }),
      this.prisma.village.findUnique({
        where: { id: villageId },
      }),
    ]);

    if (!population || !village) {
      throw new NotFoundException('Village not found');
    }

    const strategyBonus = await this.villageStrategy.getStrategyBonus(
      villageId,
      'population',
    );
    const adjustedMax = applyPopulationBonus(population.max, strategyBonus);

    return {
      used: population.used,
      max: adjustedMax,
      available: Math.max(0, adjustedMax - population.used),
    };
  }
}
