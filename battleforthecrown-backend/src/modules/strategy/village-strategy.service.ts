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
import { Prisma, VillageStrategy } from '@prisma/client';
import {
  BUILDING_TYPES,
  StrategyBonus,
  VillageStrategyChangeCost,
  VillageStrategyType,
  getBuildingLevel,
  getVillageStrategyChangeCost,
  getStrategyBonusValue,
  getVillageStrategyPlan,
} from '@battleforthecrown/shared/village';
import {
  StrategyBonusContext,
  projectStrategyBonusForContext,
} from './strategy-bonus-projection';
import { projectResourceRates } from '../resources/resource-rate-projection';
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
    const castleLevel = getBuildingLevel(
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
    // Cheap early-out on already-loaded data. NOT the authoritative guard:
    // two concurrent requests can both read a passed cooldown here before
    // either commits. The atomic guard inside the transaction below is what
    // actually serializes them.
    if (
      village.strategyConfig?.cooldownEndsAt &&
      now < village.strategyConfig.cooldownEndsAt
    ) {
      throw new ConflictException('Strategy change is on cooldown');
    }

    if (!village.resourceStock) {
      throw new NotFoundException('Village resources not found');
    }

    const castleLevel = getBuildingLevel(
      village.buildings,
      BUILDING_TYPES.CASTLE,
    );
    const changeCost = getVillageStrategyChangeCost(newStrategy, castleLevel);

    // Calculer le nouveau cooldown
    const cooldownEndsAt = new Date(
      now.getTime() + strategyConfig.cooldownDuration * MS_PER_HOUR,
    );

    return this.prisma.$transaction(async (tx) => {
      // ── Cooldown guard (atomic, fail-fast) ────────────────────────────────
      // Fold the cooldown check into a conditional UPDATE so Postgres evaluates
      // it at row-lock time. Without this, two requests that both passed the
      // pre-tx read above would both debit and both apply a change (last upsert
      // wins) — double-charging the user. The losing request matches 0 rows
      // here and aborts the whole transaction, rolling back its debits.
      const configUpdate = await tx.villageStrategyConfig.updateMany({
        where: {
          villageId,
          OR: [{ cooldownEndsAt: null }, { cooldownEndsAt: { lte: now } }],
        },
        data: {
          strategy: newStrategy,
          lastChangedAt: now,
          cooldownEndsAt,
          changeCost: changeCost.crowns,
        },
      });
      if (configUpdate.count === 0) {
        // 0 rows ⇒ the config row either doesn't exist yet (first-ever change)
        // or its cooldown is still active. One read disambiguates.
        const existing = await tx.villageStrategyConfig.findUnique({
          where: { villageId },
          select: { id: true },
        });
        if (existing) {
          throw new ConflictException('Strategy change is on cooldown');
        }
        // First change for this village: no prior cooldown to guard against.
        // The @unique(villageId) constraint serializes concurrent first creates;
        // the loser's P2002 surfaces as a cooldown conflict.
        try {
          await tx.villageStrategyConfig.create({
            data: {
              villageId,
              strategy: newStrategy,
              lastChangedAt: now,
              cooldownEndsAt,
              changeCost: changeCost.crowns,
            },
          });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === 'P2002'
          ) {
            throw new ConflictException('Strategy change is on cooldown');
          }
          throw e;
        }
      }

      // ── Crown debit (atomic check + decrement) ────────────────────────────
      // The sufficiency check is folded into the UPDATE predicate so check and
      // decrement are a single atomic statement evaluated at row-lock time. A
      // separate pre-tx read + in-tx update pair races under READ COMMITTED:
      // two concurrent requests both read a sufficient balance, both pass the
      // guard, and the second decrement goes negative. With WHERE … >= cost the
      // second request simply matches 0 rows.
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

      // Same atomic pattern for resources: decrement only if all three
      // balances are still sufficient at lock time.
      const stockDebitResult = await tx.resourceStock.updateMany({
        where: {
          villageId,
          wood: { gte: changeCost.wood },
          stone: { gte: changeCost.stone },
          iron: { gte: changeCost.iron },
        },
        data: {
          wood: { decrement: changeCost.wood },
          stone: { decrement: changeCost.stone },
          iron: { decrement: changeCost.iron },
          lastUpdateTs: now,
        },
      });
      if (stockDebitResult.count === 0) {
        throw new BadRequestException('Insufficient resources');
      }

      // Separate update for maxPerType (not a guard — always applied once the
      // decrement succeeded) and to fetch the final values for the outbox event.
      // The strategy/cooldown row was already written by the atomic guard above.
      const updatedStock = await tx.resourceStock.update({
        where: { villageId },
        data: {
          maxPerType: this.getStorageLimitForStrategy(village, newStrategy),
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
    context: StrategyBonusContext,
  ): Promise<StrategyBonus | null> {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      select: { strategyConfig: { select: { strategy: true } } },
    });

    const strategy = village?.strategyConfig?.strategy;
    if (!strategy) {
      return null;
    }

    return projectStrategyBonusForContext(strategy, context);
  }

  private calculateChangeCosts(castleLevel: number) {
    return {
      FORTRESS: getVillageStrategyChangeCost('FORTRESS', castleLevel),
      RAIDERS: getVillageStrategyChangeCost('RAIDERS', castleLevel),
      ECONOMIC: getVillageStrategyChangeCost('ECONOMIC', castleLevel),
      BALANCED: getVillageStrategyChangeCost('BALANCED', castleLevel),
    };
  }

  private hasCouncilHall(buildings: Array<{ type: string; level: number }>) {
    return getBuildingLevel(buildings, BUILDING_TYPES.COUNCIL_HALL) >= 1;
  }

  private getStorageLimitForStrategy(
    village: {
      worldId: string;
      buildings: Array<{ type: string; level: number }>;
    },
    strategy: VillageStrategyType,
  ): number {
    const warehouseLevel = getBuildingLevel(
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
    const config = await this.worldConfig.getConfig(village.worldId);
    const ratesPerMin = projectResourceRates(village.buildings, (type, level) =>
      this.worldConfig.computeProductionRate(config, type, level, strategy),
    );
    return {
      wood: ratesPerMin.wood * 60,
      stone: ratesPerMin.stone * 60,
      iron: ratesPerMin.iron * 60,
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
