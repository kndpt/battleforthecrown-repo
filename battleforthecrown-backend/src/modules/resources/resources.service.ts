import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { WorldConfigService } from '../world/world-config.service';
import { VillageStrategyService } from '../strategy/village-strategy.service';
import {
  VillageStrategyType,
  getBuildingLevel,
  getStrategyBonusValue,
} from '@battleforthecrown/shared/village';
import { MS_PER_MINUTE } from '@battleforthecrown/shared/time';
import { PRODUCTION_CATCHUP_THRESHOLD_MS } from './resources.constants';
import {
  applyResourceCatchup,
  projectResourceRates,
} from './resource-rate-projection';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  constructor(
    private prisma: PrismaService,
    private ownership: OwnershipService,
    private worldConfig: WorldConfigService,
    private villageStrategy: VillageStrategyService,
  ) {}

  async getResources(
    villageId: string,
    userId: string,
  ): Promise<{
    wood: number;
    stone: number;
    iron: number;
    maxPerType: number;
    lastUpdateTs: string;
    productionRates: {
      wood: number;
      stone: number;
      iron: number;
    };
  }> {
    await this.ownership.assertVillageOwnedBy(villageId, userId);

    const stock = await this.prisma.resourceStock.findUnique({
      where: { villageId },
    });

    if (!stock) throw new NotFoundException('Village not found');

    const elapsedMs = Date.now() - stock.lastUpdateTs.getTime();
    if (elapsedMs > PRODUCTION_CATCHUP_THRESHOLD_MS) {
      await this.updateProduction(villageId);
      return this.getResources(villageId, userId); // Retry avec valeurs fraîches
    }

    // Fetch production rates
    const productionRates = await this.getProductionRates(villageId);

    return {
      wood: stock.wood,
      stone: stock.stone,
      iron: stock.iron,
      maxPerType: stock.maxPerType,
      lastUpdateTs: stock.lastUpdateTs.toISOString(),
      productionRates,
    };
  }

  async updateProduction(villageId: string) {
    return this.prisma.$transaction(async (tx) => {
      const village = await tx.village.findUnique({
        where: { id: villageId },
        include: { buildings: true, resourceStock: true, strategyConfig: true },
      });

      if (!village || !village.resourceStock) {
        this.logger.warn(`Village not found: ${villageId}`);
        throw new NotFoundException('Village not found');
      }

      const worldId = village.worldId;

      // Get current storage limit based on Warehouse level
      const warehouseLevel =
        getBuildingLevel(village.buildings, 'WAREHOUSE') || 1;
      const baseStorageLimit = this.worldConfig.getStorageLimit(
        worldId,
        warehouseLevel,
      );
      const storageStrategy = village.strategyConfig?.strategy;
      const currentStorageLimit = this.applyStrategyStorageBonus(
        storageStrategy ?? null,
        baseStorageLimit,
      );

      const now = new Date();
      const lastUpdate = village.resourceStock.lastUpdateTs;
      const elapsedMs = now.getTime() - lastUpdate.getTime();
      const elapsedMinutes = elapsedMs / MS_PER_MINUTE;

      const ratesPerMinute = await this.fetchBuildingRates(
        worldId,
        village.buildings,
        storageStrategy,
      );

      const updatedTotals = applyResourceCatchup(
        village.resourceStock,
        ratesPerMinute,
        elapsedMinutes,
        currentStorageLimit,
      );

      const updated = await tx.resourceStock.update({
        where: { villageId },
        data: {
          ...updatedTotals,
          maxPerType: currentStorageLimit,
          lastUpdateTs: now,
        },
      });

      return updated;
    });
  }

  /**
   * Calculate current resources with production catch-up (without DB update)
   * Used for combat to get real-time resources without persisting
   */
  async calculateCurrentResources(params: {
    worldId: string;
    resourceStock: {
      wood: number;
      stone: number;
      iron: number;
      maxPerType: number;
      lastUpdateTs: Date;
    };
    buildings: Array<{ type: string; level: number }>;
    strategy?: 'FORTRESS' | 'RAIDERS' | 'ECONOMIC' | 'BALANCED';
  }): Promise<{ wood: number; stone: number; iron: number }> {
    const { worldId, resourceStock, buildings, strategy } = params;

    const now = new Date();
    const elapsedMs = now.getTime() - resourceStock.lastUpdateTs.getTime();
    const elapsedMinutes = elapsedMs / MS_PER_MINUTE;

    const ratesPerMinute = await this.fetchBuildingRates(
      worldId,
      buildings,
      strategy,
    );

    return applyResourceCatchup(
      resourceStock,
      ratesPerMinute,
      elapsedMinutes,
      resourceStock.maxPerType,
    );
  }

  /**
   * Update storage limit when Warehouse is upgraded
   * Called by construction worker when Warehouse completes
   */
  async updateStorageLimit(villageId: string, warehouseLevel: number) {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: { strategyConfig: true },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const baseLimit = this.worldConfig.getStorageLimit(
      village.worldId,
      warehouseLevel,
    );
    const strategyType = village.strategyConfig?.strategy;
    const adjustedLimit = this.applyStrategyStorageBonus(
      strategyType ?? null,
      baseLimit,
    );

    return this.prisma.resourceStock.update({
      where: { villageId },
      data: { maxPerType: adjustedLimit },
    });
  }

  private applyStrategyStorageBonus(
    strategy: VillageStrategyType | null,
    baseLimit: number,
  ): number {
    if (!strategy) {
      return baseLimit;
    }

    const storageBonus = getStrategyBonusValue(strategy, 'storageBonus');

    if (!storageBonus || storageBonus === 1) {
      return baseLimit;
    }

    return Math.max(1, Math.floor(baseLimit * storageBonus));
  }

  private async fetchBuildingRates(
    worldId: string,
    buildings: Array<{ type: string; level: number }>,
    strategy?: VillageStrategyType,
  ): Promise<{ wood: number; stone: number; iron: number }> {
    const config = await this.worldConfig.getConfig(worldId);
    return projectResourceRates(buildings, (type, level) =>
      this.worldConfig.computeProductionRate(config, type, level, strategy),
    );
  }

  /**
   * Get production rates per hour for a village
   * Used by frontend for local interpolation
   */
  async getProductionRates(villageId: string): Promise<{
    wood: number;
    stone: number;
    iron: number;
  }> {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: { buildings: true, strategyConfig: true },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const worldId = village.worldId;

    const strategyType = village.strategyConfig?.strategy;

    const ratesPerMin = await this.fetchBuildingRates(
      worldId,
      village.buildings,
      strategyType,
    );

    return {
      wood: ratesPerMin.wood * 60,
      stone: ratesPerMin.stone * 60,
      iron: ratesPerMin.iron * 60,
    };
  }
}
