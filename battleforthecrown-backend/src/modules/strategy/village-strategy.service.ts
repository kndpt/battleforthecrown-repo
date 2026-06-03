import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { CrownsService } from '../crowns/crowns.service';
import { WorldConfigService } from '../world/world-config.service';
import { createOutboxEvent } from '../event/event.utils';
import { VillageStrategy } from '@prisma/client';
import {
  BASE_VILLAGE_STRATEGY_BONUS,
  BUILDING_TYPES,
  StrategyBonus,
  VillageStrategyChangeCost,
  VillageStrategyType,
  getVillageStrategyChangeCost,
  getStrategyBonusValue,
  getVillageStrategyPlan,
} from '@battleforthecrown/shared/village';
import { MS_PER_HOUR } from '@battleforthecrown/shared/time';

export interface StrategyChangeResult {
  success: boolean;
  newStrategy: VillageStrategyType;
  cost: VillageStrategyChangeCost;
  cooldownEndsAt: Date;
  message: string;
}

export interface StrategyInfo {
  currentStrategy: VillageStrategyType;
  lastChangedAt: Date;
  cooldownEndsAt: Date | null;
  canChange: boolean;
  changeCost: number;
  changeCosts: Record<VillageStrategyType, VillageStrategyChangeCost>;
  hasCouncilHall: boolean;
  strategies: Record<
    VillageStrategyType,
    {
      displayName: string;
      description: string;
      bonuses: StrategyBonus;
    }
  >;
}

@Injectable()
export class VillageStrategyService {
  constructor(
    private prisma: PrismaService,
    private ownership: OwnershipService,
    private crowns: CrownsService,
    private worldConfig: WorldConfigService,
  ) {}

  async getStrategyInfo(
    villageId: string,
    userId: string,
  ): Promise<StrategyInfo> {
    await this.ownership.assertVillageOwnedBy(villageId, userId);
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: {
        strategyConfig: true,
        buildings: true,
      },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const strategyConfig = getVillageStrategyPlan();

    if (!strategyConfig) {
      throw new NotFoundException('Village strategy configuration not found');
    }

    const currentStrategy =
      village.strategyConfig?.strategy || VillageStrategy.BALANCED;
    const lastChangedAt = village.strategyConfig?.lastChangedAt || new Date();
    const cooldownEndsAt = village.strategyConfig?.cooldownEndsAt || null;
    const now = new Date();
    const castleLevel = this.getBuildingLevel(
      village.buildings,
      BUILDING_TYPES.CASTLE,
    );
    const hasCouncilHall = this.hasCouncilHall(village.buildings);

    const canChange = !cooldownEndsAt || now >= cooldownEndsAt;
    const changeCosts = this.calculateChangeCosts(castleLevel);
    const changeCost = changeCosts[currentStrategy].crowns;

    return {
      currentStrategy,
      lastChangedAt,
      cooldownEndsAt,
      canChange,
      changeCost,
      changeCosts,
      hasCouncilHall,
      strategies: strategyConfig.strategies,
    };
  }

  async changeStrategy(
    villageId: string,
    newStrategy: VillageStrategyType,
    userId: string,
  ): Promise<StrategyChangeResult> {
    await this.ownership.assertVillageOwnedBy(villageId, userId);

    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      include: {
        strategyConfig: true,
        resourceStock: true,
        buildings: true,
      },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const strategyConfig = getVillageStrategyPlan();

    if (!strategyConfig) {
      throw new NotFoundException('Village strategy configuration not found');
    }

    // Vérifier que la stratégie demandée est valide
    if (!strategyConfig.strategies[newStrategy]) {
      throw new BadRequestException(`Invalid strategy: ${newStrategy}`);
    }

    if (village.isBarbarian) {
      throw new BadRequestException('Barbarian villages cannot use strategies');
    }

    const currentStrategy =
      village.strategyConfig?.strategy || VillageStrategy.BALANCED;
    if (currentStrategy === newStrategy) {
      throw new BadRequestException('Village already uses this strategy');
    }

    if (!this.hasCouncilHall(village.buildings)) {
      throw new BadRequestException(
        'Council Hall is required to change strategy',
      );
    }

    const now = new Date();
    if (
      village.strategyConfig?.cooldownEndsAt &&
      now < village.strategyConfig.cooldownEndsAt
    ) {
      throw new ConflictException('Strategy change is on cooldown');
    }

    if (!village.resourceStock) {
      throw new NotFoundException('Village resources not found');
    }

    const castleLevel = this.getBuildingLevel(
      village.buildings,
      BUILDING_TYPES.CASTLE,
    );
    const changeCost = getVillageStrategyChangeCost(newStrategy, castleLevel);

    if (
      village.resourceStock.wood < changeCost.wood ||
      village.resourceStock.stone < changeCost.stone ||
      village.resourceStock.iron < changeCost.iron
    ) {
      throw new BadRequestException('Insufficient resources');
    }

    // Calculer le nouveau cooldown
    const cooldownEndsAt = new Date(
      now.getTime() + strategyConfig.cooldownDuration * MS_PER_HOUR,
    );

    return this.prisma.$transaction(async (tx) => {
      // Fold the balance sufficiency check into the UPDATE predicate so the
      // check and the decrement are a single atomic Postgres statement.
      // With READ COMMITTED isolation a separate findUnique + update pair
      // still races: T2 can read a sufficient balance before T1 commits its
      // debit, pass the guard, then decrement from T1's already-decremented
      // value and go negative.  The updateMany WHERE balance >= cost pattern
      // is evaluated by Postgres at the moment it acquires the row lock, so
      // T2's update will simply match 0 rows after T1 commits.
      const debitResult = await tx.crownBalance.updateMany({
        where: {
          userId,
          worldId: village.worldId,
          balance: { gte: changeCost.crowns },
        },
        data: {
          balance: { decrement: changeCost.crowns },
          lastUpdateTs: now,
        },
      });
      if (debitResult.count === 0) {
        throw new BadRequestException('Insufficient crowns');
      }

      // Notifier le HUD de la dépense — sinon stale jusqu'au prochain tick
      // crown-production avec production > 0 (cf. crowns.service.ts JSDoc).
      await this.crowns.createCrownsChangedEvent(userId, village.worldId, tx);

      const updatedStock = await tx.resourceStock.update({
        where: { villageId },
        data: {
          wood: { decrement: changeCost.wood },
          stone: { decrement: changeCost.stone },
          iron: { decrement: changeCost.iron },
          maxPerType: this.getStorageLimitForStrategy(village, newStrategy),
          lastUpdateTs: now,
        },
      });

      await tx.villageStrategyConfig.upsert({
        where: { villageId },
        update: {
          strategy: newStrategy as VillageStrategy,
          lastChangedAt: now,
          cooldownEndsAt,
          changeCost: changeCost.crowns,
        },
        create: {
          villageId,
          strategy: newStrategy as VillageStrategy,
          lastChangedAt: now,
          cooldownEndsAt,
          changeCost: changeCost.crowns,
        },
      });

      await createOutboxEvent(tx, 'resources.changed', villageId, {
        villageId,
        wood: updatedStock.wood,
        stone: updatedStock.stone,
        iron: updatedStock.iron,
        maxPerType: updatedStock.maxPerType,
        lastUpdateTs: updatedStock.lastUpdateTs.toISOString(),
        productionRates: await this.getProductionRatesForStrategy(
          village,
          newStrategy,
        ),
      });

      return {
        success: true,
        newStrategy,
        cost: changeCost,
        cooldownEndsAt,
        message: `Strategy changed to ${strategyConfig.strategies[newStrategy].displayName}`,
      };
    });
  }

  async getStrategyBonus(
    villageId: string,
    context:
      | 'combat'
      | 'production'
      | 'construction'
      | 'training'
      | 'storage'
      | 'population',
  ): Promise<StrategyBonus | null> {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      select: { strategyConfig: { select: { strategy: true } } },
    });

    const strategy = village?.strategyConfig?.strategy as
      | VillageStrategyType
      | undefined;
    if (!strategy) {
      return null;
    }

    switch (context) {
      case 'combat':
        return {
          ...BASE_VILLAGE_STRATEGY_BONUS,
          attackBonus: getStrategyBonusValue(strategy, 'attackBonus'),
          defenseBonus: getStrategyBonusValue(strategy, 'defenseBonus'),
          lootBonus: getStrategyBonusValue(strategy, 'lootBonus'),
        };
      case 'training':
        return {
          ...BASE_VILLAGE_STRATEGY_BONUS,
          trainingSpeedBonus: getStrategyBonusValue(
            strategy,
            'trainingSpeedBonus',
          ),
          unitCostReduction: getStrategyBonusValue(
            strategy,
            'unitCostReduction',
          ),
        };
      case 'production':
        return {
          ...BASE_VILLAGE_STRATEGY_BONUS,
          productionBonus: getStrategyBonusValue(strategy, 'productionBonus'),
        };
      case 'construction':
        return {
          ...BASE_VILLAGE_STRATEGY_BONUS,
          constructionSpeedBonus: getStrategyBonusValue(
            strategy,
            'constructionSpeedBonus',
          ),
        };
      case 'storage':
        return {
          ...BASE_VILLAGE_STRATEGY_BONUS,
          storageBonus: getStrategyBonusValue(strategy, 'storageBonus'),
        };
      case 'population':
        return {
          ...BASE_VILLAGE_STRATEGY_BONUS,
          populationBonus: getStrategyBonusValue(strategy, 'populationBonus'),
        };
    }
  }

  private calculateChangeCosts(castleLevel: number) {
    return {
      FORTRESS: getVillageStrategyChangeCost('FORTRESS', castleLevel),
      RAIDERS: getVillageStrategyChangeCost('RAIDERS', castleLevel),
      ECONOMIC: getVillageStrategyChangeCost('ECONOMIC', castleLevel),
      BALANCED: getVillageStrategyChangeCost('BALANCED', castleLevel),
    };
  }

  private getBuildingLevel(
    buildings: Array<{ type: string; level: number }>,
    buildingType: string,
  ): number {
    return buildings.find((b) => b.type === buildingType)?.level ?? 0;
  }

  private hasCouncilHall(buildings: Array<{ type: string; level: number }>) {
    return this.getBuildingLevel(buildings, BUILDING_TYPES.COUNCIL_HALL) >= 1;
  }

  private getStorageLimitForStrategy(
    village: {
      worldId: string;
      buildings: Array<{ type: string; level: number }>;
    },
    strategy: VillageStrategyType,
  ): number {
    const warehouseLevel = this.getBuildingLevel(
      village.buildings,
      BUILDING_TYPES.WAREHOUSE,
    );
    const baseLimit = this.worldConfig.getStorageLimit(
      village.worldId,
      warehouseLevel || 1,
    );
    return Math.floor(
      baseLimit * getStrategyBonusValue(strategy, 'storageBonus'),
    );
  }

  private async getProductionRatesForStrategy(
    village: {
      worldId: string;
      buildings: Array<{ type: string; level: number }>;
    },
    strategy: VillageStrategyType,
  ) {
    const woodLevel = this.getBuildingLevel(
      village.buildings,
      BUILDING_TYPES.WOOD,
    );
    const stoneLevel = this.getBuildingLevel(
      village.buildings,
      BUILDING_TYPES.STONE,
    );
    const ironLevel = this.getBuildingLevel(
      village.buildings,
      BUILDING_TYPES.IRON,
    );

    return {
      wood: woodLevel
        ? (await this.worldConfig.getProductionRate(
            village.worldId,
            'WOOD',
            woodLevel,
            strategy,
          )) * 60
        : 0,
      stone: stoneLevel
        ? (await this.worldConfig.getProductionRate(
            village.worldId,
            'STONE',
            stoneLevel,
            strategy,
          )) * 60
        : 0,
      iron: ironLevel
        ? (await this.worldConfig.getProductionRate(
            village.worldId,
            'IRON',
            ironLevel,
            strategy,
          )) * 60
        : 0,
    };
  }

  async getStrategyRecommendations(villageId: string, userId: string) {
    await this.ownership.assertVillageOwnedBy(villageId, userId);

    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
    });

    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const strategyConfig = getVillageStrategyPlan();

    if (!strategyConfig) {
      throw new NotFoundException('Village strategy configuration not found');
    }

    // Define recommended buildings for each strategy
    const recommendations: Record<
      string,
      {
        displayName: string;
        description: string;
        recommendedBuildings: string[];
        keyBonuses: Record<string, string>;
      }
    > = {
      FORTRESS: {
        displayName: strategyConfig.strategies.FORTRESS.displayName,
        description: strategyConfig.strategies.FORTRESS.description,
        recommendedBuildings: ['WALL', 'WATCHTOWER', 'BARRACKS', 'WAREHOUSE'],
        keyBonuses: {
          "Vitesse d'armée": '-20%',
        },
      },
      RAIDERS: {
        displayName: strategyConfig.strategies.RAIDERS.displayName,
        description: strategyConfig.strategies.RAIDERS.description,
        recommendedBuildings: ['BARRACKS', 'WOOD', 'CASTLE'],
        keyBonuses: {
          "Vitesse d'armée": '+15%',
          'Bonus de pillage': '+10%',
          'Malus de défense': '-10%',
        },
      },
      ECONOMIC: {
        displayName: strategyConfig.strategies.ECONOMIC.displayName,
        description: strategyConfig.strategies.ECONOMIC.description,
        recommendedBuildings: ['WOOD', 'STONE', 'IRON', 'QUARTER', 'WAREHOUSE'],
        keyBonuses: {
          'Production Bonus': '+20% (all resources)',
          'Population Bonus': '+10%',
          'Attack Penalty': '-10%',
          'Defense Penalty': '-10%',
        },
      },
      BALANCED: {
        displayName: strategyConfig.strategies.BALANCED.displayName,
        description: strategyConfig.strategies.BALANCED.description,
        recommendedBuildings: ['All buildings equally'],
        keyBonuses: {
          Flexibility: 'No penalties or bonuses',
          Adaptation: 'Switch to specialized strategies later',
        },
      },
    };

    return recommendations;
  }
}
