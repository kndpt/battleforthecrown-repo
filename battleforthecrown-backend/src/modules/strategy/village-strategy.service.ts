import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { CrownsService } from '../crowns/crowns.service';
import {
  VillageStrategy,
  VillageStrategyConfig as PrismaVillageStrategyConfig,
} from '@prisma/client';
import {
  BASE_VILLAGE_STRATEGY_BONUS,
  StrategyBonus,
  VillageStrategyType,
  getStrategyBonusValue,
  getVillageStrategyPlan,
} from '@battleforthecrown/shared/village';
import type { ResourceType } from '@battleforthecrown/shared/resources';
import { MS_PER_HOUR } from '@battleforthecrown/shared/time';

export interface StrategyChangeResult {
  success: boolean;
  newStrategy: VillageStrategyType;
  cost: number;
  cooldownEndsAt: Date;
  message: string;
}

export interface StrategyInfo {
  currentStrategy: VillageStrategyType;
  lastChangedAt: Date;
  cooldownEndsAt: Date | null;
  canChange: boolean;
  changeCost: number;
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
        world: true,
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

    const canChange = !cooldownEndsAt || now >= cooldownEndsAt;
    const changeCost = this.calculateChangeCost(village.strategyConfig);

    return {
      currentStrategy,
      lastChangedAt,
      cooldownEndsAt,
      canChange,
      changeCost,
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
        world: true,
        user: true,
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

    // Vérifier le cooldown
    const now = new Date();
    if (
      village.strategyConfig?.cooldownEndsAt &&
      now < village.strategyConfig.cooldownEndsAt
    ) {
      throw new ConflictException('Strategy change is on cooldown');
    }

    // Vérifier le coût en couronnes
    const changeCost = this.calculateChangeCost(village.strategyConfig);
    const crownBalance = await this.prisma.crownBalance.findUnique({
      where: {
        userId_worldId: {
          userId,
          worldId: village.worldId,
        },
      },
    });

    if (!crownBalance || crownBalance.balance < changeCost) {
      throw new BadRequestException('Insufficient crowns');
    }

    // Calculer le nouveau cooldown
    const cooldownEndsAt = new Date(
      now.getTime() + strategyConfig.cooldownDuration * MS_PER_HOUR,
    );

    return this.prisma.$transaction(async (tx) => {
      // Déduire les couronnes
      await tx.crownBalance.update({
        where: {
          userId_worldId: {
            userId,
            worldId: village.worldId,
          },
        },
        data: {
          balance: crownBalance.balance - changeCost,
          lastUpdateTs: now,
        },
      });

      // Notifier le HUD de la dépense — sinon stale jusqu'au prochain tick
      // crown-production avec production > 0 (cf. crowns.service.ts JSDoc).
      await this.crowns.createCrownsChangedEvent(userId, village.worldId, tx);

      // Mettre à jour ou créer la configuration de stratégie
      await tx.villageStrategyConfig.upsert({
        where: { villageId },
        update: {
          strategy: newStrategy as VillageStrategy,
          lastChangedAt: now,
          cooldownEndsAt,
          changeCost,
        },
        create: {
          villageId,
          strategy: newStrategy as VillageStrategy,
          lastChangedAt: now,
          cooldownEndsAt,
          changeCost,
        },
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

  private calculateChangeCost(
    strategyConfig: PrismaVillageStrategyConfig | null,
  ): number {
    const BASE_COST = 100; // Base cost from world config (can be overridden)
    const MAX_COST = 500; // Cap to prevent abuse
    const PENALTY_MULTIPLIER = 1.5; // +50% penalty if within 24h
    const PENALTY_WINDOW_HOURS = 24;

    // First change is free
    if (!strategyConfig) {
      return 0;
    }

    // Compute cost with penalty for repeated changes within cooldown window
    const hoursSinceLastChange =
      (Date.now() - strategyConfig.lastChangedAt.getTime()) / (1000 * 60 * 60);

    const baseCost = strategyConfig.changeCost || BASE_COST;
    const costWithPenalty =
      hoursSinceLastChange < PENALTY_WINDOW_HOURS
        ? Math.floor(baseCost * PENALTY_MULTIPLIER)
        : baseCost;

    // Apply cap to prevent abuse
    return Math.min(costWithPenalty, MAX_COST);
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
        recommendedBuildings: ['WOOD', 'STONE', 'IRON', 'FARM', 'WAREHOUSE'],
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
