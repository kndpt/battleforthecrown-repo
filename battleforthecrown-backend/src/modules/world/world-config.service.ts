import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  WorldConfigSchema,
  TempoService,
  type WorldConfig,
} from '@battleforthecrown/shared/world';
import type { VillageStrategyType } from '@battleforthecrown/shared/village';
import { getQuarterPopulationLimit } from '@battleforthecrown/shared/village';
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
  REFERENCE_SPEED,
} from '@battleforthecrown/shared/logic';
import { MS_PER_SECOND } from '@battleforthecrown/shared/time';

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

    const cost = calculateBuildingCost(
      buildingType,
      level,
      castleLevel,
      1,
      strategy,
    );
    return {
      ...cost,
      time: Math.max(
        MS_PER_SECOND,
        Math.round(
          TempoService.applyDuration(
            cost.time,
            config.tempo,
            'constructionSpeed',
          ),
        ),
      ),
    };
  }

  async getProductionRate(
    worldId: string,
    type: ResourceBuildingType,
    level: number,
    strategy?: VillageStrategyType,
  ): Promise<number> {
    const config = await this.getConfig(worldId);
    return this.computeProductionRate(config, type, level, strategy);
  }

  computeProductionRate(
    config: WorldConfig,
    type: ResourceBuildingType,
    level: number,
    strategy?: VillageStrategyType,
  ): number {
    const absoluteRate = calculateProductionRate(type, level, 1, strategy);
    return TempoService.applyRate(
      absoluteRate,
      config.tempo,
      'resourceProduction',
    );
  }

  getStorageLimit(_worldId: string, warehouseLevel: number): number {
    const limits = getWarehouseStorageLimit(warehouseLevel);
    return limits.wood;
  }

  getPopulationLimit(_worldId: string, quarterLevel: number): number {
    return getQuarterPopulationLimit(quarterLevel);
  }

  createInitialPopulation(worldId: string, quarterLevel: number = 1) {
    const maxPop = this.getPopulationLimit(worldId, quarterLevel);
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

    // Pas d'armée : on utilise la vitesse de référence (1 minute / tuile au
    // multiplicateur monde près).
    const absoluteTravelTime = calculateTravelTime(
      distance,
      1,
      REFERENCE_SPEED,
      attackerStrategy,
    );
    return Math.round(
      TempoService.applyDuration(
        absoluteTravelTime,
        config.tempo,
        'travelSpeed',
      ),
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

    // Slowest = unité avec le `speed` le plus bas (échelle directe : haut = rapide).
    let slowestSpeed = findSlowestUnitSpeed(units, UNIT_CATALOG.stats);
    if (slowestSpeed === 0) slowestSpeed = REFERENCE_SPEED;

    const absoluteTravelTime = calculateTravelTime(
      distance,
      1,
      slowestSpeed,
      attackerStrategy,
    );
    return Math.round(
      TempoService.applyDuration(
        absoluteTravelTime,
        config.tempo,
        'travelSpeed',
      ),
    );
  }

  async getTravelTimeForSpeed(
    worldId: string,
    distance: number,
    speed: number,
  ): Promise<number> {
    const config = await this.getConfig(worldId);
    const absoluteTravelTime = calculateTravelTime(distance, 1, speed);
    return Math.round(
      TempoService.applyDuration(
        absoluteTravelTime,
        config.tempo,
        'travelSpeed',
      ),
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
