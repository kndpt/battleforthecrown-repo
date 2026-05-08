import { Injectable } from '@nestjs/common';
import { WorldConfigService } from './world-config.service';
import { PrismaClientOrTx } from '../../common/prisma.types';
import {
  getBuildingTemplate,
  getPopulationMax,
  getWarehouseLevel,
} from './barbarian-tier-templates';
import { generateBarbarianName } from '@battleforthecrown/shared/world';

@Injectable()
export class BarbarianVillageFactory {
  constructor(private readonly worldConfig: WorldConfigService) {}

  /**
   * Creates a barbarian village with its buildings, units, resources and
   * population. Idempotency at the position level is the caller's responsibility
   * (handled via P2002 in BarbarianSeedingService.seedChunk).
   */
  async create(
    tx: PrismaClientOrTx,
    params: { worldId: string; tier: string; x: number; y: number },
  ) {
    const { worldId, tier, x, y } = params;

    const village = await tx.village.create({
      data: {
        worldId,
        userId: null,
        isBarbarian: true,
        tier,
        name: generateBarbarianName(tier, x, y),
        x,
        y,
      },
    });

    const buildings = getBuildingTemplate(tier).map((b) => ({
      villageId: village.id,
      type: b.type,
      level: b.level,
    }));
    await tx.building.createMany({ data: buildings });

    const resources = this.generateResources(worldId, tier);
    await tx.resourceStock.create({
      data: {
        villageId: village.id,
        wood: resources.wood,
        stone: resources.stone,
        iron: resources.iron,
        maxPerType: resources.maxPerType,
        lastUpdateTs: new Date(),
      },
    });

    await tx.population.create({
      data: {
        villageId: village.id,
        used: 0,
        max: getPopulationMax(tier),
      },
    });

    return village;
  }

  private generateResources(worldId: string, tier: string) {
    const warehouseLevel = getWarehouseLevel(tier);
    const maxPerType = this.worldConfig.getStorageLimit(
      worldId,
      warehouseLevel,
    );

    // Spawn with 30-60% of warehouse capacity, iron at 70% of that ratio.
    const fillRatio = 0.3 + Math.random() * 0.3;

    return {
      wood: Math.floor(maxPerType * fillRatio),
      stone: Math.floor(maxPerType * fillRatio),
      iron: Math.floor(maxPerType * fillRatio * 0.7),
      maxPerType,
    };
  }
}
