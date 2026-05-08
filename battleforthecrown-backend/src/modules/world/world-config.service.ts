import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  WorldConfigSchema,
  type WorldConfig,
} from '@battleforthecrown/shared/world';
import type { VillageStrategyType } from '@battleforthecrown/shared/village';
import { getFarmPopulationLimit } from '@battleforthecrown/shared/village';
import {
  ResourceBuildingType,
  getWarehouseStorageLimit,
} from '@battleforthecrown/shared/resources';
import { UNIT_CATALOG, type UnitMap } from '@battleforthecrown/shared/army';
import {
  calculateBuildingCost,
  calculateProductionRate,
  calculateTravelTime,
  findSlowestUnitSpeed,
} from '@battleforthecrown/shared/logic';

@Injectable()
export class WorldConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig(worldId: string): Promise<WorldConfig> {
    const world = await this.prisma.world.findUnique({
      where: { id: worldId },
    });

    if (!world) {
      throw new Error(`World ${worldId} not found`);
    }

    const parsed = WorldConfigSchema.safeParse(world.config);
    if (!parsed.success) {
      throw new InternalServerErrorException(
        `World ${worldId} has an invalid config: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  }

  // ===== Helper methods to replace constants =====

  async getCost(
    worldId: string,
    buildingType: string,
    level: number,
    castleLevel: number = 1,
    strategy?: VillageStrategyType,
  ) {
    const config = await this.getConfig(worldId);

    return calculateBuildingCost(
      buildingType,
      level,
      castleLevel,
      config.multipliers.construction,
      strategy,
    );
  }

  async getProductionRate(
    worldId: string,
    type: ResourceBuildingType,
    level: number,
    strategy?: VillageStrategyType,
  ): Promise<number> {
    const config = await this.getConfig(worldId);

    return calculateProductionRate(
      type,
      level,
      config.multipliers.production,
      strategy,
    );
  }

  getStorageLimit(_worldId: string, warehouseLevel: number): number {
    const limits = getWarehouseStorageLimit(warehouseLevel);
    return limits.wood;
  }

  getPopulationLimit(_worldId: string, farmLevel: number): number {
    return getFarmPopulationLimit(farmLevel);
  }

  createInitialPopulation(worldId: string, farmLevel: number = 1) {
    const maxPop = this.getPopulationLimit(worldId, farmLevel);
    return {
      used: 17, // Used by initial buildings
      max: maxPop,
    };
  }

  /**
   * Calculate travel time in milliseconds based on distance
   * @param worldId World ID
   * @param distance Distance in tiles (Euclidean)
   * @returns Time in milliseconds
   */
  async getTravelTime(
    worldId: string,
    distance: number,
    attackerStrategy?: VillageStrategyType,
  ): Promise<number> {
    const config = await this.getConfig(worldId);

    // Base speed is 1 minute per tile (inverse of speed)
    // But calculateTravelTime expects unit speed (minutes per tile)
    // Default "army" speed if no unit specified could be considered 1
    const defaultSpeed = 1;

    return calculateTravelTime(
      distance,
      config.multipliers.travel,
      defaultSpeed,
      attackerStrategy,
    );
  }

  /**
   * Calculate travel time based on the slowest unit in the army
   * @param worldId World ID
   * @param distance Distance in tiles (Euclidean)
   * @param units Units participating in the expedition
   * @returns Time in milliseconds
   */
  async getTravelTimeForArmy(
    worldId: string,
    distance: number,
    units: UnitMap,
    attackerStrategy?: VillageStrategyType,
  ): Promise<number> {
    const config = await this.getConfig(worldId);

    // Find the slowest unit (highest speed value = takes longest time)
    let slowestSpeed = findSlowestUnitSpeed(units, UNIT_CATALOG.stats);
    if (slowestSpeed === 0) slowestSpeed = 1;

    return calculateTravelTime(
      distance,
      config.multipliers.travel,
      slowestSpeed,
      attackerStrategy,
    );
  }

  /**
   * Get the loot factor (percentage of resources that can be looted)
   */
  async getLootFactor(worldId: string): Promise<number> {
    const config = await this.getConfig(worldId);
    return config.combat.lootFactor;
  }
}
