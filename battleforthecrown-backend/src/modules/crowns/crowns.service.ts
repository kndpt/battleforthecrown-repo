import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { PrismaClientOrTx } from 'src/common/prisma.types';
import { getBuildingPowerWeight } from '@battleforthecrown/shared/power';
import { DEFAULT_CROWNS } from '@battleforthecrown/shared/crowns';
import { MS_PER_HOUR } from '@battleforthecrown/shared/time';
import { PRODUCTION_CATCHUP_THRESHOLD_MS } from '../resources/resources.constants';
import { createOutboxEvent } from '../event/event.utils';

@Injectable()
export class CrownsService {
  private readonly logger = new Logger(CrownsService.name);

  constructor(
    private prisma: PrismaService,
    private ownership: OwnershipService,
  ) {}

  /**
   * Calculate production rate based on total building power across all player villages
   */
  async calculateProductionRate(
    userId: string,
    worldId: string,
  ): Promise<number> {
    // Get all villages for this player in this world
    const villages = await this.prisma.village.findMany({
      where: { userId, worldId },
      include: { buildings: true },
    });

    // Calculate total building power
    let totalBuildingPower = 0;
    for (const village of villages) {
      for (const building of village.buildings) {
        const weight = getBuildingPowerWeight(building.type);
        totalBuildingPower += weight * building.level;
      }
    }

    // Get conversion rate from world config
    const conversionRate = DEFAULT_CROWNS.conversionRate;

    // Calculate crowns per hour
    return totalBuildingPower * conversionRate;
  }

  /**
   * Get crown balance for a player, with automatic catch-up
   */
  async getCrownBalance(userId: string, worldId: string) {
    await this.ownership.assertWorldMember(worldId, userId);

    // Check if crown system is enabled
    if (!DEFAULT_CROWNS.enabled) {
      throw new NotFoundException('Crown system is not enabled for this world');
    }

    // Get or create crown balance
    let crownBalance = await this.prisma.crownBalance.findUnique({
      where: {
        userId_worldId: { userId, worldId },
      },
    });

    if (!crownBalance) {
      // Create initial balance
      crownBalance = await this.prisma.crownBalance.create({
        data: {
          userId,
          worldId,
          balance: 0,
          lastUpdateTs: new Date(),
        },
      });
    } else {
      // Perform catch-up if needed
      const now = new Date();
      const elapsedMs = now.getTime() - crownBalance.lastUpdateTs.getTime();

      if (elapsedMs > PRODUCTION_CATCHUP_THRESHOLD_MS) {
        const updated = await this.updateProduction(userId, worldId, false);
        if (updated) {
          crownBalance = updated;
        }
      }
    }

    // Calculate production rate on-the-fly
    const productionRate = await this.calculateProductionRate(userId, worldId);

    return {
      userId: crownBalance.userId,
      worldId: crownBalance.worldId,
      balance: crownBalance.balance,
      productionRate,
      lastUpdateTs: crownBalance.lastUpdateTs,
    };
  }

  /**
   * Update production and accumulate crowns.
   *
   * Quand `createEvent=true`, l'event `crowns.changed` n'est émis que si
   * `production > 0`. C'est volontaire : ce helper est utilisé par le tick
   * périodique `CrownProductionWorker` (toutes les 5 min) où aucun changement
   * de rate ne peut survenir entre deux ticks. Tant que rate et balance ne
   * bougent pas, l'interpolation côté front (`projectCrowns`) suffit à
   * maintenir le HUD à jour — émettre N×N events « identiques » serait du
   * bruit WS.
   *
   * Asymétrie avec `recalculateOnBuildingChange` (qui émet toujours) :
   * ce dernier est un *event métier* — un building a changé, donc la rate
   * peut avoir bougé, le HUD doit refresh sa rate. Voir
   * `docs/architecture/realtime.md` § « Asymétrie volontaire avec
   * CrownProductionWorker ».
   *
   * Invariant à respecter ailleurs : toute autre source qui mute
   * `CrownBalance.balance` (dépenses, achats, récompenses) doit émettre son
   * propre `crowns.changed` — sinon le HUD restera stale jusqu'au prochain
   * tick avec `production > 0`.
   */
  async updateProduction(userId: string, worldId: string, createEvent = false) {
    return this.prisma.$transaction(async (tx) => {
      const crownBalance = await tx.crownBalance.findUnique({
        where: {
          userId_worldId: { userId, worldId },
        },
      });

      if (!crownBalance) {
        this.logger.warn(
          `No crown balance found for user ${userId} in world ${worldId}`,
        );
        return null;
      }

      // Calculate production rate on-the-fly
      const productionRate = await this.calculateProductionRate(
        userId,
        worldId,
      );

      const now = new Date();
      const elapsedMs = now.getTime() - crownBalance.lastUpdateTs.getTime();
      const elapsedHours = elapsedMs / MS_PER_HOUR;

      // Calculate production based on current rate
      const production = Math.floor(productionRate * elapsedHours);
      const newBalance = crownBalance.balance + production;

      // Update balance
      const updated = await tx.crownBalance.update({
        where: {
          userId_worldId: { userId, worldId },
        },
        data: {
          balance: newBalance,
          lastUpdateTs: now,
        },
      });

      // Create event if requested
      if (createEvent && production > 0) {
        await this.createCrownsChangedEvent(userId, worldId, tx);
      }

      return updated;
    });
  }

  /**
   * Recalculate production rate when a building changes
   * Called after construction completion
   */
  async recalculateOnBuildingChange(villageId: string) {
    // Get village info
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
    });

    if (!village || !village.userId) {
      this.logger.warn(`Village ${villageId} not found or has no owner`);
      return;
    }

    const { userId, worldId } = village;

    // Check if crown system is enabled
    if (!DEFAULT_CROWNS.enabled) {
      return;
    }

    return this.prisma.$transaction(async (tx) => {
      // Get or create crown balance
      let crownBalance = await tx.crownBalance.findUnique({
        where: {
          userId_worldId: { userId, worldId },
        },
      });

      const now = new Date();

      if (!crownBalance) {
        // Create initial balance if it doesn't exist
        crownBalance = await tx.crownBalance.create({
          data: {
            userId,
            worldId,
            balance: 0,
            lastUpdateTs: now,
          },
        });
      } else {
        // Catch up production with current rate
        const productionRate = await this.calculateProductionRate(
          userId,
          worldId,
        );

        const elapsedMs = now.getTime() - crownBalance.lastUpdateTs.getTime();
        const elapsedHours = elapsedMs / MS_PER_HOUR;
        const production = Math.floor(productionRate * elapsedHours);

        // Update with new balance (rate is calculated on-the-fly, no need to store)
        crownBalance = await tx.crownBalance.update({
          where: {
            userId_worldId: { userId, worldId },
          },
          data: {
            balance: crownBalance.balance + production,
            lastUpdateTs: now,
          },
        });
      }

      // Create event (always emit, even if balance was just created)
      await this.createCrownsChangedEvent(userId, worldId, tx);
    });
  }

  /**
   * Create event in EventOutbox for WebSocket dispatch
   */
  async createCrownsChangedEvent(
    userId: string,
    worldId: string,
    tx?: PrismaClientOrTx,
  ) {
    const prisma = tx || this.prisma;

    const crownBalance = await prisma.crownBalance.findUnique({
      where: {
        userId_worldId: { userId, worldId },
      },
    });

    if (!crownBalance) {
      this.logger.warn(`No crown balance found for event creation: ${userId}`);
      return;
    }

    // Calculate production rate on-the-fly for event payload
    const productionRate = await this.calculateProductionRate(userId, worldId);

    await createOutboxEvent(prisma, 'crowns.changed', userId, {
      userId,
      worldId,
      balance: crownBalance.balance,
      productionRate,
      lastUpdateTs: crownBalance.lastUpdateTs.toISOString(),
    });
  }
}
