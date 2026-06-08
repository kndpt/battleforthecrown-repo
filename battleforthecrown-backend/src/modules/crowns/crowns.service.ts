import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import type { CrownBalance } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OwnershipService } from '../../common/auth';
import { PrismaClientOrTx } from 'src/common/prisma.types';
import { getBuildingPowerWeight } from '@battleforthecrown/shared/power';
import { DEFAULT_CROWNS } from '@battleforthecrown/shared/crowns';
import { MS_PER_HOUR } from '@battleforthecrown/shared/time';
import { TempoService } from '@battleforthecrown/shared/world';
import { PRODUCTION_CATCHUP_THRESHOLD_MS } from '../resources/resources.constants';
import { createOutboxEvent } from '../event/event.utils';
import { WorldConfigService } from '../world/world-config.service';

@Injectable()
export class CrownsService {
  private readonly logger = new Logger(CrownsService.name);

  constructor(
    private prisma: PrismaService,
    private ownership: OwnershipService,
    private worldConfig: WorldConfigService,
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

    const config = await this.worldConfig.getConfig(worldId);
    return TempoService.applyRate(
      totalBuildingPower * conversionRate,
      config.tempo,
      'crownsYield',
    );
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
      // upsert handles concurrent requests for the same new user
      crownBalance = await this.prisma.crownBalance.upsert({
        where: { userId_worldId: { userId, worldId } },
        create: { userId, worldId, balance: 0, lastUpdateTs: new Date() },
        update: {},
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
  async updateProduction(
    userId: string,
    worldId: string,
    createEvent = false,
  ): Promise<CrownBalance | null> {
    return this.prisma.$transaction(async (tx) => {
      const crownBalance = await this.lockCrownBalance(tx, userId, worldId);

      if (!crownBalance) {
        this.logger.warn(
          `No crown balance found for user ${userId} in world ${worldId}`,
        );
        return null;
      }

      const { updated, production } = await this.accumulateCrowns(
        tx,
        userId,
        worldId,
        crownBalance,
      );

      if (createEvent && production > 0) {
        // No pre-computed rate: let createCrownsChangedEvent re-read so it
        // emits the current rate even if a building completed mid-tick.
        await this.createCrownsChangedEvent(userId, worldId, tx);
      }

      return updated;
    });
  }

  /**
   * Recalculate production rate when a building changes.
   * Called after construction completion.
   */
  async recalculateOnBuildingChange(villageId: string): Promise<void> {
    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
    });

    if (!village || !village.userId) {
      this.logger.warn(`Village ${villageId} not found or has no owner`);
      return;
    }

    const { userId, worldId } = village;

    if (!DEFAULT_CROWNS.enabled) {
      return;
    }

    return this.prisma.$transaction(async (tx) => {
      const crownBalance = await this.lockCrownBalance(tx, userId, worldId);

      const now = new Date();

      if (!crownBalance) {
        // upsert handles concurrent creation from parallel PgBoss workers
        await tx.crownBalance.upsert({
          where: { userId_worldId: { userId, worldId } },
          create: { userId, worldId, balance: 0, lastUpdateTs: now },
          update: {},
        });
      } else {
        await this.accumulateCrowns(tx, userId, worldId, crownBalance, now);
      }

      await this.createCrownsChangedEvent(userId, worldId, tx);
    });
  }

  /**
   * Create event in EventOutbox for WebSocket dispatch.
   * Always re-reads production rate so concurrent building completions
   * are reflected in the emitted event.
   */
  async createCrownsChangedEvent(
    userId: string,
    worldId: string,
    tx?: PrismaClientOrTx,
  ): Promise<void> {
    const prisma = tx || this.prisma;

    const crownBalance = await prisma.crownBalance.findUnique({
      where: { userId_worldId: { userId, worldId } },
    });

    if (!crownBalance) {
      this.logger.warn(`No crown balance found for event creation: ${userId}`);
      return;
    }

    const rate = await this.calculateProductionRate(userId, worldId);

    await createOutboxEvent(prisma, 'crowns.changed', userId, {
      userId,
      worldId,
      balance: crownBalance.balance,
      productionRate: rate,
      lastUpdateTs: crownBalance.lastUpdateTs.toISOString(),
    });
  }

  /**
   * Acquires a row-level lock (SELECT FOR UPDATE) on the crown balance row so
   * that concurrent PgBoss workers for the same user serialize their
   * accumulation and don't compute production from the same stale lastUpdateTs.
   * Must be called inside a prisma.$transaction.
   */
  private async lockCrownBalance(
    tx: PrismaClientOrTx,
    userId: string,
    worldId: string,
  ): Promise<{ balance: number; lastUpdateTs: Date } | null> {
    const rows = await tx.$queryRaw<
      Array<{ balance: number; lastUpdateTs: Date }>
    >`
      SELECT balance, last_update_ts AS "lastUpdateTs"
      FROM crown_balance
      WHERE user_id = ${userId} AND world_id = ${worldId}
      FOR UPDATE
    `;
    return rows[0] ?? null;
  }

  /**
   * Computes elapsed production and updates `crownBalance` in a single DB
   * write. Returns the production amount, the rate, and the updated record so
   * callers avoid a second `calculateProductionRate` call when they also need
   * to emit a `crowns.changed` event.
   */
  private async accumulateCrowns(
    tx: PrismaClientOrTx,
    userId: string,
    worldId: string,
    crownBalance: { balance: number; lastUpdateTs: Date },
    now = new Date(),
  ): Promise<{
    production: number;
    productionRate: number;
    updated: CrownBalance;
  }> {
    const productionRate = await this.calculateProductionRate(userId, worldId);
    const elapsedMs = Math.max(
      0,
      now.getTime() - crownBalance.lastUpdateTs.getTime(),
    );
    const elapsedHours = elapsedMs / MS_PER_HOUR;
    const production = Math.floor(productionRate * elapsedHours);

    const updated = await tx.crownBalance.update({
      where: { userId_worldId: { userId, worldId } },
      data: { balance: { increment: production }, lastUpdateTs: now },
    });

    return { production, productionRate, updated };
  }
}
